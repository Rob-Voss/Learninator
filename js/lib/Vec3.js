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
         *
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
         *
         * @param {Vec3} a
         * @returns {number}
         */
        angleTo: function (a) {
            return Math.acos(this.dot(a) / (this.length() * a.length()));
        },
        /**
         *
         * @returns {Vec3}
         */
        clone: function () {
            return new Vec3(this.x, this.y, this.z);
        },
        /**
         *
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
         *
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
         *
         * @param {Vec3} v
         * @returns {number}
         */
        dot: function (v) {
            return this.x * v.x + this.y * v.y + this.z * v.z;
        },
        /**
         *
         * @param {Vec3} v
         * @returns {boolean}
         */
        equals: function (v) {
            return this.x === v.x && this.y === v.y && this.z === v.z;
        },
        /**
         *
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
         *
         * @returns {number}
         */
        length: function () {
            return Math.sqrt(this.dot(this));
        },
        /**
         *
         * @returns {number}
         */
        max: function () {
            return Math.max(Math.max(this.x, this.y), this.z);
        },
        /**
         *
         * @returns {number}
         */
        min: function () {
            return Math.min(Math.min(this.x, this.y), this.z);
        },
        /**
         *
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
         *
         * @returns {Vec3}
         */
        negative: function () {
            return new Vec3(-this.x, -this.y, -this.z);
        },
        /**
         *
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
         *
         * @returns {{theta: number, phi: number}}
         */
        toAngles: function () {
            return {
                theta: Math.atan2(this.z, this.x),
                phi: Math.asin(this.y / this.length())
            };
        },
        /**
         *
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
         *
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
     * @param {Vec3} c
     * @returns {Vec3}
     */
    Vec3.add = function (a, b, c) {
        if (b instanceof Vec3) {
            c.x = a.x + b.x;
            c.y = a.y + b.y;
            c.z = a.z + b.z;
        } else {
            c.x = a.x + b;
            c.y = a.y + b;
            c.z = a.z + b;
        }

        return c;
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
     * @param {Vec3} c
     * @returns {Vec3}
     */
    Vec3.cross = function (a, b, c) {
        c.x = a.y * b.z - a.z * b.y;
        c.y = a.z * b.x - a.x * b.z;
        c.z = a.x * b.y - a.y * b.x;

        return c;
    };
    /**
     *
     * @param {Vec3} a
     * @param {Vec3|number} b
     * @param {Vec3} c
     * @returns {Vec3}
     */
    Vec3.divide = function (a, b, c) {
        if (b instanceof Vec3) {
            c.x = a.x / b.x;
            c.y = a.y / b.y;
            c.z = a.z / b.z;
        } else {
            c.x = a.x / b;
            c.y = a.y / b;
            c.z = a.z / b;
        }

        return c;
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
     * @param {Vec3} c
     * @returns {Vec3}
     */
    Vec3.multiply = function (a, b, c) {
        if (b instanceof Vec3) {
            c.x = a.x * b.x;
            c.y = a.y * b.y;
            c.z = a.z * b.z;
        } else {
            c.x = a.x * b;
            c.y = a.y * b;
            c.z = a.z * b;
        }

        return c;
    };
    /**
     *
     * @param {Vec3} a
     * @param {Vec3} b
     * @returns {Vec3}
     */
    Vec3.negative = function (a, b) {
        b.x = -a.x;
        b.y = -a.y;
        b.z = -a.z;

        return b;
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
     * @param {Vec3} c
     * @returns {Vec3}
     */
    Vec3.subtract = function (a, b, c) {
        if (b instanceof Vec3) {
            c.x = a.x - b.x;
            c.y = a.y - b.y;
            c.z = a.z - b.z;
        } else {
            c.x = a.x - b;
            c.y = a.y - b;
            c.z = a.z - b;
        }

        return c;
    };
    /**
     *
     * @param {Vec3} a
     * @param {Vec3} b
     * @returns {Vec3}
     */
    Vec3.unit = function (a, b) {
        let length = a.length();
        b.x = a.x / length;
        b.y = a.y / length;
        b.z = a.z / length;

        return b;
    };

    global.Vec3 = Vec3;

}(this));
