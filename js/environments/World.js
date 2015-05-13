var World = World || {};
var Interactions = Interactions || {};
var Utility = Utility || {};

(function (global) {
	"use strict";

	/**
	 * Make a World
	 * @param {Object} options
	 * @returns {World}
	 */
	var World = function (options) {
		this.canvas = options.canvas;
		this.ctx = this.canvas.getContext("2d");
		this.width = this.canvas.width;
		this.height = this.canvas.height;
		this.horizCells = options.horizCells;
		this.vertCells = options.vertCells;
		this.vW = this.width / this.horizCells;
		this.vH = this.height / this.vertCells;
		this.grid = options.maze.graphCells();

		this.clock = 0;
		this.simSpeed = 2;

		/**
		* 1s = 1000ms (remember that setInterval and setTimeout run on milliseconds)
		* 1000ms / 60(fps) = 16.7ms (we'll round this to 17)
		*/
		this.fps = 60;
		this.interval = 1000 / this.fps;
		this.numItems = 40;
		this.entities = [];
		this.types = ['Wall', 'Nom', 'Gnar', 'Agent'];

		// When set to true, the canvas will redraw everything
		this.redraw = true;
		this.pause = false;

		this.walls = options.walls || [];
		this.agents = options.agents || [];
		this.populate();

		var _this = this;

		// Apply the Interactions class to the world
		Interactions.apply(this);

		/**
		 * Draw the world
		 * @returns {undefined}
		 */
		function draw() {
			setTimeout(function () {
				if (!_this.pause) {
					_this.tick();
					if (_this.redraw) {
						window.requestAnimationFrame(draw);

						_this.clear();
						for (var i = 0, wall; wall = _this.walls[i++];) {
							wall.draw(_this.ctx);
						}
						for (var i = 0, agent; agent = _this.agents[i++];) {
							agent.draw(_this.ctx);
						}
						for (var i = 0, entity; entity = _this.entities[i++];) {
							entity.draw(_this.ctx);
						}
					}
				}
			}, _this.interval);
		}

		draw();
	};

	/**
	 * World
	 * @type World
	 */
	World.prototype = {
		/**
		 * Add an item to the world canvas and set it to redraw
		 * @param {Array} entities
		 * @returns {undefined}
		 */
		addEntities: function (entities) {
			for (var i = 0, entity; entity = entities[i++];) {
				if (entity.type !== 0) {
					this.addEntity(entity);
				}
				this.entities.push(entity);
			}
			this.redraw = true;
		},
		/**
		 * Add an item to the world canvas and set it to redraw
		 * @param {Item||Agent} entity
		 * @returns {undefined}
		 */
		addEntity: function (entity) {
			if (entity.type !== 0) {
				Utility.getGridLocation(entity, this.grid, this.vW, this.vH);
				this.grid[entity.gridLocation.x][entity.gridLocation.y].population.push(entity.id);
			}
			this.entities.push(entity);
			this.redraw = true;
		},
		/**
		 * Add an item to the world canvas and set it to redraw
		 * @param {Item||Agent} entity
		 * @returns {undefined}
		 */
		deleteEntity: function (entity) {
			if (entity.type !== 0) {
				if (entity.gridLocation.x === undefined) {
					Utility.getGridLocation(entity, this.grid, this.vW, this.vH);
				}
				var index = this.grid[entity.gridLocation.x][entity.gridLocation.y].population.indexOf(entity.id);
				if (index > -1) {
					this.grid[entity.gridLocation.x][entity.gridLocation.y].population.splice(index, 1);
					this.entities.splice(this.entities.findIndex(Utility.getId, entity.id), 1);
				}
			}
			this.redraw = true;
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
		 * Clear the canvas
		 * @param {Vec} cell
		 * @returns {undefined}
		 */
		clear: function (cell) {
			if (cell) {
				this.ctx.clearRect(0, 0, this.width, this.height);
			} else {
				this.ctx.clearRect(0, 0, this.width, this.height);
			}
		},
		/**
		 * A helper function to get check for colliding walls/items
		 * @param {Vec} v1
		 * @param {Vec} v2
		 * @param {Boolean} checkWalls
		 * @param {Boolean} checkItems
		 * @returns {Boolean}
		 */
		collisionCheck: function (v1, v2, checkWalls, checkItems) {
			var minRes = false;

			// Collide with walls
			if (checkWalls) {
				// @TODO Need to check the current cell first so we
				// don't loop through all the walls
				for (var i = 0, wall; wall = this.walls[i++];) {
					var wResult = Utility.lineIntersect(v1, v2, wall.v1, wall.v2);
					if (wResult) {
						wResult.type = 0; // 0 is wall
						if (!minRes) {
							minRes = wResult;
						} else {
							// Check if it's closer
							if (wResult.vecX < minRes.vecX) {
								// If yes, replace it
								minRes = wResult;
							}
						}
					}
				}
			}

			// Collide with items
			if (checkItems) {
				// @TODO Need to check the current cell first so we
				// don't check all the items
				for (var i = 0, entity; entity = this.entities[i++];) {
					var iResult = Utility.linePointIntersect(v1, v2, entity.pos, entity.radius);
					if (iResult) {
						iResult.type = entity.type;
						iResult.id = entity.id;
						iResult.radius = entity.radius;
						iResult.pos = entity.pos;
						if (!minRes) {
							minRes = iResult;
						} else {
							if (iResult.vecX < minRes.vecX) {
								minRes = iResult;
							}
						}
					}
				}
			}

			return minRes;
		},
		/**
		 * Tick the environment
		 */
		tick: function () {
			this.clock++;

			// Tick ALL OF teh items!
			this.redraw = true;

			var pts = [];
			for (var i = 0, agent; agent = this.agents[i++];) {
				agent.tick(this);

				pts.push(agent.brain.avgRewardWindow.getAverage());
			}

			for (var i = 0, entity; entity = this.entities[i++];) {
				entity.tick(this);
			}

			// If we have less then the number of items allowed throw a random one in
			if (this.entities.length < this.numItems && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
				var x = Utility.randf(20, this.width - 20),
					y = Utility.randf(20, this.height - 20);
				this.addRandEntity(new Vec(x, y));
			}

			// Throw some points on a Graph
			if (this.clock % 200 === 0) {
				this.rewardGraph.addPoint(this.clock / 200, pts);
				this.rewardGraph.drawPoints();
			}
		},
		/**
		 * Populate the World with Items
		 * @returns {undefined}
		 */
		populate: function () {
			for (var k = 0; k < this.numItems; k++) {
				var x = Utility.randf(20, this.width - 20),
					y = Utility.randf(20, this.height - 20);
				this.addRandEntity(new Vec(x, y));
			}
		},
		/**
		 * Handle the right click on the world
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		mouseClick: function (e) {
			console.log('World Click');
		},
		/**
		 * Handle the right click on the world
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		rightClick: function (e) {
			console.log('World Right Click');
		},
		/**
		 * Handle the double click on the world
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		doubleClick: function (e) {
			console.log('World Double Click');
		}
	};

	global.World = World;

}(this));
