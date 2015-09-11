(function (global) {
    "use strict";

    /**
     * GridWorld Environment
     *
     * @constructor
     */
    var GridWorld = function () {
        var worldOpts = {
            canvas: document.getElementById("world"),
            xCount: 10,
            yCount: 10,
            numItems: 0,
            closed: false,
            cheats: false
        };

        this.maze = new Maze(worldOpts);

        this.env = {
            grid: this.maze.grid,
            gS: this.maze.grid.yCount * this.maze.grid.xCount,
            Rarr: null,
            Aarr: null
        };

        /**
         * Set up the grid world and the actions avail
         */
        this.env.reset = function () {
            // specify some rewards
            var Rarr = R.zeros(this.gS),
                Aarr = new Array(this.gS);

            for (let y = 0; y < this.grid.yCount; y++) {
                for (let x = 0; x < this.grid.xCount; x++) {
                    var state = this.xytos(x, y),
                        actions = this.grid.disconnectedNeighbors(this.grid.getCellAt(x, y)),
                        actionsAvail = {0: null, 1: null, 2: null, 3: null};
                    for (let a = 0; a < actions.length; a++) {
                        let action = actions[a],
                            actionState = this.xytos(action.x, action.y);
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
        this.env.reward = function (s, a, ns) {
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
        this.env.nextStateDistribution = function (s, a) {
            var ns, nx, ny,
                sx = this.stox(s),
                sy = this.stoy(s);

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
            ns = this.xytos(nx, ny);
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
        this.env.sampleNextState = function (s, a) {
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
        this.env.getNumStates = function () {
            return this.gS;
        };

        /**
         * Return the number of actions
         *
         * @returns {Number}
         */
        this.env.getMaxNumActions = function () {
            return 4;
        };

        /**
         * Return the allowed actions based on s
         *
         * @returns {Array}
         */
        this.env.allowedActions = function (s) {
            var x = this.stox(s),
                y = this.stoy(s),
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
        this.env.stox = function (s) {
            return Math.floor(s / this.grid.xCount);
        };

        /**
         * Convert the state to a y
         *
         * @param {Number} s
         * @returns {Number}
         */
        this.env.stoy = function (s) {
            return s % this.grid.yCount;
        };

        /**
         * Convert an x, y to the state
         *
         * @param {Number} x
         * @param {Number} y
         * @returns {Number}
         */
        this.env.xytos = function (x, y) {
            return x * this.grid.xCount + y;
        };

        /**
         * Return a rand state
         *
         * @returns {Number}
         */
        this.env.randomState = function () {
            return Math.floor(Math.random() * this.gS);
        };

        /**
         * Return the starting state
         *
         * @returns {Number}
         */
        this.env.startState = function () {
            return 0;
        };

        var agentOpts = {
                brainType: 'RLTD',
                numEyes: 0,
                numTypes: 0,
                width: 20,
                height: 20,
                radius: 10,
                canvas: document.getElementById("rewardGraph"),
                collision: false,
                interactive: false,
                useSprite: false,
                movingEntities: false
            },
            entityOpts = {
                width: 20,
                height: 20,
                radius: 10,
                collision: false,
                interactive: false,
                useSprite: false,
                movingEntities: false
            };

        worldOpts.grid = this.maze.grid;
        worldOpts.walls = this.maze.walls;
        worldOpts.agents = [
            new AgentRLTD(new Vec(50, 50), this.env, agentOpts),
            new AgentRLTD(new Vec(50, 50), this.env, agentOpts)
        ];

        World.call(this, worldOpts, entityOpts);

        return this;
    };

    GridWorld.prototype = Object.create(World.prototype);
    GridWorld.prototype.constructor = World;

    global.GridWorld = GridWorld;

}(this));
