/**
 * Original code borrowed from https://github.com/felipecsl/random-maze-generator
 *
 */
(function (global) {
    "use strict";

    /**
     * Options for the Grid
     * @typedef {Object} gridOpts
     * @param {number} xCount - The horizontal Cell count
     * @param {number} yCount - The vertical Cell count
     * @param {number} width - The width
     * @param {number} height - The height
     */

    class Cell extends Point {
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
            super(x, y);
            let self = this;
            this.width = width;
            this.height = height;
            this.pos = new Point(x, y);
            this.color = 0xFFFFFF;
            this.visited = false;
            this.parent = null;
            this.heuristic = 0;
            this.reward = 0;
            this.population = [];
            this.walls = [];
            this.corners = [];

            for (let i = 0; i < 4; i++) {
                let point;
                switch (i) {
                    case 0:
                        point = new Point(this.x * this.width, this.y * this.height);
                        break;
                    case 1:
                        point = new Point(this.x * this.width + this.width, this.y * this.height);
                        break;
                    case 2:
                        point = new Point(this.x * this.width + this.width, this.y * this.height + this.height);
                        break;
                    case 3:
                        point = new Point(this.x * this.width, this.y * this.height + this.height);
                        break;
                }
                this.corners.push(point);
            }

            for (let c = 0; c < this.corners.length; c++) {
                let x1 = this.corners[c].x,
                    y1 = this.corners[c].y,
                    x2, y2;
                if (c !== this.corners.length - 1) {
                    x2 = this.corners[c + 1].x;
                    y2 = this.corners[c + 1].y;
                } else {
                    x2 = this.corners[0].x;
                    y2 = this.corners[0].y;
                }
                let v1 = new Vec(x1, y1),
                    v2 = new Vec(x2, y2);
                this.walls.push(new Wall(v1, v2));
            }

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
         * Convert coords to string
         * @returns {string}
         */
        toString() {
            return this.v().join(",");
        }

        /**
         * Mark it as visited
         * @return {Cell}
         */
        visit() {
            this.visited = true;

            return this;
        }

        /**
         * Get an array of coords
         * @returns {*[]}
         */
        toArray() {
            return [this.x, this.y];
        }
    }

    global.Cell = Cell;

}(this));
