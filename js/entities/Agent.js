var Agent = Agent || {REVISION: '0.1'};

(function (global) {
	"use strict";

	/**
	 * Eye sensor has a maximum range and senses walls
	 * @param {Number} angle
	 * @returns {Eye}
	 */
	var Eye = function (angle) {
		this.angle = angle; // Angle relative to agent its on
		this.maxRange = 85; // Max range of the eye's vision
		this.sensedProximity = 85; // What the eye is seeing. will be set in world.tick()
		this.sensedType = -1; // what does the eye see?
	};

	/**
	 * A single agent
	 * @returns {Agent}
	 */
	Agent = function (radius) {
		// Remember the Agent's old position
		this.oldPos = this.pos;

		// The Agent's size
		this.rad = radius;

		// Positional information
		this.pos = new Vec(this.rad, this.rad);

		// The direction the Agent is facing
		this.angle = 0;

		// The number of item types the Agent's eys can see (wall, green, red thing proximity)
		this.numTypes = 3;

		// The number of Agent's eyes
		this.numEyes = 9;

		// The number of Agent's eyes, each one sees the number of knownTypes
		this.numInputs = this.numEyes * this.numTypes;

		// The number of possible angles the Agent can turn
		this.numActions = 5;

		// Amount of temporal memory. 0 = agent lives in-the-moment :)
		this.temporalWindow = 1;

		// Size of the network
		this.networkSize = this.numInputs * this.temporalWindow + this.numActions * this.temporalWindow + this.numInputs;

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

		this.rewardBonus = 0.0;
		this.digestionSignal = 0.0;

		// Agent outputs on the world
		this.rot1 = 0.0; // Rotation speed of 1st wheel
		this.rot2 = 0.0; // Rotation speed of 2nd wheel

		this.previousActionix = -1;

		/**
		 * The value function network computes a value of taking any of the possible actions
		 * given an input state.
		 *
		 * Here we specify one explicitly the hard way but we could also use
		 * opt.hidden_layer_sizes = [20,20] instead to just insert simple relu hidden layers.
		 * @type {Array}
		 */
		var layerDefs = [];
			layerDefs.push({type: 'input', out_sx: 1, out_sy: 1, out_depth: this.networkSize});
			layerDefs.push({type: 'fc', num_neurons: 50, activation: 'relu'});
			layerDefs.push({type: 'fc', num_neurons: 50, activation: 'relu'});
			layerDefs.push({type: 'regression', num_neurons: this.numActions});

		/**
		 * The options for the Temporal Difference learner that trains the above net
		 * by backpropping the temporal difference learning rule.
		 * @type {Object}
		 */
		var trainerOpts = {};
			trainerOpts.learning_rate = 0.001;
			trainerOpts.momentum = 0.0;
			trainerOpts.batch_size = 64;
			trainerOpts.l2_decay = 0.01;

		/**
		 * Options for the Brain
		 * @type {Object}
		 */
		var brainOpts = {};
			brainOpts.temporal_window = this.temporalWindow;
			brainOpts.experience_size = 30000;
			brainOpts.start_learn_threshold = 1000;
			brainOpts.gamma = 0.7;
			brainOpts.learning_steps_total = 200000;
			brainOpts.learning_steps_burnin = 3000;
			brainOpts.epsilon_min = 0.05;
			brainOpts.epsilon_test_time = 0.05;
			brainOpts.layer_defs = layerDefs;
			brainOpts.tdtrainer_options = trainerOpts;

		this.brain = new Brain(this.numInputs, this.numActions, brainOpts); // woohoo
	};

	/**
	 * Agent prototype
	 * @type {Agent}
	 */
	Agent.prototype = {
		/**
		 * In forward pass the agent simply behaves in the environment
		 * @returns {undefined}
		 */
		forward: function () {
			// Create input to brain
			var inputArray = new Array(this.numEyes * this.numTypes);

			for (var i = 0; i < this.numEyes; i++) {
				var e = this.eyes[i];
				inputArray[i * 3] = 1.0;
				inputArray[i * 3 + 1] = 1.0;
				inputArray[i * 3 + 2] = 1.0;
				if (e.sensedType !== -1) {
					// sensedType is 0 for wall, 1 for food and 2 for poison.
					// lets do a 1-of-k encoding into the input array
					inputArray[i * 3 + e.sensedType] = e.sensedProximity / e.maxRange; // normalize to [0,1]
				}
			}

			// Get action from brain
			this.actionIndex = this.brain.forward(inputArray);
			var action = this.actions[this.actionIndex];

			// Demultiplex into behavior variables
			this.rot1 = action[0] * 1;
			this.rot2 = action[1] * 1;
		},
		/**
		 * In backward pass agent learns.
		 * @returns {undefined}
		 */
		backward: function () {
			// Compute the reward
			var proximityReward = 0.0;
			for (var i = 0; i < this.numEyes; i++) {
				var e = this.eyes[i];
				// Agents dont like to see walls, especially up close
				proximityReward += e.sensedType === 0 ? e.sensedProximity / e.maxRange : 1.0;
			}

			// Calculate the proximity reward
			var rewardPerEye = 0.0;
			rewardPerEye = proximityReward / this.numEyes;
			proximityReward = Math.min(1.0, rewardPerEye * 2);

			// Agents like to go straight forward
			var forwardReward = 0.0;
			if (this.actionIndex === 0 && proximityReward > 0.75)
				forwardReward = 0.1 * proximityReward;

			// agents like to eat good things
			var digestionReward = this.digestionSignal;
			this.digestionSignal = 0.0;

			var reward = proximityReward + forwardReward + digestionReward;

			// pass to brain for learning
			this.brain.backward(reward);
		}
	};

	global.Agent = Agent;
	
}(this));

