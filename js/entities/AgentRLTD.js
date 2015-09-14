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

        this.nsteps_history = [];
        this.nsteps_counter = 0;
        this.nflot = 1000;
        this.score = 0;

        this.name = "Agent RLTD";

        this.brainOpts = opts.spec || {
            update: 'qlearn', // 'qlearn' or 'sarsa'
            gamma: 0.9, // discount factor, [0, 1)
            epsilon: 0.2, // initial epsilon for epsilon-greedy policy, [0, 1)
            alpha: 0.1, // value function learning rate
            lambda: 0.9, // eligibility trace decay, [0,1). 0 = no eligibility traces
            replacing_traces: true, // use replacing or accumulating traces
            planN: 50, // number of planning steps per iteration. 0 = no planning
            smooth_policy_update: true, // non-standard, updates policy smoothly to follow max_a Q
            beta: 0.1 // learning rate for smooth policy update
        };

        this.brain = new RL.TDAgent(env, this.brainOpts);
        this.state = this.brain.env.startState();

        this.brain.env.reset();
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
            obs = this.brain.env.sampleNextState(this.state, a);

        // allow opportunity for the agent to learn
        this.brain.learn(obs.r);
        this.brain.env.Rarr[this.state] = obs.r;
        // evolve environment to next state
        this.state = obs.ns;
        this.gridLocation = smallWorld.grid.getCellAt(this.brain.env.stox(this.state), this.brain.env.stoy(this.state));

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

    global.AgentRLTD = AgentRLTD;

}(this));

