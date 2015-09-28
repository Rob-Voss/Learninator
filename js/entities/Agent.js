(function (global) {
    "use strict";

    /**
     * Initialize the Agent
     *
     * @param {Vec} position
     * @param {Object} opts
     * @returns {Agent}
     */
    var Agent = function (position, opts) {
        Entity.call(this, 3, position, opts);

        this.brainType = Utility.getOpt(opts, 'brainType', 'TD');

        // The number of item types the Agent's eyes can see
        this.numTypes = Utility.getOpt(opts, 'numTypes', 3);
        // The number of Agent's eyes
        this.numEyes = Utility.getOpt(opts, 'numEyes',  9);
        // The number of Agent's eyes, each one sees the number of knownTypes
        this.numStates = this.numEyes * this.numTypes;

        // The Agent's eyes
        this.eyes = [];
        for (var k = 0; k < this.numEyes; k++) {
            this.eyes.push(new Eye(k * 0.21, Utility.getOpt(opts, 'range',  85), Utility.getOpt(opts, 'proximity',  85)));
        }

        this.action = null;
        this.lastReward = 0;
        this.digestionSignal = 0.0;
        this.rewardBonus = 0.0;
        this.previousActionIdx = -1;
        this.epsilon = 0.000;

        this.pts = [];
        this.direction = 'N';
        this.brain = {};
        this.world = {};

        // Set up the environment variable for RL
        this.env = {
            numActions: this.numActions,
            numStates: this.numStates
        };

        this.env.getMaxNumActions = function () {
            return this.numActions;
        };

        this.env.getNumStates = function () {
            return this.numStates;
        };

        var _this = this;

        return this;
    };

    Agent.prototype = Object.create(Entity.prototype);
    Agent.prototype.constructor = Entity;

    /**
     * Find nearby entities to nom on
     * @returns {Agent}
     */
    Agent.prototype.eat = function () {
        this.digestionSignal = 0;

        // Check the world for collisions
        this.world.CD.check(this);

        // Go through and process what we ate
        for (var i=0; i < this.collisions.length; i++) {
            this.digestionSignal += (this.collisions[i].type === 1) ? this.carrot : this.stick;
        }
        this.collisions = [];

        return this;
    };

    /**
     * Load a pre-trained agent
     * @param {String} file
     */
    Agent.prototype.load = function (file) {
        var _this = this;
        $.getJSON(file, function(data) {
            if (!_this.worker) {
                _this.brain.fromJSON(data);
                _this.brain.epsilon = 0.05;
                _this.brain.alpha = 0;
            } else {
                _this.post('load', JSON.stringify(data));
            }
        });

        return this;
    };

    /**
     * Tick the agent
     * @param {Object} world
     */
    Agent.prototype.tick = function (world) {
        this.world = world;
        this.start = new Date().getTime();

        // Let the agents behave in the world based on their input
        this.act();

        // If it's not a worker we need to run the rest of the steps
        if (!this.worker) {
            // Move eet!
            this.move();
            // Find nearby entities to nom
            this.eat();
            // This is where the agents learns based on the feedback of their actions on the environment
            this.learn();
        }

        if (this.cheats) {
            this.updateCheats();
        }

        return this;
    };

    global.Agent = Agent;

}(this));

