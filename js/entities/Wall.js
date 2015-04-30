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
		 * Check if there was a collision
		 * @param {Object} minRes
		 * @param {Vec} v1
		 * @param {Vec} v2
		 * @returns {unresolved}
		 */
		collisionCheck: function (minRes, v1, v2) {
			var wResult = Utility.lineIntersect(v1, v2, this.v1, this.v2);
			if (wResult) {
				wResult.type = 0; // 0 is wall
				if (!minRes) {
					minRes = wResult;
				} else {
					// Check if it's closer
					if (wResult.vecX < minRes.vecX) {
						// If yes, replace it
						minRes = wResult;
					}
				}
			}

			return minRes;
		},
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
