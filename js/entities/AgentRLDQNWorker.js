(function (global) {
    "use strict";

    /**
     * Initialize the AgentRLDQN
     * @param {Vec} position
     * @param {Object} env
     * @param {Object} opts
     * @returns {AgentRLDQN}
     */
    var AgentRLDQN = function (position, env, opts) {
        Agent.call(this, position, env, opts);

        this.carrot = +1;
        this.stick = -1;

        this.name = "Agent RLDQN";

        // Amount of temporal memory. 0 = agent lives in-the-moment :)
        this.temporalWindow = 1;

        // The Agent's actions
        this.actions = [];
        this.actions.push(0);
        this.actions.push(1);
        this.actions.push(2);
        this.actions.push(3);

        // The number of possible angles the Agent can turn
        this.numActions = this.actions.length;

        // The number of Agent's eyes, each one sees the number of knownTypes + the two velocity inputs
        this.numStates = this.numEyes * this.numTypes + 2;

        // Size of the network
        this.networkSize = this.numStates * this.temporalWindow + this.numActions * this.temporalWindow + this.numStates;

        this.brainOpts = opts.spec || {
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
        this.brain = new RL.DQNAgent(this, this.brainOpts);

        //this.brain = new Worker('js/entities/TDBrain.js');
        this.brain.onmessage = function (e) {
            var data = e.data;
            switch (data.cmd) {
            case 'init':
                if (data.msg === 'load') {
                    _this.brain.load(data.input);
                }
                if (data.msg === 'complete') {
                    _this.worker = true;
                }
                break;
            case 'forward':
                if (data.msg === 'complete') {
                    _this.previousActionIdx = _this.actionIndex;
                    _this.actionIndex = data.input;
                    var action = _this.actions[_this.actionIndex];

                    // Demultiplex into behavior variables
                    _this.rot1 = action[0] * 1;
                    _this.rot2 = action[1] * 1;
                }
                break;
            case 'backward':
                if (data.msg === 'complete') {
                    _this.pts.push(parseFloat(data.input));
                }
                break;
            default:
                console.log('Unknown command: ' + data.cmd + ' message:' + data.msg);
                break;
            }
        };

        this.brain.postMessage({cmd: 'init', input: this.brainOpts});

        return this;
    };

    AgentRLDQN.prototype = Object.create(Agent.prototype);
    AgentRLDQN.prototype.constructor = Agent;

    /**
     * Agent's chance to act on the world
     */
    AgentRLDQN.prototype.forward = function () {
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
     * Agent's chance to learn
     */
    AgentRLDQN.prototype.backward = function () {
        this.lastReward = this.digestionSignal; // for vis
        this.brain.learn(this.digestionSignal);

        return this;
    };

    /**
     * Move around
     * @param {Object} smallWorld
     */
    AgentRLDQN.prototype.move = function (smallWorld) {
        var oldAngle = this.angle,
            speed = 1;
        // Apply outputs of agents on environment
        this.oldPos = this.position.clone();
        this.oldAngle = oldAngle;

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

        if (this.collision) {
            // The agent is trying to move from pos to oPos so we need to check walls
            var result = Utility.collisionCheck(this.oldPos, this.position, smallWorld.walls, []);
            if (result) {
                // The agent derped! Wall collision! Reset their position
                this.position = this.oldPos;
            }
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

        this.position.advance();
        this.position.round();

        if (this.useSprite) {
            this.sprite.position.set(this.position.x, this.position.y);
        }

        return this;
    };

    global.AgentRLDQN = AgentRLDQN;

}(this));
