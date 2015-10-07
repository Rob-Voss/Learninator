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
        var a = this.net.forward(this.convInputState);
        for (var i = 0; i < this.nOutput; i++) {
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
        var i,
            scaleFactor = 10, // scale inputs to be in the order of magnitude of 10.
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
     * @param {Vec} position
     * @param {Object} opts
     * @returns {AgentGA}
     */
    var AgentGA = function (position, opts) {
        // Is it a worker
        this.worker = Utility.getOpt(opts, 'worker', false);
        this.name = 'Agent GA';
        if (this.worker) {
            this.name += ' Worker';
        }

        this.target = null;
        this.score = 0;
        this.state = { // complete game state for this agent.  used by neural network.
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

        Agent.call(this, position, opts);

        var _this = this;

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
    };

    /**
     *
     */
    AgentGA.prototype.processAction = function () {
        var right = this.action.right,
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
        var right = this.brain.outputState[0] > 0.75, // sigmoid decision.
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
     * Move around
     * @returns {AgentGA}
     */
    AgentGA.prototype.move = function () {
        var oldAngle = this.angle,
            speed = 1;
        this.oldPos = this.position.clone();

        // Execute agent's desired action
        switch (this.action) {
            case 0:
                this.position.vx += -speed;
                break;
            case 1:
                this.position.vx += speed;
                break;
            case 2:
                this.position.vy += -speed;
                break;
            case 3:
                this.position.vy += speed;
                break;
        }

        // Forward the agent by velocity
        this.position.vx *= 0.95;
        this.position.vy *= 0.95;
        this.position.x += this.position.vx;
        this.position.y += this.position.vy;

        if (this.collision) {
            // The agent is trying to move from oldPos to position so we need to check walls
            var result = Utility.collisionCheck(this.oldPos, this.position, this.world.walls);
            if (result) {
                // The agent derped! Wall collision! Reset their position
                //this.position.set(result.vecI.x + this.radius, result.vecI.y + this.radius);
                this.position = this.oldPos.clone();
                this.position.vx = 0;
                this.position.vy = 0;
            }
        }

        // Handle boundary conditions.. bounce Agent
        if (this.position.x < 2) {
            this.position.x = 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }

        if (this.position.x > this.world.width - 2) {
            this.position.x = this.world.width - 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }

        if (this.position.y < 2) {
            this.position.y = 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }

        if (this.position.y > this.world.height - 2) {
            this.position.y = this.world.height - 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }

        if (this.useSprite) {
            this.sprite.position.set(this.position.x, this.position.y);
        }

        var end = new Date().getTime(),
            dist = this.position.distFrom(this.oldPos);

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
