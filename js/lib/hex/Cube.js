/**
 * Inspired by https://github.com/RobertBrewitz/axial-hexagonal-grid
 */
(function (global) {
    "use strict";

    class Cube {
        /**
         * A Cube
         * @name Cube
         * @constructor
         *
         * @param {number} x
         * @param {number} y
         * @param {number} z
         * @param {Layout} layout
         * @returns {Cube}
         */
        constructor(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;

            return this;
        }

        /**
         * Check if this Cube is equal to another
         * @param {Cube} other
         * @returns {boolean}
         */
        equals(other) {
            return this.x === other.x && this.y === other.y && this.z === other.z;
        }

        /**
         * Rotate the Cube to the left
         * @returns {Cube}
         */
        rotateLeft() {
            return new Cube(-this.y, -this.z, -this.x);
        }

        /**
         * Rotate the Cube to the right
         * @returns {Cube}
         */
        rotateRight() {
            return new Cube(-this.z, -this.x, -this.y);
        }

        /**
         * Get an array of coords
         * @returns {*[]}
         */
        toArray() {
            return [this.x, this.y, this.z];
        }

    }

    global.Cube = Cube;

})(this);
