(function (global) {
    "use strict";

    var Utility = global.Utility || {},
        convnetjs = global.convnetjs || {};

    class Brain {

        /**
         *
         * @constructor
         */
        constructor() {
            // 8 states for agent, plus 4 state for opponent
            this.nGameInput = 12;
            // 4 buttons (right, left, up, down)
            this.nGameOutput = 4;
            // extra recurrent states for feedback.
            this.nRecurrentState = 4;
            this.nOutput = this.nGameOutput + this.nRecurrentState;
            this.nInput = this.nGameInput + this.nOutput;

            // store current inputs and outputs
            this.inputState = Utility.Maths.zeros(this.nInput);
            this.convInputState = new convnetjs.Vol(1, 1, this.nInput); // compatible with convnetjs lib input.
            this.outputState = Utility.Maths.zeros(this.nOutput);
            this.prevOutputState = Utility.Maths.zeros(this.nOutput);

            // setup neural network:
            this.layerDefs = [];
            this.layerDefs.push({
                type: 'input',
                out_sx: 1,
                out_sy: 1,
                out_depth: this.nInput
            });
            this.layerDefs.push({
                type: 'fc',
                num_neurons: this.nOutput,
                activation: 'tanh'
            });

            this.net = new convnetjs.Net();
            this.net.makeLayers(this.layerDefs);

            this.initialGene = RL.randomizeNetwork(this.net);
            this.chromosome = new RL.Chromosome(this.initialGene);
            this.chromosome.pushToNetwork(this.net);

            return this;
        }

        /**
         *
         * @param x
         * @param precision
         * @return {string}
         */
        arrayToString(x, precision) {
            var result = "[";
            for (var i = 0; i < x.length; i++) {
                result += Math.round(precision * x[i]) / precision;
                if (i < x.length - 1) {
                    result += ",";
                }
            }
            result += "]";

            return result;
        }

        /**
         * Get output from neural network:
         */
        forward() {
            let a = this.net.forward(this.convInputState);
            for (let i = 0; i < this.nOutput; i++) {
                this.prevOutputState[i] = this.outputState[i]; // backs up previous value.
                this.outputState[i] = a.w[i];
            }
        }

        getInputStateString() {
            return this.arrayToString(this.inputState, 100);
        }

        getOutputStateString() {
            return this.arrayToString(this.outputState, 100);
        }

        /**
         * Populate network with a given chromosome.
         * @param chromosome
         */
        populate(chromosome) {
            chromosome.pushToNetwork(this.net);
        }

        /**
         *
         * @param agent
         * @param target
         */
        setCurrentInputState(agent, target) {
            let i,
                // Scale inputs to be in the order of magnitude of 10.
                scaleFactor = 10,
                // To scale back up the feedback.
                scaleFeedback = 1;

            this.inputState[0] = agent.state.x / scaleFactor;
            this.inputState[1] = agent.state.y / scaleFactor;
            this.inputState[2] = agent.state.vx / scaleFactor;
            this.inputState[3] = agent.state.vy / scaleFactor;
            this.inputState[4] = agent.state.bx / scaleFactor;
            this.inputState[5] = agent.state.by / scaleFactor;
            this.inputState[6] = agent.state.bvx / scaleFactor;
            this.inputState[7] = agent.state.bvy / scaleFactor;
            this.inputState[8] = 0 * target.state.x / scaleFactor;
            this.inputState[9] = 0 * target.state.y / scaleFactor;
            this.inputState[10] = 0 * target.state.vx / scaleFactor;
            this.inputState[11] = 0 * target.state.vy / scaleFactor;
            for (i = 0; i < this.nOutput; i++) {
                // feeds back output to input
                this.inputState[i + this.nGameInput] = this.outputState[i] * scaleFeedback;
            }

            for (i = 0; i < this.nInput; i++) {
                // copies input state into convnet cube object format to be used later.
                this.convInputState.w[i] = this.inputState[i];
            }

            return this;
        }
    }
    global.Brain = Brain;

    class AgentGA {

        /**
         * Initialize the AgentGA
         * @name AgentGA
         * @extends Agent
         * @constructor
         *
         * @param {Vec} position - The x, y location
         * @param {agentOpts} opts - The Agent options
         * @return {AgentGA}
         */
        constructor(position, opts) {
            // super(position, opts);
            this.position = position;
            this.target = null;
            this.score = 0;
            // Complete game state for this agent.
            // used by neural network.
            this.state = {
                x: this.position.x,
                y: this.position.y,
                vx: this.position.vx,
                vy: this.position.vy,
                ball: {
                    x: 0,
                    y: 0,
                    vx: 0,
                    vy: 0
                }
            };

            this.action = {
                right: false,
                left: false,
                up: false,
                down: false
            };

            this.shape = new PIXI.Graphics();
            this.shape.clear();
            this.shape.lineStyle(0.5, 0x000000, 0.8);
            this.shape.beginFill(this.color);
            this.shape.drawCircle(this.position.x, this.position.y, this.radius);
            this.shape.endFill();
            this.bounds = this.shape.getBounds();

            this.brain = new Brain();

            return this;
        }

        /**
         * Returns game state for this agent
         * @return {{x: number, y: *, vx: number, vy: *, bx: number, by: *, bvx: number, bvy: *}|*}
         */
        getState(entity) {
            // complete game state for this agent.  used by neural network.
            this.state = {
                x: this.position.x,
                y: this.position.y,
                vx: this.position.vx,
                vy: this.position.vy,
                ball: {
                    x: entity.position.x,
                    y: entity.position.y,
                    vx: entity.position.vx,
                    vy: entity.position.vy
                }
            };

            return this.state;
        }

        /**
         *
         */
        processAction() {
            let right = this.action.right,
                left = this.action.left,
                up = this.action.up,
                down = this.action.down;

            if (right && !left) {
                this.position.vx = playerSpeedX;
            }
            if (left && !right) {
                this.position.vx = -playerSpeedX;
            }
            if (up) {
                this.position.vy = -playerSpeedY;
            }
            if (down) {
                this.position.vy = playerSpeedY;
            }

            return this;
        }

        /**
         *
         * @param right
         * @param left
         * @param up
         * @param down
         */
        setAction(right, left, up, down) {
            this.action.right = right;
            this.action.left = left;
            this.action.up = up;
            this.action.down = down;

            return this;
        }

        /**
         * this function converts the brain's output layer into actions to move forward, backward, or jump
         */
        setBrainAction() {
            let right = this.brain.outputState[0] > 0.75, // sigmoid decision.
                left = this.brain.outputState[1] > 0.75, // sigmoid decision.
                up = this.brain.outputState[2] > 0.75, // sigmoid decision.
                down = this.brain.outputState[3] > 0.75; // sigmoid decision.

            this.setAction(right, left, up, down);

            return this;
        }

        /**
         * Sets the target for this agent
         * @param {Entity} target
         */
        setTarget(target) {
            this.target = target;

            return this;
        }

        /**
         *
         */
        update() {
            // this.move();

            return this;
        }
    }
    global.AgentGA = AgentGA;

}(this));
