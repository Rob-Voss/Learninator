/**
 * The `Matter.RenderPixi` module is a renderer using pixi.js.
 * See also `Matter.Render` for a canvas based renderer.
 *
 * @class RenderPixi
 */
(function (global) {
    "use strict";

    // Matter aliases
    var Engine = Matter.Engine,
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
        Vertices = Matter.Vertices;

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
            this.spriteContainer = this.spriteContainer || new PIXI.Container();
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

            this.container.addChild(this.spriteContainer);

            // Insert canvas
            if (Common.isElement(this.element)) {
                this.element.appendChild(this.canvas);
            } else {
                Common.log('No "render.element" passed, "render.canvas" was not inserted into document.', 'warn');
            }

            // Prevent menus on canvas
            this.canvas.oncontextmenu = function () {
                return false;
            };
            this.canvas.onselectstart = function () {
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
            if (body.render.sprite && body.render.sprite.texture) {
                var spriteId = 'b-' + body.id,
                    sprite = this.sprites[spriteId];

                // initialise body sprite if not existing
                if (!sprite) {
                    sprite = this.sprites[spriteId] = _createBodySprite(this, body);
                }
                // add to scene graph if not already there
                if (Common.indexOf(this.spriteContainer.children, sprite) === -1) {
                    this.spriteContainer.addChild(sprite);
                }
                // update body sprite
                sprite.position.x = body.position.x;
                sprite.position.y = body.position.y;
                sprite.rotation = body.angle;
                sprite.scale.x = body.render.sprite.xScale || 1;
                sprite.scale.y = body.render.sprite.yScale || 1;
            } else {
                var primitiveId = 'b-' + body.id,
                    primitive = this.primitives[primitiveId];

                // initialise body primitive if not existing
                if (!primitive) {
                    primitive = this.primitives[primitiveId] = _createBodyPrimitive(this, body);
                    primitive.initialAngle = body.angle;
                }

                // update body primitive
                primitive.position.x = body.position.x;
                primitive.position.y = body.position.y;
                primitive.rotation = body.angle - primitive.initialAngle;

                if (body.label === 'Agent') {
                    for (let i = 0; i < body.entity.eyes.length; i++) {
                        body.entity.eyes[i].draw();
                        if (Common.indexOf(primitive.children, body.entity.eyes[i].graphics) === -1) {
                            primitive.addChild(body.entity.eyes[i].graphics);
                        }
                    }
                }
                // add to scene graph if not already there
                if (Common.indexOf(this.container.children, primitive) === -1) {
                    this.container.addChild(primitive);
                }
            }
        }

        /**
         * Clears the scene graph
         * @method clear
         */
        clear() {
            // Clear stage container
            while (this.container.children[0]) {
                this.container.removeChild(this.container.children[0]);
            }

            // Clear sprite batch
            while (this.spriteContainer.children[0]) {
                this.spriteContainer.removeChild(this.spriteContainer.children[0]);
            }

            var bgSprite = this.sprites['bg-0'];

            // Clear caches
            this.textures = {};
            this.sprites = {};
            this.primitives = {};

            // Set background sprite
            this.sprites['bg-0'] = bgSprite;
            if (bgSprite) {
                this.container.addChildAt(bgSprite, 0);
            }
            // Add sprite batch back into container
            this.container.addChild(this.spriteContainer);

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
            var bodyA = constraint.bodyA,
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
         * Continuously updates the render canvas on the `requestAnimationFrame` event.
         * @method run
         */
        run() {
            var _this = this;
            (function loop(time) {
                _this.frameRequestId = requestAnimationFrame(loop);
                _this.world();
            })();
        }

        /**
         * Sets the background of the canvas
         * @method setBackground
         * @param {string} background
         */
        setBackground(background) {
            if (this.currentBackground !== background) {
                var isColor = background.indexOf && background.indexOf('#') !== -1,
                    bgSprite = this.sprites['bg-0'];

                if (isColor) {
                    // if solid background color
                    var color = Common.colorToNumber(background);
                    this.renderer.backgroundColor = color;

                    // remove background sprite if existing
                    if (bgSprite) {
                        this.container.removeChild(bgSprite);
                    }
                } else {
                    // initialise background sprite if needed
                    if (!bgSprite) {
                        var texture = _getTexture(this, background);

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
        world() {
            var allBodies = Composite.allBodies(this.engine.world),
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
                var boundsWidth = this.bounds.max.x - this.bounds.min.x,
                    boundsHeight = this.bounds.max.y - this.bounds.min.y,
                    boundsScaleX = boundsWidth / this.options.width,
                    boundsScaleY = boundsHeight / this.options.height;

                // Hide bodies that are not in view
                for (let i = 0; i < allBodies.length; i++) {
                    var body = allBodies[i],
                        over = Bounds.overlaps(body.bounds, this.bounds);
                    body.render.sprite.visible = over;
                    if (over) {
                        bodies.push(body);
                    }
                }

                // Hide constraints that are not in view
                for (let i = 0; i < allConstraints.length; i++) {
                    var constraint = allConstraints[i],
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

            for (let i = 0; i < bodies.length; i++) {
                this.body(bodies[i]);
            }

            for (let i = 0; i < constraints.length; i++) {
                this.constraint(constraints[i]);
            }

            if (this.options.showBounds) {
                this.bodyBounds(bodies);
            }
            if (this.options.showAxes || this.options.showAngleIndicator) {
                this.bodyAxes(bodies);
            }
            if (this.options.showPositions) {
                this.bodyPositions(bodies);
            }
            if (this.options.showVelocity) {
                this.bodyVelocity(bodies);
            }
            if (this.options.showIds) {
                this.bodyIds(bodies);
            }
            if (this.options.showSeparations) {
                this.separations(this.engine.pairs.list);
            }
            if (this.options.showCollisions) {
                this.collisions(this.engine.pairs.list);
            }
            if (this.options.showVertexNumbers) {
                this.vertexNumbers(bodies);
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
    var _createBodySprite = function (render, body) {
        var bodyRender = body.render,
            texturePath = bodyRender.sprite.texture,
            texture = _getTexture(render, texturePath),
            sprite = new PIXI.Sprite(texture);

        sprite.anchor.x = body.render.sprite.xOffset;
        sprite.anchor.y = body.render.sprite.yOffset;

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
    var _createBodyPrimitive = function (render, body) {
        var bodyRender = body.render,
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
        for (var k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
            part = body.parts[k];

            if (!options.wireframes) {
                primitive.beginFill(fillStyle, 1);
                primitive.lineStyle(bodyRender.lineWidth, strokeStyle, 1);
            } else {
                primitive.beginFill(0, 0);
                primitive.lineStyle(1, strokeStyleWireframe, 1);
            }

            primitive.moveTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);
            for (var j = 1; j < part.vertices.length; j++) {
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

        if (body.label === 'Agent') {
            for (let i = 0; i < body.entity.eyes.length; i++) {
                let eye = body.entity.eyes[i];
                eye.draw();
                primitive.addChild(eye.graphics);
            }
        }

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
    var _getTexture = function (render, imagePath) {
        var texture = render.textures[imagePath];

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
    var _getPixelRatio = function (canvas) {
        var context = canvas.getContext('2d'),
            devicePixelRatio = window.devicePixelRatio || 1,
            backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio
                || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio
                || context.backingStorePixelRatio || 1;

        return devicePixelRatio / backingStorePixelRatio;
    };
    global.RenderPixi = RenderPixi;

}(this));
