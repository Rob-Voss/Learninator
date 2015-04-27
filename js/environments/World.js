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
	var World = function (canvas, walls, agents, items) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.width = canvas.width;
		this.height = canvas.height;

		// An attempt to hold all the entities in this world
		this.entities = [];

		this.randf = function(a, b) { return Math.random()*(b-a)+a; };
		this.randi = function(a, b) { return Math.floor(Math.random()*(b-a)+a); };

		this.clock = 0;
		this.simSpeed = 3;
		this.interval = 60;
		this.numItems = 80;
		this.entities = [];

		this.populate();

		this.addWalls(walls || []);
		this.addAgents(agents || []);
		this.addEntities(this.walls);
		this.addEntities(this.agents);

		// When set to false, the canvas will redraw everything
		this.redraw = false;

		// Currently selected object. In the future an array for multiple selection
		this.selection = null;

		// **** Options! ****
		this.selectionColor = '#CC0000';
		this.selectionWidth = 1;

		this.types = ['Wall', 'Nom', 'Gnar', 'Agent'];

		var self = this;

		// Apply the Interactions class to the world
		Interactions.apply(this, [canvas]);

		CanvasRenderingContext2D.prototype.addGrid = function (delta, color, fontParams) {
			// define the default values for the optional arguments
			if (!arguments[0])
				delta = 100;
			if (!arguments[1])
				color = 'blue';
			if (!arguments[2])
				fontParams = '8px sans-serif';

			// extend the canvas width and height by delta
			var width = this.canvas.width;
			var height = this.canvas.height;

			// draw the vertical and horizontal lines
			this.lineWidth = 0.1;
			this.strokeStyle = color;
			this.font = fontParams;
			this.beginPath();

			for (var i = 0; i * delta < width; i++) {
				this.moveTo(i * delta, 0);
				this.lineTo(i * delta, height);
			}

			for (var j = 0; j * delta < height; j++) {
				this.moveTo(0, j * delta);
				this.lineTo(width, j * delta);
			}
			this.closePath();
			this.stroke();

			// draw a thicker line, which is the border of the original canvas
			this.lineWidth = 0.5;
			this.beginPath();
			this.moveTo(0, 0);
			this.lineTo(width, 0);
			this.lineTo(width, height);
			this.lineTo(0, height);
			this.lineTo(0, 0);
			this.closePath();
			this.stroke();

			// set the text parameters and write the number values to the vertical and horizontal lines
			this.font = fontParams
			this.lineWidth = 0.3;

			// 1. writing the numbers to the x axis
			var textY = height - 1; // y-coordinate for the number strings
			for (var i = 0; i * delta <= width; i++) {
				var x = i * delta,
					text = i * delta;
				this.strokeText(text, x, textY);
			}

			// 2. writing the numbers to the y axis
			var textX = width - 15; // x-coordinate for the number strings
			for (var j = 0; j * delta <= height; j++) {
				var y = j * delta,
					text = j * delta;
				this.strokeText(text, textX, y);
			}
		};

		setInterval(function () {
			self.tick();
			if (!self.redraw || self.clock % 50 === 0) {
				self.draw();
			}
		}, self.interval);
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
			this.redraw = false;
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
			this.redraw = false;
		},
		/**
		 * Add an item to the world canvas and set it to redraw
		 * @param {Item||Agent} entity
		 * @returns {undefined}
		 */
		addEntity: function (entity) {
			this.entities.push(entity);
			this.redraw = false;
		},
		/**
		 * Randomly create an antity at the Vec
		 * @param {Vec} v
		 * @returns {undefined}
		 */
		addRandEntity: function(v) {
			this.addEntity(new Item(this.randi(1, 3), v, 0, 0, this.randi(7, 11)));
		},
		/**
		 * Add walls
		 * @param {Array} walls
		 * @returns {undefined}
		 */
		addWalls: function (walls) {
			this.walls = this.walls || walls;
			this.redraw = false;
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
				for (var i = 0, wall; wall = this.walls[i++];) {
					minRes = wall.collisionCheck(minRes, v1, v2);
				}
			}

			// Collide with items
			if (checkItems) {
				for (var i = 0, entity; entity = this.entities[i++];) {
					minRes = entity.collisionCheck(minRes, v1, v2);
				}
			}

			return minRes;
		},
		contains: function () {

		},
		/**
		 * Draw the world
		 * @returns {undefined}
		 */
		draw: function () {
			this.clear();
			this.ctx.addGrid();
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
			this.redraw = false;
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
					this.redraw = true;
					this.simSpeed = 3;
					break;
			}
		},
		/**
		 * Tick the environment
		 */
		tick: function () {
			this.clock++;

			// Fix input to all agents based on environment and process their eyes
			for (var i = 0, agent; agent = this.agents[i++];) {
				agent.tick(this);
			}

			// Tick ALL OF teh items!
			this.redraw = false;
			for (var i = 0, entity; entity = this.entities[i++];) {
				if (entity.type == 1 || entity.type == 2) {
					entity.age += 1;
					// Did the agent find teh noms?
					for (var j = 0, agent; agent = this.agents[j++];) {
						entity.cleanUp = agent.eat(this, entity);
						if (entity.cleanUp) {
							this.redraw = true;
							break;
						}
					}

					if (entity.age > 5000 && this.clock % 100 === 0 && this.randf(0, 1) < 0.1) {
						// Keell it, it has been around way too long
						entity.cleanUp = true;
						this.redraw = true;
					}
				}
			}

			// Drop old the items
			if (this.redraw) {
				var nt = [];
				for (var i = 0, entity; entity = this.entities[i++];) {
					if (entity.type == 1 || entity.type == 2) {
						if (!entity.cleanUp)
							nt.push(entity);
					} else {
						nt.push(entity);
					}
				}
				// Swap new list
				this.entities = nt;
			}

			// If we have less then the number of items allowed throw a random one in
			if (this.entities.length < this.numItems && this.clock % 10 === 0 && this.randf(0, 1) < 0.25) {
				var x = this.randf(20, this.width - 20),
					y = this.randf(20, this.height - 20);
				this.addRandEntity(new Vec(x, y));
			}

			// This is where the agents learns based on the feedback of their
			// actions on the environment
			var pts = [];
			for (var i = 0, agent; agent = this.agents[i++];) {
				agent.backward();
				pts.push(agent.brain.avgRewardWindow.getAverage());
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
				var x = this.randf(20, this.width - 20),
					y = this.randf(20, this.height - 20);
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
			this.addRandEntity(new Vec(this.mouse.pos.x, this.mouse.pos.y));
		}
	};

	global.World = World;

}(this));
