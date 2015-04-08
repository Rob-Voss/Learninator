var World = World || {REVISION: '0.1'};

(function (global) {
	"use strict";

	/**
	 * Make a World
	 * @param {Graph} canvas
	 * @param {Array} cells
	 * @param {Agent} agents
	 * @returns {World}
	 */
	var World = function (canvas, cells, agents) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.W = canvas.width;
		this.H = canvas.height;

		this.cells = cells;
		this.agents = agents;
		this.items = [];

		this.clock = 0;
		this.numItems = 100;
		this.FPS = 60;

		canvas.addEventListener('click', this.eventClick, false);
		// Canvas can't get focus by default, so we need to attach listeners to the document.
		document.addEventListener('keyup', this.eventKeyUp, true);
		document.addEventListener('keydown', this.eventKeyDown, true);

		setInterval(this.NPGtick, 1000 / this.FPS);
	};

	/**
	 * World
	 * @type World
	 */
	World.prototype = {
		NPGtick: function() {

		},
		eventClick: function (e) {
			var x, y;
			if (e.pageX || e.pageY) {
				x = e.pageX;
				y = e.pageY;
			} else {
				x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
				y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			}
			x -= e.currentTarget.offsetLeft;
			y -= e.currentTarget.offsetTop;

			// call user-defined callback
			mouseClick(x, y, e.shiftKey, e.ctrlKey);
		},
		eventKeyUp: function (e) {
			/**
			 * http://www.aspdotnetfaq.com/Faq/What-is-the-list-of-KeyCodes-for-JavaScript-KeyDown-KeyPress-and-KeyUp-events.aspx
			 */
			var keycode = ('which' in e) ? e.which : e.keyCode;
			keyUp(keycode);
		},
		eventKeyDown: function (e) {
			var keycode = ('which' in e) ? e.which : e.keyCode;
			keyDown(keycode);
		},
		/**
		 * A helper function to get closest colliding cells/items
		 * @param {Vec} v1
		 * @param {Vec} v2
		 * @param {Boolean} checkCells
		 * @param {Boolean} checkItems
		 */
		collisionCheck: function (v1, v2, checkCells, checkItems) {
			var minRes = false;

			// Collide with cells
			if (checkCells) {
				for (var i = 0, n = this.cells.length; i < n; i++) {
					var cell = this.cells[i];
					var wResult = Utility.lineIntersect(v1, v2, cell.v1, cell.v2);
					if (wResult) {
						wResult.type = 0; // 0 is cell
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
				for (var i = 0, n = this.items.length; i < n; i++) {
					var item = this.items[i],
						iResult = Utility.linePointIntersect(v1, v2, item.pos, item.rad);
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

			return minRes;
		},
		/**
		 * Tick the environment
		 */
		tick: function () {
			this.clock++;

			// Fix input to all agents based on environment and process their eyes
			this.collpoints = [];
			for (var i = 0, n = this.agents.length; i < n; i++) {
				var agent = this.agents[i];
				for (var ei = 0, ne = agent.numEyes; ei < ne; ei++) {
					var eye = agent.eyes[ei],
						X = agent.pos.x + eye.maxRange * Math.sin(agent.angle + eye.angle),
						Y = agent.pos.y + eye.maxRange * Math.cos(agent.angle + eye.angle),
						// We have a line from agent.pos to p->eyep
						eyep = new Vec(X, Y),
						result = this.collisionCheck(agent.pos, eyep, true, true);
					if (result) {
						// eye collided with wall
						eye.sensedProximity = result.vecI.distFrom(agent.pos);
						eye.sensedType = result.type;
					} else {
						eye.sensedProximity = eye.maxRange;
						eye.sensedType = -1;
					}
				}
			}

			// Let the agents behave in the world based on their input
			for (var i = 0, n = this.agents.length; i < n; i++) {
				this.agents[i].forward();
			}

			// Apply the outputs of agents on the environment
			for (var i = 0, n = this.agents.length; i < n; i++) {
				var agent = this.agents[i];

				agent.oldPos = agent.pos; // Back up the old position
				agent.oldAngle = agent.angle; // and angle

				// Steer the agent according to outputs of wheel velocities
				var v = new Vec(0, agent.rad / 2.0),
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

				// The agent is trying to move from pos to oPos so we need to check cells
				if (this.collisionCheck(agent.oldPos, agent.pos, true, false)) {
					// The agent derped! Wall collision! Reset their position
					agent.pos = agent.oldPos;
				}

				// Handle boundary conditions
				if (agent.pos.x < 0)
					agent.pos.x = 0;
				if (agent.pos.x > this.W)
					agent.pos.x = this.W;
				if (agent.pos.y < 0)
					agent.pos.y = 0;
				if (agent.pos.y > this.H)
					agent.pos.y = this.H;
			}

			// Tick ALL OF teh items!
			var updateItems = false;
			for (var i = 0, n = this.items.length; i < n; i++) {
				var item = this.items[i];
				item.age += 1;

				// Did the agent find teh noms?
				for (var j = 0, m = this.agents.length; j < m; j++) {
					var agent = this.agents[j],
						d = agent.pos.distFrom(item.pos);
					if (d < item.rad + agent.rad) {
						// Check if it's on the other side of a wall
						if (!this.collisionCheck(agent.pos, item.pos, true, false)) {
							// Nom Noms!
							if (item.type === 1)
								agent.digestionSignal += 5.0; // The sweet meats
							if (item.type === 2)
								agent.digestionSignal += -6.0; // The gnar gnar meats
							item.cleanUp = true;
							updateItems = true;
							break; // Done consuming, move on
						}
					}
				}

				if (item.age > 5000 && this.clock % 100 === 0 && convnetjs.randf(0, 1) < 0.1) {
					// Keell it, it has been around way too long
					item.cleanUp = true;
					updateItems = true;
				}
			}

			if (updateItems) {
				var nt = [];
				for (var i = 0, n = this.items.length; i < n; i++) {
					var item = this.items[i];
					if (!item.cleanUp)
						nt.push(item);
				}
				// Swap
				this.items = nt;
			}

			if (this.items.length < 30 && this.clock % 10 === 0 && convnetjs.randf(0, 1) < 0.25) {
				var newItemX = convnetjs.randf(20, this.W - 20),
					newItemY = convnetjs.randf(20, this.H - 20),
					newItemType = convnetjs.randi(1, 3), // Noms or Gnars (1 || 2)
					newItem = new Item(newItemX, newItemY, newItemType);
				this.items.push(newItem);
			}

			// This is where the agents learns based on the feedback of their
			// actions on the environment
			for (var i = 0, n = this.agents.length; i < n; i++) {
				this.agents[i].backward();
			}
		},
		/**
		 * Populate the World with Items
		 * @returns {undefined}
		 */
		populate: function () {
			for (var k = 0; k < this.numItems; k++) {
				var x = convnetjs.randf(20, this.W - 20),
					y = convnetjs.randf(20, this.H - 20),
					type = convnetjs.randi(1, 3), // food or poison (1 and 2)
					item = new Item(x, y, type);
				this.items.push(item);
			}
		},
		drawSelf: function () {
			this.ctx.clearRect(0, 0, this.W, this.H);
			this.ctx.lineWidth = 1;

			// Draw the walls in environment
			this.ctx.strokeStyle = "rgb(0,0,0)";
			this.ctx.beginPath();
			for (var i = 0, n = this.cells.length; i < n; i++) {
				var q = this.cells[i];
				this.ctx.moveTo(q.v1.x, q.v1.y);
				this.ctx.lineTo(q.v2.x, q.v2.y);
			}
			this.ctx.stroke();

			// Draw the agents
			for (var i = 0, n = this.agents.length; i < n; i++) {
				var agent = this.agents[i],
					brain = agent.brain,
					// Color the agents based on the reward it is experiencing at the moment
					reward = Math.floor(brain.latest_reward * 200),
					rewardColor = (reward > 255) ? 255 : ((reward < 0) ? 0 : reward),
					avgR = brain.avgRewardWindow.getAverage().toFixed(1),
					avgRColor = (avgR > .8) ? 255 : ((avgR < .7) ? 0 : avgR);

				this.ctx.fillStyle = "rgb(" + avgRColor + ", 150, 150)";
				this.ctx.strokeStyle = "rgb(0,0,0)";

				// Draw agents body
				this.ctx.beginPath();
				this.ctx.arc(agent.oldPos.x, agent.oldPos.y, agent.rad, 0, Math.PI * 2, true);
				this.ctx.fill();
				this.ctx.fillText(i + " (" + avgR + ")", agent.oldPos.x + agent.rad * 2, agent.oldPos.y + agent.rad * 2);
				this.ctx.stroke();

				// Draw agents sight
				for (var ei = 0, nEye = agent.numEyes; ei < nEye; ei++) {
					var eye = agent.eyes[ei],
						eyeProx = eye.sensedProximity;
					// Is it wall or nothing?
					if (eye.sensedType === -1 || eye.sensedType === 0) {
						this.ctx.strokeStyle = "rgb(0,0,0)";
					}
					// It is noms
					if (eye.sensedType === 1) {
						this.ctx.strokeStyle = "rgb(255,150,150)";
					}
					// It is gnar gnar
					if (eye.sensedType === 2) {
						this.ctx.strokeStyle = "rgb(150,255,150)";
					}

					var aEyeX = agent.oldPos.x + eyeProx * Math.sin(agent.oldAngle + eye.angle),
						aEyeY = agent.oldPos.y + eyeProx * Math.cos(agent.oldAngle + eye.angle);

					// Draw the agent's line of sights
					this.ctx.beginPath();
					this.ctx.moveTo(agent.oldPos.x, agent.oldPos.y);
					this.ctx.lineTo(aEyeX, aEyeY);
					this.ctx.stroke();
				}
				agent.brain.visSelf(document.getElementById('brain_info_div_' + i));
			}

			// Draw items
			this.ctx.strokeStyle = "rgb(0,0,0)";
			for (var i = 0, n = this.items.length; i < n; i++) {
				var item = this.items[i];
				if (item.type === 1)
					this.ctx.fillStyle = "rgb(255, 150, 150)";
				if (item.type === 2)
					this.ctx.fillStyle = "rgb(150, 255, 150)";
				this.ctx.beginPath();
				this.ctx.arc(item.pos.x, item.pos.y, item.rad, 0, Math.PI * 2, true);
				this.ctx.fill();
				this.ctx.stroke();
			}
		},
		drawBubble: function(x, y, w, h, radius) {
			var r = x + w;
			var b = y + h;
			this.ctx.beginPath();
			this.ctx.strokeStyle = "black";
			this.ctx.lineWidth = "2";
			this.ctx.moveTo(x + radius, y);
			this.ctx.lineTo(x + radius / 2, y - 10);
			this.ctx.lineTo(x + radius * 2, y);
			this.ctx.lineTo(r - radius, y);
			this.ctx.quadraticCurveTo(r, y, r, y + radius);
			this.ctx.lineTo(r, y + h - radius);
			this.ctx.quadraticCurveTo(r, b, r - radius, b);
			this.ctx.lineTo(x + radius, b);
			this.ctx.quadraticCurveTo(x, b, x, b - radius);
			this.ctx.lineTo(x, y + radius);
			this.ctx.quadraticCurveTo(x, y, x + radius, y);
			this.ctx.stroke();
		},
		drawRect: function(x, y, w, h) {
			this.ctx.beginPath();
			this.ctx.rect(x, y, w, h);
			this.ctx.closePath();
			this.ctx.fill();
			this.ctx.stroke();
		},
		drawCircle: function(x, y, r) {
			this.ctx.beginPath();
			this.ctx.arc(x, y, r, 0, Math.PI * 2, true);
			this.ctx.closePath();
			this.ctx.stroke();
			this.ctx.fill();
		}
	};

	global.World = World;

}(this));