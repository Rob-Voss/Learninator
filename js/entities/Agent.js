
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
var Agent = function () {
	// Remember the Agent's old position
	this.oldPos = this.pos;

	// The Agent's size
	this.rad = 5;

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

	// Properties
	this.rad = 10;
	this.eyes = [];
	for (var k = 0; k < 9; k++) {
		this.eyes.push(new Eye((k - 3) * 0.25));
	}

	// Braaains
	var num_inputs = 27; // 9 eyes, each sees 3 numbers (wall, green, red thing proximity)
	var num_actions = 5; // 5 possible angles agent can turn
	var temporal_window = 1; // amount of temporal memory. 0 = agent lives in-the-moment :)
	var network_size = num_inputs * temporal_window + num_actions * temporal_window + num_inputs;

	// the value function network computes a value of taking any of the possible actions
	// given an input state. Here we specify one explicitly the hard way
	// but user could also equivalently instead use opt.hidden_layer_sizes = [20,20]
	// to just insert simple relu hidden layers.
	var layer_defs = [];
	layer_defs.push({type: 'input', out_sx: 1, out_sy: 1, out_depth: network_size});
	layer_defs.push({type: 'fc', num_neurons: 50, activation: 'relu'});
	layer_defs.push({type: 'fc', num_neurons: 50, activation: 'relu'});
	layer_defs.push({type: 'regression', num_neurons: num_actions});

	// options for the Temporal Difference learner that trains the above net
	// by backpropping the temporal difference learning rule.
	var tdtrainer_options = {learning_rate: 0.001, momentum: 0.0, batch_size: 64, l2_decay: 0.01};

	var opt = {};
	opt.temporal_window = temporal_window;
	opt.experience_size = 30000;
	opt.start_learn_threshold = 1000;
	opt.gamma = 0.7;
	opt.learning_steps_total = 200000;
	opt.learning_steps_burnin = 3000;
	opt.epsilon_min = 0.05;
	opt.epsilon_test_time = 0.05;
	opt.layer_defs = layer_defs;
	opt.tdtrainer_options = tdtrainer_options;

//	var spec = document.getElementById('qspec').value;
//	eval(spec);
	this.brain = new deepqlearn.Brain(num_inputs, num_actions, opt); // woohoo

	this.rewardBonus = 0.0;
	this.digestionSignal = 0.0;

	// Agent outputs on the world
	this.rot1 = 0.0; // Rotation speed of 1st wheel
	this.rot2 = 0.0; // Rotation speed of 2nd wheel

	this.previousActionix = -1;
};

/**
 *
 * @type {Agent}
 */
Agent.prototype = {
	/**
	 * In forward pass the agent simply behaves in the environment
	 * @returns {undefined}
	 */
	forward: function () {
		// Create input to brain
		var numEyes = this.eyes.length,
				input_array = new Array(numEyes * 3);

		for (var i = 0; i < numEyes; i++) {
			var e = this.eyes[i];
			input_array[i * 3] = 1.0;
			input_array[i * 3 + 1] = 1.0;
			input_array[i * 3 + 2] = 1.0;
			if (e.sensedType !== -1) {
				// sensedType is 0 for wall, 1 for food and 2 for poison.
				// lets do a 1-of-k encoding into the input array
				input_array[i * 3 + e.sensedType] = e.sensedProximity / e.maxRange; // normalize to [0,1]
			}
		}

		// Get action from brain
		this.actionIndex = this.brain.forward(input_array);
		var action = this.actions[this.actionIndex];

		// Demultiplex into behavior variables
		this.rot1 = action[0] * 1;
		this.rot2 = action[1] * 1;

		//this.rot1 = 0;
		//this.rot2 = 0;
	},
	/**
	 * In backward pass agent learns.
	 * @returns {undefined}
	 */
	backward: function () {
		// Compute the reward
		var proximityReward = 0.0;
		var numEyes = this.eyes.length;
		for (var i = 0; i < numEyes; i++) {
			var e = this.eyes[i];
			// Agents dont like to see walls, especially up close
			proximityReward += e.sensedType === 0 ? e.sensedProximity / e.maxRange : 1.0;
		}
		proximityReward = proximityReward / numEyes;
		proximityReward = Math.min(1.0, proximityReward * 2);

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
