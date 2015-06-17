var World = World || {};
var Agent = Agent || {};
var Utility = Utility || {};
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
			this.numItems = 20;
			this.entities = [];
			this.types = ['Wall', 'Nom', 'Gnar'];

			this.pause = false;
			this.tinting = false;
			this.raycast = options.raycast || false;
			this.movingEntities = options.movingEntities || false;
			this.interactive = options.interactive || false;

			this.map = new Map(this.grid.width);
			this.map.populate(this.grid);

			this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {view:this.canvas}, true);
			this.renderer.backgroundColor = 0xFFFFFF;
			document.body.appendChild(this.renderer.view);
			this.stage = new PIXI.Container();

			var _this = this;
			
			for (var w=0, wl=this.walls.length; w<wl; w++) {
				var wall = this.walls[w];
				this.stage.addChild(wall.shape);
			}

			for (var a=0, al=this.agents.length; a<al; a++) {
				var agent = this.agents[a];
				this.stage.addChild(agent.sprite);
				for (var ei=0; ei<agent.eyes.length; ei++) {
					var eye = agent.eyes[ei];
					this.stage.addChild(eye.shape);
				}
			}

			this.populate();
			for (var e=0, el=this.entities.length; e<el; e++) {
				var entity = this.entities[e];
				this.stage.addChild(entity.sprite);
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
		 * Add an item to the world canvas and set it to redraw
		 * @param {Item||Agent} entity
		 * @returns {undefined}
		 */
		addEntity (entity) {
			if (entity.type !== 0) {
				var cell = this.grid.getGridLocation(entity.position);
				cell.population.splice(0, 0, entity.id);
				this.stage.addChild(entity.sprite);
				this.entities.push(entity);
			}
		};

		/**
		 * Randomly create an entity at the Vec
		 * @param {Vec} pos
		 * @returns {undefined}
		 */
		addRandEntity (pos) {
			this.addEntity(new Item(Utility.randi(1, 3), pos, 10, this.interactive));
		};

		/**
		 * Add an item to the world canvas and set it to redraw
		 * @param {Item||Agent} entity
		 * @returns {undefined}
		 */
		deleteEntity (entity) {
			if (entity.type !== 0) {
				var cell = this.grid.getGridLocation(entity.position),
					index = cell.population.indexOf(entity.id);
				if (index > -1) {
					cell.population.splice(index, 1);
					this.stage.removeChild(entity.sprite);
					this.entities.splice(this.entities.findIndex(Utility.getId, entity.id), 1);
				}
			}
		};

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
				movingEntities: this.movingEntities
			};
			for (var i=0, al=this.agents.length; i<al; i++) {
				var agent = this.agents[i];
				agent.sprite.tint = (this.tinting) ? this.rewardGraph.hexStyles[i] : 0xFFFFFF;
				agent.tick(smallWorld);
				for (var j=0, dl=agent.digested.length; j<dl; j++) {
					this.deleteEntity(agent.digested[j]);
				}

				if (this.raycast) {
					this.map.update(seconds);
					agent.player = new Player(agent.gridLocation.x, agent.gridLocation.y, agent.angle);
					agent.player.update(agent.angle, this.map, seconds);
					agent.camera.render(agent.player, this.map);
				}
			}

			for (var e=0; e<this.entities.length; e++) {
				var entity = this.entities[e];
				entity.tick(smallWorld);

				if (entity.age > 10000 && this.clock % 100 === 0 && Utility.randf(0, 1) < 0.1) {
					this.deleteEntity(entity);
				}
			}

			// If we have less then the number of items allowed throw a random one in
			if (this.entities.length < this.numItems && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
				var x = Utility.randi(5, this.width - 2),
					y = Utility.randi(5, this.height - 2);
				this.addRandEntity(new Vec(x, y));
			}

			for (var i=0, al=this.agents.length; i<al; i++) {
				var agent = this.agents[i];
				// Throw some points on a Graph
				if (this.clock % 100 === 0 && agent.pts.length !== 0) {
					this.rewardGraph.addPoint(this.clock / 100, i, agent.pts);
					this.rewardGraph.drawPoints();
					// Clear them up since we've drawn them
					agent.pts = Array();
				}
			}
		
		};

		/**
		 * Populate the World with Items
		 * @returns {undefined}
		 */
		populate () {
			for (var k = 0; k < this.numItems; k++) {
				var x = Utility.randi(5, this.width - 10),
					y = Utility.randi(5, this.height - 10);
				this.addRandEntity(new Vec(x, y));
			}
		};
		
	};

	global.World = World;

}(this));
