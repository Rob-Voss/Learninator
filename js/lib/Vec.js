(function (global) {
    "use strict";

    class Vec {
        /**
         * A 2D vector utility
         * @name Vec
         * @constructor
         *
         * @param {number} x
         * @param {number} y
         * @param {number} vx
         * @param {number} vy
         * @param {number} ax
         * @param {number} ay
         * @returns {Vec}
         */
        constructor(x = 0, y = 0, vx = 0, vy = 0, ax = 0, ay = 0) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.ax = ax;
            this.ay = ay;
            this.angle = this.getAngle();

            return this;
        }

        /**
         * Adds a vector to this one
         * @param {Vec} v The vector to add to this one
         * @return {Vec} Returns itself.
         */
        add(v) {
            return new Vec(this.x + v.x, this.y + v.y, this.vx + v.vx, this.vy + v.vy, this.ax + v.ax, this.ay + v.ay);
        }

        /**
         * Adds two vectors to each other and stores the result in this vector
         * @param {Vec} a
         * @param {Vec} b
         * @return {Vec} Returns itself.
         */
        addVectors(a, b) {
            this.x = a.x + b.x;
            this.y = a.y + b.y;

            return this;
        }

        /**
         * Adds a scalar value to the x and y components of this vector
         * @param {number} s The scalar value to add
         * @return {Vec} Returns itself.
         */
        addScalar(s) {
            this.x += s;
            this.y += s;

            return this;
        }

        /**
         * This will add the velocity x,y to the position x,y
         * @returns {Vec}
         */
        advance() {
            let oldV = this.clone();
            this.x += this.vx;
            this.y += this.vy;

            this.angle = this.getAngle();

            return this;
        }

        /**
         * This will add the velocity x,y to the position x,y
         * @param {number} angle
         * @param {number} speed
         * @returns {Vec}
         */
        advanceAtAngle(angle, speed) {
            let radians = angle * Math.PI / 180;
            this.vx = Math.cos(radians) * speed;
            this.vy = Math.sin(radians) * speed;
            this.x += this.vx;
            this.y += this.vy;

            this.angle = this.getAngle();

            return this;
        }

        /**
         * Calculate angle between any two vectors.
         * @param {Vec} v First vec
         * @return {number} Angle between vectors.
         */
        angleBetween(v) {
            let v1 = this.clone().normalize(),
                v2 = v.clone().normalize();

            return Math.atan2(v2.sub(v1).y, v2.sub(v1).x) * (180 / Math.PI);
        }

        /**
         * Ceils the vector components
         * @return {Vec} Returns itself.
         */
        ceil() {
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
        clamp(min, max) {
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
        clone() {
            return new Vec(this.x, this.y, this.vx, this.vy, this.ax, this.ay);
        }

        /**
         * Copies the passed vector's components to this vector
         * @param {Vec} v The vector to copy the values from
         * @return {Vec} Returns itself.
         */
        copy(v) {
            this.x = v.x;
            this.y = v.y;

            return this;
        }

        /**
         * Calculate the cross product of this and another vector.
         * @param {Vec} v A vector
         * @return {number} The cross product
         */
        crossProd(v) {
            return this.x * v.y - this.y * v.x;
        }

        /**
         * Calculates the square distance to the passed vector
         * @param {Vec} v The vector to check distance to
         * @return {number} The square distance
         */
        distanceToSquared(v) {
            let dx = this.x - v.x,
                dy = this.y - v.y;

            return dx * dx + dy * dy;
        }

        /**
         * Calculates the distance to the passed vector
         * @param {Vec} v The vector to check distance to
         * @return {number} The distance
         */
        distanceTo(v) {
            return Math.sqrt(this.distanceToSquared(v));
        }

        /**
         * Divides the x and y components of this vector by a scalar value
         * @param {number} s The value to divide by
         * @return {Vec} Returns itself.
         */
        divideScalar(s) {
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
         * Performs the dot product between this vector and
         * the passed one and returns the result
         * @param {Vec} v
         * @return {number} Returns the dot product
         */
        dot(v) {
            return this.x * v.x + this.y * v.y;
        }

        /**
         * Checks if this vector is equal to another
         * @param {Vec} v The vector to compare with
         * @return {boolean}
         */
        equals(v) {
            return ((v.x === this.x) && (v.y === this.y));
        }

        /**
         * Floors the vector components
         * @return {Vec} Returns itself.
         */
        floor() {
            this.x = Math.floor(this.x);
            this.y = Math.floor(this.y);

            return this;
        }

        /**
         * Get the angle of this Vec
         * @returns {number}
         */
        getAngle() {
            return Math.atan2(this.y, this.x) * 180 / Math.PI;
        }

        /**
         * Get the angle of this Vec
         * @returns {number}
         */
        getAngleInRadians() {
            return this.getAngle() * Math.PI / 180;
        }

        /**
         * Get a point at a % point between this Vec and another
         * @param {Vec} v
         * @param {number} perc
         * @return {Vec} .
         */
        getPointBetween(v, perc) {
            let blend = perc / 100,
                x = this.x + blend * (v.x - this.x),
                y = this.y + blend * (v.y - this.y);

            return new Vec(x, y);
        }

        /**
         * Performs a linear interpolation between this vector and the passed vector
         * @param {Vec} v The vector to interpolate with
         * @param {number} alpha The amount to interpolate [0-1] or extrapolate (1-]
         * @return {Vec} Returns itself.
         */
        lerp(v, alpha) {
            this.x += (v.x - this.x) * alpha;
            this.y += (v.y - this.y) * alpha;

            return this;
        }

        /**
         * Calculates the square length of the vector
         * @return {number} Returns the square length of the vector
         */
        lengthSq() {
            return this.dot(this);
        }

        /**
         * Calculates the length of the vector
         * @return {number} Returns the length of the vector
         */
        length() {
            return Math.sqrt(this.dot(this));
        }

        /**
         * Sets this vector components to the maximum value when compared to the passed vector's components
         * @param {Vec} v The vector to compare to
         * @return {Vec} Returns itself.
         */
        max(v) {
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
        min(v) {
            if (this.x > v.x) {
                this.x = v.x;
            }

            if (this.y > v.y) {
                this.y = v.y;
            }

            return this;
        }

        /**
         * Multiplies the x and y components of this vector by a scalar value
         * @param {number} s The value to multiply by
         * @return {Vec} Returns itself.
         */
        multiplyScalar(s) {
            this.x *= s;
            this.y *= s;

            return this;
        }

        /**
         * Negates this vector (multiplies by -1)
         * @return {Vec} Returns itself.
         */
        negate() {
            return this.multiplyScalar(-1);
        }

        /**
         * Normalizes this vector (divides by its length)
         * @return {Vec} Returns the normalized vector
         */
        normalize() {
            return this.divideScalar(this.length());
        }

        /**
         * Rotates the vector by 90 degrees
         * @return {Vec} Returns itself.
         */
        perp() {
            let x = this.x;
            this.x = this.y;
            this.y = -x;

            return this;
        }

        /**
         * Calculate the perpendicular vector (normal)
         * http://en.wikipedia.org/wiki/Perpendicular_vector
         * @returns {Vec}
         */
        perpendicular() {
            this.y = -this.y;

            return this;
        }

        plusEq(v) {
            this.x += v.x;
            this.y += v.y;
        }

        /**
         * Project this vector on to another vector.
         * @param {Vec} v The vector to project onto.
         * @return {Vec} Returns itself.
         */
        project(v) {
            let amt = this.dot(v) / v.lengthSq();
            this.x = amt * v.x;
            this.y = amt * v.y;

            return this;
        }

        /**
         * Project this vector onto a vector of unit length.
         * @param {Vec} v The unit vector to project onto.
         * @return {Vec} Returns itself.
         */
        projectN(v) {
            let amt = this.dot(v);
            this.x = amt * v.x;
            this.y = amt * v.y;

            return this;
        }

        /**
         * Reflect this vector on an arbitrary axis.
         * @param {Vec} axis The vector representing the axis.
         * @return {Vec} Returns itself.
         */
        reflect(axis) {
            let x = this.x,
                y = this.y;
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
        reflectN(axis) {
            let x = this.x,
                y = this.y;
            this.projectN(axis).multiplyScalar(2);
            this.x -= x;
            this.y -= y;

            return this;
        }

        /**
         * Rotates the vector by an arbitrary angle around an arbitrary point in space
         * @param {number} angle The angle in radians to rotate by
         * @param {Vec} anchor The anchor point to rotate around
         * @return {Vec} Returns itself.
         */
        rotateAround(angle, anchor) {
            let dist = anchor.distanceTo(this);
            return this.set(
                anchor.x + (dist * Math.cos(angle)),
                anchor.y + (dist * Math.sin(angle))
            );
        }

        /**
         * Rotate the Vec clockwise
         * @param {number} angle The angle in radians to rotate by
         * @returns {Vec}
         */
        rotate(angle) {
            let X = this.x * Math.cos(angle) + this.y * Math.sin(angle),
                Y = -this.x * Math.sin(angle) + this.y * Math.cos(angle);

            return new Vec(X, Y);
        }

        /**
         * Round the Vector
         * @returns {Vec}
         */
        round() {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);

            return this;
        }

        /**
         * Scale the Vector
         * @param {number} scale
         * @returns {undefined}
         */
        scale(scale) {
            this.x *= scale;
            this.y *= scale;

            return this;
        }

        /**
         * Set the Vec's properties
         * @param {number} x
         * @param {number} y
         * @param {number} vx
         * @param {number} vy
         * @param {number} ax
         * @param {number} ay
         */
        set(x, y, vx, vy, ax, ay) {
            this.x = x;
            this.y = y;
            this.vx = vx || this.vx;
            this.vy = vy || this.vy;
            this.ax = ax || this.ax;
            this.ay = ay || this.ay;
        }

        /**
         * Set the angle.
         * @param {number} angle The angle in radians
         */
        setAngle(angle) {
            let len = this.length();
            this.x = Math.cos(angle) * len;
            this.y = Math.sin(angle) * len;
        }

        /**
         * Sets the length of the vector
         * @param {number} l The length to set this vector to
         * @return {Vec}
         */
        setLength(l) {
            let oldLength = this.length();

            if (oldLength !== 0 && l !== oldLength) {
                this.multiplyScalar(l / oldLength);
            }

            return this;
        }

        /**
         * Subtracts a vector from this one
         * @param {Vec} v The vector to subtract from this one
         * @return {Vec}
         */
        sub(v) {
            return new Vec(this.x - v.x, this.y - v.y);
        }

        /**
         * Subtracts two vectors from each other and stores the result in this vector
         * @param {Vec} a
         * @param {Vec} b
         * @return {Vec} Returns itself.
         */
        subVectors(a, b) {
            this.x = a.x - b.x;
            this.y = a.y - b.y;

            return this;
        }

        /**
         * Returns an array with the components of this vector as the elements
         * @return {Array}
         */
        toArray() {
            return [this.x, this.y];
        }

        /**
         * Convert coords to string
         * @returns {string}
         */
        toString() {
            return this.toArray().join(",");
        }
    }

    global.Vec = Vec;

}(this));
