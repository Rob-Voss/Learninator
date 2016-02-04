var EntityRLDQN = EntityRLDQN || {};

(function (global) {
    "use strict";

    /**
     * Initialize the EntityRLDQN
     * @name EntityRLDQN
     * @extends Entity
     * @constructor
     *
     * @param {Vec} position - The x, y location
     * @param {agentOpts} opts - The Entity options
     * @returns {EntityRLDQN}
     */
    function EntityRLDQN(position, env, opts) {
        let self = this;

        this.name = 'Entity RLDQN';
        this.action = null;
        this.state = null;
        this.stepsPerTick = 1;
        this.BADRAD = 25;
        this.type = 5;
        this.stepsPerTick = 1;

        // Reward or punishment
        this.carrot = +1;
        this.stick = -1;
        this.lastReward = 0;
        this.pts = [];

        // The Agent's actions
        this.actions = [];
        this.actions.push(0);
        this.actions.push(1);
        this.actions.push(2);
        this.actions.push(3);
        this.actions.push(4);

        // The number of possible angles the Agent can turn
        this.numActions = this.actions.length;

        Agent.call(this, position, env, opts);

        // The number of Agent's eyes, each one sees the number of knownTypes + stuff
        this.numStates = this.numEyes * this.numTypes + 6;

        // The Agent's eyes
        this.eyes = [];
        for (let k = 0; k < this.numEyes; k++) {
            this.eyes.push(new Eye(k * Math.PI / 3, this.pos, 75, 75));
        }

        this.brain = new DQNAgent(this, this.brainOpts);

        return this;
    }

    EntityRLDQN.prototype = Object.create(Entity.prototype);
    EntityRLDQN.prototype.constructor = Entity;

    /**
     * Load a pre-trained agent
     * @param {String} file
     */
    EntityRLDQN.prototype.load = function (file) {
        let _this = this;
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
     *
     */
    EntityRLDQN.prototype.saveAgent = function (id) {
        let brain;
        if (!this.worker) {
            brain = this.brain;
        }

        return JSON.stringify(brain.toJSON());
    };

    /**
     * Agent's chance to act on the world
     */
    EntityRLDQN.prototype.act = function () {
        // Loop through the eyes and check the walls and nearby entities
        for (let e = 0; e < this.numEyes; e++) {
            this.eyes[e].sense(this);
        }

        // in forward pass the agent simply behaves in the environment
        let ne = this.numEyes * this.numTypes,
            inputArray = new Array(this.numStates);
        for (let i = 0; i < this.numEyes; i++) {
            let eye = this.eyes[i];
            inputArray[i * this.numTypes] = 1.0; // Wall?
            inputArray[i * this.numTypes + 1] = 1.0; // Nom?
            inputArray[i * this.numTypes + 2] = 1.0; // Gnar?
            inputArray[i * this.numTypes + 3] = eye.vx; // Agent?
            inputArray[i * this.numTypes + 4] = eye.vy; // Agent?
            if (eye.sensedType !== -1) {
                // sensedType is 0 wall, 1 food, 2 poison, 3->5 Agent.
                // lets do a 1-of-k encoding into the input array
                inputArray[i * this.numTypes + eye.sensedType] = eye.sensedProximity / eye.maxRange; // normalize to [0,1]
            }
        }

        // proprioception and orientation
        inputArray[ne + 0] = this.pos.vx;
        inputArray[ne + 1] = this.pos.vy;

        return inputArray;
    };

    /**
     * Return the number of states
     * @returns {number}
     */
    EntityRLDQN.prototype.getNumStates = function () {
        return 8; //this.numStates; // x,y,vx,vy, puck dx,dy
    };

    /**
     * Return the number of actions
     * @returns {number}
     */
    EntityRLDQN.prototype.getMaxNumActions = function () {
        return this.actions.length; // left, right, up, down, nothing
    };

    /**
     * Get the current state
     * @returns {Array}
     */
    EntityRLDQN.prototype.getState = function () {
        let s = [
            this.enemy.pos.x / 1000,
            this.enemy.pos.y / 1000,
            this.enemy.pos.vx / 10,
            this.enemy.pos.vy / 10,
            (this.target.pos.x / 1000) - (this.pos.x / 1000),
            (this.target.pos.y / 1000) - (this.pos.y / 1000),
            (this.enemy.pos.x / 1000) - (this.pos.x / 1000),
            (this.enemy.pos.y / 1000) - (this.pos.y / 1000)
        ];
        return s;
    };

    /**
     * Move around
     * @returns {EntityRLDQN}
     */
    EntityRLDQN.prototype.move = function(world) {
        let speed = 0.50;

        // Execute agent's desired action
        switch (this.action) {
            case 0: // Right
                this.pos.vx -= speed;
                break;
            case 1: // Left
                this.pos.vx += speed;
                break;
            case 2: // Up
                this.pos.vy -= speed;
                break;
            case 3: // Down
                this.pos.vy += speed;
                break;
            case 4: // Hover
                this.pos.vx = 0;
                this.pos.vy = 0;
                break;
        }

        // Forward the agent by velocity
        this.pos.vx *= 0.95;
        this.pos.vy *= 0.95;

        // Forward the agent by velocity
        this.pos.x += this.pos.vx;
        this.pos.y += this.pos.vy;

        world.check(this);

        // Add any walls we hit
        // @TODO I need to get these damn walls into the CollisionDetection call
        for (let w = 0, wl = world.walls.length; w < wl; w++) {
            let wall = world.walls[w],
                result = world.lineIntersect(this.oldPos, this.pos, wall.v1, wall.v2, this.radius);
            if (result) {
                this.collisions.push(wall);
            }
        }

        // Loop through collisions and do stuff
        for (let i = 0; i < this.collisions.length; i++) {
            if (this.collisions[i].type === 3 || this.collisions[i].type === 4 || this.collisions[i].type === 5) {
                // Agent
                //this.target = this.collisions[i];
            } else if (this.collisions[i].type === 1) {
                // Edible
                //this.target = this.collisions[i];
                //this.enemy = this.collisions[i];
                //console.log('Watch it ' + this.collisions[i].name);
            } else if (this.collisions[i].type === 0) {
                // Wall
                this.pos = this.oldPos.clone();
                this.pos.vx *= -1;
                this.pos.vy *= -1;
            }
        }

        // Handle boundary conditions.. bounce Agent
        let top = world.height - (world.height - this.radius),
            bottom = world.height - this.radius,
            left = world.width - (world.width - this.radius),
            right = world.width - this.radius;
        if (this.pos.x < left) {
            this.pos.x = left;
            this.pos.vx *= -1;
        }

        if (this.pos.x > right) {
            this.pos.x = right;
            this.pos.vx *= -1;
        }

        if (this.pos.y < top) {
            this.pos.y = top;
            this.pos.vy *= -1;
        }

        if (this.pos.y > bottom) {
            this.pos.y = bottom;
            this.pos.vy *= -1;
        }

        if (this.useSprite) {
            this.sprite.position.set(this.pos.x, this.pos.y);
        }

        return this;
    };

    /**
     * Sample the next state
     */
    EntityRLDQN.prototype.sampleNextState = function () {
        // Compute distances
        let dx1 = (this.pos.x / 1000) - (this.target.pos.x / 1000), // Distance from Noms
            dy1 = (this.pos.y / 1000) - (this.target.pos.y / 1000), // Distance from Noms
            dx2 = (this.pos.x / 1000) - (this.enemy.pos.x / 1000), // Distance from Agent
            dy2 = (this.pos.y / 1000) - (this.enemy.pos.y / 1000), // Distance from Agent
            d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1),
            d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2),
            // Compute reward we want to go close to Agent we like
            r = -d1,
            eRng = this.enemy.range / 1000;

        if (d2 < eRng) {
            // but if we're too close to the bad Agent that's bad
            r += 2 * (d2 - eRng) / eRng;
        }

        // Give bonus for gliding with no force
        //if (this.action === 4) {
        //    r += 0.05;
        //}

        let vv = r + 0.5,
            ms = 255.0,
            red, green, blue;
        if (vv > 0) {
            red = 255 - vv * ms;
            blue = 255 - vv * ms;
            this.color = parseInt(Utility.rgbToHex(red, 255, blue));
        } else {
            green = 255 + vv * ms;
            blue = 255 + vv * ms;
            this.color = parseInt(Utility.rgbToHex(255, green, blue));
        }

        return r;
    };

    /**
     * Agent's chance to act on the world
     * @param {World} world
     */
    EntityRLDQN.prototype.tick = function (world) {
        for (let k = 0; k < this.stepsPerTick; k++) {
            // Loop through the eyes and check the walls and nearby entities
            for (let e = 0; e < this.numEyes; e++) {
                this.eyes[e].sense(this, world);
            }
            //this.state = this.act();
            this.state = this.getState();
            this.action = this.brain.act(this.state);
            this.move(world);
            this.lastReward = this.sampleNextState();
            this.pts.push(this.lastReward);
            this.brain.learn(this.lastReward);
        }

        return this;
    };

    global.EntityRLDQN = EntityRLDQN;

}(this));

