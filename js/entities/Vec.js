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

	// When solving the maze, this represents
	// the previous node in the navigated path.
	this.parent = null;

	this.heuristic = 0;
};

/**
 * Vector utilities
 *
 * @type Vec
 */
Vec.prototype = {
	/**
	 * Distance from the referenced Vector
	 * @param {Vec} v
	 * @returns {Number}
	 */
	distFrom: function (v) {
		var xDiff = this.x - v.x,
			yDiff = this.y - v.y,
			X = Math.pow(xDiff, 2),
			Y = Math.pow(yDiff, 2),
			dist = Math.sqrt(X + Y);

		return dist;
	},
	visit: function () {
		this.visited = true;
	},
	score: function () {
		var total = 0;
		var p = this.parent;

		while (p) {
			++total;
			p = p.parent;
		}
		return total;
	},
	pathToOrigin: function () {
		var path = [this];
		var p = this.parent;

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
	 * New vector returning operations
	 * @param {Vec} v
	 * @returns {Vec}
	 */
	add: function (v) {
		var X = this.x + v.x,
			Y = this.y + v.y;

		return new Vec(X, Y);
	},
	/**
	 * Remove vector
	 * @param {Vec} v
	 * @returns {Vec}
	 */
	sub: function (v) {
		var X = this.x - v.x,
			Y = this.y - v.y;

		return new Vec(X, Y);
	},
	/**
	 * Rotate the vector clockwise
	 * @param {Number} a
	 * @returns {Vec}
	 */
	rotate: function (a) {
		var X = this.x * Math.cos(a) + this.y * Math.sin(a),
			Y = -this.x * Math.sin(a) + this.y * Math.cos(a);

		return new Vec(X, Y);
	},
	/**
	 * In place vector operations
	 * @param {Number} s
	 * @returns {undefined}
	 */
	scale: function (s) {
		this.x *= s;
		this.y *= s;
	},
	/**
	 * Normalize the vector
	 * @returns {undefined}
	 */
	normalize: function () {
		var d = this.length();
		this.scale(1.0 / d);
	}
};
