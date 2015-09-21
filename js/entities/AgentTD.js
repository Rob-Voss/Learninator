(function (global) {
    "use strict";

    /**
     * Initialize the TD Agent
     * @param {Vec} position
     * @param {Object} env
     * @param {Object} opts
     * @returns {AgentTD}
     */
    var AgentTD = function (position, env, opts) {
        Agent.call(this, position, env, opts);

        // Is it a worker
        this.worker = (typeof opts.worker !== 'boolean') ? false : opts.worker;

        this.carrot = +5;
        this.stick = -6;

        this.name = "Agent TD";
        if (this.worker) {
            this.name += ' Worker';
        }

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
        this.layerDefs.push({type: 'input', out_sx: 1, out_sy: 1, out_depth: this.networkSize});
        this.layerDefs.push({type: 'fc', num_neurons: 50, activation: 'relu'});
        this.layerDefs.push({type: 'fc', num_neurons: 50, activation: 'relu'});
        this.layerDefs.push({type: 'regression', num_neurons: this.numActions});

        /**
         * The options for the Temporal Difference learner that trains the above net
         * by backpropping the temporal difference learning rule.
         * @type {Object}
         */
        this.trainerOpts = {
            learning_rate: 0.001,
            momentum: 0.0,
            batch_size: 64,
            l2_decay: 0.01
        };

        /**
         * Options for the Brain
         * @type {Object}
         */
        this.brainOpts = {
            num_states: this.numStates,
            num_actions: this.numActions,
            temporal_window: this.temporalWindow,
            experience_size: 30000,
            start_learn_threshold: 1000,
            gamma: 0.7,
            learning_steps_total: 200000,
            learning_steps_burnin: 3000,
            epsilon_min: 0.05,
            epsilon_test_time: 0.05,
            layer_defs: this.layerDefs,
            tdtrainer_options: this.trainerOpts
        };

        var _this = this;

        if (!this.worker) {
            this.brain = new TDBrain(this.brainOpts);
        } else {
            this.brain = new Worker('js/entities/TDBrain.js');
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
        }
        return this;
    };

    AgentTD.prototype = Object.create(Agent.prototype);
    AgentTD.prototype.constructor = Agent;

    /**
     * Agent's chance to act on the world
     */
    AgentTD.prototype.forward = function () {
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
            this.brain.postMessage({cmd: 'forward', input: inputArray});
        }
    };

    /**
     * The agent learns
     */
    AgentTD.prototype.backward = function () {
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
        } else {
            this.brain.postMessage({cmd: 'backward', input: reward});
        }

        return this;
    };

    global.AgentTD = AgentTD;

}(this));

