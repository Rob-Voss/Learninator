(function (global) {
    "use strict";

    class AgentDQN extends Agent {

        /**
         * Initialize the DQN Agent
         * @param position
         * @param grid
         * @param options
         * @returns {AgentDQN}
         */
        constructor(position, grid, options) {
            super(position, grid, options);

            this.carrot = +1;
            this.stick = -1;

            // The number of item types the Agent's eys can see (wall, green, red thing proximity)
            this.numTypes = 5;

            // The number of Agent's eyes
            this.numEyes = 30;

            // The number of Agent's eyes, each one sees the number of knownTypes + the two velocity inputs
            this.numStates = this.numEyes * this.numTypes + 2;

            // The Agent's eyes
            this.eyes = [];
            for (var k = 0; k < this.numEyes; k++) {
                this.eyes.push(new Eye(k * 0.21));
            }

            // The Agent's actions
            this.actions = [];
            this.actions.push(0);
            this.actions.push(1);
            this.actions.push(2);
            this.actions.push(3);

            // The number of possible angles the Agent can turn
            this.numActions = this.actions.length;

            var _this = this;

            var env = {};
            env.getNumStates = function () {
                return _this.numStates;
            };
            env.getMaxNumActions = function () {
                return _this.numActions;
            };

            this.brainOpts = {
                update: 'qlearn', // qlearn | sarsa
                gamma: 0.9, // discount factor, [0, 1)
                epsilon: 0.2, // initial epsilon for epsilon-greedy policy, [0, 1)
                alpha: 0.005, // value function learning rate
                experience_add_every: 5, // number of time steps before we add another experience to replay memory
                experience_size: 10000, // size of experience
                learning_steps_per_iteration: 5,
                tderror_clamp: 1.0, // for robustness
                num_hidden_units: 100 // number of neurons in hidden layer
            };

            this.brain = new RL.DQNAgent(env, this.brainOpts);
            this.load('js/wateragent.json');

            return _this;
        }

        /**
         * Agent's chance to act on the world
         */
        act() {
            // in forward pass the agent simply behaves in the environment
            var ne = this.numEyes * this.numTypes;
            var inputArray = new Array(this.numStates);
            for (var i = 0; i < this.numEyes; i++) {
                var eye = this.eyes[i];
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
        }

        /**
         * Agent's chance to learn
         */
        learn() {
            this.lastReward = this.digestionSignal; // for vis
            this.brain.learn(this.digestionSignal);
        }

        /**
         * Agent's chance to move in the world
         * @param smallWorld
         */
        move(smallWorld) {
            // execute agent's desired action
            var speed = 1;
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

            // forward the agent by velocity
            this.position.vx *= 0.95;
            this.position.vy *= 0.95;
        }

    }

    global.AgentDQN = AgentDQN;

}(this));

