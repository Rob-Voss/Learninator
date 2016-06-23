(function(global) {
  'use strict';

  class Hex {

    /**
     * A Hex
     * @constructor
     *
     * @param {number} q
     * @param {number} r
     * @param {number} s
     * @return {Hex}
     */
    constructor(q, r, s) {
      this.q = q || 0;
      this.r = r || 0;
      this.s = s || -q - r;
      this.center = new Point(0, 0);
      this.visited = false;
      this.parent = null;
      this.heuristic = 0;
      this.reward = null;
      this.value = null;
      this.corners = [];
      this.polyCorners = [];
      this.neighbors = [];
      this.directions = Hex.hexDirections;
      this.diagonals = Hex.hexDiagonals;
      this.population = new Map();

      return this;
    }

    /**
     * Add a Hex to another one
     * @param {Hex} a
     * @param {Hex} b
     * @return {Hex}
     */
    static add(a, b) {
      return new Hex(a.q + b.q, a.r + b.r, a.s + b.s);
    }

    /**
     * Get the diagonal coords for this Hex
     * @param {number} dir
     * @return {Array}
     */
    static diagonals(dir) {
      return Hex.hexDiagonals[dir];
    }

    /**
     * Get the neighbor
     * @param {Hex} hex
     * @param {number} dir
     * @return {Hex}
     */
    diagonalNeighbor(hex, dir) {
      return this.add(hex, Hex.hexDiagonals[dir]);
    }

    /**
     * Get the direction
     * @param {number} dir
     * @return {*}
     */
    static direction(dir) {
      return Hex.hexDirections[dir];
    }

    /**
     * Distance from another Hex
     * @param {Hex} a
     * @param {Hex} b
     * @return {number}
     */
    distance(a, b) {
      return this.len(this.subtract(a, b));
    }

    /**
     * Get the length of the Hex
     * @return {number}
     */
    static len(hex) {
      return Math.trunc((Math.abs(hex.q) + Math.abs(hex.r) + Math.abs(hex.s)) / 2);
    }

    /**
     * Perform a linear interpolation on the Hex
     * @param {Hex} a
     * @param {Hex} b
     * @param {number} t
     * @return {Hex}
     */
    static lerp(a, b, t) {
      return new Hex(a.q + (b.q - a.q) * t, a.r + (b.r - a.r) * t);
    }

    /**
     * Return the coords to draw a line from one Hex to another
     * @param {Hex} a
     * @param {Hex} b
     * @return {Array}
     */
    lineDraw(a, b) {
      let n = this.distance(a, b),
          results = [],
          step = 1.0 / Math.max(n, 1);
      for (let i = 0; i <= n; i++) {
        results.push(this.round(this.lerp(a, b, step * i)));
      }

      return results;
    }

    /**
     * Get the neighbor
     * @param {Hex} hex
     * @param {number} dir
     * @return {Hex}
     */
    neighbor(hex, dir) {
      return HexShape.add(hex, Hex.hexDirections[dir]);
    }

    /**
     * Calculate the path to the origin
     * @return {Array}
     */
    pathToOrigin() {
      let path = [this],
          p = this.parent;

      while (p) {
        path.push(p);
        p = p.parent;
      }
      path.reverse();

      return path;
    }

    /**
     * Round the Hex
     * @param {Hex} hex
     * @return {Hex}
     */
    static round(hex) {
      let q = Math.trunc(Math.round(hex.q)),
          r = Math.trunc(Math.round(hex.r)),
          s = Math.trunc(Math.round(hex.s)),
          qDiff = Math.abs(q - hex.q),
          rDiff = Math.abs(r - hex.r),
          sDiff = Math.abs(s - hex.s);
      if (qDiff > rDiff && qDiff > sDiff) {
        q = -r - s;
      } else if (rDiff > sDiff) {
        r = -q - s;
      } else {
        s = -q - r;
      }

      return new Hex(q, r, s);
    }

    /**
     * Scale the Hex according to the scalar
     * @param {Hex} hex
     * @param {number} k
     * @return {Hex}
     */
    static scale(hex, k) {
      return new Hex(hex.q * k, hex.r * k, hex.s * k);
    }

    /**
     * Score
     * @return {number}
     */
    score() {
      let total = 0,
          p = this.parent;

      while (p) {
        ++total;
        p = p.parent;
      }

      return total;
    }

    /**
     * Subtract a Hex
     * @param {Hex} a
     * @param {Hex} b
     * @return {Hex}
     */
    static subtract(a, b) {
      return new Hex(a.q - b.q, a.r - b.r, a.s - b.s);
    }

    /**
     * Get an array of coords
     * @return {*[]}
     */
    toArray() {
      return [this.q, this.r, this.s];
    }

    /**
     * Convert coords to string
     * @return {string}
     */
    toString() {
      return this.toArray().join(',');
    }

    /**
     * Mark it as visited
     * @return {Hex}
     */
    visit() {
      this.visited = true;

      return this;
    }
  }
  Hex.hexDirections = [
    new Hex(1, 0, -1),
    new Hex(1, -1, 0),
    new Hex(0, -1, 1),
    new Hex(-1, 0, 1),
    new Hex(-1, 1, 0),
    new Hex(0, 1, -1)
  ];
  Hex.hexDiagonals = [
    new Hex(2, -1, -1),
    new Hex(1, -2, 1),
    new Hex(-1, -1, 2),
    new Hex(-2, 1, 1),
    new Hex(-1, 2, -1),
    new Hex(1, 1, -2)
  ];
  global.Hex = Hex;

})(this);
