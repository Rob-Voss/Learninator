(function (global) {
    "use strict";

    /**
     * Initialize the EntityRLDQN
     *
     * @param {Vec} position
     * @param {Object} opts
     * @returns {AgentRLTD}
     */
    var EntityRLDQN = function (position, opts) {
        // Is it a worker
        this.worker = Utility.getOpt(opts, 'worker', false);
        this.name = 'Entity RLDQN';
        if (this.worker) {
            this.name += ' Worker';
        }

        AgentRLDQN.call(this, position, opts);

        // The Agent's eyes
        this.eyes = [];
        for (var k = 0; k < this.numEyes; k++) {
            this.eyes.push(new Eye(k * Math.PI / 2, 65, 65));
        }

        return this;
    };

    EntityRLDQN.prototype = Object.create(Agent.prototype);
    EntityRLDQN.prototype.constructor = Agent;

    /**
     * Agent's chance to act on the world
     */
    EntityRLDQN.prototype.act = function () {
        // Loop through the eyes and check the walls and nearby entities
        for (var e = 0; e < this.numEyes; e++) {
            this.eyes[e].sense(this.position, this.angle, this.world.walls, this.world.entities);
        }

        // in forward pass the agent simply behaves in the environment
        var ne = this.numEyes * this.numTypes,
            inputArray = new Array(this.numStates);
        for (let i = 0; i < this.numEyes; i++) {
            let eye = this.eyes[i];
            inputArray[i * this.numTypes] = 1.0;
            inputArray[i * this.numTypes + 1] = 1.0;
            inputArray[i * this.numTypes + 2] = 1.0;
            inputArray[i * this.numTypes + 3] = eye.vx; // velocity information of the sensed target
            inputArray[i * this.numTypes + 4] = eye.vy;
            if (eye.sensedType !== -1) {
                // sensedType is 0 for wall, 1 for food and 2 for poison.
                // lets do a 1-of-k encoding into the input array
                inputArray[i * this.numTypes + eye.sensedType] = eye.sensedProximity / eye.maxRange; // normalize to [0,1]
            }
        }

        // proprioception and orientation
        inputArray[ne + 0] = this.position.vx;
        inputArray[ne + 1] = this.position.vy;

        if (!this.worker) {
            this.action = this.brain.act(inputArray);
        } else {
            this.post('act', inputArray);
        }

        return this;
    };

    /**
     * Agent's chance to learn
     */
    EntityRLDQN.prototype.learn = function () {
        this.lastReward = this.digestionSignal; // for vis

        if (!this.worker) {
            this.brain.learn(this.digestionSignal);
            this.epsilon = this.brain.epsilon;
        } else {
            this.post('learn', this.digestionSignal);
        }

        return this;
    };

    /**
     * Move around
     * @param {Object} smallWorld
     */
    EntityRLDQN.prototype.move = function () {
        var speed = 0.22, r, ns;

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
        }

        // Forward the agent by velocity
        this.position.vx *= 0.95;
        this.position.vy *= 0.95;

        // Forward the agent by velocity
        this.position.x += this.position.vx;
        this.position.y += this.position.vy;

        this.world.collisionCheck(this);

        // Go through and process what we ate
        for (var i=0; i < this.collisions.length; i++) {
            this.target = (this.collisions[i].type === 1) ? this.collisions[i] : undefined;
        }
        this.collisions = [];

        // Handle boundary conditions.. bounce Agent
        if (this.position.x < 2) {
            this.position.x = 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }
        if (this.position.x > this.world.width - 2) {
            this.position.x = this.world.width - 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }
        if (this.position.y < 2) {
            this.position.y = 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }
        if (this.position.y > this.world.height - 2) {
            this.position.y = this.world.height - 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }

        if (typeof this.target !== 'undefined') {
            // compute distances
            var dx1 = this.position.x - this.target.position.x,
                dy1 = this.position.y - this.target.position.y,
                d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1),
                dxnorm = dx1 / d1,
                dynorm = dy1 / d1,
                speed = 0.001;
            this.position.x += speed * dxnorm;
            this.position.y += speed * dynorm;

            // compute reward
            r = -d1; // want to go close to green
            if (d1 < this.BADRAD) {
                // but if we're too close to red that's bad
                r += 2 * (d1 - this.BADRAD) / this.BADRAD;
            }
            // give bonus for gliding with no force
            if (this.action === 4) {
                r += 0.05;
            }

            ns = 0;
        } else {
            r = 0,
            ns = 0;
        }

        // evolve state in time
        var out = {
            ns: ns,
            r: r
        };

        return out;
    };

    /**
     * Agent's chance to act on the world
     *
     * @param {Object} smallWorld
     */
    EntityRLDQN.prototype.tick = function (world) {
        this.world = world;

        // Let the agents behave in the world based on their input
        this.act();

        // If it's not a worker we need to run the rest of the steps
        if (!this.worker) {
            // Move eet!
            this.move();
            // Find nearby entities to nom
            //this.eat();
            // This is where the agents learns based on the feedback of their actions on the environment
            this.learn();
        }
    };

    global.EntityRLDQN = EntityRLDQN;

}(this));

