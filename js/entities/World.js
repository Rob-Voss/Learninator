var canvas, ctx;

/**
 * Wall is made up of two Vectors
 * @param {Vec} v1
 * @param {Vec} v2
 * @returns {Wall}
 */
var Wall = function (v1, v2) {
	this.v1 = v1;
	this.v2 = v2;
};

/**
 * Make a World
 * @returns {World}
 */
var World = function () {
	this.agents = [];
	this.walls = [];

	this.W = canvas.width;
	this.H = canvas.height;
	this.clock = 0;

	var pad = 10;
	// e.g. [Current Walls, Xloc, Yloc, Width, Height]
	utilAddBox(this.walls, pad, pad, this.W - pad * 2, this.H - pad * 2); // Initial wall
	// utilAddBox(this.walls, 100, 100, 200, 300); // Left wall
	// this.walls.pop();
	// utilAddBox(this.walls, 130, 130, 140, 240); // Left inner wall
	// this.walls.pop();
	// utilAddBox(this.walls, 160, 160, 80, 180); // Left inner wall
	// this.walls.pop();
	// utilAddBox(this.walls, 400, 100, 200, 300); // Right wall
	// this.walls.pop();
	// utilAddBox(this.walls, 430, 130, 140, 240); // Right inner wall
	// this.walls.pop();
	// utilAddBox(this.walls, 460, 160, 80, 180); // Right inner wall
	// this.walls.pop();

	// set up food and poison
	this.items = [];
	for (var k = 0; k < 30; k++) {
		var x = convnetjs.randf(20, this.W - 20),
				y = convnetjs.randf(20, this.H - 20),
				type = convnetjs.randi(1, 3), // food or poison (1 and 2)
				item = new Item(x, y, type);
		this.items.push(item);
	}
};

/**
 *
 * @type type
 */
World.prototype = {
	/**
	 * A helper function to get closest colliding walls/items
	 * @param {Vec} v1
	 * @param {Vec} v2
	 * @param {Boolean} checkWalls
	 * @param {Boolean} checkItems
	 * @returns {linePointIntersect.learninatorAnonym$1|resultld.prototype.collisionCheck.res|lineIntersect.learninatorAnonym$0|Boolean|minResprototype.collisionCheck.minres}
	 */
	collisionCheck: function (v1, v2, checkWalls, checkItems) {
		var minRes = false;

		// Collide with walls
		if (checkWalls) {
			for (var i = 0, n = this.walls.length; i < n; i++) {
				var wall = this.walls[i],
						result = lineIntersect(v1, v2, wall.v1, wall.v2);
				if (result) {
					result.type = 0; // 0 is wall
					if (!minRes) {
						minRes = result;
					} else {
						// Check if it's closer
						if (result.vecX < minRes.vecX) {
							// If yes, replace it
							minRes = result;
						}
					}
				}
			}
		}

		// Collide with items
		if (checkItems) {
			for (var i = 0, n = this.items.length; i < n; i++) {
				var item = this.items[i],
						result = linePointIntersect(v1, v2, item.pos, item.rad);
				if (result) {
					result.type = item.type; // Store type of item
					if (!minRes) {
						minRes = result;
					} else {
						if (result.vecX < minRes.vecX) {
							minRes = result;
						}
					}
				}
			}
		}

		return minRes;
	},
	/**
	 * Tick the environment
	 * @returns {undefined}
	 */
	tick: function () {
		this.clock++;

		// Fix input to all agents based on environment and process their eyes
		this.collpoints = [];
		for (var i = 0, n = this.agents.length; i < n; i++) {
			var agent = this.agents[i];
			for (var ei = 0, ne = agent.eyes.length; ei < ne; ei++) {
				var e = agent.eyes[ei],
						X = agent.pos.x + e.maxRange * Math.sin(agent.angle + e.angle),
						Y = agent.pos.y + e.maxRange * Math.cos(agent.angle + e.angle),
						// We have a line from p to p->eyep
						eyep = new Vec(X, Y),
						result = this.collisionCheck(agent.pos, eyep, true, true);
				if (result) {
					// eye collided with wall
					e.sensedProximity = result.vecI.distFrom(agent.pos);
					e.sensedType = result.type;
				} else {
					e.sensedProximity = e.maxRange;
					e.sensedType = -1;
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

			// The agent is trying to move from pos to oPos so we need to check walls
			var result = this.collisionCheck(agent.oldPos, agent.pos, true, false);
			if (result) {
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
					var rescheck = this.collisionCheck(agent.pos, item.pos, true, false);
					if (!rescheck) {
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

		// This is where the agents learns based on the feedback of their actions on theenvironment
		for (var i = 0, n = this.agents.length; i < n; i++) {
			this.agents[i].backward();
		}
	}
};
