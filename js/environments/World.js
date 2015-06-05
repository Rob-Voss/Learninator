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
		this.ctx = this.canvas.getContext("2d");
		this.width = this.canvas.width;
		this.height = this.canvas.height;

		this.grid = options.grid;
		this.cellWidth = this.canvas.width / this.grid.width;
		this.cellHeight = this.canvas.height / this.grid.height;
		this.path = this.grid.path;
		this.rewardGraph = options.rewardGraph;

		this.clock = 0;
		this.numItems = 20;
		this.entities = [];
		this.types = ['Wall', 'Nom', 'Gnar'];
		this.pause = false;

		if (options.raycast) {
			this.raycast = options.raycast;
			this.camera = new Camera(options.displayCanvas, 320, 0.8);
			this.map = new Map(this.grid.width);
		}

		/**
		* 1s = 1000ms (remember that setInterval and setTimeout run on milliseconds)
		* 1000ms / 60(fps) = 16.7ms (we'll round this to 17)
		*/
		this.fps = 60;
		this.interval = 1000 / this.fps;

		this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {view:this.canvas}, true);
		this.renderer.backgroundColor = 0xFFFFFF;
		document.body.appendChild(this.renderer.view);
		this.stage = new PIXI.Container();

		var _this = this;

		this.walls = options.walls || [];
		for (var w = 0, wl = this.walls.length; w < wl; w++) {
			this.map.wallGrid[w] = 1;
			this.stage.addChild(this.walls[w].shape);
		}

		this.agents = options.agents || [];
		for (var a = 0, al = this.agents.length; a < al; a++) {
			this.agents[a].sprite.tint = this.rewardGraph.hexStyles[a];
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
				if (_this.raycast) {
					var seconds = (_this.clock - _this.lastTime) / 1000,
						controls = {
							left:false,
							right:false,
							forward:false,
							back:false
						};
					_this.lastTime = _this.clock;
					_this.map.update(seconds);
					_this.agents[0].player.x = _this.agents[0].pos.x;
					_this.agents[0].player.y = _this.agents[0].pos.y;
					_this.agents[0].player.direction = _this.agents[0].angle;

					_this.agents[0].player.update(controls, _this.map, seconds);
					_this.camera.render(_this.agents[0].player, _this.map);
				}
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
				var cell = this.grid.getGridLocation(entity.pos);
				cell.population.splice(0, 0, entity.id);
				this.stage.addChild(entity.sprite);
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
				var cell = this.grid.getGridLocation(entity.pos),
					index = cell.population.indexOf(entity.id);
				if (index > -1) {
					cell.population.splice(index, 1);
					this.stage.removeChild(entity.sprite);
					this.entities.splice(this.entities.findIndex(Utility.getId, entity.id), 1);
				}
			}
		},
		/**
		 * Tick the environment
		 */
		tick: function () {
			this.clock++;

			// Tick ALL OF teh items!
			var smallWorld = {
				map:this.map,
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
				this.entities[e].gridLocation = this.grid.getGridLocation(this.entities[e].pos);
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
