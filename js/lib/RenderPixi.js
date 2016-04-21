/**
 * The `Matter.RenderPixi` module is a renderer using pixi.js.
 * See also `Matter.Render` for a canvas based renderer.
 *
 * @class RenderPixi
 */

var RenderPixi = {};

(function () {

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

    /**
     * Description
     * @method body
     * @param {Matter.Engine} engine
     * @param {Matter.Body} body
     */
    RenderPixi.body = function (engine, body) {
        var render = engine.render,
            bodyRender = body.render;

        if (!bodyRender.visible) {
            return;
        }
        if (bodyRender.sprite && bodyRender.sprite.texture) {
            var spriteId = 'b-' + body.id,
                sprite = render.sprites[spriteId],
                spriteContainer = render.spriteContainer;

            // initialise body sprite if not existing
            if (!sprite) {
                sprite = render.sprites[spriteId] = _createBodySprite(render, body);
            }
            // add to scene graph if not already there
            if (Common.indexOf(spriteContainer.children, sprite) === -1) {
                spriteContainer.addChild(sprite);
            }
            // update body sprite
            sprite.position.x = body.position.x;
            sprite.position.y = body.position.y;
            sprite.rotation = body.angle;
            sprite.scale.x = bodyRender.sprite.xScale || 1;
            sprite.scale.y = bodyRender.sprite.yScale || 1;
        } else {
            var primitiveId = 'b-' + body.id,
                primitive = render.primitives[primitiveId],
                container = render.container;

            // initialise body primitive if not existing
            if (!primitive) {
                primitive = render.primitives[primitiveId] = _createBodyPrimitive(render, body);
                primitive.initialAngle = body.angle;
            }

            // update body primitive
            primitive.position.x = body.position.x;
            primitive.position.y = body.position.y;
            primitive.rotation = body.angle - primitive.initialAngle;

            // add to scene graph if not already there
            if (Common.indexOf(container.children, primitive) === -1) {
                container.addChild(primitive);
            }
        }
    };

    /**
     * Clears the scene graph
     * @method clear
     * @param {RenderPixi} render
     */
    RenderPixi.clear = function (render) {
        var container = render.container,
            spriteContainer = render.spriteContainer;

        // clear stage container
        while (container.children[0]) {
            container.removeChild(container.children[0]);
        }

        // clear sprite batch
        while (spriteContainer.children[0]) {
            spriteContainer.removeChild(spriteContainer.children[0]);
        }

        var bgSprite = render.sprites['bg-0'];

        // clear caches
        render.textures = {};
        render.sprites = {};
        render.primitives = {};

        // set background sprite
        render.sprites['bg-0'] = bgSprite;
        if (bgSprite) {
            container.addChildAt(bgSprite, 0);
        }
        // add sprite batch back into container
        render.container.addChild(render.spriteContainer);

        // reset background state
        render.currentBackground = null;

        // reset bounds transforms
        container.scale.set(1, 1);
        container.position.set(0, 0);
    };

    /**
     * Description
     * @method constraint
     * @param {Matter.Engine} engine
     * @param {constraint} constraint
     */
    RenderPixi.constraint = function (engine, constraint) {
        var render = engine.render,
            bodyA = constraint.bodyA,
            bodyB = constraint.bodyB,
            pointA = constraint.pointA,
            pointB = constraint.pointB,
            container = render.container,
            constraintRender = constraint.render,
            primitiveId = 'c-' + constraint.id,
            primitive = render.primitives[primitiveId];

        // initialise constraint primitive if not existing
        if (!primitive) {
            primitive = render.primitives[primitiveId] = new PIXI.Graphics();
        }
        // don't render if constraint does not have two end points
        if (!constraintRender.visible || !constraint.pointA || !constraint.pointB) {
            primitive.clear();
            return;
        }

        // add to scene graph if not already there
        if (Common.indexOf(container.children, primitive) === -1) {
            container.addChild(primitive);
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
    };

    /**
     * Creates a new Pixi.js WebGL renderer
     * @method create
     * @param {object} options
     * @return {RenderPixi} A new renderer
     */
    RenderPixi.create = function (options) {
        var defaults = {
            controller: RenderPixi,
            element: null,
            canvas: null,
            renderer: null,
            container: null,
            spriteContainer: null,
            pixiOptions: null,
            options: {
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
            }
        };

        var render = Common.extend(defaults, options),
            transparent = !render.options.wireframes && render.options.background === 'transparent';

        // init pixi
        render.pixiOptions = render.pixiOptions || {
                view: render.canvas,
                transparent: transparent,
                antialias: true,
                backgroundColor: options.background
            };

        render.renderer = render.renderer || new PIXI.autoDetectRenderer(render.options.width, render.options.height, render.pixiOptions);
        render.container = render.container || new PIXI.Container();
        render.spriteContainer = render.spriteContainer || new PIXI.Container();
        render.canvas = render.canvas || render.renderer.view;
        render.bounds = render.bounds || {
                min: {
                    x: 0,
                    y: 0
                },
                max: {
                    x: render.options.width,
                    y: render.options.height
                }
            };

        // caches
        render.textures = {};
        render.sprites = {};
        render.primitives = {};

        // use a sprite batch for performance
        render.container.addChild(render.spriteContainer);

        // insert canvas
        if (Common.isElement(render.element)) {
            render.element.appendChild(render.canvas);
        } else {
            Common.log('No "render.element" passed, "render.canvas" was not inserted into document.', 'warn');
        }

        // prevent menus on canvas
        render.canvas.oncontextmenu = function () {
            return false;
        };
        render.canvas.onselectstart = function () {
            return false;
        };

        return render;
    };

    /**
     * Sets the background of the canvas
     * @method setBackground
     * @param {RenderPixi} render
     * @param {string} background
     */
    RenderPixi.setBackground = function (render, background) {
        if (render.currentBackground !== background) {
            var isColor = background.indexOf && background.indexOf('#') !== -1,
                bgSprite = render.sprites['bg-0'];

            if (isColor) {
                // if solid background color
                var color = Common.colorToNumber(background);
                render.renderer.backgroundColor = color;

                // remove background sprite if existing
                if (bgSprite) {
                    render.container.removeChild(bgSprite);
                }
            } else {
                // initialise background sprite if needed
                if (!bgSprite) {
                    var texture = _getTexture(render, background);

                    bgSprite = render.sprites['bg-0'] = new PIXI.Sprite(texture);
                    bgSprite.position.x = 0;
                    bgSprite.position.y = 0;
                    render.container.addChildAt(bgSprite, 0);
                }
            }

            render.currentBackground = background;
        }
    };

    /**
     * Description
     * @method world
     * @param {Matter.Engine} engine
     */
    RenderPixi.world = function (engine) {
        var render = engine.render,
            world = engine.world,
            renderer = render.renderer,
            container = render.container,
            options = render.options,
            allBodies = Composite.allBodies(world),
            allConstraints = Composite.allConstraints(world),
            constraints = [],
            bodies = [],
            i;

        var event = {
            timestamp: engine.timing.timestamp
        };

        if (options.wireframes) {
            RenderPixi.setBackground(render, options.wireframeBackground);
        } else {
            RenderPixi.setBackground(render, options.background);
        }

        Events.trigger(render, 'beforeRender', event);

        if (options.hasBounds) {
            world.bounds = render.bounds;
            // handle bounds
            var boundsWidth = render.bounds.max.x - render.bounds.min.x,
                boundsHeight = render.bounds.max.y - render.bounds.min.y,
                boundsScaleX = boundsWidth / render.options.width,
                boundsScaleY = boundsHeight / render.options.height;

            // filter out bodies that are not in view
            for (i = 0; i < allBodies.length; i++) {
                var body = allBodies[i],
                    over = Bounds.overlaps(body.bounds, render.bounds);
                body.render.sprite.visible = over;
                if (over) {
                    bodies.push(body);
                }
            }

            // filter out constraints that are not in view
            for (i = 0; i < allConstraints.length; i++) {
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
                if (Bounds.contains(render.bounds, pointAWorld) || Bounds.contains(render.bounds, pointBWorld)) {
                    constraints.push(constraint);
                }
            }

            // transform the view
            container.scale.set(1 / boundsScaleX, 1 / boundsScaleY);
            container.position.set(-render.bounds.min.x * (1 / boundsScaleX), -render.bounds.min.y * (1 / boundsScaleY));
        } else {
            constraints = allConstraints;
        }

        for (i = 0; i < bodies.length; i++) {
            RenderPixi.body(engine, bodies[i]);
        }
        for (i = 0; i < constraints.length; i++) {
            RenderPixi.constraint(engine, constraints[i]);
        }

        if (options.showBounds) {
            RenderPixi.bodyBounds(engine, bodies, renderer.context);
        }
        if (options.showAxes || options.showAngleIndicator) {
            RenderPixi.bodyAxes(engine, bodies, renderer.context);
        }
        if (options.showPositions) {
            RenderPixi.bodyPositions(engine, bodies, renderer.context);
        }
        if (options.showVelocity) {
            RenderPixi.bodyVelocity(engine, bodies, renderer.context);
        }
        if (options.showIds) {
            RenderPixi.bodyIds(engine, bodies, renderer.context);
        }
        if (options.showSeparations) {
            RenderPixi.separations(engine, engine.pairs.list, renderer.context);
        }
        if (options.showCollisions) {
            RenderPixi.collisions(engine, engine.pairs.list, renderer.context);
        }
        if (options.showVertexNumbers) {
            RenderPixi.vertexNumbers(engine, bodies, renderer.context);
        }
        if (options.showMousePosition) {
            RenderPixi.mousePosition(engine, render.mouse, renderer.context);
        }
        if (options.showBroadphase && engine.broadphase.controller === Grid) {
            RenderPixi.grid(engine, engine.broadphase, renderer.context);
        }
        if (options.showDebug) {
            RenderPixi.debug(engine, renderer.context);
        }
        if (options.hasBounds) {
            // revert view transforms
            renderer.context.setTransform(options.pixelRatio, 0, 0, options.pixelRatio, 0, 0);
        }

        renderer.render(container);

        Events.trigger(render, 'afterRender', event);
    };

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
            for (let i = 0; i < body.entity.numEyes; i++) {
                primitive.addChild(body.entity.eyes[i].shape);
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
    var _getPixelRatio = function(canvas) {
        var context = canvas.getContext('2d'),
            devicePixelRatio = window.devicePixelRatio || 1,
            backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio
                || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio
                || context.backingStorePixelRatio || 1;

        return devicePixelRatio / backingStorePixelRatio;
    };

}).call(this);