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
			this.numItems = options.numItems || 20;
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
				this.stage.addChild(this.walls[w].shape);
			}

			for (var a=0, al=this.agents.length; a<al; a++) {
				this.stage.addChild(this.agents[a].sprite);
				for (var ei=0; ei<this.agents[a].eyes.length; ei++) {
					this.stage.addChild(this.agents[a].eyes[ei].shape);
				}
			}
			
			this.populate();
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
		};

		/**
		 * Add an item to the world canvas and set it to redraw
		 * @param {Item||Agent} entity
		 * @returns {undefined}
		 */
		addEntity (entity) {
			if (entity.type !== 0) {
				var cell = this.grid.getGridLocation(entity.position),
					locText = new PIXI.Text(entity.gridLocation.x + ':' + entity.gridLocation.y, {font: "10px Arial", fill: "#006400", align: "center"}),
					posText = new PIXI.Text(entity.position.x + ':' + entity.position.y, {font: "10px Arial", fill: "#000000", align: "center"});
				cell.population.splice(0, 0, entity.id);
				posText.position.set(-20, 10);
				locText.position.set(0, 10);
				entity.sprite.addChild(posText);
				entity.sprite.addChild(locText);
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
				width: this.grid.width * this.grid.cellWidth - 2,
				height: this.grid.height * this.grid.cellHeight - 2,
				movingEntities: this.movingEntities
			};
			
			for (var i=0, al=this.agents.length; i<al; i++) {
				this.agents[i].tick(smallWorld);
				this.agents[i].gridLocation = this.grid.getGridLocation(this.agents[i].position);
				
				for (var j=0, dl=this.agents[i].digested.length; j<dl; j++) {
					this.deleteEntity(this.agents[i].digested[j]);
				}

				if (this.raycast) {
					this.map.update(seconds);
					this.agents[i].player = new Player(this.agents[i].gridLocation.x, this.agents[i].gridLocation.y, agent.angle);
					this.agents[i].player.update(this.agents[i].angle, this.map, seconds);
					this.agents[i].camera.render(this.agents[i].player, this.map);
				}
			}

			for (var e=0; e<this.entities.length; e++) {
				this.entities[e].tick(smallWorld);
				this.entities[e].gridLocation = this.grid.getGridLocation(this.entities[e].position);

				this.entities[e].sprite.getChildAt(0).text = this.entities[e].gridLocation.x + ':' + this.entities[e].gridLocation.y;
				this.entities[e].sprite.getChildAt(1).text = this.entities[e].position.x + ':' + this.entities[e].position.y;

				if (this.entities[e].age > 1000 && this.clock % 100 === 0 && Utility.randf(0, 1) < 0.1) {
					this.deleteEntity(this.entities[e]);
				}
			}

			// If we have less then the number of items allowed throw a random one in
			if (this.entities.length < this.numItems && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
				var x = Utility.randi(5, this.width - 2),
					y = Utility.randi(5, this.height - 2);
				this.addRandEntity(new Vec(x, y));
			}

			for (var i=0, al=this.agents.length; i<al; i++) {
				// Throw some points on a Graph
				if (this.clock % 100 === 0 && this.agents[i].pts.length !== 0) {
					this.rewardGraph.addPoint(this.clock / 100, i, this.agents[i].pts);
					this.rewardGraph.drawPoints();
					// Clear them up since we've drawn them
					this.agents[i].pts = Array();
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
