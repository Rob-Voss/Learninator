/**
 * Global world object
 * @type {World}
 */
var w;

/**
 * Canvas
 * @type {Canvas}
 */
var worldCanvas;

/**
 * Canvas context
 * @type {Graph.context}
 */
var worldCtx;

/**
 * Interval id
 * @type {Number}
 */
var intervalId;

/**
 * Whether to skip redraw or not
 * @type {Boolean}
 */
var skipDraw = false;

/**
 * Simulation speed
 * @type {Number}
 */
var simSpeed = 2;

/**
 * Create existance!
 */
function start() {
	worldCanvas = document.getElementById("world_canvas");
	worldCtx = worldCanvas.getContext("2d");

	var agents = [new Agent(), new Agent()];
	var maze = new Maze(10, 10);

	// We are going to use a maze for the environment and give it one agent
	w = new World(maze, agents);
	w.maze = maze;
	w.agents = agents;
	w.memoryBank = document.getElementById('memoryBank').value;
	w.brainSpecs = document.getElementById('brainSpecs').value;
	w.rewardGraph = new MultiGraph([0,1]);

	go('mid');
}

/**
 * Tick the world
 */
function tick() {
	w.tick();
	if (!skipDraw || w.clock % 50 === 0) {
		draw();
		drawStats("graph_canvas", "vis_canvas");
		drawNet("net_canvas");
	}
}

/**
 * Reload, hit reset button on the world
 */
function reload() {
	w.agents = [new Agent(), new Agent()];
	w.rewardGraph = new MultiGraph([0,1]);
}

/**
 * Set the simulation speed
 * @param {String} speed
 */
function go(speed) {
	window.clearInterval(intervalId);
	skipDraw = false;
	if (speed === 'min') {
		intervalId = setInterval(tick, 200);
		simSpeed = 0;
	} else if (speed === 'mid') {
		intervalId = setInterval(tick, 30);
		simSpeed = 1;
	} else if (speed === 'max') {
		intervalId = setInterval(tick, 0);
		simSpeed = 2;
	} else if (speed === 'max+') {
		intervalId = setInterval(tick, 0);
		skipDraw = true;
		simSpeed = 3;
	}
}
/**
 * Download the brains to the field
 * @returns {undefined}
 */
function saveMemory() {
	var net = '[';
	for (var i = 0, n = w.agents.length; i < n; i++) {
		var j = w.agents[i].brain.value_net.toJSON(),
				t = JSON.stringify(j);
		net = net + t;
		if (n - 1 !== i) {
			net = net + ',';
		}
	}
	w.memoryBank = net + ']';
}

/**
 * Load the brains from the field
 * @returns {undefined}
 */
function loadMemory() {
	var t = w.memoryBank,
		j = JSON.parse(t);

	for (var i = 0, n = j.length; i < n; i++) {
		w.agents[i].brain.value_net.fromJSON(j[i]);
	}

	stopLearnin(); // also stop learning
	go('mid');
}

/**
 * Get to learninating
 * @returns {undefined}
 */
function startLearnin() {
	for (var i = 0, n = w.agents.length; i < n; i++) {
		w.agents[i].brain.learning = true;
	}
}

/**
 * Stop learninating
 * @returns {undefined}
 */
function stopLearnin() {
	for (var i = 0, n = w.agents.length; i < n; i++) {
		w.agents[i].brain.learning = false;
	}
}

/**
 * Draw ALL TEH THINGS!!
 * @returns {undefined}
 */
function draw() {
	worldCtx.clearRect(0, 0, worldCanvas.width, worldCanvas.height);
	worldCtx.lineWidth = 1;

	// Draw the walls in environment
 	worldCtx.strokeStyle = "rgb(0,0,0)";
 	worldCtx.beginPath();
 	for (var i = 0, n = w.walls.length; i < n; i++) {
 		var q = w.walls[i];
 		worldCtx.moveTo(q.v1.x, q.v1.y);
 		worldCtx.lineTo(q.v2.x, q.v2.y);
 	}
 	worldCtx.stroke();

	// Draw the agents
	for (var i = 0, n = w.agents.length; i < n; i++) {
		var agent = w.agents[i],
			brain = agent.brain,
			// Color the agents based on the reward it is experiencing at the moment
			reward = Math.floor(brain.latest_reward * 200),
			rewardColor = (reward > 255) ? 255 : ((reward < 0) ? 0 : reward),
			avgReward = brain.avgRewardWindow.getAverage().toFixed(2),
			loc = ((i * 100) + n) + 10;

		worldCtx.fillStyle = "rgb(" + rewardColor + ", 150, 150)";
		worldCtx.strokeStyle = "rgb(0,0,0)";

		// Draw agents body
		worldCtx.beginPath();
		worldCtx.arc(agent.oldPos.x, agent.oldPos.y, agent.rad, 0, Math.PI * 2, true);
		worldCtx.fill();
		worldCtx.fillText(i + " (" + avgReward + ")", agent.oldPos.x + agent.rad * 2, agent.oldPos.y + agent.rad * 2);
		worldCtx.stroke();

		// Draw agents sight
		for (var ei = 0, nEye = agent.numEyes; ei < nEye; ei++) {
			var eye = agent.eyes[ei],
				eyeProx = eye.sensedProximity;
			// Is it wall or nothing?
			if (eye.sensedType === -1 || eye.sensedType === 0) {
				worldCtx.strokeStyle = "rgb(0,0,0)";
			}
			// It is noms
			if (eye.sensedType === 1) {
				worldCtx.strokeStyle = "rgb(255,150,150)";
			}
			// It is gnar gnar
			if (eye.sensedType === 2) {
				worldCtx.strokeStyle = "rgb(150,255,150)";
			}

			var aEyeX = agent.oldPos.x + eyeProx * Math.sin(agent.oldAngle + eye.angle);
			var aEyeY = agent.oldPos.y + eyeProx * Math.cos(agent.oldAngle + eye.angle);

			// Draw the agent's line of sights
			worldCtx.beginPath();
			worldCtx.moveTo(agent.oldPos.x, agent.oldPos.y);
			worldCtx.lineTo(aEyeX, aEyeY);
			worldCtx.stroke();
		}
	}

	// Draw items
	worldCtx.strokeStyle = "rgb(0,0,0)";
	for (var i = 0, n = w.items.length; i < n; i++) {
		var item = w.items[i];
		if (item.type === 1)
			worldCtx.fillStyle = "rgb(255, 150, 150)";
		if (item.type === 2)
			worldCtx.fillStyle = "rgb(150, 255, 150)";
		worldCtx.beginPath();
		worldCtx.arc(item.pos.x, item.pos.y, item.rad, 0, Math.PI * 2, true);
		worldCtx.fill();
		worldCtx.stroke();
	}

	for (var i = 0, n = w.agents.length; i < n; i++) {
		w.agents[i].brain.visSelf(document.getElementById('brain_info_div_' + i));
	}
}

/**
 * Draw the neural network
 * @param {String} netElement
 * @returns {undefined}
 */
function drawNet(netElement) {
	if (simSpeed <= 1) {
		// we will always draw at these speeds
	} else {
		if (w.clock % 50 !== 0)
			return;  // do this sparingly
	}

	var netCanvas = document.getElementById(netElement),
		netCtx = netCanvas.getContext("2d"),
		W = netCanvas.width,
		H = netCanvas.height,
		L = w.agents[0].brain.value_net.layers,
		dx = (W - 50) / L.length,
		X = 10,
		Y = 40;

	netCtx.clearRect(0, 0, W, H);
	netCtx.font = "12px Verdana";
	netCtx.fillStyle = "rgb(0,0,0)";
	netCtx.fillText("Value Function Approximating Neural Network:", 10, 14);

	for (var k = 0; k < L.length; k++) {
		if (typeof (L[k].out_act) === 'undefined') {
			continue; // maybe not yet ready
		}
		var kw = L[k].out_act.w,
				n = kw.length,
				dy = (H - 50) / n;

		netCtx.fillStyle = "rgb(0,0,0)";
		netCtx.fillText(L[k].layer_type + "(" + n + ")", X, 35);
		for (var q = 0; q < n; q++) {
			var v = Math.floor(kw[q] * 100);
			if (v >= 0)
				netCtx.fillStyle = "rgb(0,0," + v + ")";
			if (v < 0)
				netCtx.fillStyle = "rgb(" + (-v) + ",0,0)";
			netCtx.fillRect(X, Y, 10, 10);
			Y += 12;
			if (Y > H - 25) {
				Y = 40;
				X += 12;
			}
		}
		X += 50;
		Y = 40;
	}
}

/**
 * Draw the graphs and visualizations
 * @param {String} graphElement
 * @param {String} visElement
 * @returns {undefined}
 */
function drawStats(graphElement, visElement) {
	var visCanvas = document.getElementById(visElement),
		graphCanvas = document.getElementById(graphElement),
		visCtx = visCanvas.getContext("2d"),
		W = visCanvas.width,
		H = visCanvas.height,
		agent = w.agents[0],
		brain = agent.brain,
		netin = brain.last_input_array;

	visCtx.clearRect(0, 0, W, H);
	visCtx.strokeStyle = "rgb(0,0,0)";
	visCtx.font = "12px Verdana";
	visCtx.fillText("Current state:", 10, 10);
	visCtx.lineWidth = 10;
	visCtx.beginPath();

	for (var k = 0, n = netin.length; k < n; k++) {
		visCtx.moveTo(10 + k * 12, 120);
		visCtx.lineTo(10 + k * 12, 120 - netin[k] * 100);
	}
	visCtx.stroke();

	if (w.clock % 200 === 0) {
		w.rewardGraph.add(w.clock / 200, brain.avgRewardWindow.getAverage());
		w.rewardGraph.drawSelf(graphCanvas);
	}
}

/**
 * Line intersection helper function: line segment (v1,v2) intersect segment (v3,v4)
 * @param {Vec} v1
 * @param {Vec} v2
 * @param {Vec} v3
 * @param {Vec} v4
 * @returns {Object|Boolean}
 */
var lineIntersect = function (v1, v2, v3, v4) {
	// Line 1: 1st Point
	var x1 = v1.x,
		y1 = v1.y,
		// Line 1: 2nd Point
		x2 = v2.x,
		y2 = v2.y,
		// Line 2: 1st Point
		x3 = v3.x,
		y3 = v3.y,
		// Line 2: 2nd Point
		x4 = v4.x,
		y4 = v4.y,
		denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

	if (denom === 0.0) {
		// Parallel lines if it be this yar!
		return false;
	}

	var pX = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom,
		pY = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

	if (pX > 0.0 && pX < 1.0 && pY > 0.0 && pY < 1.0) {
		// Intersection point
		var vecI = new Vec(x1 + pX * (x2 - x1), y1 + pX * (y2 - y1));

		return {
			vecX: pX,
			vecY: pY,
			vecI: vecI
		};
	}
	return false;
};

/**
 * Returns min, max and indeces of an array
 * @param {Array} arr
 * @returns {Object}
 */
var maxmin = function (arr) {
	if (arr.length === 0) {
		return {};
	}

	var maxv = arr[0],
		minv = arr[0],
		maxi = 0,
		mini = 0;

	for (var i = 1; i < arr.length; i++) {
		if (arr[i] > maxv) {
			maxv = arr[i];
			maxi = i;
		}
		if (arr[i] < minv) {
			minv = arr[i];
			mini = i;
		}
	}

	return {
		maxi: maxi,
		maxv: maxv,
		mini: mini,
		minv: minv,
		dv: maxv - minv
	};
};

/**
 * Returns string representation of float but truncated to length of d digits
 * @param {Number} x
 * @param {Number} d
 * @returns {String}
 */
var f2t = function (x, d) {
	if (typeof (d) === 'undefined') {
		var d = 5;
	}
	var dd = 1.0 * Math.pow(10, d);

	return '' + Math.floor(x * dd) / dd;
};

/**
 * Find the position of intersect between a line and a point
 * @param {Vec} v1
 * @param {Vec} v2
 * @param {Vec} v0
 * @param {Number} rad
 * @returns {Object|Boolean}
 */
var linePointIntersect = function (v1, v2, v0, rad) {
	// Create a perpendicular vector
	var x = v2.y - v1.y,
		y = v2.x - v1.x,
		xDiff = v1.y - v0.y,
		yDiff = v1.x - v0.x,
		v = new Vec(x, -y),
		d = Math.abs(y * xDiff - yDiff * x),
		vecX = 0;

	d = d / v.length();
	if (d > rad) {
		return false;
	}

	v.normalize();
	v.scale(d);

	var vecI = v0.add(v);
	if (Math.abs(y) > Math.abs(x)) {
		vecX = (vecI.x - v1.x) / (y);
	} else {
		vecX = (vecI.y - v1.y) / (x);
	}
	if (vecX > 0.0 && vecX < 1.0) {
		return {
			vecX: vecX,
			vecI: vecI
		};
	}
	return false;
};

/**
 * World object contains many agents and walls and food and stuff
 * @param {List} lst
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 * @returns {List}
 */
var utilAddBox = function (lst, x, y, w, h) {
	var xw = x + w,
		yh = y + h;

	lst.push(new Wall(new Vec(x, y), new Vec(xw, y)));
	lst.push(new Wall(new Vec(xw, y), new Vec(xw, yh)));
	lst.push(new Wall(new Vec(xw, yh), new Vec(x, yh)));
	lst.push(new Wall(new Vec(x, yh), new Vec(x, y)));

	return lst;
};
