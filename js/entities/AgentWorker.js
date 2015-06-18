var AgentWorker = AgentWorker || {};
var Eye = Eye || {};
var Utility = Utility || {};
var PIXI = PIXI || {};

(function (global) {
	"use strict";

	/**
	 * A single agent
	 * @param {Number} type
	 * @param {Vec} v
	 * @param {Number} r
	 * @returns {Agent_L3.Agent}
	 */
	class AgentWorker {
		constructor (type, display) {
			this.id = Utility.guid();
			this.type = 3; // type of agent
			this.name = 'Worker Agent';
			(display) ? this.camera = new Camera(display, 320, 0.8) : undefined;
			this.position = new Vec(5, 5);
			this.velocity = new Vec(0, 0);
			this.gridLocation = new Cell(0, 0);
			this.width = 20;
			this.height = 20;
			this.radius = 10;
			this.angle = 0;
			this.rot1 = 0.0;
			this.rot2 = 0.0;
			this.lastReward = 0;
			this.rewardBonus = 0.0;
			this.digestionSignal = 0.0;
			this.pts = [];
			this.digested = [];
			this.previousActionIdx = -1;
			this.direction = '';
			this.interactive = interactive || false;

			// Remember the Agent's old position
			this.oldPos = this.position;

			// Remember the Agent's old angle
			this.oldAngle = this.angle;

			// The number of item types the Agent's eys can see (wall, green, red thing proximity)
			this.numTypes = 3;

			// The number of Agent's eyes
			this.numEyes = 9;

			// The number of Agent's eyes, each one sees the number of knownTypes
			this.numInputs = this.numEyes * this.numTypes;

			// Amount of temporal memory. 0 = agent lives in-the-moment :)
			this.temporalWindow = 1;

			// The Agent's eyes
			this.eyes = [];
			for (var k = 0; k < this.numEyes; k++) {
				this.eyes.push(new Eye((k - this.numTypes-1) * 0.25));
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
			this.networkSize = this.numInputs * this.temporalWindow + this.numActions * this.temporalWindow + this.numInputs;

			var _this = this;
			
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
			brainOptsTD.num_states = this.numInputs;
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

			this.brain = new Worker('js/entities/Brain.js');
			this.brain.onmessage = function (e) {
				var data = e.data;
				switch (data.cmd) {
					case 'init':
						if (data.msg === 'load') {
							_this.loadMemory();
						}
						if (data.msg === 'complete') {

						}
					break;
					case 'forward':
						if (data.msg === 'complete') {
							_this.previousActionIdx = _this.actionIndex;
							_this.actionIndex = data.input;

							// Demultiplex into behavior variables
							_this.rot1 = _this.actions[_this.actionIndex][0] * 1;
							_this.rot2 = _this.actions[_this.actionIndex][1] * 1;
						}
						break;
					case 'backward':
						if (data.msg === 'complete') {

						}
						break;
					case 'getAverage':
						if (data.msg === 'complete') {
							_this.pts.push(data.input);
						}
						break;
					case 'error':
					default:
						console.log('Unknown command: ' + data.cmd + ' message:' + data.msg);
				}
			};

			this.brain.postMessage({cmd:'init', input:brainOptsTD});

			this.texture = PIXI.Texture.fromImage("img/Agent.png");
			this.sprite = new PIXI.Sprite(this.texture);
			this.sprite.width = this.width;
			this.sprite.height = this.height;
			this.sprite.anchor.set(0.5, 0.5);
			this.sprite.position.set(this.position.x, this.position.y);
			
			if (this.interactive == true) {
				this.sprite.interactive = true;
				this.sprite
					.on('mousedown', this.onDragStart)
					.on('touchstart', this.onDragStart)
					.on('mouseup', this.onDragEnd)
					.on('mouseupoutside', this.onDragEnd)
					.on('touchend', this.onDragEnd)
					.on('touchendoutside', this.onDragEnd)
					.on('mouseover', this.onMouseOver)
					.on('mouseout', this.onMouseOut)
					.on('mousemove', this.onDragMove)
					.on('touchmove', this.onDragMove);
				this.sprite.entity = _this;
			}

		};

		/**
		 * In backward pass agent learns.
		 * @returns {undefined}
		 */
		backward () {
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

			// Agents like to eat good things
			var digestionReward = this.digestionSignal;
			this.digestionSignal = 0.0;

			var reward = proximityReward + forwardReward + digestionReward;
			// pass to brain for learning
			this.brain.postMessage({cmd:'backward', input:reward});
		};

		/**
		 * In forward pass the agent simply behaves in the environment
		 * @returns {undefined}
		 */
		forward () {
			// Create input to brain
			var inputArray = new Array(this.numEyes * this.numTypes);

			for (var i = 0; i < this.numEyes; i++) {
				var e = this.eyes[i];
				for (var nt=0; nt<this.numTypes; nt++) {
					inputArray[i * this.numTypes + nt] = 1.0;
					if (e.sensedType !== -1) {
						// sensedType is 0 for wall, 1 for food and 2 for poison
						// lets do a 1-of-k encoding into the input array
						// normalize to [0,1]
						inputArray[i * this.numTypes + e.sensedType] = e.sensedProximity / e.maxRange;
					}
				}
			}

			// Get action from brain
			this.brain.postMessage({cmd:'forward', input:inputArray});
		};

		/**
		 * Tick the agent
		 * @param {Object} smallWorld
		 * @returns {undefined}
		 */
		tick (smallWorld) {
			this.oldPos = new Vec(this.position.x, this.position.y);
			this.oldAngle = this.angle;

			// Loop through the eyes and check the walls and nearby entities
			for (var ei = 0; ei < this.numEyes; ei++) {
				var eye = this.eyes[ei];
				eye.shape.clear();
				var X = this.position.x + eye.maxRange * Math.sin(this.angle + eye.angle),
					Y = this.position.y + eye.maxRange * Math.cos(this.angle + eye.angle);
				// We have a line from agent.position to p->eyep
				var result = Utility.collisionCheck(this.position, new Vec(X, Y), smallWorld.walls, smallWorld.entities);
				if (result) {
					// eye collided with an entity
					eye.sensedProximity = result.vecI.distanceTo(this.position);
					eye.sensedType = result.type;
					if('vx' in result) {
						eye.vx = result.vx;
						eye.vy = result.vy;
					} else {
						eye.vx = 0;
						eye.vy = 0;
					}
				} else {
					eye.sensedProximity = eye.maxRange;
					eye.sensedType = -1;
					eye.vx = 0;
					eye.vy = 0;
				}
			}

			// Let the agents behave in the world based on their input
			this.forward();

			// Steer the agent according to outputs of wheel velocities
			var v = new Vec(0, this.radius / 2.0),
				v = v.rotate(this.angle + Math.PI / 2),
				w1pos = this.position.add(v), // Positions of wheel 1
				w2pos = this.position.sub(v), // Positions of wheel 2
				vv = this.position.sub(w2pos),
				vv = vv.rotate(-this.rot1),
				vv2 = this.position.sub(w1pos),
				vv2 = vv2.rotate(this.rot2),
				newPos = w2pos.add(vv),
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

			// The agent is trying to move from pos to oPos so we need to check walls
			var result = Utility.collisionCheck(this.oldPos, this.position, smallWorld.walls);
			if (result) {
				this.position = this.oldPos;
			}

			// handle boundary conditions.. bounce agent
			var width = smallWorld.grid.width * smallWorld.grid.cellWidth - 2,
				height = smallWorld.grid.height * smallWorld.grid.cellHeight - 2;
			if(this.position.x < 1) {
				this.position.x = 1;
			}
			if(this.position.x > width) {
				this.position.x = width;
			}
			if(this.position.y < 1) {
				this.position.y = 1;
			}
			if(this.position.y > height) {
				this.position.y = height;
			}

			// Gather up all the entities nearby based on cell population
			var nearby = [];
			for (var i = 0; i < this.gridLocation.population.length; i++) {
				var id = this.gridLocation.population[i],
					entity = smallWorld.entities.find(Utility.getId, id);
				if (entity) {
					nearby.push(entity);
				}
			}

			// Apply the outputs of agents on the environment
			this.digested = [];
			for (var j = 0, n = nearby.length; j < n; j++) {
				var dist = this.position.distanceTo(nearby[j].position);
				if (dist < (nearby[j].radius + this.radius)) {
					var result = Utility.collisionCheck(this.position, nearby[j].position, smallWorld.walls);
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

			this.sprite.position.set(this.oldPos.x, this.oldPos.y);
			this.sprite.rotation = -this.oldAngle;
			this.gridLocation = smallWorld.grid.getGridLocation(this.oldPos);
			this.direction = Utility.getDirection(this.oldAngle);
			
			if (this.digested.length > 0) {
				this.brain.postMessage({cmd:'getAverage'});
			}
		};

		/**
		 * Load the brains from the field
		 * @returns {undefined}
		 */
		loadMemory () {
			var specs = JSON.parse(document.getElementById('memoryBank').value);
			this.brain.postMessage({cmd:'load', input:specs});
		};

		/**
		 * Download the brains to the field
		 * @returns {undefined}
		 */
		saveMemory () {
			this.brain.postMessage({cmd:'save', input:''});
		};

		/**
		 * Get to learninating
		 * @returns {undefined}
		 */
		startLearnin () {
			this.brain.learning = true;
		};

		/**
		 * Stop learninating
		 * @returns {undefined}
		 */
		stopLearnin () {
			this.brain.learning = false;
		};

		onDragStart (event) {
			this.data = event.data;
			this.alpha = 0.5;
			this.dragging = true;
		};

		onDragMove () {
			if(this.dragging) {
				var newPosition = this.data.getLocalPosition(this.parent);
				this.position.set(newPosition.x, newPosition.y);
				this.entity.position.set(newPosition.x, newPosition.y);
			}
		};

		onDragEnd () {
			this.alpha = 1;
			this.dragging = false;
			// set the interaction data to null
			this.data = null;
		};

		onMouseDown () {
			this.isdown = true;
			this.alpha = 1;
		};

		onMouseUp () {
			this.isdown = false;
		};

		onMouseOver () {
			this.isOver = true;
			if (this.isdown) {
				return;
			}
		};
		
		onMouseOut () {
			this.isOver = false;
			if (this.isdown) {
				return;
			}
		};
	};

	global.AgentWorker = AgentWorker;

}(this));

