var Vec = Vec || {};

(function (global) {
	"use strict";

	/**
	 * A 2D vector utility
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

	Vec.prototype = {
		/**
		 * Adds a vector to this one
		 * @param {Vec} v The vector to add to this one
		 * @return {Vec} Returns itself.
		 */
		add: function (v) {
			return new Vec(this.x + v.x, this.y + v.y);
		},
		/**
		 * Adds two vectors to each other and stores the result in this vector
		 * @param {Vec} a
		 * @param {Vec} b
		 * @return {Vec} Returns itself.
		 */
		addVectors: function (a, b) {
			this.x = a.x + b.x;
			this.y = a.y + b.y;

			return this;
		},
		/**
		 * Adds a scalar value to the x and y components of this vector
		 * @param {Number} s The scalar value to add
		 * @return {Vec} Returns itself.
		 */
		addScalar: function (s) {
			this.x += s;
			this.y += s;

			return this;
		},
		/**
		 * Ceils the vector components
		 * @return {Vec} Returns itself.
		 */
		ceil: function () {
			this.x = Math.ceil(this.x);
			this.y = Math.ceil(this.y);

			return this;
		},
		/**
		 * Clamps the vectors components to be between min and max
		 * @param {Vec} min The minimum value a component can be
		 * @param {Vec} max The maximum value a component can be
		 * @return {Vec} Returns itself.
		 */
		clamp: function (min, max) {
			// This function assumes min < max, if this assumption
			//isn't true it will not operate correctly
			if (this.x < min.x) {
				this.x = min.x;
			} else if (this.x > max.x) {
				this.x = max.x;
			}

			if (this.y < min.y) {
				this.y = min.y;
			} else if (this.y > max.y) {
				this.y = max.y;
			}

			return this;
		},
		/**
		 * Creates a new instance of Vector, with the same components as this vector
		 * @method clone
		 * @return {Vec} Returns a new Vector with the same values
		 */
		clone: function () {
			return new Vec(this.x, this.y);
		},
		/**
		 * Copies the passed vector's components to this vector
		 * @param {Vec} v The vector to copy the values from
		 * @return {Vec} Returns itself.
		 */
		copy: function (v) {
			this.x = v.x;
			this.y = v.y;

			return this;
		},
		/**
		 * Calculates the square distance to the passed vector
		 * @param {Vec} v The vector to check distance to
		 * @return {Number} The square distance
		 */
		distanceToSquared: function (v) {
			var dx = this.x - v.x, dy = this.y - v.y;
			return dx * dx + dy * dy;
		},
		/**
		 * Calculates the distance to the passed vector
		 * @param {Vec} v The vector to check distance to
		 * @return {Number} The distance
		 */
		distanceTo: function (v) {
			return Math.sqrt(this.distanceToSquared(v));
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
		 * Divides the x and y components of this vector by a scalar value
		 * @param {Number} s The value to divide by
		 * @return {Vec} Returns itself.
		 */
		divideScalar: function (s) {
			if (s !== 0) {
				this.x /= s;
				this.y /= s;
			} else {
				this.set(0, 0);
			}

			return this;
		},
		/**
		 * Performs the dot product between this vector and the passed one and returns the result
		 * @param {Vec} v
		 * @return {Number} Returns the dot product
		 */
		dot: function (v) {
			return this.x * v.x + this.y * v.y;
		},
		/**
		 * Checks if this vector is equal to another
		 * @param {Vec} v The vector to compare with
		 * @return {Vec} Returns itself.
		 */
		equals: function(v) {
			return ((v.x === this.x) && (v.y === this.y));
		},
		/**
		 * Floors the vector components
		 * @return {Vec} Returns itself.
		 */
		floor: function () {
			this.x = Math.floor(this.x);
			this.y = Math.floor(this.y);

			return this;
		},
		/**
		 * Performs a linear interpolation between this vector and the passed vector
		 * @param {Vec} v The vector to interpolate with
		 * @param {Number} alpha The amount to interpolate [0-1] or extrapolate (1-]
		 * @return {Vec} Returns itself.
		 */
		lerp: function (v, alpha) {
			this.x += (v.x - this.x) * alpha;
			this.y += (v.y - this.y) * alpha;

			return this;
		},
		/**
		 * Calculates the square length of the vector
		 * @return {Number} Returns the square length of the vector
		 */
		lengthSq: function () {
			return this.dot(this);
		},
		/**
		 * Calculates the length of the vector
		 * @return {Number} Returns the length of the vector
		 */
		length: function () {
			var length = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));

			return length;
		},
		/**
		 * Sets this vector components to the maximum value when compared to the passed vector's components
		 * @param {Vec} v The vector to compare to
		 * @return {Vec} Returns itself.
		 */
		max: function (v) {
			if (this.x < v.x) {
				this.x = v.x;
			}

			if (this.y < v.y) {
				this.y = v.y;
			}

			return this;
		},
		/**
		 * Sets this vector components to the minimum value when compared to the passed vector's components
		 * @param {Vec} v The vector to compare to
		 * @return {Vec} Returns itself.
		 */
		min: function (v) {
			if (this.x > v.x) {
				this.x = v.x;
			}

			if (this.y > v.y) {
				this.y = v.y;
			}

			return this;
		},
		/**
		 * Multiplies the x and y components of this vector by a scalar value
		 * @param {Number} s The value to multiply by
		 * @return {Vec} Returns itself.
		 */
		multiplyScalar: function (s) {
			this.x *= s;
			this.y *= s;

			return this;
		},
		/**
		 * Negates this vector (multiplies by -1)
		 * @return {Vec} Returns itself.
		 */
		negate: function () {
			return this.multiplyScalar(-1);
		},
		/**
		 * Normalizes this vector (divides by its length)
		 * @return {Vec} Returns the normalized vector
		 */
		normalize: function () {
			return this.divideScalar(this.length());
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
		 * Rotates the vector by 90 degrees
		 * @return {Vec} Returns itself.
		 * @chainable
		 */
		perp: function () {
			var x = this.x;
			this.x = this.y;
			this.y = -x;

			return this;
		},
		/**
		 * Project this vector on to another vector.
		 * @param {Vec} v The vector to project onto.
		 * @return {Vec} Returns itself.
		 */
		project: function (v) {
			var amt = this.dot(v) / v.lengthSq();
			this.x = amt * v.x;
			this.y = amt * v.y;

			return this;
		},
		/**
		 * Project this vector onto a vector of unit length.
		 * @param {Vec} v The unit vector to project onto.
		 * @return {Vec} Returns itself.
		 */
		projectN: function (v) {
			var amt = this.dot(v);
			this.x = amt * v.x;
			this.y = amt * v.y;

			return this;
		},
		/**
		 * Reflect this vector on an arbitrary axis.
		 * @param {Vec} axis The vector representing the axis.
		 * @return {Vec} Returns itself.
		 */
		reflect: function (axis) {
			var x = this.x;
			var y = this.y;
			this.project(axis).multiplyScalar(2);
			this.x -= x;
			this.y -= y;

			return this;
		},
		/**
		 * Reflect this vector on an arbitrary axis (represented by a unit vector)
		 * @param {Vec} axis The unit vector representing the axis.
		 * @return {Vec} Returns itself.
		 */
		reflectN: function (axis) {
			var x = this.x;
			var y = this.y;
			this.projectN(axis).multiplyScalar(2);
			this.x -= x;
			this.y -= y;

			return this;
		},
		/**
		 * Rotates the vector by an arbitrary angle around an arbitrary point in space
		 * @param {Number} angle The angle in radians to rotate by
		 * @param {Vec} anchor The anchor point to rotate around
		 * @return {Vec} Returns itself.
		 */
		rotateAround: function(angle, anchor) {
			var dist = anchor.distanceTo(this);
			return this.set(
				anchor.x + (dist * Math.cos(angle)),
				anchor.y + (dist * Math.sin(angle))
			);
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
		 * Round the Vector
		 * @returns {Vec}
		 */
		round: function () {
			this.x = Math.round(this.x);
			this.y = Math.round(this.y);

			return this;
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
		 * Sets the length of the vector
		 * @param {Number}l  The length to set this vector to
		 * @return {Vec} Returns itself.
		 */
		setLength: function (l) {
			var oldLength = this.length();

			if (oldLength !== 0 && l !== oldLength) {
				this.multiplyScalar(l / oldLength);
			}

			return this;
		},
		/**
		 * Subtracts a vector from this one
		 * @param {Vec} v The vector to subtract from this one
		 * @return {Vec} Returns itself.
		 */
		sub: function (v) {
			return new Vec(this.x - v.x, this.y - v.y);
		},
		/**
		 * Subtracts two vectors from each other and stores the result in this vector
		 * @param {Vec} a
		 * @param {Vec} b
		 * @return {Vec} Returns itself.
		 */
		subVectors: function (a, b) {
			this.x = a.x - b.x;
			this.y = a.y - b.y;

			return this;
		},
		/**
		 * Returns an array with the components of this vector as the elements
		 * @return {Vec} Returns an array of [x,y] form
		 */
		toArray: function () {
			return [this.x, this.y];
		},
		/**
		 * Mark it as visited
		 * @return {undefined}
		 */
		visit: function () {
			this.visited = true;
		}
	};

	global.Vec = Vec;

}(this));
