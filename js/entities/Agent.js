var Agent = Agent || {};
var Utility = Utility || {};
var PIXI = PIXI || {};

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
		this.id = Utility.guid();
		this.type = 3; // type of agent
		this.worker = (type === 'Worker') ? true : false;
		this.pos = v || new Vec(1, 1); // position
		this.gridLocation = new Vec(0, 0);
		this.width = w || 20; // width of agent
		this.height = h || 20; // height of agent
		this.radius = r || 10; // default radius

		// create a texture from an image path
		this.texture = PIXI.Texture.fromImage("img/Agent.png");
		// create a new Sprite using the texture
		this.sprite = new PIXI.Sprite(this.texture);
		this.sprite.tint = (this.worker ? 0x0000FF : 0xFF0000);
		// Add in interactivity
		this.sprite.interactive = true;
		this.sprite
			.on('mousedown', this.onMouseClick)
			.on('touchstart', this.onMouseClick)
			// set the mouseup and touchend callback...
			.on('mouseup', this.onMouseUp)
			.on('mouseupoutside', this.onMouseUp)
			.on('touchend', this.onMouseUp)
			.on('touchendoutside', this.onMouseUp)
			// set the mouseover callback...
			.on('mouseover', this.onMouseOver)
			// set the mouseout callback...
			.on('mouseout', this.onMouseOut)
			// events for drag move
			.on('mousemove', this.onDragMove)
			.on('touchmove', this.onDragMove);

		this.sprite.width = this.width;
		this.sprite.height = this.height;

		// center the sprites anchor point
		this.sprite.anchor.set(0.5, 0.5);

		// move the sprite t the center of the screen
		this.sprite.position.x = this.pos.x;
		this.sprite.position.y = this.pos.y;

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

		this.previousActionIdx = -1;

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
			brainOpts.learning_steps_total = 200000;
			brainOpts.learning_steps_burnin = 3000;
			brainOpts.epsilon_min = 0.05;
			brainOpts.epsilon_test_time = 0.05;
			brainOpts.layer_defs = layerDefs;
			brainOpts.tdtrainer_options = trainerOpts;

		var _this = this;

		if (this.worker) {
			this.brain = new Worker('js/entities/Brain.js');
			this.brain.addEventListener('message', function (e) {
				var data = e.data;
				switch (data.cmd) {
					case 'init':
						if (data.msg === 'load') {
							_this.loadMemory();
						}
					break;
					case 'forward':
						_this.previousActionIdx = _this.actionIndex;
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
						_this.pts.push(data.input);
						break;
					default:
						console.log('Unknown command: ' + data.cmd + ' message:' + data.msg);
				}
			}, false);

			this.brain.postMessage({cmd:'init', msg:'Start', input:brainOpts});
		} else {
			this.brain = new Brain(brainOpts);
		}
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
			for (var ei = 0; ei < this.numEyes; ei++) {
				var e = this.eyes[ei];
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
			if (this.worker) {
				// pass to brain for learning
				this.brain.postMessage({cmd:'backward', msg:'Backward', input:reward});
			} else {
				this.brain.backward(reward);
			}
		},
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
					// sensedType is 0 for wall, 1 for food and 2 for poison
					// lets do a 1-of-k encoding into the input array
					inputArray[i * 3 + e.sensedType] = e.sensedProximity / e.maxRange; // normalize to [0,1]
				}
			}

			if (this.worker) {
				// Get action from brain
				this.brain.postMessage({cmd:'forward', msg:'Forward', input:inputArray});
			} else {
				this.previousActionIdx = this.actionIndex;
				var actionIdx = this.brain.forward(inputArray),
					action = this.actions[actionIdx];
				// Get action from brain
				this.actionIndex = actionIdx;

				// Demultiplex into behavior variables
				this.rot1 = action[0] * 1;
				this.rot2 = action[1] * 1;
			}
		},
		/**
		 * Tick the agent
		 * @param {Object} smallWorld
		 * @returns {undefined}
		 */
		tick: function (smallWorld) {				
			this.oldPos = this.pos; // Back up the old position
			this.oldAngle = this.angle; // and angle

			// Loop through the eyes and check the walls and nearby entities
			for (var ei = 0; ei < this.numEyes; ei++) {
				var eye = this.eyes[ei];
				eye.shape.clear();
				var X = this.pos.x + eye.maxRange * Math.sin(this.angle + eye.angle),
					Y = this.pos.y + eye.maxRange * Math.cos(this.angle + eye.angle);
				// We have a line from agent.pos to p->eyep
				var result = Utility.collisionCheck(this.pos, new Vec(X, Y), smallWorld.walls, smallWorld.entities);
				if (result) {
					// eye collided with an entity
					eye.sensedProximity = result.vecI.distFrom(this.pos);
					eye.sensedType = result.type;
				} else {
					eye.sensedProximity = eye.maxRange;
					eye.sensedType = -1;
				}
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
			this.sprite.rotation = -this.angle;
			
			// The agent is trying to move from pos to oPos so we need to check walls
			var derped = Utility.collisionCheck(this.oldPos, this.pos, smallWorld.walls);
			if (derped) {
				var d = this.pos.distFrom(derped.vecI);
				// The agent derped! Wall collision! Reset their position
				if (derped && d <= this.radius) {
					this.pos = this.oldPos;
				}
			}

			// Handle boundary conditions
			if (this.pos.x < 2)
				this.pos.x = 2;
			if (this.pos.x > smallWorld.width)
				this.pos.x = smallWorld.width;
			if (this.pos.y < 2)
				this.pos.y = 2;
			if (this.pos.y > smallWorld.height)
				this.pos.y = smallWorld.height;

			this.sprite.position.x = this.pos.x;
			this.sprite.position.y = this.pos.y;

			// Gather up all the entities nearby based on cell population
			var nearby = [],
				cell = Utility.getGridLocation(this, smallWorld.grid, smallWorld.cellW, smallWorld.cellH);
			for (var i = 0; i < cell.population.length; i++) {
				var id = cell.population[i],
					entity = smallWorld.entities.find(Utility.getId, id);
				if (entity) {
					nearby.push(entity);
				}
			}
			
			for (var ei = 0; ei < this.numEyes; ei++) {
				var eye = this.eyes[ei];
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

			// Apply the outputs of agents on the environment
			this.digested = [];
			for (var j = 0, n = nearby.length; j < n; j++) {
				var dist = this.pos.distFrom(nearby[j].pos);
				if (dist < (nearby[j].radius + this.radius)) {
					var result = Utility.collisionCheck(this.pos, nearby[j].pos, smallWorld.walls);
					if (!result) {
						// Nom Noms!
						switch (nearby[j].type) {
							case 1:// The sweet meats
								this.digestionSignal += 5.0;
								break;
							case 2:// The gnar gnar meats
								this.digestionSignal += -6.0;
								break;
						}
						this.digested.push(nearby[j]);
					}
				}
			}

			// This is where the agents learns based on the feedback of their
			// actions on the environment
			this.backward();

			if (this.digested.length > 0) {
				if (this.worker) {
					this.brain.postMessage({cmd:'getAverage', msg:'getAverage'});
				} else {
					this.pts.push(this.brain.average_reward_window.getAverage().toFixed(1));
				}
			}
		},
		/**
		 * Load the brains from the field
		 * @returns {undefined}
		 */
		loadMemory: function () {
			if (this.worker) {
				var specs = JSON.parse(document.getElementById('memoryBank').value);
				this.brain.postMessage({cmd:'load', msg:'', input:specs});
			} else {
				$.getJSON(document.getElementById('memoryBank'), function(data) {
					this.brain.value_net.fromJSON(data);
				});
			}
		},
		/**
		 * Download the brains to the field
		 * @returns {undefined}
		 */
		saveMemory: function () {
			if (this.worker) {
				this.brain.postMessage({cmd:'save', msg:'', input:''});
			} else {
				var j = this.brain.value_net.toJSON();
				document.getElementById('memoryBank').value = JSON.stringify(j);
			}
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

		onDragStart: function(event) {
			this.data = event.data;
			this.alpha = 0.5;
			this.dragging = true;
		},
		onDragMove: function() {
			if(this.dragging) {
				var newPosition = this.data.getLocalPosition(this.parent);
				this.position.x = newPosition.x;
				this.position.y = newPosition.y;
			}
		},
		onDragEnd: function() {
			this.alpha = 1;
			this.dragging = false;
			// set the interaction data to null
			this.data = null;
		},
		onMouseDown: function() {
			this.isdown = true;
			this.alpha = 1;
		},
		onMouseUp: function() {
			this.isdown = false;
		},
		onMouseOver: function() {
			this.isOver = true;
			if (this.isdown) {
				return;
			}
		},
		onMouseOut: function() {
			this.isOver = false;
			if (this.isdown) {
				return;
			}
		}
	};

	global.Agent = Agent;

}(this));

