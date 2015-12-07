(function (global) {
    "use strict";

    /**
     * A Cube
     * @name HeCubex
     * @constructor
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Cube}
     */
    var Cube = function (x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    };

    Cube.prototype = {
        /**
         * Convert coords to string
         * @returns {string}
         */
        toString: function () {
            return this.v().join(",");
        },
        /**
         * Get an array of coords
         * @returns {*[]}
         */
        v: function () {
            return [this.x, this.y, this.z];
        },
        /**
         * Rotate the Cube to the left
         * @returns {Cube}
         */
        rotateLeft: function () {
            return new Cube(-this.y, -this.z, -this.x);
        },
        /**
         * Rotate the Cube to the right
         * @returns {Cube}
         */
        rotateRight: function () {
            return new Cube(-this.z, -this.x, -this.y);
        },
        /**
         * Check if this Cube is equal to another
         * @param {Cube} other
         * @returns {boolean}
         */
        equals: function (other) {
            return this.x === other.x && this.y === other.y && this.z === other.z;
        }
    };

    /**
     * A Hex
     * @name Hex
     * @constructor
     *
     * @param {number} q
     * @param {number} r
     * @param {number} s
     * @param {Point} position
     * @param {number} size
     * @param {boolean} pointy
     * @returns {Hex}
     */
    var Hex = function (q, r, s, position, size, pointy) {
        var _this = this;
        this.q = q || 0;
        this.r = r || 0;
        this.s = s || -q - r;
        this.position = position || new Point(0, 0);
        this.size = size || 10;
        this.pointy = pointy || false;
        this.corners = [];
        this.hitCoords = [];
        for (let i = 0; i < 6; i++) {
            var angleAdd = (this.pointy) ? 30 : 0,
                angleDeg = 60 * i + angleAdd,
                angleRad = Math.PI / 180 * angleDeg;
            this.corners.push(new Point(this.position.x + this.size * Math.cos(angleRad),
                this.position.y + this.size * Math.sin(angleRad)));
            this.hitCoords.push(this.position.x + this.size * Math.cos(angleRad),
                this.position.y + this.size * Math.sin(angleRad));
        }

        this.color = this.colorForHex();
        this.shape = new PIXI.Graphics();
        this.shape.lineStyle(1, 0x000000, 1);
        this.shape.alpha = 0.5;
        this.shape.interactive = true;
        this.shape.beginFill(this.color);
        this.shape.drawPolygon(this.corners);
        this.shape.endFill();
        this.shape.hitArea = new PIXI.Polygon(this.hitCoords);

        this.shape.mouseover = function (mouseData) {
            console.log(_this.toString());
        };

        this.shape.click = function (mouseData) {
            console.log(_this.toString());
        };
        return this;
    };

    Hex.prototype = {
        /**
         * Add a Hex to this one
         * @param {Hex} hex
         * @returns {Hex}
         */
        add: function (hex) {
            return new Hex(this.q + hex.q, this.r + hex.r, this.s + hex.s);
        },
        /**
         * Return a color for this Hex based on it's coords
         * x = green, y = purple, z = blue
         * @returns {number}
         */
        colorForHex: function () {
            if (this.q === 0 && this.r === 0 && this.s === 0) {
                return 0x000000;
            } else if (this.q === 0) {
                return 0x59981b;
            } else if (this.r === 0) {
                return 0x0077b3;
            } else if (this.s === 0) {
                return 0xb34db2;
            } else {
                return 0xC0C0C0;
            }
        },
        /**
         * Get the diagonal coords for this Hex
         * @param {number} direction
         * @returns {*}
         */
        diagonals: function (direction) {
            return hexDiagonals[direction];
        },
        /**
         * Get the neighbor
         * @param {number} direction
         * @returns {*|Hex}
         */
        diagonalNeighbor: function (direction) {
            return this.add(this.diagonals[direction]);
        },
        /**
         * Get the direction
         * @param {number} direction
         * @returns {*}
         */
        direction: function (direction) {
            return hexDirections[direction];
        },
        /**
         * Distance from another Hex
         * @param {Hex} hex
         * @returns {*}
         */
        distance: function (hex) {
            return this.length(this.subtract(hex));
        },
        /**
         * Get the length of the Hex
         * @returns {number}
         */
        length: function () {
            return Math.trunc((Math.abs(this.q) + Math.abs(this.r) + Math.abs(this.s)) / 2);
        },
        /**
         * Perform a linear interpolation on the Hex
         * @param {Hex} hex
         * @param {number} t
         * @returns {Hex}
         */
        lerp: function (hex, t) {
            this.q += (hex.q - this.q) * t;
            this.r += (hex.r - this.r) * t;
            this.s += (hex.s - this.s) * t;

            return this;
        },
        /**
         * Return the coords to draw a line from one Hex to another
         * @param {Hex} hex
         * @returns {Array}
         */
        lineDraw: function (hex) {
            var N = this.distance(hex),
                results = [],
                step = 1.0 / Math.max(N, 1);

            for (let i = 0; i <= N; i++) {
                results.push(this.round(this.lerp(hex, step * i)));
            }

            return results;
        },
        /**
         * Get the neighbor
         * @param {number} direction
         * @returns {*|Hex}
         */
        neighbor: function (direction) {
            return this.add(this.direction(direction));
        },
        /**
         * Round the Hex
         * @returns {Hex}
         */
        round: function () {
            var q = Math.trunc(Math.round(this.q)),
                r = Math.trunc(Math.round(this.r)),
                s = Math.trunc(Math.round(this.s)),
                q_diff = Math.abs(q - this.q),
                r_diff = Math.abs(r - this.r),
                s_diff = Math.abs(s - this.s);

            if (q_diff > r_diff && q_diff > s_diff) {
                q = -r - s;
            } else if (r_diff > s_diff) {
                r = -q - s;
            } else {
                s = -q - r;
            }
            this.q = q;
            this.r = r;
            this.s = s;

            return this;
        },
        /**
         * Scale the Hex according to the scalar
         * @param {number} s
         * @returns {Hex}
         */
        scale: function (s) {
            this.q *= s;
            this.r *= s;
            this.s *= s;

            return this;
        },
        /**
         * Subtract a Hex
         * @param {Hex} hex
         * @returns {Hex}
         */
        subtract: function (hex) {
            return new Hex(this.q - hex.q, this.r - hex.r, this.s - hex.s);
        },
        /**
         * Convert the Hex coords to a string
         * @returns {string}
         */
        toString: function () {
            return this.q + ":" + this.r + ":" + this.s;
        }
    };

    var hexDirections = [new Hex(1, 0, -1), new Hex(1, -1, 0), new Hex(0, -1, 1), new Hex(-1, 0, 1), new Hex(-1, 1, 0), new Hex(0, 1, -1)],
        hexDiagonals = [new Hex(2, -1, -1), new Hex(1, -2, 1), new Hex(-1, -1, 2), new Hex(-2, 1, 1), new Hex(-1, 2, -1), new Hex(1, 1, -2)];
    Hex.hexDirections = hexDirections;
    Hex.hexDiagonals = hexDiagonals;

    global.Cube = Cube;
    global.Hex = Hex;

})(this);
