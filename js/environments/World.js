(function (global) {
    "use strict";

    /**
     * Make a World
     * @param {Object} worldOpts
     * @param {Object} entityOpts
     * @returns {World}
     */
    var World = function (worldOpts, entityOpts) {
        this.canvas = worldOpts.canvas || document.getElementById("world");
        this.rewardGraph = worldOpts.rewardGraph || new RewardGraph(worldOpts);
        this.ctx = this.canvas.getContext("2d");
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Basics for the environment
        this.agents = worldOpts.agents || [];
        this.entities = worldOpts.entities || [];
        this.walls = worldOpts.walls || [];
        this.nodes = [];

        this.grid = worldOpts.grid || new Grid(worldOpts);
        this.path = this.grid.path;
        this.cellWidth = this.width / this.grid.xCount;
        this.cellHeight = this.height / this.grid.yCount;

        // World options
        this.entityOpts = entityOpts;
        this.cheats = worldOpts.cheats || false;
        this.movingEntities = entityOpts.movingEntities || false;
        this.collision = entityOpts.collision || false;
        this.interactive = entityOpts.interactive || false;
        this.tinting = entityOpts.tinting || true;
        this.useSprite = entityOpts.useSprite || false;
        this.numItems = typeof worldOpts.numItems === 'number' ? worldOpts.numItems : 20;

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

        var _this = this;

        requestAnimationFrame(animate);
        function animate() {
            if (!_this.pause) {
                _this.tick();
                if (typeof _this.plot !== 'undefined') {
                    _this.graphRewards();
                }
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
        var agentNames = [];
        for (let a = 0; a < this.agents.length; a++) {
            this.stage.addChild(this.agents[a].shape || this.agents[a].sprite);
            for (let ei = 0; ei < this.agents[a].eyes.length; ei++) {
                this.stage.addChild(this.agents[a].eyes[ei].shape);
            }
            this.grid.getGridLocation(this.agents[a]);
            agentNames.push({name:this.agents[a].name});
        }

        if (typeof this.rewardGraph.setLegend !== 'undefined') {
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
        this.grid.getGridLocation(entity);
    };

    /**
     *
     * @returns {World}
     */
    World.prototype.addWalls = function () {
        // Add the walls to the world
        for (let w = 0; w < this.walls.length; w++) {
            // If the cheats flag is on then show the wall #
            if (this.cheats) {
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
        this.nodes.splice(this.nodes.findIndex(Utility.getId, entity.id), 1);
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
        for (let ii = 0, ni = this.entities.length; ii < ni; ii++) {
            this.entities[ii].draw();
        }

        // draw agents
        for (var ai = 0, na = this.agents.length; ai < na; ai++) {
            // draw agents body
            this.agents[ai].draw();

            // draw agents sight
            for (let ei = 0, ne = this.agents[ai].eyes.length; ei < ne; ei++) {
                this.agents[ai].eyes[ei].draw(this.agents[ai].position, this.agents[ai].angle);
            }
        }

        // If the cheats flag is on then update population
        if (this.cheats) {
            for (let x = 0; x < this.grid.cells.length; x++) {
                for (let y = 0; y < this.grid.cells[x].length; y++) {
                    this.grid.cells[x][y].populationCounts.text = this.grid.cells[x][y].population.length;
                }
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

        // Reset the cell's population's
        for (let x = 0; x < this.grid.cells.length; x++) {
            for (let y = 0; y < this.grid.cells[x].length; y++) {
                this.grid.cells[x][y].population = [];
            }
        }

        // Loop through the entities of the world and make them do work son!
        for (let e = 0; e < this.entities.length; e++) {
            this.entities[e].tick(this);

            this.grid.getGridLocation(this.entities[e]);
            this.entities[e].gridLocation.population.push(this.entities[e].id);
        }

        // Loop through the agents of the world and make them do work!
        for (let a = 0; a < this.agents.length; a++) {
            this.agents[a].tick(this);

            this.grid.getGridLocation(this.agents[a]);

            if (this.clock % 100 === 0 && this.agents[a].pts.length !== 0) {
                if (typeof this.rewardGraph !== 'undefined') {
                    // Throw some points on a Graph
                    this.rewardGraph.addPoint(this.clock / 100, a, this.agents[a].pts);
                    this.rewardGraph.drawPoints();
                    // Clear them up since we've drawn them
                    this.agents[a].pts = [];
                }
            }

        }

        // Loop through and destroy old items
        for (let e = 0; e < this.entities.length; e++) {
            if (this.entities[e].age > 1000 || this.entities[e].cleanUp === true) {
                this.deleteEntity(this.entities[e]);
            }
        }

        // If we have less then the number of items allowed throw a random one in
        if (this.entities.length < this.numItems && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
            this.addEntity();
        }
    };

    World.prototype.updatePopulation = function () {
        this.tree.clear();
        this.nodes = [];
        // draw walls in environment
        for (let i = 0, n = this.walls.length; i < n; i++) {
            //this.walls[i].draw();
        }

        // draw items
        for (let ii = 0, ni = this.entities.length; ii < ni; ii++) {
            this.nodes.push(this.entities[ii]);
        }

        // draw agents
        for (var ai = 0, na = this.agents.length; ai < na; ai++) {
            this.nodes.push(this.agents[ai]);
        }

        this.tree.insert(this.nodes);
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
