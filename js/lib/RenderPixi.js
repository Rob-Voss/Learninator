(function(global) {
  "use strict";

  // Matter aliases
  const Engine = Matter.Engine,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Bounds = Matter.Bounds,
      Composite = Matter.Composite,
      Composites = Matter.Composites,
      Common = Matter.Common,
      Constraint = Matter.Constraint,
      Events = Matter.Events,
      Grid = Matter.Grid,
      MouseConstraint = Matter.MouseConstraint,
      Mouse = Matter.Mouse,
      Pairs = Matter.Pairs,
      Query = Matter.Query,
      Runner = Matter.Runner,
      Svg = Matter.Svg,
      Vector = Matter.Vector,
      Vertices = Matter.Vertices,

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
   * The `Matter.RenderPixi` module is a renderer using pixi.js.
   * See also `Matter.Render` for a canvas based renderer.
   *
   * @class RenderPixi
   */
  class RenderPixi {

    /**
     * Creates a new Pixi.js WebGL renderer
     * @method create
     * @param {object} options
     * @return {RenderPixi} A new renderer
     */
    constructor(options) {
      this.controller = RenderPixi;
      this.engine = null;
      this.element = null;
      this.canvas = null;
      this.renderer = null;
      this.container = null;
      this.spriteContainer = null;
      this.pixiOptions = null;
      this.options = {
        width: 800,
        height: 600,
        background: '#fafafa',
        wireframeBackground: '#222',
        hasBounds: false,
        enabled: true,
        wireframes: true,
        showSleeping: true,
        showDebug: false,
        showBroadphase: false,
        showBounds: false,
        showVelocity: false,
        showCollisions: false,
        showAxes: false,
        showPositions: false,
        showAngleIndicator: false,
        showIds: false,
        showShadows: false
      };
      Common.extend(this, options);

      this.transparent = !this.options.wireframes && this.options.background === 'transparent';
      this.pixiOptions = this.pixiOptions || {
            view: this.canvas,
            transparent: this.transparent,
            antialias: true,
            backgroundColor: this.options.background
          };

      this.renderer = this.renderer || new PIXI.autoDetectRenderer(this.options.width, this.options.height, this.pixiOptions);
      this.container = this.container || new PIXI.Container();
      this.canvas = this.renderer.view;
      this.context = this.canvas.getContext('2d');
      this.bounds = this.bounds || {
            min: {
              x: 0,
              y: 0
            },
            max: {
              x: this.options.width,
              y: this.options.height
            }
          };

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

      // Prevent menus on canvas
      this.canvas.oncontextmenu = function() {
        return false;
      };
      this.canvas.onselectstart = function() {
        return false;
      };

      return this;
    }

    /**
     * Description
     * @method body
     * @param {Matter.Body} body
     */
    body(body) {
      if (!body.render.visible) {
        return;
      }

      // Grab the main graphic element out of cache
      let mainGraphic,
          mainId = 'b-' + body.id,
          parts = body.parts,
          fillStyle = Common.colorToNumber(body.render.fillStyle),
          strokeStyle = Common.colorToNumber(body.render.strokeStyle),
          strokeStyleWireframe = Common.colorToNumber('#bbb');
      if (body.render.sprite && body.render.sprite.texture) {
        mainGraphic = this.sprites[mainId];

        if (!mainGraphic) {
          mainGraphic = this.sprites[mainId] = _createBodySprite(this, body);
        }
        mainGraphic.scale.x = body.render.sprite.xScale || 1;
        mainGraphic.scale.y = body.render.sprite.yScale || 1;
      } else {
        mainGraphic = this.primitives[mainId];

        if (!mainGraphic) {
          mainGraphic = this.primitives[mainId] = _createBodyPrimitive(this, body);
        }
      }

      if (mainGraphic) {
        mainGraphic.position.x = body.position.x;
        mainGraphic.position.y = body.position.y;
        mainGraphic.rotation = body.angle - mainGraphic.initialAngle;

        // Loop through all the parts
        for (let k = parts.length > 1 ? 1 : 0; k < parts.length; k++) {
          let part = parts[k],
              partId = 'b-' + part.id,
              partGraphic;
          if (!part.render.visible) {
            continue;
          }
          if (part.render.sprite && part.render.sprite.texture) {
            partGraphic = this.sprites[partId];

            // initialise body sprite if not existing
            if (!partGraphic) {
              partGraphic = this.sprites[partId] = _createBodySprite(this, part);
            }
            partGraphic.scale.x = body.render.sprite.xScale || 1;
            partGraphic.scale.y = body.render.sprite.yScale || 1;
          } else {
            partGraphic = this.primitives[partId];

            // Set up body primitive if not existing
            if (!partGraphic) {
              partGraphic = this.primitives[partId] = _createBodyPrimitive(this, part);
            }
          }

          partGraphic.clear();
          if (!this.options.wireframes) {
            partGraphic.beginFill(fillStyle, 1);
            partGraphic.lineStyle(body.render.lineWidth, strokeStyle, 1);
          } else {
            partGraphic.beginFill(0, 0);
            partGraphic.lineStyle(1, strokeStyleWireframe, 1);
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

          if (part.entity.eyes !== undefined) {
            for (let i = 0; i < part.entity.eyes.length; i++) {
              let eye = part.entity.eyes[i],
                  x = mainGraphic.position.x - body.position.x,
                  y = mainGraphic.position.y - body.position.y,
                  eyeStartX = x + part.circleRadius * Math.sin(part.angle + eye.angle),
                  eyeStartY = y + part.circleRadius * Math.cos(part.angle + eye.angle),
                  eyeEndX = x + eye.sensed.proximity * Math.sin(part.angle + eye.angle),
                  eyeEndY = y + eye.sensed.proximity * Math.cos(part.angle + eye.angle);
              eye.v1 = Vector.create(eyeStartX, eyeStartY);
              eye.v2 = Vector.create(eyeEndX, eyeEndY);

              // Draw the agent's line of sights
              eye.graphics.clear();
              eye.graphics.beginFill(0, 0);
              eye.graphics.lineStyle(1, (eye.sensed.type > -1) ? hexStyles[eye.sensed.type] : 0xFFFFFF, 1);
              eye.graphics.moveTo(eye.v1.x, eye.v1.y);
              eye.graphics.lineTo(eye.v2.x, eye.v2.y);
              eye.graphics.endFill();
            }
          }
        }

        // Add to scene graph if not already there
        if (Common.indexOf(this.container.children, mainGraphic) === -1) {
          this.container.addChild(mainGraphic);
        }
      }
    }

    /**
     * Draws body positions
     * @private
     * @method bodyPositions
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    bodyPositions(render, bodies, context) {
      //var c = context,
      //    engine = render.engine,
      //    options = render.options,
      //    body,
      //    part,
      //    i,
      //    k;
      //
      //c.beginPath();
      //
      //// render current positions
      //for (i = 0; i < bodies.length; i++) {
      //  body = bodies[i];
      //
      //  if (!body.render.visible)
      //    continue;
      //
      //  // handle compound parts
      //  for (k = 0; k < body.parts.length; k++) {
      //    part = body.parts[k];
      //    c.arc(part.position.x, part.position.y, 3, 0, 2 * Math.PI, false);
      //    c.closePath();
      //  }
      //}
      //
      //if (options.wireframes) {
      //  c.fillStyle = 'indianred';
      //} else {
      //  c.fillStyle = 'rgba(0,0,0,0.5)';
      //}
      //c.fill();
      //
      //c.beginPath();
      //
      //// render previous positions
      //for (i = 0; i < bodies.length; i++) {
      //  body = bodies[i];
      //  if (body.render.visible) {
      //    c.arc(body.positionPrev.x, body.positionPrev.y, 2, 0, 2 * Math.PI, false);
      //    c.closePath();
      //  }
      //}
      //
      //c.fillStyle = 'rgba(255,165,0,0.8)';
      //c.fill();
    }

    /**
     * Draws body velocity
     * @private
     * @method bodyVelocity
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    bodyVelocity(render, bodies, context) {
      //var c = context;
      //
      //c.beginPath();
      //
      //for (var i = 0; i < bodies.length; i++) {
      //  var body = bodies[i];
      //
      //  if (!body.render.visible)
      //    continue;
      //
      //  c.moveTo(body.position.x, body.position.y);
      //  c.lineTo(body.position.x + (body.position.x - body.positionPrev.x) * 2, body.position.y +
      // (body.position.y - body.positionPrev.y) * 2); }  c.lineWidth = 3; c.strokeStyle = 'cornflowerblue';
      // c.stroke();
    }

    /**
     * Description
     * @private
     * @method collisions
     * @param {render} render
     * @param {pair[]} pairs
     * @param {RenderingContext} context
     */
    collisions(render, pairs, context) {
      //var c = context,
      //    options = render.options,
      //    pair,
      //    collision,
      //    corrected,
      //    bodyA,
      //    bodyB,
      //    i,
      //    j;
      //
      //c.beginPath();
      //
      //// render collision positions
      //for (i = 0; i < pairs.length; i++) {
      //  pair = pairs[i];
      //
      //  if (!pair.isActive)
      //    continue;
      //
      //  collision = pair.collision;
      //  for (j = 0; j < pair.activeContacts.length; j++) {
      //    var contact = pair.activeContacts[j],
      //        vertex = contact.vertex;
      //    c.rect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
      //  }
      //}
      //
      //if (options.wireframes) {
      //  c.fillStyle = 'rgba(255,255,255,0.7)';
      //} else {
      //  c.fillStyle = 'orange';
      //}
      //c.fill();
      //
      //c.beginPath();
      //
      //// render collision normals
      //for (i = 0; i < pairs.length; i++) {
      //  pair = pairs[i];
      //
      //  if (!pair.isActive)
      //    continue;
      //
      //  collision = pair.collision;
      //
      //  if (pair.activeContacts.length > 0) {
      //    var normalPosX = pair.activeContacts[0].vertex.x,
      //        normalPosY = pair.activeContacts[0].vertex.y;
      //
      //    if (pair.activeContacts.length === 2) {
      //      normalPosX = (pair.activeContacts[0].vertex.x + pair.activeContacts[1].vertex.x) / 2;
      //      normalPosY = (pair.activeContacts[0].vertex.y + pair.activeContacts[1].vertex.y) / 2;
      //    }
      //
      //    if (collision.bodyB === collision.supports[0].body || collision.bodyA.isStatic === true) {
      //      c.moveTo(normalPosX - collision.normal.x * 8, normalPosY - collision.normal.y * 8);
      //    } else {
      //      c.moveTo(normalPosX + collision.normal.x * 8, normalPosY + collision.normal.y * 8);
      //    }
      //
      //    c.lineTo(normalPosX, normalPosY);
      //  }
      //}
      //
      //if (options.wireframes) {
      //  c.strokeStyle = 'rgba(255,165,0,0.7)';
      //} else {
      //  c.strokeStyle = 'orange';
      //}
      //
      //c.lineWidth = 1;
      //c.stroke();
    }

    /**
     * Description
     * @private
     * @method separations
     * @param {render} render
     * @param {pair[]} pairs
     * @param {RenderingContext} context
     */
    separations(render, pairs, context) {
      //var c = context,
      //    options = render.options,
      //    pair,
      //    collision,
      //    corrected,
      //    bodyA,
      //    bodyB,
      //    i,
      //    j;
      //
      //c.beginPath();
      //
      //// render separations
      //for (i = 0; i < pairs.length; i++) {
      //  pair = pairs[i];
      //
      //  if (!pair.isActive)
      //    continue;
      //
      //  collision = pair.collision;
      //  bodyA = collision.bodyA;
      //  bodyB = collision.bodyB;
      //
      //  var k = 1;
      //
      //  if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
      //  if (bodyB.isStatic) k = 0;
      //
      //  c.moveTo(bodyB.position.x, bodyB.position.y);
      //  c.lineTo(bodyB.position.x - collision.penetration.x * k, bodyB.position.y - collision.penetration.y * k);
      //
      //  k = 1;
      //
      //  if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
      //  if (bodyA.isStatic) k = 0;
      //
      //  c.moveTo(bodyA.position.x, bodyA.position.y);
      //  c.lineTo(bodyA.position.x + collision.penetration.x * k, bodyA.position.y + collision.penetration.y * k);
      //}
      //
      //if (options.wireframes) {
      //  c.strokeStyle = 'rgba(255,165,0,0.5)';
      //} else {
      //  c.strokeStyle = 'orange';
      //}
      //c.stroke();
    }

    /**
     * Description
     * @private
     * @method grid
     * @param {render} render
     * @param {grid} grid
     * @param {RenderingContext} context
     */
    grid(render, grid, context) {
      //var c = context,
      //    options = render.options;
      //
      //if (options.wireframes) {
      //  c.strokeStyle = 'rgba(255,180,0,0.1)';
      //} else {
      //  c.strokeStyle = 'rgba(255,180,0,0.5)';
      //}
      //
      //c.beginPath();
      //
      //var bucketKeys = Common.keys(grid.buckets);
      //
      //for (var i = 0; i < bucketKeys.length; i++) {
      //  var bucketId = bucketKeys[i];
      //
      //  if (grid.buckets[bucketId].length < 2)
      //    continue;
      //
      //  var region = bucketId.split(',');
      //  c.rect(0.5 + parseInt(region[0], 10) * grid.bucketWidth,
      //      0.5 + parseInt(region[1], 10) * grid.bucketHeight,
      //      grid.bucketWidth,
      //      grid.bucketHeight);
      //}
      //
      //c.lineWidth = 1;
      //c.stroke();
    }

    /**
     * Draws body angle indicators and axes
     * @private
     * @method bodyAxes
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    bodyAxes(body) {
      if (!body.render.visible) {
        return;
      }
      let mainGraphic,
          bodyId = 'b-' + body.id,
          parts = body.parts;

      if (body.render.sprite && body.render.sprite.texture) {
        mainGraphic = this.sprites[bodyId];
      } else {
        mainGraphic = this.primitives[bodyId];
      }

      if (mainGraphic) {
        for (let j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
          let graphic,
              part = body.parts[j],
              primitiveId = 'b-' + body.id,
              strokeStyleIndicator = Common.colorToNumber('#FF3333'),
              strokeStyleWireframeIndicator = Common.colorToNumber('#CD5C5C');

          if (body.render.sprite && body.render.sprite.texture) {
            graphic = this.sprites[primitiveId];
          } else {
            graphic = this.primitives[primitiveId];
          }

          if (graphic) {
            if (!graphic.angleIndicator) {
              graphic.angleIndicator = new PIXI.Graphics();
              mainGraphic.display.addChild(graphic.angleIndicator);
            }
            if (this.options.wireframes) {
              graphic.angleIndicator.lineStyle(1, strokeStyleWireframeIndicator, 1);
            } else {
              graphic.angleIndicator.lineStyle(1, strokeStyleIndicator);
            }
            graphic.angleIndicator.clear();
            graphic.angleIndicator.beginFill(0, 0);
            if (this.options.showAxes) {
              // render all axes
              for (let k = 0; k < part.axes.length; k++) {
                let axis = part.axes[k];
                graphic.angleIndicator.moveTo(part.position.x - body.position.x, part.position.y - body.position.y);
                graphic.angleIndicator.lineTo(part.position.x + axis.x * 20, part.position.y + axis.y * 20);
              }
            } else {
              for (let k = 0; k < part.axes.length; k++) {
                // render a single axis indicator
                graphic.angleIndicator.moveTo(part.position.x - body.position.x, part.position.y - body.position.y);
                graphic.angleIndicator.lineTo(((part.vertices[0].x + part.vertices[part.vertices.length - 1].x) / 2 - body.position.x),
                    ((part.vertices[0].y + part.vertices[part.vertices.length - 1].y) / 2 - body.position.y));
              }
            }
            graphic.angleIndicator.endFill();
          }
        }
      }
    }

    /**
     * Draws body bounds
     * @private
     * @method bodyBounds
     * @param {render} render
     * @param {body[]} bodies
     * @param {RenderingContext} context
     */
    bodyBounds(body) {
      if (!body.render.visible) {
        return;
      }
      let mainGraphic,
          primitiveId = 'b-' + body.id,
          parts = body.parts;

      if (body.render.sprite && body.render.sprite.texture) {
        mainGraphic = this.sprites[primitiveId];
      } else {
        mainGraphic = this.primitives[primitiveId];
      }

      if (mainGraphic) {
        for (let j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
          let graphic, strokeStyle,
              part = parts[j],
              partId = 'b-' + part.id;
          if (part.render.sprite && part.render.sprite.texture) {
            graphic = this.sprites[partId];
          } else {
            graphic = this.primitives[partId];
          }
          if (graphic) {
            if (!graphic.boundsBox) {
              graphic.boundsBox = new PIXI.Graphics();
              mainGraphic.display.addChild(graphic.boundsBox);
            }

            if (this.options.wireframes) {
              strokeStyle = 'rgba(255,255,255,0.08)';
            } else {
              strokeStyle = 'rgba(0,0,0,0.1)';
            }
            graphic.boundsBox.clear();
            graphic.boundsBox.beginFill(0, 0);
            graphic.boundsBox.lineStyle(1, Common.colorToNumber(strokeStyle), 1);
            graphic.boundsBox.drawRect(
                body.position.x - body.bounds.max.x,
                body.position.y - body.bounds.max.y,
                body.bounds.max.x - body.bounds.min.x,
                body.bounds.max.y - body.bounds.min.y
            );
            graphic.boundsBox.endFill();
          }
        }
      }
    }

    /**
     * Display the body ids
     * @param body
     */
    bodyIds(body) {
      if (!body.render.visible) {
        return;
      }
      let graphic,
          primitiveId = 'b-' + body.id,
          part = body.parts[0],
          x = part.position.x - body.position.x,
          y = part.position.y - body.position.y,
          textOpts = {font: '10px Arial', fill: '#000000', align: 'center'};

      if (body.render.sprite && body.render.sprite.texture) {
        graphic = this.sprites[primitiveId];
      } else {
        graphic = this.primitives[primitiveId];
      }

      if (graphic) {
        if (!graphic.idText) {
          graphic.idText = new PIXI.Text(body.id, textOpts);
        }
        graphic.idText.position.set(x, y);
        graphic.display.addChild(graphic.idText);
      }
    }

    /**
     * Clears the scene graph
     * @method clear
     */
    clear() {
      // Clear stage container
      this.container.removeChildren();

      let bgSprite = this.sprites['bg-0'];

      // Clear caches
      this.textures = {};
      this.sprites = {};
      this.primitives = {};

      // Set background sprite
      this.sprites['bg-0'] = bgSprite;
      if (bgSprite) {
        this.container.addChildAt(bgSprite, 0);
      }

      // Reset background state
      this.currentBackground = null;

      // Reset bounds transforms
      this.container.scale.set(1, 1);
      this.container.position.set(0, 0);
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
          primitiveId = 'c-' + constraint.id,
          primitive = this.primitives[primitiveId];

      // initialise constraint primitive if not existing
      if (!primitive) {
        primitive = this.primitives[primitiveId] = new PIXI.Graphics();
      }
      // don't render if constraint does not have two end points
      if (!constraintRender.visible || !constraint.pointA || !constraint.pointB) {
        primitive.clear();
        return;
      }

      // add to scene graph if not already there
      if (Common.indexOf(this.container.children, primitive) === -1) {
        this.container.addChild(primitive);
      }
      // render the constraint on every update, since they can change dynamically
      primitive.clear();
      primitive.beginFill(0, 0);
      primitive.lineStyle(constraintRender.lineWidth, Common.colorToNumber(constraintRender.strokeStyle), 1);

      if (bodyA) {
        primitive.moveTo(bodyA.position.x + pointA.x, bodyA.position.y + pointA.y);
      } else {
        primitive.moveTo(pointA.x, pointA.y);
      }

      if (bodyB) {
        primitive.lineTo(bodyB.position.x + pointB.x, bodyB.position.y + pointB.y);
      } else {
        primitive.lineTo(pointB.x, pointB.y);
      }

      primitive.endFill();
    }

    /**
     * Remove a body from the world and display container
     * @param {Matter.Body} body
     */
    removeBody(body) {
      let id = 'b-' + body.id,
          primitive = this.primitives[id],
          idx = this.container.getChildIndex(primitive);
      this.container.removeChildAt(idx);
      delete this.primitives[id];
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
            this.container.removeChild(bgSprite);
          }
        } else {
          // initialise background sprite if needed
          if (!bgSprite) {
            let texture = _getTexture(this, background);

            bgSprite = this.sprites['bg-0'] = new PIXI.Sprite(texture);
            bgSprite.position.x = 0;
            bgSprite.position.y = 0;
            this.container.addChildAt(bgSprite, 0);
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
     * Description
     * @method world
     */
    world(time) {
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
            boundsScaleX = boundsWidth / this.options.width,
            boundsScaleY = boundsHeight / this.options.height;

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
        this.container.scale.set(1 / boundsScaleX, 1 / boundsScaleY);
        this.container.position.set(-this.bounds.min.x * (1 / boundsScaleX), -this.bounds.min.y * (1 / boundsScaleY));
      } else {
        constraints = allConstraints;
      }

      for (let i = 0; i < constraints.length; i++) {
        this.constraint(constraints[i]);
      }

      for (let i = 0; i < bodies.length; i++) {
        this.body(bodies[i]);
      }

      // Body display options
      if (this.options.showIds) {
        for (let i = 0; i < bodies.length; i++) {
          this.bodyIds(bodies[i]);
        }
      }
      if (this.options.showBounds) {
        for (let i = 0; i < bodies.length; i++) {
          this.bodyBounds(bodies[i]);
        }
      }
      if (this.options.showAxes || this.options.showAngleIndicator) {
        for (let i = 0; i < bodies.length; i++) {
          this.bodyAxes(bodies[i]);
        }
      }
      if (this.options.showPositions) {
        for (let i = 0; i < bodies.length; i++) {
          this.bodyPositions(bodies[i]);
        }
      }
      if (this.options.showVelocity) {
        for (let i = 0; i < bodies.length; i++) {
          this.bodyVelocity(bodies[i]);
        }
      }
      if (this.options.showVertexNumbers) {
        for (let i = 0; i < bodies.length; i++) {
          this.vertexNumbers(bodies[i]);
        }
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
      if (this.options.showBroadphase && this.broadphase.controller === Grid) {
        this.grid(this.broadphase);
      }
      if (this.options.showDebug) {
        this.debug();
      }
      if (this.options.hasBounds) {
        // revert view transforms
        // this.context.setTransform(this.options.pixelRatio, 0, 0, this.options.pixelRatio, 0, 0);
      }

      this.renderer.render(this.container);

      Events.trigger(this, 'afterRender', event);
    }
  }

  /**
   * Creates a body sprite
   * @method _createBodySprite
   * @private
   * @param {RenderPixi} render
   * @param {Matter.Body} body
   * @return {PIXI.Sprite} sprite
   */
  let _createBodySprite = function(render, body) {
    let bodyRender = body.render,
        texturePath = bodyRender.sprite.texture,
        texture = _getTexture(render, texturePath),
        sprite = new PIXI.Sprite(texture);

    sprite.anchor.x = body.render.sprite.xOffset;
    sprite.anchor.y = body.render.sprite.yOffset;

    sprite.display = new PIXI.Container();
    sprite.addChild(sprite.display);

    return sprite;
  };

  /**
   * Creates a body primitive
   * @method _createBodyPrimitive
   * @private
   * @param {RenderPixi} render
   * @param {Matter.Body} body
   * @return {PIXI.Graphics} graphics
   */
  let _createBodyPrimitive = function(render, body) {
    let bodyRender = body.render,
        options = render.options,
        fillStyle = Common.colorToNumber(bodyRender.fillStyle),
        strokeStyle = Common.colorToNumber(bodyRender.strokeStyle),
        strokeStyleWireframe = Common.colorToNumber('#bbb'),
        mainGraphic = new PIXI.Graphics(),
        partsContainer = new PIXI.Container();
    mainGraphic.initialAngle = body.angle;
    mainGraphic.display = new PIXI.Container();
    mainGraphic.addChild(mainGraphic.display);
    mainGraphic.addChild(partsContainer);

    // handle compound parts
    for (let k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
      let part = body.parts[k],
          partGraphic = new PIXI.Graphics();
      //partGraphic.initialAngle = part.angle;
      //partGraphic.rotation = body.angle - mainGraphic.initialAngle;
      if (!options.wireframes) {
        partGraphic.beginFill(fillStyle, 1);
        partGraphic.lineStyle(bodyRender.lineWidth, strokeStyle, 1);
      } else {
        partGraphic.beginFill(0, 0);
        partGraphic.lineStyle(1, strokeStyleWireframe, 1);
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

      if (part.entity.eyes !== undefined) {
        for (let i = 0; i < body.entity.eyes.length; i++) {
          let eye = body.entity.eyes[i],
              x = part.position.x - body.position.x,
              y = part.position.y - body.position.y,
              eyeStartX = x + part.circleRadius * Math.sin(part.angle + eye.angle),
              eyeStartY = y + part.circleRadius * Math.cos(part.angle + eye.angle),
              eyeEndX = x + eye.sensed.proximity * Math.sin(part.angle + eye.angle),
              eyeEndY = y + eye.sensed.proximity * Math.cos(part.angle + eye.angle);
          eye.v1 = Vector.create(eyeStartX, eyeStartY);
          eye.v2 = Vector.create(eyeEndX, eyeEndY);

          // Draw the agent's line of sights
          eye.graphics.clear();
          eye.graphics.beginFill(0, 0);
          eye.graphics.lineStyle(1, (eye.sensed.type > -1) ? hexStyles[eye.sensed.type] : 0xFFFFFF, 1);
          eye.graphics.moveTo(eye.v1.x, eye.v1.y);
          eye.graphics.lineTo(eye.v2.x, eye.v2.y);
          eye.graphics.endFill();
          partsContainer.addChild(eye.graphics);
        }
      }
    }

    return mainGraphic;
  };

  /**
   * Gets the requested texture (a PIXI.Texture) via its path
   * @method _getTexture
   * @private
   * @param {RenderPixi} render
   * @param {string} imagePath
   * @return {PIXI.Texture} texture
   */
  let _getTexture = function(render, imagePath) {
    let texture = render.textures[imagePath];

    if (!texture) {
      texture = render.textures[imagePath] = PIXI.Texture.fromImage(imagePath);
    }
    return texture;
  };

  /**
   * Gets the pixel ratio of the canvas.
   * @method _getPixelRatio
   * @private
   * @param {HTMLElement} canvas
   * @return {Number} pixel ratio
   */
  let _getPixelRatio = function(canvas) {
    let context = canvas.getContext('2d'),
        devicePixelRatio = window.devicePixelRatio || 1,
        backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio
            || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio
            || context.backingStorePixelRatio || 1;

    return devicePixelRatio / backingStorePixelRatio;
  };
  global.RenderPixi = RenderPixi;

}(this));
