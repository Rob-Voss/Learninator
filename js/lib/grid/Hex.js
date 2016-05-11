/**
 * Inspired by https://github.com/RobertBrewitz/axial-hexagonal-grid
 */
(function (global) {
    "use strict";

    class Hex {

        /**
         * A Hex
         * @name Hex
         * @constructor
         *
         * @param {number} q
         * @param {number} r
         * @param {number} s
         * @returns {Hex}
         */
        constructor(q = 0, r = 0, s = 0) {
            this.q = q;
            this.r = r;
            this.s = s || -q - r;
            this.visited = false;
            this.parent = null;
            this.heuristic = 0;
            this.reward = 0;

            return this;
        }

        /**
         * Add a Hex to another one
         * @param {Hex} a
         * @param {Hex} b
         * @returns {Hex}
         */
        add(a, b) {
            return new Hex(a.q - b.q, a.r - b.r, a.s + b.s);
        }

        /**
         * Get the diagonal coords for this Hex
         * @param {number} direction
         * @returns {*}
         */
        diagonals(direction) {
            return hexDiagonals[direction];
        }

        /**
         * Get the neighbor
         * @param {number} direction
         * @returns {*|Hex}
         */
        diagonalNeighbor(hex, direction) {
            return this.add(hex, this.diagonals[direction]);
        }

        /**
         * Get the direction
         * @param {number} direction
         * @returns {*}
         */
        direction(direction) {
            return hexDirections[direction];
        }

        /**
         * Distance from another Hex
         * @param {Hex} a
         * @param {Hex} b
         * @returns {number}
         */
        distance(a, b) {
            return this.len(this.subtract(a, b));
        }

        /**
         * Get the length of the Hex
         * @returns {number}
         */
        len(hex) {
            return Math.trunc((Math.abs(hex.q) + Math.abs(hex.r) + Math.abs(hex.s)) / 2);
        }

        /**
         * Perform a linear interpolation on the Hex
         * @param {Hex} a
         * @param {Hex} b
         * @param {number} t
         * @returns {Hex}
         */
        lerp(a, b, t) {
            return new Hex(a.q + (b.q - a.q) * t, a.r + (b.r - a.r) * t);
        }

        /**
         * Return the coords to draw a line from one Hex to another
         * @param {Hex} a
         * @param {Hex} b
         * @returns {Array}
         */
        lineDraw(a, b) {
            var N = this.distance(a, b),
                results = [],
                step = 1.0 / Math.max(N, 1);
            for (let i = 0; i <= N; i++) {
                results.push(this.round(this.lerp(a, b, step * i)));
            }

            return results;
        }

        /**
         * Get the neighbor
         * @param {Hex} hex
         * @param {number} direction
         * @returns {*|Hex}
         */
        neighbor(hex, direction) {
            return this.add(hex, this.direction(direction));
        }

        /**
         * Round the Hex
         * @param {Hex} hex
         * @returns {Hex}
         */
        round(hex) {
            let q = Math.trunc(Math.round(hex.q)),
                r = Math.trunc(Math.round(hex.r)),
                s = Math.trunc(Math.round(hex.s)),
                qDiff = Math.abs(q - hex.q),
                rDiff = Math.abs(r - hex.r),
                sDiff = Math.abs(s - hex.s);
            if (qDiff > rDiff && qDiff > sDiff) {
                q = -r - s;
            } else if (rDiff > sDiff) {
                r = -q - s;
            } else {
                s = -q - r;
            }

            return new Hex(q, r, s);
        }

        /**
         * Scale the Hex according to the scalar
         * @param {Hex} hex
         * @param {number} k
         * @returns {Hex}
         */
        scale(hex, k) {
            return new Hex(hex.q * k, hex.r * k, hex.s * k);
        }

        /**
         * Subtract a Hex
         * @param {Hex} a
         * @param {Hex} b
         * @returns {Hex}
         */
        subtract(a, b) {
            return new Hex(a.q - b.q, a.r - b.r, a.s - b.s);
        }

        /**
         * Get an array of coords
         * @returns {*[]}
         */
        toArray() {
            return [this.q, this.r, this.s];
        }

        /**
         * Convert coords to string
         * @returns {string}
         */
        toString() {
            return this.toArray().join(",");
        }
    }

    var hexDirections = [new Hex(1, 0, -1), new Hex(1, -1, 0), new Hex(0, -1, 1), new Hex(-1, 0, 1), new Hex(-1, 1, 0), new Hex(0, 1, -1)],
        hexDiagonals = [new Hex(2, -1, -1), new Hex(1, -2, 1), new Hex(-1, -1, 2), new Hex(-2, 1, 1), new Hex(-1, 2, -1), new Hex(1, 1, -2)];
    Hex.hexDirections = hexDirections;
    Hex.hexDiagonals = hexDiagonals;

    global.Hex = Hex;

})(this);
