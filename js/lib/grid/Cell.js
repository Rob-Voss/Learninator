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
         * @returns {Cell}
         */
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z || -x - y;
            this.center = new Point(0, 0);
            this.visited = false;
            this.parent = null;
            this.heuristic = 0;
            this.reward = null;
            this.value = null;
            this.corners = [];
            this.polyCorners = [];
            this.neighbors = [];
            this.directions = Cell.cellDirections;
            this.population = new Map();

            return this;
        }

        /**
         * Add a Cell to another one
         * @param {Cell|object} a
         * @param {Cell|object} b
         * @returns {Cell}
         */
        add(a, b) {
            return new Cell(a.x + b.x, a.y + b.y);
        }

        /**
         * Get the neighbor
         * @param {Cell|object} cell
         * @param {number} dir
         * @returns {Cell}
         */
        neighbor(cell, dir) {
            return this.add(cell, Cell.cellDirections[dir]);
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
    Cell.cellDirections = [new Cell(0, -1), new Cell(1, 0), new Cell(0, 1), new Cell(-1, 0)];
    global.Cell = Cell;

}(this));
