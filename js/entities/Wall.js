var Wall = Wall || {REVISION: '0.1'};

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
	};

	global.Wall = Wall;

}(this));
