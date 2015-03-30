/**
 * Reward graph
 * @type {cnnvis.Graph}
 */
var reward_graph = new cnnvis.Graph();

/**
 * Global world object
 * @type {World}
 */
var w;

/**
 * Canvas
 * @type {Canvas}
 */
var canvas;

/**
 * Canvas context
 * @type {Graph.context}
 */
var ctx;

/**
 * Interval id
 * @type {Number}
 */
var current_interval_id;

/**
 * Whether to skip redraw or not
 * @type {Boolean}
 */
var skipdraw = false;

/**
 * Simulation speed
 * @type {Number}
 */
var simspeed = 2;

/**
 * Tick the world
 */
function tick() {
	w.tick();
	if (!skipdraw || w.clock % 50 === 0) {
		draw();
		draw_stats();
		draw_net();
	}
}

/**
 * Reload, hit reset button on the world
 */
function reload() {
	w.agents = [new Agent()]; // this should simply work. I think... ;\
	reward_graph = new cnnvis.Graph(); // reinit
}

/**
 * Set the simulation speed
 * @param {String} speed
 */
function go(speed) {
	window.clearInterval(current_interval_id);
	skipdraw = false;
	if (speed === 'min') {
		current_interval_id = setInterval(tick, 200);
		simspeed = 0;
	} else if (speed === 'mid') {
		current_interval_id = setInterval(tick, 30);
		simspeed = 1;
	} else if (speed === 'max') {
		current_interval_id = setInterval(tick, 0);
		simspeed = 2;
	} else if (speed === 'max+') {
		current_interval_id = setInterval(tick, 0);
		skipdraw = true;
		simspeed = 3;
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
	stoplearn(); // also stop learning
	gonormal();
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
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.lineWidth = 1;

	// Draw the walls in environment
 	ctx.strokeStyle = "rgb(0,0,0)";
 	ctx.beginPath();
 	for (var i = 0, n = w.walls.length; i < n; i++) {
 		var q = w.walls[i];
 		ctx.moveTo(q.v1.x, q.v1.y);
 		ctx.lineTo(q.v2.x, q.v2.y);
 	}
 	ctx.stroke();

	// Draw the agents
	for (var i = 0, n = w.agents.length; i < n; i++) {
		var agent = w.agents[i],
			brain = agent.brain,
			// Color the agents based on the reward it is experiencing at the moment
			reward = Math.floor(brain.latest_reward * 200),
			rewardColor = (reward > 255) ? 255 : ((reward < 0) ? 0 : reward),
			avgReward = brain.average_reward_window.get_average().toFixed(2),
			loc = ((i * 100) + n) + 10;

		ctx.fillStyle = "rgb(" + rewardColor + ", 150, 150)";
		ctx.strokeStyle = "rgb(0,0,0)";

		// Draw agents body
		ctx.beginPath();
		ctx.arc(agent.oldPos.x, agent.oldPos.y, agent.rad, 0, Math.PI * 2, true);
		ctx.fill();
		ctx.fillText(i + " (" + avgReward + ")", agent.oldPos.x + agent.rad * 2, agent.oldPos.y + agent.rad * 2);
		ctx.stroke();

		// Draw agents sight
		for (var ei = 0, nEye = agent.numEyes; ei < nEye; ei++) {
			var eye = agent.eyes[ei],
				eyeProx = eye.sensedProximity;
			// Is it wall or nothing?
			if (eye.sensedType === -1 || eye.sensedType === 0) {
				ctx.strokeStyle = "rgb(0,0,0)";
			}
			// It is noms
			if (eye.sensedType === 1) {
				ctx.strokeStyle = "rgb(255,150,150)";
			}
			// It is gnar gnar
			if (eye.sensedType === 2) {
				ctx.strokeStyle = "rgb(150,255,150)";
			}

			var aEyeX = agent.oldPos.x + eyeProx * Math.sin(agent.oldAngle + eye.angle);
			var aEyeY = agent.oldPos.y + eyeProx * Math.cos(agent.oldAngle + eye.angle);

			// Draw the agent's line of sights
			ctx.beginPath();
			ctx.moveTo(agent.oldPos.x, agent.oldPos.y);
			ctx.lineTo(aEyeX, aEyeY);
			ctx.stroke();
		}
	}

	// Draw items
	ctx.strokeStyle = "rgb(0,0,0)";
	for (var i = 0, n = w.items.length; i < n; i++) {
		var item = w.items[i];
		if (item.type === 1)
			ctx.fillStyle = "rgb(255, 150, 150)";
		if (item.type === 2)
			ctx.fillStyle = "rgb(150, 255, 150)";
		ctx.beginPath();
		ctx.arc(item.pos.x, item.pos.y, item.rad, 0, Math.PI * 2, true);
		ctx.fill();
		ctx.stroke();
	}

	for (var i = 0, n = w.agents.length; i < n; i++) {
		w.agents[i].brain.visSelf(document.getElementById('brain_info_div_' + i));
	}
}

/**
 *
 * @returns {undefined}
 */
function draw_net() {
	if (simspeed <= 1) {
		// we will always draw at these speeds
	} else {
		if (w.clock % 50 !== 0)
			return;  // do this sparingly
	}

	var canvas = document.getElementById("net_canvas"),
		ctx = canvas.getContext("2d"),
		W = canvas.width,
		H = canvas.height,
		L = w.agents[0].brain.value_net.layers,
		dx = (W - 50) / L.length,
		X = 10,
		Y = 40;

	ctx.clearRect(0, 0, W, H);
	ctx.font = "12px Verdana";
	ctx.fillStyle = "rgb(0,0,0)";
	ctx.fillText("Value Function Approximating Neural Network:", 10, 14);
	for (var k = 0; k < L.length; k++) {
		if (typeof (L[k].out_act) === 'undefined') {
			continue; // maybe not yet ready
		}
		var kw = L[k].out_act.w,
				n = kw.length,
				dy = (H - 50) / n;

		ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillText(L[k].layer_type + "(" + n + ")", X, 35);
		for (var q = 0; q < n; q++) {
			var v = Math.floor(kw[q] * 100);
			if (v >= 0)
				ctx.fillStyle = "rgb(0,0," + v + ")";
			if (v < 0)
				ctx.fillStyle = "rgb(" + (-v) + ",0,0)";
			ctx.fillRect(X, Y, 10, 10);
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
 * Draw the graphs
 * @returns {undefined}
 */
function draw_stats() {
	var canvas = document.getElementById("vis_canvas"),
		ctx = canvas.getContext("2d"),
		W = canvas.width,
		H = canvas.height,
		agent = w.agents[0],
		brain = agent.brain,
		netin = brain.last_input_array;

	ctx.clearRect(0, 0, W, H);
	ctx.strokeStyle = "rgb(0,0,0)";
	ctx.font = "12px Verdana";
	ctx.fillText("Current state:", 10, 10);
	ctx.lineWidth = 10;
	ctx.beginPath();

	for (var k = 0, n = netin.length; k < n; k++) {
		ctx.moveTo(10 + k * 12, 120);
		ctx.lineTo(10 + k * 12, 120 - netin[k] * 100);
	}
	ctx.stroke();

	if (w.clock % 200 === 0) {
		reward_graph.add(w.clock / 200, brain.average_reward_window.get_average());
		var gcanvas = document.getElementById("graph_canvas");
		reward_graph.drawSelf(gcanvas);
	}
}

function solve() {
	w.maze.solve();
}

/**
 * Create existance!
 */
function start() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	var agents = [new Agent(), new Agent()];
	var maze = new Maze(10, 10);

	// We are going to use a maze for the environment and give it one agent
	w = new World(maze, agents);
	w.maze = maze;
	w.agents = agents;
	w.memoryBank = document.getElementById('memoryBank').value;
	w.brainSpecs = document.getElementById('brainSpecs').value;

	go('mid');
}
