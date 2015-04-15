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
	var World = function (canvas, walls, agents) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.width = canvas.width;
		this.height = canvas.height;

		this.walls = walls;
		this.agents = agents;
		this.items = [];

		this.randf = function(a, b) { return Math.random()*(b-a)+a; };
		this.randi = function(a, b) { return Math.floor(Math.random()*(b-a)+a); };

		this.simSpeed = 2;
		this.interval = 60;
		this.clock = 0;
		this.numItems = 20;

		// Apply the Interactions class to this
		Interactions.apply(this, [canvas]);

		Interactions.apply(this, [canvas]);
		
		// This complicates things a little but but fixes mouse co-ordinate problems
		// when there's a border or padding. See getMouse for more detail
		var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
		if (document.defaultView && document.defaultView.getComputedStyle) {
			this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['paddingLeft'], 10) || 0;
			this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['paddingTop'], 10) || 0;
			this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['borderLeftWidth'], 10) || 0;
			this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['borderTopWidth'], 10) || 0;
		}

		// Some pages have fixed-position bars at the top or left of the page
		// They will mess up mouse coordinates and this fixes that
		var html = document.body.parentNode;
		this.htmlTop = html.offsetTop;
		this.htmlLeft = html.offsetLeft;

		// When set to false, the canvas will redraw everything
		this.valid = false;

		// Keep track of when we are dragging
		this.dragging = false;

		// See mousedown and mousemove events for explanation
		this.dragoff = new Vec(0,0);

		// Currently selected object. In the future an array for multiple selection
		this.selection = null;

		// **** Options! ****
		this.selectionColor = '#CC0000';
		this.selectionWidth = 1;

		this.rewardGraph = {};

		var self = this;

		setInterval(function () {
			self.tick();
			if (!self.valid || self.clock % 50 === 0) {
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
		 * Randomly create an item at x, y
		 * @param {type} x
		 * @param {type} y
		 * @returns {undefined}
		 */
		randItem: function(x, y) {
			var type = this.randi(1, 3),
				radius = this.randi(7, 11);
			this.addItem(new Item(type, new Vec(x, y), 0, 0, radius));
		},
		/**
		 * Add an item to the world canvas and set it to redraw
		 * @param {Item} item
		 * @returns {undefined}
		 */
		addItem: function (item) {
			this.items.push(item);
			this.valid = false;
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
		 * @param {Boolean} checkCells
		 * @param {Boolean} checkItems
		 * @param {Boolean} checkAgents
		 */
		collisionCheck: function (v1, v2, checkCells, checkItems, checkAgents) {
			var minRes = false;

			// Collide with walls
			if (checkCells) {
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
				for (var i = 0, item; item = this.items[i++];) {
					var iResult = Utility.linePointIntersect(v1, v2, item.pos, item.radius);
					if (iResult) {
						iResult.type = item.type; // Store type of item
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

			// Collide with agents
			if (checkAgents) {
				for (var i = 0, agent; agent = this.agents[i++];) {
					var iResult = Utility.linePointIntersect(v1, v2, agent.pos, agent.radius);
					if (iResult) {
						iResult.type = agent.type; // Store type of item
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
		draw: function () {
			this.clear();
			this.ctx.lineWidth = 1;

			// Draw the walls in environment
			this.ctx.strokeStyle = "rgb(0,0,0)";
			this.ctx.beginPath();
			for (var i = 0, wall; wall = this.walls[i++];) {
				this.ctx.moveTo(wall.v1.x, wall.v1.y);
				this.ctx.lineTo(wall.v2.x, wall.v2.y);
			}
			this.ctx.stroke();

			// Draw the agents
			for (var i = 0, agent; agent = this.agents[i++];) {
				var avgR = agent.brain.avgRewardWindow.getAverage().toFixed(1);

				this.ctx.fillStyle = "rgb(150,150,150)";
				this.ctx.strokeStyle = "rgb(0,0,0)";

				// Draw agents body
				this.ctx.beginPath();
				this.ctx.arc(agent.oldPos.x, agent.oldPos.y, agent.radius, 0, Math.PI * 2, true);
				this.ctx.fill();
				this.ctx.fillText(agent.name + ":" + i + " (" + avgR + ")", agent.oldPos.x + agent.radius, agent.oldPos.y + agent.radius);
				this.ctx.stroke();

				// Draw agents sight
				for (var ei = 0, eye; eye = agent.eyes[ei++];) {
					switch (eye.sensedType) {
						// Is it wall or nothing?
						case -1:case 0:
							this.ctx.strokeStyle = "rgb(0,0,0)";
							break;
						// It is noms
						case 1:
							this.ctx.strokeStyle = "rgb(255,150,150)";
							break;
						// It is gnar gnar
						case 2:
							this.ctx.strokeStyle = "rgb(150,255,150)";
							break;
						// Is it another Agent
						case 3:
							this.ctx.strokeStyle = "rgb(255,0,0)";
							break;
					}

					var aEyeX = agent.oldPos.x + eye.sensedProximity * Math.sin(agent.oldAngle + eye.angle),
						aEyeY = agent.oldPos.y + eye.sensedProximity * Math.cos(agent.oldAngle + eye.angle);

					// Draw the agent's line of sights
					this.ctx.beginPath();
					this.ctx.moveTo(agent.oldPos.x, agent.oldPos.y);
					this.ctx.lineTo(aEyeX, aEyeY);
					this.ctx.stroke();
				}
			}

			// Draw items
			this.ctx.strokeStyle = "rgb(0,0,0)";
			for (var i = 0, item; item = this.items[i++];) {
				if (item.type === 1)
					this.ctx.fillStyle = "rgb(255, 150, 150)";
				if (item.type === 2)
					this.ctx.fillStyle = "rgb(150, 255, 150)";
				this.ctx.beginPath();
				this.ctx.arc(item.pos.x, item.pos.y, item.radius, 0, Math.PI * 2, true);
				this.ctx.fill();
				this.ctx.stroke();
			}
		},
		/**
		 * Set the speed of the world
		 * @param {type} speed
		 * @returns {undefined}
		 */
		go: function (speed) {
			clearInterval(this.interval);
			this.valid = false;
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
					this.valid = true;
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
			this.collpoints = [];
			for (var i = 0, agent; agent = this.agents[i++];) {
				for (var ei = 0, eye; eye = agent.eyes[ei++];) {
					var X = agent.pos.x + eye.maxRange * Math.sin(agent.angle + eye.angle),
						Y = agent.pos.y + eye.maxRange * Math.cos(agent.angle + eye.angle),
						// We have a line from agent.pos to p->eyep
						result = this.collisionCheck(agent.pos, new Vec(X, Y), true, true, true);
					if (result) {
						// eye collided with wall
						eye.sensedProximity = result.vecI.distFrom(agent.pos);
						eye.sensedType = result.type;
					} else {
						eye.sensedProximity = eye.maxRange;
						eye.sensedType = -1;
					}
				}
				// Let the agents behave in the world based on their input
				agent.forward();

				// Apply the outputs of agents on the environment
				agent.oldPos = agent.pos; // Back up the old position
				agent.oldAngle = agent.angle; // and angle

				// Steer the agent according to outputs of wheel velocities
				var v = new Vec(0, agent.radius / 2.0),
					v = v.rotate(agent.angle + Math.PI / 2),
					w1pos = agent.pos.add(v), // Positions of wheel 1
					w2pos = agent.pos.sub(v), // Positions of wheel 2
					vv = agent.pos.sub(w2pos),
					vv = vv.rotate(-agent.rot1),
					vv2 = agent.pos.sub(w1pos),
					vv2 = vv2.rotate(agent.rot2),
					newPos = w2pos.add(vv),
					newPos2 = w1pos.add(vv2);

				newPos.scale(0.5);
				newPos2.scale(0.5);

				agent.pos = newPos.add(newPos2);

				agent.angle -= agent.rot1;
				if (agent.angle < 0)
					agent.angle += 2 * Math.PI;
				agent.angle += agent.rot2;
				if (agent.angle > 2 * Math.PI)
					agent.angle -= 2 * Math.PI;

				// The agent is trying to move from pos to oPos so we need to check walls
				if (this.collisionCheck(agent.oldPos, agent.pos, true, false)) {
					// The agent derped! Wall collision! Reset their position
					agent.pos = agent.oldPos;
				}

				// Handle boundary conditions
				if (agent.pos.x < 0)
					agent.pos.x = 0;
				if (agent.pos.x > this.width)
					agent.pos.x = this.width;
				if (agent.pos.y < 0)
					agent.pos.y = 0;
				if (agent.pos.y > this.height)
					agent.pos.y = this.height;
			}

			// Tick ALL OF teh items!
			this.valid = false;
			for (var i = 0, item; item = this.items[i++];) {
				item.age += 1;

				// Did the agent find teh noms?
				for (var j = 0, agent; agent = this.agents[j++];) {
					if (agent.pos.distFrom(item.pos) < item.radius + agent.radius) {
						// Check if it's on the other side of a wall
						if (!this.collisionCheck(agent.pos, item.pos, true, false)) {
							// Nom Noms!
							switch (item.type) {
								case 1:// The sweet meats
									agent.digestionSignal += 5.0 + (item.radius / 2);
									break;
								case 2:// The gnar gnar meats
									agent.digestionSignal += -6.0 + (item.radius / 2);
									break;
							}
							item.cleanUp = true;
							this.valid = true;
							break; // Done consuming, move on
						}
					}
				}

				if (item.age > 5000 && this.clock % 100 === 0 && this.randf(0, 1) < 0.1) {
					// Keell it, it has been around way too long
					item.cleanUp = true;
					this.valid = true;
				}
			}

			if (this.valid) {
				var nt = [];
				for (var i = 0, item; item = this.items[i++];) {
					if (!item.cleanUp)
						nt.push(item);
				}
				// Swap
				this.items = nt;
			}

			if (this.items.length < this.numItems && this.clock % 10 === 0 && this.randf(0, 1) < 0.25) {
				var x = this.randf(20, this.width - 20),
					y = this.randf(20, this.height - 20);
				this.randItem(x, y);
			}

			// This is where the agents learns based on the feedback of their
			// actions on the environment
			var pts = [];
			for (var i = 0, agent; agent = this.agents[i++];) {
				agent.backward();
				pts.push(agent.brain.avgRewardWindow.getAverage());
			}

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
				var x = randf(20, this.width - 20),
					y = randf(20, this.height - 20);
				this.randItem(x, y);
			}
		}
	};

	global.World = World;

}(this));
