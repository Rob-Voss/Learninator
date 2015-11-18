/**
 * Original code borrowed from https://github.com/felipecsl/random-maze-generator
 *
 */
(function (global) {
    "use strict";

    /**
     * Create a cell
     * @name Cell
     * @constructor
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} width
     * @param {Number} height
     * @returns {Cell}
     */
    var Cell = function (x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.visited = false;
        this.parent = null;
        this.heuristic = 0;
        this.reward = 0;
        this.population = [];
        this.populationCounts = {};

        this.coords = {
            top: {
                left: {
                    x: this.x * this.width,
                    y: this.y * this.height
                },
                right: {
                    x: this.x * this.width + this.width,
                    y: this.y * this.height
                }
            },
            bottom: {
                left: {
                    x: this.x * this.width,
                    y: this.y * this.height + this.height
                },
                right: {
                    x: this.x * this.width + this.width,
                    y: this.y * this.height + this.height
                }
            }
        };

        return this;
    };

    /**
     * Calculate the path to the origin
     * @returns {Array}
     */
    Cell.prototype.pathToOrigin = function () {
        var path = [this],
            p = this.parent;

        while (p) {
            path.push(p);
            p = p.parent;
        }
        path.reverse();

        return path;
    };

    /**
     * Score
     * @returns {Number}
     */
    Cell.prototype.score = function () {
        var total = 0,
            p = this.parent;

        while (p) {
            ++total;
            p = p.parent;
        }

        return total;
    };

    /**
     * Mark it as visited
     * @return {Cell}
     */
    Cell.prototype.visit = function () {
        this.visited = true;

        return this;
    };

    /**
     * Grid
     * @name Grid
     * @constructor
     *
     * @param {Object} opts - The options for the Grid
     * @param {number} opts.xCount - The horizontal Cell count
     * @param {number} opts.yCount - The vertical Cell count
     * @param {number} opts.width - The width
     * @param {number} opts.height - The height
     * @returns {Grid}
     */
    var Grid = function (opts) {
        this.xCount = Utility.getOpt(opts, 'xCount', 6);
        this.yCount = Utility.getOpt(opts, 'yCount', 6);
        this.width = Utility.getOpt(opts, 'width', 600);
        this.height = Utility.getOpt(opts, 'height', 600);
        this.cellWidth = this.width / this.xCount;
        this.cellHeight = this.height / this.yCount;

        this.removedEdges = [];
        this.cells = [];
        this.path = [];

        var row, c;
        for (let i = 0; i < this.xCount; i++) {
            this.cells.push([]);
            row = this.cells[i];
            for (let j = 0; j < this.yCount; j++) {
                c = new Cell(i, j, this.cellWidth, this.cellHeight);
                row.push(c);
            }
        }

        return this;
    };

    /**
     * Returns true if there is an edge between c1 and c2
     *
     * @param {Cell} c1
     * @param {Cell} c2
     * @returns {Boolean}
     */
    Grid.prototype.areConnected = function (c1, c2) {
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
    };

    /**
     * Returns all neighbors of this Cell that are separated by an edge
     *
     * @param {Cell} c
     * @returns {Array}
     */
    Grid.prototype.connectedNeighbors = function (c) {
        var _this = this, con;
        return _.select(this.neighbors(c), function (c0) {
            con = _this.areConnected(c, c0);

            return con;
        });
    };

    /**
     * Returns all neighbors of this Cell that are NOT separated by an edge
     * This means there is a maze path between both cells.
     *
     * @param {Cell} c
     * @returns {Array}
     */
    Grid.prototype.disconnectedNeighbors = function (c) {
        var _this = this, disc;
        return _.reject(this.neighbors(c), function (c0) {
            disc = _this.areConnected(c, c0);

            return disc;
        });
    };

    /**
     * Get a Cell at a specific point
     *
     * @param {Number} x
     * @param {Number} y
     * @returns {Cell}
     */
    Grid.prototype.getCellAt = function (x, y) {
        if (x >= this.xCount || y >= this.yCount || x < 0 || y < 0 || !this.cells[x]) {
            return null;
        }

        return this.cells[x][y];
    };

    /**
     * Get the distance between two Cell
     *
     * @param {Cell} c1
     * @param {Cell} c2
     * @returns {Number}
     */
    Grid.prototype.getCellDistance = function (c1, c2) {
        var xDist = Math.abs(c1.x - c2.x),
            yDist = Math.abs(c1.y - c2.y);

        return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
    };

    /**
     * Return the centered location of the entity within a grid
     *
     * @param {Cell} c
     * @returns {Object}
     */
    Grid.prototype.getPositionFromGridLocation = function (c) {
        let x = c.coords.bottom.right.x - (this.cellWidth / 2),
            y = c.coords.bottom.right.y - (this.cellHeight / 2);

        return new Vec(x, y);
    };

    /**
     * Return the location of the entity within a grid
     *
     * @param {Object} entity
     * @returns {Object}
     */
    Grid.prototype.getGridLocation = function (entity) {
        var xCell, yCell;
        for (let x = 0; x < this.xCount; x++) {
            xCell = this.cells[x];
            for (let y = 0; y < this.yCount; y++) {
                yCell = xCell[y];
                if ((entity.position.x >= yCell.coords.top.left.x && entity.position.x <= yCell.coords.bottom.right.x) &&
                    (entity.position.y >= yCell.coords.top.left.y && entity.position.y <= yCell.coords.bottom.right.y)) {
                    entity.gridLocation = this.cells[x][y];

                    return entity;
                }
            }
        }
    };

    /**
     * Returns all neighbors of this cell, regardless if they are connected or not.
     *
     * @param {Cell} c
     * @returns {Array}
     */
    Grid.prototype.neighbors = function (c) {
        var neighbors = [],
            topCell = this.getCellAt(c.x, c.y - 1),
            rightCell = this.getCellAt(c.x + 1, c.y),
            bottomCell = this.getCellAt(c.x, c.y + 1),
            leftCell = this.getCellAt(c.x - 1, c.y);

        if (c.y > 0 && topCell) {
            neighbors.push(topCell);
        }
        if (c.x < this.xCount && rightCell) {
            neighbors.push(rightCell);
        }
        if (c.y < this.yCount && bottomCell) {
            neighbors.push(bottomCell);
        }
        if (c.x > 0 && leftCell) {
            neighbors.push(leftCell);
        }

        return neighbors;
    };

    /**
     * Remove the edge from between two Cells
     *
     * @param {Cell} c1
     * @param {Cell} c2
     * @returns {undefined}
     */
    Grid.prototype.removeEdgeBetween = function (c1, c2) {
        this.removedEdges.push([c1, c2]);
    };

    /**
     * Returns all neighbors of this Cell that aren't separated by an edge
     *
     * @param {Cell} c
     * @returns {unresolved}
     */
    Grid.prototype.unvisitedNeighbors = function (c) {
        var unv;
        return _.select(this.connectedNeighbors(c), function (c0) {
            unv = !c0.visited;
            return unv;
        });
    };

    global.Cell = Cell;
    global.Grid = Grid;

}(this));
