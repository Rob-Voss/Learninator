var Grid = Grid || {};
var Cell = Cell || {};

(function (global) {
	"use strict";

	/**
	 *
	 * @param {type} x
	 * @param {type} y
	 * @returns {Cell}
	 */
	class Cell {
		constructor (x, y) {
			this.x = x;
			this.y = y;
			this.visited = false;
			// When solving the maze, this represents the previous node in the navigated path.
			this.parent = null;
			this.heuristic = 0;
			this.population = [];

			return this;
		};

		/**
		 * Calculate the path to the origin
		 * @returns {Array}
		 */
		pathToOrigin () {
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
		score () {
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
		 * @return {undefined}
		 */
		visit () {
			this.visited = true;
		};
	};


	/**
	 * Grid
	 * @param {Canvas} canvas
	 * @param {Object} options
	 * @returns {Grid_L4.Grid}
	 */
	class Grid {
		constructor (canvas, options) {
			var options = options || {};

			this.canvas = canvas;
			this.ctx = canvas.getContext("2d");
			this.width = options.width || 5;
			this.height = options.height || 5;
			this.cellWidth = options.cellWidth || 100;
			this.cellHeight = options.cellHeight || 100;

			this.cells = [];
			this.path = [];
			this.removedEdges = [];

			for (var i = 0; i < this.width; i++) {
				this.cells.push([]);
				var row = this.cells[i];

				for (var j = 0; j < this.height; j++) {
					var c = new Cell(i, j);
					row.push(c);
				}
			}

			return this;
		};
		
		/**
		 * Returns true if there is an edge between c1 and c2
		 * @param {Cell} c1
		 * @param {Cell} c2
		 * @returns {Boolean}
		 */
		areConnected (c1, c2) {
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
		 * @param {Cell} c
		 * @returns {unresolved}
		 */
		connectedNeighbors (c) {
			var _this = this;
			return _.select(this.neighbors(c), function (c0) {
				var con = _this.areConnected(c, c0);
				return con;
			});
		};

		/**
		 * Returns all neighbors of this Cell that are NOT separated by an edge
		 * This means there is a maze path between both cells.
		 * @param {Cell} c
		 * @returns {unresolved}
		 */
		disconnectedNeighbors (c) {
			var _this = this;
			return _.reject(this.neighbors(c), function (c0) {
				var disc = _this.areConnected(c, c0);
				return disc;
			});
		};

		/**
		 * Get a Cell at a specific point
		 * @param {Number} x
		 * @param {Number} y
		 * @returns {Cell}
		 */
		getCellAt (x, y) {
			if (x >= this.width || y >= this.height || x < 0 || y < 0 || !this.cells[x]) {
				return null;
			}

			return this.cells[x][y];
		};

		/**
		 * Get the distance between two Cell
		 * @param {Cell} c1
		 * @param {Cell} c2
		 * @returns {Number}
		 */
		getCellDistance (c1, c2) {
			var xDist = Math.abs(c1.x - c2.x),
				yDist = Math.abs(c1.y - c2.y);

			return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
		};

		/**
		 * Return the location within a grid
		 * @param {Vec} pos
		 * @returns {Number}
		 */
		getGridLocation (pos) {
			for(var h = 0; h < this.width; h++) {
				var hCell = this.cells[h];
				for(var v = 0; v < this.height; v++) {
					var vCell = hCell[v],
						topLeft = vCell.x * this.cellWidth,
						topRight = topLeft + this.cellWidth,
						bottomLeft = vCell.y * this.cellHeight,
						bottomRight = bottomLeft + this.cellHeight;
					if ((pos.x >= topLeft && pos.x <= topRight) &&
						(pos.y >= bottomLeft && pos.y <= bottomRight)) {
							return this.cells[h][v];
					}
				}
			}
		};

		/**
		 * Returns all neighbors of this cell, regardless if they are connected or not.
		 * @param {Cell} c
		 * @returns {Array|@exp;Array}
		 */
		neighbors (c) {
			var neighbors = [],
				topCell = this.getCellAt(c.x, c.y - 1),
				rightCell = this.getCellAt(c.x + 1, c.y),
				bottomCell = this.getCellAt(c.x, c.y + 1),
				leftCell = this.getCellAt(c.x - 1, c.y);

			if (c.y > 0 && topCell) {
				neighbors.push(topCell);
			}
			if (c.x < this.width && rightCell) {
				neighbors.push(rightCell);
			}
			if (c.y < this.height && bottomCell) {
				neighbors.push(bottomCell);
			}
			if (c.x > 0 && leftCell) {
				neighbors.push(leftCell);
			}

			return neighbors;
		};

		/**
		 * Remove the edge from between two Cells
		 * @param {Cell} c1
		 * @param {Cell} c2
		 * @returns {undefined}
		 */
		removeEdgeBetween (c1, c2) {
			this.removedEdges.push([c1, c2]);
		};

		/**
		 * Returns all neighbors of this Cell that aren't separated by an edge
		 * @param {Cell} c
		 * @returns {unresolved}
		 */
		unvisitedNeighbors (c) {
			return _.select(this.connectedNeighbors(c), function (c0) {
				var unv = !c0.visited;
				return unv;
			});
		};
	};

	global.Cell = Cell;
	global.Grid = Grid;

}(this));
