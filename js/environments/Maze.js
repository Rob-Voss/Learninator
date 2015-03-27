// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function (from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	
	return this.push.apply(this, rest);
};

var MazeGenerator = function (rows, cols) {
	this.graph = new Graph(rows, cols);
	
	var self = this;

	this.recurse = function (v) {
		v.visit();
		var neighbors = self.graph.unvisitedNeighbors(v);
		if (neighbors.length > 0) {
			var randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
			self.graph.walls.push(v);
			self.graph.removeEdgeBetween(v, randomNeighbor);
			self.recurse(randomNeighbor);
		} else {
			var waitingV = self.graph.walls.pop();
			if (waitingV) {
				self.recurse(waitingV);
			}
		}
	};

	this.generate = function () {
		var initialCell = self.graph.getVecAt(0, 0);
		self.recurse(initialCell);
	};
};

var Graph = function (width, height) {
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
		row = this.walls[i];

		for (var j = 0; j < this.height; j++) {
			var v = new Vec(i, j, this);
			row.push(v);
		}
	}
};

/**
 * 
 * @returns {Maze.MazeAnonym$0}
 */
var Maze = function (canvas) {
	this.ctx = canvas.getContext("2d");

	this.width = canvas.width;
	this.height = canvas.height;
	this.horizCells = 30;
	this.vertCells = 30;
	this.generator = new MazeGenerator(this.horizCells, this.vertCells);
	this.vW = this.width / this.horizCells;
	this.vH = this.height / this.vertCells;

	var self = this;
	
	self.ctx.strokeStyle = "rgb(0, 0, 0)";
	self.ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
};

Maze.prototype = {
	width: function () {
		return this.width;
	},
	height: function () {
		return this.height;
	},
	generate: function () {
		this.generator.generate();
	},
	draw: function () {
		this.drawBorders();
		this.drawMaze();
	},
	solve: function () {
		this.generator.solve();
		this.drawSolution();
	},
	drawBorders: function () {
		this.drawLine(this.vW, 0, this.width, 0);
		this.drawLine(this.width, 0, this.width, this.height);
		this.drawLine(this.width - this.vW, this.height, 0, this.height);
		this.drawLine(0, this.height, 0, 0);
	},
	drawMaze: function () {
		var graph = this.generator.graph;
		var drawnEdges = [];

		var edgeAlreadyDrawn = function (v1, v2) {
			return _.detect(drawnEdges, function (edge) {
				return _.include(edge, v1) && _.include(edge, v2);
			}) !== undefined;
		};

		for (var i = 0; i < graph.width; i++) {
			for (var j = 0; j < graph.height; j++) {
				var v = graph.walls[i][j];
				var topV = graph.getVecAt(v.x, v.y - 1);
				var leftV = graph.getVecAt(v.x - 1, v.y);
				var rightV = graph.getVecAt(v.x + 1, v.y);
				var bottomV = graph.getVecAt(v.x, v.y + 1);

				if (!edgeAlreadyDrawn(v, topV) && graph.areConnected(v, topV)) {
					var x1 = v.x * this.vW;
					var y1 = v.y * this.vH;
					var x2 = x1 + this.vW;
					var y2 = y1;

					this.drawLine(x1, y1, x2, y2);
					drawnEdges.push([v, topV]);
				}

				if (!edgeAlreadyDrawn(v, leftV) && graph.areConnected(v, leftV)) {
					var x2 = x1,
							y2 = y1 + this.vH;

					this.drawLine(x1, y1, x2, y2);
					drawnEdges.push([v, leftV]);
				}

				if (!edgeAlreadyDrawn(v, rightV) && graph.areConnected(v, rightV)) {
					var x1 = (v.x * this.vW) + this.vW,
							y1 = v.y * this.vH,
							x2 = x1,
							y2 = y1 + this.vH;

					this.drawLine(x1, y1, x2, y2);
					drawnEdges.push([v, rightV]);
				}

				if (!edgeAlreadyDrawn(v, bottomV) && graph.areConnected(v, bottomV)) {
					var x1 = v.x * this.vW,
							y1 = (v.y * this.vH) + this.vH,
							x2 = x1 + this.vW,
							y2 = y1;

					this.drawLine(x1, y1, x2, y2);
					drawnEdges.push([v, bottomV]);
				}
			}
		}
	},
	drawLine: function (x1, y1, x2, y2) {
		this.ctx.beginPath();
		this.ctx.moveTo(x1, y1);
		this.ctx.lineTo(x2, y2);
		this.ctx.stroke();
	}
};