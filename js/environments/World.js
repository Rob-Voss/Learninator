(function (global) {
    "use strict";

    /**
     * Make a World
     * @param {Object} worldOpts
     * @param {Object} entityOpts
     * @returns {World}
     */
    var World = function (worldOpts, entityOpts) {
        this.canvas = worldOpts.canvas || document.getElementById('world');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.numItems = typeof worldOpts.numItems === 'number' ? worldOpts.numItems : 20;
        this.cheats = worldOpts.cheats || false;

        // Population/collision detection type
        this.useGrid = worldOpts.useGrid || false;
        this.useQuad = worldOpts.useQuad || false;

        // Basics for the environment
        this.agents = worldOpts.agents || [];
        this.entities = worldOpts.entities || [];
        this.walls = worldOpts.walls || [];
        this.nodes = [];

        // Entity options
        this.entityOpts = entityOpts;
        this.movingEntities = entityOpts.movingEntities || false;
        this.collision = entityOpts.collision || false;
        this.interactive = entityOpts.interactive || false;
        this.tinting = entityOpts.tinting || true;
        this.useSprite = entityOpts.useSprite || false;

        this.clock = 0;
        this.pause = false;

        // PIXI gewdness
        this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {view: this.canvas}, true);
        this.renderer.backgroundColor = 0xFFFFFF;
        document.body.appendChild(this.renderer.view);
        this.stage = new PIXI.Container();

        this.addWalls();
        this.addAgents();
        this.addEntities();

        if (this.useGrid === true) {
            this.grid = worldOpts.grid || new Grid(worldOpts);
            this.path = this.grid.path;
            this.cellWidth = this.width / this.grid.xCount;
            this.cellHeight = this.height / this.grid.yCount;

            // If the cheats flag is on, then show the population count for each cell
            if (this.cheats) {
                this.populationCounts = new PIXI.Container();
                for (let x = 0; x < this.grid.cells.length; x++) {
                    let xCell = this.grid.cells[x];
                    for (let y = 0; y < this.grid.cells[x].length; y++) {
                        let yCell = xCell[y],
                            fontOpts = {font: "20px Arial", fill: "#006400", align: "center"},
                            popText = new PIXI.Text(yCell.population.length, fontOpts),
                            coords = yCell.coords,
                            grid = new PIXI.Graphics();
                        popText.position.set(coords.bottom.left.x + (this.cellWidth / 2), coords.bottom.left.y - (this.cellHeight / 2));
                        yCell.populationCounts = popText;

                        grid.lineStyle(0.09, 0x000000);
                        grid.moveTo(coords.bottom.left.x, coords.bottom.left.y);
                        grid.lineTo(coords.bottom.right.x, coords.bottom.right.y);
                        grid.moveTo(coords.bottom.right.x, coords.bottom.right.y);
                        grid.lineTo(coords.top.right.x, coords.top.right.y);
                        grid.endFill();

                        this.populationCounts.addChild(popText);
                        this.populationCounts.addChild(grid);
                    }
                }
                this.stage.addChild(this.populationCounts);
            }
        } else if (this.useQuad === true) {
            this.nodes = [];
            // init the quadtree
            var args = {
                x: 0,
                y: 0,
                height: this.height,
                width: this.width,
                maxChildren: 5,
                maxDepth: 5
            };
            this.tree = new QuadTree(args);
            this.tree.insert(this.nodes);
        }

        if (this.useFlot === true) {
            // flot stuff
            this.nflot = 1000;
            this.smoothRewardHistory = [];
            this.smoothReward = [];
            this.flott = [];

            /**
             * Initialize the Flot class
             */
            this.initFlot = function () {
                for (let a = 0; a < this.agents.length; a++) {
                    this.smoothReward[a] = null;
                    this.smoothRewardHistory[a] = null;
                }
                this.container = document.getElementById('flotreward');
                this.series = [];
                for (let a = 0, ac = this.agents.length; a < ac; a++) {
                    this.flott[a] = 0;
                    this.smoothRewardHistory[a] = [];
                    this.series[a] = {
                        data: this.getFlotRewards(a),
                        lines: {fill: true},
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
                            left: 10,
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
            this.getFlotRewards = function (an) {
                var res = [];
                if (this.smoothRewardHistory[an] === null) {
                    this.smoothRewardHistory[an] = [];
                }

                for (var i = 0, hl = this.smoothRewardHistory[an].length; i < hl; i++) {
                    res.push([i, this.smoothRewardHistory[an][i]]);
                }

                return res;
            };

            this.initFlot();
        } else if (this.useGraph === true) {
            this.rewardGraph = worldOpts.rewardGraph || new RewardGraph(worldOpts);
        }

        var _this = this;

        requestAnimationFrame(animate);
        function animate() {
            if (!_this.pause) {
                _this.tick();
                _this.draw();
            }
            _this.renderer.render(_this.stage);
            requestAnimationFrame(animate);
        }

        return this;
    };

    /**
     *
     * @returns {World}
     */
    World.prototype.addAgents = function () {
        // Add the agents
        for (let a = 0; a < this.agents.length; a++) {
            this.stage.addChild(this.agents[a].shape || this.agents[a].sprite);
            for (let ei = 0; ei < this.agents[a].eyes.length; ei++) {
                this.stage.addChild(this.agents[a].eyes[ei].shape);
            }
        }

        if (this.useGraph === true) {
            let agentNames = [];
            for (let a = 0; a < this.agents.length; a++) {
                agentNames.push({name: this.agents[a].name});
            }
            this.rewardGraph.setLegend(agentNames);
        }

        return this;
    };

    /**
     *
     * @returns {World}
     */
    World.prototype.addEntities = function () {
        // Populating the world
        for (let k = 0; k < this.numItems; k++) {
            this.addEntity();
        }

        return this;
    };

    /**
     * Add an entity to the world
     */
    World.prototype.addEntity = function () {
        let type = Utility.randi(1, 3),
            x = Utility.randi(5, this.width - 10),
            y = Utility.randi(5, this.height - 10),
            z = 0,
            vx = Math.random() * 5 - 2.5,
            vy = Math.random() * 5 - 2.5,
            vz = 0,
            position = new Vec(x, y, z, vx, vy, vz);
        let entity = new Entity(type, position, this.grid, this.entityOpts);

        // Insert the population
        this.entities.push(entity);
        this.stage.addChild(entity.shape || entity.sprite);
    };

    /**
     *
     * @returns {World}
     */
    World.prototype.addWalls = function () {
        // Add the walls to the world
        for (let w = 0; w < this.walls.length; w++) {
            // If the cheats flag is on then show the wall #
            if (this.cheats.walls) {
                var wallText = new PIXI.Text(w, {font: "10px Arial", fill: "#640000", align: "center"});
                wallText.position.set(this.walls[w].v1.x + 10, this.walls[w].v1.y);
                this.walls[w].shape.addChild(wallText);
            }

            this.stage.addChild(this.walls[w].shape);
        }

        return this;
    };

    /**
     * Remove the entity from the world
     * @param {Object} entity
     */
    World.prototype.deleteEntity = function (entity) {
        this.entities.splice(this.entities.findIndex(Utility.getId, entity.id), 1);
        this.stage.removeChild(entity.shape || entity.sprite);
    };

    /**
     * Draws the world
     *
     */
    World.prototype.draw = function () {
        // draw walls in environment
        for (let i = 0, n = this.walls.length; i < n; i++) {
            this.walls[i].draw();
        }

        // draw items
        for (let e = 0, ni = this.entities.length; e < ni; e++) {
            this.entities[e].draw();
        }

        // draw agents
        for (let a = 0, na = this.agents.length; a < na; a++) {
            // draw agents body
            this.agents[a].draw();

            // draw agents sight
            for (let e = 0, ne = this.agents[a].eyes.length; e < ne; e++) {
                this.agents[a].eyes[e].draw(this.agents[a].position, this.agents[a].angle);
            }
        }
    };

    /**
     * Tick the environment
     */
    World.prototype.tick = function () {
        var seconds = (this.clock - this.lastTime) / 1000;
        this.lastTime = this.clock;
        this.clock++;

        // Loop through the entities of the world and make them do work son!
        for (let e = 0; e < this.entities.length; e++) {
            this.entities[e].tick(this);
        }

        // Loop through the agents of the world and make them do work!
        for (let a = 0; a < this.agents.length; a++) {
            this.agents[a].tick(this);
        }

        // Loop through and destroy old items
        for (let e = 0; e < this.entities.length; e++) {
            if (this.entities[e].age > 5000 || this.entities[e].cleanUp === true) {
                this.deleteEntity(this.entities[e]);
            }
        }

        // If we have less then the number of items allowed throw a random one in
        if (this.entities.length < this.numItems && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
            for (let i = 0; i < (this.numItems - this.entities.length); i++) {
                this.addEntity();
            }
        }

        this.updatePopulation();
        this.graphRewards();
    };

    /**
     * Update the populations
     */
    World.prototype.updatePopulation = function () {
        if (this.useQuad === true) {
            this.tree.clear();
            this.nodes = [];

            for (let ii = 0, ni = this.entities.length; ii < ni; ii++) {
                this.nodes.push(this.entities[ii]);
            }

            for (var ai = 0, na = this.agents.length; ai < na; ai++) {
                this.nodes.push(this.agents[ai]);
            }

            this.tree.insert(this.nodes);
        } else if (this.useGrid === true) {
            // Reset the cell's population's
            for (let x = 0; x < this.grid.cells.length; x++) {
                for (let y = 0; y < this.grid.cells[x].length; y++) {
                    this.grid.cells[x][y].population = [];
                }
            }

            // Loop through the entities of the world and make them do work son!
            for (let e = 0; e < this.entities.length; e++) {
                this.grid.getGridLocation(this.entities[e]);
                this.entities[e].gridLocation.population.push(this.entities[e].id);
            }

            // Loop through the agents of the world and make them do work!
            for (let a = 0; a < this.agents.length; a++) {
                this.grid.getGridLocation(this.agents[a]);
                this.agents[a].gridLocation.population.push(this.agents[a].id);
            }

            // If the cheats flag is on then update population
            if (this.cheats.population) {
                for (let x = 0; x < this.grid.cells.length; x++) {
                    for (let y = 0; y < this.grid.cells[x].length; y++) {
                        this.grid.cells[x][y].populationCounts.text = this.grid.cells[x][y].population.length;
                    }
                }
            }
        }
    };

    /**
     * Graph the agent rewards
     */
    World.prototype.graphRewards = function () {
        if (this.useFlot === true) {
            for (let a = 0, ac = this.agents.length; a < ac; a++) {
                var agent = this.agents[a],
                    rew = agent.lastReward;

                if (this.smoothReward[a] === null) {
                    this.smoothReward[a] = rew;
                }
                this.smoothReward[a] = this.smoothReward[a] * 0.999 + rew * 0.001;
                this.flott[a] += 1;
                if (this.flott[a] === 50) {
                    for (let i = 0, hl = this.smoothRewardHistory[a].length; i <= hl; i++) {
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
        } else if (this.useGraph === true) {
            for (var a = 0, al = this.agents.length; a < al; a++) {
                if (this.clock % 100 === 0 && this.agents[a].pts.length !== 0) {
                    // Throw some points on a Graph
                    this.rewardGraph.addPoint(this.clock / 100, a, this.agents[a].pts);
                    this.rewardGraph.drawPoints();
                    // Clear them up since we've drawn them
                    this.agents[a].pts = [];
                }
            }
        }
    };

    World.prototype.CD = (function () {
        var nChecks;

        return {
            check: function (item, world) {
                // reset check counter
                nChecks = 0;
                var n = world.nodes.length, m, region, i, k, entity;

                // clear the quadtree
                world.tree.clear();

                // fill the quadtree
                world.tree.insert(world.nodes);

                // iterate all elements
                for (i = 0; i < n; i++) {
                    entity = world.nodes[i];
                    // get all elements in the same region as orb
                    region = world.tree.retrieve(entity, function(item) {
                        world.CD.detectCollision(entity, item);
                        nChecks++;
                    });
                }
            },
            detectCollision: function (entity1, entity2) {
                if (entity1 === entity2) {
                    return;
                }
                if (entity1.position.x + entity1.width < entity2.position.x) {
                    return;
                }
                if (entity1.position.x > entity2.position.x + entity2.width) {
                    return;
                }
                if (entity1.position.y + entity1.height < entity2.position.y) {
                    return;
                }
                if (entity1.position.y > entity2.position.y + entity2.height) {
                    return;
                }
                entity1.cleanup = true;
            },
            getNChecks: function () {
                return nChecks;
            }
        };
    }());

    global.World = World;

}(this));
