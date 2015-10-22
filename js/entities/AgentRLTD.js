var AgentRLTD = AgentRLTD || {};

(function (global) {
    "use strict";

    /**
     * Initialize the AgentRLTD
     * @name AgentRLTD
     * @extends Agent
     * @constructor
     *
     * @param {Vec} position - The x, y location
     * @param {agentOpts} opts - The Agent options
     * @param {cheatOpts} opts.cheats - The cheats to display
     * @param {brainOpts} opts.spec - The brain options
     * @param {Object} opts.env - The environment
     * @returns {AgentRLTD}
     */
    function AgentRLTD(position, opts) {
        var _this = this;
        Agent.call(this, position, opts);

        this.nStepsHistory = [];
        this.nStepsCounter = 0;
        this.nflot = 1000;
        this.score = 0;
        this.env = Utility.getOpt(opts, 'env', {});

        this.brainOpts = Utility.getOpt(opts, 'spec', {
            update: 'qlearn', // 'qlearn' or 'sarsa'
            gamma: 0.9, // discount factor, [0, 1)
            epsilon: 0.2, // initial epsilon for epsilon-greedy policy, [0, 1)
            alpha: 0.1, // value function learning rate
            lambda: 0.9, // eligibility trace decay, [0,1). 0 = no eligibility traces
            replacingTraces: true, // use replacing or accumulating traces
            planN: 50, // number of planning steps per iteration. 0 = no planning
            smoothPolicyUpdate: true, // non-standard, updates policy smoothly to follow max_a Q
            beta: 0.1 // learning rate for smooth policy update
        });


        if (!this.worker) {
            this.brain = new TDAgent(this.env, this.brainOpts);
            this.state = this.env.startState();

            this.env.reset();

            return this;
        } else {
            this.post = function (cmd, input) {
                this.brain.postMessage({target: 'TD', cmd: cmd, input: input});
            };

            var jEnv = Utility.stringify(_this.env),
                jOpts = Utility.stringify(_this.brainOpts);

            this.brain = new Worker('js/lib/external/rl.js');
            this.brain.onmessage = function (e) {
                var data = e.data;
                switch (data.cmd) {
                case 'init':
                    if (data.msg === 'complete') {
                        _this.state = _this.startState();

                        _this.reset();
                    }
                    break;
                case 'act':
                    if (data.msg === 'complete') {
                        // run it through environment dynamics
                        var obs = _this.sampleNextState(_this.state, data.input);

                        // allow opportunity for the agent to learn
                        _this.brain.postMessage({cmd: 'learn', input: obs.r});
                    }
                    break;
                case 'learn':
                    if (data.msg === 'complete') {
                        _this.Rarr[_this.state] = obs.r;

                        // evolve environment to next state
                        _this.state = obs.ns;
                        _this.gridLocation = _this.world.grid.getCellAt(_this.sToX(_this.state), _this.sToY(_this.state));

                        let x = _this.gridLocation.coords.bottom.right.x - (_this.world.grid.cellWidth / 2),
                            y = _this.gridLocation.coords.bottom.right.y - (_this.world.grid.cellHeight / 2);
                        _this.position.set(x, y);

                        _this.nStepsCounter += 1;
                        if (typeof obs.resetEpisode !== 'undefined') {
                            _this.score += 1;
                            _this.brain.postMessage({cmd: 'resetEpisode'});
                            // record the reward achieved
                            if (_this.nStepsHistory.length >= _this.nflot) {
                                _this.nStepsHistory = _this.nStepsHistory.slice(1);
                            }
                            _this.nStepsHistory.push(_this.nStepsCounter);
                            _this.nStepsCounter = 0;

                            _this.gridLocation = _this.world.grid.getCellAt(0, 0);
                            _this.position.set(_this.world.grid.cellWidth / 2, _this.world.grid.cellHeight / 2);
                        }
                    }
                    break;
                default:
                    console.log('Unknown command: ' + data.cmd + ' message:' + data.msg);
                    break;
                }
            };

            this.brain.post('init', {env: jEnv, opts: jOpts});
        }
    }

    AgentRLTD.prototype = Object.create(Agent.prototype);
    AgentRLTD.prototype.constructor = Agent;

    /**
     * Agent's chance to act on the world
     * @param {Object} world
     */
    AgentRLTD.prototype.tick = function (world) {
        this.world = world;
        if (!this.worker) {
            // ask agent for an action
            var a = this.brain.act(this.state),
            // run it through environment dynamics
                obs = this.sampleNextState(this.state, a);

            // allow opportunity for the agent to learn
            this.brain.learn(obs.r);
            this.Rarr[this.state] = obs.r;

            // evolve environment to next state
            this.state = obs.ns;
            this.gridLocation = world.grid.getCellAt(this.sToX(this.state), this.sToY(this.state));

            let x = this.gridLocation.coords.bottom.right.x - (world.grid.cellWidth / 2),
                y = this.gridLocation.coords.bottom.right.y - (world.grid.cellHeight / 2);
            this.position.set(x, y);

            this.nStepsCounter += 1;
            if (typeof obs.resetEpisode !== 'undefined') {
                this.score += 1;
                this.brain.resetEpisode();
                // record the reward achieved
                if (this.nStepsHistory.length >= this.nflot) {
                    this.nStepsHistory = this.nStepsHistory.slice(1);
                }
                this.nStepsHistory.push(this.nStepsCounter);
                this.nStepsCounter = 0;

                this.gridLocation = world.grid.getCellAt(0, 0);
                this.position.set(world.grid.cellWidth / 2, world.grid.cellHeight / 2);
            }
        } else {
            this.post('act', this.state);
        }
    };

    global.AgentRLTD = AgentRLTD;

}(this));

