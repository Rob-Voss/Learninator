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
	class Eye {
		constructor (angle) {
			this.angle = angle; // Angle relative to agent its on
			this.maxRange = 85; // Max range of the eye's vision
			this.sensedProximity = 85; // What the eye is seeing. will be set in world.tick()
			this.sensedType = -1; // what does the eye see?

			this.shape = new PIXI.Graphics();
			this.shape.lineStyle(1, 0x000000);
		}
	};

	class Ticker {
		constructor(agent) {

		}

	};

	/**
	 * A single agent
	 * @param {Number} type
	 * @param {Vec} v
	 * @param {Number} r
	 * @returns {Agent_L3.Agent}
	 */
	class Agent {
		constructor (type, display) {
			this.id = Utility.guid();
			this.type = 3; // type of agent
			this.worker = (type === 'Worker') ? true : false;
			this.name = (type === 'Worker') ? 'Worker' : 'Normal';
			this.pos = new Vec(5, 5);
			this.gridLocation = new Cell(0, 0);
			(display) ? this.camera = new Camera(display, 320, 0.8) : undefined;
			this.width = 20;
			this.height = 20;
			this.radius = 10;
			this.angle = 0;
			this.rewardBonus = 0.0;
			this.digestionSignal = 0.0;
			this.pts = [];
			this.digested = [];
			// Agent outputs on the world
			this.rot1 = 0.0; // Rotation speed of 1st wheel
			this.rot2 = 0.0; // Rotation speed of 2nd wheel
			this.previousActionIdx = -1;
			this.direction = '';

			// Remember the Agent's old position
			this.oldPos = this.pos;

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

			if (this.worker) {
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
			} else {
				this.brainOpts = brainOptsTD;
				this.brain = new Brain(brainOptsTD);
			}

			this.texture = PIXI.Texture.fromImage("img/Agent.png");
			this.sprite = new PIXI.Sprite(this.texture);
			this.sprite.width = this.width;
			this.sprite.height = this.height;
			this.sprite.anchor.set(0.5, 0.5);
			this.sprite.position.set(this.pos.x, this.pos.y);
			
			if (global.world.interactive == true) {
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
			if (this.worker) {
				this.brain.postMessage({cmd:'backward', input:reward});
			} else {
				this.brain.backward(reward);
			}
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
			if (this.worker) {
				this.brain.postMessage({cmd:'forward', input:inputArray});
			} else {
				this.previousActionIdx = this.actionIndex;
				this.actionIndex = this.brain.forward(inputArray);

				// Demultiplex into behavior variables
				this.rot1 = this.actions[this.actionIndex][0] * 1;
				this.rot2 = this.actions[this.actionIndex][1] * 1;
			}
		};

		/**
		 * Tick the agent
		 * @param {Object} smallWorld
		 * @returns {undefined}
		 */
		tick (smallWorld) {
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
					eye.sensedProximity = result.vecI.distanceTo(this.pos);
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
			if (this.angle < 0) {
				this.angle += 2 * Math.PI;
			}

			this.angle += this.rot2;
			if (this.angle > 2 * Math.PI) {
				this.angle -= 2 * Math.PI;
			}

			// The agent is trying to move from pos to oPos so we need to check walls
			var derped = Utility.collisionCheck(this.oldPos, this.pos, smallWorld.walls);
			if (derped) {
				var d = this.pos.distanceTo(derped.vecI);
				// The agent derped! Wall collision! Reset their position
				if (derped && d <= this.radius) {
					this.pos = this.oldPos;
				}
			}

			// Handle boundary conditions
			if (this.pos.x < 2)
				this.pos.x = 2;
			if (this.pos.x > smallWorld.grid.width * smallWorld.grid.cellWidth)
				this.pos.x = smallWorld.grid.width * smallWorld.grid.cellWidth;
			if (this.pos.y < 2)
				this.pos.y = 2;
			if (this.pos.y > smallWorld.grid.height * smallWorld.grid.cellHeight)
				this.pos.y = smallWorld.grid.height * smallWorld.grid.cellHeight;

			this.sprite.position.set(this.pos.x, this.pos.y);
			this.sprite.rotation = -this.angle;

			this.gridLocation = smallWorld.grid.getGridLocation(this.pos);
			this.direction = Utility.getDirection(this.angle);
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
				var dist = this.pos.distanceTo(nearby[j].pos);
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

			if (this.digested.length > 0) {
				if (this.worker) {
					this.brain.postMessage({cmd:'getAverage'});
				} else {
					this.pts.push(this.brain.average_reward_window.getAverage().toFixed(1));
				}
			}
		};

		/**
		 * Load the brains from the field
		 * @returns {undefined}
		 */
		loadMemory () {
			if (this.worker) {
				var specs = JSON.parse(document.getElementById('memoryBank').value);
				this.brain.postMessage({cmd:'load', input:specs});
			} else {
				$.getJSON(document.getElementById('memoryBank'), function(data) {
					this.brain.value_net.fromJSON(data);
				});
			}
		};

		/**
		 * Download the brains to the field
		 * @returns {undefined}
		 */
		saveMemory () {
			if (this.worker) {
				this.brain.postMessage({cmd:'save', input:''});
			} else {
				var j = this.brain.value_net.toJSON();
				document.getElementById('memoryBank').value = JSON.stringify(j);
			}
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
				this.entity.pos.set(newPosition.x, newPosition.y);
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

	global.Agent = Agent;

}(this));

