var AgentGA = AgentGA || {},
    Agent = Agent || {},
    Utility = Utility || {},
    convnetjs = convnetjs || {},
    Chromosome = Chromosome || {},
    Brain = Brain || {};

(function (global) {
    "use strict";

    /**
     *
     * @constructor
     */
    function Brain() {
        this.nGameInput = 12; // 8 states for agent, plus 4 state for opponent
        this.nGameOutput = 4; // 4 buttons (right, left, up, down)
        this.nRecurrentState = 4; // extra recurrent states for feedback.
        this.nOutput = this.nGameOutput + this.nRecurrentState;
        this.nInput = this.nGameInput + this.nOutput;

        // store current inputs and outputs
        this.inputState = Utility.zeros(this.nInput);
        this.convInputState = new convnetjs.Vol(1, 1, this.nInput); // compatible with convnetjs lib input.
        this.outputState = Utility.zeros(this.nOutput);
        this.prevOutputState = Utility.zeros(this.nOutput);

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
        this.initialGene = randomizeNetwork(this.net);
        this.chromosome = new Chromosome(this.initialGene);
        this.chromosome.pushToNetwork(this.net);

        return this;
    }

    /**
     * Get output from neural network:
     */
    Brain.prototype.forward = function () {
        let a = this.net.forward(this.convInputState);
        for (let i = 0; i < this.nOutput; i++) {
            this.prevOutputState[i] = this.outputState[i]; // backs up previous value.
            this.outputState[i] = isNaN(a.w[i]) ? 0 : a.w[i];
        }
    };

    /**
     *
     * @param chromosome
     */
    Brain.prototype.populate = function (chromosome) { // populate network with a given chromosome.
        chromosome.pushToNetwork(this.net);
    };

    /**
     *
     * @param agent
     * @param target
     */
    Brain.prototype.setCurrentInputState = function (agent, target) {
        let i, scaleFactor = 10, // scale inputs to be in the order of magnitude of 10.
            scaleFeedback = 1; // to scale back up the feedback.
        this.inputState[0] = agent.state.x;
        this.inputState[1] = agent.state.y;
        this.inputState[2] = agent.state.vx;
        this.inputState[3] = agent.state.vy;

        this.inputState[4] = agent.state.ball.x; // The Nom position data
        this.inputState[5] = agent.state.ball.y;
        this.inputState[6] = agent.state.ball.vx;
        this.inputState[7] = agent.state.ball.vy;

        this.inputState[8] = 0 * target.state.x; // Other Agent Data
        this.inputState[9] = 0 * target.state.y;
        this.inputState[10] = 0 * target.state.vx;
        this.inputState[11] = 0 * target.state.vy;

        for (i = 0; i < this.nOutput; i++) { // feeds back output to input
            this.inputState[i + this.nGameInput] = this.outputState[i] * scaleFeedback * 1;
        }

        for (i = 0; i < this.nInput; i++) { // copies input state into convnet cube object format to be used later.
            this.convInputState.w[i] = this.inputState[i];
        }

        return this;
    };

    /**
     * Initialize the AgentGA
     * @name AgentGA
     * @extends Agent
     * @constructor
     *
     * @param {Vec} position - The x, y location
     * @param {agentOpts} opts - The Agent options
     * @returns {AgentGA}
     */
    function AgentGA(position, opts) {
        Agent.call(this, position, opts);

        this.target = null;
        this.score = 0;
        this.state = { // complete game state for this agent.  used by neural network.
            x: this.pos.x,
            y: this.pos.y,
            vx: this.pos.vx,
            vy: this.pos.vy,
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

        // setup neural network:
        this.layerDefs = [];
        this.layerDefs.push({type: 'input', out_x: 1, out_sy: 1, out_depth: 1});
        this.layerDefs.push({type: 'fc', num_neurons: 12, activation: 'relu'});
        this.layerDefs.push({type: 'fc', num_neurons: 8, activation: 'sigmoid'});
        this.layerDefs.push({type: 'regression', num_neurons: 1});

        // Set the brain options
        this.brainOpts = Utility.getOpt(opts, 'spec', {
            // we want 100 random networks to test out
            populationSize: 100,
            // each weight will get mutated with 10% prob
            mutationRate: 0.10,
            // we will keep the best 20% of the networks
            elitePercentage: 0.2,
            // add noise with stdev 0.02 during mutation
            mutationSize: 0.02,
            // stop if network achieves better score
            targetFitness: -0.03,
            // pass in our layer defs
            layerDefs: this.layerDefs
        });

        this.brain = new Brain();
        this.trainer = new GATrainer(this.brainOpts, this.brain.initialGene);

        return this;
    };

    AgentGA.prototype = Object.create(Agent.prototype);
    AgentGA.prototype.constructor = Agent;

    /**
     * Agent's chance to act on the world
     * @returns {AgentGA}
     */
    AgentGA.prototype.act = function () {
        return this;
    };

    /**
     * Returns game state for this agent
     * @returns {{x: number, y: *, vx: number, vy: *, bx: number, by: *, bvx: number, bvy: *}|*}
     */
    AgentGA.prototype.getState = function (entity) {
        // complete game state for this agent.  used by neural network.
        this.state = {
            x: this.pos.x,
            y: this.pos.y,
            vx: this.pos.vx,
            vy: this.pos.vy,
            ball: {
                x: entity.pos.x,
                y: entity.pos.y,
                vx: entity.pos.vx,
                vy: entity.pos.vy
            }
        };

        return this.state;
    };

    /**
     * Agent's chance to learn
     * @returns {AgentGA}
     */
    AgentGA.prototype.learn = function () {

        return this;
    };

    /**
     *
     */
    AgentGA.prototype.moveA = function () {

        return this;
    };

    /**
     *
     */
    AgentGA.prototype.processAction = function () {
        let right = this.action.right,
            left = this.action.left,
            up = this.action.up,
            down = this.action.down;

        if (right && !left) {
            this.pos.vx = playerSpeedX;
        }
        if (left && !right) {
            this.pos.vx = -playerSpeedX;
        }
        if (up) {
            this.pos.vy = -playerSpeedY;
        }
        if (down) {
            this.pos.vy = playerSpeedY;
        }

        return this;
    };

    /**
     *
     * @param right
     * @param left
     * @param up
     * @param down
     */
    AgentGA.prototype.setAction = function (right, left, up, down) {
        this.action.right = right;
        this.action.left = left;
        this.action.up = up;
        this.action.down = down;

        return this;
    };

    /**
     * this function converts the brain's output layer into actions to move forward, backward, or jump
     */
    AgentGA.prototype.setBrainAction = function () {
        let right = this.brain.outputState[0] > 0.75, // sigmoid decision.
            left = this.brain.outputState[1] > 0.75, // sigmoid decision.
            up = this.brain.outputState[2] > 0.75, // sigmoid decision.
            down = this.brain.outputState[3] > 0.75; // sigmoid decision.

        this.setAction(right, left, up, down);

        return this;
    };

    /**
     * Sets the target for this agent
     * @param {Entity} target
     */
    AgentGA.prototype.setTarget = function (target) {
        this.target = target;

        return this;
    };

    /**
    * Tick the agent
    * @param {Object} world
    */
    AgentGA.prototype.tick = function (world) {
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
     *
     */
    AgentGA.prototype.update = function () {
        this.move();

        return this;
    };

    global.AgentGA = AgentGA;

}(this));
