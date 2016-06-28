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
      let primitiveId = 'b-' + body.id;
      if (body.render.sprite && body.render.sprite.texture) {
        let sprite = this.sprites[primitiveId];

        // initialise body sprite if not existing
        if (!sprite) {
          sprite = this.sprites[primitiveId] = _createBodySprite(this, body);
        }
        // update body sprite
        sprite.removeChildren();
        sprite.position.x = body.position.x;
        sprite.position.y = body.position.y;
        sprite.rotation = body.angle;
        sprite.scale.x = body.render.sprite.xScale || 1;
        sprite.scale.y = body.render.sprite.yScale || 1;

        sprite.display.removeChildren();
        sprite.addChild(sprite.display);
        // Add to scene graph if not already there
        if (Common.indexOf(this.container.children, sprite) === -1) {
          this.container.addChild(sprite);
        }
      } else {
        let primitive = this.primitives[primitiveId];

        // Set up body primitive if not existing
        if (!primitive) {
          primitive = this.primitives[primitiveId] = _createBodyPrimitive(this, body);
          primitive.initialAngle = body.angle;
        }
        // Update the body primitive
        primitive.removeChildren();
        primitive.position.x = body.position.x;
        primitive.position.y = body.position.y;
        primitive.rotation = body.angle - primitive.initialAngle;

        if (body.entity.eyes !== undefined) {
          let part = body.parts[0];
          for (let i = 0; i < body.entity.eyes.length; i++) {
            let eye = body.entity.eyes[i],
                x = part.position.x - body.position.x,
                y = part.position.y - body.position.y,
                eyeStartX = x + body.circleRadius * Math.sin(body.angle + eye.angle),
                eyeStartY = y + body.circleRadius * Math.cos(body.angle + eye.angle),
                eyeEndX = x + eye.sensed.proximity * Math.sin(body.angle + eye.angle),
                eyeEndY = y + eye.sensed.proximity * Math.cos(body.angle + eye.angle);
            eye.v1 = Vector.create(eyeStartX, eyeStartY);
            eye.v2 = Vector.create(eyeEndX, eyeEndY);

            // Draw the agent's line of sights
            eye.graphics.clear();
            eye.graphics.beginFill(0, 0);
            eye.graphics.lineStyle(1, (eye.sensed.type > -1) ? hexStyles[eye.sensed.type] : 0xFFFFFF, 1);
            eye.graphics.moveTo(eye.v1.x, eye.v1.y);
            eye.graphics.lineTo(eye.v2.x, eye.v2.y);
            eye.graphics.endFill();
            primitive.addChild(eye.graphics);
          }
        }
        primitive.display.removeChildren();
        primitive.addChild(primitive.display);

        // add to scene graph if not already there
        if (Common.indexOf(this.container.children, primitive) === -1) {
          this.container.addChild(primitive);
        }
      }
    }

    /**
     * Display the bounds of the object
     * @param body
     */
    bodyBounds(body) {
      if (!body.render.visible) {
        return;
      }
      let graphic,
          primitiveId = 'b-' + body.id;

      if (body.render.sprite && body.render.sprite.texture) {
        graphic = this.sprites[primitiveId];
      } else {
        graphic = this.primitives[primitiveId];
      }

      // initialise body sprite if not existing
      if (graphic) {
        if (!graphic.boundsBox) {
          graphic.boundsBox = new PIXI.Graphics();
        }
        graphic.boundsBox.clear();
        graphic.boundsBox.beginFill(0, 0);
        graphic.boundsBox.lineStyle(1, 0x0000FF, 1);
        graphic.boundsBox.drawRect(
            body.position.x - body.bounds.max.x,
            body.position.y - body.bounds.max.y,
            body.bounds.max.x - body.bounds.min.x,
            body.bounds.max.y - body.bounds.min.y
        );
        graphic.boundsBox.endFill();
        graphic.boundsBox.position.set(body.position);
        graphic.display.addChild(graphic.boundsBox);
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
        _this.frameRequestId = requestAnimationFrame(loop);
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
        primitive = new PIXI.Graphics(),
        fillStyle = Common.colorToNumber(bodyRender.fillStyle),
        strokeStyle = Common.colorToNumber(bodyRender.strokeStyle),
        strokeStyleIndicator = Common.colorToNumber(bodyRender.strokeStyle),
        strokeStyleWireframe = Common.colorToNumber('#bbb'),
        strokeStyleWireframeIndicator = Common.colorToNumber('#CD5C5C'),
        part;

    primitive.clear();
    // handle compound parts
    for (let k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
      part = body.parts[k];

      if (!options.wireframes) {
        primitive.beginFill(fillStyle, 1);
        primitive.lineStyle(bodyRender.lineWidth, strokeStyle, 1);
      } else {
        primitive.beginFill(0, 0);
        primitive.lineStyle(1, strokeStyleWireframe, 1);
      }

      primitive.moveTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);
      for (let j = 1; j < part.vertices.length; j++) {
        primitive.lineTo(part.vertices[j].x - body.position.x, part.vertices[j].y - body.position.y);
      }
      primitive.lineTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);
      primitive.endFill();

      // angle indicator
      if (options.showAngleIndicator || options.showAxes) {
        primitive.beginFill(0, 0);
        if (options.wireframes) {
          primitive.lineStyle(1, strokeStyleWireframeIndicator, 1);
        } else {
          primitive.lineStyle(1, strokeStyleIndicator);
        }
        primitive.moveTo(part.position.x - body.position.x, part.position.y - body.position.y);
        primitive.lineTo(((part.vertices[0].x + part.vertices[part.vertices.length - 1].x) / 2 - body.position.x),
            ((part.vertices[0].y + part.vertices[part.vertices.length - 1].y) / 2 - body.position.y));
        primitive.endFill();
      }
    }

    if (body.entity.eyes !== undefined) {
      for (let i = 0; i < body.entity.eyes.length; i++) {
        let eye = body.entity.eyes[i],
            x = part.position.x - body.position.x,
            y = part.position.y - body.position.y,
            eyeStartX = x + body.circleRadius * Math.sin(body.angle + eye.angle),
            eyeStartY = y + body.circleRadius * Math.cos(body.angle + eye.angle),
            eyeEndX = x + eye.sensed.proximity * Math.sin(body.angle + eye.angle),
            eyeEndY = y + eye.sensed.proximity * Math.cos(body.angle + eye.angle);
        eye.v1 = Vector.create(eyeStartX, eyeStartY);
        eye.v2 = Vector.create(eyeEndX, eyeEndY);

        // Draw the agent's line of sights
        eye.graphics.clear();
        eye.graphics.beginFill(0, 0);
        eye.graphics.lineStyle(1, (eye.sensed.type > -1) ? hexStyles[eye.sensed.type] : 0xFFFFFF, 1);
        eye.graphics.moveTo(eye.v1.x, eye.v1.y);
        eye.graphics.lineTo(eye.v2.x, eye.v2.y);
        eye.graphics.endFill();
        primitive.addChild(eye.graphics);
      }
    }
    primitive.display = new PIXI.Container();
    primitive.addChild(primitive.display);

    return primitive;
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
