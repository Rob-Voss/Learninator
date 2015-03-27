/**
 * Make a World
 * @returns {World}
 */
var World = function (environment, agents) {
	this.W = canvas.width;
	this.H = canvas.height;

	this.walls = environment.generate();
	this.agents = agents;
	this.items = [];

	this.clock = 0;
	this.numItems = 30;
};

/**
 * World
 * @type type
 */
World.prototype = {
	/**
	 * A helper function to get closest colliding walls/items
	 * @param {Vec} v1
	 * @param {Vec} v2
	 * @param {Boolean} checkWalls
	 * @param {Boolean} checkItems
	 */
	collisionCheck: function (v1, v2, checkWalls, checkItems) {
		var minRes = false;

		// Collide with walls
		if (checkWalls) {
			for (var i = 0, n = this.walls.length; i < n; i++) {
				var wall = this.walls[i],
					wResult = lineIntersect(v1, v2, wall.v1, wall.v2);
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
					iResult = linePointIntersect(v1, v2, item.pos, item.rad);
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

			// The agent is trying to move from pos to oPos so we need to check walls
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
	populate: function () {
		for (var k = 0; k < this.numItems; k++) {
			var x = convnetjs.randf(20, this.W - 20),
				y = convnetjs.randf(20, this.H - 20),
				type = convnetjs.randi(1, 3), // food or poison (1 and 2)
				item = new Item(x, y, type);
			this.items.push(item);
		}
	}
};
