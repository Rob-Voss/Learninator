var PuckWorld = PuckWorld || {},
    AgentRLDQN = AgentRLDQN || {},
    Utility = Utility || {},
    Vec = Vec || {};

(function (global) {
    "use strict";

    /**
     * PuckWorld Environment
     * @name PuckWorld
     * @extends World
     * @constructor
     *
     * @returns {PuckWorld}
     */
    function PuckWorld() {
        let self = this;
        this.width = 600;
        this.height = 600;
        this.radius = 0.05;
        this.sid = -1;
        this.action = null;
        this.state = null;
        this.stepsPerTick = 1;
        this.pause = false;

        this.agents = [
            new AgentRLDQN(new Vec(300, 300), {
                brainType: 'RLDQN',
                env: {
                    getMaxNumActions: function () {
                        return self.getMaxNumActions();
                    },
                    getNumStates: function () {
                        return self.getNumStates();
                    },
                    getState: function () {
                        return self.getState();
                    },
                    reset: function () {
                        return self.reset();
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
                    gridLocation: false,
                    position: false,
                    id: false,
                    name: true
                }
            })
        ];

        //World.call(this, this.worldOpts, this.entityOpts);

        this.reset();

        return this;
    }

    PuckWorld.prototype.tick = function () {
        let self = this,
            obs;
        if (self.sid === -1) {
            self.sid = setInterval(function () {
                for (let k = 0; k < self.stepsPerTick; k++) {
                    self.state = self.getState();
                    self.action = self.agents[0].brain.act(self.state);
                    obs = self.sampleNextState();
                    self.agents[0].brain.learn(obs.r);
                }

                self.updateDraw(self.action, self.state, obs.r);
            }, 20);
        } else {
            clearInterval(self.sid);
            self.sid = -1;
        }
    };

    /**
     * Set up the puck world and the actions avail
     */
    PuckWorld.prototype.reset = function () {
        // Puck x,y,z,vx,vy,vz
        this.puck = {};
        this.target = {};
        this.enemy = {};
        this.puck.pos = new Vec(Math.random(), Math.random(), 0, Math.random() * 0.05 - 0.025, Math.random() * 0.05 - 0.025);
        this.target.pos = new Vec(Math.random(), Math.random()); // target
        this.enemy.pos = new Vec(Math.random(), Math.random()); // enemy
        this.radius = 0.05;
        this.t = 0;

        this.BADRAD = 0.25;
        this.tick();
    };

    /**
     * Return the number of states
     *
     * @returns {number}
     */
    PuckWorld.prototype.getNumStates = function () {
        return 8; // x,y,vx,vy, puck dx,dy
    };

    /**
     * Return the number of actions
     *
     * @returns {number}
     */
    PuckWorld.prototype.getMaxNumActions = function () {
        return 5; // left, right, up, down, nothing
    };

    PuckWorld.prototype.getState = function () {
        var s = [
            this.puck.pos.x - 0.5,
            this.puck.pos.y - 0.5,
            this.puck.pos.vx * 10,
            this.puck.pos.vy * 10,
            this.target.pos.x - this.puck.pos.x,
            this.target.pos.y - this.puck.pos.y,
            this.enemy.pos.x - this.puck.pos.x,
            this.enemy.pos.y - this.puck.pos.y
        ];
        return s;
    };

    /**
     */
    PuckWorld.prototype.sampleNextState = function () {
        // world dynamics
        this.puck.pos.x += this.puck.pos.vx; // newton
        this.puck.pos.y += this.puck.pos.vy;
        this.puck.pos.vx *= 0.95; // damping
        this.puck.pos.vy *= 0.95;

        // agent action influences puck velocity
        var accel = 0.002;
        switch (this.action) {
            case 0:
                this.puck.pos.vx -= accel;
                break;
            case 1:
                this.puck.pos.vx += accel;
                break;
            case 2:
                this.puck.pos.vy -= accel;
                break;
            case 3:
                this.puck.pos.vy += accel;
                break;
        }

        // handle boundary conditions and bounce
        if (this.puck.pos.x < this.radius) {
            this.puck.pos.vx *= -0.5; // bounce!
            this.puck.pos.x = this.radius;
        }
        if (this.puck.pos.x > 1 - this.radius) {
            this.puck.pos.vx *= -0.5;
            this.puck.pos.x = 1 - this.radius;
        }
        if (this.puck.pos.y < this.radius) {
            this.puck.pos.vy *= -0.5; // bounce!
            this.puck.pos.y = this.radius;
        }
        if (this.puck.pos.y > 1 - this.radius) {
            this.puck.pos.vy *= -0.5;
            this.puck.pos.y = 1 - this.radius;
        }

        this.t += 1;
        if (this.t % 73 === 0) {
            this.enemy.pos.x = Math.random(); // reset the target location
            this.enemy.pos.y = Math.random();
        }

        // compute distances
        var dx1 = this.puck.pos.x - this.target.pos.x, // Distance from gewdness
            dy1 = this.puck.pos.y - this.target.pos.y, // Distance from gewdness
            d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1),
            dx2 = this.puck.pos.x - this.enemy.pos.x, // Distance from badness
            dy2 = this.puck.pos.y - this.enemy.pos.y, // Distance from badness
            d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2),
            dxnorm = dx2 / d2,
            dynorm = dy2 / d2,
            speed = 0.001;
        this.enemy.pos.x += speed * dxnorm;
        this.enemy.pos.y += speed * dynorm;

        // compute reward
        // want to go close to green
        var r = -d1;
        if (d2 < this.BADRAD) {
            // but if we're too close to red that's bad
            r += 2 * (d2 - this.BADRAD) / this.BADRAD;
        }

        // give bonus for gliding with no force
        if (this.action === 4) {
            r += 0.05;
        }

        // evolve state in time
        var ns = this.getState(),
            out = {
                ns: ns,
                r: r
            };

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
            .attr('r', this.radius * this.width)
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
        var ppx = this.puck.pos.x,
            ppy = this.puck.pos.y,
            tx = this.target.pos.x,
            ty = this.target.pos.y,
            tx2 = this.enemy.pos.x,
            ty2 = this.enemy.pos.y,
            g, b;

        d3agent.attr('cx', ppx * this.width).attr('cy', ppy * this.height);
        d3target.attr('cx', tx * this.width).attr('cy', ty * this.height);
        d3target2.attr('cx', tx2 * this.width).attr('cy', ty2 * this.height);
        d3target2_radius.attr('cx', tx2 * this.width).attr('cy', ty2 * this.height).attr('r', this.BADRAD * this.height);
        d3line.attr('x1', ppx * this.width).attr('y1', ppy * this.height).attr('x2', ppx * this.width).attr('y2', ppy * this.height);
        var af = 20;
        d3line.attr('visibility', a === 4 ? 'hidden' : 'visible');
        switch (this.action) {
        case 0:
            d3line.attr('x2', ppx * this.width - af);
            break;
        case 1:
            d3line.attr('x2', ppx * this.width + af);
            break;
        case 2:
            d3line.attr('y2', ppy * this.height - af);
            break;
        case 3:
            d3line.attr('y2', ppy * this.height + af);
            break;
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
