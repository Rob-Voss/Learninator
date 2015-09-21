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
        this.numTypes = typeof(opts.numTypes) === 'number' ? opts.numTypes : 3;
        // The number of Agent's eyes
        this.numEyes = typeof(opts.numEyes) === 'number' ? opts.numEyes :  9;
        // The number of Agent's eyes, each one sees the number of knownTypes
        this.numInputs = this.numEyes * this.numTypes;

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
        this.pts = [];
        this.digested = [];
        this.direction = 'N';
        this.brain = {};

        var _this = this;
        return this;
    };

    Agent.prototype = Object.create(Entity.prototype);
    Agent.prototype.constructor = Entity;

    /**
     * Load a pre-trained agent
     * @param file
     */
    Agent.prototype.load = function (file) {
        var _Brain = this.brain;
        Utility.loadJSON(file, function (data) {
            _Brain.fromJSON(JSON.parse(data));
            _Brain.epsilon = 0.05;
            _Brain.alpha = 0;
        });

        return this;
    };

    /**
     * Tick the agent
     * @param {Object} smallWorld
     */
    Agent.prototype.tick = function (smallWorld) {
        // Check for food
        // Gather up all the entities nearby based on cell population
        this.digested = [];

        // Loop through the eyes and check the walls and nearby entities
        for (var e = 0; e < this.numEyes; e++) {
            this.eyes[e].sense(this.position, this.angle, smallWorld.walls, smallWorld.entities);
        }

        // Let the agents behave in the world based on their input
        this.forward();

        this.move(smallWorld);

        for (let j = 0; j < smallWorld.entities.length; j++) {
            let entity = smallWorld.entities[j],
                dist = this.position.distFrom(entity.position);
            if (dist < entity.radius + this.radius) {
                var result = Utility.collisionCheck(this.position, entity.position, smallWorld.walls, smallWorld.entities);
                if (!result) {
                    this.digestionSignal += (entity.type === 1) ? this.carrot : this.stick;
                    this.digested.push(entity);
                    smallWorld.deleteEntity(entity);
                }
            }
        }

        // This is where the agents learns based on the feedback of their actions on the environment
        this.backward();

        switch (this.brainType) {
        case 'TD':
        case 'RLTD':
            if (!this.worker) {
                this.pts.push(this.brain.average_reward_window.getAverage().toFixed(1));
            }
            break;
        case 'RLDQN':
            if (!this.worker) {
                this.pts.push(this.lastReward * 0.999 + this.lastReward * 0.001);
            }
            break;
        }

        return this;
    };

    /**
     * Agent's chance to move in the world
     * @param smallWorld
     */
    Agent.prototype.move = function (smallWorld) {
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
            var result = Utility.collisionCheck(this.oldPos, this.position, smallWorld.walls);
            if (result) {
                // The agent derped! Wall collision! Reset their position
                this.position = this.oldPos;
            }
        }

        // Handle boundary conditions.. bounce agent
        if (this.position.x < 2) {
            this.position.x = 2;
        }
        if (this.position.x > smallWorld.width) {
            this.position.x = smallWorld.width;
        }
        if (this.position.y < 2) {
            this.position.y = 2;
        }
        if (this.position.y > smallWorld.height) {
            this.position.y = smallWorld.height;
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

