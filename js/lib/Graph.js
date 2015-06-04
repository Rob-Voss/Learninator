var Graph = Graph || {};

(function (global) {
	"use strict";

	/**
	 * Graph
	 * @param {HTMLCanvasElement} canvas
	 * @param {Array} legend
	 * @param {Object} options
	 * @returns {Graph_L3.Graph}
	 */
	var Graph = function (canvas, legend, options) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");

		var options = options || {};
		this.step_horizon = options.step_horizon || 1000;

		this.width = options.width || canvas.width;
		this.height = options.height || canvas.height;

		if (typeof options.maxy !== 'undefined')
			this.maxy_forced = options.maxy;
		if (typeof options.miny !== 'undefined')
			this.miny_forced = options.miny;

		this.maxy = -9999;
		this.miny = 9999;

		this.numlines = legend.length;
		this.pts = new Array(this.numlines);
		for (var i = 0; i < this.numlines; i++) {
			this.pts[i] = [];
		}
		this.legend = legend;
		this.styles = ["red", "blue", "green", "black", "magenta", "cyan", "purple", "aqua", "olive", "lime", "navy"];
		this.hexStyles = [0xFF0000, 0x0000FF, 0x00FF00, 0x000000, 0xFF00FF, 0x00FFFF, 0x800080, 0x00FFFF, 0x808000, 0x00FF00, 0x000080];
	};

	Graph.prototype = {
		/**
		 * Add a point to the graph
		 * @param {Number} step
		 * @param {Number} yl
		 * @returns {undefined}
		 */
		addPoint: function(step, idx, yl) {
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
			if (this.pts[idx] !== undefined) {
				this.pts[idx].push(point);
			} else {
				console.log('this.pts[' + idx + '] = undefined. this.pts=' + this.pts);
			}
			if (step > this.step_horizon)
				this.step_horizon *= 2;
		},
		/**
		 * Draw it
		 * @returns {undefined}
		 */
		drawPoints: function () {
			var pad = 25;
			var H = this.height;
			var W = this.width;
			var ctx = this.ctx;

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
			for (var gl = 0; gl <= ng; gl++) {
				var xpos = gl / ng * (W - 2 * pad) + pad;
				ctx.moveTo(xpos, pad);
				ctx.lineTo(xpos, H - pad);
				ctx.fillText(f2t(gl / ng * this.step_horizon / 1000) + 'k', xpos, H - pad + 14);
			}

			for (var v = 0; v <= ng; v++) {
				var ypos = v / ng * (H - 2 * pad) + pad;
				ctx.moveTo(pad, ypos);
				ctx.lineTo(W - pad, ypos);
				ctx.fillText(f2t((ng - v) / ng * (this.maxy - this.miny) + this.miny), 0, ypos);
			}
			ctx.stroke();
			var agentN = [];
			for (var z = 0; z < this.numlines; z++) {
				agentN[z] = this.pts[z].length;
				if (agentN[z] < 2)
					return;
			}

			// Draw legend
			for (var l = 0; l < this.numlines; l++) {
				ctx.fillStyle = this.styles[l];
				ctx.fillText(this.legend[l].name, W - pad - 100, pad + 20 + l * 16);
			}
			ctx.fillStyle = "black";

			// Draw the actual curve
			var t = function (x, y, s) {
				var tx = x / s.step_horizon * (W - pad * 2) + pad;
				var ty = H - ((y - s.miny) / (s.maxy - s.miny) * (H - pad * 2) + pad);
				return {tx: tx, ty: ty};
			};

			for (var k = 0; k < this.numlines; k++) {
				ctx.strokeStyle = this.styles[k];
				ctx.beginPath();
				for (var i = 0; i < agentN[k]; i++) {
					// Draw line from i-1 to i
					var p = this.pts[k][i],
						pt = t(p.step, p.yl[0], this);
					if (i === 0) {
						ctx.moveTo(pt.tx, pt.ty);
					} else {
						ctx.lineTo(pt.tx, pt.ty);
					}
				}
				ctx.stroke();
			}
		}
	};

	global.Graph = Graph;

}(this));
