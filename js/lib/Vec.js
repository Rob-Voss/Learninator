(function (global) {
    "use strict";

    /**
     * A 2D vector utility
     * @param {Number} x
     * @param {Number} y
     * @returns {Vec}
     */
    class Vec {
		constructor (x, y, vx, vy, ax, ay) {
			this.x = x || 0;
			this.y = y || 0;
			this.vx = vx || 0;
			this.vy = vy || 0;
            this.ax = ax || 0;
            this.ay = ay || 0;

			return this;
		}
			
		/**
		 * Adds a vector to this one
		 * @param {Vec} v The vector to add to this one
		 * @return {Vec} Returns itself.
		 */
		add (v) {
            for (var prop in v) {
                this[prop] + v[prop];
            }
			return this;
		}
		
		/**
		 * Adds two vectors to each other and stores the result in this vector
		 * @param {Vec} a
		 * @param {Vec} b
		 * @return {Vec} Returns itself.
		 */
		addVectors (a, b) {
            for (var prop in a) {
                this[prop] = a[prop] + b[prop];
            }

			return this;
		}
		
		/**
		 * Adds a scalar value to the x and y components of this vector
		 * @param {Number} s The scalar value to add
		 * @return {Vec} Returns itself.
		 */
		addScalar (s) {
			this.x += s;
			this.y += s;

			return this;
		}

        /**
         * This will add the velocity x,y to the position x,y
         * @returns {Vec}
         */
		advance () {
			this.x += this.vx;
  			this.y += this.vy;

			return this;
		}

		/**
		 * Ceils the vector components
		 * @return {Vec} Returns itself.
		 */
		ceil () {
			this.x = Math.ceil(this.x);
			this.y = Math.ceil(this.y);

			return this;
		}
		
		/**
		 * Clamps the vectors components to be between min and max
		 * @param {Vec} min The minimum value a component can be
		 * @param {Vec} max The maximum value a component can be
		 * @return {Vec} Returns itself.
		 */
		clamp (min, max) {
			// This function assumes min < max, if this assumption
			// isn't true it will not operate correctly
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
		}
		
		/**
		 * Creates a new instance of Vector, with the same components as this vector
		 * @method clone
		 * @return {Vec} Returns a new Vector with the same values
		 */
		clone () {
			return new Vec(this.x, this.y, this.vx, this.vy, this.ax, this.ay);
		}
		
		/**
		 * Copies the passed vector's components to this vector
		 * @param {Vec} v The vector to copy the values from
		 * @return {Vec} Returns itself.
		 */
		copy (v) {
            for (var prop in v) {
                this[prop] = v[prop];
            }

			return this;
		}
		
		/**
		 * Calculates the square distance to the passed vector
		 * @param {Vec} v The vector to check distance to
		 * @return {Number} The square distance
		 */
		distanceToSquared (v) {
			var dx = this.x - v.x, 
				dy = this.y - v.y;

			return dx * dx + dy * dy;
		}
		
		/**
		 * Calculates the distance to the passed vector
		 * @param {Vec} v The vector to check distance to
		 * @return {Number} The distance
		 */
		distanceTo (v) {
			return Math.sqrt(this.distanceToSquared(v));
		}
		
		/**
		 * Divides the x and y components of this vector by a scalar value
		 * @param {Number} s The value to divide by
		 * @return {Vec} Returns itself.
		 */
		divideScalar (s) {
			if (s !== 0) {
				this.x /= s;
				this.y /= s;
			} else {
				this.x = 0;
				this.y = 0;
			}

			return this;
		}
		
		/**
		 * Performs the dot product between this vector and the passed one and returns the result
		 * @param {Vec} v
		 * @return {Number} Returns the dot product
		 */
		dot (v) {
			return this.x * v.x + this.y * v.y;
		}
		
		/**
		 * Checks if this vector is equal to another
		 * @param {Vec} v The vector to compare with
		 * @return {Vec} Returns itself.
		 */
		equals (v) {
			return ((v.x === this.x) && (v.y === this.y));
		}
		
		/**
		 * Floors the vector components
		 * @return {Vec} Returns itself.
		 */
		floor () {
			this.x = Math.floor(this.x);
			this.y = Math.floor(this.y);

			return this;
		}
		
		/**
		 * Performs a linear interpolation between this vector and the passed vector
		 * @param {Vec} v The vector to interpolate with
		 * @param {Number} alpha The amount to interpolate [0-1] or extrapolate (1-]
		 * @return {Vec} Returns itself.
		 */
		lerp (v, alpha) {
			this.x += (v.x - this.x) * alpha;
			this.y += (v.y - this.y) * alpha;

			return this;
		}
		
		/**
		 * Calculates the square length of the vector
		 * @return {Number} Returns the square length of the vector
		 */
		lengthSq () {
			return this.dot(this);
		}
		
		/**
		 * Calculates the length of the vector
		 * @return {Number} Returns the length of the vector
		 */
		length () {
			var length = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));

			return length;
		}
		
		/**
		 * Sets this vector components to the maximum value when compared to the passed vector's components
		 * @param {Vec} v The vector to compare to
		 * @return {Vec} Returns itself.
		 */
		max (v) {
			if (this.x < v.x) {
				this.x = v.x;
			}

			if (this.y < v.y) {
				this.y = v.y;
			}

			return this;
		}
		
		/**
		 * Sets this vector components to the minimum value when compared to the passed vector's components
		 * @param {Vec} v The vector to compare to
		 * @return {Vec} Returns itself.
		 */
		min (v) {
			if (this.x > v.x) {
				this.x = v.x;
			}

			if (this.y > v.y) {
				this.y = v.y;
			}

			return this;
		}

        /**
         * Get this distance
         * @param vec
         * @returns {number}
         */
		minDist (vec) {
			var minDist = Infinity,
				max = Math.max(Math.abs(this.vx), Math.abs(this.vy), Math.abs(vec.vx), Math.abs(vec.vy)),
				slice = 1 / max,
				x, y, distSquared,
				// Get the middle of each vector
				vec1 = {}, 
				vec2 = {};
			vec1.x = this.x + this.width / 2;
			vec1.y = this.y + this.height / 2;
			vec2.x = vec.x + vec.width / 2;
			vec2.y = vec.y + vec.height / 2;

			for (var percent=0; percent<1; percent+=slice) {
				x = (vec1.x + this.vx * percent) - (vec2.x + vec.vx * percent);
				y = (vec1.y + this.vy * percent) - (vec2.y + vec.vy * percent);
				distSquared = x * x + y * y;
				minDist = Math.min(minDist, distSquared);
			}

			return Math.sqrt(minDist);
		}

		/**
		 * Multiplies the x and y components of this vector by a scalar value
		 * @param {Number} s The value to multiply by
		 * @return {Vec} Returns itself.
		 */
		multiplyScalar (s) {
			this.x *= s;
			this.y *= s;

			return this;
		}
		
		/**
		 * Negates this vector (multiplies by -1)
		 * @return {Vec} Returns itself.
		 */
		negate () {
			return this.multiplyScalar(-1);
		}
		
		/**
		 * Normalizes this vector (divides by its length)
		 * @return {Vec} Returns the normalized vector
		 */
		normalize () {
			return this.divideScalar(this.length());
		}
		
		/**
		 * Rotates the vector by 90 degrees
		 * @return {Vec} Returns itself.
		 */
		perp () {
			var x = this.x;
			this.x = this.y;
			this.y = -x;

			return this;
		}
		
		/**
		 * Project this vector on to another vector.
		 * @param {Vec} v The vector to project onto.
		 * @return {Vec} Returns itself.
		 */
		project (v) {
			var amt = this.dot(v) / v.lengthSq();
			this.x = amt * v.x;
			this.y = amt * v.y;

			return this;
		}
		
		/**
		 * Project this vector onto a vector of unit length.
		 * @param {Vec} v The unit vector to project onto.
		 * @return {Vec} Returns itself.
		 */
		projectN (v) {
			var amt = this.dot(v);
			this.x = amt * v.x;
			this.y = amt * v.y;

			return this;
		}
		
		/**
		 * Reflect this vector on an arbitrary axis.
		 * @param {Vec} axis The vector representing the axis.
		 * @return {Vec} Returns itself.
		 */
		reflect (axis) {
			var x = this.x;
			var y = this.y;
			this.project(axis).multiplyScalar(2);
			this.x -= x;
			this.y -= y;

			return this;
		}
		
		/**
		 * Reflect this vector on an arbitrary axis (represented by a unit vector)
		 * @param {Vec} axis The unit vector representing the axis.
		 * @return {Vec} Returns itself.
		 */
		reflectN (axis) {
			var x = this.x;
			var y = this.y;
			this.projectN(axis).multiplyScalar(2);
			this.x -= x;
			this.y -= y;

			return this;
		}
		
		/**
		 * Rotates the vector by an arbitrary angle around an arbitrary point in space
		 * @param {Number} angle The angle in radians to rotate by
		 * @param {Vec} anchor The anchor point to rotate around
		 * @return {Vec} Returns itself.
		 */
		rotateAround (angle, anchor) {
			var dist = anchor.distanceTo(this);
			return this.set(
				anchor.x + (dist * Math.cos(angle)),
				anchor.y + (dist * Math.sin(angle))
			);
		}
		
		/**
		 * Rotate the Vec clockwise
		 * @param {Number} angle
		 * @returns {Vec}
		 */
		rotate (angle) {
			var X = this.x * Math.cos(angle) + this.y * Math.sin(angle),
				Y = -this.x * Math.sin(angle) + this.y * Math.cos(angle);

			return new Vec(X, Y);
		}
		
		/**
		 * Round the Vector
		 * @returns {Vec}
		 */
		round () {
			this.x = Math.round(this.x);
			this.y = Math.round(this.y);

			return this;
		}
		
		/**
		 * In place vector operations
		 * @param {Number} scale
		 * @returns {undefined}
		 */
		scale (scale) {
			this.x *= scale;
			this.y *= scale;

			return this;
		}
		
		/**
		 * Sets the length of the vector
		 * @param {Number} l The length to set this vector to
		 * @return {Vec} Returns itself.
		 */
		setLength (l) {
			var oldLength = this.length();

			if (oldLength !== 0 && l !== oldLength) {
				this.multiplyScalar(l / oldLength);
			}

			return this;
		}
		
		/**
		 * Subtracts a vector from this one
		 * @param {Vec} v The vector to subtract from this one
		 * @return {Vec} Returns itself.
		 */
		sub (v) {
			return new Vec(this.x - v.x, this.y - v.y);
		}
		
		/**
		 * Subtracts two vectors from each other and stores the result in this vector
		 * @param {Vec} a
		 * @param {Vec} b
		 * @return {Vec} Returns itself.
		 */
		subVectors (a, b) {
			this.x = a.x - b.x;
			this.y = a.y - b.y;

			return this;
		}
		
		/**
		 * Returns an array with the components of this vector as the elements
		 * @return {Vec} Returns an array of [x,y] form
		 */
		toArray () {
			return [this.x, this.y, this.vx, this.vy, this.ax, this.ay];
		}
	}

	global.Vec = Vec;

}(this));
