/**
 * Original code borrowed from https://github.com/felipecsl/random-maze-generator
 *
 */
(function (global) {
    "use strict";

    /**
     * A maze generator
     * @name Maze
     * @constructor
     *
     * @param {Object} opts - The options for the Maze
     * @param {number} opts.xCount - The horizontal Cell count
     * @param {number} opts.yCount - The vertical Cell count
     * @param {number} opts.width - The width
     * @param {number} opts.height - The height
     * @returns {Maze}
     */
    var Maze = function (opts) {
        this.xCount = Utility.getOpt(opts, 'xCount', 6);
        this.yCount = Utility.getOpt(opts, 'yCount', 6);
        this.width = Utility.getOpt(opts, 'width', 600);
        this.height = Utility.getOpt(opts, 'height', 600);
        this.cellWidth = this.width / this.xCount;
        this.cellHeight = this.height / this.yCount;

        this.walls = [];
        this.cellStack = [];
        this.path = [];

        this.grid = new Grid(opts);

        this.draw(opts.closed);

        this.solve();

        return this;
    };

    /**
     * Add a Wall to the Maze
     * @param {Vec} v1
     * @param {Vec} v2
     * @returns {Maze}
     */
    Maze.prototype.addWall = function (v1, v2) {
        this.walls.push(new Wall(v1, v2));

        return this;
    };

    /**
     * Return the walls
     * @returns {Array}
     */
    Maze.prototype.walls = function () {
        return this.walls;
    };

    /**
     * Return the Graph's Cells
     * @returns {Array}
     */
    Maze.prototype.graphCells = function () {
        return this.grid.cells;
    };

    /**
     * Draw it
     * @returns {Maze}
     */
    Maze.prototype.draw = function (closed) {
        this.generate();
        this.drawBorders(closed);
        this.drawMaze();

        return this;
    };

    /**
     * Draw the borders
     * @returns {Maze}
     */
    Maze.prototype.drawBorders = function (closed) {
        this.addWall(new Vec(closed ? 0 : this.cellWidth, 0), new Vec(this.width, 0));
        this.addWall(new Vec(this.width, 0), new Vec(this.width, this.height));
        this.addWall(new Vec(this.width - (closed ? 0 : this.cellWidth), this.height), new Vec(0, this.height));
        this.addWall(new Vec(0, this.height), new Vec(0, 0));

        return this;
    };

    /**
     * Draw the solution
     * @param {Canvas} canvas
     * @returns {Maze}
     */
    Maze.prototype.drawSolution = function (canvas) {
        var V, vW, vH, vX, vY, x, y,
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
    };

    /**
     * Draw the Maze
     * @returns {undefined}
     */
    Maze.prototype.drawMaze = function () {
        var grid = this.grid,
            drawnEdges = [],
            x1, y1, x2, y2,
            v, topV, leftV, rightV, bottomV;

        var edgeAlreadyDrawn = function (v1, v2) {
            return _.detect(drawnEdges, function (edge) {
                    return _.include(edge, v1) && _.include(edge, v2);
                }) !== undefined;
        };

        for (let i = 0; i < grid.xCount; i++) {
            for (let j = 0; j < grid.yCount; j++) {
                v = grid.cells[i][j];
                topV = grid.getCellAt(v.x, v.y - 1);
                leftV = grid.getCellAt(v.x - 1, v.y);
                rightV = grid.getCellAt(v.x + 1, v.y);
                bottomV = grid.getCellAt(v.x, v.y + 1);

                if (!edgeAlreadyDrawn(v, topV) && grid.areConnected(v, topV)) {
                    x1 = v.x * this.cellWidth;
                    y1 = v.y * this.cellHeight;
                    x2 = x1 + this.cellWidth;
                    y2 = y1;

                    this.addWall(new Vec(x1, y1), new Vec(x2, y2));
                    drawnEdges.push([v, topV]);
                }

                if (!edgeAlreadyDrawn(v, leftV) && grid.areConnected(v, leftV)) {
                    x2 = x1;
                    y2 = y1 + this.cellHeight;

                    this.addWall(new Vec(x1, y1), new Vec(x2, y2));
                    drawnEdges.push([v, leftV]);
                }

                if (!edgeAlreadyDrawn(v, rightV) && grid.areConnected(v, rightV)) {
                    x1 = (v.x * this.cellWidth) + this.cellWidth;
                    y1 = v.y * this.cellHeight;
                    x2 = x1;
                    y2 = y1 + this.cellHeight;

                    this.addWall(new Vec(x1, y1), new Vec(x2, y2));
                    drawnEdges.push([v, rightV]);
                }

                if (!edgeAlreadyDrawn(v, bottomV) && grid.areConnected(v, bottomV)) {
                    x1 = v.x * this.cellWidth;
                    y1 = (v.y * this.cellHeight) + this.cellHeight;
                    x2 = x1 + this.cellWidth;
                    y2 = y1;

                    this.addWall(new Vec(x1, y1), new Vec(x2, y2));
                    drawnEdges.push([v, bottomV]);
                }
            }
        }

        return this;
    };

    /**
     * Build the maze
     * @returns {Maze}
     */
    Maze.prototype.generate = function () {
        var initialCell = this.grid.getCellAt(0, 0);
        this.recurse(initialCell);

        return this;
    };

    /**
     * Recurse through a Cell's neighbors
     * @param {Cell} cell
     * @returns {Maze}
     */
    Maze.prototype.recurse = function (cell) {
        cell.visit();
        var neighbors = this.grid.unvisitedNeighbors(cell);
        if (neighbors.length > 0) {
            var randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
            this.cellStack.push(cell);
            this.grid.removeEdgeBetween(cell, randomNeighbor);
            this.recurse(randomNeighbor);
        } else {
            var waitingCell = this.cellStack.pop();
            if (waitingCell) {
                this.recurse(waitingCell);
            }
        }

        return this;
    };

    /**
     * Solve the Maze
     * @returns {Maze}
     */
    Maze.prototype.solve = function () {
        var closedSet = [],
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
    };

    global.Maze = Maze;

}(this));