(function(global) {
  'use strict';

  class CubeShape extends Cube {
    /**
     * A Cube
     * @constructor
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @return {Cube}
     */
    constructor(x, y, z) {
      super(x, y, z);

      return this;
    }
  }
  global.CubeShape = CubeShape;

})(this);
