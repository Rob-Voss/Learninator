(function (global) {
    "use strict";

    // Matter aliases
    var Engine = Matter.Engine,
        World = Matter.World,
        Bodies = Matter.Bodies,
        Body = Matter.Body,
        Bounds = Matter.Bounds,
        Common = Matter.Common,
        Composite = Matter.Composite,
        Events = Matter.Events,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        Vector = Matter.Vector,

    // Canvas
        container = document.body.querySelector('#game-container'),
        graphContainer = document.body.querySelector('#flotreward'),

    // Collision Category Groups
        wallCategory = 0x0001,
        nomCategory = 0x0002,
        gnarCategory = 0x0004,
        agentCategory = 0x0008,

    // Collision Category Colors
        redColor = '#C44D58',
        greenColor = '#C7F464',
        blueColor = '#4ECDC4',

    // Engine Options
        engineOpts = {
            enabled: true,
            enableSleeping: false,
            constraintIterations: 2,
            positionIterations: 10,
            velocityIterations: 10,
            metrics: {
                extended: true,
                narrowDetections: 0,
                narrowphaseTests: 0,
                narrowReuse: 0,
                narrowReuseCount: 0,
                midphaseTests: 0,
                broadphaseTests: 0,
                narrowEff: 0.0001,
                midEff: 0.0001,
                broadEff: 0.0001,
                collisions: 0,
                buckets: 0,
                bodies: 0,
                pairs: 0
            },
            timing: {
                timeScale: 1
            }
        },
        renderOpts = {
            element: container,
            options: {
                background: '#585858',
                pixelRatio: 1,
                enabled: true,
                hasBounds: true,
                showAngleIndicator: false,
                showAxes: false,
                showSleeping: false,
                showBounds: false,
                showBroadphase: false,
                showCollisions: false,
                showConvexHulls: false,
                showDebug: false,
                showIds: false,
                showInternalEdges: false,
                showMousePosition: false,
                showPositions: false,
                showShadows: false,
                showSeparations: false,
                showVelocity: false,
                showVertexNumbers: false,
                wireframes: false,
                wireframeBackground: '#222'
            }
        };

// MatterTools aliases
    if (window.MatterTools) {
        var MatterTools = window.MatterTools,
            useTools = true,
            Gui = MatterTools.Gui,
            Inspector = MatterTools.Inspector,
            useInspector = window.location.hash.indexOf('-inspect') !== -1,
            isMobile = /(ipad|iphone|ipod|android)/gi.test(navigator.userAgent);
    }

    class MatterWorld {

        /**
         * Make a World
         * @name MatterWorld
         * @constructor
         *
         * @param {number} width
         * @param {number} height
         * @return {MatterWorld}
         */
        constructor(width = 600, height = 600) {
            this.clock = 0;
            this.agents = [];
            this.width = renderOpts.options.width = width;
            this.height = renderOpts.options.height = height;
            this.engine = renderOpts.engine = Engine.create(engineOpts);
            // this.render = new RenderPixi(renderOpts);
            this.render = new Renderer(renderOpts);
            this.runner = Engine.run(this.engine);
            this.engine.world.gravity = {x: 0, y: 0};
            this.mouseConstraint = MouseConstraint.create(this.engine, {
                element: this.render.canvas
            });
            this.render.mouse = this.mouseConstraint.mouse;
            this.render.run();
            this.engine.metrics.timing = this.runner;

            this.addWalls();
            this.addAgents();
            this.addEntities(30);
            this.setEngineEvents();
            this.setRunnerEvents();
            this.setWorldEvents();

            this.rewards = (graphContainer) ? new FlotGraph(this.agents) : false;
            if (useTools) {
                this.useInspector = useInspector;
                this.isMobile = isMobile;
                this.guiOptions = {
                    broadphase: 'grid',
                    amount: 1,
                    size: 40,
                    sides: 4,
                    density: 0.001,
                    restitution: 0,
                    friction: 0.1,
                    frictionStatic: 0.5,
                    frictionAir: 0.01,
                    offset: { x: 0, y: 0 },
                    renderer: 'canvas',
                    chamfer: 0,
                    isRecording: false
                };
                // create a Matter.Gui
                this.gui = Gui.create(this.engine, this.runner, this.render, this.guiOptions);
                this.initControls();
                Gui.update(this.gui, this.gui.datGui);
            }
        }

        setViewport(x, y) {
            this.viewportCenter = {
                x: this.width * 0.5,
                y: this.height * 0.5
            };

            // make the world bounds a little bigger than the render bounds
            this.engine.world.bounds.min.x = -x;
            this.engine.world.bounds.min.y = -y;
            this.engine.world.bounds.max.x = this.width + x;
            this.engine.world.bounds.max.y = this.height + y;

            // keep track of current bounds scale (view zoom)
            this.boundsScaleTarget = 1;
            this.boundsScale = {x: 1, y: 1};

            // use the engine tick event to control our view
            Events.on(this.engine, 'beforeTick', () => {
                // mouse wheel controls zoom
                var scaleFactor = this.render.mouse.wheelDelta * -0.1;
                if (scaleFactor !== 0) {
                    if ((scaleFactor < 0 && this.boundsScale.x >= 0.6) || (scaleFactor > 0 && this.boundsScale.x <= 1.4)) {
                        this.boundsScaleTarget += scaleFactor;
                    }
                }

                // if scale has changed
                if (Math.abs(this.boundsScale.x - this.boundsScaleTarget) > 0.01) {
                    // smoothly tween scale factor
                    scaleFactor = (this.boundsScaleTarget - this.boundsScale.x) * 0.2;
                    this.boundsScale.x += scaleFactor;
                    this.boundsScale.y += scaleFactor;

                    // scale the render bounds
                    this.render.bounds.max.x = this.render.bounds.min.x + this.render.options.width * this.boundsScale.x;
                    this.render.bounds.max.y = this.render.bounds.min.y + this.render.options.height * this.boundsScale.y;

                    // translate so zoom is from centre of view
                    this.translate = {
                        x: this.render.options.width * scaleFactor * -0.5,
                        y: this.render.options.height * scaleFactor * -0.5
                    };

                    Bounds.translate(this.render.bounds, this.translate);

                    // update mouse
                    Mouse.setScale(this.render.mouse, this.boundsScale);
                    Mouse.setOffset(this.render.mouse, this.render.bounds.min);
                }

                // get vector from mouse relative to centre of viewport
                var deltaCenter = Vector.sub(this.render.mouse.absolute, this.viewportCenter),
                    centerDist = Vector.magnitude(deltaCenter);

                // translate the view if mouse has moved over 50px from the center of viewport
                if (centerDist > 50) {
                    // create a vector to translate the view, allowing the user to control view speed
                    var direction = Vector.normalise(deltaCenter),
                        speed = Math.min(10, Math.pow(centerDist - 50, 2) * 0.0002);

                    this.translate = Vector.mult(direction, speed);

                    // prevent the view moving outside the world bounds
                    if (this.render.bounds.min.x + this.translate.x < this.engine.world.bounds.min.x)
                        this.translate.x = this.engine.world.bounds.min.x - this.render.bounds.min.x;

                    if (this.render.bounds.max.x + this.translate.x > this.engine.world.bounds.max.x)
                        this.translate.x = this.engine.world.bounds.max.x - this.render.bounds.max.x;

                    if (this.render.bounds.min.y + this.translate.y < this.engine.world.bounds.min.y)
                        this.translate.y = this.engine.world.bounds.min.y - this.render.bounds.min.y;

                    if (this.render.bounds.max.y + this.translate.y > this.engine.world.bounds.max.y)
                        this.translate.y = this.engine.world.bounds.max.y - this.render.bounds.max.y;

                    // move the view
                    Bounds.translate(this.render.bounds, this.translate);

                    // we must update the mouse too
                    Mouse.setOffset(this.render.mouse, this.render.bounds.min);
                }
            });
        }

        /**
         * Add new agents
         * @parameter {number} number
         * @return {MatterWorld}
         */
        addAgents(number = 1) {
            // Populating the world
            for (let k = 0; k < number; k++) {
                let agentOpts = {
                        worker: false,
                        numEyes: 30,
                        numTypes: 5,
                        numActions: 4,
                        numProprioception: 2,
                        range: 120,
                        proximity: 120
                    },
                    entityOpt = {
                        position: {
                            x: 400,
                            y: 400
                        },
                        render: {
                            strokeStyle: Common.shadeColor(blueColor, -20),
                            fillStyle: blueColor
                        },
                        friction: 0,
                        frictionAir: Utility.Maths.randf(0.0, 0.9),
                        frictionStatic: 0,
                        restitution: 0,
                        density: Utility.Maths.randf(0.001, 0.01)
                    },
                    body = Bodies.circle(entityOpt.position.x, entityOpt.position.y, 10, entityOpt),
                    entity = new PhysicalAgent(body, agentOpts);

                Body.set(body, 'entity', entity);
                this.addMatter([body]);

                this.agents.push(entity);
            }

            return this;
        }

        /**
         * Add new entities
         * @parameter {number} number
         * @return {MatterWorld}
         */
        addEntities(number = 1) {
            let bodies = [];
            // Populating the world
            for (let k = 0; k < number; k++) {
                let body, entity,
                    entityOpt = {
                        position: {
                            x: Utility.Maths.randi(10, this.width - 10),
                            y: Utility.Maths.randi(10, this.height - 10)
                        },
                        friction: 0.1,
                        frictionAir: Utility.Maths.randf(0.0, 0.9),
                        frictionStatic: 0.5,
                        restitution: 1,
                        density: Utility.Maths.randf(0.005, 0.01)
                    },
                    type = Utility.Maths.randi(1, 3);
                if (type === 1) {
                    entityOpt.render = {
                        strokeStyle: Common.shadeColor(greenColor, -20),
                        fillStyle: Common.shadeColor(greenColor, -20)
                    };
                    body = Bodies.circle(entityOpt.position.x, entityOpt.position.y, 10, entityOpt);
                } else {
                    entityOpt.chamfer = {
                        radius: 30
                    };
                    entityOpt.render = {
                        strokeStyle: Common.shadeColor(redColor, -20),
                        fillStyle: Common.shadeColor(redColor, -20)
                    };
                    body = Bodies.polygon(entityOpt.position.x, entityOpt.position.y, 8, 10, entityOpt);
                }
                entity = new PhysicalEntity(type, body);

                Body.set(body, 'entity', entity);
                bodies.push(body);
            }
            this.addMatter(bodies);

            return this;
        }

        /**
         * Add Bodies and Graphics to the scene
         * @param {Array} items
         * @return {MatterWorld}
         */
        addMatter(items) {
            World.add(this.engine.world, items);

            return this;
        }

        /**
         * Add walls to the world
         * @return {MatterWorld}
         */
        addWalls() {
            // Ground
            var buffer = 5,
                wallOpts = {isStatic: true, render: {visible: true}, label: 'Wall'},
                left = Bodies.rectangle(buffer, this.height / 2, buffer, this.height - (buffer * 2), wallOpts),
                top = Bodies.rectangle(this.width / 2, buffer, this.width - (buffer * 2), buffer, wallOpts),
                right = Bodies.rectangle(this.width - buffer, this.height / 2, buffer, this.height - (buffer * 2), wallOpts),
                bottom = Bodies.rectangle(this.width / 2, this.height - buffer, this.width - (buffer * 2), buffer, wallOpts);

            Body.set(left, 'entity', {
                type: 0,
                x: left.position.x,
                y: buffer,
                width: buffer,
                height: this.height - (buffer * 2)
            });
            Body.set(top, 'entity', {
                type: 0,
                x: buffer,
                y: top.position.y,
                width: this.width - (buffer * 2),
                height: buffer
            });
            Body.set(right, 'entity', {
                type: 0,
                x: right.position.x,
                y: buffer,
                width: buffer,
                height: this.height - (buffer * 2)
            });
            Body.set(bottom, 'entity', {
                type: 0,
                x: buffer,
                y: bottom.position.y,
                width: this.width - (buffer * 2),
                height: buffer
            });

            this.addMatter([left, top, right, bottom]);

            return this;
        }

        /**
         * Check the bounds
         * @param {Matter.Body} body
         */
        checkBounds(body) {
            let maxX = this.render.bounds.max.x - body.entity.radius,
                maxY = this.render.bounds.max.y - body.entity.radius,
                minX = this.render.bounds.min.x + body.entity.radius,
                minY = this.render.bounds.min.y + body.entity.radius,
                spdAdj = body.entity.speed * 0.00025,
                newPos = Vector.create(body.position.x, body.position.y),
                newForce = Vector.create(body.entity.force.x, body.entity.force.y);
            if (body.speed > 2) {
                body.speed = body.entity.speed;
            }
            if (body.velocity.x <= -2 || body.velocity.x >= 2) {
                newForce.x = spdAdj;
            }
            if (body.velocity.y <= -2 || body.velocity.y >= 2) {
                newForce.y = spdAdj;
            }
            if (body.position.x > maxX) {
                newPos.x = body.position.x - body.entity.radius / 2;
                newForce.x = -spdAdj;
            }
            if (body.position.x < minX) {
                newPos.x = body.position.x + body.entity.radius / 2;
                newForce.x = spdAdj;
            }
            if (body.position.y > maxY) {
                newPos.y = body.position.y - body.entity.radius / 2;
                newForce.y = -spdAdj;
            }
            if (body.position.y < minY) {
                newPos.y = body.position.y + body.entity.radius / 2;
                newForce.y = spdAdj;
            }
            this.updateBody(body, newPos, newForce);
        }

        /**
         * Set up the GUI for MatterTools
         * @return {MatterWorld}
         */
        initControls() {
            // need to add mouse constraint back in after gui clear or load is pressed
            Events.on(this.gui, 'clear load', () => {
                // add a mouse controlled constraint
                this.mouseConstraint = MouseConstraint.create(this.engine);
                // pass mouse to renderer to enable showMousePosition
                this.engine.render.mouse = this.mouseConstraint.mouse;
                World.add(this.world, this.mouseConstraint);
            });

            // need to rebind mouse on render change
            Events.on(this.gui, 'setRenderer', () => {
                Mouse.setElement(this.mouseConstraint.mouse, this.canvas);
            });

            // create a Matter.Inspector
            if (Inspector && this.useInspector) {
                this.inspector = Inspector.create(this.engine);

                Events.on(this.inspector, 'import', () => {
                    this.mouseConstraint = MouseConstraint.create(this.engine);
                    World.add(this.world, this.mouseConstraint);
                });

                Events.on(this.inspector, 'play', () => {
                    this.mouseConstraint = MouseConstraint.create(this.engine);
                    World.add(this.world, this.mouseConstraint);
                });

                Events.on(this.inspector, 'selectStart', () => {
                    this.mouseConstraint.constraint.render.visible = false;
                });

                Events.on(this.inspector, 'selectEnd', () => {
                    this.mouseConstraint.constraint.render.visible = true;
                });
            }

            return this;
        }

        /**
         * Set the events for the World to respond to remove/add
         * @return {MatterWorld}
         */
        setWorldEvents() {
            // Body Add Events
            Events.on(this.engine.world, 'beforeAdd', (event) => {

            });

            Events.on(this.engine.world, 'afterAdd', (event) => {

            });

            // Body Remove Events
            Events.on(this.engine.world, 'beforeRemove', (event) => {

            });

            Events.on(this.engine.world, 'afterRemove', (event) => {
                this.addEntities();
            });

            return this;
        }

        /**
         * Set the Engine's events during collisions
         * @return {MatterWorld}
         */
        setEngineEvents() {
            // Collision Events
            Events.on(this.engine, 'collisionStart', (event) => {
                var pairs = event.pairs;
                for (let q = 0; q < pairs.length; q++) {
                    let pair = pairs[q],
                        bodyA = Composite.get(this.engine.world, pair.bodyA.id, 'body'),
                        bodyB = Composite.get(this.engine.world, pair.bodyB.id, 'body');
                    if (bodyA && bodyB && !bodyA.isStatic && !bodyB.isStatic) {
                        if (bodyA.label === 'Agent') {
                            bodyA.entity.digestion += bodyB.label === 'Nom' ? 1 : -1;
                            bodyB.entity.cleanUp = true;
                        }
                    }
                }
            });

            Events.on(this.engine, 'collisionActive', (event) => {
                // var pairs = event.pairs;
                // for (let q = 0; q < pairs.length; q++) {
                //     let pair = pairs[q],
                //         bodyA = Composite.get(this.engine.world, pair.bodyA.id, 'body'),
                //         bodyB = Composite.get(this.engine.world, pair.bodyB.id, 'body');
                //     if (bodyA && bodyB) {
                //         if (!bodyA.isStatic && !bodyB.isStatic) {
                //             World.remove(this.engine.world, bodyB);
                //         }
                //     }
                // }
            });

            Events.on(this.engine, 'collisionEnd', (event) => {
                let bodies = Composite.allBodies(this.engine.world);
                for (let i = 0; i < bodies.length; i++){
                    let body = bodies[i];
                    if (body.entity.cleanUp) {
                        World.remove(this.engine.world, body);
                    }
                }
            });

            return this;
        }

        /**
         * Set the Runner's events for updates
         * @return {MatterWorld}
         */
        setRunnerEvents() {
            // Tick Events
            Events.on(this.runner, 'beforeTick', (event) => {

            });

            Events.on(this.runner, 'tick', (event) => {
                let bodies = Composite.allBodies(this.engine.world);
                for (let i = 0; i < bodies.length; i++) {
                    if (!bodies[i].isStatic) {
                        bodies[i].entity.tick(bodies);
                    }
                }
            });

            Events.on(this.runner, 'beforeUpdate', (event) => {
                let bodies = Composite.allBodies(this.engine.world);
                for (let i = 0; i < bodies.length; i++) {
                    if (!bodies[i].isStatic) {
                        this.checkBounds(bodies[i]);
                    }
                }
            });

            Events.on(this.runner, 'afterUpdate', (event) => {

            });

            Events.on(this.render, 'beforeRender', (event) => {

            });

            Events.on(this.render, 'afterRender', (event) => {
                // for (let i = 0; i < this.agents.length; i++) {
                //     this.agents[i].draw(this.render.context);
                // }
            });

            Events.on(this.runner, 'afterTick', (event) => {
                if (this.rewards) {
                    this.rewards.graphRewards();
                }
            });

            return this;
        }

        /**
         * Update the body with new position and force
         * @param {Matter.Body} body
         * @param {Matter.Vector} position
         * @param {Matter.Vector} force
         * @return {MatterWorld}
         */
        updateBody(body, position, force) {
            body.entity.force = force;
            Body.setPosition(body, position);

            return this;
        }
    }
    global.MatterWorld = MatterWorld;

}(this));
