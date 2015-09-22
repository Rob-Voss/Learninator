(function (global) {
    "use strict";

    /**
     * Initialize the Agent
     *
     * @param {Vec} position
     * @param {Object} env
     * @param {Object} opts
     * @returns {Agent}
     */
    var Agent = function (position, env, opts) {
        Entity.call(this, 3, position, env, opts);

        this.brainType = opts.brainType;

        // The number of item types the Agent's eyes can see
        this.numTypes = typeof opts.numTypes === 'number' ? opts.numTypes : 3;
        // The number of Agent's eyes
        this.numEyes = typeof opts.numEyes === 'number' ? opts.numEyes :  9;
        // The number of Agent's eyes, each one sees the number of knownTypes
        this.numStates = this.numEyes * this.numTypes;

        // The Agent's eyes
        this.eyes = [];
        for (var k = 0; k < this.numEyes; k++) {
            this.eyes.push(new Eye(k * 0.21, opts.range, opts.proximity));
        }

        this.action = null;
        this.lastReward = 0;
        this.digestionSignal = 0.0;
        this.rewardBonus = 0.0;
        this.previousActionIdx = -1;
        this.epsilon = 0.000;

        this.pts = [];
        this.direction = 'N';
        this.brain = {};
        this.world = {};

        // Set up the environment variable for RL
        this.env = {
            numActions: this.numActions,
            numStates: this.numStates
        };

        this.env.getMaxNumActions = function () {
            return this.numActions;
        };

        this.env.getNumStates = function () {
            return this.numStates;
        };

        var _this = this;

        return this;
    };

    Agent.prototype = Object.create(Entity.prototype);
    Agent.prototype.constructor = Entity;

    /**
     * Find nearby entities to nom on
     * @returns {Agent}
     */
    Agent.prototype.eat = function () {
        this.digestionSignal = 0;
        for (let j = 0; j < this.world.entities.length; j++) {
            let entity = this.world.entities[j],
                dist = this.position.distFrom(entity.position);
            if (dist < entity.radius + this.radius) {
                var result = Utility.collisionCheck(this.position, entity.position, this.world.walls, this.world.entities);
                if (!result) {
                    this.digestionSignal += (entity.type === 1) ? this.carrot : this.stick;
                    this.world.deleteEntity(entity);
                }
            }
        }

        return this;
    };

    /**
     * Load a pre-trained agent
     * @param {String} file
     */
    Agent.prototype.load = function (file) {
        var _this = this;
        $.getJSON(file, function(data) {
            if (!_this.worker) {
                _this.brain.fromJSON(data);
                _this.brain.epsilon = 0.05;
                _this.brain.alpha = 0;
            } else {
                _this.post('load', JSON.stringify(data));
            }
        });

        return this;
    };

    /**
     * Tick the agent
     * @param {Object} world
     */
    Agent.prototype.tick = function (world) {
        this.world = world;
        this.start = new Date().getTime();

        // Let the agents behave in the world based on their input
        this.act();

        // If it's not a worker we need to run the rest of the steps
        if (!this.worker) {
            // Move eet!
            this.move();
            // Find nearby entities to nom
            this.eat();
            // This is where the agents learns based on the feedback of their actions on the environment
            this.learn();
        }

        if (this.cheats) {
            var child;
            // If cheats are on then show the entities grid location and x,y coords
            if (this.cheats.gridLocation === true) {
                if (this.useSprite === true) {
                    child = this.sprite.getChildAt(0);
                } else {
                    child = this.shape.getChildAt(0);
                }
                child.text = this.gridLocation.x + ':' + this.gridLocation.y;
                child.position.set(this.position.x + this.radius, this.position.y + (this.radius));
            }

            if (this.cheats.position === true) {
                if (this.useSprite === true) {
                    child = this.sprite.getChildAt(1);
                } else {
                    child = this.shape.getChildAt(1);
                }
                child.text = this.position.x + ':' + this.position.y;
                child.position.set(this.position.x + this.radius, this.position.y + (this.radius * 1));
            }

            if (this.cheats.name === true) {
                if (this.useSprite === true) {
                    child = this.sprite.getChildAt(2);
                } else {
                    child = this.shape.getChildAt(2);
                }
                child.position.set(this.position.x + this.radius, this.position.y + (this.radius * 2));
            }
        }

        return this;
    };

    /**
     * Agent's chance to move in the world
     * @param smallWorld
     */
    Agent.prototype.move = function () {
        this.oldPos = this.position.clone();
        var oldAngle = this.angle;
        this.oldAngle = oldAngle;

        // Steer the agent according to outputs of wheel velocities
        var v = new Vec(0, this.radius / 2.0);
        v = v.rotate(this.angle + Math.PI / 2);
        var w1pos = this.position.add(v), // Positions of wheel 1
            w2pos = this.position.sub(v); // Positions of wheel 2
        var vv = this.position.sub(w2pos);
        vv = vv.rotate(-this.rot1);
        var vv2 = this.position.sub(w1pos);
        vv2 = vv2.rotate(this.rot2);
        var newPos = w2pos.add(vv),
            newPos2 = w1pos.add(vv2);

        newPos.scale(0.5);
        newPos2.scale(0.5);

        this.position = newPos.add(newPos2);

        this.angle -= this.rot1;
        if (this.angle < 0) {
            this.angle += 2 * Math.PI;
        }

        this.angle += this.rot2;
        if (this.angle > 2 * Math.PI) {
            this.angle -= 2 * Math.PI;
        }

        if (this.collision) {
            // The agent is trying to move from pos to oPos so we need to check walls
            var result = Utility.collisionCheck(this.oldPos, this.position, this.world.walls, []);
            if (result) {
                // The agent derped! Wall collision! Reset their position
                this.position = this.oldPos;
            }
        }

        // Handle boundary conditions.. bounce agent
        if (this.position.x < 2) {
            this.position.x = 2;
        }
        if (this.position.x > this.world.width) {
            this.position.x = this.world.width;
        }
        if (this.position.y < 2) {
            this.position.y = 2;
        }
        if (this.position.y > this.world.height) {
            this.position.y = this.world.height;
        }

        this.direction = Utility.getDirection(this.angle);

        if (this.useSprite) {
            this.sprite.position.set(this.position.x, this.position.y);
            this.sprite.rotation = -this.angle;
        }

        return this;
    };

    global.Agent = Agent;

}(this));

