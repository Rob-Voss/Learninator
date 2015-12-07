(function (global) {
    "use strict";

    /**
     * Simple Point
     * @name Point
     * @constructor
     *
     * @param {number} x
     * @param {number} y
     * @returns {Point}
     */
    let Point = function (x, y) {
        this.x = x;
        this.y = y;

        return this;
    };

    /**
     * A 2D vector utility
     * @name Vec
     * @constructor
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} vx
     * @param {number} vy
     * @param {number} vz
     * @param {number} ax
     * @param {number} ay
     * @param {number} az
     * @returns {Vec}
     */
    let Vec = function (x, y, z, vx, vy, vz, ax, ay, az) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.vx = vx || 0;
        this.vy = vy || 0;
        this.vz = vz || 0;
        this.ax = ax || 0;
        this.ay = ay || 0;
        this.az = az || 0;

        return this;
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
         * @param {number} s The scalar value to add
         * @return {Vec} Returns itself.
         */
        addScalar: function (s) {
            this.x += s;
            this.y += s;

            return this;
        },
        /**
         * This will add the velocity x,y to the position x,y
         * @returns {Vec}
         */
        advance: function () {
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;

            return this;
        },
        /**
         * Calculate angle between any two vectors.
         * Warning: creates two new Vec objects! EXPENSIVE
         * @param {Vec} v1 First vec
         * @param {Vec} v2 Second vec
         * @return {number} Angle between vectors.
         */
        angleBetween: function (v1, v2) {
            v1 = v1.clone().normalize();
            v2 = v2.clone().normalize();

            return Math.acos(v1.dot(v2));
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
        },
        /**
         * Creates a new instance of Vector, with the same components as this vector
         * @method clone
         * @return {Vec} Returns a new Vector with the same values
         */
        clone: function () {
            return new Vec(this.x, this.y, this.z, this.vx, this.vy, this.vz, this.ax, this.ay, this.az);
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
         * Calculate the cross product of this and another vector.
         * @param {Vec} v A vector
         * @return {number} The cross product
         */
        crossProd: function (v) {
            return this.x * v.y - this.y * v.x;
        },
        /**
         * Calculates the square distance to the passed vector
         * @param {Vec} v The vector to check distance to
         * @return {number} The square distance
         */
        distanceToSquared: function (v) {
            let dx = this.x - v.x,
                dy = this.y - v.y,
                dz = this.z - v.z;

            return dx * dx + dy * dy;
        },
        /**
         * Calculates the distance to the passed vector
         * @param {Vec} v The vector to check distance to
         * @return {number} The distance
         */
        distanceTo: function (v) {
            return Math.sqrt(this.distanceToSquared(v));
        },
        /**
         * Distance from the referenced Vector
         * @param {Vec} v
         * @returns {number}
         */
        distFrom: function (v) {
            let dist = Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));

            return dist;
        },
        /**
         * Divides the x and y components of this vector by a scalar value
         * @param {number} s The value to divide by
         * @return {Vec} Returns itself.
         */
        divideScalar: function (s) {
            if (s !== 0) {
                this.x /= s;
                this.y /= s;
                this.z /= s;
            } else {
                this.x = 0;
                this.y = 0;
                this.z = 0;
            }

            return this;
        },
        /**
         * Performs the dot product between this vector and the passed one and returns the result
         * @param {Vec} v
         * @return {number} Returns the dot product
         */
        dot: function (v) {
            return this.x * v.x + this.y * v.y;
        },
        /**
         * Checks if this vector is equal to another
         * @param {Vec} v The vector to compare with
         * @return {Vec} Returns itself.
         */
        equals: function (v) {
            return ((v.x === this.x) && (v.y === this.y));
        },
        /**
         * Floors the vector components
         * @return {Vec} Returns itself.
         */
        floor: function () {
            this.x = Math.floor(this.x);
            this.y = Math.floor(this.y);
            this.z = Math.floor(this.z);

            return this;
        },
        /**
         *
         * @returns {number}
         */
        getAngle: function () {
            return Math.atan2(this.y, this.x);
        },
        /**
         * Performs a linear interpolation between this vector and the passed vector
         * @param {Vec} v The vector to interpolate with
         * @param {number} alpha The amount to interpolate [0-1] or extrapolate (1-]
         * @return {Vec} Returns itself.
         */
        lerp: function (v, alpha) {
            this.x += (v.x - this.x) * alpha;
            this.y += (v.y - this.y) * alpha;
            this.z += (v.z - this.z) * alpha;

            return this;
        },
        /**
         * Calculates the square length of the vector
         * @return {number} Returns the square length of the vector
         */
        lengthSq: function () {
            return this.dot(this);
        },
        /**
         * Calculates the length of the vector
         * @return {number} Returns the length of the vector
         */
        length: function () {
            let length = Math.sqrt(this.dot(this));

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
         * @param {number} s The value to multiply by
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
         * Rotates the vector by 90 degrees
         * @return {Vec} Returns itself.
         */
        perp: function () {
            let x = this.x;
            this.x = this.y;
            this.y = -x;

            return this;
        },
        /**
         * Calculate the perpendicular vector (normal)
         * http://en.wikipedia.org/wiki/Perpendicular_vector
         * @returns {Vec}
         */
        perpendicular: function () {
            this.y = -this.y;

            return this;
        },
        /**
         * Project this vector on to another vector.
         * @param {Vec} v The vector to project onto.
         * @return {Vec} Returns itself.
         */
        project: function (v) {
            let amt = this.dot(v) / v.lengthSq();
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
            let amt = this.dot(v);
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
            let x = this.x,
                y = this.y;
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
            let x = this.x,
                y = this.y;
            this.projectN(axis).multiplyScalar(2);
            this.x -= x;
            this.y -= y;

            return this;
        },
        /**
         * Rotates the vector by an arbitrary angle around an arbitrary point in space
         * @param {number} angle The angle in radians to rotate by
         * @param {Vec} anchor The anchor point to rotate around
         * @return {Vec} Returns itself.
         */
        rotateAround: function (angle, anchor) {
            let dist = anchor.distanceTo(this);
            return this.set(
                anchor.x + (dist * Math.cos(angle)),
                anchor.y + (dist * Math.sin(angle))
            );
        },
        /**
         * Rotate the Vec clockwise
         * @param {number} angle The angle in radians to rotate by
         * @returns {Vec}
         */
        rotate: function (angle) {
            let X = this.x * Math.cos(angle) + this.y * Math.sin(angle),
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
         * Scale the Vector
         * @param {number} scale
         * @returns {undefined}
         */
        scale: function (scale) {
            this.x *= scale;
            this.y *= scale;

            return this;
        },
        /**
         * Set the Vec's properties
         * @param {number} x
         * @param {number} y
         * @param {number} vx
         * @param {number} vy
         * @param {number} ax
         * @param {number} ay
         */
        set: function (x, y, vx, vy, ax, ay) {
            this.x = x;
            this.y = y;
            this.vx = vx || this.vx;
            this.vy = vy || this.vy;
            this.ax = ax || this.ax;
            this.ay = ay || this.ay;
        },
        /**
         * Calculate the length of a the vector.
         * @param {number} value
         */
        setAngle: function (value) {
            let len = this.length();
            this.x = Math.cos(value) * len;
            this.y = Math.sin(value) * len;
        },
        /**
         * Sets the length of the vector
         * @param {number} l The length to set this vector to
         * @return {Vec}
         */
        setLength: function (l) {
            let oldLength = this.length();

            if (oldLength !== 0 && l !== oldLength) {
                this.multiplyScalar(l / oldLength);
            }

            return this;
        },
        /**
         * Subtracts a vector from this one
         * @param {Vec} v The vector to subtract from this one
         * @return {Vec}
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
         * @return {Array}
         */
        toArray: function () {
            return [this.x, this.y, this.z, this.vx, this.vy, this.vz, this.ax, this.ay, this.az];
        }
    };

    /**
     * Wall is made up of two Vectors
     * @name Wall
     * @constructor
     *
     * @param {Vec} v1
     * @param {Vec} v2
     * @param {boolean} cheats
     * @returns {Wall}
     */
    function Wall(v1, v2, cheats) {
        let xDiff = v2.x - v1.x,
            yDiff = v2.y - v1.y;
        this.type = 0;
        this.v1 = v1;
        this.v2 = v2;
        this.position = new Vec((v1.x + v2.x) / 2, (v1.y + v2.y) / 2);
        this.rotation = Math.atan2(yDiff, xDiff); // See more at: http://wikicode.wikidot.com/get-angle-of-line-between-two-points#toc1
        this.angle = Math.atan2(yDiff, xDiff) * 180 / Math.PI; // See more at: http://wikicode.wikidot.com/get-angle-of-line-between-two-points#toc1

        this.shape = new PIXI.Graphics();
        if (cheats) {
            let wallText = new PIXI.Text(w, {font: "10px Arial", fill: "#640000", align: "center"});
            wallText.position.set(this.v1.x + 10, this.v1.y);
            this.shape.addChild(wallText);
        }
        this.shape.clear();
        this.shape.lineStyle(1, 0x000000);
        this.shape.moveTo(this.v1.x, this.v1.y);
        this.shape.lineTo(this.v2.x, this.v2.y);
        this.shape.endFill();

        return this;
    }

    global.Wall = Wall;
    global.Point = Point;
    global.Vec = Vec;

}(this));
