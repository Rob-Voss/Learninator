/**
 * Inspired from https://github.com/felipecsl/random-maze-generator
 */

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

/**
 *
 */
class Maze {

  /**
   * A maze generator
   * @name Maze
   * @constructor
   *
   * @param {Grid} grid - The options for the Maze
   * @return {Maze}
   */
  constructor(grid) {
    this.grid = grid;
    this.xCount = Utility.getOpt(grid, 'xCount', 6);
    this.yCount = Utility.getOpt(grid, 'yCount', 6);
    this.buffer = Utility.getOpt(grid, 'buffer', 0);
    this.width = Utility.getOpt(grid, 'width', 600);
    this.height = Utility.getOpt(grid, 'height', 600);
    this.size = Utility.getOpt(grid, 'size', 5);
    this.cellSize = Utility.getOpt(grid, 'cellSize', 20);
    this.cellSpacing = Utility.getOpt(grid, 'cellSpacing', 0);
    this.cheats = Utility.getOpt(grid, 'cheats', false);
    this.closed = Utility.getOpt(grid, 'closed', false);
    this.cellWidth = Utility.getOpt(grid, 'cellWidth', (this.width / this.xCount) - this.buffer * 2);
    this.cellHeight = Utility.getOpt(grid, 'cellHeight', (this.height / this.yCount) - this.buffer * 2);
    this.initialCell = grid.startCell;

    this.walls = [];
    this.cellStack = [];
    this.path = [];

    this.treeMap = GrowingTree.create(50, 50, 0);
    this.caveMap = Caves.create(50, 50, 0.5, 5);

    this.draw();

    return this;
  }

  /**
   * Draw it
   * @return {Maze}
   */
  draw() {
    this.generate();
    this.drawMaze();

    return this;
  }

  /**
   * Draw the Maze
   * @return {Maze}
   */
  drawMaze() {
    let drawnEdges = [];

    let edgeAlreadyDrawn = (v1, v2) => {
      return drawnEdges.find((edge) => {
          return edge.includes(v1) && edge.includes(v2);
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
   * @return {PIXI.Graphics}
   */
  drawSolution() {
    let v;
    this.solve();

    this.solution = new PIXI.Graphics();
    this.solution.lineStyle(1, 0x00FF00, 1);
    for (let i = 0; i < this.path.length; i++) {
      v = this.path[i];
      if (i === 0) {
        this.solution.moveTo(v.center.x, v.center.y);
      } else {
        this.solution.lineTo(v.center.x, v.center.y);
      }
    }

    return this.solution;
  }

  /**
   * Build the maze
   * @return {Maze}
   */
  generate() {
    this.recurse(this.initialCell);

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
   * @return {Maze}
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
   * @return {Maze}
   */
  solve() {
    let closedSet = [],
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

          return this;
        }
        if (neighbor && !closedSet.includes(neighbor)) {
          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
            neighbor.parent = searchCell;
            neighbor.heuristic = neighbor.score() + Grid.getCellDistance(neighbor, targetCell);
          }
        }
      }
      closedSet.push(searchCell);
      openSet.splice(openSet.indexOf(searchCell), 1);
      searchCell = null;

      openSet.forEach((cell) => {
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
