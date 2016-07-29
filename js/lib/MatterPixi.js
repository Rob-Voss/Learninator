(function(global) {
  "use strict";

  // Matter aliases
  const Bounds = Matter.Bounds,
      Composite = Matter.Composite,
      Common = Matter.Common,
      Events = Matter.Events,
      Vector = Matter.Vector,

      entityTypes = ['Wall', 'Nom', 'Gnar', 'Entity Agent', 'Agent', 'Agent Worker'],
      styles = ['black', 'green', 'red', 'olive', 'blue', 'navy', 'magenta', 'cyan', 'purple', 'aqua', 'lime'],
      hexStyles = [0x000000, 0x00FF00, 0xFF0000, 0x808000, 0x0000FF, 0x000080, 0xFF00FF, 0x00FFFF, 0x800080, 0x00FFFF, 0x00FF00];

  let _requestAnimationFrame,
      _cancelAnimationFrame;

  if (typeof window !== 'undefined') {
    _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
        || window.mozRequestAnimationFrame || window.msRequestAnimationFrame
        || function(callback) {
          window.setTimeout(function() {
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
     * @param options
     * @returns {MatterPixi}
     */
    constructor(options) {
      this.controller = MatterPixi;
      this.engine = null;
      this.element = null;
      this.canvas = null;
      this.runner = null;
      this.renderer = null;
      this.stage = null;
      this.displayContainer = null;
      this.primitiveContainer = null;
      this.spriteContainer = null;
      this.pixiOptions = null;
      this.options = {
        width: 800,
        height: 600,
        background: '#fafafa',
        wireframeBackground: '#222',
        hasBounds: false,
        enabled: true,
        showAngleIndicator: false,
        showAxes: false,
        showBounds: false,
        showBroadphase: false,
        showCollisions: false,
        showConvexHulls: false,
        showDebug: false,
        showIds: false,
        showInternalEdges: false,
        showMousePosition: false,
        showPositions: false,
        showSeparations: false,
        showShadows: false,
        showSleeping: false,
        showVertexNumbers: false,
        showVelocity: false,
        wireframes: true
      };
      Common.extend(this, options);
      this.transparent = !this.options.wireframes && this.options.background === 'transparent';

      this.stage.addChild(this.primitiveContainer);
      this.stage.addChild(this.spriteContainer);
      this.stage.addChild(this.displayContainer);

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
            lineWidth = part.render.lineWidth,
            fillStyle = Common.colorToNumber(part.render.fillStyle),
            strokeStyle = Common.colorToNumber(part.render.strokeStyle),
            strokeStyleWireframe = Common.colorToNumber('#bbb'),
            styleSettings = {
              alpha: 1,
              lineWidth: lineWidth,
              fillColor: (this.options.wireframes) ? 0 : fillStyle,
              lineColor: (this.options.wireframes) ? strokeStyleWireframe : strokeStyle
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
            _createBodySprite(this, part);
            pGfx = this.sprites[partId];
          }
          pGfx.scale.x = body.render.sprite.xScale || 1;
          pGfx.scale.y = body.render.sprite.yScale || 1;
        } else {
          pGfx = this.primitives[partId];
          // Create it if it doesn't exist in cache
          if (!pGfx) {
            _createBodyPrimitive(this, part);
            pGfx = this.primitives[partId];
          }
          if (part.shape === 'circle') {
            // If it's a circle
            _drawCircle(pGfx, x, y, part.circleRadius, styleSettings);
          } else if (part.shape === 'capsule') {
            // If it's a capsule
            _drawCapsule(pGfx, x, y, 1.6, 40, 10, styleSettings);
          } else if (part.shape === 'convex') {
            // If it's a convex shape
            _drawConvex(pGfx, part, part.vertices, styleSettings);
          }
        }
        pGfx.position.x = part.position.x;
        pGfx.position.y = part.position.y;

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
            pGfx.lineStyle(1, (eye.sensed.type > -1) ? hexStyles[eye.sensed.type] : 0xFFFFFF, 1);
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
          if (this.options.showAxes) {
            if (this.options.wireframes) {
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
            if (this.options.wireframes) {
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
          if (this.options.wireframes) {
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
            textOpts = {font: '10px Arial', fill: '#FFFFFF', align: 'center'};
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
          //partGraphic.arc(pX, pY, 2, 0, 2 * Math.PI, false);
          pGfx.endFill();

          if (this.options.wireframes) {
            pGfx.beginFill(0xB0171F, 0.1);
          } else {
            pGfx.beginFill(0x000000, 0.5);
          }
          pGfx.drawCircle(x, y, 3);
          //partGraphic.arc(x, y, 3, 0, 2 * Math.PI, false);
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
          pGfx.beginFill();
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
      // Clear stage container
      this.stage.removeChildren();
      this.primitiveContainer.removeChildren();
      this.spriteContainer.removeChildren();
      this.displayContainer.removeChildren();

      let bgSprite = this.sprites['bg-0'];

      // Clear caches
      this.textures = {};
      this.sprites = {};
      this.primitives = {};

      // Set background sprite
      this.sprites['bg-0'] = bgSprite;
      if (bgSprite) {
        this.stage.addChildAt(bgSprite, 0);
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
     * @param {pair[]} pairs
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
          if (this.options.wireframes) {
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
        if (this.options.wireframes) {
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

      // render the constraint on every update, since they can change dynamically
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
          textOpts = {font: '10px Arial', fill: '#FFFFFF', align: 'left'};
      if (!dbgTxt) {
        dbgTxt = this.primitives['debug'] = new PIXI.Text('', textOpts);
      }

      var text = "";

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
        if (this.options.wireframes) {
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
      //var c = context;
      //c.fillStyle = 'rgba(255,255,255,0.8)';
      //c.fillText(mouse.position.x + '  ' + mouse.position.y, mouse.position.x + 5, mouse.position.y - 5);
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
     * @param {pair[]} pairs
     */
    separations(pairs) {
      // render separations
      for (let i = 0; i < pairs.length; i++) {
        let pair = pairs[i],
            sepGfx = new PIXI.Graphics();

        sepGfx.clear();
        if (this.options.wireframes) {
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
            let texture = _getTexture(this, background);
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
    stop(render) {
      _cancelAnimationFrame(render.frameRequestId);
    }

    /**
     * Perform world actions
     * @param {number} delta
     */
    world(delta) {
      let allBodies = Composite.allBodies(this.engine.world),
          allConstraints = Composite.allConstraints(this.engine.world),
          constraints = [],
          bodies = [],
          event = {
            timestamp: this.engine.timing.timestamp
          };

      if (this.options.wireframes) {
        this.setBackground(this.options.wireframeBackground);
      } else {
        this.setBackground(this.options.background);
      }

      Events.trigger(this, 'beforeRender', event);
      if (this.options.hasBounds) {
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
            console.log();
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
        this.stage.position.set(-this.bounds.min.x * (1 / boundsScaleX), -this.bounds.min.y * (1 / boundsScaleY));
      } else {
        constraints = allConstraints;
      }

      for (let i = 0; i < bodies.length; i++) {
        this.body(bodies[i]);

        // Body display options
        if (this.options.showIds) {
          this.bodyIds(bodies[i]);
        }
        if (this.options.showBounds) {
          this.bodyBounds(bodies[i]);
        }
        if (this.options.showAxes || this.options.showAngleIndicator) {
          this.bodyAxes(bodies[i]);
        }
        if (this.options.showPositions) {
          this.bodyPositions(bodies[i]);
        }
        if (this.options.showVelocity) {
          this.bodyVelocity(bodies[i]);
        }
        if (this.options.showVertexNumbers) {
          this.vertexNumbers(bodies[i]);
        }
      }

      for (let i = 0; i < constraints.length; i++) {
        this.constraint(constraints[i]);
      }

      // Engine display options
      if (this.options.showSeparations) {
        this.separations(this.engine.pairs.list);
      }
      if (this.options.showCollisions) {
        this.collisions(this.engine.pairs.list);
      }
      if (this.options.showMousePosition) {
        this.mousePosition(this.mouse);
      }
      if (this.options.showBroadphase) {
        this.grid();
      }
      if (this.options.showDebug) {
        this.debug();
      }
      if (this.options.hasBounds) {
        this.context.setTransform(this.options.pixelRatio, 0, 0, this.options.pixelRatio, 0, 0);
      }
      this.renderer.render(this.stage);

      Events.trigger(this, 'afterRender', event);
    }

    /*
     *  Properties Documentation
     */

  }

  /* Private Functions */

  /**
   * Creates a body sprite
   * @method _createBodySprite
   * @private
   * @param {MatterPixi} render
   * @param {Matter.Body} body
   * @return {PIXI.Sprite} sprite
   */
  let _createBodySprite = function(render, body) {
        // handle compound parts
        for (let k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
          let part = body.parts[k],
              partRender = part.render,
              texturePath = partRender.sprite.texture,
              texture = _getTexture(render, texturePath),
              pGfx = new PIXI.Sprite(texture);
          pGfx.anchor.x = body.render.sprite.xOffset;
          pGfx.anchor.y = body.render.sprite.yOffset;
          pGfx.scale.x = body.render.sprite.xScale || 1;
          pGfx.scale.y = body.render.sprite.yScale || 1;
          render.sprites['b-' + part.id] = pGfx;

          // Add to scene graph if not already there
          if (Common.indexOf(render.spriteContainer.children, pGfx) === -1) {
            render.spriteContainer.addChild(pGfx);
          }
        }
      },

      /**
       * Creates a body primitive
       * @method _createBodyPrimitive
       * @private
       * @param {MatterPixi} render
       * @param {Matter.Body} body
       * @return {PIXI.Graphics} graphics
       */
      _createBodyPrimitive = function(render, body) {
        for (let k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
          let part = body.parts[k],
              pGfx = new PIXI.Graphics();
          pGfx.initialAngle = part.angle;
          render.primitives['b-' + part.id] = pGfx;

          // Add to scene graph if not already there
          if (Common.indexOf(render.primitiveContainer.children, pGfx) === -1) {
            render.primitiveContainer.addChild(pGfx);
          }
        }
      },

      /**
       * Gets the requested texture (a PIXI.Texture) via its path
       * @method _getTexture
       * @private
       * @param {MatterPixi} render
       * @param {string} imagePath
       * @return {PIXI.Texture} texture
       */
      _getTexture = function(render, imagePath) {
        let texture = render.textures[imagePath];
        if (!texture) {
          texture = render.textures[imagePath] = PIXI.Texture.fromImage(imagePath);
        }
        return texture;
      },

      /**
       * Gets the pixel ratio of the canvas.
       * @method _getPixelRatio
       * @private
       * @param {HTMLElement} canvas
       * @return {Number} pixel ratio
       */
      _getPixelRatio = function(canvas) {
        let context = canvas.getContext('2d'),
            devicePixelRatio = window.devicePixelRatio || 1,
            backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio
                || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio
                || context.backingStorePixelRatio || 1;

        return devicePixelRatio / backingStorePixelRatio;
      },

      /**
       * Draws a circle onto a PIXI.Graphics object
       * -Borrowed from https://github.com/TomWHall/p2Pixi
       * @param  {PIXI.Graphics} pGfx
       * @param  {Number} x
       * @param  {Number} y
       * @param  {Number} radius
       * @param  {object} style
       */
      _drawCircle = function(pGfx, x, y, radius, style) {
        style = style || {};
        var lineWidth = style.lineWidthUnits ? style.lineWidthUnits * this.pixelsPerLengthUnit : style.lineWidth || 0,
            lineColor = style.lineColor || 0x000000,
            fillColor = style.fillColor;
        pGfx.lineStyle(lineWidth, lineColor, 1);
        if (fillColor) {
          pGfx.beginFill(fillColor, 1);
        }
        pGfx.drawCircle(x, y, radius);
        if (fillColor) {
          pGfx.endFill();
        }
      },

      /**
       * Draws a finite plane onto a PIXI.Graphics object
       * -Borrowed from https://github.com/TomWHall/p2Pixi
       * @param  {PIXI.Graphics} pGfx
       * @param  {Number} x0
       * @param  {Number} x1
       * @param  {Number} color
       * @param  {object} style
       */
      _drawPlane = function(pGfx, x0, x1, color, style) {
        style = style || {};
        var max = 1e6,
            lineWidth = style.lineWidthUnits ? style.lineWidthUnits * this.pixelsPerLengthUnit : style.lineWidth || 0, lineColor = style.lineColor || 0x000000, fillColor = style.fillColor;
        pGfx.lineStyle(lineWidth, lineColor, 1);
        if (fillColor) {
          pGfx.beginFill(fillColor, 1);
        }
        pGfx.moveTo(-max, 0);
        pGfx.lineTo(max, 0);
        pGfx.lineTo(max, max);
        pGfx.lineTo(-max, max);
        if (fillColor) {
          pGfx.endFill();
        }
        // Draw the actual plane
        pGfx.lineStyle(lineWidth, lineColor);
        pGfx.moveTo(-max, 0);
        pGfx.lineTo(max, 0);
      },

      /**
       * Draws a line onto a PIXI.Graphics object
       * -Borrowed from https://github.com/TomWHall/p2Pixi
       * @param  {PIXI.Graphics} pGfx
       * @param  {Number} len
       * @param  {object} style
       */
      _drawLine = function(pGfx, len, style) {
        style = style || {};
        var lineWidth = style.lineWidthUnits ? style.lineWidthUnits * this.pixelsPerLengthUnit : style.lineWidth || 1, lineColor = style.lineColor || 0x000000;

        pGfx.lineStyle(lineWidth, lineColor, 1);
        pGfx.moveTo(-len / 2, 0);
        pGfx.lineTo(len / 2, 0);
      },

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
      _drawCapsule = function(pGfx, x, y, angle, len, radius, style) {
        style = style || {};
        var c = Math.cos(angle),
            s = Math.sin(angle),
            alpha = style.alpha || 1,
            lineWidth = style.lineWidth || 1,
            lineColor = style.lineColor || 0x000000,
            fillColor = style.fillColor || 0x111111;

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
      },

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
      _drawRectangle = function(pGfx, x, y, w, h, style) {
        style = style || {};
        var alpha = style.alpha || 1,
            lineWidth = style.lineWidth || 0,
            lineColor = style.lineColor || 0x000000,
            fillColor = style.fillColor || 0x000000;
        pGfx.lineStyle(lineWidth, lineColor, alpha);
        if (fillColor) {
          pGfx.beginFill(fillColor, alpha);
        }
        pGfx.drawRect(x - w / 2, y - h / 2, w, h);
        if (fillColor) {
          pGfx.endFill();
        }
      },

      /**
       * Draws a convex polygon onto a PIXI.Graphics object
       * -Borrowed from https://github.com/TomWHall/p2Pixi
       * @param  {PIXI.Graphics} pGfx
       * @param  {Array} vertices
       * @param  {object} style
       */
      _drawConvex = function(pGfx, body, vertices, style) {
        style = style || {};
        var alpha = style.alpha || 1,
            lineWidth = style.lineWidth || 0,
            lineColor = style.lineColor || 0x000000,
            fillColor = style.fillColor || 0x000000;

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
            pGfx.moveTo(vertices[(j + 1) % vertices.length].x, vertices[(j + 1) % vertices.length].y);
          }
        }
        if (fillColor) {
          pGfx.endFill();
        }
        if (vertices.length > 2 && lineWidth !== 0) {
          pGfx.moveTo(vertices[vertices.length - 1][0], vertices[vertices.length - 1][1]);
          pGfx.lineTo(vertices[0][0], vertices[0][1]);
        }
      },

      /**
       * Draws a path onto a PIXI.Graphics object
       * -Borrowed from https://github.com/TomWHall/p2Pixi
       * @param  {PIXI.Graphics} pGfx
       * @param  {Array} path
       * @param  {object} style
       */
      _drawPath = function(pGfx, path, style) {
        style || {};
        let alpha = style.alpha || 1,
            lineWidth = style.lineWidth || 0,
            lineColor = style.lineColor || 0x000000,
            fillColor = style.fillColor || 0x000000,
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
      };
  global.MatterPixi = MatterPixi;

}(this));
