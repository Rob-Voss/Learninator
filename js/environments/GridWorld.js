(function (global) {
    "use strict";

    /**
     * GridWorld Environment
     *
     * @constructor
     */
    var GridWorld = function () {
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
        this.pause = false;
        this.numItems = 0;

        // Reward graphing type
        this.useFlot = true;
        this.useGraph = false;

        // Collision type
        this.CD = {
            type: 'quad',
            maxChildren: 2,
            maxDepth: 10
        };
        this.cheats = {
            quad: true,
            grid: false,
            population: false,
            walls: false
        };

        // flot stuff
        this.nflot = 1000;
        this.smoothRewardHistory = [];
        this.smoothReward = [];
        this.flott = [];

        this.agentOpts = {
            brainType: 'RLTD',
            env: this,
            spec: {
                update: 'qlearn', // 'qlearn' or 'sarsa'
                // discount factor, [0, 1)
                gamma: 0.9,
                // initial epsilon for epsilon-greedy policy, [0, 1)
                epsilon: 0.2,
                // value function learning rate
                alpha: 0.1,
                // eligibility trace decay, [0,1). 0 = no eligibility traces
                lambda: 0,
                // use replacing or accumulating traces
                replacingTraces: true,
                // number of planning steps per iteration. 0 = no planning
                planN: 50,
                // non-standard, updates policy smoothly to follow max_a Q
                smoothPolicyUpdate: true,
                // learning rate for smooth policy update
                beta: 0.1
            },
            numEyes: 0,
            numTypes: 0,
            width: 20,
            height: 20,
            radius: 10,
            collision: false,
            interactive: false,
            useSprite: false,
            cheats: {
                gridLocation: false,
                position: false,
                id: false,
                name: true
            }
        };

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
            new AgentRLTD(new Vec(50, 50), this.agentOpts)
        ];

        this.initGrid();
        this.drawGrid();
        this.initFlot();
        this.tick();

        return this;
    };

    GridWorld.prototype = Object.create(World.prototype);
    GridWorld.prototype.constructor = World;

    /**
     * Graph the agent rewards
     */
    GridWorld.prototype.graphRewards = function () {
        // If we are using flot based rewards
        for (var a = 0, ac = this.agents.length; a < ac; a++) {
            var agent = this.agents[a],
                rew = agent.lastReward;

            if (this.smoothReward[a] === null) {
                this.smoothReward[a] = rew;
            }
            this.smoothReward[a] = this.smoothReward[a] * 0.999 + rew * 0.001;
            this.flott[a] += 1;
            if (this.flott[a] === 50) {
                for (var i = 0, hl = this.smoothRewardHistory[a].length; i <= hl; i++) {
                    // record smooth reward
                    if (hl >= this.nflot) {
                        this.smoothRewardHistory[a] = this.smoothRewardHistory[a].slice(1);
                    }
                    this.smoothRewardHistory[a].push(this.smoothReward[a]);
                    this.flott[a] = 0;
                }
            }
            if (typeof this.series[a] !== 'undefined') {
                this.series[a].data = this.getFlotRewards(a);
            }
        }

        this.plot.setData(this.series);
        this.plot.draw();
    };

    /**
     * Initialize the Flot class
     */
    GridWorld.prototype.initFlot = function () {
        for (var a = 0; a < this.agents.length; a++) {
            this.smoothReward[a] = null;
            this.smoothRewardHistory[a] = null;
        }
        this.container = document.getElementById('flotreward');
        this.series = [];
        for (var a = 0, ac = this.agents.length; a < ac; a++) {
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
                min: -0.05,
                max: 0.05
            }
        });
    };

    /**
     * zip rewards into flot data
     * @param {Number} an
     * @returns {Array}
     */
    GridWorld.prototype.getFlotRewards = function (an) {
        var res = [];
        if (this.smoothRewardHistory[an] === null) {
            this.smoothRewardHistory[an] = [];
        }

        for (var i = 0, hl = this.smoothRewardHistory[an].length; i < hl; i++) {
            res.push([i, this.smoothRewardHistory[an][i]]);
        }

        return res;
    };

    /**
     *
     */
    GridWorld.prototype.tick = function () {
        var _this = this,
            obs;
        if (_this.sid === -1) {
            _this.sid = setInterval(function () {
                for (var k = 0; k < _this.stepsPerTick; k++) {
                    // ask agent for an action
                    var a = _this.agents[0].brain.act(_this.state),
                    // run it through environment dynamics
                        obs = _this.sampleNextState(_this.state, a);

                    // allow opportunity for the agent to learn
                    _this.agents[0].brain.learn(obs.r);
                    // evolve environment to next state
                    _this.state = obs.ns;

                    _this.agents[0].nStepsCounter += 1;
                    if (typeof obs.resetEpisode !== 'undefined') {
                        _this.agents[0].score += 1;
                        _this.agents[0].brain.resetEpisode();

                        _this.agents[0].gridLocation = _this.grid.getCellAt(0, 0);
                        _this.agents[0].position.set(_this.grid.cellWidth / 2, _this.grid.cellHeight / 2);
                        _this.state = _this.startState();

                        // record the reward achieved
                        if (_this.agents[0].nStepsHistory.length >= _this.agents[0].nflot) {
                            _this.agents[0].nStepsHistory = _this.agents[0].nStepsHistory.slice(1);
                        }
                        _this.agents[0].nStepsHistory.push(_this.agents[0].nStepsCounter);
                        _this.agents[0].nStepsCounter = 0;
                    } else {
                        _this.agents[0].gridLocation = _this.grid.getCellAt(_this.sToX(_this.state), _this.sToY(_this.state));
                        let x = _this.agents[0].gridLocation.coords.bottom.right.x - (_this.grid.cellWidth / 2),
                            y = _this.agents[0].gridLocation.coords.bottom.right.y - (_this.grid.cellHeight / 2);
                        _this.agents[0].position.set(x, y);
                    }
                }

                _this.drawGrid();
                _this.graphRewards();
            }, 20);
        } else {
            clearInterval(_this.sid);
            _this.sid = -1;
        }
    };

    /**
     * Set up the grid world and the actions avail
     */
    GridWorld.prototype.reset = function () {
        // specify some rewards
        var Rarr = Utility.zeros(this.gS),
            Aarr = new Array(this.gS),
            lastState = 0;

        for (var y = 0; y < this.gH; y++) {
            for (var x = 0; x < this.gW; x++) {
                var state = this.xyToS(x, y),
                    actions = this.grid.disconnectedNeighbors(this.grid.getCellAt(x, y)),
                    actionsAvail = {0: null, 1: null, 2: null, 3: null};
                for (var a = 0; a < actions.length; a++) {
                    var action = actions[a],
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
                var nulled = 0
                for (var key in actionsAvail) {
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
    };

    /**
     * Get the reward of being in s, taking action a, and ending up in ns
     * @param {Number} s
     * @param {Number} a
     * @param {Number} ns
     * @returns {Number}
     */
    GridWorld.prototype.reward = function (s, a, ns) {
        var rew = this.Rarr[s];

        return rew;
    };

    /**
     *
     * @param {Number} s
     * @param {Number} a
     * @returns {Number}
     */
    GridWorld.prototype.nextStateDistribution = function (s, a) {
        var ns, nx, ny,
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
     * @param {Number} s
     * @param {Number} a
     * @returns {{ns: (*|Number), r: (*|Number)}}
     */
    GridWorld.prototype.sampleNextState = function (s, a) {
        var ns = this.nextStateDistribution(s, a),
            r = this.reward(s, a, ns);

        // every step takes a bit of negative reward
        r -= 0.01;
        var out = {
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
     * @returns {Number}
     */
    GridWorld.prototype.getNumStates = function () {
        return this.gS;
    };

    /**
     * Return the number of actions
     * @returns {Number}
     */
    GridWorld.prototype.getMaxNumActions = function () {
        return 4;
    };

    /**
     * Return the allowed actions based on s
     * @returns {Array}
     */
    GridWorld.prototype.allowedActions = function (s) {
        var x = this.sToX(s),
            y = this.sToY(s),
            as = [],
            c = this.grid.getCellAt(x, y),
            actions = this.grid.disconnectedNeighbors(c);

        for (var a = 0; a < actions.length; a++) {
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
     * Return a rand state
     * @returns {Number}
     */
    GridWorld.prototype.randomState = function () {
        return Math.floor(Math.random() * this.gS);
    };

    /**
     * Return the starting state
     * @returns {Number}
     */
    GridWorld.prototype.startState = function () {
        return 0;
    };

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
                tv.text(vv.toFixed(2));

                // update policy arrows
                var paa = this.pas[s];
                for (var a = 0; a < 4; a++) {
                    var pa = paa[a],
                        prob = this.agents[0].brain.P[a * this.gS + s],
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
     *
     */
    GridWorld.prototype.initGrid = function () {
        var d3elt = d3.select('#draw');
        this.rs = {};
        this.trs = {};
        this.tvs = {};
        this.pas = {};

        var gh = this.gH, // height in cells
            gw = this.gW, // width in cells
            gs = this.gW * this.gH, // total number of cells
            w = 600,
            h = 600;

        var _this = this;

        d3elt.html('');

        var svg = d3elt.append('svg')
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

        for (var y = 0; y < gh; y++) {
            for (var x = 0; x < gw; x++) {
                var xcoord = x * this.cs,
                    ycoord = y * this.cs,
                    s = this.xyToS(x, y),
                    g = svg.append('g');

                // click callback for group
                g.on('click', function (ss) {
                    return function () {
                        _this.cellClicked(ss);
                    }; // close over s
                }(s));

                // set up cell rectangles
                var r = g.append('rect')
                    .attr('x', xcoord)
                    .attr('y', ycoord)
                    .attr('height', this.cs - 2)
                    .attr('width', this.cs - 2)
                    .attr('fill', '#FFF')
                    .attr('stroke', 'black')
                    .attr('stroke-width', '1');
                this.rs[s] = r;

                // reward text
                var tr = g.append('text')
                    .attr('x', xcoord + 5)
                    .attr('y', ycoord + 55)
                    .attr('font-size', 10)
                    .text('');
                this.trs[s] = tr;

                // value text
                var tv = g.append('text')
                    .attr('x', xcoord + 5)
                    .attr('y', ycoord + 20)
                    .text('');
                this.tvs[s] = tv;

                // policy arrows
                this.pas[s] = [];
                for (var a = 0; a < 4; a++) {
                    this.pas[s][a] = {};
                    var x1, x2, y1, y2, lx1, lx2, ly1, ly2,
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

                    var pa = g.append('line')
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
                        .attr('x1', lx1 - 1)
                        .attr('y1', ly1 - 1)
                        .attr('x2', lx2 - 1)
                        .attr('y2', ly2 - 1)
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

    global.GridWorld = GridWorld;

}(this));
