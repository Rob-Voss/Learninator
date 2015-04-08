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
 * Canvas
 * @type {Canvas}
 */
var graphCanvas;

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
	graphCanvas = document.getElementById("graph_canvas");

	var agents = [new Agent(10), new Agent(10)];
	var maze = new Maze(worldCanvas, 5, 5);
	maze.generate();
	maze.draw();

	// We are going to use a maze for the environment and give it two agents
	w = new World(worldCanvas, maze.cells, agents);

	// Globals blech
	w.memoryBank = document.getElementById('memoryBank');
	w.brainSpecs = document.getElementById('brainSpecs');

	w.rewardGraph = new Graph(graphCanvas.width, graphCanvas.height, [0,1]);

	go('mid');
}

function mouseClick (x, y) {
	w.drawBubble(x, y, 20, 20, 10);
	console.log(x + ':' + y);
};

function keyUp (key) {
	if (TICK === null) {
		TICK = setInterval(this.NPG.NPGtick, 1000 / this.NPG.FPS);
	} else {
		clearInterval(TICK);
		TICK = null;
	}
	console.log(key);
};

function keyDown (key) {
	console.log(key);
};

/**
 * Tick the world
 */
function tick() {
	w.tick();
	if (!skipDraw || w.clock % 50 === 0) {
		w.drawSelf();
		drawStats();
	}
}

/**
 * Reload, hit reset button on the world
 */
function reload() {
	w.agents = [new Agent(10), new Agent(10)];
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
 * Draw the neural network representation
 * @returns {undefined}
 */
function drawNet() {
	if (simSpeed <= 1) {
		// we will always draw at these speeds
	} else {
		if (w.clock % 50 !== 0)
			return;  // do this sparingly
	}

	for (var i = 0, n = w.agents.length; i < n; i++) {
		var netCanvas = document.getElementById("net_canvas_" + i),
			netCtx = netCanvas.getContext("2d"),
			W = netCanvas.width,
			H = netCanvas.height,
			X = 10,
			Y = 40;
		netCtx.clearRect(0, 0, W, H);
		netCtx.font = "12px Verdana";
		netCtx.fillStyle = "rgb(0,0,0)";
		netCtx.fillText("Value Function Approximating Neural Network:", 10, 14);

		var L = w.agents[i].brain.value_net.layers;

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
}

/**
 * Draw the graphs and visualizations
 * @returns {undefined}
 */
function drawStats() {
	var pts = [];
	for (var i = 0, n = w.agents.length; i < n; i++) {
		var visCanvas = document.getElementById("vis_canvas_" + i),
			visCtx = visCanvas.getContext("2d"),
			W = visCanvas.width,
			H = visCanvas.height;

		visCtx.clearRect(0, 0, W, H);
		visCtx.strokeStyle = "rgb(0,0,0)";
		visCtx.font = "12px Verdana";
		visCtx.fillText("Current state:", 10, 10);
		visCtx.lineWidth = 10;

		var agent = w.agents[i],
			brain = agent.brain,
			netin = brain.last_input_array;

		visCtx.beginPath();
		for (var k = 0, nl = netin.length; k < nl; k++) {
			visCtx.moveTo(10 + k * 12, 120);
			visCtx.lineTo(10 + k * 12, 120 - netin[k] * 100);
		}
		visCtx.stroke();
		pts.push(brain.avgRewardWindow.getAverage());
	}

	if (w.clock % 200 === 0) {
		w.rewardGraph.addPoint(w.clock / 200, pts);
		w.rewardGraph.drawPoints(graphCanvas);
	}
}
