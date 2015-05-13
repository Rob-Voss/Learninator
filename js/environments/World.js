var World = World || {};
var Agent = Agent || {};
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

		this.maze = options.maze;
		this.grid = options.maze.graphCells();
		this.graph = options.maze.graph;

		this.vW = this.width / this.graph.width;
		this.vH = this.height / this.graph.height;

		this.clock = 0;
		this.simSpeed = 2;

		/**
		* 1s = 1000ms (remember that setInterval and setTimeout run on milliseconds)
		* 1000ms / 60(fps) = 16.7ms (we'll round this to 17)
		*/
		this.fps = 60;
		this.interval = 1000 / this.fps;
		this.numItems = 30;
		this.entities = [];
		this.types = ['Wall', 'Nom', 'Gnar'];

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
//		function draw() {
//			setTimeout(function () {
//				if (!_this.pause) {
//					_this.tick();
//					if (_this.redraw || this.clock % 50 === 0) {
//						_this.clear();
//						window.requestAnimationFrame(draw);
//
//						for (var i = 0, wall; wall = _this.walls[i++];) {
//							wall.draw(_this.ctx);
//						}
//						for (var i = 0, agent; agent = _this.agents[i++];) {
//							agent.draw(_this.ctx);
//						}
//						for (var i = 0, entity; entity = _this.entities[i++];) {
//							entity.draw(_this.ctx);
//						}
//					}
//				}
//			}, _this.interval);
//		}
//		draw();

		setInterval(function () {
			_this.tick();
			if (_this.redraw || _this.clock % 50 === 0) {
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
		}, _this.interval);
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
				var topLeft = cell.x * this.vW,
					bottomLeft = cell.y * this.vH;
				this.ctx.clearRect(topLeft, bottomLeft, this.vW, this.vH);
			} else {
				this.ctx.clearRect(0, 0, this.width, this.height);
			}
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
				Utility.getGridLocation(agent, this.grid, this.vW, this.vH);
				agent.tick(this.grid, this.walls, this.entities);

				// Handle boundary conditions
				if (agent.pos.x < 0)
					agent.pos.x = 0;
				if (agent.pos.x > this.width)
					agent.pos.x = this.width;
				if (agent.pos.y < 0)
					agent.pos.y = 0;
				if (agent.pos.y > this.height)
					agent.pos.y = this.height;

				for (var j = 0, entity; entity = agent.digested[j++];) {
					this.deleteEntity(entity);
				}

				pts.push(agent.brain.average_reward_window.getAverage());
			}

			for (var i = 0, entity; entity = this.entities[i++];) {
				entity.age += 1;

				if (entity.age > 5000 && this.clock % 100 === 0 && Utility.randf(0, 1) < 0.1) {
					entity.cleanUp = true;
				}
			}

			// If we have less then the number of items allowed throw a random one in
			if (this.entities.length < this.numItems && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
				var x = Utility.randf(10, this.width - 10),
					y = Utility.randf(10, this.height - 10);
				this.addRandEntity(new Vec(x, y));
			}

			// Throw some points on a Graph
			if (this.clock % 100 === 0) {
				this.rewardGraph.addPoint(this.clock / 100, pts);
				this.rewardGraph.drawPoints();
			}
		},
		/**
		 * Populate the World with Items
		 * @returns {undefined}
		 */
		populate: function () {
			for (var k = 0; k < this.numItems; k++) {
				var x = Utility.randf(10, this.width - 10),
					y = Utility.randf(10, this.height - 10);
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
