(function (global) {
    "use strict";

    /**
     * A single agent
     */
    class AgentDQN extends Interactive {
		constructor (interactive, display) {
            super();

			this.id = Utility.guid();
			this.type = 3;
			this.name = 'DQN Agent';
			this.camera = (display) ? new Camera(display, 320, 0.8) : undefined;
            this.gridLocation = new Cell();
			this.position = new Vec(300, 300, 0, 0);
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
			this.direction = '';
			this.interactive = interactive || false;
            this.collision = false;

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
 			this.load('js/wateragent.json');
			
			return this;
		}

		load (file) {
			var _Brain = this.brain;
			Utility.loadJSON(file, function(data) {
				_Brain.fromJSON(JSON.parse(data));
				_Brain.epsilon = 0.05;
				_Brain.alpha = 0;
			});
		}

        act () {
            // in forward pass the agent simply behaves in the environment
            var ne = this.numEyes * this.numTypes;
            var inputArray = new Array(this.numStates);
            for(var i=0; i<this.numEyes; i++) {
                var eye = this.eyes[i];
                inputArray[i*this.numTypes] = 1.0;
                inputArray[i*this.numTypes+1] = 1.0;
                inputArray[i*this.numTypes+2] = 1.0;
                inputArray[i*this.numTypes+3] = eye.vx; // velocity information of the sensed target
                inputArray[i*this.numTypes+4] = eye.vy;
                if(eye.sensedType !== -1) {
                    // sensedType is 0 for wall, 1 for food and 2 for poison.
                    // lets do a 1-of-k encoding into the input array
                    inputArray[i*this.numTypes + eye.sensedType] = eye.sensedProximity / eye.maxRange; // normalize to [0,1]
                }
            }

            // proprioception and orientation
            inputArray[ne+0] = this.position.vx;
            inputArray[ne+1] = this.position.vy;

            this.action = this.brain.act(inputArray);
        }

        learn () {
            var reward = this.digestionSignal;
            this.lastReward = reward; // for vis
            this.brain.learn(reward);
        }

		move (smallWorld) {
			// execute agent's desired action
			var speed = 1;
			if(this.action === 0) {
				this.position.vx += -speed;
			}
			if(this.action === 1) {
				this.position.vx += speed;
			}
			if(this.action === 2) {
				this.position.vy += -speed;
			}
			if(this.action === 3) {
				this.position.vy += speed;
			}

			// forward the agent by velocity
			this.position.vx *= 0.95;
			this.position.vy *= 0.95;
			this.position.advance();

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
		}

		/**
		 * Tick the agent
		 * @param {Object} smallWorld
		 * @returns {undefined}
		 */
		tick (smallWorld) {
			this.oldPos = this.position.clone();
			this.oldAngle = this.angle;

			// Loop through the eyes and check the walls and nearby entities
			for (var e=0; e<this.numEyes; e++) {
				this.eyes[e].sense(this, smallWorld.walls, smallWorld.entities);
			}

			// Let the agents behave in the world based on their input
			this.act();

			this.move(smallWorld);

			// Loop through the eyes and draw them
			for (var ei=0; ei<this.numEyes; ei++) {
				this.eyes[ei].draw(this);
			}

			// Check for food
			// Gather up all the entities nearby based on cell population
			this.digested = [];
            var cell = smallWorld.grid.getCellAt(this.gridLocation.x, this.gridLocation.y);
			for (var j=0; j<cell.population.length; j++) {
				var entity = smallWorld.entities.find(Utility.getId, cell.population[j]);
				if (entity) {
					var dist = this.position.distanceTo(entity.position);
					if (dist < entity.radius + this.radius) {
						var result = Utility.collisionCheck(this.position, entity.position, smallWorld.walls);
						if (!result) {
							// Nom Noms!
							switch (entity.type) {
								case 1:// The sweet meats
									this.digestionSignal += 1.0;
									break;
								case 2:// The gnar gnar meats
									this.digestionSignal += -1.0;
									break;
							}
                            entity.cleanup = true;
							this.digested.push(entity);
						}
					}
				}
			}

			// This is where the agents learns based on the feedback of their actions on the environment
			this.learn();
			
			if (this.digested.length > 0) {
				this.pts.push(this.lastReward * 0.999 + this.lastReward * 0.001);
			}
		}
	}

	global.AgentDQN = AgentDQN;

}(this));

