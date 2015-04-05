var Array = Array || {REVISION: '0.1'};

(function (global) {
	"use strict";

	// Array Remove - By John Resig (MIT Licensed)
	Array.prototype.remove = function (from, to) {
		var rest = this.slice((to || from) + 1 || this.length);
		this.length = from < 0 ? this.length + from : from;

		return this.push.apply(this, rest);
	},
	/**
	 * Returns min, max and indeces of an array
	 * @param {Array} arr
	 * @returns {Object}
	 */
	Array.prototype.maxmin = function (arr) {
		if (arr.length === 0) {
			return {};
		}

		var maxv = arr[0],
			minv = arr[0],
			maxi = 0,
			mini = 0;

		for (var i = 1; i < arr.length; i++) {
			if (arr[i] > maxv) {
				maxv = arr[i];
				maxi = i;
			}
			if (arr[i] < minv) {
				minv = arr[i];
				mini = i;
			}
		}

		return {
			maxi: maxi,
			maxv: maxv,
			mini: mini,
			minv: minv,
			dv: maxv - minv
		};
	};

	global.Array = Array;

}(this));