var Wall = Wall || {};

(function (global) {
	"use strict";

	/**
	 * Wall is made up of two Vectors
	 * @param {Vec} v1
	 * @param {Vec} v2
	 * @returns {Wall}
	 */
	var Wall = function (v1, v2) {
		this.v1 = v1;
		this.v2 = v2;
		this.type = 0;
	};

	Wall.prototype = {
		/**
		 * Draw itself
		 * @param {HTMLCanvasElement} ctx
		 * @returns {undefined}
		 */
		draw: function (ctx) {
			ctx.lineWidth = .5;

			// Draw the walls in environment
			ctx.strokeStyle = "rgb(0,0,0)";
			ctx.beginPath();
			ctx.moveTo(this.v1.x, this.v1.y);
			ctx.lineTo(this.v2.x, this.v2.y);
			ctx.stroke();
		}
	};

	global.Wall = Wall;

}(this));
