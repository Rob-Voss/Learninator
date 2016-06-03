(function (global) {
    "use strict";

    var Utility = global.Utility || {},
        Eye = global.Eye || {};

    class Agent extends Entity {

        /**
         * Options for the Agent
         * @typedef {Object} agentOpts
         * @property {boolean} worker - Is the Agent a Web Worker
         * @property {string} brainType - The type of Brain to use
         * @property {number} numActions - The number of actions the Agent can take
         * @property {number} numTypes - The number of item types the Agent's eyes can see
         * @property {number} numEyes - The number of Agent's eyes
         * @property {number} numProprioception - The number of Agent's proprioception values
         * @property {number} range - The range of the Agent's eyes
         * @property {number} proximity - The proximity of the Agent's eyes
         * @property {cheatOpts} cheats - The cheats to display
         * @property {brainOpts} spec - The brain options
         * @property {envObject} env - The environment
         */

        /**
         * The options for the Agents brain
         * @typedef {Object} brainOpts
         * @property {string} update - qlearn | sarsa
         * @property {number} gamma - Discount factor [0, 1]
         * @property {number} epsilon - Initial epsilon for epsilon-greedy policy [0, 1]
         * @property {number} alpha - Value function learning rate
         * @property {number} experienceAddEvery - Number of time steps before we add another experience to replay memory
         * @property {number} experienceSize - Size of experience
         * @property {number} learningStepsPerIteration - Number of steps to go through during one tick
         * @property {number} tdErrorClamp - For robustness
         * @property {number} numHiddenUnits - Number of neurons in hidden layer
         */

        /**
         * Initialize the Agent
         * @name Agent
         * @extends Entity
         * @constructor
         *
         * @param {Vec} position - The x, y location
         * @param {agentOpts} opts - The Agent options
         * @returns {Agent}
         */
        constructor(position, opts) {
            // Is it a worker
            let worker = Utility.getOpt(opts, 'worker', false);
            super((worker ? 'Agent Worker' : 'Agent'), position, opts);

            this.worker = worker;
            // Just a text value for the brain type, also useful for worker posts
            this.brainType = Utility.getOpt(opts, 'brainType', 'RL.DQNAgent');
            this.numActions = Utility.getOpt(opts, 'numActions', 4);
            this.numTypes = Utility.getOpt(opts, 'numTypes', 3);
            this.numEyes = Utility.getOpt(opts, 'numEyes', 9);
            this.numProprioception = Utility.getOpt(opts, 'numProprioception', 0);
            this.range = Utility.getOpt(opts, 'range', 85);
            this.proximity = Utility.getOpt(opts, 'proximity', 85);
            // The number of Agent's eyes times the number of known types
            // plus the number of proprioception values it is tracking
            this.numStates = this.numEyes * this.numTypes + this.numProprioception;

            // Reward or punishment
            this.carrot = 1;
            this.stick = -1;

            this.action = null;
            this.avgReward = 0;
            this.lastReward = 0;
            this.digestionSignal = 0.0;
            this.epsilon = 0.000;

            this.nStepsHistory = [];
            this.nStepsCounter = 0;
            this.nflot = 1000;
            this.score = 0;
            this.pts = [];
            this.brain = {};
            this.brainState = {};

            // The Agent's actions
            this.actions = [];
            for (let i = 0; i < this.numActions; i++) {
                this.actions.push(i);
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

            // The Agent's environment
            this.env = Utility.getOpt(opts, 'env', {
                getNumStates: () => {
                    return this.numStates;
                },
                getMaxNumActions: () => {
                    return this.numActions;
                },
                startState: () => {
                    return 0;
                }
            });

            // The Agent's eyes
            if (this.eyes === undefined) {
                this.eyes = [];
                for (let k = 0; k < this.numEyes; k++) {
                    let eye = new Eye(k * 0.21, this);
                    this.eyes.push(eye);
                }
            }

            this.reset();

            return this;
        }

        /**
         * Agent's chance to act on the world
         * @returns {Agent}
         */
        act() {
            // in forward pass the agent simply behaves in the environment
            let ne = this.numEyes * this.numTypes,
                inputArray = new Array(this.numStates);
            for (let ae = 0, ne = this.numEyes; ae < ne; ae++) {
                let eye = this.eyes[ae];
                eye.sense(this);
                inputArray[ae * this.numTypes] = 1.0;
                inputArray[ae * this.numTypes + 1] = 1.0;
                inputArray[ae * this.numTypes + 2] = 1.0;
                inputArray[ae * this.numTypes + 3] = eye.sensed.velocity.x; // velocity information of the sensed target
                inputArray[ae * this.numTypes + 4] = eye.sensed.velocity.y;
                if (eye.sensed.type !== -1) {
                    // sensedType is 0 for wall, 1 for food and 2 for poison.
                    // lets do a 1-of-k encoding into the input array
                    inputArray[ae * this.numTypes + eye.sensed.type] = eye.sensed.proximity / eye.range; // normalize to [0,1]
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
        }

        /**
         * Draws it
         * @returns {Agent}
         */
        draw() {
            super.draw();
            // Loop through the eyes and check the walls and nearby entities
            for (let ae = 0, ne = this.numEyes; ae < ne; ae++) {
                this.eyes[ae].draw(this);
            }

            return this;
        }

        /**
         * Agent's chance to learn
         * @returns {Agent}
         */
        learn() {
            this.lastReward = this.digestionSignal;
            if (this.digestionSignal > 1) {
                console.log('digestionSignal is greater than 1');
            }
            // var proximity_reward = 0.0;
            // var num_eyes = this.eyes.length;
            // for(var i=0;i<num_eyes;i++) {
            //   var e = this.eyes[i];
            //   // agents dont like to see walls, especially up close
            //   proximity_reward += e.sensed_type === 0 ? e.sensed_proximity/e.max_range : 1.0;
            // }
            // proximity_reward = proximity_reward/num_eyes;
            // reward += proximity_reward;

            //var forward_reward = 0.0;
            //if(this.actionix === 0) forward_reward = 1;

            if (!this.worker) {
                this.brain.learn(this.lastReward);
                this.epsilon = this.brain.epsilon;
                this.digestionSignal = 0;
            } else {
                this.post('learn', this.lastReward);
            }

            return this;
        }

        /**
         * Load a pre-trained agent
         * @param {String} file
         * @returns {Agent}
         */
        load(file) {
            $.getJSON(file, (data) => {
                if (!this.worker) {
                    if (this.brain.valueNet !== undefined) {
                        this.brain.valueNet.fromJSON(data);
                    } else {
                        this.brain.fromJSON(data);
                    }
                    this.brain.epsilon = 0.05;
                    this.brain.alpha = 0;
                } else {
                    this.post('load', Utility.Strings.stringify(data));
                }
            });

            return this;
        }

        /**
         * Move around
         * @returns {Agent}
         */
        move() {
            for (let i = 0; i < this.collisions.length; i++) {
                let collisionObj = this.collisions[i];
                if (collisionObj.distance <= this.radius) {
                    switch (collisionObj.entity.type) {
                        case 0:
                            // Wall
                            this.position = this.oldPosition;
                            this.force.x = 0;
                            this.force.y = 0;
                            break;
                        case 1:
                            // Noms
                            this.digestionSignal += this.carrot;
                            collisionObj.entity.cleanUp = true;
                            break;
                        case 2:
                            // Gnars
                            this.digestionSignal += this.stick;
                            collisionObj.entity.cleanUp = true;
                            break;
                        case 3:
                        case 4:
                            // Other Agents
                            this.force.x = collisionObj.target.vx;
                            this.force.y = collisionObj.target.vy;
                            break;
                    }
                }
            }

            // Execute agent's desired action
            switch (this.action) {
                case 0: // Left
                    this.force.x += -this.speed * 0.95;
                    break;
                case 1: // Right
                    this.force.x += this.speed * 0.95;
                    break;
                case 2: // Up
                    this.force.y += -this.speed * 0.95;
                    break;
                case 3: // Down
                    this.force.y += this.speed * 0.95;
                    break;
            }

            // Forward the Agent by force
            this.oldPosition = this.position.clone();
            this.oldAngle = this.position.angle;

            this.position.vx = this.force.x;
            this.position.vy = this.force.y;
            this.position.advance(this.speed);
            this.direction = Utility.getDirection(this.position.direction);

            return this;
        }

        /**
         * Reset or set up the Agent
         * @returns {Agent}
         */
        reset() {
            var brain = this.brainType.split('.');
            // If it's a worker then we have to load it a bit different
            if (!this.worker) {
                this.brain = new global[brain[0]][brain[1]](this.env, this.brainOpts);

                return this;
            } else {
                this.post = (cmd, input) => {
                    this.brain.postMessage({target: this.brainType, cmd: cmd, input: input});
                };

                let jEnv = Utility.Strings.stringify(this.env),
                    jOpts = Utility.Strings.stringify(this.brainOpts);

                this.brain = new Worker('js/lib/external/rl.js');
                this.brain.onmessage = (e) => {
                    let data = e.data;
                    switch (data.cmd) {
                        case 'act':
                            if (data.msg === 'complete') {
                                this.action = data.input;
                                this.move();
                                this.learn();
                            }
                            break;
                        case 'init':
                            if (data.msg === 'complete') {
                                //
                            }
                            break;
                        case 'learn':
                            if (data.msg === 'complete') {
                                this.brainState = Utility.Strings.stringify(data.input);
                            }
                            break;
                        case 'load':
                            if (data.msg === 'complete') {
                                this.brainState = Utility.Strings.stringify(data.input);
                            }
                            break;
                        case 'save':
                            if (data.msg === 'complete') {
                                this.brainState = Utility.Strings.stringify(data.input);
                            }
                            break;
                        default:
                            console.log('Unknown command: ' + data.cmd + ' message:' + data.msg);
                            break;
                    }
                };

                this.post('init', {env: jEnv, opts: jOpts});
            }

            return this;
        }

        /**
         * Save the brain state
         * @returns {Agent}
         */
        save() {
            if (!this.worker) {
                this.brainState = Utility.Strings.stringify(this.brain.toJSON());
            } else {
                this.post('save');
            }

            return this;
        }

        /**
         * Tick the agent
         * @returns {Agent}
         */
        tick() {
            // Let the agents behave in the world based on their input
            this.act();

            // If it's not a worker we need to run the rest of the steps
            if (!this.worker) {
                // Move eet!
                this.move();
                // This is where the agents learns based on the feedback of their
                // actions on the environment
                this.learn();
            }
            this.draw();

            return this;
        }

    }
    global.Agent = Agent;

}(this));