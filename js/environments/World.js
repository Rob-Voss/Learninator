var World = World || {};
var Interactions = Interactions || {};
var Utility = Utility || {};

(function (global) {
	"use strict";

	/**
	 * Make a World
	 * @param {HTMLCanvasElement} canvas
	 * @param {Array} walls
	 * @param {Agent} agents
	 * @returns {World}
	 */
	var World = function (options) {
		this.canvas = options.canvas;
		this.ctx = options.canvas.getContext("2d");
		this.width = options.canvas.width;
		this.height = options.canvas.height;
		this.horizCells = options.horizCells;
		this.vertCells = options.vertCells;
		this.vW = this.width / this.horizCells;
		this.vH = this.height / this.vertCells;
		this.maze = options.maze;
		this.cells = this.maze.graph.cells;

		this.clock = 0;
		this.simSpeed = 3;
		this.interval = 60;
		this.numItems = 80;
		this.entities = [];
		this.types = ['Wall', 'Nom', 'Gnar', 'Agent'];

		// When set to true, the canvas will redraw everything
		this.redraw = true;
		this.pause = false;

		this.populate();
		this.addWalls(options.walls || []);
		this.addAgents(options.agents || []);
		this.addEntities(this.walls);
		this.addEntities(this.agents);

		var _this = this;

		// Apply the Interactions class to the world
		Interactions.apply(this);

		setInterval(function () {
			if (!_this.pause) {
				_this.tick();
				if (_this.redraw || _this.clock % 50 === 0) {
					_this.draw();
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
			var oE = this.entities,
				nE = entities;
			this.entities = oE.concat(nE);
			this.redraw = true;
		},
		/**
		 * Add an item to the world canvas and set it to redraw
		 * @param {Item||Agent} entity
		 * @returns {undefined}
		 */
		addEntity: function (entity) {
			this.entities.push(entity);
			this.redraw = true;
		},
		/**
		 * Randomly create an antity at the Vec
		 * @param {Vec} v
		 * @returns {undefined}
		 */
		addRandEntity: function(v) {
			this.addEntity(new Item(Utility.randi(1, 3), v, 0, 0, Utility.randi(7, 11)));
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
		contains: function () {
			console.log('Contains!');
		},
		/**
		 * Draw the world
		 * @returns {undefined}
		 */
		draw: function () {
			this.clear();

			this.ctx.addGrid(this.cellSize);

			// Draw the population of the world
			for (var i = 0, entity; entity = this.entities[i++];) {
				entity.draw(this.ctx);
			}
		},
		/**
		 * Set the speed of the world
		 * @param {type} speed
		 * @returns {undefined}
		 */
		go: function (speed) {
			clearInterval(this.interval);
			this.redraw = true;
			this.pause = false;
			switch(speed) {
				case 'min':
					this.interval = setInterval(this.tick(), 200);
					this.simSpeed = 0;
					break;
				case 'mid':
					this.interval = setInterval(this.tick(), 30);
					this.simSpeed = 1;
					break;
				case 'max':
					this.interval = setInterval(this.tick(), 0);
					this.simSpeed = 2;
					break;
				case 'max+':
					this.interval = setInterval(this.tick(), 0);
					this.redraw = false;
					this.simSpeed = 3;
					break;
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
						entity.tick(this.clock);
					}

					if (!entity.cleanUp)
						nt.push(entity);
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
				this.addRandEntity(new Vec(x, y), this.entities.length);
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
				this.addRandEntity(new Vec(x, y), k);
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
