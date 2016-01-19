var Hex = Hex || {},
    Cube = Cube || {};

/**
 * Inspired by https://github.com/RobertBrewitz/axial-hexagonal-grid
 */
(function (global) {
    "use strict";

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
    var Cube = function (x, y, z) {
        Hex.call(this, x, y, -x - y);

        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    };

    Cube.prototype = Object.create(Hex.prototype);
    Cube.prototype.constructor = Hex;

    /**
     * Check if this Cube is equal to another
     * @param {Cube} other
     * @returns {boolean}
     */
    Cube.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    };

    /**
     * Rotate the Cube to the left
     * @returns {Cube}
     */
    Cube.prototype.rotateLeft = function () {
        return new Cube(-this.y, -this.z, -this.x);
    };

    /**
     * Rotate the Cube to the right
     * @returns {Cube}
     */
    Cube.prototype.rotateRight = function () {
        return new Cube(-this.z, -this.x, -this.y);
    };

    /**
     * Get an array of coords
     * @returns {*[]}
     */
    Cube.prototype.v = function () {
        return [this.x, this.y, this.z];
    };

    global.Cube = Cube;

})(this);
