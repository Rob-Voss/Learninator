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

// Checks for Node.js - http://stackoverflow.com/a/27931000/1541408
  if (typeof process !== 'undefined') {
    module.exports = {
      CubeShape: CubeShape
    };
  } else {
    global.CubeShape = CubeShape;
  }

})(this);
