var MazeWorld = MazeWorld || {},
    AgentTD = AgentTD || {},
    Maze = Maze || {},
    Vec = Vec || {},
    World = World || {};

(function (global) {
    "use strict";

    /**
     * Maze contains many agents and walls and food and stuff
     * @name MazeWorld
     * @extends World
     * @constructor
     *
     * @returns {MazeWorld}
     */
    function MazeWorld() {
        this.rs = {};
        this.trs = {};
        this.tvs = {};
        this.pas = {};
        this.selected = -1;
        this.Rarr = null;
        this.Aarr = null;
        this.sid = -1;
        this.action = null;
        this.state = 0;
        this.stepsPerTick = 1;
        this.nStepsHistory = [];
        this.pause = false;
        this.numItems = 0;

        this.maze = new Maze({
            xCount: 10,
            yCount: 10,
            width: 600,
            height: 600
        });

        this.grid = this.maze.grid;
        this.walls = this.maze.walls;
        this.gH = this.grid.yCount;
        this.gW = this.grid.xCount;
        this.gS = this.grid.yCount * this.grid.xCount;
        this.cs = this.grid.cellWidth;  // cell size
        this.agents = [
            new AgentRLTD(new Vec(50, 50),
                {
                    brainType: 'RLTD',
                    env: this,
                    numEyes: 9,
                    numTypes: 3,
                    radius: 10,
                    collision: false,
                    interactive: false,
                    useSprite: false,
                    worker: false,
                    cheats: {
                        gridLocation: false,
                        position: false,
                        id: false,
                        name: true
                    }
                })
        ];

        this.numAgents = this.agents.length;

        World.call(this);

        return this;
    }

    MazeWorld.prototype = Object.create(World.prototype);
    MazeWorld.prototype.constructor = World;

    /**
     *
     */
    MazeWorld.prototype.tick = function () {
        let self = this;
        if (self.sid === -1) {
            self.sid = setInterval(function () {
                for (let k = 0; k < self.stepsPerTick; k++) {
                    // ask agent for an action
                    let a = self.agents[0].brain.act(self.state),
                    // run it through environment dynamics
                        obs = self.sampleNextState(self.state, a);

                    // allow opportunity for the agent to learn
                    self.agents[0].brain.learn(obs.r);
                    // evolve environment to next state
                    self.state = obs.ns;

                    self.agents[0].nStepsCounter += 1;
                    if (typeof obs.resetEpisode !== 'undefined') {
                        self.agents[0].score += 1;
                        self.agents[0].brain.resetEpisode();

                        self.agents[0].gridLocation = self.grid.getCellAt(0, 0);
                        self.agents[0].position.set(self.grid.cellWidth / 2, self.grid.cellHeight / 2);
                        self.state = self.startState();

                        // record the reward achieved
                        if (self.agents[0].nStepsHistory.length >= self.agents[0].nflot) {
                            self.agents[0].nStepsHistory = self.agents[0].nStepsHistory.slice(1);
                        }
                        self.agents[0].nStepsHistory.push(self.agents[0].nStepsCounter);
                        self.agents[0].nStepsCounter = 0;
                    } else {
                        self.agents[0].gridLocation = self.grid.getCellAt(self.sToX(self.state), self.sToY(self.state));
                        let x = self.agents[0].gridLocation.coords.bottom.right.x - (self.grid.cellWidth / 2),
                            y = self.agents[0].gridLocation.coords.bottom.right.y - (self.grid.cellHeight / 2);
                        self.agents[0].position.set(x, y);
                    }
                }
                self.draw();
            }, 20);
        } else {
            clearInterval(self.sid);
            self.sid = -1;
        }
    };

    /**
     * Set up the grid world and the actions avail
     */
    MazeWorld.prototype.reset = function () {
        // specify some rewards
        let Rarr = Utility.zeros(this.gS),
            Aarr = new Array(this.gS),
            lastState = 0;

        for (let y = 0; y < this.gH; y++) {
            for (let x = 0; x < this.gW; x++) {
                let state = this.xyToS(x, y),
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
                }
                Aarr[state] = actionsAvail;
                Rarr[state] = (state === this.gS - 1) ? 1 : 0;
                let nulled = 0
                for (let key in actionsAvail) {
                    if (actionsAvail[key] === null) {
                        nulled++;
                    }
                }
                if (nulled === 3 && lastState !== 0 && state !== this.gS - 1) {
                    Rarr[state] = -1;
                }
                lastState = state;
            }
        }

        this.Rarr = Rarr;
        this.Aarr = Aarr;

        return this;
    };

    /**
     * Get the reward of being in s, taking action a, and ending up in ns
     * @param {number} s
     * @param {number} a
     * @param {number} ns
     * @returns {number}
     */
    MazeWorld.prototype.reward = function (s, a, ns) {
        let rew = this.Rarr[s];

        return rew;
    };

    /**
     *
     * @param {number} s
     * @param {number} a
     * @returns {number}
     */
    MazeWorld.prototype.nextStateDistribution = function (s, a) {
        let ns, nx, ny,
            sx = this.sToX(s),
            sy = this.sToY(s);

        if (s === this.gS - 1) {
            ns = this.startState();
            while(this.Aarr[ns][a] === null) {
                ns = this.randomState();
            }
        } else {
            switch (a) {
                case 0: // Left
                    nx = sx - 1;
                    ny = sy;
                    break;
                case 1: // Down
                    nx = sx;
                    ny = sy + 1;
                    break;
                case 2: // Up
                    nx = sx;
                    ny = sy - 1;
                    break;
                case 3: // Right
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

            ns = this.xyToS(nx, ny);
            if (this.Aarr[s][a] !== ns) {
                // Not a valid option so go back to s
                ns = s;
            }
        }

        return ns;
    };

    /**
     * Observe the raw reward of being in s, taking a, and ending up in ns
     * @param {number} s
     * @param {number} a
     * @returns {{ns: (*|Number), r: (*|Number)}}
     */
    MazeWorld.prototype.sampleNextState = function (s, a) {
        let ns = this.nextStateDistribution(s, a),
            r = this.reward(s, a, ns);

        // every step takes a bit of negative reward
        r -= 0.01;
        let out = {
            ns: ns,
            r: r
        };
        if (s === (this.gS - 1)) {
            // episode is over
            out.resetEpisode = true;
        }

        return out;
    };

    /**
     * Return the number of states
     * @returns {number}
     */
    MazeWorld.prototype.getNumStates = function () {
        return this.gS;
    };

    /**
     * Return the number of actions
     * @returns {number}
     */
    MazeWorld.prototype.getMaxNumActions = function () {
        return 4;
    };

    /**
     * Return the allowed actions based on s
     * @returns {Array}
     */
    MazeWorld.prototype.allowedActions = function (s) {
        let x = this.sToX(s),
            y = this.sToY(s),
            as = [],
            c = this.grid.getCellAt(x, y),
            actions = this.grid.disconnectedNeighbors(c);

        for (let a = 0; a < actions.length; a++) {
            if (actions[a].x === x - 1 && actions[a].y === y) { // Left
                as.push(0);
            } else if (actions[a].x === x && actions[a].y === y + 1) { // Down
                as.push(1);
            } else if (actions[a].x === x && actions[a].y === y - 1) { // Up
                as.push(2);
            } else if (actions[a].x === x + 1 && actions[a].y === y) { // Right
                as.push(3);
            }
        }

        return as;
    };

    /**
     * Convert the state to an x
     * @param {number} s
     * @returns {number}
     */
    MazeWorld.prototype.sToX = function (s) {
        return Math.floor(s / this.gW);
    };

    /**
     * Convert the state to a y
     * @param {number} s
     * @returns {number}
     */
    MazeWorld.prototype.sToY = function (s) {
        return s % this.gH;
    };

    /**
     * Convert an x, y to the state
     * @param {number} x
     * @param {number} y
     * @returns {number}
     */
    MazeWorld.prototype.xyToS = function (x, y) {
        return x * this.gW + y;
    };

    /**
     * Return a rand state
     * @returns {number}
     */
    MazeWorld.prototype.randomState = function () {
        return Math.floor(Math.random() * this.gS);
    };

    /**
     * Return the starting state
     * @returns {number}
     */
    MazeWorld.prototype.startState = function () {
        return 0;
    };

    global.MazeWorld = MazeWorld;

}(this));
