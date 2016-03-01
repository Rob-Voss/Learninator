/**
 * Original code borrowed from https://github.com/felipecsl/random-maze-generator
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

    class Grid {
        /**
         * Grid
         * @name Grid
         * @constructor
         *
         * @param {gridOpts} opts - The options for the Grid
         * @returns {Grid}
         */
        constructor(opts) {
            this.xCount = Utility.getOpt(opts, 'xCount', 6);
            this.yCount = Utility.getOpt(opts, 'yCount', 6);
            this.width = Utility.getOpt(opts, 'width', 600);
            this.height = Utility.getOpt(opts, 'height', 600);
            this.cheats = Utility.getOpt(opts, 'cheats', false);
            this.buffer = Utility.getOpt(opts, 'buffer', 2);
            this.cellWidth = (this.width - this.buffer) / this.xCount;
            this.cellHeight = (this.height - this.buffer) / this.yCount;

            this.removedEdges = [];
            this.cells = [];
            this.path = [];
            this.walls = [];
            this.map = new Map();
            this.cellsContainer = new PIXI.Container();

            let c, cs;
            for (let x = 0; x < this.xCount; x++) {
                for (let y = 0; y < this.yCount; y++) {
                    c = new Cell(x, y, this.cellWidth, this.cellHeight);
                    c.population = [];
                    this.cells.push(c);

                    cs = new CellShape(c.corners, this.cheats);
                    this.cellsContainer.addChild(cs.shape);
                }
            }
            this.mapCells();

            return this;
        }

        /**
         * Returns true if there is an edge between c1 and c2
         * @param {Cell} c1
         * @param {Cell} c2
         * @returns {boolean}
         */
        areConnected(c1, c2) {
            if (!c1 || !c2) {
                return false;
            }

            if (Math.abs(c1.x - c2.x) > 1 || Math.abs(c1.y - c2.y) > 1) {
                return false;
            }

            var removedEdge = _.detect(this.removedEdges, function (edge) {
                return _.include(edge, c1) && _.include(edge, c2);
            });

            return removedEdge === undefined;
        }

        /**
         * Returns all neighbors of this Cell that are separated by an edge
         * @param {Cell} c
         * @returns {Array}
         */
        connectedNeighbors(c) {
            var con;
            return _.select(this.neighbors(c), (c0) => {
                con = this.areConnected(c, c0);

                return con;
            });
        }

        /**
         * Returns all neighbors of this Cell that are NOT separated by an edge
         * This means there is a maze path between both cells.
         * @param {Cell} cell
         * @returns {Array}
         */
        disconnectedNeighbors(cell) {
            var disc;
            return _.reject(this.neighbors(cell), (c0) => {
                disc = this.areConnected(cell, c0);

                return disc;
            });
        }

        /**
         * Get a Cell at a specific point
         * @param {number} x
         * @param {number} y
         * @returns {Cell}
         */
        getCellAt(x, y) {
            let column = this.map.get(x),
                row = column ? column.get(y) : false,
                cell = row ? row.get(-x - y) : false;

            return cell;
        }

        /**
         * Get the distance between two Cells
         * @param {Cell} c1
         * @param {Cell} c2
         * @returns {number}
         */
        getCellDistance(c1, c2) {
            var xDist = Math.abs(c1.x - c2.x),
                yDist = Math.abs(c1.y - c2.y);

            return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
        }

        /**
         * Return the centered location of the entity within a grid
         * @param {Cell} cell
         * @returns {Object}
         */
        getCenterXY(cell) {
            let x = cell.corners[2].x - (this.cellWidth / 2),
                y = cell.corners[2].y - (this.cellHeight / 2);

            return new Point(x, y);
        }

        /**
         * Return a PIXI container with the grid
         * @returns {PIXI.Container|*}
         */
        getGrid() {
            return this.cellsContainer;
        }

        /**
         * Return the location of the entity within a grid
         * @param {Entity} entity
         * @returns {Entity}
         */
        getGridLocation(entity) {
            if (entity.type !== undefined) {
                return this.pixelToCell(entity.pos.x, entity.pos.y);
            }
        }

        /**
         * Add the cells to a hash map
         */
        mapCells() {
            let column, row, c;
            this.cells.forEach((cell) => {
                // check x
                column = this.map.get(cell.x);
                if (!column) {
                    this.map.set(cell.x, new Map());
                    column = this.map.get(cell.x);
                }
                // check y
                row = column.get(cell.y);
                if (!row) {
                    column.set(cell.y, new Map());
                    row = column.get(cell.y);
                }
                // check s
                c = row.get(-cell.x - cell.y);
                if (!c) {
                    row.set(-cell.x - cell.y, cell);
                    cell = row.get(-cell.x - cell.y);
                }
            });

            return this;
        }

        /**
         * Returns all neighbors of this cell, regardless if they are connected or not.
         * @param {Cell} c
         * @returns {Array}
         */
        neighbors(c) {
            let neighbors = [];
            if (c !== null) {
                let topCell = this.getCellAt(c.x, c.y - 1),
                    rightCell = this.getCellAt(c.x + 1, c.y),
                    bottomCell = this.getCellAt(c.x, c.y + 1),
                    leftCell = this.getCellAt(c.x - 1, c.y);

                if (topCell) {
                    neighbors.push(topCell);
                }
                if (rightCell) {
                    neighbors.push(rightCell);
                }
                if (bottomCell) {
                    neighbors.push(bottomCell);
                }
                if (leftCell) {
                    neighbors.push(leftCell);
                }
            }
            return neighbors;
        }

        /**
         * @param {number} x
         * @param {number} y
         */
        pixelToCell(x, y) {
            var foundCell = false;
            this.cells.some((cell) => {
                let inIt = x >= cell.corners[0].x
                    && x <= cell.corners[2].x
                    && y >= cell.corners[0].y
                    && y <= cell.corners[2].y;
                if (inIt) {
                    foundCell = cell;
                }
            });

            return foundCell;
        }

        /**
         * Remove the edge from between two Cells
         * @param {Cell} c1
         * @param {Cell} c2
         */
        removeEdgeBetween(c1, c2) {
            this.removedEdges.push([c1, c2]);

            return this;
        }

        /**
         * Returns all neighbors of this Cell that aren't separated by an edge
         * @param {Cell} c
         * @returns {boolean}
         */
        unvisitedNeighbors(c) {
            var unv;
            return _.select(this.connectedNeighbors(c), function (c0) {
                unv = !c0.visited;
                return unv;
            });
        }
    }

    global.Grid = Grid;

}(this));
