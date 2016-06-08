(function (global) {
    "use strict";

    class MazeWorld extends World {

        /**
         * World object contains many agents and walls and food and stuff
         * @name MazeWorld
         * @extends World
         * @constructor
         *
         * @returns {MazeWorld}
         */
        constructor() {
            var cheats = {
                    id: false,
                    name: false,
                    angle: false,
                    bounds: false,
                    direction: false,
                    gridLocation: false,
                    position: false
                },
                renderOpts = {
                    antialiasing: false,
                    autoResize: false,
                    resizable: false,
                    transparent: false,
                    resolution: 1,//window.devicePixelRatio,
                    noWebGL: false,
                    width: 600,
                    height: 600
                },
                gridOpts = {
                    width: renderOpts.width,
                    height: renderOpts.height,
                    buffer: 0,
                    size: 20,
                    cellSize: 30,
                    cellSpacing: 0,
                    fill: true,
                    closed: false,
                    cheats: cheats
                },
                grid = new Grid(gridOpts),
                maze = new Maze(grid.init()),
                worldOpts = {
                    simSpeed: 1,
                    collision: {
                        type: 'brute'
                    },
                    grid: maze.grid,
                    maze: maze,
                    cheats: cheats,
                    numEntities: 4,
                    entityOpts: {
                        radius: 10,
                        collision: true,
                        interactive: true,
                        useSprite: false,
                        moving: false
                    }
                };
            super([], maze.walls, worldOpts, renderOpts);

            this.agents = [
                new Agent(new Vec(this.grid.startCell.center.x, this.grid.startCell.center.y),
                    {
                        brainType: 'RL.TDAgent',
                        env: {
                            allowedActions: (s) => {
                                return this.allowedActions(s);
                            },
                            getMaxNumActions: () => {
                                return this.getMaxNumActions();
                            },
                            getNumStates: () => {
                                return this.getNumStates();
                            },
                            nextStateDistribution: (s, a) => {
                                return this.nextStateDistribution(s, a);
                            },
                            randomState: () => {
                                return this.randomState();
                            },
                            reset: () => {
                                return this.reset();
                            },
                            sampleNextState: (s, a) => {
                                return this.sampleNextState(s, a);
                            },
                            startState: () => {
                                return this.startState();
                            },
                            sToX: (s) => {
                                return this.sToX(s);
                            },
                            sToY: (s) => {
                                return this.sToY(s);
                            },
                            xyToS: (x, y) => {
                                return this.xyToS(x, y);
                            }
                        },
                        numActions: 4,
                        numStates: 0,
                        numEyes: 0,
                        numTypes: 0,
                        numProprioception: 0,
                        range: 0,
                        proximity: 0,
                        radius: 10,
                        collision: false,
                        interactive: false,
                        useSprite: false,
                        worker: false
                    }
                )
            ];

            this.selected = -1;
            this.Rarr = null;
            this.Aarr = null;
            this.sid = -1;
            this.action = null;
            this.state = 0;
            this.stepsPerTick = 1;
            this.nStepsHistory = [];
            this.pause = false;

            this.addAgents();
            Agent.prototype.tick = () => {
                if (this.sid === -1) {
                    this.sid = setInterval(() => {
                        for (let k = 0; k < this.stepsPerTick; k++) {
                            // ask agent for an action
                            let agent = this.agents[0],
                                state = this.state,
                                a = agent.brain.act(state),
                                // run it through environment dynamics
                                obs = this.sampleNextState(state, a);

                            // allow opportunity for the agent to learn
                            agent.brain.learn(obs.r);
                            // evolve environment to next state
                            this.state = obs.ns;

                            agent.nStepsCounter += 1;
                            if (typeof obs.resetEpisode !== 'undefined') {
                                agent.score += 1;
                                agent.brain.resetEpisode();

                                agent.gridLocation = this.grid.getCellAt(0, 0);
                                agent.position.set(agent.gridLocation.center.x, agent.gridLocation.center.y);
                                this.state = this.startState();

                                // record the reward achieved
                                if (agent.nStepsHistory.length >= agent.nflot) {
                                    agent.nStepsHistory = agent.nStepsHistory.slice(1);
                                }
                                agent.nStepsHistory.push(agent.nStepsCounter);
                                agent.nStepsCounter = 0;
                            } else {
                                agent.gridLocation = this.grid.getCellAt(this.sToX(this.state), this.sToY(this.state));
                                agent.position.set(agent.gridLocation.center.x, agent.gridLocation.center.y);
                            }
                            // Check them for collisions
                            this.check(agent);

                            // Loop through the eyes and check the walls and nearby entities
                            for (let ae = 0, ne = agent.numEyes; ae < ne; ae++) {
                                this.check(agent.eyes[ae]);
                            }

                            if (agent.collisions.length > 0) {
                                console.log('Ouch I hit sumfin');
                            }

                            this.tick();
                            agent.draw();
                            this.drawGrid();
                        }
                    }, 20);
                } else {
                    clearInterval(this.sid);
                    this.sid = -1;
                }
            };

            this.reset();
            this.initFlot();
            this.drawGrid();

            return this;
        }

        /**
         * Tick the environment
         * @param {number} timeSinceLast
         * @returns {World}
         */
        tick(timeSinceLast) {
            this.updatePopulation();

            let popCount = 0;
            for (let [id, entity] of this.population.entries()) {
                if (entity.type !== 0 && entity.type !== 4) {
                    // Check them for collisions
                    this.check(entity);

                    // Tick them
                    entity.tick();

                    if (entity.useSprite) {
                        entity.sprite.position.set(entity.position.x, entity.position.y);
                    }

                    if (entity.cleanUp === true || (entity.type === 2 || entity.type === 1)) {
                        popCount++;
                        if (entity.age > 5000) {
                            this.deleteEntity(entity.id);
                            popCount--;
                        }
                    }
                }
                entity.draw();
            }

            // If we have less then the number of Items allowed throw a random one in
            if (popCount < this.numEntities) {
                this.addEntities(this.numEntities - popCount);
            }

            return this;
        }

        /**
         * Draw the Grid
         */
        drawGrid() {
            for (var x = 0; x < this.grid.xCount; x++) {
                for (var y = 0; y < this.grid.yCount; y++) {
                    var rd = 255,
                        g = 255,
                        b = 255,
                        s = this.xyToS(x, y),
                        vv = null;

                    // get value of state s under agent policy
                    if (typeof this.agents[0].brain.V !== 'undefined') {
                        vv = this.agents[0].brain.V[s];
                    } else if (typeof this.agents[0].brain.Q !== 'undefined') {
                        var poss = this.allowedActions(s);
                        vv = -1;
                        for (var i = 0, n = poss.length; i < n; i++) {
                            var qsa = this.agents[0].brain.Q[poss[i] * this.grid.cells.length + s];
                            if (i === 0 || qsa > vv) {
                                vv = qsa;
                            }
                        }
                    }

                    var ms = 10000;
                    if (vv > 0) {
                        g = 255;
                        rd = 255 - (vv * ms);
                        b = 255 - (vv * ms);
                    }
                    if (vv < 0) {
                        g = 255 + (vv * ms);
                        rd = 255;
                        b = 255 + (vv * ms);
                    }

                    let cell = this.grid.getCellAt(x, y);
                    cell.color = Utility.rgbToHex(rd, g, b);

                    // Write the reward value text
                    cell.reward = this.Rarr[s];

                    // Write the value text
                    cell.value = vv;

                    cell.draw();

                    // update policy arrows
                    for (var a = 0; a < 4; a++) {
                        var prob = this.agents[0].brain.P[a * this.grid.cells.length + s],
                            nx = 0,
                            ny = 0,
                            actions = this.Aarr[s],
                            avail = actions[a];
                        if (avail === null || prob < 0.01) {
                            // Hide the arrow
                        } else {
                            // Show the arrow
                        }

                        // The length of the arrow based on experience
                        var ss = this.grid.cellSize / 2 * (prob * 0.9);

                        switch (a) {
                            case 0: // Left
                                nx = -ss;
                                ny = 0;
                                break;
                            case 1: // Down
                                nx = 0;
                                ny = ss;
                                break;
                            case 2: // Up
                                nx = 0;
                                ny = -ss;
                                break;
                            case 3: // Right
                                nx = ss;
                                ny = 0;
                                break;
                        }
                        //     // Draw the arrow using below as guide
                        //     pa.attr('x1', xcoord + (this.grid.cellSize / 2))
                        //         .attr('y1', ycoord + (this.grid.cellSize / 2))
                        //         .attr('x2', xcoord + (this.grid.cellSize / 2) + nx)
                        //         .attr('y2', ycoord + (this.grid.cellSize / 2) + ny);
                    }
                }
            }
            this.renderer.render(this.stage);
        }

        /**
         * zip rewards into flot data
         * @param {Number} an
         * @returns {Array}
         */
        getFlotRewards() {
            let res = [];
            for (let i = 0, n = this.agents[0].nStepsHistory.length; i < n; i++) {
                res.push([i, this.agents[0].nStepsHistory[i]]);
            }
            return res;
        }

        /**
         * Initialize the Flot class
         */
        initFlot() {
            this.container = document.getElementById('flotreward');
            // flot stuff
            this.nflot = 1000;
            this.smoothRewardHistory = [];
            this.smoothReward = [];
            this.flott = [];
            this.series = [];

            for (var a = 0; a < this.agents.length; a++) {
                this.smoothReward[a] = null;
                this.smoothRewardHistory[a] = null;
                this.flott[a] = 0;
                this.smoothRewardHistory[a] = [];
                this.series[a] = {
                    data: this.getFlotRewards(a),
                    lines: {
                        fill: true
                    },
                    color: a,
                    label: this.agents[a].name
                };
            }

            this.plot = $.plot(this.container, this.series, {
                grid: {
                    borderWidth: 1,
                    minBorderMargin: 20,
                    labelMargin: 10,
                    backgroundColor: {
                        colors: ["#FFF", "#e4f4f4"]
                    },
                    margin: {
                        top: 10,
                        bottom: 10,
                        left: 10
                    }
                },
                xaxis: {
                    min: 0,
                    max: this.nflot
                },
                yaxis: {
                    min: 0,
                    max: 1000
                }
            });

            setInterval(() => {
                this.series[0].data = this.getFlotRewards();
                this.plot.setData(this.series);
                this.plot.draw();
            }, 100);
        }

    }

    /**
     * Return the allowed actions based on the current state/cell
     * @param {number} s - State
     * @returns {Array}
     */
    MazeWorld.prototype.allowedActions = function (s) {
        let x = this.sToX(s),
            y = this.sToY(s),
            as = [],
            // neighbors = this.grid.cells[s].neighbors,
            actions = this.grid.disconnectedNeighbors(this.grid.getCellAt(x, y));

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
     * Return the number of actions
     * @returns {Number}
     */
    MazeWorld.prototype.getMaxNumActions = function () {
        return this.grid.startCell.directions.length;
    };

    /**
     * Return the number of states
     * @returns {Number}
     */
    MazeWorld.prototype.getNumStates = function () {
        return this.grid.cells.length;
    };

    /**
     *
     * @param {Number} s
     * @param {Number} a
     * @returns {Number}
     */
    MazeWorld.prototype.nextStateDistribution = function (s, a) {
        let ns, nx, ny,
            sx = this.sToX(s),
            sy = this.sToY(s);

        if (s === this.grid.cells.length - 1) {
            ns = this.startState();
            while (this.Aarr[ns][a] === null) {
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
     * Return a rand state
     * @returns {Number}
     */
    MazeWorld.prototype.randomState = function () {
        return Math.floor(Math.random() * this.grid.cells.length);
    };

    /**
     * Set up the grid world and the actions avail
     */
    MazeWorld.prototype.reset = function () {
        let lastState = 0;
        // specify some rewards
        this.Rarr = Utility.Maths.zeros(this.grid.cells.length);
        this.Aarr = new Array(this.grid.cells.length);

        for (let x = 0; x < this.grid.xCount; x++) {
            for (let y = 0; y < this.grid.yCount; y++) {
                let state = this.xyToS(x, y),
                    cell = this.grid.getCellAt(x, y),
                    actions = this.grid.disconnectedNeighbors(cell),
                    actionsAvail = {0: null, 1: null, 2: null, 3: null},
                    nulled = 0;
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
                this.Aarr[state] = actionsAvail;
                this.Rarr[state] = (state === this.grid.cells.length - 1) ? 1 : 0;

                for (let key in actionsAvail) {
                    if (actionsAvail[key] === null) {
                        nulled++;
                    }
                }
                if (nulled === 3 && lastState !== 0 && state !== this.grid.cells.length - 1) {
                    this.Rarr[state] = -1;
                }
                lastState = state;
            }
        }

        return this;
    };

    /**
     * Get the reward of being in s, taking action a, and ending up in ns
     * @param {Number} s
     * @param {Number} a
     * @param {Number} ns
     * @returns {Number}
     */
    MazeWorld.prototype.reward = function (s, a, ns) {
        return this.Rarr[s];
    };

    /**
     * Convert the state to an x
     * @param {Number} s
     * @returns {Number}
     */
    MazeWorld.prototype.sToX = function (s) {
        return Math.floor(s / this.grid.xCount);
    };

    /**
     * Convert the state to a y
     * @param {Number} s
     * @returns {Number}
     */
    MazeWorld.prototype.sToY = function (s) {
        return s % this.grid.yCount;
    };

    /**
     * Convert an x, y to the state
     * @param {Number} x
     * @param {Number} y
     * @returns {Number}
     */
    MazeWorld.prototype.xyToS = function (x, y) {
        return x * this.grid.xCount + y;
    };

    /**
     * Observe the raw reward of being in s, taking a, and ending up in ns
     * @param {Number} s
     * @param {Number} a
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
        if (s === (this.grid.cells.length - 1)) {
            // episode is over
            out.resetEpisode = true;
        }

        return out;
    };

    /**
     * Return the starting state
     * @returns {Number}
     */
    MazeWorld.prototype.startState = function () {
        return 0;
    };

    global.MazeWorld = MazeWorld;

}(this));
