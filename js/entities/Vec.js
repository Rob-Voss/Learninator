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
		this.population = [];

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
		 * Return the length of the Vector
		 * @returns {Number}
		 */
		length: function () {
			var length = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));

			return length;
		},
		/**
		 * Distance from the referenced Vector
		 * @param {Vec} v
		 * @returns {Number}
		 */
		distFrom: function (v) {
			var dist = Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));

			return dist;
		},
		/**
		 * Add to a Vec
		 * @param {Vec} v
		 * @returns {Vec}
		 */
		add: function (v) {
			return new Vec(this.x + v.x, this.y + v.y);
		},
		/**
		 * Remove from a Vec
		 * @param {Vec} v
		 * @returns {Vec}
		 */
		sub: function (v) {
			return new Vec(this.x - v.x, this.y - v.y);
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
