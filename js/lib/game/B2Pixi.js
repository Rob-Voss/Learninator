(function (global) {
  "use strict";

  class B2Pixi {

    constructor(graphics, scale) {
      this.graphics = graphics;
      this.scale = scale;

      var getColorFromDebugDrawCallback = function (color) {
        let red = (color.r * 255 * 255 * 255) | 0,
          green = (color.g * 255 * 255) | 0,
          blue = (color.b * 255) | 0;

        return red + green + blue;
      };

      this.DrawSegment = (vert1, vert2, color) => {
        this.drawSegment(vert1, vert2, getColorFromDebugDrawCallback(color));
      };
      this.DrawPolygon = (vertices, vertexCount, color) => {
        this.drawPolygon(vertices, vertexCount, false, getColorFromDebugDrawCallback(color));
      };
      this.DrawSolidPolygon = (vertices, vertexCount, color) => {
        this.drawPolygon(vertices, vertexCount, true, getColorFromDebugDrawCallback(color));
      };
      this.DrawCircle = (center, radius, color) => {
        this.drawCircle(center, radius, box2d.b2Vec2(0, 0), false, getColorFromDebugDrawCallback(color));
      };
      this.DrawSolidCircle = (center, radius, axis, color) => {
        this.drawCircle(center, radius, axis, true, getColorFromDebugDrawCallback(color));
      };
      this.DrawTransform = (transform) => {
        this.drawTransform(transform);
      };

      return this;
    }
  }

  /**
   * @export
   * @type {box2d.b2DrawFlags}
   */
  B2Pixi.prototype.m_drawFlags = box2d.b2DrawFlags.e_shapeBit;

  /**
   * Set the drawing flags.
   * @export
   * @return {void}
   * @param {box2d.b2DrawFlags} flags
   */
  B2Pixi.prototype.SetFlags = function (flags) {
    this.m_drawFlags = flags;
  };

  /**
   * Get the drawing flags.
   * @export
   * @return {box2d.b2DrawFlags}
   */
  B2Pixi.prototype.GetFlags = function () {
    return this.m_drawFlags;
  };

  /**
   * Append flags to the current flags.
   * @export
   * @return {void}
   * @param {box2d.b2DrawFlags} flags
   */
  B2Pixi.prototype.AppendFlags = function (flags) {
    this.m_drawFlags |= flags;
  };

  /**
   * Clear flags from the current flags.
   * @export
   * @return {void}
   * @param {box2d.b2DrawFlags} flags
   */
  B2Pixi.prototype.ClearFlags = function (flags) {
    this.m_drawFlags &= ~flags;
  };

  /**
   * @export
   * @return {void}
   * @param {box2d.b2Transform} xf
   */
  B2Pixi.prototype.PushTransform = function (xf) {
  };

  /**
   * @export
   * @return {void}
   * @param {box2d.b2Transform} xf
   */
  B2Pixi.prototype.PopTransform = function (xf) {
  };

  /**
   *
   * @param transform
   */
  B2Pixi.prototype.drawTransform = function (transform) {
    var pos = transform.p,
      rot = transform.q;
    this.drawAxes(this.graphics, pos.get_x(), pos.get_y(), rot.GetAngle());
  };

  /**
   *
   * @param x
   * @param y
   * @param angle
   */
  B2Pixi.prototype.drawAxes = function (x, y, angle) {
    var sin = Math.sin(angle),
      cos = Math.cos(angle),
      newX = x * this.scale,
      newY = y * this.scale;

    function transform(x, y) {
      return {x: x * cos + y * sin, y: -x * sin + y * cos};
    }

    var origin = transform(newX, newY),
      xAxis = transform(newX + 100, newY),
      yAxis = transform(newX, newY + 100);
    this.graphics.lineStyle(2, 'rgb(192,0,0)', 1);
    this.graphics.moveTo(origin.x, origin.y);
    this.graphics.lineTo(xAxis.x, xAxis.y);
    this.graphics.lineStyle(2, 'rgb(0,192,0)', 1);
    this.graphics.moveTo(origin.x, origin.y);
    this.graphics.lineTo(yAxis.x, yAxis.y);
  };

  /**
   *
   * @param vert1
   * @param vert2
   * @param color
   */
  B2Pixi.prototype.drawSegment = function (vert1, vert2, color) {
    this.graphics.lineStyle(1, color, 1);
    this.graphics.moveTo(vert1.x * this.scale, vert1.y * this.scale);
    this.graphics.lineTo(vert2.x * this.scale, vert2.y * this.scale);
  };

  /**
   *
   * @param vertices
   * @param vertexCount
   * @param fill
   * @param color
   */
  B2Pixi.prototype.drawPolygon = function (vertices, vertexCount, fill, color) {
    this.graphics.lineStyle(1, color, 1);
    if (fill) {
      this.graphics.beginFill(color, 0.5);
    }
    for (let tmpI = 0; tmpI < vertexCount; tmpI++) {
      var vert = box2d.wrapPointer(vertices + (tmpI * 8), box2d.b2Vec2);
      if (tmpI === 0) {
        this.graphics.moveTo(vert.get_x() * this.scale, vert.get_y() * this.scale);
      } else {
        this.graphics.lineTo(vert.get_x() * this.scale, vert.get_y() * this.scale);
      }
    }
    if (fill) {
      this.graphics.endFill();
    }
  };

  /**
   *
   * @param center
   * @param radius
   * @param axis
   * @param fill
   * @param color
   */
  B2Pixi.prototype.drawCircle = function (center, radius, axis, fill, color) {
    this.graphics.lineStyle(1, color, 1);
    if (fill) {
      this.graphics.beginFill(color, 0.5);
    }
    this.graphics.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
    if (fill) {
      this.graphics.endFill();
    }
    if (fill) {
      this.graphics.moveTo(center.x, center.y);
      this.graphics.lineTo(center.x + axis.x * radius, center.y + axis.y * radius);
    }
  };
  B2Pixi.prototype = Object.create(box2d.b2Draw.prototype);
  B2Pixi.prototype.constructor = box2d.b2Draw;

// Checks for Node.js - http://stackoverflow.com/a/27931000/1541408
  if (typeof process !== 'undefined') {
    module.exports = {
      B2Pixi: B2Pixi
    };
  } else {
    global.B2Pixi = B2Pixi;
  }

}(this));
