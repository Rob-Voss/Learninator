(function (global) {
    "use strict";

    /**
     * World object contains many agents and walls and food and stuff
     * @constructor
     */
    var WaterWorld = function (canvas, agents) {
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
        this.agents = agents;

        var _this = this;

        // PIXI gewdness
        this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {view: this.canvas}, true);
        this.renderer.backgroundColor = 0xFFFFFF;
        document.body.appendChild(this.renderer.view);
        this.stage = new PIXI.Container();

        // set up food and poison
        for (var k = 0; k < 20; k++) {
            var entity = this.addEntity();
            this.stage.addChild(entity.shape);
        }

        // Add the walls to the world
        for (var w = 0; w < this.walls.length; w++) {
            this.stage.addChild(this.walls[w].shape);
        }

        // Add the agents
        for (var a = 0; a < this.agents.length; a++) {
            //this.agents[a].shape.position = this.agents[a].position;
            this.stage.addChild(this.agents[a].shape);
            for (var ei = 0; ei < this.agents[a].eyes.length; ei++) {
                //this.agents[a].eyes[ei].position = this.agents[a].position;
                this.stage.addChild(this.agents[a].eyes[ei].shape);
            }
        }

        requestAnimationFrame(animate);
        function animate() {
            requestAnimationFrame(animate);
            _this.tick();
            _this.renderer.render(_this.stage);
        }

        this.addEntity = function() {
            var type = Utility.randi(1, 3),
                x = Utility.randi(20, this.width - 20),
                y = Utility.randi(20, this.height - 20),
                vx = Math.random() * 5 - 2.5,
                vy = Math.random() * 5 - 2.5,
                entity = new Entity(type, new Vec(x, y, vx, vy, 0, 0), [0][0], {interactive: false, collision: false});

            this.items.push(entity);

            return entity;
        };

        this.draw = function () {
            // draw walls in environment
            for (var i = 0, n = this.walls.length; i < n; i++) {
                this.walls[i].draw();
            }

            // draw agents
            for (var ai = 0, na = this.agents.length; ai < na; ai++) {
                // draw agents body
                this.agents[ai].draw();

                // draw agents sight
                for (var ei = 0, ne = this.agents[ai].eyes.length; ei < ne; ei++) {
                    this.agents[ai].eyes[ei].draw(this.agents[ai]);
                }
            }

            // draw items
            for (var ii = 0, ni = this.items.length; ii < ni; ii++) {
                this.items[ii].draw();
            }
        };

        this.tick = function () {
            // tick the environment
            this.clock++;
            var smallWorld = {
                walls: this.walls,
                entities: this.entities,
                width: this.width,
                height: this.height
            };

            // fix input to all agents based on environment process eyes
            for (var ai = 0, na = this.agents.length; ai < na; ai++) {
                // Loop through the eyes and check the walls and nearby entities
                for (var e = 0; e < this.agents[ai].numEyes; e++) {
                    this.agents[ai].eyes[e].sense(this.agents[ai].position, this.agents[ai].angle, this.walls, this.items);
                }

                // Let the agents behave in the world based on their input
                this.agents[ai].act();

                // Move the agent
                this.agents[ai].move(smallWorld);

                // tick all items
                var updateItems = false;

                this.agents[ai].digestionSignal = 0; // important - reset this!
                for (var ii = 0, n = this.items.length; ii < n; ii++) {
                    this.items[ii].age += 1;

                    // see if some agent gets lunch
                    var d = this.agents[ai].position.distanceTo(this.items[ii].position);
                    if (d < this.items[ii].radius + this.agents[ai].radius) {
                        // wait lets just make sure that this isn't through a wall
                        //var rescheck = this.closestCollision(this.agents[ai].position, this.items[ii].position, this.walls);
                        var rescheck = false;
                        if (!rescheck) {
                            // ding! nom nom nom
                            this.agents[ai].digestionSignal += (this.items[ii].type === 1) ? this.agents[ai].carrot : this.agents[ai].stick;
                            this.items[ii].cleanup = true;
                            updateItems = true;
                            break; // break out of loop, item was consumed
                        }
                    }

                    // move the items
                    this.items[ii].move(smallWorld);

                    if (this.items[ii].age > 5000 && this.clock % 100 === 0 && Utility.randf(0, 1) < 0.1) {
                        this.items[ii].cleanup = true; // replace this one, has been around too long
                        updateItems = true;
                    }
                }

                if (updateItems) {
                    var nt = [];
                    for (var ic = 0, nc = this.items.length; ic < nc; ic++) {
                        var itc = this.items[ic];
                        if (!itc.cleanup) {
                            nt.push(itc);
                        } else {
                            this.stage.removeChild(itc.shape);
                        }
                    }
                    this.items = nt; // swap
                }

                if (this.items.length < 20 && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
                    var entity = this.addEntity();
                    this.stage.addChild(entity.shape);
                }

                // This is where the agents learns based on the feedback of their actions on the environment
                this.agents[ai].learn();
            }

            this.draw();
        };

        return this;
    };

    WaterWorld.prototype = {


    };

    global.WaterWorld = WaterWorld;

}(this));
