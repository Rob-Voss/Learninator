var Graph = Graph || {REVISION: '0.1'};

(function (global) {
	"use strict";

	/**
	 * Same as MultiGraph but draws a single line
	 * @param {Array} legend
	 * @param {Object} options
	 * @returns {Graph}
	 */
	var Graph = function (width, height, legend, options) {
		var options = options || {};
		this.step_horizon = options.step_horizon || 1000;

		if (typeof options.maxy !== 'undefined')
			this.maxy_forced = options.maxy;
		if (typeof options.miny !== 'undefined')
			this.miny_forced = options.miny;

		this.width = width;
		this.height = height;
		this.maxy = -9999;
		this.miny = 9999;

		if (typeof legend !== 'undefined') {
			this.pts = [];
			this.numlines = legend.length;
			this.legend = legend;
			this.styles = ["red", "blue", "green", "black", "magenta", "cyan", "purple", "aqua", "olive", "lime", "navy"];
		} else {
			this.cells = [];
			this.removedEdges = [];

			for (var i = 0; i < this.width; i++) {
				this.cells.push([]);
				var row = this.cells[i];

				for (var j = 0; j < this.height; j++) {
					var v = new Vec(i, j, this);
					row.push(v);
				}
			}
		}
		self = this;
	};

	Graph.prototype = {
		/**
		 * Add a point to the graph
		 * @param {Number} step
		 * @param {Number} y
		 * @returns {undefined}
		 */
		add: function(step, y) {
			var time = new Date().getTime(); // in ms
			if (y > this.maxy * 0.99)
				this.maxy = y * 1.05;
			if (y < this.miny * 1.01)
				this.miny = y * 0.95;
			var point = {
					step: step,
					time: time,
					y: y
				};
			this.pts.push(point);

			if (step > this.step_horizon)
				this.step_horizon *= 2;
		},
		/**
		 * Draw itself
		 * @param {Canvas} canv
		 * @returns {undefined}
		 */
		drawSelf: function(canv) {
			var pad = 25,
				H = canv.height,
				W = canv.width,
				ctx = canv.getContext('2d');

			ctx.clearRect(0, 0, W, H);
			ctx.font = "10px Georgia";

			var f2t = function(x) {
				var dd = 1.0 * Math.pow(10, 2);
				return '' + Math.floor(x * dd) / dd;
			};

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
			var t = function(x, y, s) {
				var tx = x / s.step_horizon * (W - pad * 2) + pad,
					ty = H - ((y - s.miny) / (s.maxy - s.miny) * (H - pad * 2) + pad),
					txty = {
						tx:tx,
						ty:ty
					};
				return txty;
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
		},
		/**
		 * Add a point to the graph
		 * @param {Number} step
		 * @param {Number} yl
		 * @returns {undefined}
		 */
		addPoint: function(step, yl) {
			// in ms
			var time = new Date().getTime(),
				n = yl.length;
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

			var point = {
					step: step,
					time: time,
					yl: yl
				};
			this.pts.push(point);
			if (step > this.step_horizon)
				this.step_horizon *= 2;
		},
		/**
		 * Draw itself
		 * @param {Canvas} canv
		 * @returns {undefined}
		 */
		drawPoints: function (canv) {
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

			// Draw guidelines and values
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

			// Draw legend
			for (var k = 0; k < this.numlines; k++) {
				ctx.fillStyle = this.styles[k % this.styles.length];
				ctx.fillText(this.legend[k], W - pad - 100, pad + 20 + k * 16);
			}
			ctx.fillStyle = "black";

			// Draw the actual curve
			var t = function (x, y, s) {
				var tx = x / s.step_horizon * (W - pad * 2) + pad;
				var ty = H - ((y - s.miny) / (s.maxy - s.miny) * (H - pad * 2) + pad);
				return {tx: tx, ty: ty};
			};

			for (var k = 0; k < this.numlines; k++) {
				ctx.strokeStyle = this.styles[k % this.styles.length];
				ctx.beginPath();
				for (var i = 0; i < N; i++) {
					// Draw line from i-1 to i
					var p = this.pts[i],
						pt = t(p.step, p.yl[k], this);
					if (i === 0) {
						ctx.moveTo(pt.tx, pt.ty);
					} else {
						ctx.lineTo(pt.tx, pt.ty);
					}
				}
				ctx.stroke();
			}
		},
		/**
		 * Get a vector at a specific point
		 * @param {Number} x
		 * @param {Number} y
		 * @returns {Vec}
		 */
		getVecAt: function (x, y) {
			if (x >= this.width || y >= this.height || x < 0 || y < 0) {
				return null;
			}

			if (!this.cells[x]) {
				return null;
			}

			return this.cells[x][y];
		},
		/**
		 * Get the distance between two vectors
		 * @param {Vec} v1
		 * @param {Vec} v2
		 * @returns {Number}
		 */
		getVecDistance: function (v1, v2) {
			var xDist = Math.abs(v1.x - v2.x),
				yDist = Math.abs(v1.y - v2.y);

			return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
		},
		/**
		 * Returns true if there is an edge between v1 and v2
		 * @param {Vec} v1
		 * @param {Vec} v2
		 * @returns {Boolean}
		 */
		areConnected: function (v1, v2) {
			if (!v1 || !v2) {
				return false;
			}

			if (Math.abs(v1.x - v2.x) > 1 || Math.abs(v1.y - v2.y) > 1) {
				return false;
			}

			var removedEdge = _.detect(this.removedEdges, function (edge) {
				return _.include(edge, v1) && _.include(edge, v2);
			});

			return removedEdge === undefined;
		},
		/**
		 * Returns all neighbors of this Vec that aren't separated by an edge
		 * @param {Vec} v
		 * @returns {unresolved}
		 */
		unvisitedNeighbors: function (v) {
			return _.select(this.connectedNeighbors(v), function (c) {
				return !c.visited;
			});
		},
		/**
		 * Returns all neighbors of this Vec that are separated by an edge
		 * @param {Vec} v
		 * @returns {unresolved}
		 */
		connectedNeighbors: function (v) {
			return _.select(this.neighbors(v), function (c) {
				return self.areConnected(v, c);
			});
		},
		/**
		 * Returns all neighbors of this Vec that are NOT separated by an edge
		 * This means there is a maze path between both cells.self
		 * @param {Vec} v
		 * @returns {unresolved}
		 */
		disconnectedNeighbors: function (v) {
			return _.reject(this.neighbors(v), function (c) {
				return self.areConnected(v, c);
			});
		},
		/**
		 * Returns all neighbors of this cell, regardless if they are connected or not.
		 * @param {Vec} v
		 * @returns {Array|@exp;Array}
		 */
		neighbors: function (v) {
			var neighbors = [],
				topCell = this.getVecAt(v.x, v.y - 1),
				rightCell = this.getVecAt(v.x + 1, v.y),
				bottomCell = this.getVecAt(v.x, v.y + 1),
				leftCell = this.getVecAt(v.x - 1, v.y);

			if (v.y > 0 && topCell) {
				neighbors.push(topCell);
			}
			if (v.x < this.width && rightCell) {
				neighbors.push(rightCell);
			}
			if (v.y < this.height && bottomCell) {
				neighbors.push(bottomCell);
			}
			if (v.x > 0 && leftCell) {
				neighbors.push(leftCell);
			}

			return neighbors;
		},
		/**
		 * Remove the edge from between two Vec
		 * @param {Vec} v1
		 * @param {Vec} v2
		 * @returns {undefined}
		 */
		removeEdgeBetween: function (v1, v2) {
			this.removedEdges.push([v1, v2]);
		}
	};

	global.Graph = Graph;

}(this));
