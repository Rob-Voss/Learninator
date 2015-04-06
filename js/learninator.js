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

	var agents = [new Agent(10), new Agent(10)];

	var maze = new Maze(worldCanvas, 5, 5);
	maze.generate();
	maze.draw();

	// We are going to use a maze for the environment and give it two agents
	w = new World(worldCanvas, maze.walls, agents);

	w.maze = maze;
	w.agents = agents;
	w.memoryBank = document.getElementById('memoryBank');
	w.brainSpecs = document.getElementById('brainSpecs');
	w.rewardGraph = new MultiGraph([0,1]);

	go('max');
}

/**
 * Tick the world
 */
function tick() {
	w.tick();
	if (!skipDraw || w.clock % 50 === 0) {
		drawWorld();
		drawStats("graph_canvas", "vis_canvas");
		drawNet("net_canvas");
	}
}

/**
 * Reload, hit reset button on the world
 */
function reload() {
	w.agents = [new Agent(10), new Agent(10)];
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
	w.memoryBank.value = net + ']';
}

/**
 * Load the brains from the field
 * @returns {undefined}
 */
function loadMemory() {
	var m = JSON.parse(w.memoryBank.value);
	stopLearnin();
	for (var i = 0, n = m.length; i < n; i++) {
		w.agents[i].brain.value_net.fromJSON(m[i]);
	}
	go('mid');
}

/**
 * Get to learninating
 * @param {Number} id
 * @returns {undefined}
 */
function startLearnin(id) {
	if (id === undefined) {
		for (var i = 0, n = w.agents.length; i < n; i++) {
			w.agents[i].brain.learning = true;
		}
	} else {
		w.agents[id].brain.learning = true;
	}
}

/**
 * Stop learninating
 * @param {Number} id
 * @returns {undefined}
 */
function stopLearnin(id) {
	if (id === undefined) {
		for (var i = 0, n = w.agents.length; i < n; i++) {
			w.agents[i].brain.learning = false;
		}
	} else {
		w.agents[id].brain.learning = false;
	}
}

/**
 * Draw ALL TEH THINGS!!
 * @returns {undefined}
 */
function drawWorld() {
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
			loc = ((i * 100) + n) + 10;

		var avgR = brain.avgRewardWindow.getAverage().toFixed(1),
			avgRColor = (avgR > .8) ? 255 : ((avgR < .7) ? 0 : avgR);

		worldCtx.fillStyle = "rgb(" + avgRColor + ", 150, 150)";
		worldCtx.strokeStyle = "rgb(0,0,0)";

		// Draw agents body
		worldCtx.beginPath();
		worldCtx.arc(agent.oldPos.x, agent.oldPos.y, agent.rad, 0, Math.PI * 2, true);
		worldCtx.fill();
		worldCtx.fillText(i + " (" + avgR + ")", agent.oldPos.x + agent.rad * 2, agent.oldPos.y + agent.rad * 2);
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
		agent.brain.visSelf(document.getElementById('brain_info_div_' + i));
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
}

/**
 * Draw the neural network representation
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
		avgWins = [];

	visCtx.clearRect(0, 0, W, H);
	visCtx.strokeStyle = "rgb(0,0,0)";
	visCtx.font = "12px Verdana";
	visCtx.fillText("Current state:", 10, 10);
	visCtx.lineWidth = 10;

	for (var i = 0, n = w.agents.length; i < n; i++) {
		var agent = w.agents[i],
			brain = agent.brain,
			netin = brain.last_input_array;

		visCtx.beginPath();
		for (var k = 0, nl = netin.length; k < nl; k++) {
			visCtx.moveTo(10 + k * 12, 120);
			visCtx.lineTo(10 + k * 12, 120 - netin[k] * 100);
		}
		visCtx.stroke();
		avgWins.push(brain.avgRewardWindow.getAverage());
	}
	if (w.clock % 200 === 0) {
		w.rewardGraph.add(w.clock / 200, avgWins);
		w.rewardGraph.drawSelf(graphCanvas);
	}
}
