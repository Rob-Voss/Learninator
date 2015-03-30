
// Simulation speed
var simspeed = 2;

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

