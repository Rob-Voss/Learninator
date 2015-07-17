(function (global) {
    "use strict";

    /**
     * Initialize the Agent
     * @param position
     * @param grid
     * @param opts
     * @returns {Agent}
     */
    var Agent = function (position, grid, opts) {
        Entity.call(this, 3, position, grid, opts);

        this.brainType = opts.brainType;
        this.rewardGraph = opts.rewardGraph;
        this.camera = opts.display;

        // The number of item types the Agent's eyes can see
        this.numTypes = opts.numTypes || 3;

        // The number of Agent's eyes
        this.numEyes = opts.numEyes || 9;

        // The Agent's eyes
        this.eyes = [];
        for (var k = 0; k < this.numEyes; k++) {
            this.eyes.push(new Eye(k * 0.21));
        }

        this.lastReward = 0;
        this.digestionSignal = 0.0;
        this.rewardBonus = 0.0;
        this.previousActionIdx = -1;
        this.pts = [];
        this.digested = [];
        this.direction = 'N';

        this.draw = function () {
            this.shape.clear();
            this.shape.lineStyle(0xFFFFFF);
            this.shape.beginFill(0x000000);
            this.shape.drawCircle(this.position.x, this.position.y, this.radius);
            this.shape.endFill();
        };

        this.getNumStates = function () {
            return this.numStates;
        };

        this.getMaxNumActions = function () {
            return this.numActions;
        };

        /**
         * Load a pre-trained agent
         * @param file
         */
        this.load = function (file) {
            var _Brain = this.brain;
            Utility.loadJSON(file, function (data) {
                _Brain.fromJSON(JSON.parse(data));
                _Brain.epsilon = 0.05;
                _Brain.alpha = 0;
            });
        };

        /**
         * Tick the agent
         * @param {Object} smallWorld
         */
        this.tick = function (smallWorld) {
            // Loop through the eyes and check the walls and nearby entities
            for (var e = 0; e < this.numEyes; e++) {
                this.eyes[e].sense(this.position, this.angle, smallWorld.walls, smallWorld.entities);
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
        };
    };

    global.Agent = Agent;

}(this));

