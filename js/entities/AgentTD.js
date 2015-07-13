(function (global) {
    "use strict";

    class AgentTD extends Agent {

        /**
         * Initialize the TD Agent
         * @param position
         * @param grid
         * @param opts
         * @returns {AgentDQN}
         */
        constructor(position, grid, opts) {
            super(position, grid, opts);

            this.carrot = +5;
            this.stick = -6;

            // The number of item types the Agent's eyes can see (wall, green, red thing proximity)
            this.numTypes = 3;

            // The number of Agent's eyes
            this.numEyes = 9;

            // The number of Agent's eyes, each one sees the number of knownTypes
            this.numStates = this.numEyes * this.numTypes;

            // Amount of temporal memory. 0 = agent lives in-the-moment :)
            this.temporalWindow = 1;

            // The Agent's eyes
            this.eyes = [];
            for (var k = 0; k < this.numEyes; k++) {
                this.eyes.push(new Eye((k - this.numTypes) * 0.25));
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
            var layerDefsTD = [];
            layerDefsTD.push({type: 'input', outSx: 1, outSy: 1, outDepth: this.networkSize});
            layerDefsTD.push({type: 'fc', numNeurons: 50, activation: 'relu'});
            layerDefsTD.push({type: 'fc', numNeurons: 50, activation: 'relu'});
            layerDefsTD.push({type: 'regression', numNeurons: this.numActions});

            /**
             * The options for the Temporal Difference learner that trains the above net
             * by backpropping the temporal difference learning rule.
             * @type {Object}
             */
            var trainerOptsTD = {};
            trainerOptsTD.learningRate = 0.001;
            trainerOptsTD.momentum = 0.0;
            trainerOptsTD.batchSize = 64;
            trainerOptsTD.l2Decay = 0.01;

            /**
             * Options for the Brain
             * @type {Object}
             */
            var brainOptsTD = {};
            brainOptsTD.numStates = this.numStates;
            brainOptsTD.numActions = this.numActions;
            brainOptsTD.temporalWindow = this.temporalWindow;
            brainOptsTD.experienceSize = 30000;
            brainOptsTD.startLearnThreshold = 1000;
            brainOptsTD.gamma = 0.7;
            brainOptsTD.learningStepsTotal = 200000;
            brainOptsTD.learningStepsBurnin = 3000;
            brainOptsTD.epsilonMin = 0.05;
            brainOptsTD.epsilonTestTime = 0.05;
            brainOptsTD.layerDefs = layerDefsTD;
            brainOptsTD.tdTrainerOpts = trainerOptsTD;

            this.brainOpts = brainOptsTD;
            this.brain = new Brain(this.brainOpts);
            //this.load('js/mazeagent.json');

            var _this = this;

            return _this;
        }

        /**
         * Agent's chance to act on the world
         */
        act() {
            // Create input to brain
            var inputArray = new Array(this.numEyes * this.numTypes);
            for (var i = 0; i < this.numEyes; i++) {
                var eye = this.eyes[i];
                inputArray[i * this.numTypes + 0] = 1.0;
                inputArray[i * this.numTypes + 1] = 1.0;
                inputArray[i * this.numTypes + 2] = 1.0;
                if (eye.sensedType !== -1) {
                    // sensedType is 0 for wall, 1 for food and 2 for poison lets do
                    // a 1-of-k encoding into the input array normalize to [0,1]
                    inputArray[i * this.numTypes + eye.sensedType] = eye.sensedProximity / eye.maxRange;
                }
            }

            // Get action from brain
            this.previousActionIdx = this.actionIndex;
            this.actionIndex = this.brain.forward(inputArray);

            // Demultiplex into behavior variables
            this.rot1 = this.actions[this.actionIndex][0] * 1;
            this.rot2 = this.actions[this.actionIndex][1] * 1;
        }

        /**
         * The agent learns
         * @returns {undefined}
         */
        learn() {
            // Compute the reward
            var proximityReward = 0.0;
            for (var ei = 0; ei < this.numEyes; ei++) {
                var eye = this.eyes[ei];
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
            this.brain.backward(reward);
        }

        /**
         * Agent's chance to move in the world
         * @param smallWorld
         */
        move(smallWorld) {
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
                var result = Utility.collisionCheck(this.oldPos, this.position, smallWorld.walls);
                if (result) {
                    // The agent derped! Wall collision! Reset their position
                    this.position = this.oldPos.clone();
                }
            }

            //this.position.round();
            //this.position.advance();

            this.sprite.rotation = -this.angle;
            this.direction = Utility.getDirection(this.angle);

            // Handle boundary conditions.. bounce agent
            Utility.boundaryCheck(this, smallWorld.width, smallWorld.height);
        }

    }

    global.AgentTD = AgentTD;

}(this));

