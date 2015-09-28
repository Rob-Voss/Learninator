(function (global) {
    "use strict";

    /**
     * Initialize the TD Agent
     * @param {Vec} position
     * @param {Object} env
     * @param {Object} opts
     * @returns {AgentTD}
     */
    var AgentTD = function (position, opts) {
        // Is it a worker
        this.worker = Utility.getOpt(opts, 'worker', false);
        this.name = "Agent TD";
        if (this.worker) {
            this.name += ' Worker';
        }

        Agent.call(this, position, opts);

        this.carrot = +5;
        this.stick = -6;

        // The Agent's actions
        this.actions = [];
        this.actions.push([1, 1]);
        this.actions.push([0.8, 1]);
        this.actions.push([1, 0.8]);
        this.actions.push([0.5, 0]);
        this.actions.push([0, 0.5]);

        // The number of possible angles the Agent can turn
        this.numActions = this.actions.length;

        // The number of Agent's eyes, each one sees the number of knownTypes
        this.numStates = this.numEyes * this.numTypes;

        // Amount of temporal memory. 0 = agent lives in-the-moment :)
        this.temporalWindow = 1;

        // Size of the network
        this.networkSize = this.numStates * this.temporalWindow + this.numActions * this.temporalWindow + this.numStates;

        /**
         * The value function network computes a value of taking any of the possible actions
         * given an input state.
         *
         * Here we specify one explicitly the hard way but we could also use
         * opt.hidden_layer_sizes = [20,20] instead to just insert simple relu hidden layers.
         * @type {Array}
         */
        this.layerDefs = [];
        this.layerDefs.push({type: 'input', outSx: 1, outSy: 1, outDepth: this.networkSize});
        this.layerDefs.push({type: 'fc', numNeurons: 50, activation: 'relu'});
        this.layerDefs.push({type: 'fc', numNeurons: 50, activation: 'relu'});
        this.layerDefs.push({type: 'regression', numNeurons: this.numActions});

        /**
         * The options for the Temporal Difference learner that trains the above net
         * by backpropping the temporal difference learning rule.
         * @type {Object}
         */
        this.tdTrainerOptions = {
            learningRate: 0.001,
            momentum: 0.0,
            batchSize: 64,
            l2Decay: 0.01
        };

        /**
         * Options for the Brain
         * @type {Object}
         */
        this.brainOpts = {
            numStates: this.numStates,
            numActions: this.numActions,
            temporalWindow: this.temporalWindow,
            experienceSize: 30000,
            startLearnThreshold: 1000,
            gamma: 0.7,
            learningStepsTotal: 200000,
            learningStepsBurnin: 3000,
            epsilonMin: 0.05,
            epsilonTestTime: 0.05,
            layerDefs: this.layerDefs,
            tdTrainerOptions: this.tdTrainerOptions
        };

        var _this = this;

        if (!this.worker) {
            this.brain = new TDBrain(this.brainOpts);
        } else {
            this.post = function (cmd, input) {
                this.brain.postMessage({target: 'TD', cmd: cmd, input: input});
            };

            this.brain = new Worker('js/entities/TDBrain.js');
            this.brain.onmessage = function (e) {
                var data = e.data;
                switch (data.cmd) {
                case 'init':
                    if (data.msg === 'complete') {

                    }
                    break;
                case 'act':
                    if (data.msg === 'complete') {
                        _this.previousActionIdx = _this.actionIndex;
                        _this.actionIndex = data.input;
                        var action = _this.actions[_this.actionIndex];

                        // Demultiplex into behavior variables
                        _this.rot1 = action[0] * 1;
                        _this.rot2 = action[1] * 1;

                        _this.move();
                        _this.eat();
                        _this.learn();
                    }
                    break;
                case 'learn':
                    if (data.msg === 'complete') {
                        _this.pts.push(parseFloat(data.input));
                    }
                    break;
                case 'load':
                    if (data.msg === 'complete') {
                        _this.epsilon = parseFloat(data.input);
                    }
                    break;
                default:
                    console.log('Unknown command: ' + data.cmd + ' message:' + data.msg);
                    break;
                }
            };

            this.post('init', this.brainOpts);
        }
        return this;
    };

    AgentTD.prototype = Object.create(Agent.prototype);
    AgentTD.prototype.constructor = Agent;

    /**
     * Agent's chance to act on the world
     */
    AgentTD.prototype.act = function () {
        // Loop through the eyes and check the walls and nearby entities
        for (var e = 0; e < this.numEyes; e++) {
            this.eyes[e].sense(this.position, this.angle, this.world.walls, this.world.entities);
        }

        // Create input to brain
        var inputArray = new Array(this.numEyes * this.numTypes);
        for (let i = 0; i < this.numEyes; i++) {
            let eye = this.eyes[i];
            inputArray[i * this.numTypes] = 1.0;
            inputArray[i * this.numTypes + 1] = 1.0;
            inputArray[i * this.numTypes + 2] = 1.0;
            if (eye.sensedType !== -1) {
                // sensedType is 0 for wall, 1 for food and 2 for poison lets do
                // a 1-of-k encoding into the input array normalize to [0,1]
                inputArray[i * this.numTypes + eye.sensedType] = eye.sensedProximity / eye.maxRange;
            }
        }

        if (!this.worker) {
            // Get action from brain
            this.previousActionIdx = this.actionIndex;
            this.actionIndex = this.brain.forward(inputArray);
            var action = this.actions[this.actionIndex];

            // Demultiplex into behavior variables
            this.rot1 = action[0] * 1;
            this.rot2 = action[1] * 1;

            return this;
        } else {
            this.post('act', inputArray);
        }
    };

    /**
     * The agent learns
     */
    AgentTD.prototype.learn = function () {
        this.lastReward = this.digestionSignal;

        // Compute the reward
        var proximityReward = 0.0;
        for (let ei = 0; ei < this.numEyes; ei++) {
            let eye = this.eyes[ei];
            // Agents don't like to see walls, especially up close
            proximityReward += eye.sensedType === 0 ? eye.sensedProximity / eye.maxRange : 1.0;
        }

        // Calculate the proximity reward
        proximityReward = proximityReward / this.numEyes;
        proximityReward = Math.min(1.0, proximityReward * 2);

        // Agents like to go straight forward
        var forwardReward = 0.0;
        if (this.actionIndex === 0 && proximityReward > 0.75) {
            forwardReward = 0.1 * proximityReward;
        }

        // Agents like to eat good things
        var digestionReward = this.digestionSignal;
        this.digestionSignal = 0.0;

        var reward = proximityReward + forwardReward + digestionReward;

        // pass to brain for learning
        if (!this.worker) {
            this.brain.backward(reward);
            this.pts.push(reward);
        } else {
            this.post('learn', reward);
        }

        return this;
    };

    /**
     * Agent's chance to move in the world
     * @param smallWorld
     */
    AgentTD.prototype.move = function () {
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
            var result = Utility.collisionCheck(this.oldPos, this.position, this.world.walls, [], this.radius);
            if (result) {
                // The agent derped! Wall collision! Reset their position
                this.position = this.oldPos.clone();
                this.position.vx = 0;
                this.position.vy = 0;
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

    global.AgentTD = AgentTD;

}(this));

