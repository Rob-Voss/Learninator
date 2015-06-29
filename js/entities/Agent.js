(function (global) {
    "use strict";

    class Agent extends Interactive {
        /**
         * Initialize the Agent
         * @param type
         * @param interactive
         * @param display
         * @returns {AgentDQN}
         */
        constructor(type, interactive, display) {
            super();

            this.id = Utility.guid();
            this.type = 3;
            this.brainType = type;
            this.name = type + ' Agent';
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
            this.oldPos = this.position.clone();

            // Remember the Agent's old angle
            this.oldAngle = this.angle;

            var _this = this;

            // PIXI gewdness
            this.texture = PIXI.Texture.fromImage("img/Agent.png");
            this.sprite = new PIXI.Sprite(this.texture);
            this.sprite.texture.baseTexture.on('loaded', function () {

            });

            super.init(_this);
            this.loadBrain(type);

            return this;
        }

        /**
         * Load braaaiins
         * @param type
         */
        loadBrain() {
            var _this = this;

            switch (this.brainType) {
                case 'RLTD':
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
                    this.load('js/mazeagent.json');
                    break;

                case 'DQN':
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
                    brainOptsDQN.num_hidden_units = 100 // number of neurons in hidden layer

                    this.brainOpts = brainOptsDQN;
                    this.brain = new RL.DQNAgent(env, this.brainOpts);
                    this.load('js/wateragent.json');

                    break;
            }
        }

        /**
         * Load a pretrained agent
         * @param file
         */
        load(file) {
            var _Brain = this.brain;
            Utility.loadJSON(file, function (data) {
                _Brain.fromJSON(JSON.parse(data));
                _Brain.epsilon = 0.05;
                _Brain.alpha = 0;
            });
        }

        /**
         * Tick the agent
         * @param {Object} smallWorld
         */
        tick(smallWorld) {
            this.oldPos = this.position.clone();
            this.oldAngle = this.angle;

            // Loop through the eyes and check the walls and nearby entities
            for (var e = 0; e < this.numEyes; e++) {
                this.eyes[e].sense(this, smallWorld.walls, smallWorld.entities);
            }

            // Let the agents behave in the world based on their input
            this.act();

            // Move the agent
            this.move(smallWorld);

            // Loop through the eyes and draw them
            for (var ei = 0; ei < this.numEyes; ei++) {
                this.eyes[ei].draw(this);
            }

            // Check for food
            // Gather up all the entities nearby based on cell population
            this.digested = [];
            var cell = smallWorld.grid.getCellAt(this.gridLocation.x, this.gridLocation.y);
            for (var j = 0; j < cell.population.length; j++) {
                var entity = smallWorld.entities.find(Utility.getId, cell.population[j]);
                if (entity) {
                    var dist = this.position.distanceTo(entity.position);
                    if (dist < entity.radius + this.radius) {
                        var result = Utility.collisionCheck(this.position, entity.position, smallWorld.walls);
                        if (!result) {
                            this.digestionSignal += (entity.type === 1) ? this.stick : this.carrot;
                            this.digested.push(entity);
                            entity.cleanup = true;
                        }
                    }
                }
            }

            // This is where the agents learns based on the feedback of their actions on the environment
            this.learn();

            if (this.digested.length > 0) {
                switch (this.type) {
                    case 'TD':
                        this.pts.push(this.brain.average_reward_window.getAverage().toFixed(1));
                        break;
                    case 'DQN':
                        if (this.digested.length > 0) {
                            this.pts.push(this.lastReward * 0.999 + this.lastReward * 0.001);
                        }
                        break;
                }

            }
        }
    }

    global.Agent = Agent;

}(this));

