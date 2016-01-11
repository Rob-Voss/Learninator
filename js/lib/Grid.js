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
    var Cell = function (x, y, width, height) {
        let self = this;
        this.x = x;
        this.y = y;
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

        this.shape = new PIXI.Graphics();
        this.shape.interactive = true;
        this.shape
            .on('mousedown', function (event) {
                this.data = event.data;
                self.color = 0x00FF00;
            })
            .on('mouseup', function (event) {
                self.color = 0xFFFFFF;
            })
            .on('mouseover', function (event) {
                self.color = 0xFF0000;
            })
            .on('mouseout', function (event) {
                self.color = 0xFFFFFF;
            });
        this.shape.entity = self;
        this.shape.alpha = 0.09;
        this.shape.color = this.color;

        return this;
    };

    Cell.prototype = {
        draw: function () {
            this.shape.clear();
            this.shape.lineStyle(1, 0x000000);
            this.shape.beginFill(this.color);
            this.shape.moveTo(this.corners[0].x, this.corners[0].y);
            this.shape.lineTo(this.corners[1].x, this.corners[1].y);
            this.shape.lineTo(this.corners[2].x, this.corners[2].y);
            this.shape.lineTo(this.corners[3].x, this.corners[3].y);
            this.shape.lineTo(this.corners[0].x, this.corners[0].y);
            this.shape.endFill();

            if (this.cheatOverlay !== undefined) {
                this.shape.removeChild(this.cheatOverlay);
            }
            this.cheatOverlay = new PIXI.Container();

            let txtOpts = {font: "10px Arial", fill: "#000000", align: "center"},
                posText = new PIXI.Text(this.toString(), txtOpts);
            posText.position.set(this.corners[0].x + this.width/2, this.corners[0].y + this.height/2 + 13);
            this.cheatOverlay.addChild(posText);

            this.shape.addChild(this.cheatOverlay);
        },
        /**
         * Calculate the path to the origin
         * @returns {Array}
         */
        pathToOrigin: function () {
            var path = [this],
                p = this.parent;

            while (p) {
                path.push(p);
                p = p.parent;
            }
            path.reverse();

            return path;
        },
        /**
         * Score
         * @returns {number}
         */
        score: function () {
            var total = 0,
                p = this.parent;

            while (p) {
                ++total;
                p = p.parent;
            }

            return total;
        },
        /**
         * Convert coords to string
         * @returns {string}
         */
        toString: function () {
            return this.v().join(",");
        },
        /**
         * Mark it as visited
         * @return {Cell}
         */
        visit: function () {
            this.visited = true;

            return this;
        },
        /**
         * Get an array of coords
         * @returns {*[]}
         */
        v: function () {
            return [this.x, this.y];
        }
    };

    /**
     * Grid
     * @name Grid
     * @constructor
     *
     * @param {gridOpts} opts - The options for the Grid
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

    Grid.prototype = {
        /**
         * Returns true if there is an edge between c1 and c2
         * @param {Cell} c1
         * @param {Cell} c2
         * @returns {boolean}
         */
        areConnected: function (c1, c2) {
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
        },
        /**
         * Returns all neighbors of this Cell that are separated by an edge
         * @param {Cell} c
         * @returns {Array}
         */
        connectedNeighbors: function (c) {
            var _this = this, con;
            return _.select(this.neighbors(c), function (c0) {
                con = _this.areConnected(c, c0);

                return con;
            });
        },
        /**
         * Returns all neighbors of this Cell that are NOT separated by an edge
         * This means there is a maze path between both cells.
         * @param {Cell} c
         * @returns {Array}
         */
        disconnectedNeighbors: function (c) {
            var _this = this, disc;
            return _.reject(this.neighbors(c), function (c0) {
                disc = _this.areConnected(c, c0);

                return disc;
            });
        },
        /**
         * Get a Cell at a specific point
         * @param {number} x
         * @param {number} y
         * @returns {Cell}
         */
        getCellAt: function (x, y) {
            if (x >= this.xCount || y >= this.yCount || x < 0 || y < 0 || !this.cells[x]) {
                return null;
            }

            return this.cells[x][y];
        },
        /**
         * Get the distance between two Cells
         * @param {Cell} c1
         * @param {Cell} c2
         * @returns {number}
         */
        getCellDistance: function (c1, c2) {
            var xDist = Math.abs(c1.x - c2.x),
                yDist = Math.abs(c1.y - c2.y);

            return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
        },
        /**
         * Return a PIXI container with the grid
         * @returns {PIXI.Container|*}
         */
        getGrid: function () {
            let self = this,
                c = new PIXI.Container();

            this.cells.forEach(function (row) {
                if (Array.isArray(row)) {
                    row.forEach(function (cell) {
                        cell.population = [];
                        c.addChild(cell.shape);
                    })
                } else {
                    row.population = [];
                    c.addChild(row.shape);
                }
            });

            return c;
        },
        /**
         * Return the location of the entity within a grid
         * @param {Entity} entity
         * @returns {Object}
         */
        getGridLocation: function (entity) {
            var xCell, yCell;
            for (let x = 0; x < this.xCount; x++) {
                xCell = this.cells[x];
                for (let y = 0; y < this.yCount; y++) {
                    yCell = xCell[y];
                    if ((entity.pos.x >= yCell.corners[0].x && entity.pos.x <= yCell.corners[2].x) &&
                        (entity.pos.y >= yCell.corners[0].y && entity.pos.y <= yCell.corners[2].y)) {
                        entity.gridLocation = this.cells[x][y];

                        return entity;
                    }
                }
            }
        },
        /**
         * Return the centered location of the entity within a grid
         * @param {Cell} c
         * @returns {Object}
         */
        getPositionFromGridLocation: function (c) {
            let x = c.coords.bottom.right.x - (this.cellWidth / 2),
                y = c.coords.bottom.right.y - (this.cellHeight / 2);

            return new Vec(x, y);
        },
        /**
         * Returns all neighbors of this cell, regardless if they are connected or not.
         * @param {Cell} c
         * @returns {Array}
         */
        neighbors: function (c) {
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
        },
        /**
         * Remove the edge from between two Cells
         * @param {Cell} c1
         * @param {Cell} c2
         */
        removeEdgeBetween: function (c1, c2) {
            this.removedEdges.push([c1, c2]);
        },
        /**
         * Returns all neighbors of this Cell that aren't separated by an edge
         * @param {Cell} c
         * @returns {boolean}
         */
        unvisitedNeighbors: function (c) {
            var unv;
            return _.select(this.connectedNeighbors(c), function (c0) {
                unv = !c0.visited;
                return unv;
            });
        }
    };

    global.Cell = Cell;
    global.Grid = Grid;

}(this));
