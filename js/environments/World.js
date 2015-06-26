(function (global) {
    "use strict";

    /**
     * Make a World
     * @param {Object} options
     * @returns {World}
     */
    class World {
		constructor (options) {
			this.canvas = options.canvas;
			this.ctx = this.canvas.getContext("2d");
			this.width = this.canvas.width;
			this.height = this.canvas.height;

			this.grid = options.grid;
			this.cellWidth = this.width / this.grid.width;
			this.cellHeight = this.height / this.grid.height;
			this.path = this.grid.path;
			this.rewardGraph = options.rewardGraph;
			this.walls = options.walls || [];
			this.agents = options.agents || [];

            // World options
            this.numItems = options.numItems || 20;
            this.movingEntities = options.movingEntities || false;
            this.interactive = options.interactive || false;
            this.raycast = options.raycast || false;

			this.fps = 60;
			this.interval = 1000 / this.fps;
			this.clock = 0;
			this.entities = [];
			this.types = ['Wall', 'Nom', 'Gnar'];

			this.pause = false;
			this.tinting = false;

			if (this.raycast) {
				this.map = new Map(this.grid.width);
				this.map.populate(this.grid);
			}

			// PIXI gewdness
			this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {view:this.canvas}, true);
			this.renderer.backgroundColor = 0xFFFFFF;
			document.body.appendChild(this.renderer.view);
			this.stage = new PIXI.Container();

			// Populating and tracking
			for (var k=0; k<this.numItems; k++) {
				var width = this.width - 10,
					height = this.height - 10;
				this.addEntity(new Item(Utility.randi(1, 3), new Vec(Utility.randi(5, width), Utility.randi(5, height)), 10, this.interactive));
			}

			for (var w=0; w<this.walls.length; w++) {
                var wall = this.walls[w],
                    wallText = new PIXI.Text(w, fontOpts = {font: "10px Arial", fill: "#640000", align: "center"}),
                    wx = wall.v1.x === 599 ? 590 : wall.v1.x+10,
                    wy = wall.v1.y === 599 ? 580 : wall.v1.y;

                wallText.position.set(wx, wy);
                wall.shape.addChild(wallText);
				this.stage.addChild(wall.shape);
			}

			for (var a=0; a<this.agents.length; a++) {
				this.stage.addChild(this.agents[a].sprite);
				for (var ei=0; ei<this.agents[a].eyes.length; ei++) {
					this.stage.addChild(this.agents[a].eyes[ei].shape);
				}
                this.agents[a].gridLocation = this.grid.getGridLocation(this.agents[a].position);
			}

			for (var e=0; e<this.entities.length; e++) {
				this.stage.addChild(this.entities[e].sprite);
                this.entities[e].gridLocation = this.grid.getGridLocation(this.entities[e].position);
			}

            this.populationCounts = new PIXI.Container();
            for (var x=0; x<this.grid.cells.length;x++) {
                var xCell = this.grid.cells[x];
                for(var y=0; y<this.grid.cells[x].length; y++) {
                    var yCell = xCell[y],
                        fontOpts = {font: "20px Arial", fill: "#006400", align: "center"},
                        populationText = new PIXI.Text(yCell.population.length, fontOpts);
                    populationText.position.set(yCell.coords.bottom.left.x +100, yCell.coords.bottom.left.y - 100);
                    yCell.populationCounts = populationText;
                    this.populationCounts.addChild(populationText);
                }
            }
            this.stage.addChild(this.populationCounts);

			requestAnimationFrame(animate);
			function animate() {
				if (!_this.pause) {
					_this.tick();
					_this.renderer.render(_this.stage);
				}
                requestAnimationFrame(animate);
			}

			var _this = this;

			return this;
		}

		addEntity (entity) {
            // Insert the population
            this.entities.push(entity);
            this.stage.addChild(entity.sprite);
            var fontOpts = {font: "10px Arial", fill: "#006400", align: "center"},
                locText = new PIXI.Text(entity.gridLocation.x + ':' + entity.gridLocation.y, fontOpts),
                posText = new PIXI.Text(entity.position.x + ':' + entity.position.y, fontOpts);
            posText.position.set(-20, 10);
            locText.position.set(0, 10);
            entity.sprite.addChild(posText);
            entity.sprite.addChild(locText);
		}

		deleteEntity (entity) {
            this.entities.splice(this.entities.findIndex(Utility.getId, entity.id), 1);
            this.stage.removeChild(entity.sprite);
		}

		/**
		 * Tick the environment
		 */
		tick () {
			var seconds = (this.clock - this.lastTime) / 1000;
			this.lastTime = this.clock;
			this.clock++;

            // Tick ALL OF teh items!
            var smallWorld = {
                grid:this.grid,
                walls: this.walls,
                entities: this.entities,
                width: this.grid.width * this.grid.cellWidth - 1,
                height: this.grid.height * this.grid.cellHeight - 1,
                movingEntities: this.movingEntities
            };

            for (var cx=0; cx<this.grid.cells.length;cx++) {
                for(var cy=0; cy<this.grid.cells[cx].length; cy++) {
                    this.grid.cells[cx][cy].population = [];
                }
            }

            for (var e=0; e<this.entities.length; e++) {
                this.entities[e].tick(smallWorld);
                this.entities[e].gridLocation = this.grid.getGridLocation(this.entities[e].position);
                this.entities[e].gridLocation.population.push(this.entities[e].id);
            }

            for (var a=0; a<this.agents.length; a++) {
				this.agents[a].tick(smallWorld);
				this.agents[a].gridLocation = this.grid.getGridLocation(this.agents[a].position);

				// If we have raycasting turned on then update the sub classes etc
				if (this.raycast) {
					this.map.update(seconds);
					this.agents[a].player = new Player(this.agents[a].gridLocation.x, this.agents[a].gridLocation.y, this.agents[a].angle);
					this.agents[a].player.update(this.agents[a].angle, this.map, seconds);
					this.agents[a].camera.render(this.agents[a].player, this.map);
				}

                // Destroy the eaten entities
                for (var j=0, dl=this.agents[a].digested.length; j<dl; j++) {
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

            for (var en=0; en<this.entities.length; en++) {
                // Loop through and destroy old items
                if (this.entities[en].age > 10000 || this.entities[en].cleanUp === true) {
                    this.deleteEntity(this.entities[en]);
                }
            }

			// If we have less then the number of items allowed throw a random one in
			if (this.entities.length < this.numItems && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
				var width = this.width - 10,
                    height = this.height - 10;
				this.addEntity(new Item(Utility.randi(1, 3), new Vec(Utility.randi(5, width), Utility.randi(5, height)), 10, this.interactive));
			}

            for (var x=0; x<this.grid.cells.length;x++) {
                for(var y=0; y<this.grid.cells[x].length; y++) {
                    this.grid.cells[x][y].populationCounts.text = this.grid.cells[x][y].population.length;
                }
            }
		}
	}

	global.World = World;

}(this));
