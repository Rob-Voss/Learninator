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
        this.rewardGraph = opts.rewardGraph;

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
                        // Get action from brain
                        _this.actionIndex = data.input;

                        //this.actionIndex = this.brain.forward(inputArray);
                        var action = _this.actions[_this.actionIndex];

                        // Demultiplex into behavior variables
                        _this.rot1 = action[0] * 1;
                        _this.rot2 = action[1] * 1;
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
                default:
                //console.log('Unknown command: ' + data.msg);
            }
        };

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
            var entities = smallWorld.entities,
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

        for (let j = 0; j < nearByEntities.length; j++) {
            var dist = this.position.distFrom(nearByEntities[j].position);
            if (dist < nearByEntities[j].radius + this.radius) {
                var result = Utility.collisionCheck(this.position, nearByEntities[j].position, smallWorld.walls);
                if (!result) {
                    this.digestionSignal += (nearByEntities[j].type === 1) ? this.carrot : this.stick;
                    this.digested.push(nearByEntities[j]);
                    nearByEntities[j].cleanup = true;
                }
            }
        }

        this.move(smallWorld);

        // This is where the agents learns based on the feedback of their actions on the environment
        this.backward();

        if (this.digested.length > 0) {
            switch (this.type) {
                case 'TD':
                    this.pts.push(this.brain.average_reward_window.getAverage().toFixed(1));
                    break;
                case 'DQN':
                    if (this.digested.length > 0) {
                        this.pts.push(this.lastReward * 0.999 + this.lastReward * 0.001);
                    }
                    break;
            }
        }

        return this;
    };

    global.Agent = Agent;

}(this));

