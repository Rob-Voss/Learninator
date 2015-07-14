(function (global) {
    "use strict";

    class Agent extends Entity {
        /**
         * Initialize the Agent
         * @param position
         * @param grid
         * @param opts
         * @returns {Agent}
         */
        constructor(position, grid, opts) {
            super(3, position, grid, opts);

            this.brainType = opts.brainType;
            this.rewardGraph = opts.rewardGraph;
            this.camera = opts.display;

            this.name = this.brainType + ' Agent';

            // The Agent's eyes
            this.eyes = [];
            for (var k = 0; k < opts.numEyes; k++) {
                this.eyes.push(new Eye(k * 0.21));
            }

            this.type = 3;
            this.lastReward = 0;
            this.digestionSignal = 0.0;
            this.rewardBonus = 0.0;
            this.previousActionIdx = -1;
            this.pts = [];
            this.digested = [];
            this.direction = 'N';

            var _this = this;

            return _this;
        }

        /**
         * Load a pre-trained agent
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
                            this.digestionSignal += (entity.type === 1) ? this.carrot : this.stick;
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
                        this.pts.push(this.brain.averageRewardWindow.getAverage().toFixed(1));
                    break;
                    case 'DQN':
                        if (this.digested.length > 0) {
                            this.pts.push(this.lastReward * 0.999 + this.lastReward * 0.001);
                        }
                    break;
                }

            }
        }

        /**
         * Agent's chance to learn
         */
        backward() {
            this.lastReward = this.digestionSignal; // for vis
            this.brain.learn(this.digestionSignal);
        }

        /**
         * Agent's chance to act on the world
         */
        forward() {
            // in forward pass the agent simply behaves in the environment
            var ne = this.numEyes * this.numTypes;
            var inputArray = new Array(this.numStates);
            for (var i = 0; i < this.numEyes; i++) {
                var eye = this.eyes[i];
                inputArray[i * this.numTypes] = 1.0;
                inputArray[i * this.numTypes + 1] = 1.0;
                inputArray[i * this.numTypes + 2] = 1.0;
                inputArray[i * this.numTypes + 3] = eye.vx; // velocity information of the sensed target
                inputArray[i * this.numTypes + 4] = eye.vy;
                if (eye.sensedType !== -1) {
                    // sensedType is 0 for wall, 1 for food and 2 for poison.
                    // lets do a 1-of-k encoding into the input array
                    inputArray[i * this.numTypes + eye.sensedType] = eye.sensedProximity / eye.maxRange; // normalize to [0,1]
                }
            }

            // proprioception and orientation
            inputArray[ne + 0] = this.position.vx;
            inputArray[ne + 1] = this.position.vy;

            this.action = this.brain.act(inputArray);
        }

    }

    global.Agent = Agent;

}(this));

