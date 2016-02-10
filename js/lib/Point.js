(function (global) {
    "use strict";

    class Point {
        /**
         * Simple Point
         * @name Point
         * @constructor
         *
         * @param {number} x
         * @param {number} y
         * @returns {Point}
         */
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;

            return this;
        }
    }

    global.Point = Point;

}(this));
