(function (global) {
    "use strict";

    class HexMazeWorld extends World {

        /**
         * World object contains many agents and walls and food and stuff
         * @name MazeWorld
         * @extends World
         * @constructor
         *
         * @returns {HexMazeWorld}
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
                    antialiasing: true,
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
                    size: 10,
                    cellSize: 20,
                    cellSpacing: 0,
                    pointy: false,
                    fill: true,
                    cheats: cheats
                },
                orientation = (gridOpts.pointy ? Layout.layoutPointy : Layout.layoutFlat),
                size = new Point(gridOpts.width / gridOpts.cellSize, gridOpts.height / gridOpts.cellSize),
                origin = new Point(gridOpts.width / 2, gridOpts.height / 2),
                layout = new Layout(orientation, size, origin),
                shape = HexGrid.shapeRectangle(gridOpts.size, gridOpts.size, gridOpts.cellSize, layout, gridOpts.fill, gridOpts.cheats, gridOpts.pointy),
                // shape = HexGrid.shapeHexagon(gridOpts.size, gridOpts.cellSize, layout, gridOpts.fill, gridOpts.cheats),
                // shape = HexGrid.shapeRing(0, 0, 2, gridOpts.cellSize, layout, gridOpts.fill, gridOpts.cheats),
                // shape = HexGrid.shapeParallelogram(-1, -2, 1, 1, gridOpts.cellSize, layout, gridOpts.fill, gridOpts.cheats),
                // shape = HexGrid.shapeTrapezoidal(-1, 1, -2, 1, false, gridOpts.cellSize, layout, gridOpts.fill, gridOpts.cheats),
                // shape = HexGrid.shapeTriangle1(2, gridOpts.cellSize, layout, gridOpts.fill, gridOpts.cheats),
                // shape = HexGrid.shapeTriangle2(2, gridOpts.cellSize, layout, gridOpts.fill, gridOpts.cheats),
                grid = new HexGrid(gridOpts, shape, layout),
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
                            xyToS: (q, r) => {
                                return this.xyToS(q, r);
                            }
                        },
                        numActions: this.grid.startCell.directions.length,
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
                                state = this.state;
                            let a = agent.brain.act(state);
                                // run it through environment dynamics
                            let obs = this.sampleNextState(state, a);

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
         * @returns {HexMazeWorld}
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
            for (let s = 0; s < this.grid.cells.length; s++) {
                var rd = 255,
                    g = 255,
                    b = 255,
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

                let cell = this.grid.cells[s];
                cell.color = Utility.rgbToHex(rd, g, b);

                // Write the reward value text
                cell.reward = this.Rarr[s];

                // Write the value text
                cell.value = vv;

                cell.draw();

                // update policy arrows
                for (var a = 0; a < 6; a++) {
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
            this.renderer.render(this.stage);
        }

        /**
         * zip rewards into flot data
         * @param {number} an
         * @returns {Array}
         */
        getFlotRewards(an = 0) {
            let res = [];
            for (let i = 0, n = this.agents[an].nStepsHistory.length; i < n; i++) {
                res.push([i, this.agents[an].nStepsHistory[i]]);
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
                for (var a = 0; a < this.agents.length; a++) {
                    this.series[a].data = this.getFlotRewards(a);
                }
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
    HexMazeWorld.prototype.allowedActions = function (s) {
        let cell = this.grid.cells[s],
            as = [],
            actions = this.grid.disconnectedNeighbors(cell);

        for (let a = 0; a < actions.length; a++) {
            var c = actions[a];
            for (let n = 0; n < cell.neighbors.length; n++) {
                if (cell.neighbors[n]) {
                    var dQ = cell.neighbors[n].q,
                        dR = cell.neighbors[n].r,
                        nQ = c.q,
                        nR = c.r;
                    if (c && (dQ === nQ && dR === nR)) {
                        as.push(n);
                    } else {
                        console.log();
                    }
                }
            }
        }

        return as;
    };

    /**
     * Return the number of actions
     * @returns {number}
     */
    HexMazeWorld.prototype.getMaxNumActions = function () {
        return this.grid.startCell.directions.length;
    };

    /**
     * Return the number of states
     * @returns {number}
     */
    HexMazeWorld.prototype.getNumStates = function () {
        return this.grid.cells.length;
    };

    /**
     *
     * @param {number} s
     * @param {number} a
     * @returns {number}
     */
    HexMazeWorld.prototype.nextStateDistribution = function (s, a) {
        let ns,
            c = this.grid.cells[s];

        if (s === this.grid.cells.length - 1) {
            ns = this.startState();
            while (c.neighbors[a] === false) {
                ns = this.randomState();
            }
        } else {
            if (c.neighbors[a] === false) {
                // Not a valid option so go back to s
                ns = s;
            } else {
                ns = this.xyToS(c.neighbors[a].q, c.neighbors[a].r);
            }
        }

        return ns;
    };

    /**
     * Return a rand state
     * @returns {number}
     */
    HexMazeWorld.prototype.randomState = function () {
        return Math.floor(Math.random() * this.grid.cells.length);
    };

    /**
     * Set up the grid world and the actions avail
     */
    HexMazeWorld.prototype.reset = function () {
        let lastState = 0;
        // Specify some rewards
        this.Rarr = Utility.Maths.zeros(this.grid.cells.length);
        this.Aarr = new Array(this.grid.cells.length);

        for (let state = 0; state < this.grid.cells.length; state++) {
            let actionsAvail = this.allowedActions(state);
            this.Aarr[state] = actionsAvail;
            this.Rarr[state] = (state === this.grid.cells.length - 1) ? 1 : 0;

            if ((lastState !== 0 && state !== this.grid.cells.length - 1) &&
                (actionsAvail.length === 1 && state !== 0)) {
                this.Rarr[state] = -1;
            }
            lastState = state;
        }

        return this;
    };

    /**
     * Get the reward of being in s, taking action a, and ending up in ns
     * @param {number} s
     * @param {number} a
     * @param {number} ns
     * @returns {number}
     */
    HexMazeWorld.prototype.reward = function (s, a, ns) {
        return this.Rarr[s];
    };

    /**
     * Convert the state to a q
     * @param {number} s
     * @returns {number} q
     */
    HexMazeWorld.prototype.sToX = function (s) {
        return this.grid.cells[s].q;
    };

    /**
     * Convert the state to a r
     * @param {number} s
     * @returns {number} r
     */
    HexMazeWorld.prototype.sToY = function (s) {
        return this.grid.cells[s].r;
    };

    /**
     * Convert an x, y to the state
     * @param {number} q
     * @param {number} r
     * @returns {number}
     */
    HexMazeWorld.prototype.xyToS = function (q, r) {
        let cell = this.grid.getCellAt(q, r),
            id = Utility.Arrays.arrContains(this.grid.cells, cell);

        return id;
    };

    /**
     * Observe the raw reward of being in s, taking a, and ending up in ns
     * @param {number} s
     * @param {number} a
     * @returns {{ns: (*|Number), r: (*|Number)}}
     */
    HexMazeWorld.prototype.sampleNextState = function (s, a) {
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
     * @returns {number}
     */
    HexMazeWorld.prototype.startState = function () {
        return 0;
    };

    global.HexMazeWorld = HexMazeWorld;

}(this));
