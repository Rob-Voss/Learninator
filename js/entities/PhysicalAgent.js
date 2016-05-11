(function (global) {
    "use strict";

    const entityTypes = ['Wall', 'Nom', 'Gnar', 'Agent', 'Agent Worker', 'Entity Agent'];

    // Matter aliases
    var Body = Matter.Body,
        Vector = Matter.Vector,
        Query = Matter.Query;

    class PhysicalAgent {

        /**
         * Initialize the Agent
         * @name PhysicalAgent
         * @extends Entity
         * @constructor
         *
         * @param {Matter.Body} body - The Matter.Body
         * @param {agentOpts} opts - The Agent options
         * @returns {PhysicalAgent}
         */
        constructor(body, opts) {
            this.id = 'agent-' + body.id;
            this.body = body;
            this.body.label = 'Agent';
            this.position = this.body.position;
            this.radius = this.body.circleRadius;
            this.type = entityTypes.indexOf(this.body.label);
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
            this.brain = {};
            this.brainState = {};

            // Reward or punishment
            this.carrot = 1;
            this.stick = -1;

            this.nStepsHistory = [];
            this.pts = [];

            // Is it a worker
            this.worker = Utility.getOpt(opts, 'worker', false);
            // Just a text value for the brain type, also useful for worker posts
            this.brainType = Utility.getOpt(opts, 'brainType', 'RL.DQNAgent');
            // The number of actions the Agent can do
            this.numActions = Utility.getOpt(opts, 'numActions', 4);
            // The number of item types the Agent's eyes can see
            this.numTypes = Utility.getOpt(opts, 'numTypes', 3);
            // The number of Agent's eyes
            this.numEyes = Utility.getOpt(opts, 'numEyes', 9);
            // The number of Agent's proprioception values
            this.numProprioception = Utility.getOpt(opts, 'numProprioception', 0);
            // The range of the Agent's eyes
            this.range = Utility.getOpt(opts, 'range', 85);
            // The proximity of the Agent's eyes
            this.proximity = Utility.getOpt(opts, 'proximity', 85);
            // The number of Agent's eyes times the number of known types plus the number of
            // proprioception values it is tracking
            this.numStates = this.numEyes * this.numTypes + this.numProprioception;

            // The Agent's actions
            this.actions = [];
            for (let i = 0; i < this.numActions; i++) {
                this.actions.push(i);
            }

            // Set the brain options
            this.brainOpts = Utility.getOpt(opts, 'spec', {
                update: 'qlearn',
                gamma: 0.9,
                epsilon: 0.2,
                alpha: 0.005,
                experienceAddEvery: 5,
                experienceSize: 10000,
                learningStepsPerIteration: 5,
                tdErrorClamp: 1.0,
                numHiddenUnits: 100
                // update: "qlearn", // qlearn | sarsa
                // gamma: 0.75, // discount factor, [0, 1)
                // epsilon: 0.1, // initial epsilon for epsilon-greedy policy, [0, 1)
                // alpha: 0.01, // value function learning rate
                // experienceAddEvery: 25, // number of time steps before we add another experience to replay memory
                // experienceSize: 5000, // size of experience
                // learningStepsPerIteration: 10,
                // tdErrorClamp: 1.0, // for robustness
                // numHiddenUnits: 100 // number of neurons in hidden layer
            });

            // The Agent's environment
            this.env = Utility.getOpt(opts, 'env', {
                getNumStates: () => {
                    return this.numStates;
                },
                getMaxNumActions: () => {
                    return this.numActions;
                },
                startState: () => {
                    return 0;
                }
            });

            // The Agent's eyes
            if (this.eyes === undefined) {
                this.eyes = [];
                for (let k = 0; k < this.numEyes; k++) {
                    let eye = new Eye(k * 0.21, this);
                    this.eyes.push(eye);
                }
            }

            this.reset();

            return this;
        }

        draw(context) {
            for (let i = 0; i < this.numEyes; i++) {
                let eye = this.eyes[i],
                    type = eye.sensed.type;

                switch (type) {
                    case 0:
                        context.strokeStyle = '#000000';
                        break;
                    case 1:
                        // It is noms
                        context.strokeStyle = '#00FF00';
                        break;
                    case 2:
                        // It is gnar gnar
                        context.strokeStyle = '#FF0000';
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

                let eyeStartX = this.body.position.x + this.radius * Math.sin(this.body.angle + eye.angle),
                    eyeStartY = this.body.position.y + this.radius * Math.cos(this.body.angle + eye.angle),
                    eyeEndX = eye.sensed.position.x,
                    eyeEndY = eye.sensed.position.y;
                eye.v1 = Vector.create(eyeStartX, eyeStartY);
                eye.v2 = Vector.create(eyeEndX, eyeEndY);

                // Draw the agent's line of sights
                context.beginPath();
                context.moveTo(eye.v1.x, eye.v1.y);
                context.lineTo(eye.v2.x, eye.v2.y);
                context.stroke();
                if (type !== -1) {
                    // Show a little box
                    context.rect(eye.v2.x - 2.5, eye.v2.y - 2.5, 5, 5);
                    context.fillStyle = context.strokeStyle;
                    context.fill();
                }
            }
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
         * Reset or set up the Agent
         * @returns {PhysicalAgent}
         */
        reset() {
            var brain = this.brainType.split('.');
            // If it's a worker then we have to load it a bit different
            if (!this.worker) {
                this.brain = new global[brain[0]][brain[1]](this.env, this.brainOpts);

                return this;
            } else {
                this.post = (cmd, input) => {
                    this.brain.postMessage({target: this.brainType, cmd: cmd, input: input});
                };

                let jEnv = Utility.stringify(this.env),
                    jOpts = Utility.stringify(this.brainOpts);

                this.brain = new Worker('js/lib/external/rl.js');
                this.brain.onmessage = (e) => {
                    let data = e.data;
                    switch (data.cmd) {
                        case 'act':
                            if (data.msg === 'complete') {
                                this.action = data.input;
                                this.move();
                                this.learn();
                            }
                            break;
                        case 'init':
                            if (data.msg === 'complete') {
                                //
                            }
                            break;
                        case 'learn':
                            if (data.msg === 'complete') {
                                this.brainState = JSON.stringify(data.input);
                            }
                            break;
                        case 'load':
                            if (data.msg === 'complete') {
                                this.brainState = JSON.stringify(data.input);
                            }
                            break;
                        case 'save':
                            if (data.msg === 'complete') {
                                this.brainState = JSON.stringify(data.input);
                            }
                            break;
                        default:
                            console.log('Unknown command: ' + data.cmd + ' message:' + data.msg);
                            break;
                    }
                };

                this.post('init', {env: jEnv, opts: jOpts});
            }

            return this;
        }

        /**
         * Tick the agent
         * @param {Matter.Engine} engine
         * @returns {PhysicalAgent}
         */
        tick(bodies) {
            this.age += 1;
            // Let the agents behave in the world based on their input

            let ne = this.numEyes * this.numTypes,
                input = new Array(this.numStates);
            for (let i = 0; i < this.numEyes; i++) {
                // Check for Ray collisions
                this.eyes[i].v1 = Vector.create(
                    this.body.position.x + (this.radius + 2) * Math.sin(this.body.angle + this.eyes[i].angle),
                    this.body.position.y + (this.radius + 2) * Math.cos(this.body.angle + this.eyes[i].angle)
                );
                this.eyes[i].v2 = Vector.create(
                    this.eyes[i].v1.x + this.range * Math.sin(this.body.angle + this.eyes[i].angle),
                    this.eyes[i].v1.y + this.range * Math.cos(this.body.angle + this.eyes[i].angle)
                );
                let collisions = Query.ray(bodies, this.eyes[i].v1, this.eyes[i].v2, 1);

                // Reset our eye data
                this.eyes[i].sensed = {
                    type: -1,
                    proximity: this.range,
                    position: this.eyes[i].v2,
                    velocity: {x: 0, y: 0}
                };

                // Loop through the Ray collisions and record what the eyes saw
                for (let ic = 0; ic < collisions.length; ic++) {
                    let collision = collisions[ic], dx, dy, vecI;
                    if (collision.bodyA.id !== this.body.id) {
                        if (collision.body.entity.type === 0) {
                            let topBottom = collision.body.entity.width > collision.body.entity.height,
                                leftRight = collision.body.entity.width < collision.body.entity.height,
                                pathV1 = this.eyes[i].v1,
                                pathV2 = this.eyes[i].v2,
                                lineV1 = Vector.create(
                                    collision.body.entity.x,
                                    collision.body.entity.y
                                ),
                                lineV2 = Vector.create(
                                    collision.body.entity.x + (topBottom) ? collision.body.entity.width : 0,
                                    collision.body.entity.y + (leftRight) ? collision.body.entity.height : 0
                                ),
                                denom = (lineV2.y - lineV1.y) * (pathV2.x - pathV1.x) - (lineV2.x - lineV1.x) * (pathV2.y - pathV1.y);
                            if (denom !== 0.0) {
                                let ua = ((lineV2.x - lineV1.x) * (pathV1.y - lineV1.y) - (lineV2.y - lineV1.y) * (pathV1.x - lineV1.x)) / denom,
                                    ub = ((pathV2.x - pathV1.x) * (pathV1.y - lineV1.y) - (pathV2.y - pathV1.y) * (pathV1.x - lineV1.x)) / denom;
                                if (ua > 0.0 && ua < 1.0 && ub > 0.0 && ub < 1.0) {
                                    vecI = Vector.create(pathV1.x + ua * (pathV2.x - pathV1.x), pathV1.y + ua * (pathV2.y - pathV1.y));
                                    this.eyes[i].sensed.position.x = vecI.x;
                                    this.eyes[i].sensed.position.y = vecI.y;
                                }
                            }
                        } else {
                            this.eyes[i].sensed.position.x = collision.body.position.x;
                            this.eyes[i].sensed.position.y = collision.body.position.y;
                        }
                        let dx = collision.body.position.x - this.eyes[i].sensed.position.x,
                            dy = collision.body.position.y - this.eyes[i].sensed.position.y;

                        this.eyes[i].sensed.type = collision.body.entity.type;
                        this.eyes[i].sensed.proximity = Math.sqrt(dx * dx + dy * dy);
                        this.eyes[i].sensed.velocity.x = collision.body.velocity.x;
                        this.eyes[i].sensed.velocity.y = collision.body.velocity.y;
                        if (isNaN(this.eyes[i].sensed.proximity)) {
                            console.log();
                        }
                    }
                }

                // Populate the sensory input array
                input[i * this.numTypes + 0] = 1;
                input[i * this.numTypes + 1] = 1;
                input[i * this.numTypes + 2] = 1;
                input[i * this.numTypes + 3] = this.eyes[i].sensed.velocity.x; // velocity information of the sensed target
                input[i * this.numTypes + 4] = this.eyes[i].sensed.velocity.y;
                if (this.eyes[i].sensed.type !== -1) {
                    // sensedType is 0 for wall, 1 for food and 2 for poison.
                    // lets do a 1-of-k encoding into the input array
                    // normalize to [0,1]
                    let inputVal = this.eyes[i].sensed.proximity / this.eyes[i].range;
                    input[i * this.numTypes + this.eyes[i].sensed.type] = inputVal;
                }
            }

            // proprioceptive and orientation
            input[ne + 0] = this.body.velocity.x;
            input[ne + 1] = this.body.velocity.y;

            this.action = this.brain.act(input);

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
            this.position = this.body.position;

            this.lastReward = this.digestion;
            this.brain.learn(this.digestion);
            this.epsilon = this.brain.epsilon;
            this.digestion = 0;
if (this.lastReward > 1) {
    console.log();
}
            return this;
        }

    }
    global.PhysicalAgent = PhysicalAgent;

}(this));