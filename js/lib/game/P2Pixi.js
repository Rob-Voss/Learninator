// P2 aliases
const
  Body = p2.Body,
  Box = p2.Box,
  Circle = p2.Circle,
  Capsule = p2.Capsule,
  Convex = p2.Convex,
  ContactMaterial = p2.ContactMaterial,
  Heightfield = p2.Heightfield,
  Line = p2.Line,
  Material = p2.Material,
  Plane = p2.Plane,
  Particle = p2.Particle,
  vec2 = p2.vec2,
  World = p2.World;

class P2Pixi {

  /**
   * P2Pixi
   * @constructor
   * @param {Object} options
   */
  constructor(options) {
    options = options || {};
    if (options.useDeviceAspect) {
      options.height = (window.innerHeight / window.innerWidth) * options.width;
    }
    this.options = options;

    this.zoom = 10;
    this.pixelsPerLengthUnit = this.options.pixelsPerLengthUnit;

    this.stage = new PIXI.Container();
    this.container = new PIXI.Container();
    this.stage.addChild(this.container);

    this.setupRenderer();
    this.setupView();
  }

  /**
   * Adds the supplied shape to the supplied Container,
   * using vectors and / or a texture
   * @param {PIXI.Container} container
   * @param {Shape} shape
   * @param {Object} shapeOptions
   */
  addShape(container, shape, shapeOptions) {
    let offset = shapeOptions.offset || [0, 0],
      angle = shapeOptions.angle || 0,
      textureOptions = shapeOptions.textureOptions,
      styleOptions = shapeOptions.styleOptions,
      alpha = shapeOptions.alpha || 1,
      zero = [0, 0],
      ppu = shapeOptions.pixelsPerLengthUnit || this.pixelsPerLengthUnit;

    // If a Pixi texture has been specified...
    if (textureOptions) {
      let texture = textureOptions.texture,
        // Calculate the bounding box of the shape when at zero offset and 0 angle
        aabb = new p2.AABB();
      shape.computeAABB(aabb, zero, 0);

      // Get world coordinates of shape boundaries
      let left = aabb.lowerBound[0],
        bottom = aabb.lowerBound[1],
        right = aabb.upperBound[0],
        top = aabb.upperBound[1];

      // Cater for Heightfield shapes
      if (shape instanceof Heightfield) {
        bottom = -(this.options.height / ppu);
      }

      let width = right - left,
        height = top - bottom,
        // Create a Sprite or TilingSprite to cover the entire shape
        sprite;
      if (textureOptions.tile === false) {
        sprite = new PIXI.Sprite(texture);
      } else {
        sprite = new PIXI.extras.TilingSprite(texture, width * ppu, height * ppu);
      }
      sprite.alpha = alpha;
      // If the shape is anything other than a box, we need a mask for the texture.
      // We use the shape itself to create a new Graphics object.
      if (!(shape instanceof Box)) {
        let maskGraphics = new PIXI.Graphics();
        maskGraphics.renderable = false;
        maskGraphics.position.x = (offset[0] * ppu);
        maskGraphics.position.y = -(offset[1] * ppu);
        maskGraphics.rotation = -angle;
        this.renderShapeToGraphics(maskGraphics, shape, zero, 0,
          {
            lineWidth: 0,
            fillColor: 0xffffff
          });

        container.addChild(maskGraphics);
        sprite.mask = maskGraphics;
      }

      // Sprite positions are the top-left corner of the Sprite, where
      // as Graphics objects are positioned at their origin
      if (angle === 0) {
        sprite.position.x = (left * ppu) + (offset[0] * ppu);
        sprite.position.y = -(top * ppu) - (offset[1] * ppu);
        sprite.rotation = -angle;

        container.addChild(sprite);
      } else {
        let doc = new PIXI.Container();
        sprite.position.x = (left * ppu);
        sprite.position.y = -(top * ppu);

        doc.addChild(sprite);
        doc.position.x = (offset[0] * ppu);
        doc.position.y = -(offset[1] * ppu);
        doc.rotation = -angle;

        doc.addChild(sprite);
        container.addChild(doc);
      }
    }

    // If any Pixi vector styles have been specified...
    if (styleOptions) {
      let graphics = new PIXI.Graphics();
      graphics.alpha = alpha;
      graphics.position.x = (offset[0] * ppu);
      graphics.position.y = -(offset[1] * ppu);
      graphics.rotation = -angle;

      this.renderShapeToGraphics(graphics, shape, zero, 0, styleOptions);

      container.addChild(graphics);
    }
  }

  /**
   * Renders the supplied p2 Shape onto the supplied
   * Pixi Graphics object using the supplied Pixi style properties
   * @param {PIXI.Graphics} graphics
   * @param {Shape} shape
   * @param {vec2} offset
   * @param {number} angle
   * @param {object} style
   */
  renderShapeToGraphics(graphics, shape, offset, angle, style) {
    let zero = vec2.create(),
      ppu = this.pixelsPerLengthUnit;
    style.pixelsPerLengthUnit = style.pixelsPerLengthUnit || ppu;
    offset = offset || zero;
    angle = angle || 0;
    if (shape instanceof Circle) {
      let x = offset[0] * ppu,
        y = -offset[1] * ppu,
        rad = shape.radius * ppu;
      P2Pixi.drawCircle(graphics, x, y, rad, style);
    } else if (shape instanceof Particle) {
      let radius = Math.max(1, Math.round(ppu / 100));
      P2Pixi.drawCircle(graphics, offset[0] * ppu, -offset[1] * ppu, radius, style);
    } else if (shape instanceof Plane) {
      P2Pixi.drawPlane(graphics, -10 * ppu, 10 * ppu, style);
    } else if (shape instanceof Line) {
      P2Pixi.drawLine(graphics, shape.length * ppu, style);
    } else if (shape instanceof Box) {
      P2Pixi.drawBox(graphics, offset[0] * ppu, -offset[1] * ppu, shape.width * ppu, shape.height * ppu, style);
    } else if (shape instanceof Capsule) {
      P2Pixi.drawCapsule(graphics, offset[0] * ppu, -offset[1] * ppu, angle, shape.length * ppu, shape.radius * ppu, style);
    } else if (shape instanceof Convex) {
      // Scale vertices
      let vertices = [],
        vrot = vec2.create();
      for (let i = 0; i < shape.vertices.length; i++) {
        let v = shape.vertices[i];
        vec2.rotate(vrot, v, angle);
        vertices.push([(vrot[0] + offset[0]) * ppu, -(vrot[1] + offset[1]) * ppu]);
      }
      P2Pixi.drawConvex(graphics, vertices, style);
    } else if (shape instanceof Heightfield) {
      let path = [[0, 100 * ppu]],
        heights = shape.heights;
      for (let i = 0; i < heights.length; i++) {
        let h = heights[i];
        path.push([i * shape.elementWidth * ppu, -h * ppu]);
      }
      path.push([heights.length * shape.elementWidth * ppu, 100 * ppu]);
      P2Pixi.drawPath(graphics, path, style);
    }
  }

  /**
   * Resizes the Pixi renderer's view to fit proportionally in
   * the supplied window dimensions
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    let renderer = this.renderer,
      view = renderer.view,
      ratio = width / height,
      pixiRatio = renderer.width / renderer.height;

    this.windowWidth = width;
    this.windowHeight = height;
    if (ratio > pixiRatio) { // Screen is wider than the renderer
      this.viewCssWidth = height * pixiRatio;
      this.viewCssHeight = height;
      view.style.width = this.viewCssWidth + 'px';
      view.style.height = this.viewCssHeight + 'px';
      view.style.left = Math.round((width - this.viewCssWidth) / 2) + 'px';
      view.style.top = null;
    } else { // Screen is narrower
      this.viewCssWidth = width;
      this.viewCssHeight = Math.round(width / pixiRatio);
      view.style.width = this.viewCssWidth + 'px';
      view.style.height = this.viewCssHeight + 'px';
      view.style.left = null;
      view.style.top = Math.round((height - this.viewCssHeight) / 2) + 'px';
    }
  }

  /**
   * Sets up the Pixi renderer
   */
  setupRenderer() {
    this.renderer = PIXI.autoDetectRenderer(this.options.width, this.options.height, this.options);
  }

  /**
   * Sets up the Pixi view
   */
  setupView() {
    this.renderer.view.style.pos = "absolute";
    this.renderer.view.style.top = "0px";
    this.renderer.view.style.left = "0px";
    document.body.querySelector('#game-container').appendChild(this.renderer.view);

    this.viewCssWidth = 0;
    this.viewCssHeight = 0;
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

    this.container.position.x = this.renderer.width / 2;
    this.container.position.y = this.renderer.height / 2;

    if (this.options.resizable && this.options.autoResize) {
      this.resize(this.windowWidth, this.windowHeight);

      let resizeRenderer = () => {
        this.resize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', resizeRenderer);
      window.addEventListener('orientationchange', resizeRenderer);
    }
  }

  /**
   * Draws a circle onto a PIXI.Graphics object
   * @param {PIXI.Graphics} graphics
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   * @param {object} style
   */
  static drawCircle(graphics, x, y, radius, style) {
    let lineWidth = style.lineWidthUnits ? style.lineWidthUnits * style.pixelsPerLengthUnit : style.lineWidth || 0,
      lineColor = style.lineColor || 0x000000,
      fillColor = style.fillColor;

    graphics.lineStyle(lineWidth, lineColor, 1);
    if (fillColor) {
      graphics.beginFill(fillColor, 1);
    }
    graphics.drawCircle(x, y, radius);
    if (fillColor) {
      graphics.endFill();
    }
  }

  /**
   * Draws a finite plane onto a PIXI.Graphics object
   * @param {PIXI.Graphics} graphics
   * @param {number} x0
   * @param {number} x1
   * @param {object} style
   */
  static drawPlane(graphics, x0, x1, style) {
    let max = 1e6,
      lineWidth = style.lineWidthUnits ? style.lineWidthUnits * style.pixelsPerLengthUnit : style.lineWidth || 0,
      lineColor = style.lineColor || 0xFF0000,
      fillColor = style.fillColor;

    graphics.lineStyle(lineWidth, lineColor, 1);
    if (fillColor) {
      graphics.beginFill(fillColor, 1);
    }
    graphics.moveTo(-max, 0);
    graphics.lineTo(max, 0);
    graphics.lineTo(max, -max);
    graphics.lineTo(-max, -max);
    if (fillColor) {
      graphics.endFill();
    }
    // Draw the actual plane
    graphics.lineStyle(lineWidth, lineColor);
    graphics.moveTo(-max, 0);
    graphics.lineTo(max, 0);
  }

  /**
   * Draws a line onto a PIXI.Graphics object
   * @param {PIXI.Graphics} graphics
   * @param {number} len
   * @param {object} style
   */
  static drawLine(graphics, len, style) {
    let lineWidth = style.lineWidthUnits ? style.lineWidthUnits * style.pixelsPerLengthUnit : style.lineWidth || 1,
      lineColor = style.lineColor || 0x000000;

    graphics.lineStyle(lineWidth, lineColor, 1);

    graphics.moveTo(-len / 2, 0);
    graphics.lineTo(len / 2, 0);
  }

  /**
   * Draws a capsule onto a PIXI.Graphics object
   * @param {PIXI.Graphics} graphics
   * @param {number} x
   * @param {number} y
   * @param {number} angle
   * @param {number} len
   * @param {number} radius
   * @param {object} style
   */
  static drawCapsule(graphics, x, y, angle, len, radius, style) {
    let c = Math.cos(angle),
      s = Math.sin(angle),
      lineWidth = style.lineWidthUnits ? style.lineWidthUnits * style.pixelsPerLengthUnit : style.lineWidth || 0,
      lineColor = style.lineColor || 0x000000,
      fillColor = style.fillColor;

    // Draw circles at ends
    graphics.lineStyle(lineWidth, lineColor, 1);
    if (fillColor) {
      graphics.beginFill(fillColor, 1);
    }
    graphics.drawCircle(-len / 2 * c + x, -len / 2 * s + y, radius);
    graphics.drawCircle(len / 2 * c + x, len / 2 * s + y, radius);
    if (fillColor) {
      graphics.endFill();
    }

    // Draw box
    graphics.lineStyle(lineWidth, lineColor, 0);
    if (fillColor) {
      graphics.beginFill(fillColor, 1);
    }
    graphics.moveTo(-len / 2 * c + radius * s + x, -len / 2 * s + radius * c + y);
    graphics.lineTo(len / 2 * c + radius * s + x, len / 2 * s + radius * c + y);
    graphics.lineTo(len / 2 * c - radius * s + x, len / 2 * s - radius * c + y);
    graphics.lineTo(-len / 2 * c - radius * s + x, -len / 2 * s - radius * c + y);
    if (fillColor) {
      graphics.endFill();
    }

    // Draw lines in between
    graphics.lineStyle(lineWidth, lineColor, 1);
    graphics.moveTo(-len / 2 * c + radius * s + x, -len / 2 * s + radius * c + y);
    graphics.lineTo(len / 2 * c + radius * s + x, len / 2 * s + radius * c + y);
    graphics.moveTo(-len / 2 * c - radius * s + x, -len / 2 * s - radius * c + y);
    graphics.lineTo(len / 2 * c - radius * s + x, len / 2 * s - radius * c + y);
  }

  /**
   * Draws a box onto a PIXI.Graphics object
   * @param {PIXI.Graphics} graphics
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {object} style
   */
  static drawBox(graphics, x, y, w, h, style) {
    let lineWidth = style.lineWidthUnits ? style.lineWidthUnits * style.pixelsPerLengthUnit : style.lineWidth || 0,
      lineColor = style.lineColor || 0x000000,
      fillColor = style.fillColor;

    graphics.lineStyle(lineWidth, lineColor, 1);
    if (fillColor) {
      graphics.beginFill(fillColor, 1);
    }
    graphics.drawRect(x - w / 2, y - h / 2, w, h);
    if (fillColor) {
      graphics.endFill();
    }
  }

  /**
   * Draws a convex polygon onto a PIXI.Graphics object
   * @param {PIXI.Graphics} graphics
   * @param {array} verts
   * @param {object} style
   */
  static drawConvex(graphics, verts, style) {
    let lineWidth = style.lineWidthUnits ? style.lineWidthUnits * style.pixelsPerLengthUnit : style.lineWidth || 0,
      lineColor = style.lineColor || 0x000000,
      fillColor = style.fillColor;

    graphics.lineStyle(lineWidth, lineColor, 1);
    if (fillColor) {
      graphics.beginFill(fillColor, 1);
    }
    for (let i = 0; i !== verts.length; i++) {
      let v = verts[i],
        x = v[0],
        y = v[1];

      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }

    if (fillColor) {
      graphics.endFill();
    }

    if (verts.length > 2 && lineWidth !== 0) {
      graphics.moveTo(verts[verts.length - 1][0], verts[verts.length - 1][1]);
      graphics.lineTo(verts[0][0], verts[0][1]);
    }
  }

  /**
   * Draws a path onto a PIXI.Graphics object
   * @param {PIXI.Graphics} graphics
   * @param {Array} path
   * @param {Object} style
   */
  static drawPath(graphics, path, style) {
    let lineWidth = style.lineWidthUnits ? style.lineWidthUnits * style.pixelsPerLengthUnit : style.lineWidth || 0,
      lineColor = style.lineColor || 0x000000,
      fillColor = style.fillColor,
      lastx = null,
      lasty = null;

    graphics.lineStyle(lineWidth, lineColor, 1);
    if (fillColor) {
      graphics.beginFill(fillColor, 1);
    }

    for (let i = 0; i < path.length; i++) {
      let v = path[i],
        x = v[0],
        y = v[1];

      if (x !== lastx || y !== lasty) {
        if (i === 0) {
          graphics.moveTo(x, y);
        } else {
          // Check if the lines are parallel
          let p1x = lastx,
            p1y = lasty,
            p2x = x,
            p2y = y,
            p3x = path[(i + 1) % path.length][0],
            p3y = path[(i + 1) % path.length][1],
            area = ((p2x - p1x) * (p3y - p1y)) - ((p3x - p1x) * (p2y - p1y));
          if (area !== 0) {
            graphics.lineTo(x, y);
          }
        }
        lastx = x;
        lasty = y;
      }
    }

    if (fillColor) {
      graphics.endFill();
    }
    // Close the path
    if (path.length > 2 && style.fillColor) {
      graphics.moveTo(path[path.length - 1][0], path[path.length - 1][1]);
      graphics.lineTo(path[0][0], path[0][1]);
    }
  }
}
