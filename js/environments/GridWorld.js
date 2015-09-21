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
        this.steps_per_tick = 1;
        this.pause = false;

        this.agentOpts = {
            brainType: 'RLTD',
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
                replacing_traces: true,
                // number of planning steps per iteration. 0 = no planning
                planN: 50,
                // non-standard, updates policy smoothly to follow max_a Q
                smooth_policy_update: true,
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
            movingEntities: false
        };

        this.maze = new Maze({
            canvas: document.getElementById("world"),
            xCount: 10,
            yCount: 10
        });

        this.grid = this.maze.grid;
        this.walls = this.maze.walls;
        this.gH = this.grid.yCount;
        this.gW = this.grid.xCount;
        this.gS = this.grid.yCount * this.grid.xCount;
        this.cs = this.grid.cellWidth;  // cell size
        this.agents = [
            new AgentRLTD(new Vec(50, 50), this, this.agentOpts)
        ];

        this.initGrid();
        this.drawGrid();

        return this;
    };

    GridWorld.prototype = Object.create(World.prototype);
    GridWorld.prototype.constructor = World;

    GridWorld.prototype.tick = function () {
        var _this = this,
            obs;
        if (_this.sid === -1) {
            _this.sid = setInterval(function () {
                for (var k = 0; k < _this.steps_per_tick; k++) {
                    //_this.agents[0].tick();
                    // ask agent for an action
                    var a = _this.agents[0].brain.act(_this.state),
                    // run it through environment dynamics
                        obs = _this.sampleNextState(_this.state, a);

                    // allow opportunity for the agent to learn
                    _this.agents[0].brain.learn(obs.r);
                    _this.Rarr[_this.state] = obs.r;
                    // evolve environment to next state
                    _this.state = obs.ns;
                    _this.agents[0].gridLocation = _this.grid.getCellAt(_this.sToX(_this.state), _this.sToY(_this.state));

                    let x = _this.agents[0].gridLocation.coords.bottom.right.x - (_this.grid.cellWidth / 2),
                        y = _this.agents[0].gridLocation.coords.bottom.right.y - (_this.grid.cellHeight / 2);
                    _this.agents[0].position.set(x, y);

                    _this.agents[0].nsteps_counter += 1;
                    if (typeof obs.reset_episode !== 'undefined') {
                        _this.agents[0].score += 1;
                        _this.agents[0].brain.resetEpisode();
                        // record the reward achieved
                        if (_this.agents[0].nsteps_history.length >= _this.agents[0].nflot) {
                            _this.agents[0].nsteps_history = _this.agents[0].nsteps_history.slice(1);
                        }
                        _this.agents[0].nsteps_history.push(_this.agents[0].nsteps_counter);
                        _this.agents[0].nsteps_counter = 0;

                        _this.agents[0].gridLocation = _this.grid.getCellAt(0, 0);
                        _this.agents[0].position.set(_this.grid.cellWidth / 2, _this.grid.cellHeight / 2);
                    }
                }

                _this.drawGrid();
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
     * @param {Number} s
     * @returns {Number}
     */
    GridWorld.prototype.sToX = function (s) {
        return Math.floor(s / this.grid.xCount);
    };

    /**
     * Convert the state to a y
     * @param {Number} s
     * @returns {Number}
     */
    GridWorld.prototype.sToY = function (s) {
        return s % this.grid.yCount;
    };

    /**
     * Convert an x, y to the state
     * @param {Number} x
     * @param {Number} y
     * @returns {Number}
     */
    GridWorld.prototype.xyToS = function (x, y) {
        return x * this.grid.xCount + y;
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

                if (vv > 0) {
                    g = 255;
                    r = 255 - vv * 100;
                    b = 255 - vv * 100;
                }
                if (vv < 0) {
                    g = 255 + vv * 100;
                    r = 255;
                    b = 255 + vv * 100;
                }

                var vcol = 'rgb(' + Math.floor(r) + ',' + Math.floor(g) + ',' + Math.floor(b) + ')',
                    rcol = "";
                let actions = this.Aarr[s],
                    avail = actions[a];
                if (avail === 1) {
                    vcol = "#AAA";
                    rcol = "#AAA";
                }

                // update colors of rectangles based on value
                var r = this.rs[s];
                if (s === this.selected) {
                    // highlight selected cell
                    r.attr('fill', '#FF0');
                } else {
                    r.attr('fill', vcol);
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
                        nx = 0, ny = 0;
                    if (prob < 0.01) {
                        pa.attr('visibility', 'hidden');
                    }
                    else {
                        pa.attr('visibility', 'visible');
                    }
                    var ss = this.cs / 2 * prob * 0.9;
                    if (a === 0) {
                        nx = -ss;
                        ny = 0;
                    }
                    if (a === 1) {
                        nx = 0;
                        ny = -ss;
                    }
                    if (a === 2) {
                        nx = 0;
                        ny = ss;
                    }
                    if (a === 3) {
                        nx = ss;
                        ny = 0;
                    }
                    pa.attr('x1', xcoord + this.cs / 2)
                        .attr('y1', ycoord + this.cs / 2)
                        .attr('x2', xcoord + this.cs / 2 + nx)
                        .attr('y2', ycoord + this.cs / 2 + ny);
                }
            }
        }
    };

    GridWorld.prototype.initGrid = function () {
        var d3elt = d3.select('#draw');
        this.rs = {};
        this.trs = {};
        this.tvs = {};
        this.pas = {};

        var gh = this.gH, // height in cells
            gw = this.gW, // width in cells
            gs = this.gS, // total number of cells
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
                    .attr('height', this.cs)
                    .attr('width', this.cs)
                    .attr('fill', '#FFF')
                    .attr('stroke', 'black')
                    .attr('stroke-width', 2);
                this.rs[s] = r;

                // reward text
                var tr = g.append('text')
                    .attr('x', xcoord + 5)
                    .attr('y', ycoord + 55)
                    .attr('font-size', 10)
                    .text('');
                this.trs[s] = tr;

                let actions = this.Aarr[s],
                    avail = actions[a];
                if (avail === 1) {
                    continue;
                }

                // value text
                var tv = g.append('text')
                    .attr('x', xcoord + 5)
                    .attr('y', ycoord + 20)
                    .text('');
                this.tvs[s] = tv;

                // policy arrows
                this.pas[s] = [];
                for (var a = 0; a < 4; a++) {
                    var pa = g.append('line')
                        .attr('x1', xcoord)
                        .attr('y1', ycoord)
                        .attr('x2', xcoord)
                        .attr('y2', ycoord)
                        .attr('stroke', 'black')
                        .attr('stroke-width', '2')
                        .attr("marker-end", "url(#arrowhead)");
                    this.pas[s].push(pa);
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
