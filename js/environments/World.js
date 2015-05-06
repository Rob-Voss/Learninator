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
		this.maze = options.maze;
		this.grid = options.maze.graphCells();
		this.cells = options.maze.cells;

		this.clock = 0;
		this.simSpeed = 2;

		/**
		* 1s = 1000ms (remember that setInterval and setTimeout run on milliseconds)
		* 1000ms / 60(fps) = 16.7ms (we'll round this to 17)
		*/
		this.fps = 60;
		this.interval = 1000 / this.fps;
		this.numItems = 80;
		this.entities = [];
		this.types = ['Wall', 'Nom', 'Gnar', 'Agent'];

		// When set to true, the canvas will redraw everything
		this.redraw = true;
		this.pause = false;

		this.populate();
		this.addWalls(this.cells || []);
		this.addAgents(options.agents || []);
		this.addEntities(this.walls);
		this.addEntities(this.agents);

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
						// Draw the population of the world
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
		 * Add an agent to the world canvas and set it to redraw
		 * @param {Array} agents
		 * @returns {undefined}
		 */
		addAgents: function (agents) {
			this.agents = this.agents || agents;
			this.redraw = true;
		},
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
				this.getGridLocation(entity);
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
					this.getGridLocation(this.grid, this.vW, this.vH);
				}
				var index = this.grid[entity.gridLocation.x][entity.gridLocation.y].population.indexOf(entity.id);
				if (index > -1) {
					this.grid[entity.gridLocation.x][entity.gridLocation.y].population.splice(index, 1);
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
		 * Add walls
		 * @param {Array} walls
		 * @returns {undefined}
		 */
		addWalls: function (walls) {
			this.walls = this.walls || walls;
			this.redraw = true;
		},
		/**
		 * Clear the canvas
		 * @returns {undefined}
		 */
		clear: function () {
			this.ctx.clearRect(0, 0, this.width, this.height);
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
					minRes = wall.collisionCheck(minRes, v1, v2);
				}
			}

			// Collide with items
			if (checkItems) {
				// @TODO Need to check the current cell first so we
				// don't check all the items
				for (var i = 0, entity; entity = this.entities[i++];) {
					minRes = entity.collisionCheck(minRes, v1, v2);
				}
			}

			return minRes;
		},
		getGridLocation: function (entity) {
			for(var h = 0, hCell; hCell = this.grid[h++];) {
				for(var v = 0, vCell; vCell = hCell[v++];) {
					var topLeft = vCell.x * this.vW,
						topRight = topLeft + this.vW,
						bottomLeft = vCell.y * this.vH,
						bottomRight = bottomLeft + this.vH;
					if ((entity.pos.x >= topLeft && entity.pos.x <= topRight) &&
						(entity.pos.y >= bottomLeft && entity.pos.y <= bottomRight)) {
						entity.gridLocation = new Vec(h-1, v-1);
						return;
					}
				}
			}
		},
		contains: function () {
			console.log('Contains!');
		},
		/**
		 * Tick the environment
		 */
		tick: function () {
			this.clock++;

			// Tick ALL OF teh items!
			this.redraw = true;

			var pts = [];
			var digested = [];
			// Fix input to all agents based on environment and process their eyes
			for (var i = 0, agent; agent = this.agents[i++];) {
				agent.tick(this);
				digested = agent.digested;
				// Handle boundary conditions
				if (agent.pos.x < 0)
					agent.pos.x = 0;
				if (agent.pos.x > this.width)
					agent.pos.x = this.width;
				if (agent.pos.y < 0)
					agent.pos.y = 0;
				if (agent.pos.y > this.height)
					agent.pos.y = this.height;

				// This is where the agents learns based on the feedback of their
				// actions on the environment
				agent.backward();
				pts.push(agent.brain.avgRewardWindow.getAverage());
			}

			var nt = [];
			for (var i = 0, entity; entity = this.entities[i++];) {
				if (entity.type == 1 || entity.type == 2) {
					var derp = digested.indexOf(entity.id);
					if (derp !== -1) {
						entity.cleanUp = true;
					} else {
						entity.tick(this);
					}

					if (!entity.cleanUp) {
						nt.push(entity);
					} else {
						this.deleteEntity(entity);
					}
				} else {
					nt.push(entity);
				}
			}

			// Drop old the items
			if (this.redraw) {
				// Swap new list
				this.entities = nt;
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
		click: function (e) {
			console.log('World Click');
		},
		/**
		 * Handle the right click on the world
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		contextMenu: function (e) {
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
