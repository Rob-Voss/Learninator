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

    // Matter aliases
    var Body = Matter.Body,
        Vector = Matter.Vector,
        Composite = Matter.Composite,
        Query = Matter.Query;

    class PhysicalAgent extends PhysicalEntity {

        /**
         * Initialize the Agent
         * @name Agent
         * @extends Entity
         * @constructor
         *
         * @param {Matter.Body} body -
         * @param {agentOpts} opts - The Agent options
         * @returns {PhysicalAgent}
         */
        constructor(body, opts) {
            super('Agent', body);

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
            this.eyes = [];
            for (let k = 0; k < this.numEyes; k++) {
                this.eyes.push(new Eye(k * 0.21, this, this.range, this.proximity));
            }

            this.action = 0;
            this.avgReward = 0;
            this.lastReward = 0;
            this.digestion = 0.0;
            this.epsilon = 0.000;

            this.pts = [];
            this.brain = new RL.DQNAgent(this.env, this.brainOpts);
            this.brainState = {};

            // this.load('zoo/wateragent.json');

            return this;
        }

        /**
         * Agent's chance to act on the world
         * @returns {PhysicalAgent}
         */
        act() {
            // in forward pass the agent simply behaves in the environment
            let ne    = this.numEyes * this.numTypes,
                input = new Array(this.numStates);
            for (let i = 0; i < this.numEyes; i++) {
                let eye = this.eyes[i];
                input[i * this.numTypes] = 1.0;
                input[i * this.numTypes + 1] = 1.0;
                input[i * this.numTypes + 2] = 1.0;
                input[i * this.numTypes + 3] = eye.v.x; // velocity information of the sensed target
                input[i * this.numTypes + 4] = eye.v.y;
                if (eye.sensedType !== -1) {
                    // sensedType is 0 for wall, 1 for food and 2 for poison.
                    // lets do a 1-of-k encoding into the input array
                    input[i * this.numTypes + eye.sensedType] = eye.proximity / eye.range; // normalize to [0,1]
                }
            }

            // proprioceptive and orientation
            input[ne + 0] = this.body.velocity.x;
            input[ne + 1] = this.body.velocity.y;

            this.action = this.brain.act(input);

            return this;
        }

        draw(world) {
            // Loop through the eyes and check the walls and nearby entities
            for (let ae = 0, ne = this.eyes.length; ae < ne; ae++) {
                this.eyes[ae].sense(world);
            }
        }
        /**
         * Agent's chance to learn
         * @returns {PhysicalAgent}
         */
        learn() {
            this.lastReward = this.digestion;
            this.brain.learn(this.lastReward);
            this.digestion = 0;

            return this;
        }

        /**
         * Load a pre-trained agent
         * @param {String} file
         */
        load(file) {
            let self = this;
            $.getJSON(file, (data) => {
                if (self.brain.valueNet !== undefined) {
                    self.brain.valueNet.fromJSON(data);
                } else {
                    self.brain.fromJSON(data);
                }
                self.brain.epsilon = 0.05;
                self.brain.alpha = 0;
            });

            return self;
        }

        /**
         * Tick the agent
         * @returns {PhysicalAgent}
         */
        tick(world) {
            // Let the agents behave in the world based on their input
            this.act();

            // Move eet!
            this.move();

            // This is where the agents learn based on their actions on the environment
            this.learn();

            return this;
        }

    }
    global.PhysicalAgent = PhysicalAgent;

    class Eye {

        /**
         * Eye sensor has a maximum range and senses entities and walls
         * @name Eye
         * @constructor
         *
         * @param angle
         * @param agent
         * @param range
         * @param proximity
         * @returns {Eye}
         */
        constructor(angle, agent, range = 85, proximity = 85) {
            this.angle = angle;
            this.range = range;
            this.agent = agent;
            this.body = agent.body;
            this.radius = range;
            this.proximity = proximity;
            this.sensedType = -1;
            this.v = {x: 0, y: 0};

            return this;
        }

        /**
         * Sense the surroundings
         */
        sense(world) {
            let startPoint = this.body.position,
                aEyeX = startPoint.x + this.range * Math.sin(this.body.angle + this.angle),
                aEyeY = startPoint.y + this.range * Math.cos(this.body.angle + this.angle),
                bodies = Composite.allBodies(world.engine.world),
                context = world.engine.render.context,
                endPoint = Vector.create(aEyeX, aEyeY),
                collisions = Query.ray(bodies, startPoint, endPoint);

            context.beginPath();
            context.moveTo(startPoint.x, startPoint.y);
            context.lineTo(endPoint.x, endPoint.y);
            context.strokeStyle = (collisions.length > 0) ? '#fff': '#555';
            context.lineWidth = 0.5;
            context.stroke();

            for (let i = 0; i < collisions.length; i++) {
                let collision = collisions[i];
                if (collision.bodyA.id !== this.body.id) {
                    this.v.x = collision.bodyA.velocity.x;
                    this.v.y = collision.bodyA.velocity.y;
                    switch (collision.bodyA.label) {
                        case 'Gnar':
                            this.sensedType = 2;
                            break;
                        case 'Nom':
                            this.sensedType = 1;
                            break;
                        case 'Wall':
                            this.sensedType = 0;
                            break;
                        default:
                            this.sensedType = -1;
                            break;

                    }
                    context.rect(collision.bodyA.position.x - 5, collision.bodyA.position.y - 5, 10, 10);
                }
            }

            context.fillStyle = 'rgba(255, 165, 0, 1)';
            context.fill();
        }
    }
    global.Eye = Eye;

}(this));