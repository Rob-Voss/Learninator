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
	var Cell = function (x, y) {
		this.x = x;
		this.y = y;
		this.visited = false;
		this.population = [];

		// When solving the maze, this represents the previous node in the navigated path.
		this.parent = null;
		this.heuristic = 0;

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
		 * Sets the X and Y
		 * @param {Number} x The x
		 * @param {Number} y The y
		 * @return {Vec} Returns itself.
		 */
		Cell.prototype.set = function (x, y) {
			this.x = x;
			this.y = y;

			return this;
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
		 * @return {undefined}
		 */
		Cell.prototype.visit = function () {
			this.visited = true;
		};

	};


	/**
	 * Grid
	 * @param {Canvas} canvas
	 * @param {Object} options
	 * @returns {Grid_L4.Grid}
	 */
	var Grid = function (canvas, options) {
		var options = options || {};

		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.width = options.width || canvas.width;
		this.height = options.height || canvas.height;
		this.cellWidth = this.canvas.width / this.width;
		this.cellHeight = this.canvas.height / this.height;

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

		/**
		 * Returns true if there is an edge between c1 and c2
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
		 * @param {Cell} c
		 * @returns {unresolved}
		 */
		Grid.prototype.connectedNeighbors = function (c) {
			var _this = this;
			return _.select(this.neighbors(c), function (c0) {
				var con = _this.areConnected(c, c0);
				return con;
			});
		};

		/**
		 * Returns all neighbors of this Cell that are NOT separated by an edge
		 * This means there is a maze path between both cells._this
		 * @param {Cell} c
		 * @returns {unresolved}
		 */
		Grid.prototype.disconnectedNeighbors = function (c) {
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
		Grid.prototype.getCellAt = function(x, y) {
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
		Grid.prototype.getCellDistance = function (c1, c2) {
			var xDist = Math.abs(c1.x - c2.x),
				yDist = Math.abs(c1.y - c2.y);

			return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
		};

		/**
		 * Return the location within a grid
		 * @param {Vec} pos
		 * @returns {Number}
		 */
		Grid.prototype.getGridLocation = function(pos) {
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
		Grid.prototype.neighbors = function (c) {
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
		Grid.prototype.removeEdgeBetween = function (c1, c2) {
			this.removedEdges.push([c1, c2]);
		};

		/**
		 * Returns all neighbors of this Cell that aren't separated by an edge
		 * @param {Cell} c
		 * @returns {unresolved}
		 */
		Grid.prototype.unvisitedNeighbors = function (c) {
			return _.select(this.connectedNeighbors(c), function (c0) {
				var unv = !c0.visited;
				return unv;
			});
		};

		return this;
	};

	global.Cell = Cell;
	global.Grid = Grid;

}(this));
