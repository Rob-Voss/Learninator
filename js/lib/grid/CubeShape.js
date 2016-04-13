(function (global) {
    "use strict";

    class CubeShape extends Cube {
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
            super(x, y, z);

            return this;
        }
    }

    global.CubeShape = CubeShape;

})(this);
