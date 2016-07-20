/**
 * Original code borrowed from
 * https://github.com/felipecsl/random-maze-generator
 *
 */
(function(global) {
  'use strict';

  class Cell {

    /**
     * Create a cell
     * @constructor
     *
     * @param {number} x
     * @param {number} y
     * @return {Cell}
     */
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.z = -x - y;
      this.center = new Point(0, 0);
      this.visited = false;
      this.parent = null;
      this.heuristic = 0;
      this.reward = null;
      this.value = null;
      this.corners = [];
      this.polyCorners = [];
      this.neighbors = [];
      this.directions = Cell.cellDirections;
      this.population = new Map();

      return this;
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
     * Get an array of coords
     * @return {*[]}
     */
    toArray() {
      return [this.x, this.y, this.z];
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
     * @return {Cell}
     */
    visit() {
      this.visited = true;

      return this;
    }

    /**
     * Get the neighbor
     * @param {Cell|object} cell
     * @param {number} dir
     * @return {Cell}
     */
    neighbor(cell, dir) {
      return Cell.add(cell, Cell.cellDirections[dir]);
    }

    /* Static Functions */

    /**
     * Add a Cell to another one
     * @param {Cell|object} a
     * @param {Cell|object} b
     * @return {Cell}
     */
    static add(a, b) {
      return new Cell(a.x + b.x, a.y + b.y);
    }

    /**
     * Get the neighbor
     * @param {Cell|object} cell
     * @param {number} dir
     * @return {Cell}
     */
    static neighbor(cell, dir) {
      return Cell.add(cell, Cell.cellDirections[dir]);
    }

  }

  Cell.cellDirections = [
    new Cell(0, -1),
    new Cell(1, 0),
    new Cell(0, 1),
    new Cell(-1, 0)
  ];

// Checks for Node.js - http://stackoverflow.com/a/27931000/1541408
  if (typeof process !== 'undefined') {
    module.exports = {
      Cell: Cell
    };
  } else {
    global.Cell = Cell;
  }

}(this));
