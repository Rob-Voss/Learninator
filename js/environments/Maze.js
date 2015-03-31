var Maze = Maze || {REVISION: '0.1'};

(function (global) {
	"use strict";

	/**
	 * A maze
	 * @param {Number} horizCells
	 * @param {Number} vertCells
	 * @returns {undefined}
	 */
	Maze = function (horizCells, vertCells) {
		this.canvas = worldCanvas;
		this.ctx = worldCtx;

		this.width = this.canvas.width;
		this.height = this.canvas.height;
		this.horizCells = horizCells;
		this.vertCells = vertCells;
		this.generator = new MazeGenerator(this.horizCells, this.vertCells);
		this.vW = this.width / this.horizCells;
		this.vH = this.height / this.vertCells;
		this.walls = [];

		var self = this;

		self.ctx.strokeStyle = "rgb(0, 0, 0)";
		self.ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
	};

	/**
	 *
	 * @type Maze
	 */
	Maze.prototype = {
		width: function () {
			return this.width;
		},
		height: function () {
			return this.height;
		},
		generate: function () {
			this.generator.generate();
			this.drawBorders();
			this.drawMaze();

			return this.walls;
		},
		draw: function () {
			this.generator.generate();
			this.drawBorders();
			this.drawMaze();

			return this.walls;
		},
		solve: function () {
			skipDraw = true;
			this.generator.solve();
			this.drawSolution();
		},
		drawBorders: function () {
			this.addWall(this.vW, 0, this.width, 0);
			this.addWall(this.width, 0, this.width, this.height);
			this.addWall(this.width - this.vW, this.height, 0, this.height);
			this.addWall(0, this.height, 0, 0);
		},
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
					var v = graph.walls[i][j],
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
		addWall: function (x1, y1, x2, y2) {
			this.walls.push(new Wall(new Vec(x1, y1), new Vec(x2, y2)));
		}
	};

	global.Maze = Maze;
	
}(this));