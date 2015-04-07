var MazeGenerator = MazeGenerator || {REVISION: '0.1'};

(function (global) {
	"use strict";

	/**
	 *
	 * @param {Number} rows
	 * @param {Number} cols
	 * @returns {MazeGenerator_L3.MazeGenerator}
	 */
	MazeGenerator = function (rows, cols) {
		this.graph = new Graph(rows, cols);
		this.cellStack = [];
		this.path = [];
	};

	/**
	 *
	 * @type Maze
	 */
	MazeGenerator.prototype = {
		recurse: function (cell) {
			cell.visit();
			var neighbors = this.graph.unvisitedNeighbors(cell);
			if (neighbors.length > 0) {
				var randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
				this.cellStack.push(cell);
				this.graph.removeEdgeBetween(cell, randomNeighbor);
				this.recurse(randomNeighbor);
			} else {
				var waitingCell = this.cellStack.pop();
				if (waitingCell) {
					this.recurse(waitingCell);
				}
			}
		},
		solve: function () {
			var closedSet = [],
				// Top left cell
				startCell = this.graph.getVecAt(0, 0),
				// Bottom right cell
				targetCell = this.graph.getVecAt(this.graph.width - 1, this.graph.height - 1),
				openSet = [startCell],
				searchCell = startCell;

			while (openSet.length > 0) {
				var neighbors = this.graph.disconnectedNeighbors(searchCell);
				for (var i = 0; i < neighbors.length; i++) {
					var neighbor = neighbors[i];
					if (neighbor === targetCell) {
						neighbor.parent = searchCell;
						this.path = neighbor.pathToOrigin();
						openSet = [];
						return;
					}
					if (!_.include(closedSet, neighbor)) {
						if (!_.include(openSet, neighbor)) {
							openSet.push(neighbor);
							neighbor.parent = searchCell;
							neighbor.heuristic = neighbor.score() + this.graph.getVecDistance(neighbor, targetCell);
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
		},
		generate: function () {
			var initialCell = this.graph.getVecAt(1, 1);
			this.recurse(initialCell);
		}
	};

	global.MazeGenerator = MazeGenerator;

}(this));
