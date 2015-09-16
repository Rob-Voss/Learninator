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
        this.nsteps_counter = 0;
        this.nflot = 1000;
        this.score = 0;

        this.name = "Agent RLTD";

        this.brainOpts = opts.spec || {
            update: 'qlearn', // 'qlearn' or 'sarsa'
            gamma: 0.9, // discount factor, [0, 1)
            epsilon: 0.5, // initial epsilon for epsilon-greedy policy, [0, 1)
            alpha: 0.1, // value function learning rate
            lambda: 0.9, // eligibility trace decay, [0,1). 0 = no eligibility traces
            replacing_traces: true, // use replacing or accumulating traces
            planN: 50, // number of planning steps per iteration. 0 = no planning
            smooth_policy_update: true, // non-standard, updates policy smoothly to follow max_a Q
            beta: 0.1 // learning rate for smooth policy update
        };

        this.brain = new RL.TDAgent(this, this.brainOpts);
        this.state = this.startState();

        this.reset();
    };

    AgentRLTD.prototype = Object.create(Agent.prototype);
    AgentRLTD.prototype.constructor = Agent;

    /**
     * Agent's chance to act on the world
     *
     * @param {Object} smallWorld
     */
    AgentRLTD.prototype.tick = function (smallWorld) {
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

        this.nsteps_counter += 1;
        if (typeof obs.reset_episode !== 'undefined') {
            this.score += 1;
            this.brain.resetEpisode();
            // record the reward achieved
            if (this.nsteps_history.length >= this.nflot) {
                this.nsteps_history = this.nsteps_history.slice(1);
            }
            this.nsteps_history.push(this.nsteps_counter);
            this.nsteps_counter = 0;

            this.gridLocation = smallWorld.grid.getCellAt(0, 0);
            this.position.set(smallWorld.grid.cellWidth / 2, smallWorld.grid.cellHeight / 2);
        }
    };

    /**
     * Set up the grid world and the actions avail
     */
    AgentRLTD.prototype.reset = function () {
        // specify some rewards
        var Rarr = R.zeros(this.gS),
            Aarr = new Array(this.gS);

        for (let y = 0; y < this.grid.yCount; y++) {
            for (let x = 0; x < this.grid.xCount; x++) {
                var state = this.xyToS(x, y),
                    actions = this.grid.disconnectedNeighbors(this.grid.getCellAt(x, y)),
                    actionsAvail = {0: null, 1: null, 2: null, 3: null};
                for (let a = 0; a < actions.length; a++) {
                    let action = actions[a],
                        actionState = this.xyToS(action.x, action.y);
                    if (action.x === x - 1 && action.y === y) {
                        actionsAvail[0] = actionState;
                    } else if (action.x === x && action.y === y + 1) {
                        actionsAvail[1] = actionState;
                    } else if (action.x === x && action.y === y - 1) {
                        actionsAvail[2] = actionState;
                    } else if (action.x === x + 1 && action.y === y) {
                        actionsAvail[3] = actionState;
                    }
                    Aarr[state] = actionsAvail;
                    Rarr[state] = (actions.length >= 2) ? 1 : 0;
                }
            }
        }

        this.Rarr = Rarr;
        this.Aarr = Aarr;
    };

    /**
     * Get the reward of being in s, taking action a, and ending up in ns
     *
     * @param {Number} s
     * @param {Number} a
     * @param {Number} ns
     * @returns {Number}
     */
    AgentRLTD.prototype.reward = function (s, a, ns) {
        var rew = this.Rarr[s];

        return rew;
    };

    /**
     *
     *
     * @param {Number} s
     * @param {Number} a
     * @returns {Number}
     */
    AgentRLTD.prototype.nextStateDistribution = function (s, a) {
        var ns, nx, ny,
            sx = this.sToX(s),
            sy = this.sToY(s);

        switch (a) {
            case 0:
                // Left
                nx = sx - 1;
                ny = sy;
                break;
            case 1:
                // Down
                nx = sx;
                ny = sy + 1;
                break;
            case 2:
                // Up
                nx = sx;
                ny = sy - 1;
                break;
            case 3:
                // Right
                nx = sx + 1;
                ny = sy;
                break;
        }

        if (nx < 0) {
            nx = 0;
        }

        if (ny < 0) {
            ny = 0;
        }

        // gridworld is deterministic, so return only a single next state
        ns = this.xyToS(nx, ny);
        let actions = this.Aarr[s];
        if (actions[a] !== ns) {
            // Not a valid option so go back to s
            return s;
        } else {
            return ns;
        }
    };

    /**
     * Observe the raw reward of being in s, taking a, and ending up in ns
     *
     * @param {Number} s
     * @param {Number} a
     * @returns {{ns: (*|Number), r: (*|Number)}}
     */
    AgentRLTD.prototype.sampleNextState = function (s, a) {
        var ns = this.nextStateDistribution(s, a),
            r = this.reward(s, a, ns);

        // every step takes a bit of negative reward
        r -= 0.01;
        var out = {
            'ns': ns,
            'r': r
        };
        if (s === (this.gS - 1)) {
            // episode is over
            out.reset_episode = true;
        }

        return out;
    };

    /**
     * Return the number of states
     *
     * @returns {Number}
     */
    AgentRLTD.prototype.getNumStates = function () {
        return this.gS;
    };

    /**
     * Return the number of actions
     *
     * @returns {Number}
     */
    AgentRLTD.prototype.getMaxNumActions = function () {
        return 4;
    };

    /**
     * Return the allowed actions based on s
     *
     * @returns {Array}
     */
    AgentRLTD.prototype.allowedActions = function (s) {
        var x = this.sToX(s),
            y = this.sToY(s),
            as = [],
            c = this.grid.getCellAt(x, y);
        var actions = this.grid.disconnectedNeighbors(c);

        for (let a = 0; a < actions.length; a++) {
            let action = actions[a];
            if (action.x === x - 1 && action.y === y) {
                as.push(0);
            } else if (action.x === x && action.y === y + 1) {
                as.push(1);
            } else if (action.x === x && action.y === y - 1) {
                as.push(2);
            } else if (action.x === x + 1 && action.y === y) {
                as.push(3);
            }
        }

        return as;
    };

    /**
     * Convert the state to an x
     *
     * @param {Number} s
     * @returns {Number}
     */
    AgentRLTD.prototype.sToX = function (s) {
        return Math.floor(s / this.grid.xCount);
    };

    /**
     * Convert the state to a y
     *
     * @param {Number} s
     * @returns {Number}
     */
    AgentRLTD.prototype.sToY = function (s) {
        return s % this.grid.yCount;
    };

    /**
     * Convert an x, y to the state
     *
     * @param {Number} x
     * @param {Number} y
     * @returns {Number}
     */
    AgentRLTD.prototype.xyToS = function (x, y) {
        return x * this.grid.xCount + y;
    };

    /**
     * Return a rand state
     *
     * @returns {Number}
     */
    AgentRLTD.prototype.randomState = function () {
        return Math.floor(Math.random() * this.gS);
    };

    /**
     * Return the starting state
     *
     * @returns {Number}
     */
    AgentRLTD.prototype.startState = function () {
        return 0;
    };

    global.AgentRLTD = AgentRLTD;

}(this));

