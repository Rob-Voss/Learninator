(function (global) {
  'use strict';

  class ParallaxCamera {

    /**
     * @constructor
     * @param renderer
     * @param baseContainer
     * @param focalLength
     * @param movementDamping
     */
    constructor(renderer, baseContainer, focalLength, movementDamping) {
      focalLength = (focalLength === void 0) ? 300 : focalLength;
      movementDamping = (movementDamping === void 0) ? 10 : movementDamping;
      this.renderer = renderer;
      this.baseContainer = baseContainer;
      this.focalLength = focalLength;
      this.movementDamping = movementDamping;
      this.x = 0;
      this.y = 0;
      this.layers = [];
      this._baseZoom = 1;
      this._zoom = 1;
      this._shakeEndTime = 0;
      this._shakeStrength = 0;
    }
  }

  // *********************************************************************************************
  // * Public																				   *
  // *********************************************************************************************

  /**
   *
   */
  ParallaxCamera.prototype.update = function () {
    if (!this.baseContainer) {
      return;
    }
    var sw = this.renderer.width * 0.5,
      sh = this.renderer.height * 0.5,
      target = this._target;
    if (target) {
      if (this.movementDamping == 0) {
        this.x = -target.x;
        this.y = -target.y;
      } else {
        this.x += (-this.x - target.x) / this.movementDamping;
        this.y += (-this.y - target.y) / this.movementDamping;
      }
    }
    let bounds = this.bounds;
    if (bounds) {
      let zoom = this.zoom;
      if (this.x <= -(bounds.width) * zoom) {
        this.x = -(bounds.width) * zoom;
      } else if (this.x >= (-bounds.x) * zoom) {
        this.x = (-bounds.x) * zoom;
      }
      if (this.y <= -(bounds.height) * zoom) {
        this.y = -(bounds.height) * zoom;
      } else if (this.y >= (-bounds.y) * zoom) {
        this.y = (-bounds.y) * zoom;
      }
    }

    for(let i = 0; i < this.layers.length; i++) {
      let layer = this.layers[i],
        d = this.focalLength / (this.focalLength - layer.pz),
        x = layer.px + this.x,
        y = layer.py + this.y;
      layer.x = x * d;
      layer.y = y * d;
      layer.scale.set(d, d);
    }
    let tx = 0, ty = 0;
    if (target) {
      let p = this.getParallaxParent(target.parent);
      if (p) {
        tx = p.x * (1 / p.scale.x);
        ty = p.y * (1 / p.scale.y);
      }
    }
    let x = this.x - tx + sw,
      y = this.y - ty + sh;
    this.baseContainer.x = x;
    this.baseContainer.y = y;
  };

  /**
   *
   * @param {ParallaxLayer} layer
   */
  ParallaxCamera.prototype.addLayer = function (layer) {
    if (layer['pz'] == null) {
      throw Error('Layers needs to be a ParallaxLayer.');
    }
    if (this.layers.indexOf(layer) == -1) {
      this.layers.push(layer);
      this.baseContainer.addChild(layer);
      this.zSort();
    }
  };

  /**
   *
   */
  ParallaxCamera.prototype.dispose = function () {
    this.layers = null;
    this._target = null;
    this.baseContainer.removeChildren();
    this.baseContainer = null;
  };

  /**
   *
   * @param {ParallaxLayer} p
   * @returns {*}
   */
  ParallaxCamera.prototype.getParallaxParent = function (p) {
    if (p == null) {
      return null;
    }
    if (p['pz']) {
      return p;
    }
    return this.getParallaxParent(p.parent);
  };

  /**
   *
   * @param {number} min
   * @param {number} max
   * @returns {*}
   */
  ParallaxCamera.prototype.randomFloat = function (min, max) {
    return Math.random() * (max - min) + min;
  };

  /**
   *
   * @param {ParallaxLayer} layer
   */
  ParallaxCamera.prototype.removeLayer = function (layer) {
    var index = this.layers.indexOf(layer);
    if (index != -1) {
      this.layers.splice(index, 1);
    }
    if (layer.parent === this.baseContainer) {
      this.baseContainer.removeChild(layer);
    }
  };

  /**
   *
   * @param target
   * @param reposition
   */
  ParallaxCamera.prototype.setTarget = function (target, reposition) {
    if (reposition === void 0) {
      reposition = true;
    }
    this._target = target;
    if (reposition) {
      this.x = -target.x;
      this.y = -target.y;
    }
  };

  /**
   * Sorts the layers by z-index
   */
  ParallaxCamera.prototype.zSort = function () {
    this.layers = this.layers.sort(function (a, b) {
      return a.pz - b.pz;
    });
    for (var i = 0; i < this.layers.length; ++i) {
      this.baseContainer.addChildAt(this.layers[i], i);
    }
  };

  /**
   * Set the camera target
   */
  Object.defineProperty(ParallaxCamera.prototype, "target", {
    get: function () {
      return this._target;
    },
    enumerable: true,
    configurable: true
  });

  /**
   * Set the camera base zoom level
   */
  Object.defineProperty(ParallaxCamera.prototype, "baseZoom", {
    get: function () {
      return this._baseZoom;
    },
    set: function (value) {
      this._baseZoom = value;
      this.zoom = this.zoom;
    },
    enumerable: true,
    configurable: true
  });

  /**
   * Set the camera's current zoom level
   */
  Object.defineProperty(ParallaxCamera.prototype, "zoom", {
    get: function () {
      return this._zoom;
    },
    set: function (value) {
      this._zoom = value;
      this.baseContainer.scale.set(value * this._baseZoom, value * this._baseZoom);
    },
    enumerable: true,
    configurable: true
  });

  // *********************************************************************************************
  // * Protected																				   *
  // *********************************************************************************************

  class ParallaxLayer extends PIXI.Container {

    /**
     * @constructor
     * @extends PIXI.Container
     * @param z
     */
    constructor(z) {
      z = (z === void 0) ? 0 : z;
      super();
      this.px = 0;
      this.py = 0;
      this.pz = 0;
      this.pz = z;
    }
  }

  // Checks for Node.js - http://stackoverflow.com/a/27931000/1541408
  if (typeof process !== 'undefined') {
    module.exports = {
      ParallaxCamera: ParallaxCamera,
      ParallaxLayer: ParallaxLayer
    };
  } else {
    global.ParallaxCamera = ParallaxCamera;
    global.ParallaxLayer = ParallaxLayer;
  }

}(this));