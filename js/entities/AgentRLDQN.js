(function (global) {
    "use strict";

    /**
     * Initialize the AgentRLDQN
     * @param {Vec} position
     * @param {Object} opts
     * @returns {AgentRLDQN}
     */
    var AgentRLDQN = function (position, opts) {
        // Is it a worker
        this.worker = Utility.getOpt(opts, 'worker', false);
        this.name = 'Agent RLDQN';
        if (this.worker) {
            this.name += ' Worker';
        }

        Agent.call(this, position, opts);

        // The number of Agent's eyes, each one sees the number of knownTypes + the two velocity inputs
        this.numStates = this.numEyes * this.numTypes + 2;

        // Reward or punishment
        this.carrot = +1;
        this.stick = -1;

        // The Agent's actions
        this.actions = [];
        this.actions.push(0);
        this.actions.push(1);
        this.actions.push(2);
        this.actions.push(3);

        // The number of possible angles the Agent can turn
        this.numActions = this.actions.length;

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

        var _this = this;

        // If it's a worker then we have to load it a bit different
        if (!this.worker) {
            this.brain = new DQNAgent(_this.env, this.brainOpts);

            return this;
        } else {
            this.post = function (cmd, input) {
                this.brain.postMessage({target: 'DQN', cmd: cmd, input: input});
            };

            var jEnv = Utility.stringify(_this.env),
                jOpts = Utility.stringify(_this.brainOpts);

            this.brain = new Worker('js/lib/external/rl.js');
            this.brain.onmessage = function (e) {
                var data = e.data;
                switch (data.cmd) {
                case 'init':
                    if (data.msg === 'complete') {
                        //
                    }
                    break;
                case 'act':
                    if (data.msg === 'complete') {
                        _this.action = data.input;
                        _this.move();
                        _this.eat();
                        _this.learn();
                    }
                    break;
                case 'learn':
                    if (data.msg === 'complete') {
                        _this.epsilon = parseFloat(data.input);
                    }
                    break;
                default:
                    console.log('Unknown command: ' + data.cmd + ' message:' + data.msg);
                    break;
                }
            };

            this.post('init', {env: jEnv, opts: jOpts});
        }
    };

    AgentRLDQN.prototype = Object.create(Agent.prototype);
    AgentRLDQN.prototype.constructor = Agent;

    /**
     * Agent's chance to act on the world
     * @returns {AgentRLDQN}
     */
    AgentRLDQN.prototype.act = function () {
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
     * @returns {AgentRLDQN}
     */
    AgentRLDQN.prototype.learn = function () {
        this.lastReward = this.digestionSignal;

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
     * @returns {AgentRLDQN}
     */
    AgentRLDQN.prototype.move = function () {
        var oldAngle = this.angle,
            speed = 1;
        this.oldPos = this.position.clone();

        // Execute agent's desired action
        switch (this.action) {
            case 0:
                this.position.vx += -speed;
                break;
            case 1:
                this.position.vx += speed;
                break;
            case 2:
                this.position.vy += -speed;
                break;
            case 3:
                this.position.vy += speed;
                break;
        }

        // Forward the agent by velocity
        this.position.vx *= 0.95;
        this.position.vy *= 0.95;
        this.position.x += this.position.vx;
        this.position.y += this.position.vy;

        if (this.collision) {
            // The agent is trying to move from oldPos to position so we need to check walls
            var result = Utility.collisionCheck(this.oldPos, this.position, this.world.walls);
            if (result) {
                // The agent derped! Wall collision! Reset their position
                //this.position.set(result.vecI.x + this.radius, result.vecI.y + this.radius);
                this.position = this.oldPos.clone();
                this.position.vx = 0;
                this.position.vy = 0;
            }
        }

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

        if (this.useSprite) {
            this.sprite.position.set(this.position.x, this.position.y);
        }

        var end = new Date().getTime(),
            dist = this.position.distFrom(this.oldPos);

        return this;
    };

    global.AgentRLDQN = AgentRLDQN;

}(this));
