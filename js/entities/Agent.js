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
		this.type = type || 3; // type of agent
		this.width = w || 20; // width of agent
		this.height = h || 20; // height of agent
		this.radius = r || 10; // default radius
		this.pos = v || new Vec(this.radius, this.radius); // position

		this.name = '';
		this.image = new Image();
		this.image.src = 'img/Agent.png';
		this.dragging = false;
		this.valid = false;

		// Remember the Agent's old position
		this.oldPos = this.pos;

		// The direction the Agent is facing
		this.angle = 0;

		// The number of item types the Agent's eys can see (wall, green, red thing proximity)
		this.numTypes = 4;

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

		/**
		 * What to do when clicked
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.click = function(e) {
			console.log('Agent Click');
		};

		/**
		 * What to do when right clicked
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.contextMenu = function(e) {
			console.log('Agent Right Click');
		};

		/**
		 * What to do when double clicked
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.doubleClick = function(e) {
			console.log('Agent Double Click');
		};

		/**
		 * What to do when dragged
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.drag = function(e) {
			console.log('Agent Drag');
		};

		/**
		 * What to do when dropped
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.drop = function(e) {
			console.log('Agent Drop');
		};

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
		},
		/**
		 * Check if there was a collision
		 * @param {Object} minRes
		 * @param {Vec} v1
		 * @param {Vec} v2
		 * @returns {unresolved}
		 */
		collisionCheck: function (minRes, v1, v2) {
			var iResult = Utility.linePointIntersect(v1, v2, this.pos, this.radius);
			if (iResult) {
				iResult.type = this.type; // Store type of item
				if (!minRes) {
					minRes = iResult;
				} else {
					if (iResult.vecX < minRes.vecX) {
						minRes = iResult;
					}
				}
			}
			return minRes;
		},
		/**
		 * Determine if a point is inside the shape's bounds
		 * @param {Vec} v
		 * @returns {Boolean}
		 */
		contains: function (v) {
			var result = this.pos.distFrom(v) < this.radius;

			return result;
		},
		/**
		 * Draw the Agent to the given context
		 * @param {CanvasRenderingContext2D} ctx
		 * @returns {undefined}
		 */
		draw: function (ctx) {
			var avgR = this.brain.avgRewardWindow.getAverage().toFixed(1);

			// Draw agents body
			if (this.image) {
				ctx.drawImage(this.image, this.pos.x - this.radius, this.pos.y - this.radius, this.width, this.height);
			} else {
				ctx.fillStyle = "rgb(150,150,150)";
				ctx.strokeStyle = "rgb(0,0,0)";
				ctx.beginPath();
				ctx.arc(this.oldPos.x, this.oldPos.y, this.radius, 0, Math.PI * 2, true);
				ctx.fill();
				ctx.fillText(this.name + " (" + avgR + ")", this.oldPos.x + this.radius, this.oldPos.y + this.radius);
				ctx.stroke();
			}

			// Draw agents sight
			for (var ei = 0, eye; eye = this.eyes[ei++];) {
				switch (eye.sensedType) {
					// Is it wall or nothing?
					case -1:case 0:
						ctx.strokeStyle = "rgb(0,0,0)";
						break;
					// It is noms
					case 1:
						ctx.strokeStyle = "rgb(255,150,150)";
						break;
					// It is gnar gnar
					case 2:
						ctx.strokeStyle = "rgb(150,255,150)";
						break;
					// Is it another Agent
					case 3:
						this.ctx.strokeStyle = "rgb(255,0,0)";
						break;
					default:
						this.ctx.strokeStyle = "rgb(0,255,0)";
				}

				var aEyeX = this.oldPos.x + eye.sensedProximity * Math.sin(this.oldAngle + eye.angle),
					aEyeY = this.oldPos.y + eye.sensedProximity * Math.cos(this.oldAngle + eye.angle);

				// Draw the agent's line of sights
				ctx.beginPath();
				ctx.moveTo(this.oldPos.x, this.oldPos.y);
				ctx.lineTo(aEyeX, aEyeY);
				ctx.stroke();
			}
		},
		/**
		 * Did we get Noms or Gnars
		 * @param {Item} item
		 * @returns {undefined}
		 */
		eat: function (world, item) {
			// Did the agent find teh noms?
			if (this.pos.distFrom(item.pos) < item.radius + this.radius) {
				// Check if it's on the other side of a wall
				if (!world.collisionCheck(this.pos, item.pos, true, false, false)) {
					// Nom Noms!
					switch (item.type) {
					case 1:// The sweet meats
						this.digestionSignal += 5.0 + (item.radius / 2);
						break;
					case 2:// The gnar gnar meats
						this.digestionSignal += -6.0 + (item.radius / 2);
						break;
					}
					return true;
					// Done consuming, move on
				}
			}
			return false;
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
				inputArray[i * 3 + 3] = 1.0;
				if (e.sensedType !== -1) {
					// sensedType is 0 for wall, 1 for food and 2 for poison, 3 for agent
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
		 * Load the brains from the field
		 * @returns {undefined}
		 */
		loadMemory: function (memory) {
			var brain = this.brain;
			$.getJSON(memory, function(data) {
				brain.value_net.fromJSON(data);
			});
		},
		/**
		 * Download the brains to the field
		 * @returns {undefined}
		 */
		saveMemory: function () {
			var j = this.brain.value_net.toJSON();
			this.memoryBank.value = JSON.stringify(j);
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
		/**
		 * Tick the agent
		 * @returns {undefined}
		 */
		tick: function (world) {
			for (var ei = 0, eye; eye = this.eyes[ei++];) {
				var X = this.pos.x + eye.maxRange * Math.sin(this.angle + eye.angle),
					Y = this.pos.y + eye.maxRange * Math.cos(this.angle + eye.angle),
					// We have a line from agent.pos to p->eyep
					result = world.collisionCheck(this.pos, new Vec(X, Y), true, true);
				if (result) {
					// eye collided with wall
					eye.sensedProximity = result.vecI.distFrom(this.pos);
					eye.sensedType = result.type;
				} else {
					eye.sensedProximity = eye.maxRange;
					eye.sensedType = -1;
				}
			}
			// Let the agents behave in the world based on their input
			this.forward();

			// Apply the outputs of agents on the environment
			this.oldPos = this.pos; // Back up the old position
			this.oldAngle = this.angle; // and angle

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
			if (world.collisionCheck(this.oldPos, this.pos, true, false)) {
				// The agent derped! Wall collision! Reset their position
				this.pos = this.oldPos;
			}

			// Handle boundary conditions
			if (this.pos.x < 0)
				this.pos.x = 0;
			if (this.pos.x > world.width)
				this.pos.x = world.width;
			if (this.pos.y < 0)
				this.pos.y = 0;
			if (this.pos.y > world.height)
				this.pos.y = world.height;

		}
	};

	global.Agent = Agent;

}(this));

