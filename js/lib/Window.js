class Window {

  /**
   * A window stores _size_ number of values and returns averages. Useful for
   * keeping running track of validation or training accuracy during SGD
   * @constructor
   *
   * @param {number} size
   * @param {number} minSize
   * @return {Window}
   */
  constructor(size = 100, minSize = 20) {
    this.size = size;
    this.minsize = minSize;
    this.v = [];
    this.sum = 0;

    return this;
  }

  /**
   * Add a value
   * @param {number} x
   */
  add(x) {
    this.v.push(x);
    this.sum += x;
    if (this.v.length > this.size) {
      this.sum -= this.v.shift();
    }

    return this;
  }

  /**
   * Get the average of all
   * @return {Number}
   */
  getAverage() {
    return (this.v.length < this.minsize) ? -1 : this.sum / this.v.length;
  }

  /**
   * Reset the Window
   */
  reset() {
    this.v = [];
    this.sum = 0;

    return this;
  }
}
