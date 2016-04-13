(function (global) {
    "use strict";

    /**
     *
     * @param x
     * @param y
     * @param z
     * @constructor
     */
    function Vec3(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }

    /*
     Instance methods
     */
    Vec3.prototype = {
        /**
         * Add a Vec3 or a number to this Vec3
         * @param {Vec3|number} v
         * @returns {Vec3}
         */
        add: function (v) {
            if (v instanceof Vec3) {
                return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
            } else {
                return new Vec3(this.x + v, this.y + v, this.z + v);
            }
        },
        /**
         * Angle to the Vec3
         * @param {Vec3} v
         * @returns {number}
         */
        angleTo: function (v) {
            return Math.acos(this.dot(v) / (this.length() * v.length()));
        },
        /**
         * Return a copy of this Vec3
         * @returns {Vec3}
         */
        clone: function () {
            return new Vec3(this.x, this.y, this.z);
        },
        /**
         * Get the cross product between this and another Vec3
         * @param {Vec3} v
         * @returns {Vec3}
         */
        cross: function (v) {
            return new Vec3(
                this.y * v.z - this.z * v.y,
                this.z * v.x - this.x * v.z,
                this.x * v.y - this.y * v.x
            );
        },
        /**
         * Dived this Vec3 by another or a number
         * @param {Vec3|number} v
         * @returns {Vec3}
         */
        divide: function (v) {
            if (v instanceof Vec3) {
                return new Vec3(this.x / v.x, this.y / v.y, this.z / v.z);
            } else {
                return new Vec3(this.x / v, this.y / v, this.z / v);
            }
        },
        /**
         * Get the dot product of this Vec3 and another
         * @param {Vec3} v
         * @returns {number}
         */
        dot: function (v) {
            return this.x * v.x + this.y * v.y + this.z * v.z;
        },
        /**
         * Check if this Vec3 is equal to another
         * @param {Vec3} v
         * @returns {boolean}
         */
        equals: function (v) {
            return this.x === v.x && this.y === v.y && this.z === v.z;
        },
        /**
         * Initialize this Vec3
         * @param {number} x
         * @param {number} y
         * @param {number} z
         * @returns {Vec3}
         */
        init: function (x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        },
        /**
         * Get the length of this Vec3
         * @returns {number}
         */
        length: function () {
            return Math.sqrt(this.dot(this));
        },
        /**
         * Get the max of this Vec3
         * @returns {number}
         */
        max: function () {
            return Math.max(Math.max(this.x, this.y), this.z);
        },
        /**
         * Get the min of this Vec3
         * @returns {number}
         */
        min: function () {
            return Math.min(Math.min(this.x, this.y), this.z);
        },
        /**
         * Multiply this Vec3 by another or a number
         * @param {Vec3|number} v
         * @returns {Vec3}
         */
        multiply: function (v) {
            if (v instanceof Vec3) {
                return new Vec3(this.x * v.x, this.y * v.y, this.z * v.z);
            } else {
                return new Vec3(this.x * v, this.y * v, this.z * v);
            }
        },
        /**
         * Return the negative of this Vec3
         * @returns {Vec3}
         */
        negative: function () {
            return new Vec3(-this.x, -this.y, -this.z);
        },
        /**
         * Subtract a Vec3 or number from this one
         * @param {Vec3|number} v
         * @returns {Vec3}
         */
        subtract: function (v) {
            if (v instanceof Vec3) {
                return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
            } else {
                return new Vec3(this.x - v, this.y - v, this.z - v);
            }
        },
        /**
         * Return the angles of this Vec3
         * @returns {{theta: number, phi: number}}
         */
        toAngles: function () {
            return {
                theta: Math.atan2(this.z, this.x),
                phi: Math.asin(this.y / this.length())
            };
        },
        /**
         * Return an array of this Vec3
         * @param {number} n
         * @returns {Array}
         */
        toArray: function (n) {
            return [this.x, this.y, this.z].slice(0, n || 3);
        },
        /**
         * Convert coords to string
         * @returns {string}
         */
        toString: function () {
            return this.toArray().join(",");
        },
        /**
         * Get the unit of this Vec3
         * @returns {*|Vec3}
         */
        unit: function () {
            return this.divide(this.length());
        }
    };

    /*
     Static methods
     */
    /**
     *
     * @param {Vec3} a
     * @param {Vec3|number} b
     * @param {Vec3} out
     * @returns {Vec3} out
     */
    Vec3.add = function (a, b, out) {
        if (b instanceof Vec3) {
            out.x = a.x + b.x;
            out.y = a.y + b.y;
            out.z = a.z + b.z;
        } else {
            out.x = a.x + b;
            out.y = a.y + b;
            out.z = a.z + b;
        }

        return out;
    };
    /**
     *
     * @param {Vec3} a
     * @param {Vec3} b
     * @returns {*|number}
     */
    Vec3.angleBetween = function (a, b) {
        return a.angleTo(b);
    };
    /**
     *
     * @param {Vec3} a
     * @param {Vec3} b
     * @param {Vec3} out
     * @returns {Vec3} out
     */
    Vec3.cross = function (a, b, out) {
        out.x = a.y * b.z - a.z * b.y;
        out.y = a.z * b.x - a.x * b.z;
        out.z = a.x * b.y - a.y * b.x;

        return out;
    };
    /**
     *
     * @param {Vec3} a
     * @param {Vec3|number} b
     * @param {Vec3} out
     * @returns {Vec3} out
     */
    Vec3.divide = function (a, b, out) {
        if (b instanceof Vec3) {
            out.x = a.x / b.x;
            out.y = a.y / b.y;
            out.z = a.z / b.z;
        } else {
            out.x = a.x / b;
            out.y = a.y / b;
            out.z = a.z / b;
        }

        return out;
    };
    /**
     *
     * @param {number} theta
     * @param {number} phi
     * @returns {Vec3}
     */
    Vec3.fromAngles = function (theta, phi) {
        return new Vec3(Math.cos(theta) * Math.cos(phi), Math.sin(phi), Math.sin(theta) * Math.cos(phi));
    };
    /**
     *
     * @param {Array} a
     * @returns {Vec3}
     */
    Vec3.fromArray = function (a) {
        return new Vec3(a[0], a[1], a[2]);
    };
    /**
     *
     * @param {Vec3} a
     * @param {Vec3} b
     * @param {number} fraction
     * @returns {*}
     */
    Vec3.lerp = function (a, b, fraction) {
        return b.subtract(a).multiply(fraction).add(a);
    };
    /**
     *
     * @param {Vec3} a
     * @param {Vec3} b
     * @returns {Vec3}
     */
    Vec3.max = function (a, b) {
        return new Vec3(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
    };
    /**
     *
     * @param {Vec3} a
     * @param {Vec3} b
     * @returns {Vec3}
     */
    Vec3.min = function (a, b) {
        return new Vec3(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
    };
    /**
     *
     * @param {Vec3} a
     * @param {Vec3|number} b
     * @param {Vec3} out
     * @returns {Vec3}
     */
    Vec3.multiply = function (a, b, out) {
        if (b instanceof Vec3) {
            out.x = a.x * b.x;
            out.y = a.y * b.y;
            out.z = a.z * b.z;
        } else {
            out.x = a.x * b;
            out.y = a.y * b;
            out.z = a.z * b;
        }

        return out;
    };
    /**
     *
     * @param {Vec3} a
     * @param {Vec3} out
     * @returns {Vec3}
     */
    Vec3.negative = function (a, out) {
        out.x = -a.x;
        out.y = -a.y;
        out.z = -a.z;

        return out;
    };
    /**
     *
     * @returns {Vec3}
     */
    Vec3.randomDirection = function () {
        return Vec3.fromAngles(Math.random() * Math.PI * 2, Math.asin(Math.random() * 2 - 1));
    };
    /**
     *
     * @param {Vec3} a
     * @param {Vec3|number} b
     * @param {Vec3} out
     * @returns {Vec3}
     */
    Vec3.subtract = function (a, b, out) {
        if (b instanceof Vec3) {
            out.x = a.x - b.x;
            out.y = a.y - b.y;
            out.z = a.z - b.z;
        } else {
            out.x = a.x - b;
            out.y = a.y - b;
            out.z = a.z - b;
        }

        return out;
    };
    /**
     *
     * @param {Vec3} a
     * @param {Vec3} out
     * @returns {Vec3}
     */
    Vec3.unit = function (a, out) {
        let length = a.length();
        out.x = a.x / length;
        out.y = a.y / length;
        out.z = a.z / length;

        return out;
    };

    global.Vec3 = Vec3;

}(this));
