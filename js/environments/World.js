var World = World || {};
var Agent = Agent || {};
var Item = Item || {};
var Utility = Utility || {};
var Vec = Vec || {};
var Map = Map || {};
var PIXI = PIXI || {};

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

			/**
			 * 1s = 1000ms (remember that setInterval and setTimeout run on milliseconds)
			 * 1000ms / 60(fps) = 16.7ms (we'll round this to 17)
			 */
			this.fps = 60;
			this.interval = 1000 / this.fps;
			this.clock = 0;
			this.numItems = options.numItems || 20;
			this.entities = [];
			this.types = ['Wall', 'Nom', 'Gnar'];

			this.pause = false;
			this.tinting = false;
			this.movingEntities = options.movingEntities || false;
			this.interactive = options.interactive || false;

			this.raycast = options.raycast || false;
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
					height = this.height - 10,
					x = Utility.randi(5, width),
					y = Utility.randi(5, height);
				this.addEntity(new Item(Utility.randi(1, 3), new Vec(x, y), 10, this.interactive));
			}

			for (var w=0, wl=this.walls.length; w<wl; w++) {
				this.stage.addChild(this.walls[w].shape);
			}

			for (var a=0, al=this.agents.length; a<al; a++) {
				this.stage.addChild(this.agents[a].sprite);
				for (var ei=0; ei<this.agents[a].eyes.length; ei++) {
					this.stage.addChild(this.agents[a].eyes[ei].shape);
				}
			}

			for (var e=0, el=this.entities.length; e<el; e++) {
				this.stage.addChild(this.entities[e].sprite);
			}

			requestAnimationFrame(animate);
			function animate() {
				requestAnimationFrame(animate);
				if (!_this.pause) {
					_this.tick();
					_this.renderer.render(_this.stage);
				}
			}

			var _this = this;

			return this;
		}

        /**
         * Add an item to the world canvas and set it to redraw
         * @param entity
         */
		addEntity (entity) {
			if (entity.type !== 0) {
				// Insert the population
                entity.gridLocation = this.grid.getGridLocation(entity.position);
				entity.gridLocation.population.splice(0, 0, entity.id);
				this.stage.addChild(entity.sprite);
				this.entities.push(entity);

                var locText = new PIXI.Text(entity.gridLocation.x + ':' + entity.gridLocation.y, {font: "10px Arial", fill: "#006400", align: "center"}),
                    posText = new PIXI.Text(entity.position.x + ':' + entity.position.y, {font: "10px Arial", fill: "#000000", align: "center"});
                posText.position.set(-20, 10);
                locText.position.set(0, 10);
                entity.sprite.addChild(posText);
                entity.sprite.addChild(locText);

            }
		}

		/**
		 * Add an item to the world canvas and set it to redraw
		 * @param entity
		 */
		deleteEntity (entity) {
			if (entity.type !== 0) {
				entity.gridLocation = this.grid.getGridLocation(entity.position);
				var index = entity.gridLocation.population.indexOf(entity.id);
				if (index > -1) {
					entity.gridLocation.population.splice(index, 1);
					this.stage.removeChild(entity.sprite);
					this.entities.splice(this.entities.findIndex(Utility.getId, entity.id), 1);
				}
			}
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
				width: this.grid.width * this.grid.cellWidth - 2,
				height: this.grid.height * this.grid.cellHeight - 2,
				movingEntities: this.movingEntities
			};

			for (var ai=0, ac=this.agents.length; ai<ac; ai++) {
				this.agents[ai].tick(smallWorld);
				this.agents[ai].gridLocation = this.grid.getGridLocation(this.agents[ai].position);

				// Destroy the eaten entities
				for (var j=0, dl=this.agents[ai].digested.length; j<dl; j++) {
					this.deleteEntity(this.agents[ai].digested[j]);
				}

				// If we have raycasting turned on then update the sub classes etc
				if (this.raycast) {
					this.map.update(seconds);
					this.agents[ai].player = new Player(this.agents[ai].gridLocation.x, this.agents[ai].gridLocation.y, this.agents[ai].angle);
					this.agents[ai].player.update(this.agents[ai].angle, this.map, seconds);
					this.agents[ai].camera.render(this.agents[ai].player, this.map);
				}
			}

			for (var e=0; e<this.entities.length; e++) {
				this.entities[e].tick(smallWorld);
				this.entities[e].gridLocation = this.grid.getGridLocation(this.entities[e].position);

				// Loop through and destroy old items
				if (this.entities[e].age > 1000 && this.clock % 100 === 0 && Utility.randf(0, 1) < 0.1) {
					this.deleteEntity(this.entities[e]);
				}
			}

			// If we have less then the number of items allowed throw a random one in
			if (this.entities.length < this.numItems && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
				var x = Utility.randi(5, this.width - 2),
					y = Utility.randi(5, this.height - 2);
				this.addEntity(new Item(Utility.randi(1, 3), new Vec(x, y), 10, this.interactive));
			}

			for (var i=0, al=this.agents.length; i<al; i++) {
				if (this.clock % 100 === 0 && this.agents[i].pts.length !== 0) {
					// Throw some points on a Graph
					this.rewardGraph.addPoint(this.clock / 100, i, this.agents[i].pts);
					this.rewardGraph.drawPoints();
					// Clear them up since we've drawn them
					this.agents[i].pts = [];
				}
			}

		}
	}

	global.World = World;

}(this));
