var Maze = Maze || {};

(function (global) {
	"use strict";

	/**
	 * A maze
	 * @param {Object} options
	 * @returns {undefined}
	 */
	class Maze {
		constructor (options) {
			this.canvas = options.canvas;
			this.ctx = this.canvas.getContext("2d");

			this.width = options.width;
			this.height = options.height;
			this.xCellCount = options.xCellCount;
			this.yCellCount = options.yCellCount;
			this.cellWidth = this.width / this.xCellCount;
			this.cellHeight = this.height / this.yCellCount;
			this.walls = [];
			this.cellStack = [];
			this.path = [];

			this.graphOptions = {
				'width': this.xCellCount,
				'height': this.yCellCount,
				'cellWidth': this.cellWidth,
				'cellHeight': this.cellHeight
			};

			this.grid = new Grid(this.canvas, this.graphOptions);

			this.draw(options.closed);
			this.solve();
		};

		/**
		 * Add a Wall to the Maze
		 * @param {Vec} v1
		 * @param {Vec} v2
		 * @returns {undefined}
		 */
		addWall (v1, v2) {
			this.walls.push(new Wall(v1, v2));
		};
		
		/**
		 * Return the walls
		 * @returns {Array}
		 */
		walls () {
			return this.walls;
		};

		/**
		 * Return the Graph's Cells
		 * @returns {Array}
		 */
		graphCells () {
			return this.grid.cells;
		};

		/**
		 * Draw it
		 * @returns {undefined}
		 */
		draw (closed) {
			this.generate();
			this.drawBorders(closed);
			this.drawMaze();
		};

		/**
		 * Draw the borders
		 * @returns {undefined}
		 */
		drawBorders (closed) {
			this.addWall(new Vec(closed ? 0 : this.cellWidth, 0), new Vec(this.width, 0));
			this.addWall(new Vec(this.width, 0), new Vec(this.width, this.height));
			this.addWall(new Vec(this.width - (closed ? 0 : this.cellWidth), this.height), new Vec(0, this.height));
			this.addWall(new Vec(0, this.height), new Vec(0, 0));
		};

		/**
		 * Draw the solution
		 * @returns {undefined}
		 */
		drawSolution () {
			var _this = this;
			var path = this.path;
			this.ctx.fillStyle = "rgba(0,165,0,.1)";
			this.ctx.strokeStyle = "rgb(0,0,0)";
			for (var i = 0; i < this.path.length; i++) {
				var V = path[i];
				var vW = this.cellWidth,
					vH = this.cellHeight,
					vX = V.x,
					vY = V.y,
					// Get the cell X coords and multiply by the cell width
					x = _this.grid.cells[vX][vY].x * vW,
					// Get the cell Y coords and multiply by the cell height
					y = _this.grid.cells[vX][vY].y * vH;
				(function () {
					_this.ctx.fillRect(x, y, vW, vH);
				})();
			}
		};

		/**
		 * Draw the Maze
		 * @returns {undefined}
		 */
		drawMaze () {
			var grid = this.grid,
				drawnEdges = [];

			var edgeAlreadyDrawn = function (v1, v2) {
				return _.detect(drawnEdges, function (edge) {
					return _.include(edge, v1) && _.include(edge, v2);
				}) !== undefined;
			};

			for (var i = 0; i < grid.width; i++) {
				for (var j = 0; j < grid.height; j++) {
					var v = grid.cells[i][j],
						topV = grid.getCellAt(v.x, v.y - 1),
						leftV = grid.getCellAt(v.x - 1, v.y),
						rightV = grid.getCellAt(v.x + 1, v.y),
						bottomV = grid.getCellAt(v.x, v.y + 1);

					if (!edgeAlreadyDrawn(v, topV) && grid.areConnected(v, topV)) {
						var x1 = v.x * this.cellWidth,
							y1 = v.y * this.cellHeight,
							x2 = x1 + this.cellWidth,
							y2 = y1;

						this.addWall(new Vec(x1, y1), new Vec(x2, y2));
						drawnEdges.push([v, topV]);
					}

					if (!edgeAlreadyDrawn(v, leftV) && grid.areConnected(v, leftV)) {
						var x2 = x1,
							y2 = y1 + this.cellHeight;

						this.addWall(new Vec(x1, y1), new Vec(x2, y2));
						drawnEdges.push([v, leftV]);
					}

					if (!edgeAlreadyDrawn(v, rightV) && grid.areConnected(v, rightV)) {
						var x1 = (v.x * this.cellWidth) + this.cellWidth,
							y1 = v.y * this.cellHeight,
							x2 = x1,
							y2 = y1 + this.cellHeight;

						this.addWall(new Vec(x1, y1), new Vec(x2, y2));
						drawnEdges.push([v, rightV]);
					}

					if (!edgeAlreadyDrawn(v, bottomV) && grid.areConnected(v, bottomV)) {
						var x1 = v.x * this.cellWidth,
							y1 = (v.y * this.cellHeight) + this.cellHeight,
							x2 = x1 + this.cellWidth,
							y2 = y1;

						this.addWall(new Vec(x1, y1), new Vec(x2, y2));
						drawnEdges.push([v, bottomV]);
					}
				}
			}
		};

		/**
		 * Build the maze
		 * @returns {undefined}
		 */
		generate () {
			var initialCell = this.grid.getCellAt(1, 1);
			this.recurse(initialCell);
		};

		/**
		 * Recurse through a Cell's neighboors
		 * @param {Cell} cell
		 * @returns {undefined}
		 */
		recurse (cell) {
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
		};

		/**
		 * Solve the Maze
		 * @returns {undefined}
		 */
		solve () {
			var closedSet = [],
				// Top left cell
				startCell = this.grid.getCellAt(0, 0),
				// Bottom right cell
				targetCell = this.grid.getCellAt(this.grid.width - 1, this.grid.height - 1),
				openSet = [startCell],
				searchCell = startCell;

			while (openSet.length > 0) {
				var neighbors = this.grid.disconnectedNeighbors(searchCell);
				for (var i = 0; i < neighbors.length; i++) {
					var neighbor = neighbors[i];
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
		};
	};

	global.Maze = Maze;

}(this));