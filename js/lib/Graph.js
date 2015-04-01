var Graph = Graph || {REVISION: '0.1'};

(function (global) {
	"use strict";

	/**
	 * Same as MultiGraph but draws a single line
	 * @param {Number} width
	 * @param {Number} height
	 * @returns {Graph}
	 */
	Graph = function (width, height) {
		this.width = width;
		this.height = height;
		this.walls = [];
		this.removedEdges = [];

		var self = this;

		this.getVecAt = function (x, y) {
			if (x >= this.width || y >= this.height || x < 0 || y < 0) {
				return null;
			}

			if (!this.walls[x]) {
				return null;
			}

			return this.walls[x][y];
		};

		this.getVecDistance = function (v1, v2) {
			var xDist = Math.abs(v1.x - v2.x);
			var yDist = Math.abs(v1.y - v2.y);

			return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
		},
				// Returns true if there is an edge between v1 and v2
				this.areConnected = function (v1, v2) {
					if (!v1 || !v2) {
						return false;
					}

					if (Math.abs(v1.x - v2.x) > 1 || Math.abs(v1.y - v2.y) > 1) {
						return false;
					}

					var removedEdge = _.detect(this.removedEdges, function (edge) {
						return _.include(edge, v1) && _.include(edge, v2);
					});

					return removedEdge === undefined;
				};

		this.unvisitedNeighbors = function (v) {
			return _.select(this.connectedNeighbors(v), function (c) {
				return !c.visited;
			});
		};

		// Returns all neighbors of this v that ARE separated by an edge (maze line)
		this.connectedNeighbors = function (v) {
			return _.select(this.neighbors(v), function (c) {
				return self.areConnected(v, c);
			});
		};

		// Returns all neighbors of this v that are NOT separated by an edge
		// This means there is a maze path between both cells.
		this.disconnectedNeighbors = function (v) {
			return _.reject(this.neighbors(v), function (c) {
				return self.areConnected(v, c);
			});
		};

		// Returns all neighbors of this cell, regardless if they are connected or not.
		this.neighbors = function (v) {
			var neighbors = [],
					topCell = this.getVecAt(v.x, v.y - 1),
					rightCell = this.getVecAt(v.x + 1, v.y),
					bottomCell = this.getVecAt(v.x, v.y + 1),
					leftCell = this.getVecAt(v.x - 1, v.y);

			if (v.y > 0 && topCell) {
				neighbors.push(topCell);
			}
			if (v.x < this.width && rightCell) {
				neighbors.push(rightCell);
			}
			if (v.y < this.height && bottomCell) {
				neighbors.push(bottomCell);
			}
			if (v.x > 0 && leftCell) {
				neighbors.push(leftCell);
			}

			return neighbors;
		};

		this.removeEdgeBetween = function (v1, v2) {
			this.removedEdges.push([v1, v2]);
		};

		for (var i = 0; i < this.width; i++) {
			this.walls.push([]);
			var row = this.walls[i];

			for (var j = 0; j < this.height; j++) {
				var v = new Vec(i, j, this);
				row.push(v);
			}
		}
	};

	global.Graph = Graph;

}(this));

