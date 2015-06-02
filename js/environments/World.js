var World = World || {};
var Agent = Agent || {};
var Interactions = Interactions || {};
var Utility = Utility || {};
var PIXI = PIXI || {};

(function (global) {
	"use strict";

	/**
	 * Make a World
	 * @param {Object} options
	 * @returns {World}
	 */
	var World = function (options) {
		this.canvas = options.canvas;
		this.graph = options.graph;
		this.ctx = this.canvas.getContext("2d");
		this.width = this.canvas.width;
		this.height = this.canvas.height;

		this.grid = this.graph.cells;
		this.cellW = this.canvas.width / this.graph.width;
		this.cellH = this.canvas.height / this.graph.height;
		this.path = this.graph.path;

		this.clock = 0;

		/**
		* 1s = 1000ms (remember that setInterval and setTimeout run on milliseconds)
		* 1000ms / 60(fps) = 16.7ms (we'll round this to 17)
		*/
		this.fps = 60;
		this.interval = 1000 / this.fps;
		this.numItems = 30;
		this.entities = [];
		this.types = ['Wall', 'Nom', 'Gnar'];

		// create a renderer instance.
		this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {view:this.canvas}, true);
		this.renderer.backgroundColor = 0xFFFFFF;
		// add the renderer view element to the DOM
		document.body.appendChild(this.renderer.view);
		// create an new instance of a pixi stage
		this.stage = new PIXI.Container();

		// When set to true, the canvas will redraw everything
		this.pause = false;

		var _this = this;

		this.walls = options.walls || [];
		for (var w = 0, wl = this.walls.length; w < wl; w++) {
			this.stage.addChild(this.walls[w].shape);
		}

		this.agents = options.agents || [];
		for (var a = 0, al = this.agents.length; a < al; a++) {
			this.stage.addChild(this.agents[a].sprite);
			for (var ei = 0; ei < this.agents[a].eyes.length; ei++) {
				this.stage.addChild(this.agents[a].eyes[ei].shape);
			}
		}

		this.populate();
		for (var e = 0, el = this.entities.length; e < el; e++) {
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
	};

	/**
	 * World
	 * @type World
	 */
	World.prototype = {
		/**
		 * Add an item to the world canvas and set it to redraw
		 * @param {Item||Agent} entity
		 * @returns {undefined}
		 */
		addEntity: function (entity) {
			if (entity.type !== 0) {
				Utility.getGridLocation(entity, this.grid, this.cellW, this.cellH);
				this.stage.addChild(entity.sprite);
				this.grid[entity.gridLocation.x][entity.gridLocation.y].population.push(entity.id);
				this.entities.push(entity);
			}
		},
		/**
		 * Randomly create an entity at the Vec
		 * @param {Vec} v
		 * @returns {undefined}
		 */
		addRandEntity: function(v) {
			this.addEntity(new Item(Utility.randi(1, 3), v, 20, 20, 10));
		},
		/**
		 * Add an item to the world canvas and set it to redraw
		 * @param {Item||Agent} entity
		 * @returns {undefined}
		 */
		deleteEntity: function (entity) {
			if (entity.type !== 0) {
				var index = this.grid[entity.gridLocation.x][entity.gridLocation.y].population.indexOf(entity.id);
				if (index > -1) {
					Utility.getGridLocation(entity, this.grid, this.cellW, this.cellH);
					this.stage.removeChild(entity.sprite);
					this.grid[entity.gridLocation.x][entity.gridLocation.y].population.splice(index, 1);
					this.entities.splice(this.entities.findIndex(Utility.getId, entity.id), 1);
				}
			}
		},
		/**
		 * Draw the solution
		 * @returns {undefined}
		 */
		drawSolution: function () {
			var _this = this;
			var path = this.path;
			this.ctx.fillStyle = "rgba(0,165,0,.1)";
			this.ctx.strokeStyle = "rgb(0,0,0)";
			for (var i = 0; i < this.path.length; i++) {
				var V = path[i];
				var vW = this.cellW,
					vH = this.cellH,
					vX = V.x,
					vY = V.y,
					// Get the cell X coords and multiply by the cell width
					x = _this.graph.cells[vX][vY].x * vW,
					// Get the cell Y coords and multiply by the cell height
					y = _this.graph.cells[vX][vY].y * vH;
				(function () {
					_this.ctx.fillRect(x, y, vW, vH);
				})();
			}
		},
		/**
		 * Tick the environment
		 */
		tick: function () {
			this.clock++;

			// Tick ALL OF teh items!
			this.redraw = true;
			var smallWorld = {
				width:this.width,
				height:this.height,
				cellW:this.cellW,
				cellH:this.cellH,
				grid:this.grid,
				walls: this.walls,
				entities: this.entities
			};
			for (var i = 0, al = this.agents.length; i < al; i++) {
				this.agents[i].tick(smallWorld);
				for (var j = 0, dl = this.agents[i].digested.length; j < dl; j++) {
					this.deleteEntity(this.agents[i].digested[j]);
				}
			}

			for (var e = 0; e < this.entities.length; e++) {
				this.entities[e].age += 1;
				Utility.getGridLocation(this.entities[e], this.grid, this.cellW, this.cellH);
				if (this.entities[e].age > 10000 && this.clock % 100 === 0 && Utility.randf(0, 1) < 0.1) {
					this.deleteEntity(this.entities[e]);
				}
			}

			// If we have less then the number of items allowed throw a random one in
			if (this.entities.length < this.numItems && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
				var x = Utility.randi(5, this.width - 10),
					y = Utility.randi(5, this.height - 10);
				this.addRandEntity(new Vec(x, y));
			}

			for (var i = 0, al = this.agents.length; i < al; i++) {
				// Throw some points on a Graph
				if (this.clock % 100 === 0 && this.agents[i].pts.length !== 0) {
					this.rewardGraph.addPoint(this.clock / 100, i, this.agents[i].pts);
					this.rewardGraph.drawPoints();
					// Clear them up since we've drawn them
					this.agents[i].pts = Array();
				}
			}
		},
		/**
		 * Populate the World with Items
		 * @returns {undefined}
		 */
		populate: function () {
			for (var k = 0; k < this.numItems; k++) {
				var x = Utility.randi(5, this.width - 10),
					y = Utility.randi(5, this.height - 10);
				this.addRandEntity(new Vec(x, y));
			}
		}
	};

	global.World = World;

}(this));
