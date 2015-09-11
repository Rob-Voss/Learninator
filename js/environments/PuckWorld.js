(function (global) {
    "use strict";

    /**
     * PuckWorld Environment
     *
     * @constructor
     */
    var PuckWorld = function () {
        this.agentOpts = {
            brainType: 'RLDQN',
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
        };

        this.agents = [
            new AgentRLDQN(new Vec(300, 300), this, this.agentOpts)
        ];

        this.width = 600;
        this.height = 600;
        this.rad = 0.05;
        this.sid = -1;
        this.action = null;
        this.state = null;
        this.steps_per_tick = 1;
        this.pause = false;

        //World.call(this, this.worldOpts, this.entityOpts);

        this.reset();

        return this;
    };

    PuckWorld.prototype.tick = function () {
        var _this = this,
            obs;
        if (_this.sid === -1) {
            _this.sid = setInterval(function () {
                for (var k = 0; k < _this.steps_per_tick; k++) {
                    _this.state = _this.getState();
                    _this.action = _this.agents[0].brain.act(_this.state);
                    obs = _this.sampleNextState(_this.action);
                    _this.agents[0].brain.learn(obs.r);
                }

                _this.updateDraw(_this.action, _this.state, obs.r);
            }, 20);
        } else {
            clearInterval(_this.sid);
            _this.sid = -1;
        }
    };
    /**
     * Set up the puck world and the actions avail
     */
    PuckWorld.prototype.reset = function () {
        this.ppx = Math.random(); // puck x,y
        this.ppy = Math.random();
        this.pvx = Math.random() * 0.05 - 0.025; // velocity
        this.pvy = Math.random() * 0.05 - 0.025;
        this.tx = Math.random(); // target
        this.ty = Math.random();
        this.tx2 = Math.random(); // target
        this.ty2 = Math.random(); // target
        this.rad = 0.05;
        this.t = 0;

        this.BADRAD = 0.25;
        this.tick();
    };

    /**
     * Return the number of states
     *
     * @returns {Number}
     */
    PuckWorld.prototype.getNumStates = function () {
        return 8; // x,y,vx,vy, puck dx,dy
    };

    /**
     * Return the number of actions
     *
     * @returns {Number}
     */
    PuckWorld.prototype.getMaxNumActions = function () {
        return 5; // left, right, up, down, nothing
    };

    PuckWorld.prototype.getState = function () {
        var s = [this.ppx - 0.5, this.ppy - 0.5, this.pvx * 10, this.pvy * 10, this.tx - this.ppx, this.ty - this.ppy, this.tx2 - this.ppx, this.ty2 - this.ppy];
        return s;
    };

    /**
     * Observe the raw reward of being in s, taking a, and ending up in ns
     *
     * @param {Number} s
     * @param {Number} a
     * @returns {{ns: (*|Number), r: (*|Number)}}
     */
    PuckWorld.prototype.sampleNextState = function (a) {
        // world dynamics
        this.ppx += this.pvx; // newton
        this.ppy += this.pvy;
        this.pvx *= 0.95; // damping
        this.pvy *= 0.95;

        // agent action influences puck velocity
        var accel = 0.002;
        if (a === 0) {
            this.pvx -= accel;
        }
        if (a === 1) {
            this.pvx += accel;
        }
        if (a === 2) {
            this.pvy -= accel;
        }
        if (a === 3) {
            this.pvy += accel;
        }

        // handle boundary conditions and bounce
        if (this.ppx < this.rad) {
            this.pvx *= -0.5; // bounce!
            this.ppx = this.rad;
        }
        if (this.ppx > 1 - this.rad) {
            this.pvx *= -0.5;
            this.ppx = 1 - this.rad;
        }
        if (this.ppy < this.rad) {
            this.pvy *= -0.5; // bounce!
            this.ppy = this.rad;
        }
        if (this.ppy > 1 - this.rad) {
            this.pvy *= -0.5;
            this.ppy = 1 - this.rad;
        }

        this.t += 1;
        if (this.t % 100 === 0) {
            this.tx = Math.random(); // reset the target location
            this.ty = Math.random();
        }

         if(this.t % 73 === 0) {
           this.tx2 = Math.random(); // reset the target location
           this.ty2 = Math.random();
         }

        // compute distances
        var dx1 = this.ppx - this.tx,
            dy1 = this.ppy - this.ty,
            d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1),
            dx2 = this.ppx - this.tx2,
            dy2 = this.ppy - this.ty2,
            d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2),
            dxnorm = dx2 / d2,
            dynorm = dy2 / d2,
            speed = 0.001;
        this.tx2 += speed * dxnorm;
        this.ty2 += speed * dynorm;

        // compute reward
        var r = -d1; // want to go close to green
        if (d2 < this.BADRAD) {
            // but if we're too close to red that's bad
            r += 2 * (d2 - this.BADRAD) / this.BADRAD;
        }

        if(a === 4) {
            r += 0.05;
        } // give bonus for gliding with no force

        // evolve state in time
        var ns = this.getState(),
            out = {'ns': ns, 'r': r};
        return out;
    };

    var d3line = null,
        d3agent = null,
        d3target = null,
        d3target2 = null,
        d3target2_radius = null,
        svg;

    PuckWorld.prototype.initDraw = function () {
        var d3elt = d3.select('#draw');
        d3elt.html('');

        svg = d3elt.append('svg').attr('width', this.width).attr('height', this.height)
            .append('g').attr('transform', 'scale(1)');

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

        // draw the puck
        d3agent = svg.append('circle')
            .attr('cx', 100)
            .attr('cy', 100)
            .attr('r', this.rad * this.width)
            .attr('fill', '#FF0')
            .attr('stroke', '#000')
            .attr('id', 'puck');

        // draw the target
        d3target = svg.append('circle')
            .attr('cx', 200)
            .attr('cy', 200)
            .attr('r', 10)
            .attr('fill', '#0F0')
            .attr('stroke', '#000')
            .attr('id', 'target');

        // bad target
        d3target2 = svg.append('circle')
            .attr('cx', 300)
            .attr('cy', 300)
            .attr('r', 10)
            .attr('fill', '#F00')
            .attr('stroke', '#000')
            .attr('id', 'target2');

        d3target2_radius = svg.append('circle')
            .attr('cx', 300)
            .attr('cy', 300)
            .attr('r', 10)
            .attr('fill', 'rgba(255,0,0,0.1)')
            .attr('stroke', '#000');

        // draw line indicating forces
        d3line = svg.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', 0)
            .attr('stroke', 'black')
            .attr('stroke-width', '2')
            .attr("marker-end", "url(#arrowhead)");
    };

    PuckWorld.prototype.updateDraw = function (a, s, r) {
        // reflect puck world state on screen
        var ppx = this.ppx,
            ppy = this.ppy,
            tx = this.tx,
            ty = this.ty,
            tx2 = this.tx2,
            ty2 = this.ty2,
            g,b;

        d3agent.attr('cx', ppx * this.width).attr('cy', ppy * this.height);
        d3target.attr('cx', tx * this.width).attr('cy', ty * this.height);
        d3target2.attr('cx', tx2 * this.width).attr('cy', ty2 * this.height);
        d3target2_radius.attr('cx', tx2 * this.width).attr('cy', ty2 * this.height).attr('r', this.BADRAD * this.height);
        d3line.attr('x1', ppx * this.width).attr('y1', ppy * this.height).attr('x2', ppx * this.width).attr('y2', ppy * this.height);
        var af = 20;
        d3line.attr('visibility', a === 4 ? 'hidden' : 'visible');
        if (a === 0) {
            d3line.attr('x2', ppx * this.width - af);
        }
        if (a === 1) {
            d3line.attr('x2', ppx * this.width + af);
        }
        if (a === 2) {
            d3line.attr('y2', ppy * this.height - af);
        }
        if (a === 3) {
            d3line.attr('y2', ppy * this.height + af);
        }

        // color agent by reward
        var vv = r + 0.5,
            ms = 255.0;
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
        var vcol = 'rgb(' + Math.floor(r) + ',' + Math.floor(g) + ',' + Math.floor(b) + ')';
        d3agent.attr('fill', vcol);
    };

    global.PuckWorld = PuckWorld;

}(this));
