var Maze = Maze || {};

(function (global) {
	"use strict";

	/**
	 * A maze
	 * @param {Graph} canvas
	 * @param {Number} horizCells
	 * @param {Number} vertCells
	 * @returns {undefined}
	 */
	var Maze = function (canvas, horizCells, vertCells) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");

		this.width = canvas.width;
		this.height = canvas.height;
		this.horizCells = horizCells;
		this.vertCells = vertCells;
		this.generator = new MazeGenerator(this.horizCells, this.vertCells);
		this.vW = this.width / this.horizCells;
		this.vH = this.height / this.vertCells;
		this.cells = [];

		var self = this;

		self.ctx.strokeStyle = "rgb(0, 0, 0)";
		self.ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
	};

	/**
	 *
	 */
	Maze.prototype = {
		/**
		 * Return the Cells
		 * @returns {Array}
		 */
		cells: function () {
			return this.cells;
		},
		/**
		 * Return the width
		 * @returns {document@call;getElementById.width|Graph.width}
		 */
		width: function () {
			return this.width;
		},
		/**
		 * Return the height
		 * @returns {Graph.height|document@call;getElementById.height}
		 */
		height: function () {
			return this.height;
		},
		/**
		 * Generate the Maze
		 * @returns {undefined}
		 */
		generate: function () {
			this.generator.generate();
		},
		/**
		 * Solve the Maze
		 * @returns {undefined}
		 */
		solve: function () {
			skipDraw = true;
			this.generator.solve();
			this.drawSolution();
		},
		/**
		 * Draw it
		 * @returns {undefined}
		 */
		draw: function () {
			this.drawBorders();
			this.drawMaze();
		},
		/**
		 * Draw the borders
		 * @returns {undefined}
		 */
		drawBorders: function () {
			this.addWall(this.vW, 0, this.width, 0);
			this.addWall(this.width, 0, this.width, this.height);
			this.addWall(this.width - this.vW, this.height, 0, this.height);
			this.addWall(0, this.height, 0, 0);
		},
		/**
		 * Draw the solution
		 * @returns {undefined}
		 */
		drawSolution: function() {
		  var path = this.generator.path;

		  for(var i = 0; i < path.length; i++) {
			  var V = path[i];
			  var vW = this.vW;
			  var vH = this.vH;
			  var vX = V.x;
			  var vY = V.y;
			(function () {
			  setTimeout(function() {
				self.ctx.fillRect(vX, vY, vW, vH);
			  }, 80 * i);
			})();
		  }
		},
		/**
		 * Draw the Maze
		 * @returns {undefined}
		 */
		drawMaze: function () {
			var graph = this.generator.graph,
				drawnEdges = [];

			var edgeAlreadyDrawn = function (v1, v2) {
				return _.detect(drawnEdges, function (edge) {
					return _.include(edge, v1) && _.include(edge, v2);
				}) !== undefined;
			};

			for (var i = 0; i < graph.width; i++) {
				for (var j = 0; j < graph.height; j++) {
					var v = graph.cells[i][j],
						topV = graph.getVecAt(v.x, v.y - 1),
						leftV = graph.getVecAt(v.x - 1, v.y),
						rightV = graph.getVecAt(v.x + 1, v.y),
						bottomV = graph.getVecAt(v.x, v.y + 1);

					if (!edgeAlreadyDrawn(v, topV) && graph.areConnected(v, topV)) {
						var x1 = v.x * this.vW,
							y1 = v.y * this.vH,
							x2 = x1 + this.vW,
							y2 = y1;

						this.addWall(x1, y1, x2, y2);
						drawnEdges.push([v, topV]);
					}

					if (!edgeAlreadyDrawn(v, leftV) && graph.areConnected(v, leftV)) {
						var x2 = x1,
							y2 = y1 + this.vH;

						this.addWall(x1, y1, x2, y2);
						drawnEdges.push([v, leftV]);
					}

					if (!edgeAlreadyDrawn(v, rightV) && graph.areConnected(v, rightV)) {
						var x1 = (v.x * this.vW) + this.vW,
							y1 = v.y * this.vH,
							x2 = x1,
							y2 = y1 + this.vH;

						this.addWall(x1, y1, x2, y2);
						drawnEdges.push([v, rightV]);
					}

					if (!edgeAlreadyDrawn(v, bottomV) && graph.areConnected(v, bottomV)) {
						var x1 = v.x * this.vW,
							y1 = (v.y * this.vH) + this.vH,
							x2 = x1 + this.vW,
							y2 = y1;

						this.addWall(x1, y1, x2, y2);
						drawnEdges.push([v, bottomV]);
					}
				}
			}
		},
		/**
		 * Add a Wall to the Maze
		 * @param {Number} x1
		 * @param {Number} y1
		 * @param {Number} x2
		 * @param {Number} y2
		 * @returns {undefined}
		 */
		addWall: function (x1, y1, x2, y2) {
			this.cells.push(new Wall(new Vec(x1, y1), new Vec(x2, y2)));
		}
	};

	global.Maze = Maze;

}(this));