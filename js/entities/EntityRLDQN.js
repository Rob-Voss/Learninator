(function (global) {
    "use strict";

    /**
     * Initialize the EntityRLDQN
     *
     * @param {Vec} position
     * @param {Object} env
     * @param {Object} opts
     * @returns {AgentRLTD}
     */
    var EntityRLDQN = function (position, env, opts) {
        Entity.call(this, 2, position, env, opts);

        this.carrot = +1;
        this.stick = -1;

        this.action = null;
        this.state = null;

        this.lastReward = 0;
        this.digestionSignal = 0.0;
        this.rewardBonus = 0.0;
        this.previousActionIdx = -1;
        this.pts = [];
        this.digested = [];
        this.direction = 'N';

        this.name = "Entity RLDQN";

        // The Agent's actions
        this.actions = [];
        this.actions.push(0);
        this.actions.push(1);
        this.actions.push(2);
        this.actions.push(3);

        // The number of possible angles the Agent can turn
        this.numActions = this.actions.length;
        this.numEyes = 4;
        this.numTypes = 2;

        // The number of Agent's eyes, each one sees the number of knownTypes + the two velocity inputs
        this.numStates = this.numEyes * this.numTypes + 2;

        // Size of the network
        this.networkSize = this.numStates * this.temporalWindow + this.numActions * this.temporalWindow + this.numStates;

        // The Agent's eyes
        this.eyes = [];
        for (var k = 0; k < this.numEyes; k++) {
            this.eyes.push(new Eye(k * Math.PI / 2, 65, 65));
        }

        this.brainOpts = {
            update: "qlearn", // qlearn | sarsa
            gamma: 0.9, // discount factor, [0, 1)
            epsilon: 0.2, // initial epsilon for epsilon-greedy policy, [0, 1)
            alpha: 0.005, // value function learning rate
            experience_add_every: 5, // number of time steps before we add another experience to replay memory
            experience_size: 10000, // size of experience
            learning_steps_per_iteration: 5,
            tderror_clamp: 1.0, // for robustness
            num_hidden_units: 100 // number of neurons in hidden layer
        };

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

        this.brain = new DQNAgent(this.env, this.brainOpts);

        return this;
    };

    EntityRLDQN.prototype = Object.create(Entity.prototype);
    EntityRLDQN.prototype.constructor = Entity;

    /**
     * Agent's chance to act on the world
     *
     * @param {Object} smallWorld
     */
    EntityRLDQN.prototype.tick = function (smallWorld) {
        this.digested = [];
        // Loop through the eyes and check the walls and nearby entities
        for (var e = 0; e < this.numEyes; e++) {
            this.eyes[e].sense(this.position, this.angle, smallWorld.walls, smallWorld.nodes);
        }

        // Let the agents behave in the world based on their input
        this.forward();

        var out = this.move(smallWorld);

        // This is where the agents learns based on the feedback of their actions on the environment
        this.backward(out);
    };

    /**
     * Agent's chance to learn
     */
    EntityRLDQN.prototype.backward = function () {
        this.lastReward = this.digestionSignal; // for vis
        this.brain.learn(this.digestionSignal);

        return this;
    };

    /**
     * Agent's chance to act on the world
     */
    EntityRLDQN.prototype.forward = function () {
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

        this.action = this.brain.act(inputArray);

        return this;
    };

    /**
     * Move around
     * @param {Object} smallWorld
     */
    EntityRLDQN.prototype.move = function (smallWorld) {
        var speed = 0.02;

        // Forward the agent by velocity
        this.position.x += this.position.vx;
        this.position.y += this.position.vy;

        // Forward the agent by velocity
        this.position.vx *= 0.95;
        this.position.vy *= 0.95;

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

        // Handle boundary conditions.. bounce Agent
        if (this.position.x < 2) {
            this.position.x = 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }
        if (this.position.x > smallWorld.width - 2) {
            this.position.x = smallWorld.width - 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }
        if (this.position.y < 2) {
            this.position.y = 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }
        if (this.position.y > smallWorld.height - 2) {
            this.position.y = smallWorld.height - 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }

        if (typeof this.target !== 'undefined') {
            // compute distances
            var dx1 = this.position.x - this.target.position.x,
                dy1 = this.position.y - this.target.position.y,
                d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1),
                dx2 = this.position.x - this.target.position.x2,
                dy2 = this.position.y - this.target.position.y2,
                d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2),
                dxnorm = dx2 / d2,
                dynorm = dy2 / d2,
                speed = 0.001;
            this.target.position.x2 += speed * dxnorm;
            this.target.position.y2 += speed * dynorm;

            // compute reward
            var r = -d1; // want to go close to green
            if (d2 < this.BADRAD) {
                // but if we're too close to red that's bad
                r += 2 * (d2 - this.BADRAD) / this.BADRAD;
            }

            if (this.action === 4) {
                r += 0.05;
            } // give bonus for gliding with no force
            var ns = 0;
        } else {
            var r = 0,
                ns = 0;
        }

        // evolve state in time
        var out = {'ns': ns, 'r': r};

        return out;
    };

    global.EntityRLDQN = EntityRLDQN;

}(this));

