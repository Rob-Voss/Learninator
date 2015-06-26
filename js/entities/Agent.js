(function (global) {
    "use strict";

    /**
     * A single agent
     * @returns {Agent_L3.Agent}
     */
    class Agent extends Interactive {
        constructor(interactive, display) {
            super();

            this.id = Utility.guid();
            this.type = 3;
            this.name = 'TD Agent';
            this.camera = (display) ? new Camera(display, 320, 0.8) : undefined;
            this.gridLocation = new Cell(0, 0);
            this.position = new Vec(5, 5);
            this.width = 20;
            this.height = 20;
            this.radius = 10;
            this.angle = 0;
            this.rot1 = 0.0;
            this.rot2 = 0.0;
            this.lastReward = 0;
            this.digestionSignal = 0.0;
            this.rewardBonus = 0.0;
            this.previousActionIdx = -1;
            this.pts = [];
            this.digested = [];
            this.direction = 'N';
            this.interactive = interactive || false;
            this.collision = true;

            // Remember the Agent's old position
            this.oldPos = this.position;

            // Remember the Agent's old angle
            this.oldAngle = this.angle;

            // PIXI gewdness
            this.texture = PIXI.Texture.fromImage("img/Agent.png");
            this.sprite = new PIXI.Sprite(this.texture);
            this.sprite.width = this.width;
            this.sprite.height = this.height;
            this.sprite.anchor.set(0.5, 0.5);
            this.sprite.position.set(this.position.x, this.position.y);
            this.sprite.interactive = this.interactive;

            var _this = this;

            if (this.interactive === true) {
                this.sprite
                    .on('mousedown', super.onDragStart)
                    .on('touchstart', super.onDragStart)
                    .on('mouseup', super.onDragEnd)
                    .on('mouseupoutside', super.onDragEnd)
                    .on('touchend', super.onDragEnd)
                    .on('touchendoutside', super.onDragEnd)
                    .on('mouseover', super.onMouseOver)
                    .on('mouseout', super.onMouseOut)
                    .on('mousemove', super.onDragMove)
                    .on('touchmove', super.onDragMove);
                this.sprite.entity = _this;
            }

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
            for (var k=0; k<this.numEyes; k++) {
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

            this.loadBrain('TD');

            return this;
        }

        loadBrain(type) {
            switch (type) {
                case 'RLTD':
                    var env = {};
                    env.getNumStates = function () {
                        return _this.numStates;
                    };
                    env.getMaxNumActions = function () {
                        return _this.numActions;
                    };
                    env.allowedActions = function (s) {
                        var x = this.stox(s), y = this.stoy(s), as = [];
                        if (x > 0) {
                            as.push(0);
                        }
                        if (y > 0) {
                            as.push(1);
                        }
                        if (y < 700 - 1) {
                            as.push(2);
                        }
                        if (x < 700 - 1) {
                            as.push(3);
                        }
                        return as;
                    };
                    env.stox = function (s) {
                        return Math.floor(s / 700);
                    };
                    env.stoy = function (s) {
                        return s % 700;
                    };
                    env.xytos = function (x, y) {
                        return x * 700 + y;
                    };
                    env.randomState = function () {
                        return Math.floor(Math.random() * this.numStates);
                    };
                    env.startState = function () {
                        return 0;
                    };

                    var brainOptsRLTD = {};
                    brainOptsRLTD.update = 'qlearn'; // 'qlearn' or 'sarsa'
                    brainOptsRLTD.gamma = 0.9; // discount factor, [0, 1)
                    brainOptsRLTD.epsilon = 0.2; // initial epsilon for epsilon-greedy policy, [0, 1)
                    brainOptsRLTD.alpha = 0.1; // value function learning rate
                    brainOptsRLTD.lambda = 0; // eligibility trace decay, [0,1). 0 = no eligibility traces
                    brainOptsRLTD.replacing_traces = true; // use replacing or accumulating traces
                    brainOptsRLTD.planN = 50; // number of planning steps per iteration. 0 = no planning
                    brainOptsRLTD.smooth_policy_update = true; // non-standard, updates policy smoothly to follow max_a Q
                    brainOptsRLTD.beta = 0.1; // learning rate for smooth policy update

                    this.brainOpts = brainOptsRLTD;
                    this.brain = new RL.TDAgent(env, brainOptsTD);
                    break;

                case 'TD':
                    /**
                     * The value function network computes a value of taking any of the possible actions
                     * given an input state.
                     *
                     * Here we specify one explicitly the hard way but we could also use
                     * opt.hidden_layer_sizes = [20,20] instead to just insert simple relu hidden layers.
                     * @type {Array}
                     */
                    var layerDefsTD = [];
                    layerDefsTD.push({type: 'input', out_sx: 1, out_sy: 1, out_depth: this.networkSize});
                    layerDefsTD.push({type: 'fc', num_neurons: 50, activation: 'relu'});
                    layerDefsTD.push({type: 'fc', num_neurons: 50, activation: 'relu'});
                    layerDefsTD.push({type: 'regression', num_neurons: this.numActions});

                    /**
                     * The options for the Temporal Difference learner that trains the above net
                     * by backpropping the temporal difference learning rule.
                     * @type {Object}
                     */
                    var trainerOptsTD = {};
                    trainerOptsTD.learning_rate = 0.001;
                    trainerOptsTD.momentum = 0.0;
                    trainerOptsTD.batch_size = 64;
                    trainerOptsTD.l2_decay = 0.01;

                    /**
                     * Options for the Brain
                     * @type {Object}
                     */
                    var brainOptsTD = {};
                    brainOptsTD.num_states = this.numStates;
                    brainOptsTD.num_actions = this.numActions;
                    brainOptsTD.temporal_window = this.temporalWindow;
                    brainOptsTD.experience_size = 30000;
                    brainOptsTD.start_learn_threshold = 1000;
                    brainOptsTD.gamma = 0.7;
                    brainOptsTD.learning_steps_total = 200000;
                    brainOptsTD.learning_steps_burnin = 3000;
                    brainOptsTD.epsilon_min = 0.05;
                    brainOptsTD.epsilon_test_time = 0.05;
                    brainOptsTD.layer_defs = layerDefsTD;
                    brainOptsTD.tdtrainer_options = trainerOptsTD;

                    this.brainOpts = brainOptsTD;
                    this.brain = new Brain(this.brainOpts);
                    break;

                case 'DQN':
                    var env = {};
                    env.getNumStates = function () {
                        return _this.numStates;
                    };
                    env.getMaxNumActions = function () {
                        return _this.numActions;
                    };

                    var brainOptsDQN = {};
                    brainOptsDQN.update = 'qlearn'; // qlearn | sarsa
                    brainOptsDQN.gamma = 0.9; // discount factor, [0, 1)
                    brainOptsDQN.epsilon = 0.2; // initial epsilon for epsilon-greedy policy, [0, 1)
                    brainOptsDQN.alpha = 0.005; // value function learning rate
                    brainOptsDQN.experience_add_every = 5; // number of time steps before we add another experience to replay memory
                    brainOptsDQN.experience_size = 10000; // size of experience
                    brainOptsDQN.learning_steps_per_iteration = 5;
                    brainOptsDQN.tderror_clamp = 1.0; // for robustness
                    brainOptsDQN.num_hidden_units = 100; // number of neurons in hidden layer

                    this.brainOpts = brainOptsDQN;
                    this.brain = new RL.DQNAgent(env, this.brainOpts);
                    break;
            }
        }

        /**
         * The agent simply behaves in the environment
         * @returns {undefined}
         */
        act() {
            // Create input to brain
            var inputArray = new Array(this.numEyes * this.numTypes);

            for (var i=0; i<this.numEyes; i++) {
                var eye = this.eyes[i];
                for (var nt=0; nt<this.numTypes; nt++) {
                    inputArray[i * this.numTypes + nt] = 1.0;
                    if (eye.sensedType !== -1) {
                        // sensedType is 0 for wall, 1 for food and 2 for poison lets do
                        // a 1-of-k encoding into the input array normalize to [0,1]
                        inputArray[i * this.numTypes + eye.sensedType] = eye.sensedProximity / eye.maxRange;
                    }
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
            for (var ei=0; ei<this.numEyes; ei++) {
                var eye = this.eyes[ei];
                // Agents dont like to see walls, especially up close
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

        move(smallWorld) {
            this.oldPos = this.position.clone();
            this.oldAngle = this.angle;

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
            this.position.ceil();

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
                    this.position = this.oldPos;
                }
            }

            // Handle boundary conditions.. bounce agent
            Utility.boundaryCheck(this, smallWorld.width, smallWorld.height);

            this.sprite.rotation = -this.angle;
            this.direction = Utility.getDirection(this.angle);
        }

        /**
         * Tick the agent
         * @param {Object} smallWorld
         * @returns {undefined}
         */
        tick(smallWorld) {
            // Loop through the eyes and check the walls and nearby entities
            for (var e=0; e<this.numEyes; e++) {
                this.eyes[e].sense(this, smallWorld.walls, smallWorld.entities);
            }

            // Let the agents behave in the world based on their input
            this.act();

            // Move the agent
            this.move(smallWorld);

            // Loop through the eyes and draw them
            for (var ei=0; ei<this.numEyes; ei++) {
                this.eyes[ei].draw(this);
            }

            // Check for food
            // Gather up all the entities nearby based on cell population
            this.digested = [];
            for (var j=0; j<this.gridLocation.population.length; j++) {
                var entity = smallWorld.entities.find(Utility.getId, this.gridLocation.population[j]);
                if (entity) {
                    var dist = this.position.distanceTo(entity.position);
                    if (dist < entity.radius + this.radius) {
                        var result = Utility.collisionCheck(this.position, entity.position, smallWorld.walls);
                        if (!result) {
                            this.digestionSignal += (entity.type === 1) ? 5.0 : -6.0;
                            this.digested.push(entity);
                            entity.cleanup = true;
                        }
                    }
                }
            }

            // This is where the agents learns based on the feedback of their actions on the environment
            this.learn();

            if (this.digested.length > 0) {
                this.pts.push(this.brain.average_reward_window.getAverage().toFixed(1));
            }
        }
    }

    global.Agent = Agent;

}(this));

