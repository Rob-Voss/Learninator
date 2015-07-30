(function (global) {
    "use strict";

    var GridWorld = function (agent, state) {
        this.agent = agent || {};
        this.state = state || 0;

        // reward array
        this.Rarr = null;
        // cell types, 0 = normal, 1 = cliff
        this.T = null;

        this.gH = 10;
        this.gW = 10;
        this.gS = this.gH * this.gW; // number of states

        this.rs = {};
        this.trs = {};
        this.tvs = {};
        this.pas = {};
        this.cs = 60;  // cell size
        this.selected = -1;

        this.reset();
    };

    GridWorld.prototype = {
        allowedActions: function (s) {
            var x = this.sToX(s),
                y = this.sToY(s),
                as = [];
            if (x > 0) {
                as.push(0);
            }
            if (y > 0) {
                as.push(1);
            }
            if (y < this.gH - 1) {
                as.push(2);
            }
            if (x < this.gW - 1) {
                as.push(3);
            }

            return as;
        },
        cellClicked: function (s) {
            if (s === this.selected) {
                this.selected = -1; // toggle off
                $("#creward").html('(select a cell)');
            } else {
                this.selected = s;
                $("#creward").html(this.Rarr[s].toFixed(2));
                $("#rewardslider").slider('value', this.Rarr[s]);
            }
            this.drawGrid(); // redraw
        },
        drawGrid: function () {
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
                    if (typeof this.agent.V !== 'undefined') {
                        vv = this.agent.V[s];
                    } else if (typeof this.agent.Q !== 'undefined') {
                        var poss = this.allowedActions(s);
                        vv = -1;
                        for (var i = 0, n = poss.length; i < n; i++) {
                            var qsa = this.agent.Q[poss[i] * this.gS + s];
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
                    if (this.T[s] === 1) {
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
                    if (this.T[s] === 1) {continue;}

                    // write value
                    var tv = this.tvs[s];
                    tv.text(vv.toFixed(2));

                    // update policy arrows
                    var paa = this.pas[s];
                    for (var a = 0; a < 4; a++) {
                        var pa = paa[a],
                            prob = this.agent.P[a * this.gS + s],
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
        },
        initGrid: function () {
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

                    // skip rest for cliffs
                    if (this.T[s] === 1) {
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

        },
        nextStateDistribution: function (s, a) {
            var ns;
            // given (s,a) return distribution over s' (in sparse form)
            if (this.T[s] === 1) {
                // cliff! oh no!
                // var ns = 0; // reset to state zero (start)
            } else if (s === 55) {
                // agent wins! teleport to start
                ns = this.startState();
                while (this.T[ns] === 1) {
                    ns = this.randomState();
                }
            } else {
                // ordinary space
                var nx, ny,
                    x = this.sToX(s),
                    y = this.sToY(s);
                if (a === 0) {
                    nx = x - 1;
                    ny = y;
                }
                if (a === 1) {
                    nx = x;
                    ny = y - 1;
                }
                if (a === 2) {
                    nx = x;
                    ny = y + 1;
                }
                if (a === 3) {
                    nx = x + 1;
                    ny = y;
                }
                ns = nx * this.gH + ny;
                if (this.T[ns] === 1) {
                    // actually never mind, this is a wall. reset the agent
                    ns = s;
                }
            }

            // gridworld is deterministic, so return only a single next state
            return ns;
        },
        reset: function () {
            // specify some rewards
            var Rarr = R.zeros(this.gS),
                T = R.zeros(this.gS);
            Rarr[55] = 1;

            Rarr[54] = -1;
            //Rarr[63] = -1;
            Rarr[64] = -1;
            Rarr[65] = -1;
            Rarr[85] = -1;
            Rarr[86] = -1;

            Rarr[37] = -1;
            Rarr[33] = -1;
            //Rarr[77] = -1;
            Rarr[67] = -1;
            Rarr[57] = -1;

            // make some cliffs
            for (var q = 0; q < 8; q++) {
                var off = (q + 1) * this.gH + 2;
                T[off] = 1;
                Rarr[off] = 0;
            }
            for (var q = 0; q < 6; q++) {
                var off = 4 * this.gH + q + 2;
                T[off] = 1;
                Rarr[off] = 0;
            }
            T[5 * this.gH + 2] = 0;
            Rarr[5 * this.gH + 2] = 0; // make a hole

            this.Rarr = Rarr;
            this.T = T;
        },
        reward: function (s, a, ns) {
            // reward of being in s, taking action a, and ending up in ns
            return this.Rarr[s];
        },
        sampleNextState: function (s, a) {
            // gridworld is deterministic, so this is easy
            var ns = this.nextStateDistribution(s, a),
                r = this.Rarr[s]; // observe the raw reward of being in s, taking a, and ending up in ns
            r -= 0.01; // every step takes a bit of negative reward
            var out = {'ns': ns, 'r': r};
            if (s === 55 && ns === 0) {
                // episode is over
                out.reset_episode = true;
            }

            return out;
        },
        randomState: function () {
            return Math.floor(Math.random() * this.gS);
        },
        startState: function () {
            return 0;
        },
        getNumStates: function () {
            return this.gS;
        },
        getMaxNumActions: function () {
            return 4;
        },
        sToX: function (s) {
            return Math.floor(s / this.gH);
        },
        sToY: function (s) {
            return s % this.gH;
        },
        xyToS: function (x, y) {
            return x * this.gH + y;
        }
    };

    global.GridWorld = GridWorld;

}(this));
