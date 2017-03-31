/**
 * Cell
 * @class
 *
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {Point} center
 * @property {boolean} visited
 * @property {Cell} parent
 * @property {number} heuristic
 * @property {number} reward
 * @property {number} value
 * @property {Array} corners
 * @property {Array} polyCorners
 * @property {Array} neighbors
 * @property {Array} directions
 * @property {Map} population
 */
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
   * Check if this Cell is equal to another
   * @param {Cell} other
   * @return {boolean}
   */
  equals(other) {
    return this.x === other.x && this.y === other.y && this.z === other.z;
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

  /* Static Functions */

  /**
   * Add a Cell to another one
   * @param {Cell|Object} a
   * @param {Cell|Object} b
   * @return {Cell}
   */
  static add(a, b) {
    return new Cell(a.x + b.x, a.y + b.y);
  }

  /**
   * Get the neighbor
   * @param {Cell|Object} cell
   * @param {number} dir
   * @return {Cell}
   */
  static neighbor(cell, dir) {
    return Cell.add(cell, Cell.cellDirections[dir]);
  }

}

/**
 *
 * @type {[Cell]}
 */
Cell.cellDirections = [
  new Cell(0, -1),
  new Cell(1, 0),
  new Cell(0, 1),
  new Cell(-1, 0)
];
