(function (global) {
    "use strict";

    const entityTypes = ['Wall', 'Nom', 'Gnar', 'Agent', 'Agent Worker', 'Entity Agent'];

    // Matter aliases
    var Body = Matter.Body,
        Vector = Matter.Vector,
        Composite = Matter.Composite,
        Query = Matter.Query;

    class PhysicalAgent {

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
            this.id = 'agent-' + body.id;
            this.body = body;
            this.body.label = 'Agent';
            this.radius = this.body.circleRadius;
            this.speed = 1;
            this.force = {x:0, y:0};
            this.name = 'Physical Agent';
            this.age = 0;
            this.action = 0;
            this.color = 0x0000FF;
            this.avgReward = 0;
            this.lastReward = 0;
            this.digestion = 0.0;
            this.epsilon = 0.000;
            this.brainState = {};

            // Just a text value for the brain type, also useful for worker posts
            this.brainType = Utility.getOpt(opts, 'brainType', 'TD');
            // The number of item types the Agent's eyes can see
            this.numTypes = Utility.getOpt(opts, 'numTypes', 3);
            // The agent's proprioception includes two additional sensors for
            // its own speed in both x and y directions
            this.numProprioception = Utility.getOpt(opts, 'numProprioception', 2);
            // The number of Agent's eyes
            this.numEyes = Utility.getOpt(opts, 'numEyes', 9);
            // The range of the Agent's eyes
            this.range = Utility.getOpt(opts, 'range', 85);
            // The proximity of the Agent's eyes
            this.proximity = Utility.getOpt(opts, 'proximity', 85);
            // The number of Agent's eyes times the number of known types
            this.numStates = this.numEyes * this.numTypes + this.numProprioception;

            // The Agent's eyes
            this.eyes = [];
            for (let k = 0; k < this.numEyes; k++) {
                var eye = {
                    angle: k * 0.21,
                    sensed: {
                        type: -1,
                        proximity: this.range,
                        position: {x: 0, y: 0},
                        velocity: {x: 0, y: 0}
                    },
                    maxPos: {x:0, y:0},
                    shape: new PIXI.Graphics()
                };
                eye.shape.position = this.body.position;
                this.eyes.push(eye);
            }

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
            this.brain = new RL.DQNAgent(this.env, this.brainOpts);

            return this;
        }

        /**
         * Agent's chance to act on the world
         * @param {Array} bodies
         * @returns {PhysicalAgent}
         */
        act(bodies) {
            let ne = this.numEyes * this.numTypes,
                input = new Array(this.numStates);
            for (let i = 0; i < this.numEyes; i++) {
                // Check for Ray collisions
                let eye = this.eyes[i],
                    eyeEnd = Vector.create(
                        this.body.position.x + this.range * Math.sin(this.body.angle + eye.angle),
                        this.body.position.y + this.range * Math.cos(this.body.angle + eye.angle)
                    ),
                    collisions = Query.ray(bodies, this.body.position, eyeEnd, 1);

                // Reset our eye data
                eye.sensed = {
                    type: -1,
                    proximity: this.range,
                    position: eyeEnd,
                    velocity: {x: 0, y: 0}
                };

                // Loop through the Ray collisions and record what the eyes saw
                for (let ic = 0; ic < collisions.length; ic++) {
                    let collision = collisions[ic];
                    if (collision.bodyA.id !== this.body.id) {
                        let dx = this.body.position.x - collision.body.position.x,
                            dy = this.body.position.y - collision.body.position.y;

                        eye.sensed.type = entityTypes.indexOf(collision.bodyA.label);
                        eye.sensed.proximity = Math.sqrt(dx * dx + dy * dy);
                        eye.sensed.position = collision.body.position;
                        eye.sensed.velocity = collision.body.velocity;
                    }
                }

                // Populate the sensory input array
                input[i * this.numTypes + 0] = 0.5;
                input[i * this.numTypes + 1] = 1.0;
                input[i * this.numTypes + 2] = 1.0;
                input[i * this.numTypes + 3] = eye.sensed.velocity.x; // velocity information of the sensed target
                input[i * this.numTypes + 4] = eye.sensed.velocity.y;
                if (eye.sensed.type !== -1) {
                    // sensedType is 0 for wall, 1 for food and 2 for poison.
                    // lets do a 1-of-k encoding into the input array
                    input[i * this.numTypes + eye.sensed.type] = eye.sensed.proximity / this.range; // normalize to [0,1]
                }
            }

            // proprioceptive and orientation
            input[ne + 0] = this.body.velocity.x;
            input[ne + 1] = this.body.velocity.y;

            this.action = this.brain.act(input);

            return this;
        }

        draw(context) {
            for (let i = 0; i < this.numEyes; i++) {
                let eye = this.eyes[i],
                    type = eye.sensed.type;

                switch (type) {
                    case 1:
                        // It is noms
                        context.strokeStyle = '#FF0000';
                        break;
                    case 2:
                        // It is gnar gnar
                        context.strokeStyle = '#00FF00';
                        break;
                    case 3:
                    case 4:
                    case 5:
                        // Is it another Agent
                        context.strokeStyle = '#0000FF';
                        break;
                    default:
                        // Is it wall or nothing?
                        context.strokeStyle = '#FFFFFF';
                        break;
                }

                let eyeStartX = eye.shape.position.x + this.radius * Math.sin(this.body.angle + eye.angle),
                    eyeStartY = eye.shape.position.y + this.radius * Math.cos(this.body.angle + eye.angle),
                    eyeEndX = eye.shape.position.x + eye.sensed.proximity * Math.sin(this.body.angle + eye.angle),
                    eyeEndY = eye.shape.position.y + eye.sensed.proximity * Math.cos(this.body.angle + eye.angle);
                eye.position = Vector.create(eyeStartX, eyeStartY);
                eye.maxPos = Vector.create(eyeEndX, eyeEndY);

                // Draw the agent's line of sights
                context.beginPath();
                context.moveTo(eye.position.x, eye.position.y);
                context.lineTo(eye.maxPos.x, eye.maxPos.y);
                context.stroke();
                if ((type === 2 || type === 1)) {
                    let color = (type === 2) ? '#FF0000' : '#00FF00';
                    // Show a little box
                    context.rect(eye.sensed.position.x - 5, eye.sensed.position.y - 5, 10, 10);
                    context.fillStyle = color;
                    context.fill();
                }
            }
        }

        /**
         * Agent's chance to learn
         * @returns {PhysicalAgent}
         */
        learn() {
            this.brain.learn(this.digestion);
            this.lastReward = this.digestion;
            this.epsilon = this.brain.epsilon;
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
         *
         */
        move() {
            // Execute agent's desired action
            switch (this.action) {
                case 0: // Left
                    this.force.x = -this.speed * 0.0025;
                    break;
                case 1: // Right
                    this.force.x = this.speed * 0.0025;
                    break;
                case 2: // Up
                    this.force.y = -this.speed * 0.0025;
                    break;
                case 3: // Down
                    this.force.y = this.speed * 0.0025;
                    break;
            }
            Body.applyForce(this.body, this.body.position, this.force);
        }

        /**
         * Tick the agent
         * @returns {PhysicalAgent}
         */
        tick(engine) {
            this.age += 1;
            // Let the agents behave in the world based on their input
            this.act(engine.world.bodies);
            // Move eet!
            this.move();
            // This is where the agents learn based on their actions on the environment
            this.learn();

            return this;
        }

    }
    global.PhysicalAgent = PhysicalAgent;

}(this));