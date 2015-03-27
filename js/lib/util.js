
// Simulation speed
var simspeed = 2;

/**
 *
 * @returns {undefined}
 */
function goveryfast() {
	window.clearInterval(current_interval_id);
	current_interval_id = setInterval(tick, 0);
	skipdraw = true;
	simspeed = 3;
}

/**
 *
 * @returns {undefined}
 */
function gofast() {
	window.clearInterval(current_interval_id);
	current_interval_id = setInterval(tick, 0);
	skipdraw = false;
	simspeed = 2;
}

/**
 *
 * @returns {undefined}
 */
function gonormal() {
	window.clearInterval(current_interval_id);
	current_interval_id = setInterval(tick, 30);
	skipdraw = false;
	simspeed = 1;
}

/**
 *
 * @returns {undefined}
 */
function goslow() {
	window.clearInterval(current_interval_id);
	current_interval_id = setInterval(tick, 200);
	skipdraw = false;
	simspeed = 0;
}

/**
 * Download the brains
 * @returns {undefined}
 */
function save() {
	var net = '[';
	for (var i = 0, n = w.agents.length; i < n; i++) {
		var j = w.agents[i].brain.value_net.toJSON(),
				t = JSON.stringify(j);
		net = net + t;
		if (n - 1 !== i) {
			net = net + ',';
		}
	}
	document.getElementById('tt').value = net + ']';
}

/**
 * Load the brains
 * @returns {undefined}
 */
function load() {
	var t = document.getElementById('tt').value,
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
function start() {
	for (var i = 0, n = w.agents.length; i < n; i++) {
		w.agents[i].brain.learning = true;
	}
}

/**
 * Stop learninating
 * @returns {undefined}
 */
function stop() {
	for (var i = 0, n = w.agents.length; i < n; i++) {
		w.agents[i].brain.learning = false;
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

/**
 * Draw ALL TEH THINGS!!
 * @returns {undefined}
 */
function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.lineWidth = 1;
	var agents = w.agents,
			maze = w.maze;
	maze.draw();
	// Draw the walls in environment
// 	ctx.strokeStyle = "rgb(0,0,0)";
// 	ctx.beginPath();
// 	for (var i = 0, n = w.walls.length; i < n; i++) {
// 		var q = w.walls[i];
// 		ctx.moveTo(q.v1.x, q.v1.y);
// 		ctx.lineTo(q.v2.x, q.v2.y);
// 	}
// 	ctx.stroke();

	// Draw the agents
	for (var i = 0, n = agents.length; i < n; i++) {
		var agent = agents[i],
				brain = agent.brain,
				// Color the agents based on the reward it is experiencing at the moment
				reward = Math.floor(brain.latest_reward * 200),
				r = (reward > 255) ? 255 : ((reward < 0) ? 0 : reward),
				avg = brain.average_reward_window.get_average().toFixed(4),
				loc = ((i * 100) + n) + 10;

		ctx.fillStyle = "rgb(" + r + ", 150, 150)";
		ctx.strokeStyle = "rgb(0,0,0)";

		ctx.font = "10px Courier";
		ctx.fillText(i + " Avg: " + avg, loc, 8);

		// Draw agents body
		ctx.beginPath();
		ctx.arc(agent.oldPos.x, agent.oldPos.y, agent.rad, 0, Math.PI * 2, true);
		ctx.fill();
		ctx.fillText(i, 0, 0);
		ctx.stroke();

		// Draw agents sight
		for (var ei = 0, ne = agent.eyes.length; ei < ne; ei++) {
			var e = agent.eyes[ei],
					sr = e.sensedProximity;
			// Is it wall or nothing?
			if (e.sensedType === -1 || e.sensedType === 0) {
				ctx.strokeStyle = "rgb(0,0,0)";
			}
			// It is noms
			if (e.sensedType === 1) {
				ctx.strokeStyle = "rgb(255,150,150)";
			}
			// It is gnar gnar
			if (e.sensedType === 2) {
				ctx.strokeStyle = "rgb(150,255,150)";
			}
			ctx.beginPath();
			ctx.moveTo(agent.oldPos.x, agent.oldPos.y);
			ctx.lineTo(agent.oldPos.x + sr * Math.sin(agent.oldAngle + e.angle),
					agent.oldPos.y + sr * Math.cos(agent.oldAngle + e.angle));
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
 * Line intersection helper function: line segment (v1,v2) intersect segment (v3,v4)
 * @param {Vec} v1
 * @param {Vec} v2
 * @param {Vec} v3
 * @param {Vec} v4
 * @returns {lineIntersect.learninatorAnonym$0|Boolean}
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
 * Find the position of intersect between a line and a point
 * @param {Vec} v1
 * @param {Vec} v2
 * @param {Vec} v0
 * @param {Number} rad
 * @returns {linePointIntersect.learninatorAnonym$1|Boolean}
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
 * Contains various utility functions
 * @type @exp;vis_L4@pro;exports|Function
 */
var cnnvis = (function (exports) {
	// This can be used to graph loss, or accuracy over time
	var Graph = function (options) {
		var options = options || {};
		this.step_horizon = options.step_horizon || 1000;

		this.pts = [];

		this.maxy = -9999;
		this.miny = 9999;
	};

	Graph.prototype = {
		// canv is the canvas we wish to update with this new datapoint
		add: function (step, y) {
			var time = new Date().getTime(); // in ms
			if (y > this.maxy * 0.99)
				this.maxy = y * 1.05;
			if (y < this.miny * 1.01)
				this.miny = y * 0.95;

			this.pts.push({step: step, time: time, y: y});
			if (step > this.step_horizon)
				this.step_horizon *= 2;
		},
		// elt is a canvas we wish to draw into
		drawSelf: function (canv) {

			var pad = 25;
			var H = canv.height;
			var W = canv.width;
			var ctx = canv.getContext('2d');

			ctx.clearRect(0, 0, W, H);
			ctx.font = "10px Georgia";

			var f2t = function (x) {
				var dd = 1.0 * Math.pow(10, 2);
				return '' + Math.floor(x * dd) / dd;
			};

			// draw guidelines and values
			ctx.strokeStyle = "#999";
			ctx.beginPath();
			var ng = 10;
			for (var i = 0; i <= ng; i++) {
				var xpos = i / ng * (W - 2 * pad) + pad;
				ctx.moveTo(xpos, pad);
				ctx.lineTo(xpos, H - pad);
				ctx.fillText(f2t(i / ng * this.step_horizon / 1000) + 'k', xpos, H - pad + 14);
			}
			for (var i = 0; i <= ng; i++) {
				var ypos = i / ng * (H - 2 * pad) + pad;
				ctx.moveTo(pad, ypos);
				ctx.lineTo(W - pad, ypos);
				ctx.fillText(f2t((ng - i) / ng * (this.maxy - this.miny) + this.miny), 0, ypos);
			}
			ctx.stroke();

			var N = this.pts.length;
			if (N < 2)
				return;

			// draw the actual curve
			var t = function (x, y, s) {
				var tx = x / s.step_horizon * (W - pad * 2) + pad;
				var ty = H - ((y - s.miny) / (s.maxy - s.miny) * (H - pad * 2) + pad);
				return {tx: tx, ty: ty};
			};

			ctx.strokeStyle = "red";
			ctx.beginPath();
			for (var i = 0; i < N; i++) {
				// draw line from i-1 to i
				var p = this.pts[i];
				var pt = t(p.step, p.y, this);
				if (i === 0)
					ctx.moveTo(pt.tx, pt.ty);
				else
					ctx.lineTo(pt.tx, pt.ty);
			}
			ctx.stroke();
		}
	};

	// same as graph but draws multiple lines. For now I'm lazy and duplicating
	// the code, but in future I will merge these two more nicely.
	var MultiGraph = function (legend, options) {
		var options = options || {};
		this.step_horizon = options.step_horizon || 1000;

		if (typeof options.maxy !== 'undefined')
			this.maxy_forced = options.maxy;
		if (typeof options.miny !== 'undefined')
			this.miny_forced = options.miny;

		this.pts = [];

		this.maxy = -9999;
		this.miny = 9999;
		this.numlines = 0;

		this.numlines = legend.length;
		this.legend = legend;
		this.styles = ["red", "blue", "green", "black", "magenta", "cyan", "purple", "aqua", "olive", "lime", "navy"];
		// 17 basic colors: aqua, black, blue, fuchsia, gray, green, lime, maroon, navy, olive, orange, purple, red, silver, teal, white, and yellow
	};

	MultiGraph.prototype = {
		// canv is the canvas we wish to update with this new datapoint
		add: function (step, yl) {
			var time = new Date().getTime(); // in ms
			var n = yl.length;
			for (var k = 0; k < n; k++) {
				var y = yl[k];
				if (y > this.maxy * 0.99)
					this.maxy = y * 1.05;
				if (y < this.miny * 1.01)
					this.miny = y * 0.95;
			}

			if (typeof this.maxy_forced !== 'undefined')
				this.maxy = this.maxy_forced;
			if (typeof this.miny_forced !== 'undefined')
				this.miny = this.miny_forced;

			this.pts.push({step: step, time: time, yl: yl});
			if (step > this.step_horizon)
				this.step_horizon *= 2;
		},
		// elt is a canvas we wish to draw into
		drawSelf: function (canv) {

			var pad = 25;
			var H = canv.height;
			var W = canv.width;
			var ctx = canv.getContext('2d');

			ctx.clearRect(0, 0, W, H);
			ctx.font = "10px Georgia";

			var f2t = function (x) {
				var dd = 1.0 * Math.pow(10, 2);
				return '' + Math.floor(x * dd) / dd;
			};

			// draw guidelines and values
			ctx.strokeStyle = "#999";
			ctx.beginPath();
			var ng = 10;
			for (var i = 0; i <= ng; i++) {
				var xpos = i / ng * (W - 2 * pad) + pad;
				ctx.moveTo(xpos, pad);
				ctx.lineTo(xpos, H - pad);
				ctx.fillText(f2t(i / ng * this.step_horizon / 1000) + 'k', xpos, H - pad + 14);
			}
			for (var i = 0; i <= ng; i++) {
				var ypos = i / ng * (H - 2 * pad) + pad;
				ctx.moveTo(pad, ypos);
				ctx.lineTo(W - pad, ypos);
				ctx.fillText(f2t((ng - i) / ng * (this.maxy - this.miny) + this.miny), 0, ypos);
			}
			ctx.stroke();

			var N = this.pts.length;
			if (N < 2)
				return;

			// draw legend
			for (var k = 0; k < this.numlines; k++) {
				ctx.fillStyle = this.styles[k % this.styles.length];
				ctx.fillText(this.legend[k], W - pad - 100, pad + 20 + k * 16);
			}
			ctx.fillStyle = "black";

			// draw the actual curve
			var t = function (x, y, s) {
				var tx = x / s.step_horizon * (W - pad * 2) + pad;
				var ty = H - ((y - s.miny) / (s.maxy - s.miny) * (H - pad * 2) + pad);
				return {tx: tx, ty: ty};
			};
			for (var k = 0; k < this.numlines; k++) {

				ctx.strokeStyle = this.styles[k % this.styles.length];
				ctx.beginPath();
				for (var i = 0; i < N; i++) {
					// draw line from i-1 to i
					var p = this.pts[i];
					var pt = t(p.step, p.yl[k], this);
					if (i === 0)
						ctx.moveTo(pt.tx, pt.ty);
					else
						ctx.lineTo(pt.tx, pt.ty);
				}
				ctx.stroke();
			}

		}
	};

	exports = exports || {};
	exports.Graph = Graph;
	exports.MultiGraph = MultiGraph;

	return exports;

})(typeof module !== 'undefined' && module.exports);  // add exports to module.exports if in node.js

// contains various utility functions
var cnnutil = (function (exports) {

	// a window stores _size_ number of values
	// and returns averages. Useful for keeping running
	// track of validation or training accuracy during SGD
	var Window = function (size, minsize) {
		this.v = [];
		this.size = typeof (size) === 'undefined' ? 100 : size;
		this.minsize = typeof (minsize) === 'undefined' ? 20 : minsize;
		this.sum = 0;
	};
	Window.prototype = {
		add: function (x) {
			this.v.push(x);
			this.sum += x;
			if (this.v.length > this.size) {
				var xold = this.v.shift();
				this.sum -= xold;
			}
		},
		get_average: function () {
			if (this.v.length < this.minsize)
				return -1;
			else
				return this.sum / this.v.length;
		},
		reset: function (x) {
			this.v = [];
			this.sum = 0;
		}
	};

	// returns min, max and indeces of an array
	var maxmin = function (w) {
		if (w.length === 0) {
			return {};
		} // ... ;s

		var maxv = w[0];
		var minv = w[0];
		var maxi = 0;
		var mini = 0;
		for (var i = 1; i < w.length; i++) {
			if (w[i] > maxv) {
				maxv = w[i];
				maxi = i;
			}
			if (w[i] < minv) {
				minv = w[i];
				mini = i;
			}
		}
		return {maxi: maxi, maxv: maxv, mini: mini, minv: minv, dv: maxv - minv};
	};

	// returns string representation of float
	// but truncated to length of d digits
	var f2t = function (x, d) {
		if (typeof (d) === 'undefined') {
			var d = 5;
		}
		var dd = 1.0 * Math.pow(10, d);
		return '' + Math.floor(x * dd) / dd;
	};

	exports = exports || {};
	exports.Window = Window;
	exports.maxmin = maxmin;
	exports.f2t = f2t;
	return exports;

})(typeof module !== 'undefined' && module.exports);  // add exports to module.exports if in node.js

