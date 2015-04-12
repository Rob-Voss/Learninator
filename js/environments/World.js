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
		this.width = canvas.width;
		this.height = canvas.height;

		this.cells = cells;
		this.agents = agents;
		this.items = [];

		this.simSpeed = 1;
		this.interval = 60;
		this.clock = 0;
		this.numItems = 20;

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

		var myState = this;

		// This fixes a problem where double clicking causes text to get selected on the canvas
		this.canvas.addEventListener('selectstart', function (e) {
			e.preventDefault();
			return false;
		}, false);

		// Up, down, and move are for dragging
		this.canvas.addEventListener('mousedown', function (e) {
			myState.mouseDown(e);
		}, true);

		// Track the mouse movement
		this.canvas.addEventListener('mousemove', function (e) {
			myState.mouseMove(e);
		}, true);

		// Track when the mouse selection is let go of
		this.canvas.addEventListener('mouseup', function (e) {
			myState.mouseUp(e);
		}, true);

		// Double click for making new items
		this.canvas.addEventListener('dblclick', function (e) {
			myState.doubleClick(e);
		}, true);

		setInterval(function () {
			myState.tick();
			if (!myState.valid || myState.clock % 50 === 0) {
				myState.drawSelf();
			}
		}, myState.interval);
	};

	/**
	 * World
	 * @type World
	 */
	World.prototype = {
		/**
		 * Add an item to the canvas
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
		 * A helper function to get closest colliding cells/items
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
				for (var i = 0, n = this.cells.length; i < n; i++) {
					var cell = this.cells[i];
					var wResult = Utility.lineIntersect(v1, v2, cell.v1, cell.v2);
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
				for (var i = 0, n = this.items.length; i < n; i++) {
					var item = this.items[i],
						iResult = Utility.linePointIntersect(v1, v2, item.pos, item.radius);
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
			if (typeof checkAgents !== 'undefined') {
				for (var i = 0, n = this.agents.length; i < n; i++) {
					var agent = this.agents[i],
						iResult = Utility.linePointIntersect(v1, v2, agent.pos, agent.radius);
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
		 * Creates an object with x and y defined, set to the mouse position relative
		 * to the state's canvas. If you wanna be super-correct this can be tricky,
		 * we have to worry about padding and borders
		 * @param {MouseEvent} e
		 * @returns {CanvasState_L3.CanvasState.prototype.getMouse.CanvasStateAnonym$0}
		 */
		getMouse: function (e) {
			var element = this.canvas,
				offset = new Vec(0,0);

			// Compute the total offset
			if (element.offsetParent !== undefined) {
				do {
					offset.x += element.offsetLeft;
					offset.y += element.offsetTop;
				} while ((element = element.offsetParent));
			}

			// Add padding and border style widths to offset
			// Also add the <html> offsets in case there's a position:fixed bar
			offset.x += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
			offset.y += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

			// We return a simple javascript object (a hash) with x and y defined
			var mouseLoc = new Vec(e.pageX - offset.x, e.pageY - offset.y);

			return mouseLoc;
		},
		/**
		 * Mouse move
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		mouseMove: function (e) {
			if (this.dragging) {
				var mouse = this.getMouse(e);
				// We don't want to drag the object by its top-left corner, we want to drag it
				// from where we clicked. Thats why we saved the offset and use it here
				this.selection.pos = new Vec(mouse.x - this.dragoff.x, mouse.y - this.dragoff.y);
				this.valid = false; // Something's dragging so we must redraw
			} else {
				console.log();
			}
		},
		/**
		 * Mouse release
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		mouseUp: function (e) {
			var mouse = this.getMouse(e);
			if (this.selection) {
				this.selection.pos = new Vec(mouse.x - this.dragoff.x, mouse.y - this.dragoff.y);
			}
			this.dragging = false;
		},
		/**
		 * Mouse click
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		mouseDown: function (e) {
			var mouse = this.getMouse(e);
			for (var i = this.items.length - 1; i >= 0; i--) {
				if (this.items[i].contains(mouse)) {
					var mySel = this.items[i];
					// Keep track of where in the object we clicked
					// so we can move it smoothly (see mousemove)
					this.dragoff.x = mouse.x - mySel.pos.x;
					this.dragoff.y = mouse.y - mySel.pos.y;
					this.dragging = true;
					this.selection = mySel;
					this.valid = false;
					return;
				}
			}
			// If we haven't returned, it means that we have failed to select anything.
			if (this.selection) {
				// If there was an object selected, we deselect it
				this.selection = null;
				this.valid = false; // Need to clear the old selection border
			}
		},
		/**
		 * Double click with the mouse
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		doubleClick: function (e) {
			var mouse = this.getMouse(e),
				type = convnetjs.randi(1, 3),
				r = convnetjs.randi(3, 10),
				item = new Item(type, new Vec(mouse.x, mouse.y), 0, 0, r);
			this.addItem(item);
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

				// The agent is trying to move from pos to oPos so we need to check cells
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
			for (var i = 0, n = this.items.length; i < n; i++) {
				var item = this.items[i];
				item.age += 1;

				// Did the agent find teh noms?
				for (var j = 0, m = this.agents.length; j < m; j++) {
					var agent = this.agents[j],
						d = agent.pos.distFrom(item.pos);
					if (d < item.radius + agent.radius) {
						// Check if it's on the other side of a wall
						if (!this.collisionCheck(agent.pos, item.pos, true, false)) {
							// Nom Noms!
							if (item.type === 1)
								agent.digestionSignal += 5.0 * (item.radius/2); // The sweet meats
							if (item.type === 2)
								agent.digestionSignal += -6.0 * (item.radius/2); // The gnar gnar meats
							item.cleanUp = true;
							this.valid = true;
							break; // Done consuming, move on
						}
					}
				}

				if (item.age > 5000 && this.clock % 100 === 0 && convnetjs.randf(0, 1) < 0.1) {
					// Keell it, it has been around way too long
					item.cleanUp = true;
					this.valid = true;
				}
			}

			if (this.valid) {
				var nt = [];
				for (var i = 0, n = this.items.length; i < n; i++) {
					var item = this.items[i];
					if (!item.cleanUp)
						nt.push(item);
				}
				// Swap
				this.items = nt;
			}

			if (this.items.length < this.numItems && this.clock % 10 === 0 && convnetjs.randf(0, 1) < 0.25) {
				var x = convnetjs.randf(20, this.width - 20),
					y = convnetjs.randf(20, this.height - 20),
					r = convnetjs.randi(5, 10),
					type = convnetjs.randi(1, 3), // Noms or Gnars (1 || 2)
					v = new Vec(x, y);

				this.items.push(new Item(type, v, 0, 0, r));
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
				var x = convnetjs.randf(20, this.width - 20),
					y = convnetjs.randf(20, this.height - 20),
					r = convnetjs.randi(5, 10),
					type = convnetjs.randi(1, 3), // food or poison (1 and 2)
					v = new Vec(x, y);
				this.items.push(new Item(type, v, 0, 0, r));
			}
		},
		go: function (speed) {
			clearInterval(this.interval);
			this.valid = false;
			if (speed === 'min') {
				this.interval = setInterval(this.tick(), 200);
				this.simSpeed = 0;
			} else if (speed === 'mid') {
				this.interval = setInterval(this.tick(), 30);
				this.simSpeed = 1;
			} else if (speed === 'max') {
				this.interval = setInterval(this.tick(), 0);
				this.simSpeed = 2;
			} else if (speed === 'max+') {
				this.interval = setInterval(this.tick(), 0);
				this.valid = true;
				this.simSpeed = 3;
			}
		},
		drawSelf: function () {
			this.clear();
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
				this.ctx.arc(agent.oldPos.x, agent.oldPos.y, agent.radius, 0, Math.PI * 2, true);
				this.ctx.fill();
				this.ctx.fillText(i + " (" + avgR + ")", agent.oldPos.x + agent.radius * 2, agent.oldPos.y + agent.radius * 2);
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
				this.ctx.arc(item.pos.x, item.pos.y, item.radius, 0, Math.PI * 2, true);
				this.ctx.fill();
				this.ctx.stroke();
			}
		}
	};

	global.World = World;

}(this));