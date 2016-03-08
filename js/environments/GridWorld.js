var GridWorld = GridWorld || {},
    AgentRLTD = AgentRLTD || {},
    Maze = Maze || {},
    Vec = Vec || {},
    World = World || {},
    document = document || {};

(function (global) {
    "use strict";

    /**
     * GridWorld Environment
     * @returns {GridWorld}
     * @name GridWorld
     * @extends World
     * @constructor
     */
    function GridWorld() {
        let self = this;
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
                    env: {
                        allowedActions: function (s) {
                            return self.allowedActions(s);
                        },
                        getMaxNumActions: function () {
                            return self.getMaxNumActions();
                        },
                        getNumStates: function () {
                            return self.getNumStates();
                        },
                        nextStateDistribution: function (s, a) {
                            return self.nextStateDistribution(s, a);
                        },
                        randomState: function () {
                            return self.randomState();
                        },
                        reset: function () {
                            return self.reset();
                        },
                        sampleNextState: function (s, a) {
                            return self.sampleNextState(s, a);
                        },
                        startState: function () {
                            return self.startState();
                        },
                        sToX: function (s) {
                            return self.sToX(s);
                        },
                        sToY: function (s) {
                            return self.sToY(s);
                        },
                        xyToS: function (x, y) {
                            return self.xyToS(x, y);
                        }
                    },
                    numActions: 4,
                    numStates: 0,
                    numEyes: 0,
                    numTypes: 0,
                    range: 0,
                    proximity: 0,
                    radius: 10,
                    collision: false,
                    interactive: false,
                    useSprite: false,
                    worker: false,
                    cheats: {
                        id: false,
                        name: true,
                        gridLocation: false,
                        position: false
                    }
                })
        ];

        this.initGrid();
        this.drawGrid();
        this.initFlot();

        return this;
    }

    GridWorld.prototype = Object.create(World.prototype);
    GridWorld.prototype.constructor = World;

    /**
     * Return the allowed actions based on s
     * @returns {Array}
     */
    GridWorld.prototype.allowedActions = function (s) {
        let x = this.sToX(s),
            y = this.sToY(s),
            as = [],
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
     *
     * @param s
     */
    GridWorld.prototype.cellClicked = function (s) {
        if (s === this.selected) {
            this.selected = -1; // toggle off
            $("#creward").html('(select a cell)');
        } else {
            this.selected = s;
            $("#creward").html(this.Rarr[s].toFixed(2));
            $("#rewardslider").slider('value', this.Rarr[s]);
        }
        this.drawGrid(); // redraw
    };

    /**
     *
     */
    GridWorld.prototype.drawGrid = function () {
        var sx = this.sToX(this.state),
            sy = this.sToY(this.state);

        d3.select('#cpos')
            .attr('cx', sx * this.cs + this.cs / 2)
            .attr('cy', sy * this.cs + this.cs / 2);

        // updates the grid with current state of world/agent
        for (var y = 0; y < this.gH; y++) {
            for (var x = 0; x < this.gH; x++) {
                var xcoord = x * this.cs,
                    ycoord = y * this.cs,
                    r = 255,
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
                        var qsa = this.agents[0].brain.Q[poss[i] * this.gS + s];
                        if (i === 0 || qsa > vv) {
                            vv = qsa;
                        }
                    }
                }

                var ms = 100;
                if (vv > 0) {
                    g = 255;
                    r = 255 - vv * ms;
                    b = 255 - vv * ms;
                }
                if (vv < 0) {
                    g = 255 + vv * ms;
                    r = 255;
                    b = 255 + vv * ms;
                }

                var vcolor = 'rgb(' + Math.floor(r) + ',' + Math.floor(g) + ',' + Math.floor(b) + ')',
                    rcolor = "",
                // update colors of rectangles based on value
                    r = this.rs[s];

                if (s === this.selected) {
                    // highlight selected cell
                    r.attr('fill', '#FF0');
                } else {
                    r.attr('fill', vcolor);
                }

                // write reward texts
                var rv = this.Rarr[s],
                    tr = this.trs[s];
                if (rv !== 0) {
                    tr.text('R ' + rv.toFixed(1));
                }

                // skip rest for cliff
                //if (this.T[s] === 1) {continue;}

                // write value
                var tv = this.tvs[s];
                tv.text(vv !== null ? vv.toFixed(2) : 0);

                // update policy arrows
                var paa = this.pas[s];
                for (var a = 0; a < 4; a++) {
                    var pa = paa[a];
                    var prob = this.agents[0].brain.P[a * this.gS + s],
                        nx = 0,
                        ny = 0,
                        actions = this.Aarr[s],
                        avail = actions[a];
                    if (avail === null || prob < 0.01) {
                        pa.attr('visibility', 'hidden');
                    } else {
                        pa.attr('visibility', 'visible');
                    }

                    var ss = this.cs / 2 * prob * 0.9;

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

                    pa.attr('x1', xcoord + (this.cs / 2))
                        .attr('y1', ycoord + (this.cs / 2))
                        .attr('x2', xcoord + (this.cs / 2) + nx)
                        .attr('y2', ycoord + (this.cs / 2) + ny);
                }
            }
        }
    };

    /**
     * Return the number of actions
     * @returns {Number}
     */
    GridWorld.prototype.getMaxNumActions = function () {
        return 4;
    };

    /**
     * Return the number of states
     * @returns {Number}
     */
    GridWorld.prototype.getNumStates = function () {
        return this.gS;
    };

    /**
     * zip rewards into flot data
     * @param {Number} an
     * @returns {Array}
     */
    GridWorld.prototype.getFlotRewards = function () {
        let res = [];
        for (let i = 0, n = this.agents[0].nStepsHistory.length; i < n; i++) {
            res.push([i, this.agents[0].nStepsHistory[i]]);
        }
        return res;
    };

    /**
     * Initialize the Flot class
     */
    GridWorld.prototype.initFlot = function () {
        let self = this;
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

        this.plot = $.plot(self.container, self.series, {
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

        setInterval(function () {
            self.series[0].data = self.getFlotRewards();
            self.plot.setData(self.series);
            self.plot.draw();
        }, 100);
    };

    /**
     *
     */
    GridWorld.prototype.initGrid = function () {
        let d3elt = d3.select('#draw');
        d3elt.html('');
        this.rs = {};
        this.trs = {};
        this.tvs = {};
        this.pas = {};

        let self = this,
            gh = this.gH, // height in cells
            gw = this.gW, // width in cells
            gs = this.gW * this.gH, // total number of cells
            w = 600,
            h = 600,
            svg = d3elt.append('svg')
                .attr('width', w)
                .attr('height', h)
                .append('g')
                .attr('transform', 'scale(1)');

        // define a marker for drawing arrowheads
        svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("refX", 3)
            .attr("refY", 2)
            .attr("markerWidth", 3)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0,0 V 4 L3,2 Z");

        for (let y = 0; y < gh; y++) {
            for (let x = 0; x < gw; x++) {
                let xcoord = x * this.cs,
                    ycoord = y * this.cs,
                    s = this.xyToS(x, y),
                    g = svg.append('g');

                // click callback for group
                g.on('click', function (ss) {
                    return function () {
                        self.cellClicked(ss);
                    }; // close over s
                }(s));

                // set up cell rectangles
                let r = g.append('rect')
                    .attr('x', xcoord)
                    .attr('y', ycoord)
                    .attr('height', this.cs - 2)
                    .attr('width', this.cs - 2)
                    .attr('fill', '#FFF')
                    .attr('stroke', 'black')
                    .attr('stroke-width', '0.3');
                this.rs[s] = r;

                // reward text
                let tr = g.append('text')
                    .attr('x', xcoord + 5)
                    .attr('y', ycoord + 55)
                    .attr('font-size', 10)
                    .text('');
                this.trs[s] = tr;

                // value text
                let tv = g.append('text')
                    .attr('x', xcoord + 5)
                    .attr('y', ycoord + 20)
                    .text('');
                this.tvs[s] = tv;

                // policy arrows
                this.pas[s] = [];
                for (let a = 0; a < 4; a++) {
                    this.pas[s][a] = {};
                    let x1, x2, y1, y2, lx1, lx2, ly1, ly2,
                        action = this.Aarr[s][a],
                        buffer = this.cs / 2;
                    switch (a) {
                        case 0: // Left
                            x1 = xcoord + buffer;
                            x2 = xcoord + buffer - (action !== null ? 10 : 0);
                            y1 = ycoord + buffer;
                            y2 = ycoord + buffer;
                            if (action === null) {
                                lx1 = xcoord;
                                lx2 = xcoord;
                                ly1 = ycoord;
                                ly2 = ycoord + this.cs;
                            }
                            break;
                        case 1: // Down
                            x1 = xcoord + buffer;
                            x2 = xcoord + buffer;
                            y1 = ycoord + buffer;
                            y2 = ycoord + buffer + (action !== null ? 10 : 0);
                            if (action === null) {
                                lx1 = xcoord;
                                lx2 = xcoord + this.cs;
                                ly1 = ycoord + this.cs;
                                ly2 = ycoord + this.cs;
                            }
                            break;
                        case 2: // Up
                            x1 = xcoord + buffer;
                            x2 = xcoord + buffer;
                            y1 = ycoord + buffer;
                            y2 = ycoord + buffer - (action !== null ? 10 : 0);
                            if (action === null) {
                                lx1 = xcoord;
                                lx2 = xcoord + this.cs;
                                ly1 = ycoord;
                                ly2 = ycoord;
                            }
                            break;
                        case 3: // Right
                            x1 = xcoord + buffer;
                            x2 = xcoord + buffer + (action !== null ? 10 : 0);
                            y1 = ycoord + buffer;
                            y2 = ycoord + buffer;
                            if (action === null) {
                                lx1 = xcoord + this.cs;
                                lx2 = xcoord + this.cs;
                                ly1 = ycoord;
                                ly2 = ycoord + this.cs;
                            }
                            break;
                    }

                    let pa = g.append('line')
                        .attr('x1', x1)
                        .attr('y1', y1)
                        .attr('x2', x2)
                        .attr('y2', y2)
                        .attr('stroke', 'black')
                        .attr('stroke-width', '1');
                    if (action !== null) {
                        pa.attr("marker-end", "url(#arrowhead)");
                    }
                    this.pas[s][a] = pa;

                    g.append('line')
                        .attr('x1', (lx1 !== 0) ? lx1 - 1 : 0)
                        .attr('y1', (ly1 !== 0) ? ly1 - 1 : 0)
                        .attr('x2', (lx2 !== 0) ? lx2 - 1 : 0)
                        .attr('y2', (ly2 !== 0) ? ly2 - 1 : 0)
                        .attr('stroke', 'red')
                        .attr('stroke-width', '2');
                }
            }
        }

        // append agent position circle
        svg.append('circle')
            .attr('cx', -100)
            .attr('cy', -100)
            .attr('r', 15)
            .attr('fill', '#FF0')
            .attr('stroke', '#000')
            .attr('id', 'cpos');

    };

    /**
     *
     * @param {Number} s
     * @param {Number} a
     * @returns {Number}
     */
    GridWorld.prototype.nextStateDistribution = function (s, a) {
        let ns, nx, ny,
            sx = this.sToX(s),
            sy = this.sToY(s);

        if (s === this.gS - 1) {
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
    GridWorld.prototype.randomState = function () {
        return Math.floor(Math.random() * this.gS);
    };

    /**
     * Set up the grid world and the actions avail
     */
    GridWorld.prototype.reset = function () {
        let lastState = 0;
        // specify some rewards
        this.Rarr = Utility.zeros(this.gS);
        this.Aarr = new Array(this.gS);

        for (let y = 0; y < this.gH; y++) {
            for (let x = 0; x < this.gW; x++) {
                let state = this.xyToS(x, y),
                    actions = this.grid.disconnectedNeighbors(this.grid.getCellAt(x, y)),
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
                this.Rarr[state] = (state === this.gS - 1) ? 1 : 0;

                for (let key in actionsAvail) {
                    if (actionsAvail[key] === null) {
                        nulled++;
                    }
                }
                if (nulled === 3 && lastState !== 0 && state !== this.gS - 1) {
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
    GridWorld.prototype.reward = function (s, a, ns) {
        return this.Rarr[s];
    };

    /**
     * Convert the state to an x
     * @param {Number} s
     * @returns {Number}
     */
    GridWorld.prototype.sToX = function (s) {
        return Math.floor(s / this.gW);
    };

    /**
     * Convert the state to a y
     * @param {Number} s
     * @returns {Number}
     */
    GridWorld.prototype.sToY = function (s) {
        return s % this.gH;
    };

    /**
     * Convert an x, y to the state
     * @param {Number} x
     * @param {Number} y
     * @returns {Number}
     */
    GridWorld.prototype.xyToS = function (x, y) {
        return x * this.gW + y;
    };

    /**
     * Observe the raw reward of being in s, taking a, and ending up in ns
     * @param {Number} s
     * @param {Number} a
     * @returns {{ns: (*|Number), r: (*|Number)}}
     */
    GridWorld.prototype.sampleNextState = function (s, a) {
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
     * Return the starting state
     * @returns {Number}
     */
    GridWorld.prototype.startState = function () {
        return 0;
    };

    /**
     *
     */
    GridWorld.prototype.tick = function () {
        let self = this;
        if (self.sid === -1) {
            self.sid = setInterval(function () {
                for (let k = 0; k < self.stepsPerTick; k++) {
                    // ask agent for an action
                    let agent = self.agents[0],
                        a = agent.brain.act(self.state),
                    // run it through environment dynamics
                        obs = self.sampleNextState(self.state, a);

                    // allow opportunity for the agent to learn
                    agent.brain.learn(obs.r);
                    // evolve environment to next state
                    self.state = obs.ns;

                    agent.nStepsCounter += 1;
                    if (typeof obs.resetEpisode !== 'undefined') {
                        agent.score += 1;
                        agent.brain.resetEpisode();

                        agent.gridLocation = self.grid.getCellAt(0, 0);
                        agent.pos.set(self.grid.cellWidth / 2, self.grid.cellHeight / 2);
                        self.state = self.startState();

                        // record the reward achieved
                        if (agent.nStepsHistory.length >= agent.nflot) {
                            agent.nStepsHistory = agent.nStepsHistory.slice(1);
                        }
                        agent.nStepsHistory.push(agent.nStepsCounter);
                        agent.nStepsCounter = 0;
                    } else {
                        agent.gridLocation = self.grid.getCellAt(self.sToX(self.state), self.sToY(self.state));
                        let x = agent.gridLocation.corners[2].x - (self.grid.cellWidth / 2),
                            y = agent.gridLocation.corners[2].y - (self.grid.cellHeight / 2);
                        agent.pos.set(x, y);
                    }
                }

                self.drawGrid();
            }, 20);
        } else {
            clearInterval(self.sid);
            self.sid = -1;
        }
    };

    global.GridWorld = GridWorld;

}(this));
