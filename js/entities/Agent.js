var Agent = Agent || {};

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

		this.shape = new PIXI.Graphics();
		this.shape.lineStyle(1, 0x000000);
	};

	/**
	 * A single agent
	 * @param {Number} type
	 * @param {Vec} v
	 * @param {Number} w
	 * @param {Number} h
	 * @param {Number} r
	 * @returns {Agent_L3.Agent}
	 */
	var Agent = function (type, v, w, h, r) {
		var _this = this;
		this.type = type || 3; // type of agent
		this.width = w || 20; // width of agent
		this.height = h || 20; // height of agent
		this.radius = r || 10; // default radius
		this.pos = v || new Vec(this.radius, this.radius); // position
		this.gridLocation = new Vec(0, 0);

		this.id = Utility.guid();

		// create a texture from an image path
		this.texture = PIXI.Texture.fromImage("img/Agent.png");
		// create a new Sprite using the texture
		this.sprite = new PIXI.Sprite(this.texture);
		this.sprite.width = this.width;
		this.sprite.height = this.height;

		// center the sprites anchor point
		this.sprite.anchor.x = 0.5;
		this.sprite.anchor.y = 0.5;

		// move the sprite t the center of the screen
		this.sprite.position.x = this.pos.x;
		this.sprite.position.y = this.pos.y;

		this.dragging = false;
		this.redraw = false;

		this.digested = [];

		// Remember the Agent's old position
		this.oldPos = this.pos;

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
		this.pts = [];

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
			brainOpts.num_states = this.numInputs;
			brainOpts.num_actions = this.numActions;
			brainOpts.temporal_window = this.temporalWindow;
			brainOpts.experience_size = 30000;
			brainOpts.start_learn_threshold = 1000;
			brainOpts.gamma = 0.7;
			brainOpts.learning_steps_total = 100000;
			brainOpts.learning_steps_burnin = 3000;
			brainOpts.epsilon_min = 0.05;
			brainOpts.epsilon_test_time = 0.05;
			brainOpts.layer_defs = layerDefs;
			brainOpts.tdtrainer_options = trainerOpts;

		this.brain = new Worker('js/entities/Brain.js');

		this.brain.addEventListener('message', function (e) {
			var data = e.data;
			switch (data.cmd) {
				case 'init':
					console.log('Init: ' + data.msg);
				break;
				case 'forward':
					// Get action from brain
					_this.actionIndex = data.input;

					//this.actionIndex = this.brain.forward(inputArray);
					var action = _this.actions[_this.actionIndex];

					// Demultiplex into behavior variables
					_this.rot1 = action[0] * 1;
					_this.rot2 = action[1] * 1;
					break;
				case 'backward':

					break;
				case 'getAverage':
					_this.pts = [];
					_this.pts.push(data.input);
					break;
				default:
					console.log('Unknown command: ' + data.msg);
			}
		}, false);

		this.brain.postMessage({cmd: 'init', options:brainOpts});
	};

	/**
	 * Agent prototype
	 * @type {Agent}
	 */
	Agent.prototype = {
		/**
		 * In backward pass agent learns.
		 * @returns {undefined}
		 */
		backward: function () {
			// Compute the reward
			var proximityReward = 0.0;
			for (var i = 0, e; e = this.eyes[i++];) {
				// Agents dont like to see walls, especially up close
				proximityReward += e.sensedType === 0 ? e.sensedProximity / e.maxRange : 1.0;
			}

			// Calculate the proximity reward
			proximityReward = proximityReward / this.numEyes;
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
			this.brain.postMessage({cmd:'backward', msg:'Backward', input:reward});
		},
		/**
		 * Determine if a point is inside the shape's bounds
		 * @param {Vec} v
		 * @returns {Boolean}
		 */
		contains: function (event, mouse) {
			return this.pos.distFrom(mouse.pos) < this.radius;;
		},
		/**
		 * In forward pass the agent simply behaves in the environment
		 * @returns {undefined}
		 */
		forward: function () {
			// Create input to brain
			var inputArray = new Array(this.numEyes * this.numTypes);

			for (var i = 0, e; e = this.eyes[i++];) {
				inputArray[i * 3] = 1.0;
				inputArray[i * 3 + 1] = 1.0;
				inputArray[i * 3 + 2] = 1.0;
				if (e.sensedType !== -1) {
					// sensedType is 0 for wall, 1 for food and 2 for poison
					// lets do a 1-of-k encoding into the input array
					inputArray[i * 3 + e.sensedType] = e.sensedProximity / e.maxRange; // normalize to [0,1]
				}
			}

			// Get action from brain
			this.brain.postMessage({cmd:'forward', msg:'Forward', input:inputArray});
		},
		/**
		 * Tick the agent
		 * @param {Array} cells
		 * @param {Array} walls
		 * @param {Array} entities
		 * @returns {undefined}
		 */
		tick: function (cells, walls, entities, width, height) {
			var avgR = this.brain.postMessage({cmd:'getAverage', msg:'getAverage'});
			for (var ei = 0, eye; eye = this.eyes[ei++];) {
				eye.shape.clear();
				var X = this.pos.x + eye.maxRange * Math.sin(this.angle + eye.angle),
					Y = this.pos.y + eye.maxRange * Math.cos(this.angle + eye.angle);
				// We have a line from agent.pos to p->eyep
				var result = Utility.collisionCheck(this.pos, new Vec(X, Y), walls, entities);
				if (result) {
					// eye collided with an entity
					eye.sensedProximity = result.vecI.distFrom(this.pos);
					eye.sensedType = result.type;
				} else {
					eye.sensedProximity = eye.maxRange;
					eye.sensedType = -1;
				}

				switch (eye.sensedType) {
					// Is it wall or nothing?
					case -1:case 0:
						eye.shape.lineStyle(0.5, 0x000000);
						break;
					// It is noms
					case 1:
						eye.shape.lineStyle(0.5, 0xFF0000);
						break;
					// It is gnar gnar
					case 2:
						eye.shape.lineStyle(0.5, 0x00FF00);
						break;
					// Is it another Agent
					case 3:
						eye.shape.lineStyle(0.5, 0xFAFAFA);
						break;
				}

				var aEyeX = this.oldPos.x + eye.sensedProximity * Math.sin(this.oldAngle + eye.angle),
					aEyeY = this.oldPos.y + eye.sensedProximity * Math.cos(this.oldAngle + eye.angle);

				// Draw the agent's line of sights
				eye.shape.moveTo(this.oldPos.x, this.oldPos.y);
				eye.shape.lineTo(aEyeX, aEyeY);
			}

			// Let the agents behave in the world based on their input
			this.forward();

			// Steer the agent according to outputs of wheel velocities
			var v = new Vec(0, this.radius / 2.0),
				v = v.rotate(this.angle + Math.PI / 2),
				w1pos = this.pos.add(v), // Positions of wheel 1
				w2pos = this.pos.sub(v), // Positions of wheel 2
				vv = this.pos.sub(w2pos),
				vv = vv.rotate(-this.rot1),
				vv2 = this.pos.sub(w1pos),
				vv2 = vv2.rotate(this.rot2),
				newPos = w2pos.add(vv),
				newPos2 = w1pos.add(vv2);

			newPos.scale(0.5);
			newPos2.scale(0.5);

			this.pos = newPos.add(newPos2);

			this.angle -= this.rot1;
			if (this.angle < 0)
				this.angle += 2 * Math.PI;

			this.angle += this.rot2;

			if (this.angle > 2 * Math.PI)
				this.angle -= 2 * Math.PI;

			// The agent is trying to move from pos to oPos so we need to check walls
			var derped = Utility.collisionCheck(this.oldPos, this.pos, walls);
			if (derped) {
				var d = this.pos.distFrom(derped.vecI);
				// The agent derped! Wall collision! Reset their position
				if (derped && d < this.radius) {
					this.pos = this.oldPos;
				}
			}

			// Handle boundary conditions
			if (this.pos.x < 2)
				this.pos.x = 2;
			if (this.pos.x > width)
				this.pos.x = width;
			if (this.pos.y < 2)
				this.pos.y = 2;
			if (this.pos.y > height)
				this.pos.y = height;

			this.sprite.position.x = this.pos.x;
			this.sprite.position.y = this.pos.y;

			// Apply the outputs of agents on the environment
			this.oldPos = this.pos; // Back up the old position
			this.oldAngle = this.angle; // and angle

			this.digested = [];
			for (var j=0,n=cells[this.gridLocation.x][this.gridLocation.y].population.length;j<n;j++) {
				var id = cells[this.gridLocation.x][this.gridLocation.y].population[j],
					entityIdx = entities.find(Utility.getId, id);
				if (entityIdx) {
					var dist = this.pos.distFrom(entityIdx.pos);
					if (entityIdx && dist < (entityIdx.radius + this.radius)) {
						var result = Utility.collisionCheck(this.pos, entityIdx.pos, walls);
						if (!result) {
							// Nom Noms!
							switch (entityIdx.type) {
								case 1:// The sweet meats
									this.digestionSignal += 5.0;
									break;
								case 2:// The gnar gnar meats
									this.digestionSignal += -6.0;
									break;
								default:
									this.digestionSignal = this.digestionSignal;
							}
							this.digested.push(entityIdx);
						} else {

						}
					}
				}
			}

			// This is where the agents learns based on the feedback of their
			// actions on the environment
			this.backward();
		},
		/**
		 * Load the brains from the field
		 * @returns {undefined}
		 */
		loadMemory: function () {
			var brain = this.brain;
			$.getJSON(document.getElementById('memoryBank'), function(data) {
				brain.value_net.fromJSON(data);
			});
		},
		/**
		 * Download the brains to the field
		 * @returns {undefined}
		 */
		saveMemory: function () {
			var j = this.brain.value_net.toJSON();
			document.getElementById('memoryBank').value = JSON.stringify(j);
		},
		/**
		 * Get to learninating
		 * @returns {undefined}
		 */
		startLearnin: function () {
			this.brain.learning = true;
		},
		/**
		 * Stop learninating
		 * @returns {undefined}
		 */
		stopLearnin: function () {
			this.brain.learning = false;
		},

		mouseClick: function(e, mouse) {
			console.log('Agent Click');
		},
		rightClick: function(e, mouse) {
			console.log('Agent Right Click');
		},
		doubleClick: function(e, mouse) {
			console.log('Agent Double Click');
		},
		mouseMove: function(e, mouse) {
			console.log('Agent Move');
		},
		mouseUp: function(e, mouse) {
			console.log('Agent Release');
		},
		mouseDrag: function(e, mouse) {
			console.log('Agent Drag');
		},
		mouseDrop: function(e, mouse) {
			console.log('Agent Drop');
		}
	};

	global.Agent = Agent;

}(this));

