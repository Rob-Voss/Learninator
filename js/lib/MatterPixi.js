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
        let part = body.parts[k],
            partId = 'b-' + part.id,
            partGraphic,
            lineWidth = part.render.lineWidth,
            fillStyle = Common.colorToNumber(part.render.fillStyle),
            strokeStyle = Common.colorToNumber(part.render.strokeStyle),
            strokeStyleWireframe = Common.colorToNumber('#bbb');
        if (!part.render.visible) {
          continue;
        }
        if (part.render.sprite && part.render.sprite.texture) {
          partGraphic = this.sprites[partId];
          // Create it if it doesn't exist in cache
          if (!partGraphic) {
            _createBodySprite(this, part);
            partGraphic = this.sprites[partId];
          }
          partGraphic.scale.x = body.render.sprite.xScale || 1;
          partGraphic.scale.y = body.render.sprite.yScale || 1;
        } else {
          partGraphic = this.primitives[partId];
          // Create it if it doesn't exist in cache
          if (!partGraphic) {
            _createBodyPrimitive(this, part);
            partGraphic = this.primitives[partId];
          }

          partGraphic.clear();
          if (!this.options.wireframes) {
            partGraphic.beginFill(fillStyle, 1);
            partGraphic.lineStyle(lineWidth, strokeStyle, 1);
          } else {
            partGraphic.beginFill(0, 0);
            partGraphic.lineStyle(lineWidth, strokeStyleWireframe, 1);
          }

          if (part.circleRadius) {
            // If it's a circle
            partGraphic.drawCircle(part.position.x - body.position.x, part.position.y - body.position.y, part.circleRadius);
          } else {
            // Or if it's a polygon
            partGraphic.moveTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);
            for (let j = 1; j < part.vertices.length; j++) {
              if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                partGraphic.lineTo(part.vertices[j].x - body.position.x, part.vertices[j].y - body.position.y);
              } else {
                partGraphic.moveTo(part.vertices[j].x - body.position.x, part.vertices[j].y - body.position.y);
              }

              if (part.vertices[j].isInternal && !showInternalEdges) {
                partGraphic.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
              }
            }
          }
          partGraphic.endFill();
        }
        partGraphic.position.x = part.position.x;
        partGraphic.position.y = part.position.y;

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
            partGraphic.lineStyle(1, (eye.sensed.type > -1) ? hexStyles[eye.sensed.type] : 0xFFFFFF, 1);
            partGraphic.beginFill();
            partGraphic.moveTo(eye.v1.x, eye.v1.y);
            partGraphic.lineTo(eye.v2.x, eye.v2.y);
            partGraphic.endFill();
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
        let partGraphic,
            part = parts[j],
            partId = 'b-' + part.id,
            strokeStyleIndicator = Common.colorToNumber('#FF3333'),
            strokeStyleWireframeIndicator = Common.colorToNumber('#CD5C5C');

        if (part.render.sprite && part.render.sprite.texture) {
          partGraphic = this.sprites[partId];
        } else {
          partGraphic = this.primitives[partId];
        }
        if (partGraphic) {
          if (this.options.showAxes) {
            if (this.options.wireframes) {
              partGraphic.lineStyle(1, strokeStyleWireframeIndicator, 0.7);
            } else {
              partGraphic.lineStyle(1, strokeStyleIndicator, 1);
            }
            partGraphic.beginFill();
            // Render all axes
            for (let k = 0; k < part.axes.length; k++) {
              let axis = part.axes[k],
                  x = part.position.x - body.position.x,
                  y = part.position.y - body.position.y,
                  tX = x + axis.x * 20,
                  tY = y + axis.y * 20;
              partGraphic.moveTo(x, y);
              partGraphic.lineTo(tX, tY);
            }
            partGraphic.endFill();
          } else {
            if (this.options.wireframes) {
              partGraphic.lineStyle(1, strokeStyleWireframeIndicator, 1);
            } else {
              partGraphic.lineStyle(1, strokeStyleIndicator);
            }
            partGraphic.beginFill();
            for (let k = 0; k < part.axes.length; k++) {
              // render a single axis indicator
              let x = part.position.x - body.position.x,
                  y = part.position.y - body.position.y,
                  tX = ((x + part.vertices[part.vertices.length - 1].x - body.position.x) / 2),
                  tY = ((y + part.vertices[part.vertices.length - 1].y - body.position.y) / 2);
              partGraphic.moveTo(x, y);
              partGraphic.lineTo(tX, tY);
            }
            partGraphic.endFill();
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
        let partGraphic,
            part = parts[j],
            partId = 'b-' + part.id;
        if (part.render.sprite && part.render.sprite.texture) {
          partGraphic = this.sprites[partId];
        } else {
          partGraphic = this.primitives[partId];
        }
        if (partGraphic) {
          if (this.options.wireframes) {
            partGraphic.lineStyle(1, Common.colorToNumber('rgba(255,255,255)'), 0.8);
          } else {
            partGraphic.lineStyle(1, Common.colorToNumber('rgba(0,0,0)'), 0.8);
          }
          partGraphic.beginFill(0, 0);
          partGraphic.drawRect(
              body.position.x - body.bounds.max.x,
              body.position.y - body.bounds.max.y,
              body.bounds.max.x - body.bounds.min.x,
              body.bounds.max.y - body.bounds.min.y
          );
          partGraphic.endFill();
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
        let partGraphic,
            part = parts[j],
            partId = 'b-' + part.id,
            textOpts = {font: '10px Arial', fill: '#FFFFFF', align: 'center'};
        if (part.render.sprite && part.render.sprite.texture) {
          partGraphic = this.sprites[partId];
        } else {
          partGraphic = this.primitives[partId];
        }
        if (partGraphic) {
          partGraphic.removeChildren();
          partGraphic.addChild(new PIXI.Text(body.id, textOpts));
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
        let partGraphic,
            part = parts[j],
            partId = 'b-' + part.id,
            x = part.position.x - body.position.x,
            y = part.position.y - body.position.y,
            pX = part.positionPrev.x - body.position.x,
            pY = part.positionPrev.y - body.position.y;
        if (part.render.sprite && part.render.sprite.texture) {
          partGraphic = this.sprites[partId];
        } else {
          partGraphic = this.primitives[partId];
        }
        if (partGraphic) {
          partGraphic.beginFill(Common.colorToNumber('rgba(255,165,0)'), 0.8);
          partGraphic.drawCircle(pX, pY, 2);
          //partGraphic.arc(pX, pY, 2, 0, 2 * Math.PI, false);
          partGraphic.endFill();

          if (this.options.wireframes) {
            partGraphic.beginFill(0xB0171F, 0.1);
          } else {
            partGraphic.beginFill(0x000000, 0.5);
          }
          partGraphic.drawCircle(x, y, 3);
          //partGraphic.arc(x, y, 3, 0, 2 * Math.PI, false);
          partGraphic.endFill();
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
        let partGraphic,
            part = parts[j],
            partId = 'b-' + part.id;
        if (part.render.sprite && part.render.sprite.texture) {
          partGraphic = this.sprites[partId];
        } else {
          partGraphic = this.primitives[partId];
        }
        if (partGraphic) {
          let x = part.position.x - body.position.x,
              y = part.position.y - body.position.y,
              px = x + (part.positionPrev.x - body.position.x),
              py = y + (part.positionPrev.y - body.position.y);
          partGraphic.lineStyle(1, 0x6495ED, 1);
          partGraphic.beginFill();
          partGraphic.moveTo(x, y);
          partGraphic.lineTo(px * 2, py * 2);
          partGraphic.endFill();
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
              c = new PIXI.Graphics();

          c.clear();
          if (this.options.wireframes) {
            c.beginFill(0xFFFFFF, 0.7);
          } else {
            c.beginFill(0xFFA500, 1);
          }
          c.drawRect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
          c.endFill();
          this.displayContainer.addChild(c);
        }
      }

      // render collision normals
      for (let i = 0; i < pairs.length; i++) {
        let pair = pairs[i],
            collision = pair.collision,
            c = new PIXI.Graphics();

        if (!pair.isActive) {
          continue;
        }

        c.clear();
        c.beginFill();
        if (this.options.wireframes) {
          c.lineStyle(1, Common.colorToNumber('rgba(255,165,0)'), 0.7);
        } else {
          c.lineStyle(1, 0xFFA500, 1);
        }

        if (pair.activeContacts.length > 0) {
          let normalPosX = pair.activeContacts[0].vertex.x,
              normalPosY = pair.activeContacts[0].vertex.y;

          if (pair.activeContacts.length === 2) {
            normalPosX = (pair.activeContacts[0].vertex.x + pair.activeContacts[1].vertex.x) / 2;
            normalPosY = (pair.activeContacts[0].vertex.y + pair.activeContacts[1].vertex.y) / 2;
          }

          if (collision.bodyB === collision.supports[0].body || collision.bodyA.isStatic === true) {
            c.moveTo(normalPosX - collision.normal.x * 8, normalPosY - collision.normal.y * 8);
          } else {
            c.moveTo(normalPosX + collision.normal.x * 8, normalPosY + collision.normal.y * 8);
          }

          c.lineTo(normalPosX, normalPosY);
        }
        c.endFill();
        this.displayContainer.addChild(c);
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
          partGraphic = this.primitives[partId];

      // initialise constraint primitive if not existing
      if (!partGraphic) {
        partGraphic = this.primitives[partId] = new PIXI.Graphics();
      }
      // don't render if constraint does not have two end points
      if (!constraintRender.visible || !constraint.pointA || !constraint.pointB) {
        partGraphic.clear();
        return;
      }

      // render the constraint on every update, since they can change dynamically
      partGraphic.clear();
      partGraphic.beginFill(0, 0);
      partGraphic.lineStyle(constraintRender.lineWidth, Common.colorToNumber(constraintRender.strokeStyle), 1);
      if (bodyA) {
        partGraphic.moveTo(bodyA.position.x + pointA.x, bodyA.position.y + pointA.y);
      } else {
        partGraphic.moveTo(pointA.x, pointA.y);
      }
      if (bodyB) {
        partGraphic.lineTo(bodyB.position.x + pointB.x, bodyB.position.y + pointB.y);
      } else {
        partGraphic.lineTo(pointB.x, pointB.y);
      }
      partGraphic.endFill();

      this.displayContainer.addChild(partGraphic);
    }

    /**
     * Description
     * @private
     * @method debug
     */
    debug() {
      let c = this.primitives['debug'],
          engine = this.engine,
          world = this.engine.world,
          metrics = this.engine.metrics,
          bodies = Composite.allBodies(world),
          space = "    \n",
          textOpts = {font: '10px Arial', fill: '#FFFFFF', align: 'left'};
      if (!c) {
        c = this.primitives['debug'] = new PIXI.Text('', textOpts);
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
      c.text = text;
      c.debugString = text;
      c.debugTimestamp = engine.timing.timestamp;
      c.position.set(10, 10);

      this.displayContainer.addChild(c);
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
            c = new PIXI.Graphics(),
            region = bucketId.split(',');

        if (grid.buckets[bucketId].length < 2) {
          continue;
        }
        if (this.options.wireframes) {
          c.beginFill(Common.colorToNumber('rgba(255,180,0)'), 0.1);
        } else {
          c.beginFill(Common.colorToNumber('rgba(255,180,0)'), 0.5);
        }
        c.drawRect(
            0.5 + parseInt(region[0], 10) * grid.bucketWidth,
            0.5 + parseInt(region[1], 10) * grid.bucketHeight,
            grid.bucketWidth,
            grid.bucketHeight);
        c.endFill();

        this.displayContainer.addChild(c);
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
            c = new PIXI.Graphics();

        c.clear();
        if (this.options.wireframes) {
          c.beginFill(Common.colorToNumber('rgba(255,165,0)'), 0.5);
        } else {
          c.beginFill(0xFFA500, 1);
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

        c.moveTo(bodyB.position.x, bodyB.position.y);
        c.lineTo(bodyB.position.x - collision.penetration.x * k, bodyB.position.y - collision.penetration.y * k);

        k = 1;

        if (!bodyB.isStatic && !bodyA.isStatic) {
          k = 0.5;
        }
        if (bodyA.isStatic) {
          k = 0;
        }

        c.moveTo(bodyA.position.x, bodyA.position.y);
        c.lineTo(bodyA.position.x + collision.penetration.x * k, bodyA.position.y + collision.penetration.y * k);
        c.endFill();
        this.displayContainer.addChild(c);
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
              partGraphic = new PIXI.Sprite(texture);
          partGraphic.anchor.x = body.render.sprite.xOffset;
          partGraphic.anchor.y = body.render.sprite.yOffset;
          partGraphic.scale.x = body.render.sprite.xScale || 1;
          partGraphic.scale.y = body.render.sprite.yScale || 1;
          render.sprites['b-' + part.id] = partGraphic;

          // Add to scene graph if not already there
          if (Common.indexOf(render.spriteContainer.children, partGraphic) === -1) {
            render.spriteContainer.addChild(partGraphic);
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
              partGraphic = new PIXI.Graphics(),
              lineWidth = part.render.lineWidth,
              fillStyle = Common.colorToNumber(part.render.fillStyle),
              strokeStyle = Common.colorToNumber(part.render.strokeStyle),
              strokeStyleWireframe = Common.colorToNumber('#bbb');
          partGraphic.initialAngle = part.angle;

          partGraphic.clear();
          if (!render.options.wireframes) {
            partGraphic.beginFill(fillStyle, 1);
            partGraphic.lineStyle(lineWidth, strokeStyle, 1);
          } else {
            partGraphic.beginFill(0, 0);
            partGraphic.lineStyle(lineWidth, strokeStyleWireframe, 1);
          }
          // part polygon
          if (part.circleRadius) {
            partGraphic.drawCircle(part.position.x - body.position.x, part.position.y - body.position.y, part.circleRadius);
          } else {
            partGraphic.moveTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);
            for (let j = 1; j < part.vertices.length; j++) {
              if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                partGraphic.lineTo(part.vertices[j].x - body.position.x, part.vertices[j].y - body.position.y);
              } else {
                partGraphic.moveTo(part.vertices[j].x - body.position.x, part.vertices[j].y - body.position.y);
              }
              if (part.vertices[j].isInternal && !showInternalEdges) {
                partGraphic.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
              }
            }
          }
          partGraphic.endFill();

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
              partGraphic.lineStyle(1, (eye.sensed.type > -1) ? hexStyles[eye.sensed.type] : 0xFFFFFF, 1);
              partGraphic.beginFill();
              partGraphic.moveTo(eye.v1.x, eye.v1.y);
              partGraphic.lineTo(eye.v2.x, eye.v2.y);
              partGraphic.endFill();
            }
          }
          render.primitives['b-' + part.id] = partGraphic;

          // Add to scene graph if not already there
          if (Common.indexOf(render.primitiveContainer.children, partGraphic) === -1) {
            render.primitiveContainer.addChild(partGraphic);
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
       * @param  {PIXI.Graphics} graphics
       * @param  {Number} x
       * @param  {Number} y
       * @param  {Number} radius
       * @param  {object} style
       */
      _drawCircle = function(graphics, x, y, radius, style) {
        style = style || {};
        var lineWidth = style.lineWidthUnits ? style.lineWidthUnits * this.pixelsPerLengthUnit : style.lineWidth || 0,
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
      },

      /**
       * Draws a finite plane onto a PIXI.Graphics object
       * @param  {PIXI.Graphics} graphics
       * @param  {Number} x0
       * @param  {Number} x1
       * @param  {Number} color
       * @param  {object} style
       */
      _drawPlane = function(graphics, x0, x1, color, style) {
        style = style || {};
        var max = 1e6,
            lineWidth = style.lineWidthUnits ? style.lineWidthUnits * this.pixelsPerLengthUnit : style.lineWidth || 0, lineColor = style.lineColor || 0x000000, fillColor = style.fillColor;

        graphics.lineStyle(lineWidth, lineColor, 1);
        if (fillColor) {
          graphics.beginFill(fillColor, 1);
        }

        graphics.moveTo(-max, 0);
        graphics.lineTo(max, 0);
        graphics.lineTo(max, max);
        graphics.lineTo(-max, max);
        if (fillColor) {
          graphics.endFill();
        }

        // Draw the actual plane
        graphics.lineStyle(lineWidth, lineColor);
        graphics.moveTo(-max, 0);
        graphics.lineTo(max, 0);
      },

      /**
       * Draws a line onto a PIXI.Graphics object
       * @param  {PIXI.Graphics} graphics
       * @param  {Number} len
       * @param  {object} style
       */
      _drawLine = function(graphics, len, style) {
        style = style || {};
        var lineWidth = style.lineWidthUnits ? style.lineWidthUnits * this.pixelsPerLengthUnit : style.lineWidth || 1, lineColor = style.lineColor || 0x000000;

        graphics.lineStyle(lineWidth, lineColor, 1);
        graphics.moveTo(-len / 2, 0);
        graphics.lineTo(len / 2, 0);
      },

      /**
       * Draws a capsule onto a PIXI.Graphics object
       * @param  {PIXI.Graphics} graphics
       * @param  {Number} x
       * @param  {Number} y
       * @param  {Number} angle
       * @param  {Number} len
       * @param  {Number} radius
       * @param  {object} style
       */
      _drawCapsule = function(graphics, x, y, angle, len, radius, style) {
        style = style || {};
        var c = Math.cos(angle),
            s = Math.sin(angle),
            lineWidth = style.lineWidth || 1,
            lineColor = style.lineColor || 0x000000,
            fillColor = style.fillColor || 0x111111;

        // Draw circles at ends
        graphics.lineStyle(lineWidth, 0x000000, 1);
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
      },

      /**
       * Draws a box onto a PIXI.Graphics object
       * @param  {PIXI.Graphics} graphics
       * @param  {Number} x
       * @param  {Number} y
       * @param  {Number} w
       * @param  {Number} h
       * @param  {object} style
       */
      _drawRectangle = function(graphics, x, y, w, h, style) {
        style = style || {};
        var lineWidth = style.lineWidth || 0,
            lineColor = style.lineColor || 0x000000,
            fillColor = style.fillColor || 0x000000;

        graphics.lineStyle(lineWidth, lineColor, 1);
        if (fillColor) {
          graphics.beginFill(fillColor, 1);
        }

        graphics.drawRect(x - w / 2, y - h / 2, w, h);
        if (fillColor) {
          graphics.endFill();
        }
      },

      /**
       * Draws a convex polygon onto a PIXI.Graphics object
       * @param  {PIXI.Graphics} graphics
       * @param  {Array} vertices
       * @param  {object} style
       */
      _drawConvex = function(graphics, vertices, style) {
        style = style || {};
        var lineWidth = style.lineWidthUnits ? style.lineWidthUnits * this.pixelsPerLengthUnit : style.lineWidth || 0, lineColor = style.lineColor || 0x000000, fillColor = style.fillColor;

        graphics.lineStyle(lineWidth, lineColor, 1);
        if (fillColor) {
          graphics.beginFill(fillColor, 1);
        }

        for (var i = 0; i !== vertices.length; i++) {
          var v = vertices[i],
              x = v[0],
              y = v[1];
          if (i == 0) {
            graphics.moveTo(x, y);
          } else {
            graphics.lineTo(x, y);
          }
        }

        if (fillColor) {
          graphics.endFill();
        }

        if (vertices.length > 2 && lineWidth !== 0) {
          graphics.moveTo(vertices[vertices.length - 1][0], vertices[vertices.length - 1][1]);
          graphics.lineTo(vertices[0][0], vertices[0][1]);
        }
      },

      /**
       * Draws a path onto a PIXI.Graphics object
       * @param  {PIXI.Graphics} graphics
       * @param  {Array} path
       * @param  {object} style
       */
      _drawPath = function(graphics, path, style) {
        var style = style || {}, lineWidth = style.lineWidthUnits ? style.lineWidthUnits * this.pixelsPerLengthUnit : style.lineWidth || 0, lineColor = style.lineColor || 0x000000, fillColor = style.fillColor;

        graphics.lineStyle(lineWidth, lineColor, 1);
        if (fillColor) {
          graphics.beginFill(fillColor, 1);
        }

        var lastx = null,
            lasty = null;
        for (var i = 0; i < path.length; i++) {
          var v = path[i],
              x = v[0],
              y = v[1];

          if (x !== lastx || y !== lasty) {
            if (i === 0) {
              graphics.moveTo(x, y);
            } else {
              // Check if the lines are parallel
              var p1x = lastx,
                  p1y = lasty,
                  p2x = x,
                  p2y = y,
                  p3x = path[(i + 1) % path.length][0],
                  p3y = path[(i + 1) % path.length][1];
              var area = ((p2x - p1x) * (p3y - p1y)) - ((p3x - p1x) * (p2y - p1y));
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
      };
  global.MatterPixi = MatterPixi;

}(this));
