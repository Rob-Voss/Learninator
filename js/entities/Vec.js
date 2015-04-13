var Vec = Vec || {};

(function (global) {
	"use strict";

	/**
	 * A 2D vector utility
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @returns {Vec}
	 */
	var Vec = function (x, y) {
		this.x = x;
		this.y = y;
		this.visited = false;

		// When solving the maze, this represents the previous node in the navigated path.
		this.parent = null;

		this.heuristic = 0;
	};

	/**
	 * Vector utilities
	 * @type Vec
	 */
	Vec.prototype = {
		/**
		 * Distance from the referenced Vector
		 * @param {Vec} v
		 * @returns {Number}
		 */
		distFrom: function (v) {
			var X = Math.pow(this.x - v.x, 2),
				Y = Math.pow(this.y - v.y, 2),
				dist = Math.sqrt(X + Y);

			return dist;
		},
		/**
		 * Mark it as visited
		 * @returns {undefined}
		 */
		visit: function () {
			this.visited = true;
		},
		/**
		 * Score
		 * @returns {Number}
		 */
		score: function () {
			var total = 0,
				p = this.parent;

			while (p) {
				++total;
				p = p.parent;
			}
			return total;
		},
		/**
		 * Calculate the path to the origin
		 * @returns {Array}
		 */
		pathToOrigin: function () {
			var path = [this],
				p = this.parent;

			while (p) {
				path.push(p);
				p = p.parent;
			}
			path.reverse();

			return path;
		},
		/**
		 * Return the length of the Vector
		 * @returns {Number}
		 */
		length: function () {
			var X = Math.pow(this.x, 2),
				Y = Math.pow(this.y, 2),
				length = Math.sqrt(X + Y);

			return length;
		},
		/**
		 * Add to a Vec
		 * @param {Vec} v
		 * @returns {Vec}
		 */
		add: function (v) {
			var X = this.x + v.x,
				Y = this.y + v.y;

			return new Vec(X, Y);
		},
		/**
		 * Remove from a Vec
		 * @param {Vec} v
		 * @returns {Vec}
		 */
		sub: function (v) {
			var X = this.x - v.x,
				Y = this.y - v.y;

			return new Vec(X, Y);
		},
		/**
		 * Rotate the Vec clockwise
		 * @param {Number} angle
		 * @returns {Vec}
		 */
		rotate: function (angle) {
			var X = this.x * Math.cos(angle) + this.y * Math.sin(angle),
				Y = -this.x * Math.sin(angle) + this.y * Math.cos(angle);

			return new Vec(X, Y);
		},
		/**
		 * In place vector operations
		 * @param {Number} scale
		 * @returns {undefined}
		 */
		scale: function (scale) {
			this.x *= scale;
			this.y *= scale;
		},
		/**
		 * Normalize the vector
		 * @returns {undefined}
		 */
		normalize: function () {
			this.scale(1.0 / this.length());
		}
	};

	global.Vec = Vec;

}(this));
