var AgentRLDQN = AgentRLDQN || {},
    Agent = Agent || {};

(function (global) {
    "use strict";

    class AgentRLDQN extends Agent {
        /**
         * Initialize the AgentRLDQN
         * @name AgentRLDQN
         * @extends Agent
         * @constructor
         *
         * @param {Vec} position - The x, y location
         * @param {agentOpts} opts - The Agent options
         * @returns {AgentRLDQN}
         */
        constructor(position, opts) {
            super(position, opts);

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

            // The number of Agent's eyes, each one sees the number of knownTypes + the two velocity inputs
            this.numStates = this.numEyes * this.numTypes + 2;

            this.reset();
        }

        /**
         * Agent's chance to act on the world
         * @returns {AgentRLDQN}
         */
        act(world) {
            // in forward pass the agent simply behaves in the environment
            let ne = this.numEyes * this.numTypes,
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
            inputArray[ne + 0] = this.pos.vx;
            inputArray[ne + 1] = this.pos.vy;

            if (!this.worker) {
                this.action = this.brain.act(inputArray);
            } else {
                this.post('act', inputArray);
            }

            return this;
        }

        /**
         * Agent's chance to learn
         * @returns {AgentRLDQN}
         */
        learn() {
            this.lastReward = this.digestionSignal;
            // this.pts.push(this.digestionSignal);

            if (!this.worker) {
                this.brain.learn(this.digestionSignal);
                this.epsilon = this.brain.epsilon;
            } else {
                this.post('learn', this.digestionSignal);
            }

            return this;
        }

        /**
         * Reset or set up the Agent
         */
        reset() {
            let self = this;
            // If it's a worker then we have to load it a bit different
            if (!self.worker) {
                self.brain = new RL.DQNAgent(self.env, self.brainOpts);

                return self;
            } else {
                self.post = function (cmd, input) {
                    self.brain.postMessage({target: 'DQN', cmd: cmd, input: input});
                };

                let jEnv = Utility.stringify(self.env),
                    jOpts = Utility.stringify(self.brainOpts);

                self.brain = new Worker('js/lib/external/rl.js');
                self.brain.onmessage = function (e) {
                    let data = e.data;
                    switch (data.cmd) {
                        case 'act':
                            if (data.msg === 'complete') {
                                self.action = data.input;
                                self.move();
                                self.learn();
                            }
                            break;
                        case 'init':
                            if (data.msg === 'complete') {
                                //
                            }
                            break;
                        case 'learn':
                            if (data.msg === 'complete') {
                                self.brainState = JSON.stringify(data.input);
                            }
                            break;
                        case 'load':
                            if (data.msg === 'complete') {
                                self.brainState = JSON.stringify(data.input);
                            }
                            break;
                        case 'save':
                            if (data.msg === 'complete') {
                                self.brainState = JSON.stringify(data.input);
                            }
                            break;
                        default:
                            console.log('Unknown command: ' + data.cmd + ' message:' + data.msg);
                            break;
                    }
                };

                self.post('init', {env: jEnv, opts: jOpts});
            }

            return this;
        }
    }

    global.AgentRLDQN = AgentRLDQN;

}(this));
