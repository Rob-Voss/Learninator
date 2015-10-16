(function (global) {
    "use strict";

    /**
     * Initialize the EntityRLDQN
     * @param {Vec} position
     * @param {Object} opts
     * @returns {EntityRLDQN}
     */
    var EntityRLDQN = function (position, opts) {
        this.name = 'Entity RLDQN';
        this.action = null;
        this.state = null;
        this.stepsPerTick = 1;
        this.BADRAD = 25;
        this.type = 5;

        // Just a text value for the brain type, also useful for worker ops
        this.brainType = Utility.getOpt(opts, 'brainType', 'TD');
        // The number of item types the Agent's eyes can see
        this.numTypes = Utility.getOpt(opts, 'numTypes', 5);
        // The number of Agent's eyes
        this.numEyes = Utility.getOpt(opts, 'numEyes',  6);
        this.range = Utility.getOpt(opts, 'range',  75);
        this.proximity = Utility.getOpt(opts, 'proximity',  75);
        // The number of Agent's eyes, each one sees the number of knownTypes + stuff
        this.numStates = this.numEyes * this.numTypes + 6;

        Entity.call(this, this.type, position, opts);

        // Reward or punishment
        this.carrot = +1;
        this.stick = -1;
        this.reward = 0;
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

        // The Agent's eyes
        this.eyes = [];
        for (var k = 0; k < this.numEyes; k++) {
            this.eyes.push(new Eye(k * Math.PI / 3, this.position, 75, 75));
        }

        // Set the brain options
        this.brainOpts = Utility.getOpt(opts, 'spec', {
            update: "qlearn", // qlearn | sarsa
            gamma: 0.9, // discount factor, [0, 1)
            epsilon: 0.2, // initial epsilon for epsilon-greedy policy, [0, 1)
            alpha: 0.005, // value function learning rate
            experienceAddEvery: 5, // number of time steps before we add another experience to replay memory
            experienceSize: 10000, // size of experience
            learningStepsPerIteration: 5,
            tdErrorClamp: 1.0, // for robustness
            numHiddenUnits: 100 // number of neurons in hidden layer
        });

        this.brain = new DQNAgent(this, this.brainOpts);

        return this;
    };

    EntityRLDQN.prototype = Object.create(Entity.prototype);
    EntityRLDQN.prototype.constructor = Entity;

    /**
     * Agent's chance to act on the world
     */
    EntityRLDQN.prototype.act = function () {
        // Loop through the eyes and check the walls and nearby entities
        for (let e = 0; e < this.numEyes; e++) {
            this.eyes[e].sense(this);
        }

        // in forward pass the agent simply behaves in the environment
        var ne = this.numEyes * this.numTypes,
            inputArray = new Array(this.numStates);
        for (let i = 0; i < this.numEyes; i++) {
            let eye = this.eyes[i];
            inputArray[i * this.numTypes] = 0.9; // Wall?
            inputArray[i * this.numTypes + 1] = this.carrot; // Nom?
            inputArray[i * this.numTypes + 2] = this.stick; // Gnar?
            inputArray[i * this.numTypes + 3] = this.stick; // Agent?
            inputArray[i * this.numTypes + 4] = this.stick; // Agent?
            inputArray[i * this.numTypes + 5] = eye.x; // position information
            inputArray[i * this.numTypes + 6] = eye.y; // of the sensed target
            inputArray[i * this.numTypes + 7] = eye.vx; // Velocity information
            inputArray[i * this.numTypes + 8] = eye.vy; // of the sensed target
            if (eye.sensedType !== -1) {
                // sensedType is 0 for wall, 1 for food and 2 for poison.
                // lets do a 1-of-k encoding into the input array
                inputArray[i * this.numTypes + eye.sensedType] = eye.sensedProximity / eye.maxRange; // normalize to [0,1]
            }
        }

        // proprioception and orientation
        inputArray[ne + 0] = this.position.vx;
        inputArray[ne + 1] = this.position.vy;
        inputArray[ne + 2] = (this.target.position.x / 1000) - (this.position.x / 1000);
        inputArray[ne + 3] = (this.target.position.y / 1000) - (this.position.y / 1000);
        inputArray[ne + 4] = (this.enemy.position.x / 1000) - (this.position.x / 1000);
        inputArray[ne + 5] = (this.enemy.position.y / 1000) - (this.position.y / 1000);

        return inputArray;
    };

    /**
     * Return the number of states
     * @returns {Number}
     */
    EntityRLDQN.prototype.getNumStates = function () {
        return this.numStates; // x,y,vx,vy, puck dx,dy
    };

    /**
     * Return the number of actions
     * @returns {Number}
     */
    EntityRLDQN.prototype.getMaxNumActions = function () {
        return this.actions.length; // left, right, up, down, nothing
    };

    EntityRLDQN.prototype.move = function () {
        var speed = 0.50, r, ns, out;

        // Execute agent's desired action
        switch (this.action) {
            case 0:
                this.position.vx -= speed;
                break;
            case 1:
                this.position.vx += speed;
                break;
            case 2:
                this.position.vy -= speed;
                break;
            case 3:
                this.position.vy += speed;
                break;
            case 4:
                this.position.vx = 0;
                this.position.vy = 0;
                break;
        }

        // Forward the agent by velocity
        this.position.vx *= 0.95;
        this.position.vy *= 0.95;

        // Forward the agent by velocity
        this.position.x += this.position.vx;
        this.position.y += this.position.vy;

        this.world.collisionCheck(this);

        // Add any walls we hit
        // @TODO I need to get these damn walls into the CollisionDetection call
        for (let w = 0, wl = this.world.walls.length; w < wl; w++) {
            var wall = this.world.walls[w],
                result = Utility.lineIntersect(this.oldPos, this.position, wall.v1, wall.v2);
            if (result) {
                this.collisions.push(wall);
            }
        }

        // Loop through collisions and do stuff
        for (let i = 0; i < this.collisions.length; i++) {
            if (this.collisions[i].type === 3 || this.collisions[i].type === 4 || this.collisions[i].type === 5) {
                // Agent
                this.enemy = this.collisions[i];
            } else if (this.collisions[i].type === 1) {
                // Edible
                this.target = this.collisions[i];
                //console.log('Watch it ' + this.collisions[i].name);
            } else if (this.collisions[i].type === 0) {
                // Wall
                this.position = this.oldPos.clone();
                this.position.vx *= -1;
                this.position.vy *= -1;
            }
        }

        // Handle boundary conditions.. bounce Agent
        var top = this.world.height - (this.world.height - this.radius),
            bottom = this.world.height - this.radius,
            left = this.world.width - (this.world.width - this.radius),
            right = this.world.width - this.radius;
        if (this.position.x < left) {
            this.position.x = left;
            this.position.vx *= -1;
        }

        if (this.position.x > right) {
            this.position.x = right;
            this.position.vx *= -1;
        }

        if (this.position.y < top) {
            this.position.y = top;
            this.position.vy *= -1;
        }

        if (this.position.y > bottom) {
            this.position.y = bottom;
            this.position.vy *= -1;
        }

        if (this.useSprite) {
            this.sprite.position.set(this.position.x, this.position.y);
        }

        return this;
    };

    /**
     * Move around
     * @param {Object} smallWorld
     */
    EntityRLDQN.prototype.sampleNextState = function () {
        if (this.target && this.enemy) {
            // Compute distances
            var r,
                dx1 = (this.position.x / 1000) - (this.target.position.x / 1000), // Distance from Noms
                dy1 = (this.position.y / 1000) - (this.target.position.y / 1000), // Distance from Noms
                d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1),
                dx2 = (this.position.x / 1000) - (this.enemy.position.x / 1000), // Distance from Agent
                dy2 = (this.position.y / 1000) - (this.enemy.position.y / 1000), // Distance from Agent
                d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

            // Compute reward we want to go close to Noms
            r = -d1;
            if (d2 < (this.enemy.range / 1000)) {
                // but if we're too close to red that's bad
                r += 2 * (d2 - this.enemy.range / 1000) / (this.enemy.range / 1000);
            }

            // Give bonus for gliding with no force
            if (this.action === 4) {
                r += 0.05;
            }

            return r;
        }
    };

    /**
     * Agent's chance to act on the world
     *
     * @param {Object} smallWorld
     */
    EntityRLDQN.prototype.tick = function (world) {
        this.world = world;
        var obs;

        for (var k = 0; k < this.stepsPerTick; k++) {
            this.state = this.act();
            this.action = this.brain.act(this.state);
            this.move();
            this.reward = this.sampleNextState();
            this.pts.push(this.reward);
            //console.log('Reward:'+this.reward);
            this.brain.learn(this.reward);
        }

        return this;
    };

    global.EntityRLDQN = EntityRLDQN;

}(this));

