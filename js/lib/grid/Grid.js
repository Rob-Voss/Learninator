(function(global) {
  'use strict';

  /**
   * The grid options
   * @typedef {Object} gridOpts
   * @property {number} width
   * @property {number} height
   * @property {number} buffer
   * @property {number} size
   * @property {number} cellSize
   * @property {number} cellSpacing
   * @property {boolean} pointy
   * @property {boolean} useSprite
   * @property {boolean} fill
   * @property {cheatsOpts} cheats
   */

  /**
   * Grid
   * @typedef {Grid} Grid
   * @property {number} width
   * @property {number} height
   * @property {number} buffer
   * @property {number} size
   * @property {number} cellSize
   * @property {number} cellSpacing
   * @property {boolean} pointy
   * @property {boolean} useSprite
   * @property {boolean} fill
   * @property {number} cheats
   * @property {number} xCount
   * @property {number} yCount
   * @property {number} cellWidth
   * @property {number} cellHeight
   * @property {number} layout
   * @property {Cell} startCell
   * @property {array} cells
   * @property {array} path
   * @property {array} removedEdges
   * @property {array} walls
   * @property {Map} map
   * @property {PIXI.Container} cellsContainer
   */
  class Grid {

    /**
     * Grid
     * @constructor
     *
     * @param {Layout} layout -
     * @param {array} cells -
     * @param {gridOpts} opts - The options for the Grid
     * @return {Grid}
     */
    constructor(layout, cells, opts) {
      this.width = Utility.getOpt(opts, 'width', 600);
      this.height = Utility.getOpt(opts, 'height', 600);
      this.buffer = Utility.getOpt(opts, 'buffer', 0);
      this.size = Utility.getOpt(opts, 'size', 5);
      this.cellSize = Utility.getOpt(opts, 'cellSize', 20);
      this.cellSpacing = Utility.getOpt(opts, 'cellSpacing', 0);
      this.pointy = Utility.getOpt(opts, 'pointy', false);
      this.useSprite = Utility.getOpt(opts, 'useSprite', false);
      this.fill = Utility.getOpt(opts, 'fill', false);
      this.cheats = Utility.getOpt(opts, 'cheats', false);
      this.xCount = this.width / this.cellSize;
      this.yCount = this.height / this.cellSize;
      this.cellWidth = (this.width - this.buffer) / this.xCount;
      this.cellHeight = (this.height - this.buffer) / this.yCount;
      this.layout = layout || {};
      this.cells = cells || Grid.shapeRectangle(opts);
      this.path = [];
      this.removedEdges = [];
      this.walls = [];
      this.map = new Map();
      this.cellsContainer = new PIXI.Container();
      this.mapCells();

      return this;
    }

    /**
     *
     * @returns {Grid}
     */
    init() {
      this.cells.forEach((cell) => {
        for (let dir = 0; dir < 4; dir++) {
          let neighb = cell.neighbor(cell, dir),
              v1, v2;

          switch (dir) {
            case 0:
              v1 = cell.corners[0];
              v2 = cell.corners[1];
              break;
            case 1:
              v1 = cell.corners[1];
              v2 = cell.corners[2];
              break;
            case 2:
              v1 = cell.corners[3];
              v2 = cell.corners[2];
              break;
            case 3:
              v1 = cell.corners[0];
              v2 = cell.corners[3];
              break;
          }

          cell.neighbors[dir] = (neighb) ? this.getCellAt(neighb.x, neighb.y) : null;
          cell.walls[dir] = new Wall(v1, v2, dir, {cheats: this.cheats, sprite: 'stone_wall.png'});
        }
        this.cellsContainer.addChild(cell.graphics);
      });
      this.startCell = this.getCellAt(this.cells[0].x, this.cells[0].y);

      return this;
    }

    /**
     * Returns true if there is an edge between c1 and c2
     * @param {Cell} c1
     * @param {Cell} c2
     * @return {boolean}
     */
    areConnected(c1, c2) {
      if (!c1 || !c2) {
        return false;
      }
      if (Math.abs(c1.x - c2.x) > 1 || Math.abs(c1.y - c2.y) > 1) {
        return false;
      }

      let removedEdge = this.removedEdges.find((edge) => {
        var inc1 = edge.includes(c1),
            inc2 = edge.includes(c2);
        return inc1 && inc2;
      });

      return removedEdge === undefined;
    }

    /**
     * Returns all neighbors of this Cell that are separated by an edge
     * @param {Cell} cell
     * @return {Array}
     */
    connectedNeighbors(cell) {
      let con, results,
          neighbors = cell.neighbors;
      results = neighbors.filter((c0) => {
        con = this.areConnected(cell, c0);
        return con;
      });

      return results;
    }

    /**
     * Returns all neighbors of this Cell that are NOT separated by an edge
     * This means there is a maze path between both cells.
     * @param {Cell|Hex} cell
     * @return {Array}
     */
    disconnectedNeighbors(cell) {
      var disc, results,
          neighbors = cell.neighbors;
      results = neighbors.filter((c0) => {
        if (c0 === false) {
          return true;
        }
        disc = !this.areConnected(cell, c0);
        return disc;
      });

      return results;
    }

    /**
     * Get a Cell at a specific point
     * @param {Number} x
     * @param {Number} y
     * @return {Cell|Hex|boolean}
     */
    getCellAt(x, y) {
      let column = this.map.get(x),
          row = column ? column.get(y) : false;

      return row ? row.get(-x - y) : false;
    }

    /**
     * Get the distance between two Cells
     * @param {Cell|Hex} c1
     * @param {Cell|Hex} c2
     * @return {number}
     */
    static getCellDistance(c1, c2) {
      let xDist = Math.abs(c1.x - c2.x),
          yDist = Math.abs(c1.y - c2.y);

      return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
    }

    /**
     * Return the location of the entity within a grid
     * @param {Entity} entity
     * @return {Cell|Hex|boolean}
     */
    getGridLocation(entity) {
      let x = entity.bounds.x + (entity.bounds.width / 2),
          y = entity.bounds.y + (entity.bounds.height / 2);

      return this.pixelToCell(x, y);
    }

    /**
     * Add the cells to a hash map
     */
    mapCells() {
      let column, row, c;
      this.cells.forEach((cell) => {
        // check x
        column = this.map.get(cell.x);
        if (!column) {
          this.map.set(cell.x, new Map());
          column = this.map.get(cell.x);
        }
        // check y
        row = column.get(cell.y);
        if (!row) {
          column.set(cell.y, new Map());
          row = column.get(cell.y);
        }
        // check s
        c = row.get(-cell.x - cell.y);
        if (!c) {
          row.set(-cell.x - cell.y, cell);
          cell = row.get(-cell.x - cell.y);
        }
      });

      return this;
    }

    /**
     * Returns all neighbors of this cell, regardless if they are connected or not.
     * @param {Cell|Hex} cell
     * @param {Boolean} all
     * @return {Array}
     */
    neighbors(cell, all = false) {
      let neighbors = [], cells = [];
      if (cell) {
        cells[0] = cell.neighbor(cell, 0);
        cells[1] = cell.neighbor(cell, 1);
        cells[2] = cell.neighbor(cell, 2);
        cells[3] = cell.neighbor(cell, 3);
        neighbors[0] = (cells[0]) ? this.getCellAt(cells[0].x, cells[0].y) : null;
        neighbors[1] = (cells[1]) ? this.getCellAt(cells[1].x, cells[1].y) : null;
        neighbors[2] = (cells[2]) ? this.getCellAt(cells[2].x, cells[2].y) : null;
        neighbors[3] = (cells[3]) ? this.getCellAt(cells[3].x, cells[3].y) : null;
      }
      return all ? cells : neighbors;
    }

    /**
     *
     * @param {Number} x
     * @param {Number} y
     * @returns {Hex|boolean}
     */
    pixelToCell(x, y) {
      let foundCell = false;
      this.cells.forEach((cell) => {
        let inIt = x >= cell.corners[0].x &&
            x <= cell.corners[2].x &&
            y >= cell.corners[0].y &&
            y <= cell.corners[2].y;
        if (inIt) {
          foundCell = cell;
        }
      });

      return foundCell;
    }

    /**
     * Remove the edge from between two Cells
     * @param {Cell} c1
     * @param {Cell} c2
     * @returns {Grid}
     */
    removeEdgeBetween(c1, c2) {
      this.removedEdges.push([c1, c2]);

      return this;
    }

    /**
     * Create a rectangle of Cells
     * @param {gridOpts} opts
     * @return {Array}
     */
    static shapeRectangle(opts) {
      let cells = [];
      for (let x = 0; x < opts.size; x++) {
        for (let y = 0; y < opts.size; y++) {
          let cellShape = new CellShape(x, y, opts);
          cells.push(cellShape);
        }
      }

      return cells;
    }

    /**
     * Returns all neighbors of this Cell that aren't separated by an edge
     * @param {Cell|Hex} c
     * @return {Array}
     */
    unvisitedNeighbors(c) {
      let unv = [];
      c.neighbors.forEach((cell, dir) => {
        if (cell && !cell.visited) {
          unv.push(cell);
        }
      });

      return unv;
    }
  }

// Checks for Node.js - http://stackoverflow.com/a/27931000/1541408
  if (typeof process !== 'undefined') {
    module.exports = {
      Grid: Grid
    };
  } else {
    global.Grid = Grid;
  }

}(this));
