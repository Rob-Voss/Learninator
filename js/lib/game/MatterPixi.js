// Matter aliases
const Engine = Matter.Engine,
  World = Matter.World,
  Bodies = Matter.Bodies,
  Body = Matter.Body,
  Bounds = Matter.Bounds,
  Common = Matter.Common,
  Composite = Matter.Composite,
  Constraint = Matter.Constraint,
  Events = Matter.Events,
  MouseConstraint = Matter.MouseConstraint,
  Mouse = Matter.Mouse,
  Query = Matter.Query,
  Runner = Matter.Runner,
  Vector = Matter.Vector;

let _requestAnimationFrame,
  _cancelAnimationFrame;

if (typeof window !== 'undefined') {
  _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame || window.msRequestAnimationFrame
    || function (callback) {
      window.setTimeout(function () {
        callback(Common.now());
      }, 1000 / 60);
    };

  _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
    || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
}

/**
 * The `MatterRenderPixi` module is a renderer using pixi.js.
 * See also `Matter.Render` for a canvas based renderer.
 *
 * @class MatterPixi
 */
class MatterPixi {

  /**
   * Creates a new Pixi.js WebGL renderer
   * @param {MatterWorld} world
   * @returns {MatterPixi}
   */
  constructor(world) {
    this.controller = MatterPixi;
    Common.extend(this, world);
    this.transparent = !this.renderOptions.wireframes && this.renderOptions.background === 'transparent';

    // event listeners
    Events.on(this.engine, 'beforeUpdate', () => {
      this.clear();
    });

    // Caches
    this.textures = {};
    this.sprites = {};
    this.primitives = {};

    // Insert canvas
    if (Common.isElement(this.element)) {
      this.element.appendChild(this.canvas);
    } else {
      Common.log('No "render.element" passed, "render.canvas" was not inserted into document.', 'warn');
    }

    return this;
  }

  /**
   * Handle drawing the graphic elements of the Body
   * @method body
   * @param {Matter.Body} body
   */
  body(body) {
    if (!body.render.visible) {
      return;
    }

    // Loop through all the parts
    for (let k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
      let pGfx,
        part = body.parts[k],
        partId = 'b-' + part.id,
        showInternal = this.renderOptions.showInternalEdges,
        showWireframes = this.renderOptions.wireframes,
        wireframeBackground = this.renderOptions.wireframeBackground,
        lineWidth = part.render.lineWidth || 1,
        alpha = part.render.alpha || 1,
        wireframeFillColor = Common.colorToNumber(wireframeBackground || '#000000'),
        fillColor = Common.colorToNumber(part.render.fillColor || '#000000'),
        lineColor = Common.colorToNumber(part.render.lineColor || '#000000'),
        lineColorWireframe = Common.colorToNumber('#bbb'),
        styleSettings = {
          alpha: alpha,
          lineWidth: lineWidth,
          fillColor: (showWireframes) ? wireframeFillColor : fillColor,
          lineColor: (showWireframes) ? lineColorWireframe : lineColor
        },
        x = part.position.x - body.position.x,
        y = part.position.y - body.position.y;

      if (!part.render.visible) {
        continue;
      }

      if (part.render.sprite && part.render.sprite.texture) {
        pGfx = this.sprites[partId];
        // Create it if it doesn't exist in cache
        if (!pGfx) {
          MatterPixi._createBodySprite(this, part);
          pGfx = this.sprites[partId];
        }
        pGfx.scale.x = body.render.sprite.xScale || 1;
        pGfx.scale.y = body.render.sprite.yScale || 1;
      } else {
        pGfx = this.primitives[partId];
        // Create it if it doesn't exist in cache
        if (!pGfx) {
          MatterPixi._createBodyPrimitive(this, part);
          pGfx = this.primitives[partId];
          pGfx.initialAngle = body.angle;
        }
        if (part.shape === 'capsule') {
          MatterPixi._drawCapsule(pGfx, x, y, 1.6, 40, 10, styleSettings);
        } else if (part.shape === 'circle') {
          MatterPixi._drawCircle(pGfx, x, y, part.circleRadius, styleSettings);
        } else if (part.shape === 'convex') {
          MatterPixi._drawConvex(pGfx, part, part.vertices, styleSettings, showInternal);
        } else if (part.shape === 'line') {
          MatterPixi._drawLine(pGfx, length, styleSettings);
        } else if (part.shape === 'path') {
          MatterPixi._drawPath(pGfx, part.vertices, styleSettings);
        } else if (part.shape === 'plane') {
          MatterPixi._drawPlane(pGfx, styleSettings);
        } else if (part.shape === 'rectangle') {
          MatterPixi._drawRectangle(pGfx, x, y, part.width, part.height, styleSettings);
        }
      }
      pGfx.position.x = part.position.x;
      pGfx.position.y = part.position.y;
      pGfx.rotation = body.angle - pGfx.initialAngle;

      if (part.entity !== undefined && part.entity.eyes !== undefined) {
        for (let i = 0; i < part.entity.eyes.length; i++) {
          let eye = part.entity.eyes[i],
            x = part.position.x - body.position.x,
            y = part.position.y - body.position.y,
            eyeStartX = x + body.circleRadius * Math.sin(body.angle + eye.angle),
            eyeStartY = y + body.circleRadius * Math.cos(body.angle + eye.angle),
            eyeEndX = x + eye.sensed.proximity * Math.sin(body.angle + eye.angle),
            eyeEndY = y + eye.sensed.proximity * Math.cos(body.angle + eye.angle);
          eye.v1 = Vector.create(eyeStartX, eyeStartY);
          eye.v2 = Vector.create(eyeEndX, eyeEndY);

          // Draw the agent's line of sights
          pGfx.lineStyle(1, (eye.sensed.type > -1) ? hexColorStyles[eye.sensed.type] : 0xFFFFFF, 1);
          pGfx.beginFill();
          pGfx.moveTo(eye.v1.x, eye.v1.y);
          pGfx.lineTo(eye.v2.x, eye.v2.y);
          pGfx.endFill();
        }
      }
    }
  }

  /**
   * Draws body angle indicators and axes
   * @private
   * @method bodyAxes
   * @param {Matter.Body} body
   */
  bodyAxes(body) {
    let parts = body.parts;
    if (!body.render.visible) {
      return;
    }

    for (let j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
      let pGfx,
        part = parts[j],
        partId = 'b-' + part.id,
        strokeStyleIndicator = Common.colorToNumber('#FF3333'),
        strokeStyleWireframeIndicator = Common.colorToNumber('#CD5C5C');

      if (part.render.sprite && part.render.sprite.texture) {
        pGfx = this.sprites[partId];
      } else {
        pGfx = this.primitives[partId];
      }
      if (pGfx) {
        if (this.renderOptions.showAxes) {
          if (this.renderOptions.wireframes) {
            pGfx.lineStyle(1, strokeStyleWireframeIndicator, 0.7);
          } else {
            pGfx.lineStyle(1, strokeStyleIndicator, 1);
          }
          pGfx.beginFill();
          // Render all axes
          for (let k = 0; k < part.axes.length; k++) {
            let axis = part.axes[k],
              x = part.position.x - body.position.x,
              y = part.position.y - body.position.y,
              tX = x + axis.x * 20,
              tY = y + axis.y * 20;
            pGfx.moveTo(x, y);
            pGfx.lineTo(tX, tY);
          }
          pGfx.endFill();
        } else {
          if (this.renderOptions.wireframes) {
            pGfx.lineStyle(1, strokeStyleWireframeIndicator, 1);
          } else {
            pGfx.lineStyle(1, strokeStyleIndicator);
          }
          pGfx.beginFill();
          for (let k = 0; k < part.axes.length; k++) {
            // render a single axis indicator
            let x = part.position.x - body.position.x,
              y = part.position.y - body.position.y,
              tX = ((x + part.vertices[part.vertices.length - 1].x - body.position.x) / 2),
              tY = ((y + part.vertices[part.vertices.length - 1].y - body.position.y) / 2);
            pGfx.moveTo(x, y);
            pGfx.lineTo(tX, tY);
          }
          pGfx.endFill();
        }
      }
    }
  }

  /**
   * Draws body bounds
   * @private
   * @method bodyBounds
   * @param {Matter.Body} body
   */
  bodyBounds(body) {
    let parts = body.parts;
    if (!body.render.visible) {
      return;
    }

    for (let j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
      let pGfx,
        part = parts[j],
        partId = 'b-' + part.id;
      if (part.render.sprite && part.render.sprite.texture) {
        pGfx = this.sprites[partId];
      } else {
        pGfx = this.primitives[partId];
      }
      if (pGfx) {
        if (this.renderOptions.wireframes) {
          pGfx.lineStyle(1, Common.colorToNumber('rgba(255,255,255)'), 0.8);
        } else {
          pGfx.lineStyle(1, Common.colorToNumber('rgba(0,0,0)'), 0.8);
        }
        pGfx.beginFill(0, 0);
        pGfx.drawRect(
          body.position.x - body.bounds.max.x,
          body.position.y - body.bounds.max.y,
          body.bounds.max.x - body.bounds.min.x,
          body.bounds.max.y - body.bounds.min.y
        );
        pGfx.endFill();
      }
    }
  }

  /**
   * Display the body ids
   * @param {Matter.Body} body
   */
  bodyIds(body) {
    let parts = body.parts;
    if (!body.render.visible) {
      return;
    }

    for (let j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
      let pGfx,
        part = parts[j],
        partId = 'b-' + part.id,
        textOpts = {fontSize: '10px Arial', fill: '#FFFFFF', align: 'center'};
      if (part.render.sprite && part.render.sprite.texture) {
        pGfx = this.sprites[partId];
      } else {
        pGfx = this.primitives[partId];
      }
      if (pGfx) {
        pGfx.removeChildren();
        pGfx.addChild(new PIXI.Text(body.id, textOpts));
      }
    }
  }

  /**
   * Draws body positions
   * @private
   * @method bodyPositions
   * @param {Matter.Body} body
   */
  bodyPositions(body) {
    let parts = body.parts;
    if (!body.render.visible) {
      return;
    }

    for (let j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
      let pGfx,
        part = parts[j],
        partId = 'b-' + part.id,
        x = part.position.x - body.position.x,
        y = part.position.y - body.position.y,
        pX = part.positionPrev.x - body.position.x,
        pY = part.positionPrev.y - body.position.y;
      if (part.render.sprite && part.render.sprite.texture) {
        pGfx = this.sprites[partId];
      } else {
        pGfx = this.primitives[partId];
      }
      if (pGfx) {
        pGfx.beginFill(Common.colorToNumber('rgba(255,165,0)'), 0.8);
        pGfx.drawCircle(pX, pY, 2);
        pGfx.endFill();

        if (this.renderOptions.wireframes) {
          pGfx.beginFill(0xB0171F, 0.1);
        } else {
          pGfx.beginFill(0x000000, 0.5);
        }
        pGfx.drawCircle(x, y, 3);
        pGfx.endFill();
      }
    }
  }

  /**
   * Draws body velocity
   * @private
   * @method bodyVelocity
   * @param {Matter.Body} body
   */
  bodyVelocity(body) {
    let parts = body.parts;
    if (!body.render.visible) {
      return;
    }

    for (let j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
      let pGfx,
        part = parts[j],
        partId = 'b-' + part.id;
      if (part.render.sprite && part.render.sprite.texture) {
        pGfx = this.sprites[partId];
      } else {
        pGfx = this.primitives[partId];
      }
      if (pGfx) {
        let x = part.position.x - body.position.x,
          y = part.position.y - body.position.y,
          px = x + (part.positionPrev.x - body.position.x),
          py = y + (part.positionPrev.y - body.position.y);
        pGfx.lineStyle(1, 0x6495ED, 1);
        pGfx.beginFill(1, 0x6495ED);
        pGfx.moveTo(x, y);
        pGfx.lineTo(px * 2, py * 2);
        pGfx.endFill();
      }
    }
  }

  /**
   * Clears the scene graph
   * @method clear
   */
  clear() {
    // Clear stage and all other containers
    this.stage.removeChildren(0, this.stage.children.length);
    this.primitiveContainer.removeChildren(0, this.primitiveContainer.children.length);
    this.spriteContainer.removeChildren(0, this.spriteContainer.children.length);
    this.displayContainer.removeChildren(0, this.displayContainer.children.length);

    // Clear caches
    this.textures = {};
    this.sprites = {};
    this.primitives = {};

    // Set background sprite
    if (this.sprites['bg-0']) {
      this.stage.addChildAt(this.sprites['bg-0'], 0);
    }

    // Reset background state
    this.currentBackground = null;

    // Reset bounds transforms
    this.stage.scale.set(1, 1);
    this.stage.position.set(0, 0);
    this.stage.addChild(this.primitiveContainer);
    this.stage.addChild(this.spriteContainer);
    this.stage.addChild(this.displayContainer);
  }

  /* These methods add Graphics to the display Layer */

  /**
   * Show the collision points
   * @private
   * @method collisions
   * @param {Array} pairs
   */
  collisions(pairs) {
    // render collision positions
    for (let i = 0; i < pairs.length; i++) {
      let pair = pairs[i];
      if (!pair.isActive) {
        continue;
      }

      for (let j = 0; j < pair.activeContacts.length; j++) {
        let contact = pair.activeContacts[j],
          vertex = contact.vertex,
          cGfx = new PIXI.Graphics();

        cGfx.clear();
        if (this.renderOptions.wireframes) {
          cGfx.beginFill(0xFFFFFF, 0.7);
        } else {
          cGfx.beginFill(0xFFA500, 1);
        }
        cGfx.drawRect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
        cGfx.endFill();
        this.displayContainer.addChild(cGfx);
      }
    }

    // render collision normals
    for (let i = 0; i < pairs.length; i++) {
      let pair = pairs[i],
        collision = pair.collision,
        cGfx = new PIXI.Graphics();

      if (!pair.isActive) {
        continue;
      }

      cGfx.clear();
      cGfx.beginFill();
      if (this.renderOptions.wireframes) {
        cGfx.lineStyle(1, Common.colorToNumber('rgba(255,165,0)'), 0.7);
      } else {
        cGfx.lineStyle(1, 0xFFA500, 1);
      }

      if (pair.activeContacts.length > 0) {
        let normalPosX = pair.activeContacts[0].vertex.x,
          normalPosY = pair.activeContacts[0].vertex.y;

        if (pair.activeContacts.length === 2) {
          normalPosX = (pair.activeContacts[0].vertex.x + pair.activeContacts[1].vertex.x) / 2;
          normalPosY = (pair.activeContacts[0].vertex.y + pair.activeContacts[1].vertex.y) / 2;
        }

        if (collision.bodyB === collision.supports[0].body || collision.bodyA.isStatic === true) {
          cGfx.moveTo(normalPosX - collision.normal.x * 8, normalPosY - collision.normal.y * 8);
        } else {
          cGfx.moveTo(normalPosX + collision.normal.x * 8, normalPosY + collision.normal.y * 8);
        }

        cGfx.lineTo(normalPosX, normalPosY);
      }
      cGfx.endFill();
      this.displayContainer.addChild(cGfx);
    }
  }

  /**
   * Description
   * @method constraint
   * @param {constraint} constraint
   */
  constraint(constraint) {
    let bodyA = constraint.bodyA,
      bodyB = constraint.bodyB,
      pointA = constraint.pointA,
      pointB = constraint.pointB,
      constraintRender = constraint.render,
      partId = 'c-' + constraint.id,
      pGfx = this.primitives[partId];

    // initialise constraint primitive if not existing
    if (!pGfx) {
      pGfx = this.primitives[partId] = new PIXI.Graphics();
    }
    // don't render if constraint does not have two end points
    if (!constraintRender.visible || !constraint.pointA || !constraint.pointB) {
      pGfx.clear();
      return;
    }

    // render the constraint on every update,
    // since they can change dynamically
    pGfx.clear();
    pGfx.beginFill(0, 0);
    pGfx.lineStyle(constraintRender.lineWidth, Common.colorToNumber(constraintRender.strokeStyle), 1);
    if (bodyA) {
      pGfx.moveTo(bodyA.position.x + pointA.x, bodyA.position.y + pointA.y);
    } else {
      pGfx.moveTo(pointA.x, pointA.y);
    }
    if (bodyB) {
      pGfx.lineTo(bodyB.position.x + pointB.x, bodyB.position.y + pointB.y);
    } else {
      pGfx.lineTo(pointB.x, pointB.y);
    }
    pGfx.endFill();

    this.displayContainer.addChild(pGfx);
  }

  /**
   * Description
   * @private
   * @method debug
   */
  debug() {
    let dbgTxt = this.primitives['debug'],
      engine = this.engine,
      world = this.engine.world,
      metrics = this.engine.metrics,
      bodies = Composite.allBodies(world),
      space = "    \n",
      textOpts = {fontSize: '10px Arial', fill: '#FFFFFF', align: 'left'};
    if (!dbgTxt) {
      dbgTxt = this.primitives['debug'] = new PIXI.Text('', textOpts);
    }

    let text = "";

    if (metrics.timing) {
      text += "fps: " + Math.round(metrics.timing.fps) + space;
    }

    if (metrics.extended) {
      if (metrics.timing) {
        text += "delta: " + metrics.timing.delta.toFixed(3) + space;
        text += "correction: " + metrics.timing.correction.toFixed(3) + space;
      }
      text += "bodies: " + bodies.length + space;
      text += "buckets: " + metrics.buckets + space;
      text += "\n";
      text += "collisions: " + metrics.collisions + space;
      text += "pairs: " + engine.pairs.list.length + space;
      text += "broad: " + metrics.broadEff + space;
      text += "mid: " + metrics.midEff + space;
      text += "narrow: " + metrics.narrowEff + space;
    }
    dbgTxt.text = text;
    dbgTxt.debugString = text;
    dbgTxt.debugTimestamp = engine.timing.timestamp;
    dbgTxt.position.set(10, 10);

    this.displayContainer.addChild(dbgTxt);
  };

  /**
   * Show the Grid
   * @private
   * @method grid
   */
  grid() {
    let grid = this.engine.broadphase,
      bucketKeys = Common.keys(grid.buckets);
    for (let i = 0; i < bucketKeys.length; i++) {
      let bucketId = bucketKeys[i],
        gridGfx = new PIXI.Graphics(),
        region = bucketId.split(',');

      if (grid.buckets[bucketId].length < 2) {
        continue;
      }
      if (this.renderOptions.wireframes) {
        gridGfx.beginFill(Common.colorToNumber('rgba(255,180,0)'), 0.1);
      } else {
        gridGfx.beginFill(Common.colorToNumber('rgba(255,180,0)'), 0.5);
      }
      gridGfx.drawRect(
        0.5 + parseInt(region[0], 10) * grid.bucketWidth,
        0.5 + parseInt(region[1], 10) * grid.bucketHeight,
        grid.bucketWidth,
        grid.bucketHeight);
      gridGfx.endFill();

      this.displayContainer.addChild(gridGfx);
    }
  }

  /**
   * Renders mouse position.
   * @private
   * @method mousePosition
   */
  mousePosition() {
    var c = context;
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fillText(mouse.position.x + '  ' + mouse.position.y, mouse.position.x + 5, mouse.position.y - 5);
  }

  /**
   * Remove a body from the world and display container
   * @param {Matter.Body} body
   */
  removeBody(body) {
    for (let j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j++) {
      let part = body.parts[j],
        partId = 'b-' + part.id;

      if (part.render.sprite && part.render.sprite.texture) {
        if (this.sprites[partId]) {
          this.stage.removeChildAt(this.stage.getChildIndex(this.sprites[partId]));
          delete this.sprites[partId];
        }
      } else {
        if (this.primitives[partId]) {
          this.stage.removeChildAt(this.stage.getChildIndex(this.primitives[partId]));
          delete this.primitives[partId];
        }
      }
    }
  }

  /**
   * Continuously updates the render canvas on the `requestAnimationFrame` event.
   * @method run
   */
  run() {
    let _this = this;
    (function loop(time) {
      _this.frameRequestId = _requestAnimationFrame(loop);
      _this.world(time);
    })();
  }

  /**
   * Show the separations
   * @private
   * @method separations
   * @param {Array} pairs
   */
  separations(pairs) {
    // render separations
    for (let i = 0; i < pairs.length; i++) {
      let pair = pairs[i],
        sepGfx = new PIXI.Graphics();

      sepGfx.clear();
      if (this.renderOptions.wireframes) {
        sepGfx.beginFill(Common.colorToNumber('rgba(255,165,0)'), 0.5);
      } else {
        sepGfx.beginFill(0xFFA500, 1);
      }
      if (!pair.isActive) {
        continue;
      }

      let collision = pair.collision,
        bodyA = collision.bodyA,
        bodyB = collision.bodyB,
        k = 1;
      if (!bodyB.isStatic && !bodyA.isStatic) {
        k = 0.5;
      }
      if (bodyB.isStatic) {
        k = 0;
      }
      sepGfx.moveTo(bodyB.position.x, bodyB.position.y);
      sepGfx.lineTo(bodyB.position.x - collision.penetration.x * k, bodyB.position.y - collision.penetration.y * k);
      k = 1;
      if (!bodyB.isStatic && !bodyA.isStatic) {
        k = 0.5;
      }
      if (bodyA.isStatic) {
        k = 0;
      }
      sepGfx.moveTo(bodyA.position.x, bodyA.position.y);
      sepGfx.lineTo(bodyA.position.x + collision.penetration.x * k, bodyA.position.y + collision.penetration.y * k);
      sepGfx.endFill();

      this.displayContainer.addChild(sepGfx);
    }
  }

  /**
   * Sets the background of the canvas
   * @method setBackground
   * @param {string} background
   */
  setBackground(background) {
    if (this.currentBackground !== background) {
      let isColor = background.indexOf && background.indexOf('#') !== -1,
        bgSprite = this.sprites['bg-0'];
      if (isColor) {
        // if solid background color
        this.renderer.backgroundColor = Common.colorToNumber(background);
        // remove background sprite if existing
        if (bgSprite) {
          this.stage.removeChild(bgSprite);
        }
      } else {
        // initialise background sprite if needed
        if (!bgSprite) {
          let texture = MatterPixi._getTexture(this, background);
          bgSprite = this.sprites['bg-0'] = new PIXI.Sprite(texture);
          bgSprite.position.x = 0;
          bgSprite.position.y = 0;
          this.stage.addChildAt(bgSprite, 0);
        }
      }
      this.currentBackground = background;
    }
  }

  /**
   * Ends execution of `Render.run` on the given `render`,
   * by canceling the animation frame request event loop.
   * @method stop
   * @param {render} render
   */
  static stop(render) {
    _cancelAnimationFrame(render.frameRequestId);
  }

  /**
   * Perform world actions
   */
  world() {
    let allBodies = Composite.allBodies(this.engine.world),
      allConstraints = Composite.allConstraints(this.engine.world),
      constraints = [],
      bodies = [],
      showWireframes = this.renderOptions.wireframes,
      event = {
        timestamp: this.engine.timing.timestamp
      };

    this.setBackground((showWireframes) ? this.renderOptions.wireframeBackground : this.renderOptions.background);

    Events.trigger(this, 'beforeRender', event);
    if (this.renderOptions.hasBounds) {
      this.engine.world.bounds = this.bounds;
      // Handle bounds
      let boundsWidth = this.bounds.max.x - this.bounds.min.x,
        boundsHeight = this.bounds.max.y - this.bounds.min.y,
        boundsScaleX = boundsWidth / this.width,
        boundsScaleY = boundsHeight / this.height;
      // Hide bodies that are not in view
      for (let i = 0; i < allBodies.length; i++) {
        let body = allBodies[i],
          over = Bounds.overlaps(body.bounds, this.bounds);
        body.render.visible = over;
        if (over) {
          bodies.push(body);
        } else {
          // console.log();
        }
      }
      // Hide constraints that are not in view
      for (let i = 0; i < allConstraints.length; i++) {
        let constraint = allConstraints[i],
          bodyA = constraint.bodyA,
          bodyB = constraint.bodyB,
          pointAWorld = constraint.pointA,
          pointBWorld = constraint.pointB;
        if (bodyA) {
          pointAWorld = Vector.add(bodyA.position, constraint.pointA);
        }
        if (bodyB) {
          pointBWorld = Vector.add(bodyB.position, constraint.pointB);
        }
        if (!pointAWorld || !pointBWorld) {
          continue;
        }
        if (Bounds.contains(this.bounds, pointAWorld) || Bounds.contains(this.bounds, pointBWorld)) {
          constraints.push(constraint);
        }
      }

      // transform the view
      this.stage.scale.set(1 / boundsScaleX, 1 / boundsScaleY);
      this.stage.position.set(
        -this.bounds.min.x * (1 / boundsScaleX),
        -this.bounds.min.y * (1 / boundsScaleY)
      );
    } else {
      constraints = allConstraints;
    }

    for (let i = 0; i < bodies.length; i++) {
      this.body(bodies[i]);

      // Body display options
      if (this.renderOptions.showIds) {
        this.bodyIds(bodies[i]);
      }
      if (this.renderOptions.showBounds) {
        this.bodyBounds(bodies[i]);
      }
      if (this.renderOptions.showAxes || this.renderOptions.showAngleIndicator) {
        this.bodyAxes(bodies[i]);
      }
      if (this.renderOptions.showPositions) {
        this.bodyPositions(bodies[i]);
      }
      if (this.renderOptions.showVelocity) {
        this.bodyVelocity(bodies[i]);
      }
      if (this.renderOptions.showVertexNumbers) {
        this.vertexNumbers(bodies[i]);
      }
    }

    for (let i = 0; i < constraints.length; i++) {
      this.constraint(constraints[i]);
    }

    // Engine display options
    if (this.renderOptions.showSeparations) {
      this.separations(this.engine.pairs.list);
    }
    if (this.renderOptions.showCollisions) {
      this.collisions(this.engine.pairs.list);
    }
    if (this.renderOptions.showMousePosition) {
      this.mousePosition(this.mouse);
    }
    if (this.renderOptions.showBroadphase) {
      this.grid();
    }
    if (this.renderOptions.showDebug) {
      this.debug();
    }
    if (this.renderOptions.hasBounds) {
      // this.context.setTransform(this.renderOptions.pixelRatio, 0, 0, this.renderOptions.pixelRatio, 0, 0);
    }

    this.renderer.render(this.stage);
    Events.trigger(this, 'afterRender', event);
  }

  /**
   * Creates a body sprite
   * @method _createBodySprite
   * @private
   * @param {MatterPixi} render
   * @param {Matter.Body} body
   * @return {PIXI.Sprite} sprite
   */
  static _createBodySprite(render, body) {
    // handle compound parts
    for (let k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
      let part = body.parts[k],
        partRender = part.render,
        texturePath = partRender.sprite.texture,
        texture = MatterPixi._getTexture(render, texturePath),
        pGfx = new PIXI.Sprite(texture),
        container = render.spriteContainer;
      pGfx.anchor.x = body.render.sprite.xOffset;
      pGfx.anchor.y = body.render.sprite.yOffset;
      pGfx.scale.x = body.render.sprite.xScale || 1;
      pGfx.scale.y = body.render.sprite.yScale || 1;
      render.sprites['b-' + part.id] = pGfx;

      // Add to scene graph if not already there
      if (Common.indexOf(container.children, pGfx) === -1) {
        container.addChild(pGfx);
      }
    }
  }

  /**
   * Creates a body primitive
   * @method _createBodyPrimitive
   * @private
   * @param {MatterPixi} render
   * @param {Matter.Body} body
   * @return {PIXI.Graphics} graphics
   */
  static _createBodyPrimitive(render, body) {
    for (let k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
      let part = body.parts[k],
        pGfx = new PIXI.Graphics(),
        container = render.primitiveContainer;

      pGfx.initialAngle = part.angle;
      render.primitives['b-' + part.id] = pGfx;

      // Add to scene graph if not already there
      if (Common.indexOf(container.children, pGfx) === -1) {
        container.addChild(pGfx);
      }
    }
  }

  /**
   * Gets the requested texture (a PIXI.Texture) via its path
   * @method _getTexture
   * @private
   * @param {MatterPixi} render
   * @param {string} imagePath
   * @return {PIXI.Texture} texture
   */
  static _getTexture(render, imagePath) {
    if (!render.textures[imagePath]) {
      render.textures[imagePath] = PIXI.Texture.fromImage(imagePath);
    }

    return render.textures[imagePath];
  }

  /**
   * Gets the pixel ratio of the canvas.
   * @method _getPixelRatio
   * @private
   * @param {HTMLElement} canvas
   * @return {Number} pixel ratio
   */
  static _getPixelRatio(canvas) {
    let context = canvas.getContext('2d'),
      devicePixelRatio = window.devicePixelRatio || 1,
      backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio
        || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio
        || context.backingStorePixelRatio || 1;

    return devicePixelRatio / backingStorePixelRatio;
  }

  /**
   * Draws a circle onto a PIXI.Graphics object
   * -Borrowed from https://github.com/TomWHall/p2Pixi
   * @param  {PIXI.Graphics} pGfx
   * @param  {Number} x
   * @param  {Number} y
   * @param  {Number} radius
   * @param  {object} style
   */
  static _drawCircle(pGfx, x, y, radius, style = {}) {
    let lineWidthUnits = style.lineWidth || 0,
      lineWidth = style.lineWidthUnits ? style.lineWidthUnits : lineWidthUnits,
      lineColor = style.lineColor || 0x000000,
      fillColor = style.fillColor || 0x000000,
      alpha = style.alpha || 1;
    pGfx.lineStyle(lineWidth, lineColor, alpha);
    if (fillColor) {
      pGfx.beginFill(fillColor, alpha);
    }
    pGfx.drawCircle(x, y, radius);
    if (fillColor) {
      pGfx.endFill();
    }
  }

  /**
   * Draws a finite plane onto a PIXI.Graphics object
   * -Borrowed from https://github.com/TomWHall/p2Pixi
   * @param  {PIXI.Graphics} pGfx
   * @param  {Number} x0
   * @param  {Number} x1
   * @param  {Number} color
   * @param  {object} style
   */
  static _drawPlane(pGfx, style = {}) {
    let lineWidthUnits = style.lineWidth || 0,
      lineWidth = style.lineWidthUnits ? style.lineWidthUnits : lineWidthUnits,
      lineColor = style.lineColor || 0x000000,
      fillColor = style.fillColor || 0x000000,
      alpha = style.alpha || 1,
      max = 1e6;
    pGfx.lineStyle(lineWidth, lineColor, alpha);
    if (fillColor) {
      pGfx.beginFill(fillColor, alpha);
    }
    pGfx.moveTo(-max, 0);
    pGfx.lineTo(max, 0);
    pGfx.lineTo(max, max);
    pGfx.lineTo(-max, max);
    if (fillColor) {
      pGfx.endFill();
    }
    // Draw the actual plane
    pGfx.lineStyle(lineWidth, lineColor, alpha);
    pGfx.moveTo(-max, 0);
    pGfx.lineTo(max, 0);
  }

  /**
   * Draws a line onto a PIXI.Graphics object
   * -Borrowed from https://github.com/TomWHall/p2Pixi
   * @param  {PIXI.Graphics} pGfx
   * @param  {Number} len
   * @param  {object} style
   */
  static _drawLine(pGfx, len, style = {}) {
    let lineWidthUnits = style.lineWidth || 0,
      lineWidth = style.lineWidthUnits ? style.lineWidthUnits : lineWidthUnits,
      lineColor = style.lineColor || 0x000000,
      fillColor = style.fillColor || 0x000000,
      alpha = style.alpha || 1;

    pGfx.lineStyle(lineWidth, lineColor, 1);
    if (fillColor) {
      pGfx.beginFill(fillColor, alpha);
    }
    pGfx.moveTo(-len / 2, 0);
    pGfx.lineTo(len / 2, 0);
    if (fillColor) {
      pGfx.endFill();
    }
  }

  /**
   * Draws a capsule onto a PIXI.Graphics object
   * -Borrowed from https://github.com/TomWHall/p2Pixi
   * @param  {PIXI.Graphics} pGfx
   * @param  {Number} x
   * @param  {Number} y
   * @param  {Number} angle
   * @param  {Number} len
   * @param  {Number} radius
   * @param  {object} style
   */
  static _drawCapsule(pGfx, x, y, angle, len, radius, style = {}) {
    let lineWidthUnits = style.lineWidth || 0,
      lineWidth = style.lineWidthUnits ? style.lineWidthUnits : lineWidthUnits,
      lineColor = style.lineColor || 0x000000,
      fillColor = style.fillColor || 0x000000,
      alpha = style.alpha || 1,
      c = Math.cos(angle),
      s = Math.sin(angle);

    // Draw circles at ends
    pGfx.lineStyle(lineWidth, lineColor, alpha);
    if (fillColor) {
      pGfx.beginFill(fillColor, alpha);
    }
    pGfx.drawCircle(-len / 2 * c + x, -len / 2 * s + y, radius);
    pGfx.drawCircle(len / 2 * c + x, len / 2 * s + y, radius);
    if (fillColor) {
      pGfx.endFill();
    }

    // Draw box
    pGfx.lineStyle(lineWidth, lineColor, 0);
    if (fillColor) {
      pGfx.beginFill(fillColor, alpha);
    }
    pGfx.moveTo(-len / 2 * c + radius * s + x, -len / 2 * s + radius * c + y);
    pGfx.lineTo(len / 2 * c + radius * s + x, len / 2 * s + radius * c + y);
    pGfx.lineTo(len / 2 * c - radius * s + x, len / 2 * s - radius * c + y);
    pGfx.lineTo(-len / 2 * c - radius * s + x, -len / 2 * s - radius * c + y);
    if (fillColor) {
      pGfx.endFill();
    }

    // Draw lines in between
    pGfx.lineStyle(lineWidth, lineColor, alpha);
    pGfx.moveTo(-len / 2 * c + radius * s + x, -len / 2 * s + radius * c + y);
    pGfx.lineTo(len / 2 * c + radius * s + x, len / 2 * s + radius * c + y);
    pGfx.moveTo(-len / 2 * c - radius * s + x, -len / 2 * s - radius * c + y);
    pGfx.lineTo(len / 2 * c - radius * s + x, len / 2 * s - radius * c + y);
  }

  /**
   * Draws a box onto a PIXI.Graphics object
   * -Borrowed from https://github.com/TomWHall/p2Pixi
   * @param  {PIXI.Graphics} pGfx
   * @param  {Number} x
   * @param  {Number} y
   * @param  {Number} w
   * @param  {Number} h
   * @param  {object} style
   */
  static _drawRectangle(pGfx, x, y, w, h, style = {}) {
    let lineWidthUnits = style.lineWidth || 0,
      lineWidth = style.lineWidthUnits ? style.lineWidthUnits : lineWidthUnits,
      lineColor = style.lineColor || 0x000000,
      fillColor = style.fillColor || 0x000000,
      alpha = style.alpha || 1;
    pGfx.lineStyle(lineWidth, lineColor, alpha);
    if (fillColor) {
      pGfx.beginFill(fillColor, alpha);
    }
    pGfx.drawRect(x - w / 2, y - h / 2, w, h);
    if (fillColor) {
      pGfx.endFill();
    }
  }

  /**
   * Draws a convex polygon onto a PIXI.Graphics object
   * -Borrowed from https://github.com/TomWHall/p2Pixi
   * @param  {PIXI.Graphics} pGfx
   * @param  {Matter.Body} body
   * @param  {Array} vertices
   * @param  {object} style
   * @param  {boolean} showInternalEdges
   */
  static _drawConvex(pGfx, body, vertices, style = {}, showInternalEdges = false) {
    let lineWidthUnits = style.lineWidth || 0,
      lineWidth = style.lineWidthUnits ? style.lineWidthUnits : lineWidthUnits,
      lineColor = style.lineColor || 0x000000,
      fillColor = style.fillColor || 0x000000,
      alpha = style.alpha || 1;

    pGfx.lineStyle(lineWidth, lineColor, alpha);
    if (fillColor) {
      pGfx.beginFill(fillColor, alpha);
    }
    pGfx.moveTo(vertices[0].x - body.position.x, vertices[0].y - body.position.y);
    for (let j = 1; j < vertices.length; j++) {
      if (!vertices[j - 1].isInternal || showInternalEdges) {
        pGfx.lineTo(vertices[j].x - body.position.x, vertices[j].y - body.position.y);
      } else {
        pGfx.moveTo(vertices[j].x - body.position.x, vertices[j].y - body.position.y);
      }
      if (vertices[j].isInternal && !showInternalEdges) {
        let vId = (j + 1) % vertices.length;
        pGfx.moveTo(vertices[vId].x - body.position.x, vertices[vId].y - body.position.y);
      }
    }
    if (vertices.length > 2 && lineWidth !== 0) {
      pGfx.lineTo(vertices[0].x - body.position.x, vertices[0].y - body.position.y);
    }
    if (fillColor) {
      pGfx.endFill();
    }
  }

  /**
   * Draws a path onto a PIXI.Graphics object
   * -Borrowed from https://github.com/TomWHall/p2Pixi
   * @param  {PIXI.Graphics} pGfx
   * @param  {Array} path
   * @param  {object} style
   */
  static _drawPath(pGfx, path, style = {}) {
    let lineWidthUnits = style.lineWidth || 0,
      lineWidth = style.lineWidthUnits ? style.lineWidthUnits : lineWidthUnits,
      lineColor = style.lineColor || 0x000000,
      fillColor = style.fillColor || 0x000000,
      alpha = style.alpha || 1,
      lastx = null,
      lasty = null;

    pGfx.lineStyle(lineWidth, lineColor, alpha);
    if (fillColor) {
      pGfx.beginFill(fillColor, alpha);
    }
    for (let i = 0; i < path.length; i++) {
      let v = path[i],
        x = v[0],
        y = v[1];
      if (x !== lastx || y !== lasty) {
        if (i === 0) {
          pGfx.moveTo(x, y);
        } else {
          // Check if the lines are parallel
          let p1x = lastx,
            p1y = lasty,
            p2x = x,
            p2y = y,
            p3x = path[(i + 1) % path.length][0],
            p3y = path[(i + 1) % path.length][1];
          let area = ((p2x - p1x) * (p3y - p1y)) - ((p3x - p1x) * (p2y - p1y));
          if (area !== 0) {
            pGfx.lineTo(x, y);
          }
        }
        lastx = x;
        lasty = y;
      }
    }
    if (fillColor) {
      pGfx.endFill();
    }
    // Close the path
    if (path.length > 2 && style.fillColor) {
      pGfx.moveTo(path[path.length - 1][0], path[path.length - 1][1]);
      pGfx.lineTo(path[0][0], path[0][1]);
    }
  }
}
