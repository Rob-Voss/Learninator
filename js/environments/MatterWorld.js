var Utility        = Utility || {},
    PhysicalAgent  = PhysicalAgent || {},
    PhysicalEntity = PhysicalEntity || {};

(function (global) {
    "use strict";

    // Matter aliases
    var Engine          = Matter.Engine,
        World           = Matter.World,
        Bodies          = Matter.Bodies,
        Body            = Matter.Body,
        Bounds          = Matter.Bounds,
        Composite       = Matter.Composite,
        Composites      = Matter.Composites,
        Common          = Matter.Common,
        Constraint      = Matter.Constraint,
        Events          = Matter.Events,
        MouseConstraint = Matter.MouseConstraint,
        Mouse           = Matter.Mouse,
        Pairs           = Matter.Pairs,
        Query           = Matter.Query,
        Runner          = Matter.Runner,
        Svg             = Matter.Svg,
        Vector          = Matter.Vector,
        Vertices        = Matter.Vertices,

        // Canvas
        container       = document.body.querySelector('.game-container'),
        graphContainer  = document.body.querySelector('#flotreward'),

        // Collison Category Groups
        wallCategory    = 0x0001,
        nomCategory     = 0x0002,
        gnarCategory    = 0x0004,
        agentCategory   = 0x0008,

        // Collison Category Colors
        redColor        = '#C44D58',
        greenColor      = '#C7F464',
        blueColor       = '#4ECDC4',

        // Engine Options
        engineOpts      = {
            enabled: true,
            enableSleeping: false,
            constraintIterations: 2,
            velocityIterations: 4,
            positionIterations: 6,
            metrics: {
                extended: true
            },
            world: {
                gravity: {
                    x: 0,
                    y: 0//,
                    // isPoint: true
                }
            },
            render: {
                options: {
                    background: '#000',
                    enabled: true,
                    hasBounds: true,
                    showAngleIndicator: true,
                    showAxes: false,
                    showSleeping: false,
                    showBounds: false,
                    showBroadphase: false,
                    showCollisions: false,
                    showConvexHulls: false,
                    showDebug: false,
                    showIds: false,
                    showInternalEdges: false,
                    showPositions: false,
                    showShadows: false,
                    showSeparations: false,
                    showVelocity: false,
                    showVertexNumbers: false,
                    wireframes: false,
                    wireframeBackground: '#222'
                }
            },
            timing: {
                timeScale: 1
            }
        };

    // MatterTools aliases
    if (window.MatterTools) {
        var MatterTools  = window.MatterTools,
            useTools     = true,
            Gui          = MatterTools.Gui,
            Inspector    = MatterTools.Inspector,
            useInspector = window.location.hash.indexOf('-inspect') !== -1,
            isMobile     = /(ipad|iphone|ipod|android)/gi.test(navigator.userAgent);
    }

    class MatterWorld extends MatterEngine {

        /**
         * Make a World
         * @name MatterWorld
         * @constructor
         *
         * @param {number} width
         * @param {number} height
         * @returns {MatterWorld}
         */
        constructor(width = 600, height = 600) {
            super(5625463739, MainSceneFactory, {
                    width: width,
                    height: height,
                    background: '#333',
                    wireframes: false
                });

            this.clock = 0;
            this.agents = [];

            this.world = this.engine.world;
            this.canvas = this.engine.canvas;
            this.context = this.engine.render.renderer.context;

            if (useTools) {
                this.useInspector = useInspector;
                this.isMobile = isMobile;
                // create a Matter.Gui
                this.gui = Gui.create(this.engine);
                this.initControls();
                Gui.update(self.gui);
            }
        }

        /**
         * Set up the GUI for MatterTools
         */
        initControls() {
            let self = this;

            // need to add mouse constraint back in after gui clear or load is pressed
            Events.on(this.gui, 'clear load', function () {
                // add a mouse controlled constraint
                self.mouseConstraint = MouseConstraint.create(self.engine);
                // pass mouse to renderer to enable showMousePosition
                self.engine.render.mouse = self.mouseConstraint.mouse;
                World.add(self.world, self.mouseConstraint);
            });

            // need to rebind mouse on render change
            Events.on(this.gui, 'setRenderer', function () {
                Mouse.setElement(self.mouseConstraint.mouse, self.canvas);
            });

            // create a Matter.Inspector
            if (Inspector && this.useInspector) {
                this.inspector = Inspector.create(self.engine);

                Events.on(this.inspector, 'import', function () {
                    self.mouseConstraint = MouseConstraint.create(self.engine);
                    World.add(self.world, self.mouseConstraint);
                });

                Events.on(this.inspector, 'play', function () {
                    self.mouseConstraint = MouseConstraint.create(self.engine);
                    World.add(self.world, self.mouseConstraint);
                });

                Events.on(this.inspector, 'selectStart', function () {
                    self.mouseConstraint.constraint.render.visible = false;
                });

                Events.on(this.inspector, 'selectEnd', function () {
                    self.mouseConstraint.constraint.render.visible = true;
                });
            }
        }

        /**
         * Set the events for the World to respond to remove/add
         */
        setWorldEvents() {
            let self = this;

            // Body Add Events
            Events.on(this.world, 'beforeAdd', function (event) {

            });

            Events.on(this.world, 'afterAdd', function (event) {

            });

            // Body Remove Events
            Events.on(this.world, 'beforeRemove', function (event) {

            });

            Events.on(this.world, 'afterRemove', function (event) {
                self.addEntities();
            });
        }

        /**
         * Set the Engine's events during collisions
         */
        setCollisionEvents() {
            let self = this;

            // Collision Events
            Events.on(this.engine, 'collisionStart', function (event) {
                var pairs = event.pairs;
                for (let q = 0; q < pairs.length; q++) {
                    let pair  = pairs[q],
                        bodyA = Composite.get(self.engine.world, pair.bodyA.id, 'body'),
                        bodyB = Composite.get(self.engine.world, pair.bodyB.id, 'body');
                    if (bodyA && bodyB && (!bodyA.isStatic && !bodyB.isStatic)) {
                        let bodyBisEdible = (bodyB.label === 'Nom' || bodyB.label === 'Gnar'),
                            bodyAisAgent  = (bodyA.label === 'Agent');
                        if (bodyAisAgent && bodyBisEdible) {
                            bodyA.entity.digestion += bodyB.label === 'Nom' ? 1 : -1;
                            World.remove(self.engine.world, bodyB);
                        }
                    }
                }
            });

            Events.on(this.engine, 'collisionActive', function (event) {
                var pairs = event.pairs;
                for (let q = 0; q < pairs.length; q++) {
                    let pair = pairs[q];
                }
            });

            Events.on(this.engine, 'collisionEnd', function (event) {
                var pairs = event.pairs;
                for (let q = 0; q < pairs.length; q++) {
                    let pair = pairs[q];
                }
            });
        }

        /**
         * Set the timing based events ticks/updates
         */
        setRunnerEvents() {
            let self = this;

            // Tick Events
            Events.on(this.runner, 'beforeTick', function (event) {

            });

            Events.on(this.runner, 'tick', function (event) {
                let bodies = Composite.allBodies(self.world);
                for (let i = 0; i < bodies.length; i++) {
                    if (!bodies[i].isStatic) {
                        bodies[i].entity.tick(bodies);
                    }
                }
            });

            Events.on(this.runner, 'afterTick', function (event) {
                if (self.rewards) {
                    self.rewards.graphRewards();
                }
            });

            // Engine Update Events
            Events.on(this.runner, 'beforeUpdate', function (event) {

            });

            Events.on(this.runner, 'afterUpdate', function (event) {
                let bodies      = Composite.allBodies(self.world),
                    constraints = Composite.allConstraints(self.world);
                World.clear(self.world);
                Pairs.clear(self.engine.pairs);
                World.add(self.world, bodies);
                World.add(self.world, constraints);
            });

            // Render Events
            Events.on(this.runner, 'beforeRender', function (event) {

            });

            Events.on(this.runner, 'afterRender', function (event) {
                for (let i = 0; i < self.agents.length; i++) {
                    self.agents[i].draw(self);
                }
            });
        }

        /**
         *
         */
        setLargeWorld() {
            // get the centre of the viewport
            var self              = this,
                viewportCentre    = {
                    x: this.width * 0.5,
                    y: this.height * 0.5
                },
                // Keep track of current bounds scale (view zoom)
                boundsScaleTarget = 1,
                boundsScale       = {
                    x: 1,
                    y: 1
                };

            // Make the world bounds a little bigger than the render bounds
            this.world.bounds.min.x = this.width - 100;
            this.world.bounds.min.y = this.height - 100;
            this.world.bounds.max.x = this.width + 100;
            this.world.bounds.max.y = this.height + 100;

            Events.on(this.engine, 'beforeTick', function () {
                var world  = self.world,
                    mouse  = self.mouseConstraint.mouse,
                    render = self.engine.render,
                    translate;

                // Mouse wheel controls zoom
                var scaleFactor = mouse.wheelDelta * -0.1;
                if (scaleFactor !== 0) {
                    if ((scaleFactor < 0 && boundsScale.x >= 0.6) || (scaleFactor > 0 && boundsScale.x <= 1.4)) {
                        boundsScaleTarget += scaleFactor;
                    }
                }

                // If scale has changed
                if (Math.abs(boundsScale.x - boundsScaleTarget) > 0.01) {
                    // Smoothly tween scale factor
                    scaleFactor = (boundsScaleTarget - boundsScale.x) * 0.2;
                    boundsScale.x += scaleFactor;
                    boundsScale.y += scaleFactor;

                    // Scale the render bounds
                    render.bounds.max.x = render.bounds.min.x + render.options.width * boundsScale.x;
                    render.bounds.max.y = render.bounds.min.y + render.options.height * boundsScale.y;

                    // Translate so zoom is from centre of view
                    translate = {
                        x: render.options.width * scaleFactor * -0.5,
                        y: render.options.height * scaleFactor * -0.5
                    };

                    Bounds.translate(render.bounds, translate);

                    // Update mouse
                    Mouse.setScale(mouse, boundsScale);
                    Mouse.setOffset(mouse, render.bounds.min);
                }

                // Get vector from mouse relative to centre of viewport
                var deltaCentre = Vector.sub(mouse.absolute, viewportCentre),
                    centerDist  = Vector.magnitude(deltaCentre);

                // Translate the view if mouse has moved over 50px from the centre of viewport
                if (centerDist > 50 && mouse.button !== -1) {
                    // create a vector to translate the view, allowing the user to control view speed
                    var direction = Vector.normalise(deltaCentre),
                        speed     = Math.min(10, Math.pow(centerDist - 50, 2) * 0.0002);

                    translate = Vector.mult(direction, speed);

                    // prevent the view moving outside the world bounds
                    if (render.bounds.min.x + translate.x < world.bounds.min.x) {
                        translate.x = world.bounds.min.x - render.bounds.min.x;
                    }
                    if (render.bounds.max.x + translate.x > world.bounds.max.x) {
                        translate.x = world.bounds.max.x - render.bounds.max.x;
                    }
                    if (render.bounds.min.y + translate.y < world.bounds.min.y) {
                        translate.y = world.bounds.min.y - render.bounds.min.y;
                    }
                    if (render.bounds.max.y + translate.y > world.bounds.max.y) {
                        translate.y = world.bounds.max.y - render.bounds.max.y;
                    }
                    // move the view
                    Bounds.translate(render.bounds, translate);

                    // we must update the mouse too
                    Mouse.setOffset(mouse, render.bounds.min);
                }
            });
        }
    }
    global.MatterWorld = MatterWorld;

}(this));
