var MultiGraph = MultiGraph || {REVISION: '0.1'};

(function (global) {
	"use strict";

		/**
		 * Same as graph but draws multiple lines
		 * @param {type} legend
		 * @param {type} options
		 * @returns {MultiGraph_L3.MultiGraph}
		 */
		MultiGraph = function (legend, options) {
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
			add: function (step, yl) {
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

				this.pts.push({step: step, time: time, yl: yl});
				if (step > this.step_horizon)
					this.step_horizon *= 2;
			},
			drawSelf: function (graphCanvas) {
				var pad = 25,
					H = graphCanvas.height,
					W = graphCanvas.width,
					graphCtx = graphCanvas.getContext('2d');

				graphCtx.clearRect(0, 0, W, H);
				graphCtx.font = "10px Georgia";

				// Draw guidelines and values
				graphCtx.strokeStyle = "#999";
				graphCtx.beginPath();

				var ng = 10;
				for (var i = 0; i <= ng; i++) {
					var xpos = i / ng * (W - 2 * pad) + pad;
					graphCtx.moveTo(xpos, pad);
					graphCtx.lineTo(xpos, H - pad);
					graphCtx.fillText(f2t(i / ng * this.step_horizon / 1000) + 'k', xpos, H - pad + 14);
				}
				for (var i = 0; i <= ng; i++) {
					var ypos = i / ng * (H - 2 * pad) + pad;
					graphCtx.moveTo(pad, ypos);
					graphCtx.lineTo(W - pad, ypos);
					graphCtx.fillText(f2t((ng - i) / ng * (this.maxy - this.miny) + this.miny), 0, ypos);
				}
				graphCtx.stroke();

				var N = this.pts.length;
				if (N < 2)
					return;

				// Draw legend
				for (var k = 0; k < this.numlines; k++) {
					graphCtx.fillStyle = this.styles[k % this.styles.length];
					graphCtx.fillText(this.legend[k], W - pad - 100, pad + 20 + k * 16);
				}
				graphCtx.fillStyle = "black";

				// Draw the actual curve
				var t = function (x, y, s) {
					var tx = x / s.step_horizon * (W - pad * 2) + pad;
					var ty = H - ((y - s.miny) / (s.maxy - s.miny) * (H - pad * 2) + pad);
					return {tx: tx, ty: ty};
				};

				for (var k = 0; k < this.numlines; k++) {
					graphCtx.strokeStyle = this.styles[k % this.styles.length];
					graphCtx.beginPath();
					for (var i = 0; i < N; i++) {
						// draw line from i-1 to i
						var p = this.pts[i];
						var pt = t(p.step, p.yl[k], this);
						if (i === 0)
							graphCtx.moveTo(pt.tx, pt.ty);
						else
							graphCtx.lineTo(pt.tx, pt.ty);
					}
					graphCtx.stroke();
				}

			}
		};

	global.MultiGraph = MultiGraph;
}(this));