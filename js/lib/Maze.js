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

    class Maze {

        /**
         * A maze generator
         * @name Maze
         * @constructor
         *
         * @param {Grid} grid - The options for the Maze
         * @returns {Maze}
         */
        constructor(grid) {
            this.grid = grid;
            this.xCount = Utility.getOpt(grid, 'xCount', 6);
            this.yCount = Utility.getOpt(grid, 'yCount', 6);
            this.width = Utility.getOpt(grid, 'width', 600);
            this.height = Utility.getOpt(grid, 'height', 600);
            this.cheats = Utility.getOpt(grid, 'cheats', false);
            this.closed = Utility.getOpt(grid, 'closed', false);
            this.buffer = Utility.getOpt(grid, 'buffer', 0);
            this.cellWidth = (this.width - this.buffer) / this.xCount;
            this.cellHeight = (this.height - this.buffer) / this.yCount;

            this.walls = [];
            this.cellStack = [];
            this.path = [];

            this.draw();

            return this;
        }

        /**
         * Draw it
         * @returns {Maze}
         */
        draw() {
            this.generate();
            this.drawMaze();

            return this;
        }

        /**
         * Draw the Maze
         * @returns {Maze}
         */
        drawMaze() {
            var drawnEdges = [];

            let edgeAlreadyDrawn = function (v1, v2) {
                return _.detect(drawnEdges, function (edge) {
                        return _.include(edge, v1) && _.include(edge, v2);
                    }) !== undefined;
            };

            this.grid.cells.forEach((cell) => {
                cell.neighbors.forEach((neigh, dir) => {
                    if (!neigh || (!edgeAlreadyDrawn(cell, neigh) && this.grid.areConnected(cell, neigh))) {
                        this.walls.push(cell.walls[dir]);
                        drawnEdges.push([cell, neigh]);
                    }
                });
            });

            return this;
        }

        /**
         * Draw the solution
         * @param {PIXI.Container} stage
         * @returns {Maze}
         */
        drawSolution(stage) {
            let V;
            this.solve();

            // Add a container to hold our display cheats
            this.cheatsContainer = new PIXI.Container();
            this.solution = new PIXI.Graphics();
            this.solution.lineStyle(1, 0x00FF00, 1);
            for (let i = 0; i < this.path.length; i++) {
                V = this.path[i];
                if (i === 0) {
                    this.solution.moveTo(V.center.x, V.center.y);
                } else {
                    this.solution.lineTo(V.center.x, V.center.y);
                }
            }
            this.cheatsContainer.addChild(this.solution);
            stage.addChild(this.cheatsContainer);

            return this;
        }

        /**
         * Build the maze
         * @returns {Maze}
         */
        generate() {
            var initialCell = this.grid.getCellAt(this.grid.cells[0].q, this.grid.cells[0].r);
            this.recurse(initialCell);

            this.grid.cells.forEach((cell) => {
                if (!cell.visited) {
                    this.recurse(cell);
                }
            });

            return this;
        }

        /**
         * Recurse through a Cell's neighbors
         * @param {Cell} cell
         * @returns {Maze}
         */
        recurse(cell) {
            cell.visit();
            let neighbors = this.grid.unvisitedNeighbors(cell);
            if (neighbors.length > 0) {
                let numb = Math.floor(Math.random() * neighbors.length),
                    randomNeighbor = neighbors[numb];
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
        }

        /**
         * Solve the Maze
         * @returns {Maze}
         */
        solve() {
            var closedSet = [],
                startCell = this.grid.cells[0],
                targetCell = this.grid.cells[this.grid.cells.length - 1],
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
        }
    }
    global.Maze = Maze;

}(this));