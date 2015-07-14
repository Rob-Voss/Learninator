(function (global) {
    "use strict";

    /**
     * World object contains many agents and walls and food and stuff
     * @constructor
     */
    var WaterWorld = function (canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.renderer = {};

        this.agents = [];
        this.items = [];
        this.walls = [];

        this.clock = 0;

        // set up walls in the world
        this.walls.push(new Wall(new Vec(0, 0), new Vec(0 + this.width, 0)));
        this.walls.push(new Wall(new Vec(0 + this.width, 0), new Vec(0 + this.width, 0 + this.height)));
        this.walls.push(new Wall(new Vec(0 + this.width, 0 + this.height), new Vec(0, 0 + this.height)));
        this.walls.push(new Wall(new Vec(0, 0 + this.height), new Vec(0, 0)));

        // set up food and poison
        for (var k = 0; k < 50; k++) {
            var type = Utility.randi(1, 3),
                x = Utility.randi(20, this.width - 20),
                y = Utility.randi(20, this.height - 20),
                vx = Math.random() * 5 - 2.5,
                vy = Math.random() * 5 - 2.5,
                position = new Vec(x, y, vx, vy),
                entityOpts = {interactive: false, collision: false},
                entity = new Item(type, position, undefined, entityOpts);

            this.items.push(entity);
        }
    };

    WaterWorld.prototype = {
        tick: function () {
            // tick the environment
            this.clock++;

            // fix input to all agents based on environment process eyes
            for (var ai = 0, na = this.agents.length; ai < na; ai++) {
                var agent = this.agents[ai];

                for (var ei = 0, ne = agent.eyes.length; ei < ne; ei++) {
                    var eye = agent.eyes[ei];
                    // we have a line from p to p->eyep
                    var eyep = new Vec(agent.position.x + eye.maxRange * Math.sin(agent.angle + eye.angle),
                        agent.position.y + eye.maxRange * Math.cos(agent.angle + eye.angle));
                    var res = Utility.collisionCheck(agent.position, eyep, this.walls, this.items);
                    if (res) {
                        // eye collided with wall
                        eye.sensedProximity = res.vecI.distanceTo(agent.position);
                        eye.sensedType = res.type;
                        if ('vx' in res) {
                            eye.vx = res.vx;
                            eye.vy = res.vy;
                        } else {
                            eye.vx = 0;
                            eye.vy = 0;
                        }
                    } else {
                        eye.sensedProximity = eye.maxRange;
                        eye.sensedType = -1;
                        eye.vx = 0;
                        eye.vy = 0;
                    }
                }

                // let the agents behave in the world based on their input
                agent.forward();

                // apply outputs of agents on evironment
                agent.oldPos = agent.position; // back up old position
                agent.oldAngle = agent.angle; // and angle

                // execute agent's desired action
                var speed = 1;
                if (agent.action === 0) {
                    agent.position.vx += -speed;
                }
                if (agent.action === 1) {
                    agent.position.vx += speed;
                }
                if (agent.action === 2) {
                    agent.position.vy += -speed;
                }
                if (agent.action === 3) {
                    agent.position.vy += speed;
                }

                // forward the agent by velocity
                agent.position.vx *= 0.95;
                agent.position.vy *= 0.95;
                agent.position.x += agent.position.vx;
                agent.position.y += agent.position.vy;

                // agent is trying to move from p to oldPos. Check walls
                var derp = Utility.collisionCheck(agent.oldPos, agent.position, this.walls);
                if (derp) {
                    // wall collision...
                }

                // handle boundary conditions.. bounce agent
                if (agent.position.x < 1) {
                    agent.position.x = 1;
                    agent.position.vx = 0;
                    agent.position.vy = 0;
                }
                if (agent.position.x > this.width - 1) {
                    agent.position.x = this.width - 1;
                    agent.position.vx = 0;
                    agent.position.vy = 0;
                }
                if (agent.position.y < 1) {
                    agent.position.y = 1;
                    agent.position.vx = 0;
                    agent.position.vy = 0;
                }
                if (agent.position.y > this.height - 1) {
                    agent.position.y = this.height - 1;
                    agent.position.vx = 0;
                    agent.position.vy = 0;
                }

                // tick all items
                var updateItems = false;

                agent.digestionSignal = 0; // important - reset this!
                for (var ii = 0, n = this.items.length; ii < n; ii++) {
                    var it = this.items[ii];
                    it.age += 1;

                    // see if some agent gets lunch
                    var d = agent.position.distanceTo(it.position);
                    if (d < it.radius + agent.radius) {
                        // wait lets just make sure that this isn't through a wall
                        //var rescheck = this.closestCollision(agent.position, it.position, true, false);
                        var rescheck = false;
                        if (!rescheck) {
                            // ding! nom nom nom
                            switch (it.type) {
                                case 1:// mmm delicious apple
                                    agent.digestionSignal += 1.0;
                                    break;
                                case 2: // ewww poison
                                    agent.digestionSignal += -1.0;
                                    break;
                            }
                            it.cleanup = true;
                            updateItems = true;
                            break; // break out of loop, item was consumed
                        }
                    }

                    // move the items
                    it.position.x += it.position.vx;
                    it.position.y += it.position.vy;
                    if (it.position.x < 1) {
                        it.position.x = 1;
                        it.position.vx *= -1;
                    }
                    if (it.position.x > this.width - 1) {
                        it.position.x = this.width - 1;
                        it.position.vx *= -1;
                    }
                    if (it.position.y < 1) {
                        it.position.y = 1;
                        it.position.vy *= -1;
                    }
                    if (it.position.y > this.height - 1) {
                        it.position.y = this.height - 1;
                        it.position.vy *= -1;
                    }

                    if (it.age > 5000 && this.clock % 100 === 0 && Utility.randf(0, 1) < 0.1) {
                        it.cleanup = true; // replace this one, has been around too long
                        updateItems = true;
                    }
                }

                if (updateItems) {
                    var nt = [];
                    for (var ic = 0, nc = this.items.length; ic < nc; ic++) {
                        var itc = this.items[ic];
                        if (!itc.cleanup) {
                            nt.push(itc);
                        }
                    }
                    this.items = nt; // swap
                }

                if (this.items.length < 50 && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
                    this.items.push(new Item(Utility.randi(20, this.height - 20), Utility.randi(20, this.height - 20), Utility.randi(1, 3)));
                }

                // agents are given the opportunity to learn based on feedback of their action on environment
                agent.backward();
            }
        },
        draw: function () {
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.ctx.lineWidth = 1;

            // draw walls in environment
            this.ctx.strokeStyle = "rgb(0,0,0)";
            this.ctx.beginPath();
            for (var i = 0, n = this.walls.length; i < n; i++) {
                var q = this.walls[i];
                this.ctx.moveTo(q.v1.x, q.v1.y);
                this.ctx.lineTo(q.v2.x, q.v2.y);
            }
            this.ctx.stroke();

            // draw agents
            // color agent based on reward it is experiencing at the moment
            var r = 0;
            this.ctx.fillStyle = "rgb(" + r + ", 150, 150)";
            this.ctx.strokeStyle = "rgb(0,0,0)";
            for (var ai = 0, na = this.agents.length; ai < na; ai++) {
                var a = this.agents[ai];

                // draw agents body
                this.ctx.beginPath();
                this.ctx.arc(a.oldPos.x, a.oldPos.y, a.radius, 0, Math.PI * 2, true);
                this.ctx.fill();
                this.ctx.stroke();

                // draw agents sight
                for (var ei = 0, ne = a.eyes.length; ei < ne; ei++) {
                    var e = a.eyes[ei],
                        sr = e.sensedProximity;

                    switch (e.sensedType) {
                        case -1:
                        case 0:
                            this.ctx.strokeStyle = "rgb(200,200,200)"; // wall or nothing
                            break;
                        case 1:
                            // apples
                            this.ctx.strokeStyle = "rgb(255,150,150)";
                            break;
                        case 2:
                            // poison
                            this.ctx.strokeStyle = "rgb(150,255,150)";
                            break;
                    }

                    this.ctx.beginPath();
                    this.ctx.moveTo(a.oldPos.x, a.oldPos.y);
                    this.ctx.lineTo(a.oldPos.x + sr * Math.sin(a.oldAngle + e.angle),
                        a.oldPos.y + sr * Math.cos(a.oldAngle + e.angle));
                    this.ctx.stroke();
                }
            }

            // draw items
            this.ctx.strokeStyle = "rgb(0,0,0)";
            for (var ii = 0, ni = this.items.length; ii < ni; ii++) {
                var it = this.items[ii];
                if (it === undefined) {
                    console.log('Missing item:'+ii+' ni:'+ni+' length:'+this.items.length);
                }

                switch (it.type) {
                    case 1:
                        this.ctx.fillStyle = "rgb(255, 150, 150)";
                        break;
                    case 2:
                        this.ctx.fillStyle = "rgb(150, 255, 150)";
                        break;
                }

                this.ctx.beginPath();
                this.ctx.arc(it.position.x, it.position.y, it.radius, 0, Math.PI * 2, true);
                this.ctx.fill();
                this.ctx.stroke();
            }
        }

    };

    global.WaterWorld = WaterWorld;

}(this));
