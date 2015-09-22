(function (global) {
    "use strict";

    /**
     * Initialize the AgentRLTD
     *
     * @param {Vec} position
     * @param {Object} env
     * @param {Object} opts
     * @returns {AgentRLTD}
     */
    var AgentRLTD = function (position, env, opts) {
        Agent.call(this, position, env, opts);

        this.grid = env.grid;
        this.gS = this.grid.yCount * this.grid.xCount;
        this.nsteps_history = [];
        this.nStepsCounter = 0;
        this.nflot = 1000;
        this.score = 0;

        this.name = "Agent RLTD";

        this.brainOpts = opts.spec || {
            update: 'qlearn', // 'qlearn' or 'sarsa'
            gamma: 0.9, // discount factor, [0, 1)
            epsilon: 0.2, // initial epsilon for epsilon-greedy policy, [0, 1)
            alpha: 0.1, // value function learning rate
            lambda: 0.9, // eligibility trace decay, [0,1). 0 = no eligibility traces
            replacingTraces: true, // use replacing or accumulating traces
            planN: 50, // number of planning steps per iteration. 0 = no planning
            smoothPolicyUpdate: true, // non-standard, updates policy smoothly to follow max_a Q
            beta: 0.1 // learning rate for smooth policy update
        };

        var _this = this;

        if (!this.worker) {
            this.brain = new TDAgent(env, this.brainOpts);
            this.state = env.startState();

            env.reset();

            return this;
        } else {
            var jEnv = Utility.stringify(_this),
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
                        _this.gridLocation = _this.smallWorld.grid.getCellAt(_this.sToX(_this.state), _this.sToY(_this.state));

                        let x = _this.gridLocation.coords.bottom.right.x - (_this.smallWorld.grid.cellWidth / 2),
                            y = _this.gridLocation.coords.bottom.right.y - (_this.smallWorld.grid.cellHeight / 2);
                        _this.position.set(x, y);

                        _this.nStepsCounter += 1;
                        if (typeof obs.resetEpisode !== 'undefined') {
                            _this.score += 1;
                            _this.brain.postMessage({cmd: 'resetEpisode'});
                            // record the reward achieved
                            if (_this.nsteps_history.length >= _this.nflot) {
                                _this.nsteps_history = _this.nsteps_history.slice(1);
                            }
                            _this.nsteps_history.push(_this.nStepsCounter);
                            _this.nStepsCounter = 0;

                            _this.gridLocation = _this.smallWorld.grid.getCellAt(0, 0);
                            _this.position.set(_this.smallWorld.grid.cellWidth / 2, _this.smallWorld.grid.cellHeight / 2);
                        }
                    }
                    break;
                default:
                    console.log('Unknown command: ' + data.cmd + ' message:' + data.msg);
                    break;
                }
            };

            this.brain.postMessage({cmd: 'init', input: {env: jEnv, opts: jOpts}});
        }
    };

    AgentRLTD.prototype = Object.create(Agent.prototype);
    AgentRLTD.prototype.constructor = Agent;

    /**
     * Agent's chance to act on the world
     *
     * @param {Object} smallWorld
     */
    AgentRLTD.prototype.tick = function (smallWorld) {
        this.smallWorld = smallWorld;
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
            this.gridLocation = smallWorld.grid.getCellAt(this.sToX(this.state), this.sToY(this.state));

            let x = this.gridLocation.coords.bottom.right.x - (smallWorld.grid.cellWidth / 2),
                y = this.gridLocation.coords.bottom.right.y - (smallWorld.grid.cellHeight / 2);
            this.position.set(x, y);

            this.nStepsCounter += 1;
            if (typeof obs.resetEpisode !== 'undefined') {
                this.score += 1;
                this.brain.resetEpisode();
                // record the reward achieved
                if (this.nsteps_history.length >= this.nflot) {
                    this.nsteps_history = this.nsteps_history.slice(1);
                }
                this.nsteps_history.push(this.nStepsCounter);
                this.nStepsCounter = 0;

                this.gridLocation = smallWorld.grid.getCellAt(0, 0);
                this.position.set(smallWorld.grid.cellWidth / 2, smallWorld.grid.cellHeight / 2);
            }
        } else {
            this.brain.postMessage({cmd: 'act', input: this.state});
        }
    };

    global.AgentRLTD = AgentRLTD;

}(this));

