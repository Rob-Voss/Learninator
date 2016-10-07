/**
 * Inspired by https://github.com/RobertBrewitz/axial-hexagonal-grid
 */
(function(global) {
  'use strict';

  /**
   * HexGrid
   * @extends Grid
   */
  class HexGrid extends Grid {

    /**
     * A library for creating Hexagonal grids
     * @constructor
     *
     * @param {Layout} layout
     * @param {Array} cells
     * @param {gridOpts} opts
     * @return {HexGrid}
     */
    constructor(layout, cells, opts) {
      let orientation = (opts.pointy ? Layout.layoutPointy : Layout.layoutFlat),
          width = opts.size || opts.width / opts.cellSize,
          height = opts.size || opts.height / opts.cellSize,
          size = new Point(width, height),
          origin = new Point(opts.width / 2, opts.height / 2);
      layout = layout || new Layout(orientation, size, origin);
      cells = cells || HexGrid.shapeHexagon(layout, opts);

      super(layout, cells, opts);
      this.layout = layout;

      return this;
    }

    /**
     * Return an array of neigh
     * @param {Hex|HexShape} cell
     * @returns {Array}
     */
    disconnectedNeighbors(cell) {
      return super.disconnectedNeighbors(cell);
    }

    /**
     * Get the cell at the axial coords
     * @param {number} q
     * @param {number} r
     * @return {Hex|Cell|boolean}
     */
    getCellAt(q, r) {
      let column = this.map.get(q),
          row = column ? column.get(r) : false;

      return row ? row.get(-q - r) : false;
    }

    /**
     * Distance between two axial coords
     * @param {Hex|HexShape} h1
     * @param {Hex|HexShape} h2
     * @return {number}
     */
    getCellDistance(h1, h2) {
      return (Math.abs(h1.q - h2.q) + Math.abs(h1.r - h2.r) + Math.abs(h1.q + h1.r - h2.q - h2.r)) / 2;
    }

    /**
     * Return the location of the entity within a grid
     * @param {Entity} entity
     * @return {Cell|Hex|boolean}
     */
    getGridLocation(entity) {
      let center = new Point(
              entity.bounds.x + entity.bounds.width / 2,
              entity.bounds.y + entity.bounds.height / 2
          ),
          hex = this.layout.pixelToHex(center),
          cube = this.roundCube(this.axialToCube(hex)),
          hexR = this.cubeToAxial(cube);

      return this.getCellAt(hexR.q, hexR.r);
    }

    /**
     * Initialize the Grid
     * @return {HexGrid}
     */
    init() {
      this.mapCells();
      this.cellsContainer = new PIXI.Container();
      this.cells.forEach((cell) => {
        cell.neighbors = [];
        cell.walls = [];
        for (let dir = 0; dir < cell.directions.length; dir++) {
          let neighb = cell.neighbor(cell, dir),
              v1, v2,
              ad = (!this.pointy) ? 1 : 0;

          switch (dir) {
            case 0:
              v1 = cell.corners[ad ? 0 : 5];
              v2 = cell.corners[ad ? 1 : 0];
              break;
            case 1:
              v1 = cell.corners[ad ? 0 : 5];
              v2 = cell.corners[ad ? 5 : 4];
              break;
            case 2:
              v1 = cell.corners[3 + ad];
              v2 = cell.corners[4 + ad];
              break;
            case 3:
              v1 = cell.corners[2 + ad];
              v2 = cell.corners[3 + ad];
              break;
            case 4:
              v1 = cell.corners[1 + ad];
              v2 = cell.corners[2 + ad];
              break;
            case 5:
              v1 = cell.corners[0 + ad];
              v2 = cell.corners[1 + ad];
              break;
          }

          cell.neighbors[dir] = this.getCellAt(neighb.q, neighb.r);
          cell.walls[dir] = new Wall(new Vec(v1.x, v1.y), new Vec(v2.x, v2.y), dir, {cheats: this.cheats, useSprite: false});
          cell.wallContainer.addChild(cell.walls[dir].graphics);
        }
        this.cellsContainer.addChild(cell.graphics);
      });
      this.startCell = this.getCellAt(this.cells[0].q, this.cells[0].r);

      return this;
    }

    /**
     * Add the cells to a hash map
     */
    mapCells() {
      let column, row, hex;
      this.cells.forEach((cell) => {
        // check q
        column = this.map.get(cell.q);
        if (!column) {
          this.map.set(cell.q, new Map());
          column = this.map.get(cell.q);
        }
        // check r
        row = column.get(cell.r);
        if (!row) {
          column.set(cell.r, new Map());
          row = column.get(cell.r);
        }
        // check s
        hex = row.get(cell.s);
        if (!hex) {
          row.set(cell.s, cell);
          hex = row.get(cell.s);
        }
      });
    }

    /**
     * Return a Hex's neighbors
     * @param {Hex|Cell} hex
     * @param {boolean} all
     * @return {Array}
     */
    neighbors(hex, all = false) {
      let i, len, neighbors, result;
      result = [];
      neighbors = Hex.hexDirections;
      for (i = 0, len = neighbors.length; i < len; i++) {
        let n = neighbors[i],
            q = hex.q + n.q,
            r = n.r,
            cell = this.getCellAt(q, r);
        let neighbor = Hex.direction(i);
        result.push((!all) ? cell : neighbor);
      }

      return result;
    }

    /**
     *
     * @param {Number} x
     * @param {Number} y
     * @return {*|{q, r, s}|Hex}
     */
    pixelToAxial(x, y) {
      let cube, decimalQR, roundedCube;
      decimalQR = this.pixelToDecimalQR(x, y, 1);
      cube = this.axialToCube(decimalQR);
      roundedCube = this.roundCube(cube);

      return this.cubeToAxial(roundedCube);
    }

    /**
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} scale
     * @return {{q: *, r: *, s: number}}
     */
    pixelToDecimalQR(x, y, scale) {
      let q, r;
      if (typeof scale !== "number") {
        scale = 1;
      }
      if (this.pointy) {
        q = (1 / 3 * Math.sqrt(3) * x - 1 / 3 * -y) / (this.cellSize + this.cellSpacing);
        r = 2 / 3 * -y / (this.cellSize + this.cellSpacing);
      } else {
        q = 2 / 3 * x / (this.cellSize + this.cellSpacing);
        r = (1 / 3 * Math.sqrt(3) * -y - 1 / 3 * x) / (this.cellSize + this.cellSpacing);
      }
      q /= scale;
      r /= scale;

      return {
        q: q,
        r: r,
        s: -q - r
      };
    }

    /**
     * Returns all neighbors of this Cell that aren't separated by an edge
     * @param {Hex|HexShape} hex
     * @return {Array}
     */
    unvisitedNeighbors(hex) {
      let unv = [];
      hex.neighbors.forEach((cell) => {
        if (cell && !cell.visited) {
          unv.push(cell);
        }
      });

      return unv;
    }

    /* Static Functions */

    /**
     * Convert from axial coords to Cube
     * @param {Hex} hex
     * @return {object}
     */
    static axialToCube(hex) {
      return {
        x: hex.q,
        y: hex.r,
        z: -hex.q - hex.r
      };
    }

    /**
     * Convert from Cube coords to axial
     * @param {Cube} cube
     * @returns {{q: *, r: *, s: number}}
     */
    static cubeToAxial(cube) {
      return {
        q: cube.x,
        r: cube.y,
        s: -cube.x - cube.y
      };
    }

    /**
     * Get something
     * @param {{x: *, y: *, z: number}} coords
     * @return {object}
     */
    static roundCube(coords) {
      let dx, dy, dz, rx, ry, rz;
      rx = Math.round(coords.x);
      ry = Math.round(coords.y);
      rz = Math.round(coords.z);
      dx = Math.abs(rx - coords.x);
      dy = Math.abs(ry - coords.y);
      dz = Math.abs(rz - coords.z);
      if (dx > dy && dx > dz) {
        rx = -ry - rz;
      } else if (dy > dz) {
        ry = -rx - rz;
      } else {
        rz = -rx - ry;
      }

      return {
        x: rx,
        y: ry,
        z: rz
      };
    }

    /**
     *
     * @param {Number} q
     * @param {Number} r
     * @param {Number} s
     * @returns {Hex}
     */
    static permuteQRS(q, r, s) {
      return new Hex(q, r, s);
    }

    /**
     *
     * @param {Number} q
     * @param {Number} r
     * @param {Number} s
     * @returns {Hex}
     */
    static permuteSRQ(q, r, s) {
      return new Hex(s, r, q);
    }

    /**
     *
     * @param {Number} q
     * @param {Number} r
     * @param {Number} s
     * @returns {Hex}
     */
    static permuteSQR(q, r, s) {
      return new Hex(s, q, r);
    }

    /**
     *
     * @param {Number} q
     * @param {Number} r
     * @param {Number} s
     * @returns {Hex}
     */
    static permuteRQS(q, r, s) {
      return new Hex(r, q, s);
    }

    /**
     *
     * @param {Number} q
     * @param {Number} r
     * @param {Number} s
     * @returns {Hex}
     */
    static permuteRSQ(q, r, s) {
      return new Hex(r, s, q);
    }

    /**
     *
     * @param {Number} q
     * @param {Number} r
     * @param {Number} s
     * @returns {Hex}
     */
    static permuteQSR(q, r, s) {
      return new Hex(q, s, r);
    }

    /**
     * Create a Hexagon of Hexes
     * @param {Layout} layout
     * @param {gridOpts} opts
     * @return {Array}
     */
    static shapeHexagon(layout, opts) {
      let hexes = [];
      for (let q = -opts.size / 2; q <= opts.size / 2; q++) {
        let r1 = Math.max(-opts.size / 2, -q - opts.size / 2),
            r2 = Math.min(opts.size / 2, -q + opts.size / 2);
        for (let r = r1; r <= r2; r++) {
          let cell = new Hex(q, r, -q - r),
              hex = new HexShape(cell, layout, opts);
          hexes.push(hex);
        }
      }
      return hexes;
    }

    /**
     * Create a parallelogram of Hexes
     * @param {Number} q1
     * @param {Number} r1
     * @param {Number} q2
     * @param {Number} r2
     * @param {Layout} layout
     * @param {gridOpts} opts
     * @return {Array}
     */
    static shapeParallelogram(q1, r1, q2, r2, layout, opts) {
      let hexes = [];
      for (let q = q1; q <= q2; q++) {
        for (let r = r1; r <= r2; r++) {
          let cell = new Hex(q, r, -q - r),
              hex = new HexShape(cell, layout, opts);
          hexes.push(hex);
        }
      }
      return hexes;
    }

    /**
     * Create a rectangle of Hexes
     * @param {Layout} layout
     * @param {gridOpts} opts
     * @return {Array}
     */
    static shapeRectangle(layout, opts) {
      let hexes = [],
          r1 = -Math.floor(opts.size / 2),
          r2 = r1 + opts.size,
          q1 = -Math.floor(opts.size / 2),
          q2 = q1 + opts.size;
      if (!opts.pointy) {
        for (let q = q1; q < q2; q++) {
          let qOffset = -Math.floor(q / 2);
          for (let r = r1 + qOffset; r < r2 + qOffset; r++) {
            let cell = new Hex(q, r, -q - r),
                hex = new HexShape(cell, layout, opts);
            hexes.push(hex);
          }
        }
      } else {
        for (let r = r1; r < r2; r++) {
          let rOffset = -Math.floor(r / 2);
          for (let q = q1 + rOffset; q < q2 + rOffset; q++) {
            let cell = new Hex(q, r, -q - r),
                hex = new HexShape(cell, layout, opts);
            hexes.push(hex);
          }
        }
      }

      return hexes;
    }

    /**
     * Create a ring of Hexes
     * @param {Number} q
     * @param {Number} r
     * @param {Layout} layout
     * @param {gridOpts} opts
     * @return {Array}
     */
    static shapeRing(q, r, layout, opts) {
      let i, j, len, moveDirection, moveDirectionIndex, moveDirections, ref, hexes = [];
      moveDirections = [[1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1], [1, 0], [1, -1]];
      for (moveDirectionIndex = i = 0, len = moveDirections.length; i < len; moveDirectionIndex = ++i) {
        moveDirection = moveDirections[moveDirectionIndex];
        for (j = 0, ref = opts.size / 2 - 1; 0 <= ref ? j <= ref : j >= ref; 0 <= ref ? j++ : j--) {
          q += moveDirection[0];
          r += moveDirection[1];
          if (moveDirectionIndex !== 0) {
            let cell = new Hex(q, r, -q - r),
                hex = new HexShape(cell, layout, opts);
            hexes.push(hex);
          }
        }
      }

      return hexes;
    }

    /**
     *
     * @param {Number} minQ
     * @param {Number} maxQ
     * @param {Number} minR
     * @param {Number} maxR
     * @param {Boolean} toCube
     * @param {Layout} layout
     * @param {gridOpts} opts
     * @return {Array}
     */
    static shapeTrapezoidal(minQ, maxQ, minR, maxR, toCube, layout, opts) {
      let q, r, g3, g2,
          hexes = [],
          g1 = minQ,
          g = maxQ + 1;
      while (g1 < g) {
        q = g1++;
        g3 = minR;
        g2 = maxR + 1;
        while (g3 < g2) {
          r = g3++;
          let cell = new Hex(q, r, -q - r),
              hex = new HexShape(cell, layout, opts);
          hexes.push(hex);
        }
      }
      return hexes;
    }

    /**
     * Create a triangle of Hexes
     * @param {Layout} layout
     * @param {gridOpts} opts
     * @return {Array}
     */
    static shapeTriangle1(layout, opts) {
      let hexes = [];
      for (let q = 0; q <= opts.size; q++) {
        for (let r = 0; r <= opts.size - q; r++) {
          let cell = new Hex(q, r, -q - r),
              hex = new HexShape(cell, layout, opts);
          hexes.push(hex);
        }
      }
      return hexes;
    }

    /**
     * Create a triangle of Hexes
     * @param {Layout} layout
     * @param {gridOpts} opts
     * @return {Array}
     */
    static shapeTriangle2(layout, opts) {
      let hexes = [];
      for (let q = 0; q <= opts.size; q++) {
        for (let r = opts.size - q; r <= opts.size; r++) {
          let cell = new Hex(q, r, -q - r),
              hex = new HexShape(cell, layout, opts);
          hexes.push(hex);
        }
      }
      return hexes;
    }
  }

  /**
   *
   * @param {Number} col
   * @param {Number} row
   * @return {OffsetCoord}
   * @constructor
   */
  let OffsetCoord = function(col, row) {
    this.col = col;
    this.row = row;

    return this;
  };

  OffsetCoord.prototype = {
    /**
     *
     * @param {Number} offset
     * @param {Hex} hex
     * @return {OffsetCoord}
     */
    qOffsetFromCube: function(offset, hex) {
      let col = hex.q,
          row = hex.r + Math.trunc((hex.q + offset * (Math.abs(hex.q) % 2)) / 2);

      return new OffsetCoord(col, row);
    },
    /**
     *
     * @param {Number} offset
     * @param {Hex} hex
     * @return {Hex}
     */
    qOffsetToCube: function(offset, hex) {
      let q = hex.col,
          r = hex.row - Math.trunc((hex.col + offset * (Math.abs(hex.col) % 2)) / 2);

      return new Hex(q, r, -q - r);
    },
    /**
     *
     * @param {Number} offset
     * @param {Hex} hex
     * @return {OffsetCoord}
     */
    rOffsetFromCube: function(offset, hex) {
      let col = hex.q + Math.trunc((hex.r + offset * (Math.abs(hex.r) % 2)) / 2),
          row = hex.r;

      return new OffsetCoord(col, row);
    },
    /**
     *
     * @param {Number} offset
     * @param {Hex} hex
     * @return {Hex}
     */
    rOffsetToCube: function(offset, hex) {
      let q = hex.col - Math.trunc((hex.row + offset * (Math.abs(hex.row) % 2)) / 2),
          r = hex.row;

      return new Hex(q, r, -q - r);
    }
  };

  /**
   *
   * @param {Number} f0
   * @param {Number} f1
   * @param {Number} f2
   * @param {Number} f3
   * @param {Number} b0
   * @param {Number} b1
   * @param {Number} b2
   * @param {Number} b3
   * @param {Number} angle
   * @return {Orientation}
   * @constructor
   */
  let Orientation = function(f0, f1, f2, f3, b0, b1, b2, b3, angle) {
    this.f0 = f0;
    this.f1 = f1;
    this.f2 = f2;
    this.f3 = f3;
    this.b0 = b0;
    this.b1 = b1;
    this.b2 = b2;
    this.b3 = b3;
    this.startAngle = angle;

    return this;
  };

  /**
   *
   * @param {Orientation} orientation
   * @param {Point} size
   * @param {Point} origin
   * @return {Layout}
   * @constructor
   */
  let Layout = function(orientation, size, origin) {
    this.orientation = orientation;
    this.size = size;
    this.origin = origin;

    return this;
  };

  Layout.prototype = {

    /**
     *
     * @param {Hex} hex
     * @return {Point}
     */
    hexToPixel: function(hex) {
      let m = this.orientation,
          size = this.size,
          offset = this.origin,
          x = (m.f0 * hex.q + m.f1 * hex.r) * size.x,
          y = (m.f2 * hex.q + m.f3 * hex.r) * size.y;

      return new Point(x + offset.x, y + offset.y);
    },
    /**
     *
     * @param {Point} p
     * @return {Hex}
     */
    pixelToHex: function(p) {
      let m = this.orientation,
          size = this.size,
          offset = this.origin,
          pt = new Point(
              (p.x - offset.x) / size.x,
              (p.y - offset.y) / size.y
          ),
          q = m.b0 * pt.x + m.b1 * pt.y,
          r = m.b2 * pt.x + m.b3 * pt.y;

      return new Hex(q, r, -q - r);
    },
    /**
     *
     * @param corner
     * @return {Point}
     */
    hexCornerOffset: function(corner) {
      let m = this.orientation,
          size = this.size,
          angle = 2.0 * Math.PI * (corner + m.startAngle) / 6;

      return new Point(size.x * Math.cos(angle), size.y * Math.sin(angle));
    },
    /**
     *
     * @param {Hex} hex
     * @return {Array}
     */
    polygonCorners: function(hex) {
      let corners = [];
      hex.center = this.hexToPixel(hex);
      for (let i = 0; i < 6; i++) {
        let offset = this.hexCornerOffset(i);
        corners.push(new Point(hex.center.x + offset.x, hex.center.y + offset.y));
      }

      return corners;
    }
  };

  Layout.layoutPointy = new Orientation(Math.sqrt(3.0), Math.sqrt(3.0) / 2.0, 0.0, 3.0 / 2.0, Math.sqrt(3.0) / 3.0, -1.0 / 3.0, 0.0, 2.0 / 3.0, 0.5);
  Layout.layoutFlat = new Orientation(3.0 / 2.0, 0.0, Math.sqrt(3.0) / 2.0, Math.sqrt(3.0), 2.0 / 3.0, 0.0, -1.0 / 3.0, Math.sqrt(3.0) / 3.0, 0.0);

// Checks for Node.js - http://stackoverflow.com/a/27931000/1541408
  if (typeof process !== 'undefined') {
    module.exports = {
      HexGrid: HexGrid,
      Layout: Layout,
      OffsetCoord: OffsetCoord,
      Orientation: Orientation
    };
  } else {
    global.HexGrid = HexGrid;
    global.Layout = Layout;
    global.OffsetCoord = OffsetCoord;
    global.Orientation = Orientation;
  }

})(this);
