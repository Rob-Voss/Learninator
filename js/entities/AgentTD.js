var AgentTD = AgentTD || {},
    Agent = Agent || {};

(function (global) {
    "use strict";

    class AgentTD extends Agent {
        /**
         * Initialize the TD Agent
         * @name AgentTD
         * @extends Agent
         * @constructor
         *
         * @param {Vec} position - The x, y location
         * @param {agentOpts} opts - The Agent options
         * @returns {AgentTD}
         */
        constructor(position, opts) {
            super(position, opts);
            // Reward and Punishment
            this.carrot = +5;
            this.stick = -6;

            // The Agent's actions
            this.actions = [];
            this.actions.push([1, 1]); // Forward?
            this.actions.push([0.8, 1]); // Right?
            this.actions.push([1, 0.8]); // Left?
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
            this.tdTrainerOptions = {
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

            this.reset();

            return this;
        }

        /**
         * Agent's chance to act on the world
         */
        act(world) {
            // Create input to brain
            let inputArray = new Array(this.numEyes * this.numTypes);
            for (let i = 0; i < this.numEyes; i++) {
                inputArray[i * this.numTypes] = 1.0;
                inputArray[i * this.numTypes + 1] = 1.0;
                inputArray[i * this.numTypes + 2] = 1.0;
                if (this.eyes[i].sensedType !== -1) {
                    // sensedType is 0 for wall, 1 for food and 2 for poison lets do
                    // a 1-of-k encoding into the input array normalize to [0,1]
                    inputArray[i * this.numTypes + this.eyes[i].sensedType] = this.eyes[i].sensedProximity / this.eyes[i].maxRange;
                }
            }

            if (!this.worker) {
                // Get action from brain
                this.previousActionIdx = this.actionIndex;
                this.actionIndex = this.brain.forward(inputArray);
                let action = this.actions[this.actionIndex];

                // Demultiplex into behavior variables
                this.rot1 = action[0] * 1;
                this.rot2 = action[1] * 1;

                return this;
            } else {
                this.post('act', inputArray);
            }
        }

        /**
         * The agent learns
         */
        learn() {
            let proximityReward = 0.0,
                forwardReward = 0.0,
                digestionReward = this.digestionSignal,
                reward;
            this.lastReward = this.digestionSignal;

            // Compute the reward
            for (let ei = 0; ei < this.numEyes; ei++) {
                // Agents don't like to see walls, especially up close
                let wallReward = this.eyes[ei].sensedProximity / this.eyes[ei].maxRange;
                proximityReward += this.eyes[ei].sensedType === 0 ? wallReward : 1.0;
            }

            // Calculate the proximity reward
            proximityReward = Math.min(1.0, (proximityReward / this.numEyes) * 2);

            // Agents like to go straight forward
            if (this.actionIndex === 0 && proximityReward > 0.75) {
                forwardReward = 0.1 * proximityReward;
            }

            // Agents like to eat good things
            reward = proximityReward + forwardReward + digestionReward;
            this.digestionSignal = 0.0;

            // Pass to brain for learning
            if (!this.worker) {
                this.brain.backward(reward);
                this.pts.push(reward);
            } else {
                this.post('learn', reward);
            }

            return this;
        }

        /**
         * Agent's chance to move in the world
         * @param smallWorld
         */
        move(world) {
            this.oldPos = this.position.clone();
            this.oldAngle = this.angle;

            //Steer the agent according to outputs of wheel velocities
            let v = new Vec(0, this.radius / 2.0);
            v = v.rotate(this.oldAngle + Math.PI / 2);
            // Positions of wheel 1
            let w1pos = this.position.add(v),
            // Positions of wheel 2
                w2pos = this.position.sub(v);

            let vv = this.position.sub(w2pos);
            vv = vv.rotate(-this.rot1);

            let vv2 = this.position.sub(w1pos);
            vv2 = vv2.rotate(this.rot2);

            let newPos = w2pos.add(vv),
                newPos2 = w1pos.add(vv2);

            newPos.scale(0.5);
            newPos2.scale(0.5);
            let position = newPos.add(newPos2);

            this.position = position;

            this.angle -= this.rot1;
            if (this.angle < 0) {
                this.angle += 2 * Math.PI;
            }

            this.angle += this.rot2;
            if (this.angle > 2 * Math.PI) {
                this.angle -= 2 * Math.PI;
            }

            if (world.check(this)) {
                for (let i = 0; i < this.collisions.length; i++) {
                    let collObj = this.collisions[i];
                    if (collObj.type === 0) {
                        // Wall
                        this.position = this.oldPos.clone();
                        this.position.vx = 0;
                        this.position.vy = 0;
                    } else if (collObj.type === 1 || collObj.type === 2) {
                        // Noms or Gnars
                        this.digestionSignal += (collObj.type === 1) ? this.carrot : this.stick;
                        world.deleteEntity(collObj.id);
                    } else if (collObj.type === 3 || collObj.type === 4) {
                        // Other Agents
                        this.position.vx = collObj.target.vx;
                        this.position.vy = collObj.target.vy;
                        if (world.population.has(collObj.id)){
                            let entity = world.population.get(collObj.id);
                            entity.position.vy = collObj.entity.vy;
                            entity.position.vy = collObj.entity.vy;
                        }
                    }
                }
            }

            // Handle boundary conditions.. bounce Agent
            let top = world.height - (world.height - this.radius),
                bottom = world.height - this.radius,
                left = world.width - (world.width - this.radius),
                right = world.width - this.radius;
            if (this.position.x < left) {
                this.position.x = left;
                this.position.vx = 0;
                this.position.vy = 0;
            }

            if (this.position.x > right) {
                this.position.x = right;
                this.position.vx = 0;
                this.position.vy = 0;
            }

            if (this.position.y < top) {
                this.position.y = top;
                this.position.vx = 0;
                this.position.vy = 0;
            }

            if (this.position.y > bottom) {
                this.position.y = bottom;
                this.position.vx = 0;
                this.position.vy = 0;
            }

            this.direction = Utility.getDirection(this.angle);

            if (this.useSprite) {
                this.sprite.position.set(this.position.x, this.position.y);
                this.sprite.rotation = this.angle * 0.01745329252;
            }

            return this;
        }

        reset() {
            let _this = this;
            if (!this.worker) {
                this.brain = new TDBrain(this.brainOpts);
            } else {
                this.post = function (cmd, input) {
                    this.brain.postMessage({target: 'TD', cmd: cmd, input: input});
                };

                this.brain = new Worker('js/entities/TDBrain.js');
                this.brain.onmessage = function (e) {
                    let data = e.data;
                    switch (data.cmd) {
                        case 'init':
                            if (data.msg === 'complete') {

                            }
                            break;
                        case 'act':
                            if (data.msg === 'complete') {
                                _this.previousActionIdx = _this.actionIndex;
                                _this.actionIndex = data.input;
                                let action = _this.actions[_this.actionIndex];

                                // Demultiplex into behavior variables
                                _this.rot1 = action[0] * 1;
                                _this.rot2 = action[1] * 1;

                                _this.move();
                                _this.learn();
                            }
                            break;
                        case 'learn':
                            if (data.msg === 'complete') {
                                _this.pts.push(parseFloat(data.input));
                                _this.avgReward = parseFloat(data.input);
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
        }
    }

    global.AgentTD = AgentTD;

}(this));

