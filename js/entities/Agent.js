(function (global) {
    "use strict";

    /**
     * Options for the Agent
     * @typedef {Object} agentOpts
     * @property {boolean} worker - Is the Agent a Web Worker
     * @property {string} brainType - The type of Brain to use
     * @property {cheatOpts} cheats - The cheats to display
     * @property {brainOpts} spec - The brain options
     * @property {envObject} env - The environment
     */

    /**
     * The env object is the representation of the environment
     * @typedef {Object} envObject
     * @property {number} numTypes - The number of types the Agent can sense
     * @property {number} numEyes - The number of the Agent's eyes
     * @property {number} range - The range of the eyes
     * @property {number} proximity - The proximity range of the eyes
     * @property {number} numActions - The number of actions the agent can perform
     * @property {number} numStates - The number of states
     * @property {number} getMaxNumActions - function that returns the numActions value
     * @property {number} getNumStates - function that returns the numStates value
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

    class Agent extends Entity {
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
        constructor(position, opts) {
            // Is it a worker
            let worker = Utility.getOpt(opts, 'worker', false);
            super((worker ? 'Agent Worker' : 'Agent'), position, opts);
            this.worker = worker;
            // Just a text value for the brain type, also useful for worker posts
            this.brainType = Utility.getOpt(opts, 'brainType', 'TD');
            // The number of item types the Agent's eyes can see
            this.numTypes = Utility.getOpt(opts, 'numTypes', 3);
            // The number of Agent's eyes
            this.numEyes = Utility.getOpt(opts, 'numEyes', 9);
            // The range of the Agent's eyes
            this.range = Utility.getOpt(opts, 'range', 85);
            // The proximity of the Agent's eyes
            this.proximity = Utility.getOpt(opts, 'proximity', 85);
            // The number of Agent's eyes times the number of known types
            this.numStates = this.numEyes * this.numTypes;

            // Set the brain options
            this.brainOpts = Utility.getOpt(opts, 'spec', {
                update: "qlearn", // qlearn | sarsa
                gamma: 0.9, // discount factor, [0, 1)
                epsilon: 0.2, // initial epsilon for epsilon-greedy policy, [0, 1)
                alpha: 0.005, // value function learning rate
                experienceAddEvery: 5, // number of time steps before we add another experience to replay memory
                experienceSize: 10000, // size of experience
                learningStepsPerIteration: 5,
                tdErrorClamp: 1.0, // for robustness
                numHiddenUnits: 100 // number of neurons in hidden layer
            });

            // The Agent's environment
            this.env = Utility.getOpt(opts, 'env', {});

            // The Agent's eyes
            if (this.eyes === undefined) {
                this.eyes = [];
                for (let k = 0; k < this.numEyes; k++) {
                    this.eyes.push(new Eye(k * 0.21, this.pos, this.range, this.proximity));
                }
            }

            this.action = null;
            this.angle = this.pos.getAngle();
            this.angleRadians = this.pos.getAngleInRadians();
            this.avgReward = 0;
            this.lastReward = 0;
            this.digestionSignal = 0.0;
            this.rewardBonus = 0.0;
            this.previousActionIdx = -1;
            this.epsilon = 0.000;

            this.pts = [];
            this.direction = 'N';
            this.brain = {};
            this.brainState = {};

            return this;
        }

        /**
         * Draws it
         * @returns {Entity}
         */
        draw() {
            if (this.useSprite) {
                this.sprite.position.set(this.pos.x, this.pos.y);
            } else {
                this.shape.clear();
                this.shape.lineStyle(1, 0x000000);
                this.shape.beginFill(this.color);
                this.shape.drawCircle(this.pos.x, this.pos.y, this.radius);
                this.shape.endFill();
            }

            if (this.cheats) {
                this.updateCheats();
            }

            return this;
        }

        /**
         * Move around
         * @returns {AgentRLDQN}
         */
        move(world) {
            let speed = 1;
            this.oldAngle = this.angle;
            this.oldPos = this.pos.clone();
            this.digestionSignal = 0;

            // Execute agent's desired action
            switch (this.action) {
                case 0:
                    this.pos.vx += -speed;
                    break;
                case 1:
                    this.pos.vx += speed;
                    break;
                case 2:
                    this.pos.vy += -speed;
                    break;
                case 3:
                    this.pos.vy += speed;
                    break;
            }

            // Forward the agent by velocity
            this.pos.vx *= 0.95;
            this.pos.vy *= 0.95;
            this.pos.advance();

            if (world.check(this)) {
                for (let i = 0; i < this.collisions.length; i++) {
                    let collisionObj = this.collisions[i];
                    if (collisionObj.type === 0) {
                        // Wall
                        this.pos = this.oldPos.clone();
                        this.pos.vx = 0;
                        this.pos.vy = 0;
                    } else if (collisionObj.type === 1 || collisionObj.type === 2) {
                        // Noms or Gnars
                        this.digestionSignal += (collisionObj.type === 1) ? this.carrot : this.stick;
                        world.deleteEntity(collisionObj.id);
                    } else if (collisionObj.type === 3 || collisionObj.type === 4) {
                        // Other Agents
                        this.pos.vx = collisionObj.target.vx;
                        this.pos.vy = collisionObj.target.vy;
                        if (world.population.has(collisionObj.id)){
                            let entity = world.population.get(collisionObj.id);
                            entity.pos.vy = collisionObj.entity.vy;
                            entity.pos.vy = collisionObj.entity.vy;
                        }
                    }
                }
            }

            // Handle boundary conditions.. bounce Agent
            let top = world.height - (world.height - this.radius),
                bottom = world.height - this.radius,
                left = world.width - (world.width - this.radius),
                right = world.width - this.radius;
            if (this.pos.x < left) {
                this.pos.x = left;
                this.pos.vx = 0;
                this.pos.vy = 0;
            }

            if (this.pos.x > right) {
                this.pos.x = right;
                this.pos.vx = 0;
                this.pos.vy = 0;
            }

            if (this.pos.y < top) {
                this.pos.y = top;
                this.pos.vx = 0;
                this.pos.vy = 0;
            }

            if (this.pos.y > bottom) {
                this.pos.y = bottom;
                this.pos.vx = 0;
                this.pos.vy = 0;
            }

            if (this.useSprite) {
                this.sprite.position.set(this.pos.x, this.pos.y);
            }

            return this;
        }

        /**
         * Tick the agent
         * @param {Object} world
         */
        tick(world) {
            // Let the agents behave in the world based on their input
            this.act(world);

            // If it's not a worker we need to run the rest of the steps
            if (!this.worker) {
                // Move eet!
                this.move(world);
                // This is where the agents learns based on the feedback of their
                // actions on the environment
                this.learn();
            }

            // Loop through the eyes and check the walls and nearby entities
            if (this.eyes !== undefined) {
                for (let ae = 0, ne = this.eyes.length; ae < ne; ae++) {
                    this.eyes[ae].sense(this, world);
                }
            }

            return this;
        }
        /**
         * Agent's chance to learn
         * @returns {Agent}
         */
        learn() {
            this.lastReward = this.digestionSignal;
            this.pts.push(this.digestionSignal);

            if (!this.worker) {
                this.brain.learn(this.digestionSignal);
                this.epsilon = this.brain.epsilon;
            } else {
                this.post('learn', this.digestionSignal);
            }

            return this;
        }

        /**
         * Load a pre-trained agent
         * @param {String} file
         */
        load(file) {
            $.getJSON(file, (data) => {
                if (!this.worker) {
                    this.brain.fromJSON(data);
                    this.brain.epsilon = 0.05;
                    this.brain.alpha = 0;
                } else {
                    this.post('load', JSON.stringify(data));
                }
            });

            return this;
        }

        /**
         *
         */
        save() {
            if (!this.worker) {
                this.brainState = JSON.stringify(this.brain.toJSON());
            } else {
                this.post('save');
            }
        }

    }

    global.Agent = Agent;

}(this));