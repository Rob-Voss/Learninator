/**
 * Original code borrowed from https://github.com/felipecsl/random-maze-generator
 */
(function (global) {
    "use strict";

    var Utility = global.Utility || {},
        Grid = global.Grid || {},
        Wall = global.Wall || {},
        Vec = global.Vec || {};

    /**
     * Options for the Maze
     * @typedef {Object} mazeOpts
     * @property {number} opts.xCount - The horizontal Cell count
     * @property {number} opts.yCount - The vertical Cell count
     * @property {number} opts.width - The width
     * @property {number} opts.height - The height
     * @property {boolean} opts.cheats - Show info about Maze
     * @property {boolean} opts.closed - Whether the maze is closed or not
     * @property {number} opts.buffer - The buffer in pixels to use
     * @property {Grid} opts.grid - The Grid
     */

    /**
     * A maze generator
     * @name Maze
     * @constructor
     *
     * @param {mazeOpts} opts - The options for the Maze
     * @returns {Maze}
     */
    var Maze = function (opts) {
        this.xCount = Utility.getOpt(opts, 'xCount', 6);
        this.yCount = Utility.getOpt(opts, 'yCount', 6);
        this.width = Utility.getOpt(opts, 'width', 600);
        this.height = Utility.getOpt(opts, 'height', 600);
        this.cheats = Utility.getOpt(opts, 'cheats', false);
        this.closed = Utility.getOpt(opts, 'closed', false);
        this.buffer = Utility.getOpt(opts, 'buffer', 0);
        this.grid = Utility.getOpt(opts, 'grid', {});
        this.cellWidth = (this.width - this.buffer) / this.xCount;
        this.cellHeight = (this.height - this.buffer) / this.yCount;

        this.walls = [];
        this.cellStack = [];
        this.path = [];

        this.draw();
        // this.solve();

        return this;
    };

    Maze.prototype = {
        /**
         * Add a Wall to the Maze
         * @param {Vec} v1
         * @param {Vec} v2
         * @returns {Maze}
         */
        addWall: function (v1, v2) {
            this.walls.push(new Wall(v1, v2, this.cheats));

            return this;
        },
        /**
         * Draw it
         * @returns {Maze}
         */
        draw: function () {
            this.generate();
            if (this.closed) {
                this.drawBorders();
            }
            this.drawMaze();

            return this;
        },
        /**
         * Draw the borders
         * @returns {Maze}
         */
        drawBorders: function () {
            this.addWall(new Vec((this.closed ? this.buffer : this.cellWidth), this.buffer), new Vec(this.width - this.buffer, this.buffer));
            this.addWall(new Vec(this.width - this.buffer, this.buffer), new Vec(this.width - this.buffer, this.height - this.buffer));
            this.addWall(new Vec(this.width - (this.closed ? this.buffer : this.cellWidth), this.height - this.buffer), new Vec(this.buffer, this.height - this.buffer));
            this.addWall(new Vec(this.buffer, this.height - this.buffer), new Vec(this.buffer, this.buffer));

            return this;
        },
        /**
         * Draw the solution
         * @param {Canvas} canvas
         * @returns {Maze}
         */
        drawSolution: function (canvas) {
            let V, vW, vH, vX, vY, x, y,
                _ctx = canvas.getContext("2d"),
                _this = this,
                path = this.path;
            _ctx.fillStyle = "rgba(0,165,0,.1)";
            _ctx.strokeStyle = "rgb(0,0,0)";
            for (let i = 0; i < this.path.length; i++) {
                V = path[i];
                vW = this.cellWidth;
                vH = this.cellHeight;
                vX = V.x;
                vY = V.y;
                // Get the cell X coords and multiply by the cell width
                x = _this.grid.cells[vX][vY].x * vW;
                // Get the cell Y coords and multiply by the cell height
                y = _this.grid.cells[vX][vY].y * vH;

                (function () {
                    _ctx.fillRect(x, y, vW, vH);
                })();
            }

            return this;
        },
        /**
         * Draw the Maze
         * @returns {Maze}
         */
        drawMaze: function () {
            var grid = this.grid,
                drawnEdges = [],
                neighbs = [],
                v;

            let edgeAlreadyDrawn = function (v1, v2) {
                return _.detect(drawnEdges, function (edge) {
                        return _.include(edge, v1) && _.include(edge, v2);
                    }) !== undefined;
            };

            for (let i = 0; i < grid.cells.length; i++) {
                v = grid.cells[i];
                for (let c = 0; c < v.corners.length; c++) {
                    let neighb = v.neighbor(v, c);
                    neighbs[c] = grid.getCellAt(neighb.q, neighb.r, neighb.s);
                }
                neighbs.forEach((hex, id) => {
                    if (!edgeAlreadyDrawn(v, hex) && grid.areConnected(v, hex)) {
                        this.addWall(
                            new Vec(hex.corners[id].x, hex.corners[id].y),
                            new Vec(hex.corners[id+1].x, hex.corners[id+1].y)
                        );
                        drawnEdges.push([v, hex]);
                    }
                });

            }

            return this;
        },
        /**
         * Build the maze
         * @returns {Maze}
         */
        generate: function () {
            var initialCell = this.grid.getCellAt(0, 0);
            this.recurse(initialCell);

            return this;
        },
        /**
         * Recurse through a Cell's neighbors
         * @param {Cell} cell
         * @returns {Maze}
         */
        recurse: function (cell) {
            cell.visit();
            let neighbors = this.grid.unvisitedNeighbors(cell);
            if (neighbors.length > 0) {
                let randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.cellStack.push(cell);
                this.grid.removeEdgeBetween(cell, randomNeighbor);
                this.recurse(randomNeighbor);
            } else {
                let waitingCell = this.cellStack.pop();
                if (waitingCell) {
                    this.recurse(waitingCell);
                }
            }

            return this;
        },
        /**
         * Solve the Maze
         * @returns {Maze}
         */
        solve: function () {
            let closedSet = [],
            // Top left cell
                startCell = this.grid.getCellAt(0, 0),
            // Bottom right cell
                targetCell = this.grid.getCellAt(this.xCount - 1, this.yCount - 1),
                openSet = [startCell],
                searchCell = startCell,
                neighbors, neighbor;

            while (openSet.length > 0) {
                neighbors = this.grid.disconnectedNeighbors(searchCell);
                for (let i = 0; i < neighbors.length; i++) {
                    neighbor = neighbors[i];
                    if (neighbor === targetCell) {
                        neighbor.parent = searchCell;
                        this.path = neighbor.pathToOrigin();
                        this.grid.path = this.path;
                        openSet = [];
                        return;
                    }
                    if (!_.include(closedSet, neighbor)) {
                        if (!_.include(openSet, neighbor)) {
                            openSet.push(neighbor);
                            neighbor.parent = searchCell;
                            neighbor.heuristic = neighbor.score() + this.grid.getCellDistance(neighbor, targetCell);
                        }
                    }
                }
                closedSet.push(searchCell);
                openSet.remove(_.indexOf(openSet, searchCell));
                searchCell = null;

                _.each(openSet, function (cell) {
                    if (!searchCell) {
                        searchCell = cell;
                    } else if (searchCell.heuristic > cell.heuristic) {
                        searchCell = cell;
                    }
                });
            }

            return this;
        },
        /**
         * Return the walls
         * @returns {Array}
         */
        walls: function () {
            return this.walls;
        }
    };
    global.Maze = Maze;

}(this));