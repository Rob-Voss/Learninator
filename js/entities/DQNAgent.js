var DQNAgent = DQNAgent || {};
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
			this.velocity = new Vec(0, 0);
			this.numInputs = 5;
			
			// PIXI graphics
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
	 * @returns {Agent_L3.Agent}
	 */
	class DQNAgent {
		constructor () {
			this.id = Utility.guid();
			this.type = 3; // type of agent
			this.name = 'DQNNormal';
			this.position = new Vec(5, 5);
			this.velocity = new Vec(0, 0);
			this.gridLocation = new Cell(0, 0);
			this.width = 20;
			this.height = 20;
			this.radius = 10;
			this.angle = 0;
			this.lastReward = 0;
			this.rewardBonus = 0.0;
			this.digestionSignal = 0.0;
			this.pts = [];
			this.digested = [];
			this.previousActionIdx = -1;
			this.direction = '';

			// Remember the Agent's old position
			this.oldPos = this.position;

			// Remember the Agent's old angle
			this.oldAngle = this.angle;

			// The number of item types the Agent's eys can see (wall, green, red thing proximity)
			this.numTypes = 3;

			// The number of Agent's eyes
			this.numEyes = 30;

			// The number of Agent's eyes, each one sees the number of knownTypes + the two velocity inputs
			this.numStates = this.numEyes * 5 + 2;

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
            env.getNumStates = function() {
                return _this.numStates;
            };
            env.getMaxNumActions = function() {
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

			this.texture = PIXI.Texture.fromImage("img/Agent.png");
			this.sprite = new PIXI.Sprite(this.texture);
			this.sprite.width = this.width;
			this.sprite.height = this.height;
			this.sprite.anchor.set(0.5, 0.5);
			this.sprite.position.set(this.position.x, this.position.y);

		};

        forward () {
            // in forward pass the agent simply behaves in the environment
            var ne = this.numEyes * 5;
            var inputArray = new Array(this.numStates);
            for(var i=0; i<this.numEyes; i++) {
                var e = this.eyes[i];
                inputArray[i*5] = 1.0;
                inputArray[i*5+1] = 1.0;
                inputArray[i*5+2] = 1.0;
                inputArray[i*5+3] = e.vx; // velocity information of the sensed target
                inputArray[i*5+4] = e.vy;
                if(e.sensed_type !== -1) {
                    // sensedType is 0 for wall, 1 for food and 2 for poison.
                    // lets do a 1-of-k encoding into the input array
                    inputArray[i*5 + e.sensedType] = e.sensedProximity/e.maxRange; // normalize to [0,1]
                }
            }

            // proprioception and orientation
            inputArray[ne+0] = this.velocity.x;
            inputArray[ne+1] = this.velocity.y;

            this.action = this.brain.act(inputArray);
        };

        backward () {
            var reward = this.digestionSignal;
            this.lastReward = reward; // for vis
            this.brain.learn(reward);
        };

		/**
		 * Tick the agent
		 * @param {Object} smallWorld
		 * @returns {undefined}
		 */
		tick (smallWorld) {
			this.oldPos = this.position; // Back up the old position
			this.oldAngle = this.angle; // and angle

			// Loop through the eyes and check the walls and nearby entities
			for (var ei=0; ei<this.numEyes; ei++) {
				var eye = this.eyes[ei];
				eye.shape.clear();
				var X = this.position.x + eye.maxRange * Math.sin(this.angle + eye.angle),
					Y = this.position.y + eye.maxRange * Math.cos(this.angle + eye.angle);
				// We have a line from agent.pos to p->eyep
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

			// execute agent's desired action
			var speed = 1;
			if(this.action === 0) {
				this.velocity.x += -speed;
			}
			if(this.action === 1) {
				this.velocity.x += speed;
			}
			if(this.action === 2) {
				this.velocity.y += -speed;
			}
			if(this.action === 3) {
				this.velocity.y += speed;
			}

			// forward the agent by velocity
			this.velocity.x *= 0.95; 
			this.velocity.y *= 0.95;
			this.position.x += this.velocity.x; 
			this.position.y += this.velocity.y;

			// handle boundary conditions.. bounce agent
			var width = smallWorld.grid.width * smallWorld.grid.cellWidth - 2,
				height = smallWorld.grid.height * smallWorld.grid.cellHeight - 2;
			if(this.position.x < 2) {
				this.position.x = 2;
				this.velocity.x = 0;
				this.velocity.y = 0;
			}
			if(this.position.x > width) {
				this.position.x = width;
				this.velocity.x = 0;
				this.velocity.y = 0;
			}
			if(this.position.y < 2) {
				this.position.y = 2;
				this.velocity.x = 0;
				this.velocity.y = 0;
			}
			if(this.position.y > height) {
				this.position.y = height;
				this.velocity.x = 0;
				this.velocity.y = 0;
			}

			// The agent is trying to move from pos to oPos so we need to check walls
			var result = Utility.collisionCheck(this.oldPos, this.position, smallWorld.walls);
			if (result) {
				var d = this.position.distanceTo(result.vecI);
				// The agent derped! Wall collision! Reset their position
				if (result && d <= this.radius) {
					this.position = this.oldPos;
				}
			}

			this.sprite.position.set(this.position.x, this.position.y);

			this.gridLocation = smallWorld.grid.getGridLocation(this.position);
			this.direction = Utility.getDirection(this.angle);
			
			// Gather up all the entities nearby based on cell population
			var nearby = [];
			for (var i=0; i<this.gridLocation.population.length; i++) {
				var id = this.gridLocation.population[i],
					entity = smallWorld.entities.find(Utility.getId, id);
				if (entity) {
					nearby.push(entity);
				}
			}

			// Apply the outputs of agents on the environment
			this.digested = [];
			for (var j=0, n=nearby.length; j<n; j++) {
				var dist = this.position.distanceTo(nearby[j].position);
				if (dist < (nearby[j].radius + this.radius)) {
					var result = Utility.collisionCheck(this.position, nearby[j].position, smallWorld.walls);
					if (!result) {
						// Nom Noms!
						switch (nearby[j].type) {
							case 1:// The sweet meats
								this.digestionSignal += 1.0;
								break;
							case 2:// The gnar gnar meats
								this.digestionSignal += -1.0;
								break;
						}
						this.digested.push(nearby[j]);
					}
				}
			}
			
			// This is where the agents learns based on the feedback of their
			// actions on the environment
			this.backward();

			for (var ei=0; ei<this.numEyes; ei++) {
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
					this.pts.push(this.lastReward);
				}
			}
		};
	};

	global.DQNAgent = DQNAgent;

}(this));

