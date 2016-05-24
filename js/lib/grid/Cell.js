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
         * @param {number} size
         * @returns {Cell}
         */
        constructor(x = 0, y = 0, size = 20) {
            this.x = x;
            this.y = y;
            this.z = -x - y;
            this.size = size;
            this.visited = false;
            this.parent = null;
            this.heuristic = 0;
            this.reward = 0;
            this.neighbors = [];
            this.population = new Map();

            return this;
        }

        /**
         * Add a Cell to another one
         * @param {Cell} a
         * @param {Cell} b
         * @returns {Hex}
         */
        add(a, b) {
            return new Cell(a.x - b.x, a.y - b.y);
        }

        /**
         * Get the direction
         * @param {Cell} cell
         * @param {number} dir
         * @returns {*}
         */
        direction(cell, dir) {
            switch (dir) {
                case 0: // Up
                    cell = new Cell(cell.x, cell.y - 1);
                    break;
                case 1: // Right
                    cell = new Cell(cell.x + 1, cell.y);
                    break;
                case 2: // Down
                    cell = new Cell(cell.x, cell.y + 1);
                    break;
                case 3: // Left
                    cell = new Cell(cell.x - 1, cell.y);
                    break;

            }
            return cell;
        }

        /**
         * Get the neighbor
         * @param {Cell} cell
         * @param {number} dir
         * @returns {Hex}
         */
        neighbor(cell, dir) {
            switch (dir) {
                case 0: // Up
                    cell = new Cell(cell.x, cell.y - 1);
                    break;
                case 1: // Right
                    cell = new Cell(cell.x + 1, cell.y);
                    break;
                case 2: // Down
                    cell = new Cell(cell.x, cell.y + 1);
                    break;
                case 3: // Left
                    cell = new Cell(cell.x - 1, cell.y);
                    break;

            }
            return cell;
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
