(function (global) {
    "use strict";

    /**
     * Make a World
     * @param {Object} opts
     * @param {Object} entityOpts
     * @returns {World}
     */
    var World = function (opts, entityOpts) {
        var _this = this;
        this.canvas = Utility.getOpt(opts, 'canvas', document.getElementById('world'));
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Population/collision detection type
        this.numItems = Utility.getOpt(opts, 'numItems', 20);
        this.cheats = Utility.getOpt(opts, 'cheats', false);

        // Basics for the environment
        this.agents = Utility.getOpt(opts, 'agents', []);
        this.entities = Utility.getOpt(opts, 'entities', []);
        this.walls = Utility.getOpt(opts, 'walls', []);

        // Entity options
        this.entityOpts = entityOpts;

        this.clock = 0;
        this.pause = false;

        // PIXI gewdness
        this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {view: this.canvas}, true);
        this.renderer.backgroundColor = 0xFFFFFF;
        document.body.appendChild(this.renderer.view);
        this.stage = new PIXI.Container();

        // Collision detection set ups, grid based or quad tree
        if (this.CD.type === 'grid') {
            this.grid = Utility.getOpt(opts, 'grid', new Grid(opts));
            this.path = this.grid.path;
            this.cellWidth = this.width / this.grid.xCount;
            this.cellHeight = this.height / this.grid.yCount;

            // Set up the CD function
            this.CD.check = function (target) {
                // Loop through all the entities in the current cell and check distances
                var cell = _this.grid.getCellAt(target.gridLocation.x, target.gridLocation.y);
                for (var p = 0; p < cell.population.length; p++) {
                    var entities = _this.entities,
                        entity = entities.find(Utility.getId, cell.population[p]);
                    if (entity) {
                        var dist = target.position.distanceTo(entity.position);
                        if (dist < entity.radius + target.radius) {
                            target.collisions.push(entity);
                            entity.cleanUp = true;
                        }
                    }
                }
            };

            this.CD.drawRegions = function () {
                // If the cheats flag is on then update population
                if (_this.cheats.population) {
                    for (var px = 0; px < _this.grid.cells.length; px++) {
                        for (var py = 0; py < _this.grid.cells[px].length; py++) {
                            _this.grid.cells[px][py].populationCounts.text = _this.grid.cells[px][py].population.length;
                        }
                    }
                }
                // Draw the grid
                if (_this.cheats.grid) {
                    for (var x = 0; x < _this.grid.cells.length; x++) {
                        var xCell = _this.grid.cells[x];
                        for (var y = 0; y < _this.grid.cells[x].length; y++) {
                            // Draw population counts text
                            var yCell = xCell[y],
                                coords = yCell.coords;

                            // Draw the grid
                            var grid = new PIXI.Graphics();
                            grid.lineStyle(0.09, 0x000000);
                            grid.moveTo(coords.bottom.left.x, coords.bottom.left.y);
                            grid.lineTo(coords.bottom.right.x, coords.bottom.right.y);
                            grid.moveTo(coords.bottom.right.x, coords.bottom.right.y);
                            grid.lineTo(coords.top.right.x, coords.top.right.y);
                            grid.endFill();

                            _this.gridOverlay.addChild(grid);
                        }
                    }
                }
            };

            /**
             *
             */
            this.CD.updatePopulation = function () {
                this.stage.removeChild(this.gridOverlay);
                this.gridOverlay = new PIXI.Container();

                // Reset the cell's population's
                for (var x = 0; x < this.grid.cells.length; x++) {
                    for (var y = 0; y < this.grid.cells[x].length; y++) {
                        this.grid.cells[x][y].population = [];
                    }
                }

                // Loop through the entities of the world and make them do work son!
                for (var e = 0; e < this.entities.length; e++) {
                    this.grid.getGridLocation(this.entities[e]);
                    this.entities[e].gridLocation.population.push(this.entities[e].id);
                }

                // Loop through the agents of the world and make them do work!
                for (var a = 0; a < this.agents.length; a++) {
                    this.grid.getGridLocation(this.agents[a]);
                    this.agents[a].gridLocation.population.push(this.agents[a].id);
                }

                this.CD.drawRegions();
                this.stage.addChild(this.gridOverlay);
            };

            /**
             * Update the populations
             */
            this.CD.updatePopulation = function () {
                // Show the population counts for the grid
                if (this.cheats.population) {
                    this.stage.removeChild(this.populationCounts);
                    this.populationCounts = new PIXI.Container();

                    // If we are using grid based collision/population tracking set it up
                    if (this.CD.type === 'grid') {
                        for (var x = 0; x < this.grid.cells.length; x++) {
                            var xCell = this.grid.cells[x];
                            for (var y = 0; y < this.grid.cells[x].length; y++) {
                                // Draw population counts text
                                var yCell = xCell[y],
                                    fontOpts = {font: "20px Arial", fill: "#006400", align: "center"},
                                    coords = yCell.coords,
                                    popText = new PIXI.Text(yCell.population.length, fontOpts);
                                popText.position.set(coords.bottom.left.x + (this.cellWidth / 2), coords.bottom.left.y - (this.cellHeight / 2));
                                this.populationCounts.addChild(popText);
                            }
                        }
                    } else if (this.CD.type === 'quad') {

                    }

                    this.stage.addChild(this.populationCounts);
                }
            };
        } else if (this.CD.type === 'quad') {
            this.nodes = [];
            // init the quadtree
            var args = {
                x: 0,
                y: 0,
                height: this.height,
                width: this.width,
                maxChildren: this.CD.maxChildren,
                maxDepth: this.CD.maxDepth
            };
            this.tree = new QuadTree(args);
            this.tree.insert(this.nodes);

            /**
             *
             * @param target
             */
            this.CD.check = function (target) {
                var n = _this.nodes.length, region, entity;
                target.collisions = [];

                // clear the quadtree
                _this.tree.clear();

                // fill the quadtree
                _this.tree.insert(_this.nodes);

                // iterate all elements
                for (var i = 0; i < n; i++) {
                    entity = _this.nodes[i];
                    // get all elements in the same region as orb
                    region = _this.tree.retrieve(entity, function (target) {
                        if (entity === target) {
                            return;
                        }
                        if (entity.position.x + entity.width < target.position.x) {
                            return;
                        }
                        if (entity.position.x > target.position.x + target.width) {
                            return;
                        }
                        if (entity.position.y + entity.height < target.position.y) {
                            return;
                        }
                        if (entity.position.y > target.position.y + target.height) {
                            return;
                        }

                        // Agent to Entity
                        if (target.type === 3 && (entity.type === 2 || entity.type === 1)) {
                            entity.cleanUp = true;
                            target.collisions.push(entity);
                            //console.log('Agent to Entity');
                        }
                        // Entity to Entity
                        if ((target.type === 2 || target.type === 1) && (entity.type === 2 || entity.type === 1)) {
                            // maybe move one of them?
                            target.collisions.push(entity);
                            //console.log('Entity to Entity');
                        }
                        // Entity to Wall
                        if ((target.type === 3 /**|| target.type === 2 || target.type === 1*/) && entity.type === 0) {
                            // maybe move one of them?
                            target.collisions.push(entity);
                            //console.log('Agent to Wall');
                        }
                    });
                }
            };

            /**
             *
             * @param aNode
             */
            this.CD.drawRegions = function (aNode) {
                if (_this.cheats.quad) {
                    var nodes = aNode.getNodes(), i;
                    if (nodes) {
                        for (i = 0; i < nodes.length; i++) {
                            this.drawRegions(nodes[i]);
                        }
                    }
                    var rect = new PIXI.Graphics();
                    rect.clear();
                    rect.lineStyle(0.2, 0x000000);
                    rect.drawRect(aNode.x, aNode.y, aNode.width, aNode.height);
                    rect.endFill();

                    _this.quadContainer.addChild(rect);
                }
            };

            /**
             *
             */
            this.CD.updatePopulation = function () {
                _this.stage.removeChild(_this.quadContainer);
                _this.quadContainer = new PIXI.Container();

                _this.tree.clear();
                _this.nodes = [];

                for (let wi = 0, ni = _this.walls.length; wi < ni; wi++) {
                    _this.nodes.push(_this.walls[wi]);
                }

                for (let ii = 0, ni = _this.entities.length; ii < ni; ii++) {
                    _this.nodes.push(_this.entities[ii]);
                }

                for (var ai = 0, na = _this.agents.length; ai < na; ai++) {
                    _this.nodes.push(_this.agents[ai]);
                }

                _this.tree.insert(_this.nodes);

                _this.CD.drawRegions(_this.tree.root);
                _this.stage.addChild(_this.quadContainer);
            };
        } else if (this.CD.type === 'brute') {
            /**
             *
             * @param target
             */
            this.CD.check = function (target) {
                // Loop through all the entities in the world and check distances
                for (var j = 0; j < _this.entities.length; j++) {
                    var entity = _this.entities[j],
                        dist = target.position.distFrom(entity.position);
                    if (dist < entity.radius + target.radius) {
                        var result = Utility.collisionCheck(target.position, entity.position, _this.walls, _this.entities, target.radius);
                        if (!result) {
                            target.collisions.push(entity);
                            entity.cleanUp = true;
                        }
                    }
                }
            };

            /**
             * Draw the regions of the CD
             * @param {Object} aNode
             */
            this.CD.drawRegions = function () {};

            /**
             *
             */
            this.CD.updatePopulation = function () {};
        }

        this.addWalls();
        this.addAgents();
        this.addEntities();

        if (this.useFlot === true) {
            // flot stuff
            this.nflot = 1000;
            this.smoothRewardHistory = [];
            this.smoothReward = [];
            this.flott = [];

            this.initFlot();
        } else if (this.useGraph === true) {
            this.rewardGraph = Utility.getOpt(opts, 'rewardGraph', new RewardGraph(opts));
        }

        function animate() {
            if (!_this.pause) {
                _this.draw();
                _this.tick();
            }
            _this.renderer.render(_this.stage);
            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);

        return this;
    };

    /**
     *
     * @returns {World}
     */
    World.prototype.addAgents = function () {
        // Add the agents
        for (var a = 0; a < this.agents.length; a++) {
            var agentContainer = new PIXI.Container();
            for (var ei = 0; ei < this.agents[a].eyes.length; ei++) {
                agentContainer.addChild(this.agents[a].eyes[ei].shape);
            }
            agentContainer.addChild(this.agents[a].shape || this.agents[a].sprite);
            this.stage.addChild(agentContainer);
        }

        if (this.useGraph === true) {
            var agentNames = [];
            for (var an = 0; an < this.agents.length; an++) {
                agentNames.push({name: this.agents[an].name});
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
        for (var k = 0; k < this.numItems; k++) {
            this.addEntity();
        }

        return this;
    };

    /**
     * Add an entity to the world
     */
    World.prototype.addEntity = function () {
        var type = Utility.randi(1, 3),
            x = Utility.randi(2, this.width - 2),
            y = Utility.randi(2, this.height - 2),
            vx = Utility.randf(-1, 1),
            vy = Utility.randf(-1, 1),
            position = new Vec(x, y, 0, vx, vy, 0),
            entity = new Entity(type, position, this.entityOpts);
        // Insert the population
        this.entities.push(entity);
        this.stage.addChild(entity.shape || entity.sprite);
    };

    /**
     *
     * @returns {World}
     */
    World.prototype.addWalls = function () {
        this.wallContainer = new PIXI.Container();
        // Add the walls to the world
        for (var w = 0; w < this.walls.length; w++) {
            this.wallContainer.addChild(this.walls[w].shape);
            if (this.cheats.walls === true) {
                var wallText = new PIXI.Text(w, {font: "10px Arial", fill: "#640000", align: "center"});
                wallText.position.set(this.walls[w].v1.x + 10, this.walls[w].v1.y);
                this.wallContainer.addChild(wallText);
            }
        }
        this.stage.addChild(this.wallContainer);

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
        for (var i = 0, n = this.walls.length; i < n; i++) {
            this.walls[i].draw();
        }

        // draw items
        for (var e = 0, ni = this.entities.length; e < ni; e++) {
            this.entities[e].draw();
        }

        // draw agents
        for (var a = 0, na = this.agents.length; a < na; a++) {
            // draw agents body
            this.agents[a].draw();
            // draw agents sight
            for (var ae = 0, ne = this.agents[a].eyes.length; ae < ne; ae++) {
                this.agents[a].eyes[ae].draw(this.agents[a].position, this.agents[a].angle);
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
        this.CD.updatePopulation();

        // Loop through the entities of the world and make them do work son!
        for (var i = 0; i < this.entities.length; i++) {
            this.entities[i].tick(this);
        }

        // Loop through the agents of the world and make them do work!
        for (var a = 0; a < this.agents.length; a++) {
            this.agents[a].tick(this);
        }

        // Loop through and destroy old items
        for (var e = 0; e < this.entities.length; e++) {
            if (this.entities[e].age > 5000 || this.entities[e].cleanUp === true) {
                this.deleteEntity(this.entities[e]);
            }
        }

        // If we have less then the number of items allowed throw a random one in
        if (this.entities.length < this.numItems && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
            for (var ni = 0; ni < (this.numItems - this.entities.length); ni++) {
                this.addEntity();
            }
        }

        this.CD.updatePopulation();
        this.graphRewards();
    };

    /**
     * Graph the agent rewards
     */
    World.prototype.graphRewards = function () {
        // If we are using flot based rewards
        if (this.useFlot === true) {
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
        } else if (this.useGraph === true) {
            // Or maybe we are using simple Graph based rewards
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

    /**
     * Initialize the Flot class
     */
    World.prototype.initFlot = function () {
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
                labelMargin: 5,
                backgroundColor: {
                    colors: ["#FFF", "#e4f4f4"]
                },
                margin: {
                    top: 5,
                    bottom: 5,
                    left: 5
                }
            },
            xaxis: {
                min: 0,
                max: this.nflot
            },
            yaxis: {
                min: -0.1,
                max: 0.1
            }
        });
    };

    /**
     * zip rewards into flot data
     * @param {Number} an
     * @returns {Array}
     */
    World.prototype.getFlotRewards = function (an) {
        var res = [];
        if (this.smoothRewardHistory[an] === null) {
            this.smoothRewardHistory[an] = [];
        }

        for (var i = 0, hl = this.smoothRewardHistory[an].length; i < hl; i++) {
            res.push([i, this.smoothRewardHistory[an][i]]);
        }

        return res;
    };

    global.World = World;

}(this));
