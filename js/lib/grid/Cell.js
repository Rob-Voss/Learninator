/**
 * Original code borrowed from https://github.com/felipecsl/random-maze-generator
 *
 */
(function (global) {
    "use strict";

    class Cell {
        /**
         * Create a cell
         * @name Cell
         * @constructor
         *
         * @param {number} x
         * @param {number} y
         * @param {number} width
         * @param {number} height
         * @returns {Cell}
         */
        constructor(x = 0, y = 0, width = 10, height = 10) {
            this.x = x;
            this.y = y;
            this.z = -x - y;
            this.width = width;
            this.height = height;
            this.corners = [
                new Point(this.x * this.width, this.y * this.height),
                new Point(this.x * this.width + this.width, this.y * this.height),
                new Point(this.x * this.width + this.width, this.y * this.height + this.height),
                new Point(this.x * this.width, this.y * this.height + this.height)
            ];
            this.visited = false;
            this.parent = null;
            this.heuristic = 0;
            this.reward = 0;

            return this;
        }

        /**
         * Calculate the path to the origin
         * @returns {Array}
         */
        pathToOrigin() {
            var path = [this],
                p = this.parent;

            while (p) {
                path.push(p);
                p = p.parent;
            }
            path.reverse();

            return path;
        }

        /**
         * Score
         * @returns {number}
         */
        score() {
            var total = 0,
                p = this.parent;

            while (p) {
                ++total;
                p = p.parent;
            }

            return total;
        }

        /**
         * Get an array of coords
         * @returns {*[]}
         */
        toArray() {
            return [this.x, this.y, this.z];
        }

        /**
         * Convert coords to string
         * @returns {string}
         */
        toString() {
            return this.toArray().join(",");
        }

        /**
         * Mark it as visited
         * @return {Cell}
         */
        visit() {
            this.visited = true;

            return this;
        }

    }

    global.Cell = Cell;

}(this));
