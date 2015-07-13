(function (global) {
    "use strict";

    class World {
        /**
         * Make a World
         * @param {Object} options
         * @returns {World}
         */
        constructor(options) {
            this.canvas = options.canvas;
            this.ctx = this.canvas.getContext("2d");
            this.width = this.canvas.width;
            this.height = this.canvas.height;

            // Basics for the environment
            this.walls = options.walls || [];
            this.agents = options.agents || [];
            this.grid = options.grid || new Grid(this.canvas);
            this.cellWidth = this.width / this.grid.xCount;
            this.cellHeight = this.height / this.grid.yCount;
            this.path = this.grid.path;

            // World options
            this.cheats = options.cheats || false;
            this.numItems = options.numItems || 20;
            this.movingEntities = options.movingEntities || false;
            this.interactive = options.interactive || false;
            this.tinting = options.tinting || true;

            // Raycasting POV stuffz
            this.raycast = options.raycast || false;
            if (this.raycast) {
                this.map = new Map(this.grid.width);
                this.map.populate(this.grid);
            }

            this.fps = 60;
            this.interval = 1000 / this.fps;
            this.clock = 0;
            this.entities = [];
            this.types = ['Wall', 'Nom', 'Gnar'];

            this.pause = false;

            // PIXI gewdness
            this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {view: this.canvas}, true);
            this.renderer.backgroundColor = 0xFFFFFF;
            document.body.appendChild(this.renderer.view);
            this.stage = new PIXI.Container();

            // Populating the world
            for (var k = 0; k < this.numItems; k++) {
                this.addEntity();
            }

            // Add the walls to the world
            for (var w = 0; w < this.walls.length; w++) {
                var wall = this.walls[w];
                // If the cheats flag is on then show the wall #
                if (this.cheats) {
                    var wallText = new PIXI.Text(w, fontOpts = {font: "10px Arial", fill: "#640000", align: "center"}),
                        wx = wall.v1.x === 599 ? 590 : wall.v1.x + 10,
                        wy = wall.v1.y === 599 ? 580 : wall.v1.y;

                    wallText.position.set(wx, wy);
                    wall.shape.addChild(wallText);
                }
                this.stage.addChild(wall.shape);
            }

            // Add the agents
            var eyes = new PIXI.Container();
            for (var a = 0; a < this.agents.length; a++) {
                for (var ei = 0; ei < this.agents[a].eyes.length; ei++) {
                    eyes.addChild(this.agents[a].eyes[ei].shape);
                }
                this.agents[a].sprite.addChild(eyes);
                this.stage.addChild(this.agents[a].sprite);
                this.grid.getGridLocation(this.agents[a]);
            }

            // Add entities
            for (var e = 0; e < this.entities.length; e++) {
                this.stage.addChild(this.entities[e].sprite);
                this.grid.getGridLocation(this.entities[e]);
            }

            // If the cheats flag is on, then show the population count for each cell
            if (this.cheats) {
                this.populationCounts = new PIXI.Container();
                for (var x = 0; x < this.grid.cells.length; x++) {
                    var xCell = this.grid.cells[x];
                    for (var y = 0; y < this.grid.cells[x].length; y++) {
                        var yCell = xCell[y],
                            fontOpts = {font: "20px Arial", fill: "#006400", align: "center"},
                            populationText = new PIXI.Text(yCell.population.length, fontOpts);
                        populationText.position.set(yCell.coords.bottom.left.x + 100, yCell.coords.bottom.left.y - 100);
                        yCell.populationCounts = populationText;
                        this.populationCounts.addChild(populationText);
                    }
                }
                this.stage.addChild(this.populationCounts);
            }

            requestAnimationFrame(animate);
            function animate() {
                if (!_this.pause) {
                    requestAnimationFrame(animate);
                    _this.tick();
                    _this.renderer.render(_this.stage);
                }
            }

            var _this = this;

            return this;
        }

        /**
         * Add an entity to the world
         */
        addEntity() {
            var type = Utility.randi(1, 3),
                x = Utility.randi(5, this.width - 10),
                y = Utility.randi(5, this.height - 10),
                vx = Math.random() * 5 - 2.5,
                vy = Math.random() * 5 - 2.5,
                position = new Vec(x, y, vx, vy),
                entityOpts = {interactive:this.interactive, collision:this.collision},
                entity = new Item(type, position, this.grid, entityOpts);

            // Insert the population
            this.entities.push(entity);
            this.stage.addChild(entity.sprite);

            // If cheats are on then show the entities grid location and x,y coords
            if (this.cheats) {
                var fontOpts = {font: "10px Arial", fill: "#006400", align: "center"},
                    locText = new PIXI.Text(entity.gridLocation.x + ':' + entity.gridLocation.y, fontOpts),
                    posText = new PIXI.Text(entity.position.x + ':' + entity.position.y, fontOpts);
                posText.position.set(-20, 10);
                locText.position.set(0, 10);
                entity.sprite.addChild(posText);
                entity.sprite.addChild(locText);
            }
        }

        /**
         * Remove the entity from the world
         * @param {Object} entity
         */
        deleteEntity(entity) {
            this.entities.splice(this.entities.findIndex(Utility.getId, entity.id), 1);
            this.stage.removeChild(entity.sprite);
        }

        /**
         * Tick the environment
         */
        tick() {
            var seconds = (this.clock - this.lastTime) / 1000;
            this.lastTime = this.clock;
            this.clock++;

            // Tick ALL OF teh items!
            var smallWorld = {
                grid: this.grid,
                walls: this.walls,
                entities: this.entities,
                width: this.width - 1,
                height: this.height - 1,
                movingEntities: this.movingEntities,
                cheats: this.cheats
            };

            // Reset the cell's population's
            for (var cx = 0; cx < this.grid.cells.length; cx++) {
                for (var cy = 0; cy < this.grid.cells[cx].length; cy++) {
                    this.grid.cells[cx][cy].population = [];
                }
            }

            // Loop through the entities of the world and make them do work son!
            for (var e = 0; e < this.entities.length; e++) {
                this.entities[e].tick(smallWorld);
                this.grid.getGridLocation(this.entities[e]);
                this.entities[e].gridLocation.population.push(this.entities[e].id);
            }

            // Loop through the agents of the world and make them do work son!
            for (var a = 0; a < this.agents.length; a++) {
                this.agents[a].tick(smallWorld);
                this.grid.getGridLocation(this.agents[a]);

                // If we have raycasting turned on then update the sub classes etc
                if (this.raycast && this.map !== undefined) {
                    this.map.update(seconds);
                    this.agents[a].player = new Player(this.agents[a].gridLocation.x, this.agents[a].gridLocation.y, this.agents[a].angle);
                    this.agents[a].player.update(this.agents[a].angle, this.map, seconds);
                    this.agents[a].camera.render(this.agents[a].player, this.map);
                }

                // Destroy the eaten entities
                for (var j = 0, dl = this.agents[a].digested.length; j < dl; j++) {
                    this.deleteEntity(this.agents[a].digested[j]);
                }

                if (this.clock % 100 === 0 && this.agents[a].pts.length !== 0) {
                    // Throw some points on a Graph
                    this.rewardGraph.addPoint(this.clock / 100, a, this.agents[a].pts);
                    this.rewardGraph.drawPoints();
                    // Clear them up since we've drawn them
                    this.agents[a].pts = [];
                }
            }

            // Loop through and destroy old items
            for (var en = 0; en < this.entities.length; en++) {
                if (this.entities[en].age > 10000 || this.entities[en].cleanUp === true) {
                    this.deleteEntity(this.entities[en]);
                }
            }

            // If we have less then the number of items allowed throw a random one in
            if (this.entities.length < this.numItems && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
                this.addEntity();
            }

            // If the cheats flag is on then update population
            if (this.cheats) {
                for (var x = 0; x < this.grid.cells.length; x++) {
                    for (var y = 0; y < this.grid.cells[x].length; y++) {
                        this.grid.cells[x][y].populationCounts.text = this.grid.cells[x][y].population.length;
                    }
                }
            }
        }
    }

    global.World = World;

}(this));
