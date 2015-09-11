(function (global) {
    "use strict";

    /**
     * Make a World
     * @param {Object} worldOpts
     * @param {Object} entityOpts
     * @returns {World}
     */
    var World = function (worldOpts, entityOpts) {
        this.canvas = worldOpts.canvas;
        this.ctx = this.canvas.getContext("2d");
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Basics for the environment
        this.agents = worldOpts.agents || [];
        this.entities = [];
        this.walls = worldOpts.walls || [];

        this.grid = worldOpts.grid || new Grid(this.canvas);
        this.cellWidth = this.width / this.grid.xCount;
        this.cellHeight = this.height / this.grid.yCount;
        this.path = this.grid.path;

        // World options
        this.cheats = worldOpts.cheats || false;
        this.entityOpts = entityOpts;
        this.movingEntities = entityOpts.movingEntities || false;
        this.collision = entityOpts.collision || false;
        this.interactive = entityOpts.interactive || false;
        this.tinting = entityOpts.tinting || true;
        this.useSprite = entityOpts.useSprite || false;
        this.numItems = typeof(worldOpts.numItems) === 'number' ? worldOpts.numItems : 20;

        this.clock = 0;
        this.pause = false;

        // PIXI gewdness
        this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {view: this.canvas}, true);
        this.renderer.backgroundColor = 0xFFFFFF;
        document.body.appendChild(this.renderer.view);
        this.stage = new PIXI.Container();

        // Populating the world
        for (let k = 0; k < this.numItems; k++) {
            this.addEntity();
        }

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

                    grid.lineStyle(.05, 0x000000);
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
            this.grid.getGridLocation(this.agents[a]);
        }

        return this;
    };

    /**
     *
     * @returns {World}
     */
    World.prototype.addEntities = function () {
        // Add entities
        for (let e = 0; e < this.entities.length; e++) {
            this.stage.addChild(this.entities[e].shape || this.entities[e].sprite);
            this.grid.getGridLocation(this.entities[e]);
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
        var  na = this.agents.length;
        for (var ai = 0; ai < na; ai++) {
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

        // Tick ALL OF teh items!
        var smallWorld = {
            grid: this.grid,
            width: this.width,
            height: this.height,
            walls: this.walls,
            entities: this.entities,
            movingEntities: this.movingEntities,
            cheats: this.cheats
        };

        // Reset the cell's population's
        for (let x = 0; x < this.grid.cells.length; x++) {
            for (let y = 0; y < this.grid.cells[x].length; y++) {
                this.grid.cells[x][y].population = [];
            }
        }

        // Loop through the entities of the world and make them do work son!
        for (let e = 0; e < this.entities.length; e++) {
            this.entities[e].tick(smallWorld);

            this.grid.getGridLocation(this.entities[e]);
            this.entities[e].gridLocation.population.push(this.entities[e].id);
        }

        // Loop through the agents of the world and make them do work!
        for (let a = 0; a < this.agents.length; a++) {
            this.agents[a].tick(smallWorld);

            this.grid.getGridLocation(this.agents[a]);

            // Destroy the eaten entities
            for (let j = 0, dl = this.agents[a].digested.length; j < dl; j++) {
                this.deleteEntity(this.agents[a].digested[j]);
            }

            if (this.clock % 100 === 0 && this.agents[a].pts.length !== 0) {
                // Throw some points on a Graph
                this.agents[a].rewardGraph.addPoint(this.clock / 100, a, this.agents[a].pts);
                this.agents[a].rewardGraph.drawPoints();
                // Clear them up since we've drawn them
                this.agents[a].pts = [];
            }
        }

        // Loop through and destroy old items
        for (let e = 0; e < this.entities.length; e++) {
            if (this.entities[e].age > 10000 || this.entities[e].cleanUp === true) {
                this.deleteEntity(this.entities[e]);
            }
        }

        // If we have less then the number of items allowed throw a random one in
        if (this.entities.length < this.numItems && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
            this.addEntity();
        }
    };

    global.World = World;

}(this));
