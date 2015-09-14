(function (global) {
    "use strict";

    /**
     * Initialize the Agent
     *
     * @param {Vec} position
     * @param {Object} env
     * @param {Object} opts
     * @returns {Agent}
     */
    var Agent = function (position, env, opts) {
        Entity.call(this, 3, position, env, opts);

        this.brainType = opts.brainType;

        // The number of item types the Agent's eyes can see
        this.numTypes = typeof(opts.numTypes) === 'number' ? opts.numTypes : 3;

        // The number of Agent's eyes
        this.numEyes = typeof(opts.numEyes) === 'number' ? opts.numEyes :  9;

        // The number of Agent's eyes, each one sees the number of knownTypes
        this.numInputs = this.numEyes * this.numTypes;

        // The Agent's eyes
        this.eyes = [];
        for (var k = 0; k < this.numEyes; k++) {
            this.eyes.push(new Eye(k * 0.21, opts.range, opts.proximity));
        }

        this.lastReward = 0;
        this.digestionSignal = 0.0;
        this.rewardBonus = 0.0;
        this.previousActionIdx = -1;
        this.pts = [];
        this.digested = [];
        this.direction = 'N';

        var _this = this;
        this.brain = {};

        return this;
    };

    Agent.prototype = Object.create(Entity.prototype);
    Agent.prototype.constructor = Entity;

    Agent.prototype.getNumStates = function () {
        return this.numStates;
    };

    Agent.prototype.getMaxNumActions = function () {
        return this.numActions;
    };

    /**
     * Load a pre-trained agent
     * @param file
     */
    Agent.prototype.load = function (file) {
        var _Brain = this.brain;
        Utility.loadJSON(file, function (data) {
            _Brain.fromJSON(JSON.parse(data));
            _Brain.epsilon = 0.05;
            _Brain.alpha = 0;
        });

        return this;
    };

    /**
     * Tick the agent
     * @param {Object} smallWorld
     */
    Agent.prototype.tick = function (smallWorld) {
        // Check for food
        // Gather up all the entities nearby based on cell population
        this.digested = [];
        var cell = smallWorld.grid.getCellAt(this.gridLocation.x, this.gridLocation.y),
            nearByEntities = [];
        for (let j = 0; j < cell.population.length; j++) {
            let entities = smallWorld.entities,
                entity = entities.find(Utility.getId, cell.population[j]);
            if (entity) {
                nearByEntities.push(entity);
            }
        }

        // Loop through the eyes and check the walls and nearby entities
        for (var e = 0; e < this.numEyes; e++) {
            this.eyes[e].sense(this.position, this.angle, smallWorld.walls, nearByEntities);
        }

        // Let the agents behave in the world based on their input
        this.forward(smallWorld);

        this.move(smallWorld);

        for (let j = 0; j < nearByEntities.length; j++) {
            let entity = nearByEntities[j],
                dist = this.position.distFrom(entity.position);
            if (dist < entity.radius + this.radius) {
                var result = Utility.collisionCheck(this.position, entity.position, smallWorld.walls);
                if (!result) {
                    this.digestionSignal += (entity.type === 1) ? this.carrot : this.stick;
                    this.digested.push(entity);
                    entity.cleanup = true;
                }
            }
        }

        // This is where the agents learns based on the feedback of their actions on the environment
        this.backward();

        if (this.digested.length > 0) {
            switch (this.brainType) {
                case 'TD':
                case 'RLTD':
                    if (!this.worker) {
                        this.pts.push(this.brain.average_reward_window.getAverage().toFixed(1));
                    }
                    break;
                case 'RLDQN':
                    this.pts.push(this.lastReward * 0.999 + this.lastReward * 0.001);
                    break;
            }
        }

        return this;
    };

    global.Agent = Agent;

}(this));

