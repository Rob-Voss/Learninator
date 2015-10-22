var Agent = Agent || {};

(function (global) {
    "use strict";

    /**
     * Options for the Agent
     * @typedef {Object} agentOpts
     * @property {boolean} worker - Is the Agent a Web Worker
     * @property {string} brainType - The type of Brain to use
     * @property {number} numTypes - The number of types the Agent can sense
     * @property {number} numEyes - The number of the Agent's eyes
     * @property {number} range - The range of the eyes
     * @property {number} proximity - The proximity range of the eyes
     * @property {cheatOpts} opts.cheats - The cheats to display
     * @property {brainOpts} opts.spec - The brain options
     * @property {Object} opts.env - The environment
     */

    /**
     * The options for the Agents brain
     * @typedef {Object} brainOpts
     * @property {string} update - qlearn | sarsa
     * @property {number} gamma - Discount factor [0, 1]
     * @property {number} epsilon - Initial epsilon for epsilon-greedy policy [0, 1]
     * @property {number} alpha - Value function learning rate
     * @property {number} experienceAddEvery - Number of time steps before we add another experience to replay memory
     * @property {number} experienceSize - Size of experience
     * @property {number} learningStepsPerIteration - Number of steps to go through during one tick
     * @property {number} tdErrorClamp - For robustness
     * @property {number} numHiddenUnits - Number of neurons in hidden layer
     */

    /**
     * Initialize the Agent
     * @name Agent
     * @extends Entity
     * @constructor
     *
     * @param {Vec} position - The x, y location
     * @param {agentOpts} opts - The Agent options
     * @returns {Agent}
     */
    function Agent(position, opts) {
        // Is it a worker
        this.worker = Utility.getOpt(opts, 'worker', false);
        Entity.call(this, (this.worker) ? 'Agent Worker' : 'Agent', position, opts);

        // Just a text value for the brain type, also useful for worker ops
        this.brainType = Utility.getOpt(opts, 'brainType', 'TD');

        // The number of item types the Agent's eyes can see
        this.numTypes = Utility.getOpt(opts, 'numTypes', 3);
        // The number of Agent's eyes
        this.numEyes = Utility.getOpt(opts, 'numEyes',  9);
        this.range = Utility.getOpt(opts, 'range',  85);
        this.proximity = Utility.getOpt(opts, 'proximity',  85);
        // The number of Agent's eyes, each one sees the number of knownTypes
        this.numStates = this.numEyes * this.numTypes;

        // The Agent's eyes
        this.eyes = [];
        for (var k = 0; k < this.numEyes; k++) {
            this.eyes.push(new Eye(k * 0.21, this.position, this.range, this.proximity));
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
    }

    Agent.prototype = Object.create(Entity.prototype);
    Agent.prototype.constructor = Entity;

    /**
     * Agent's chance to learn
     * @returns {Agent}
     */
    Agent.prototype.learn = function () {
        this.lastReward = this.digestionSignal;
        this.pts.push(this.digestionSignal);

        if (!this.worker) {
            this.brain.learn(this.digestionSignal);
            this.epsilon = this.brain.epsilon;
        } else {
            this.post('learn', this.digestionSignal);
        }

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
     *
     */
    Agent.prototype.saveAgent = function (id) {
        var brain;
        if (!this.worker) {
            brain = this.brain;
        }

        return JSON.stringify(brain.toJSON());
    };

    /**
     * Tick the agent
     * @param {Object} world
     */
    Agent.prototype.tick = function (world) {
        this.world = world;
        // Let the agents behave in the world based on their input
        this.act();

        // If it's not a worker we need to run the rest of the steps
        if (!this.worker) {
            // Move eet!
            this.move();
            // This is where the agents learns based on the feedback of their actions on the environment
            this.learn();
        }

        return this;
    };

    /**
     * Eye sensor has a maximum range and senses walls
     * @param angle
     * @param range
     * @param proximity
     * @returns {Eye}
     * @name Eye
     * @constructor
     */
    function Eye(angle, position, range, proximity) {
        this.angle = angle;
        this.maxRange = range || 85;
        this.sensedProximity = proximity || 85;
        this.position = position || new Vec(0, 0);
        this.maxPos = new Vec(0, 0);
        this.sensedType = -1;
        this.collisions = [];

        // PIXI graphics
        this.shape = new PIXI.Graphics();

        return this;
    }

    /**
     * Draw the lines for the eyes
     * @param agent
     */
    Eye.prototype.draw = function (agent) {
        this.position = agent.position.clone();
        this.shape.clear();

        switch (this.sensedType) {
            case -1:
            case 0:
                // Is it wall or nothing?
                this.shape.lineStyle(0.5, 0x000000);
                break;
            case 1:
                // It is noms
                this.shape.lineStyle(0.5, 0xFF0000);
                break;
            case 2:
                // It is gnar gnar
                this.shape.lineStyle(0.5, 0x00FF00);
                break;
            case 3:
            case 4:
            case 5:
                // Is it another Agent
                this.shape.lineStyle(0.5, 0xFAFAFA);
                break;
            default:
                this.shape.lineStyle(0.5, 0x000000);
                break;
        }

        var aEyeX = this.position.x + this.sensedProximity * Math.sin(agent.angle + this.angle),
            aEyeY = this.position.y + this.sensedProximity * Math.cos(agent.angle + this.angle);
        this.maxPos.set(aEyeX, aEyeY);

        // Draw the agent's line of sights
        this.shape.moveTo(this.position.x, this.position.y);
        this.shape.lineTo(aEyeX, aEyeY);
    };

    /**
     * Sense the surroundings
     * @param agent
     */
    Eye.prototype.sense = function (agent) {
        this.position = agent.position.clone();
        var result,
            aEyeX = this.position.x + this.maxRange * Math.sin(agent.angle + this.angle),
            aEyeY = this.position.y + this.maxRange * Math.cos(agent.angle + this.angle);
        this.maxPos.set(aEyeX, aEyeY);
        result = agent.world.sightCheck(this.position, this.maxPos, agent.world.walls, agent.world.agents.concat(agent.world.entities));
        if (result) {
            // eye collided with an entity
            this.sensedProximity = result.vecI.distFrom(this.position);
            this.sensedType = result.target.type;
            if ('vx' in result.vecI) {
                this.x = result.vecI.x;
                this.y = result.vecI.y;
                this.vx = result.vecI.vx;
                this.vy = result.vecI.vy;
            } else {
                this.x = 0;
                this.y = 0;
                this.vx = 0;
                this.vy = 0;
            }
        } else {
            this.sensedProximity = this.maxRange;
            this.sensedType = -1;
            this.x = 0;
            this.y = 0;
            this.vx = 0;
            this.vy = 0;
        }
    };

    global.Eye = Eye;
    global.Agent = Agent;

}(this));

