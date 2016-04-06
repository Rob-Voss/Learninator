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
        container       = document.body.querySelector('#game-container'),
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
                element: container,
                controller: RenderPixi,
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

    class MatterWorld {

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
            this.clock = 0;
            this.agents = [];

            this.width = engineOpts.render.options.width = width;
            this.height = engineOpts.render.options.height = height;
            this.engine = Engine.create(container, engineOpts);
            this.scene = MatterWorld.SceneFactory.create(this.engine);
            this.mouseConstraint = MouseConstraint.create(this.engine);
            this.engine.render.mouse = this.mouseConstraint.mouse;
            World.add(this.engine.world, this.mouseConstraint);
            this.canvas = this.engine.render.renderer.canvas;
            this.context = this.engine.render.renderer.context;

            if (useTools) {
                this.useInspector = useInspector;
                this.isMobile = isMobile;
                // create a Matter.Gui
                this.gui = Gui.create(this.engine);
                this.initControls();
                Gui.update(this.gui);
            }

            this.runner = Engine.run(this.engine);

            // this.addWalls();
            this.addAgents();
            // this.agents[0].load('zoo/wateragent.json');
            this.addEntities(50);
            this.setEngineEvents();
            this.setCollisionEvents();
            this.setWorldEvents();

            this.rewards = (graphContainer) ? new FlotGraph(this.agents) : false;

            return this.draw();
        }

        /**
         * Add new agents
         * @parameter {number} number
         * @returns {MatterWorld}
         */
        addAgents(number = 1) {
            // Populating the world
            for (let k = 0; k < number; k++) {
                let agentOpts = {
                        brainType: 'RLDQN',
                        worker: false,
                        numEyes: 30,
                        numTypes: 5,
                        numActions: 4,
                        numStates: 30 * 5,
                        env: {
                            getNumStates: function () {
                                return 30 * 5;
                            },
                            getMaxNumActions: function () {
                                return 4;
                            },
                            startState: function () {
                                return 0;
                            }
                        },
                        range: 120,
                        proximity: 120
                    },
                    entityOpt = {
                        collisionFilter: {
                            category: agentCategory,
                            mask: wallCategory | gnarCategory | nomCategory
                        },
                        position: {
                            x: 10,
                            y: 10
                        },
                        render: {
                            strokeStyle: Common.shadeColor(blueColor, -20),
                            fillStyle: blueColor
                        },
                        friction: 0,
                        frictionAir: Utility.randf(0.0, 0.9),
                        frictionStatic: 0,
                        restitution: 0,
                        density: Utility.randf(0.001, 0.01)
                    },
                    body      = Bodies.circle(entityOpt.position.x, entityOpt.position.y, 10, entityOpt),
                    entity    = new PhysicalAgent(body, agentOpts);

                Body.set(body, 'entity', entity);
                this.addMatter([body]);

                this.agents.push(entity);
            }

            return this;
        }

        /**
         * Add new entities
         * @parameter {number} number
         * @returns {MatterWorld}
         */
        addEntities(number = 1) {
            let bodies = [];
            // Populating the world
            for (let k = 0; k < number; k++) {
                let body, entity,
                    entityOpt = {
                        chamfer: {
                            radius: 0
                        },
                        collisionFilter: {
                            category: 0,
                            mask: wallCategory | agentCategory | gnarCategory | nomCategory
                        },
                        position: {
                            x: Utility.randi(50, this.width - 50),
                            y: Utility.randi(50, this.height - 50)
                        },
                        friction: 0,
                        frictionAir: Utility.randf(0.0, 0.9),
                        frictionStatic: 0,
                        restitution: 0,
                        density: Utility.randf(0.001, 0.01)
                    },
                    type      = Utility.randi(1, 3);
                if (type === 1) {
                    entityOpt.collisionFilter.category = nomCategory;
                    entityOpt.render = {
                        strokeStyle: Common.shadeColor(redColor, -20),
                        fillStyle: redColor,
                        color: redColor
                    };
                    body = Bodies.circle(entityOpt.position.x, entityOpt.position.y, 10, entityOpt);
                } else {
                    entityOpt.collisionFilter.category = gnarCategory;
                    entityOpt.chamfer.radius = 30;
                    entityOpt.render = {
                        strokeStyle: Common.shadeColor(greenColor, -20),
                        fillStyle: greenColor,
                        color: greenColor
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
         *
         * @param items
         */
        addMatter(items) {
            for (let i = 0, len = items.length; i < len; i++) {
                let item = items[i];
                World.add(this.engine.world, [item]);
            }
        }

        /**
         * Add walls
         */
        addWalls() {
            // Ground
            var buffer = 5,
                width = 2,
                wallOpts = {isStatic: true, render: {visible: true}, label: 'Wall'},
                left = Bodies.rectangle(buffer, this.height / 2, width, this.height, wallOpts),
                top = Bodies.rectangle(this.width / 2, buffer, this.width, width, wallOpts),
                right = Bodies.rectangle(this.width - buffer, this.height / 2, width, this.height, wallOpts),
                bottom = Bodies.rectangle(this.width / 2, this.height - buffer, this.width, width, wallOpts);

            Body.set(left, 'entity', {
                x: left.position.x,
                y: buffer,
                width: width,
                height: this.height,
                graphics: new PIXI.Graphics(),
                draw: function () {
                    this.graphics.clear();
                    this.graphics.lineStyle(1, 0xFFFFFF, 1);
                    this.graphics.drawRect(this.x, this.y, this.width, this.height);
                    this.graphics.endFill();
                }
            });
            Body.set(top, 'entity', {
                x: buffer,
                y: top.position.y,
                width: this.width,
                height: width,
                graphics: new PIXI.Graphics(),
                draw: function () {
                    this.graphics.clear();
                    this.graphics.lineStyle(1, 0x00FFFF, 1);
                    this.graphics.drawRect(this.x, this.y, this.width, this.height);
                    this.graphics.endFill();
                }
            });
            Body.set(right, 'entity', {
                x: right.position.x,
                y: buffer,
                width: width,
                height: this.height,
                graphics: new PIXI.Graphics(),
                draw: function () {
                    this.graphics.clear();
                    this.graphics.lineStyle(1, 0xFFFF00, 1);
                    this.graphics.drawRect(this.x, this.y, this.width, this.height);
                    this.graphics.endFill();
                }
            });
            Body.set(bottom, 'entity', {
                x: buffer,
                y: bottom.position.y,
                width: this.width,
                height: width,
                graphics: new PIXI.Graphics(),
                draw: function () {
                    this.graphics.clear();
                    this.graphics.lineStyle(1, 0xFFFFFF, 1);
                    this.graphics.drawRect(this.x, this.y, this.width, this.height);
                    this.graphics.endFill();
                }
            });

            this.addMatter([bottom]);
        }

        /**
         *
         * @returns {*}
         */
        draw() {
            var timeDelta = 16;
            if (!this.scene) {
                return;
            }

            requestAnimationFrame(() => {
                return this.draw();
            });
            Engine.update(this.engine, timeDelta);

            return this.engine.render.controller.world(this.engine);
        }

        /**
         * Set up the GUI for MatterTools
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
        }

        /**
         * Set the events for the World to respond to remove/add
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
        }

        /**
         * Set the Engine's events during collisions
         */
        setCollisionEvents() {
            // Collision Events
            Events.on(this.engine, 'collisionStart', (event) => {
                var pairs = event.pairs;
                for (let q = 0; q < pairs.length; q++) {
                    let pair  = pairs[q],
                        bodyA = Composite.get(this.engine.world, pair.bodyA.id, 'body'),
                        bodyB = Composite.get(this.engine.world, pair.bodyB.id, 'body');
                    if (bodyA && bodyB) {
                        // let bodyAdata = `${bodyA.label} (${Math.round(bodyA.position.x)}:${Math.round(bodyA.position.y)})`,
                        //     bodyBdata = `${bodyB.label} (${Math.round(bodyB.position.x)}:${Math.round(bodyB.position.y)})`;
                        // console.log(`collisionStart ${bodyAdata}->${bodyBdata}`);
                        // if (!bodyA.isStatic && !bodyB.isStatic) {
                        //     let bodyBisEdible = (bodyB.label === 'Nom' || bodyB.label === 'Gnar'),
                        //         bodyAisAgent  = (bodyA.label === 'Agent');
                        //
                        //     if (bodyAisAgent && bodyBisEdible) {
                        //         bodyA.entity.digestion += bodyB.label === 'Nom' ? 1 : -1;
                        //         World.remove(this.engine.world, bodyB);
                        //         this.engine.render.container.removeChild(bodyB.entity.graphics);
                        //     }
                        // } else if (bodyA.isStatic || bodyB.isStatic) {
                        //
                        // }
                    }
                }
            });

            Events.on(this.engine, 'collisionActive', (event) => {
                var pairs = event.pairs;
                for (let q = 0; q < pairs.length; q++) {
                    let pair  = pairs[q],
                        bodyA = Composite.get(this.engine.world, pair.bodyA.id, 'body'),
                        bodyB = Composite.get(this.engine.world, pair.bodyB.id, 'body');//,
                    //     bodyAdata = `${bodyA.label} (${Math.round(bodyA.position.x)}:${Math.round(bodyA.position.y)})`,
                    //     bodyBdata = `${bodyB.label} (${Math.round(bodyB.position.x)}:${Math.round(bodyB.position.y)})`;
                    // console.log(`collisionActive ${bodyAdata}->${bodyBdata}`);
                }
            });

            Events.on(this.engine, 'collisionEnd', (event) => {
                var pairs = event.pairs;
                for (let q = 0; q < pairs.length; q++) {
                    let pair  = pairs[q],
                        bodyA = Composite.get(this.engine.world, pair.bodyA.id, 'body'),
                        bodyB = Composite.get(this.engine.world, pair.bodyB.id, 'body');//,
                    //     bodyAdata = `${bodyA.label} (${Math.round(bodyA.position.x)}:${Math.round(bodyA.position.y)})`,
                    //     bodyBdata = `${bodyB.label} (${Math.round(bodyB.position.x)}:${Math.round(bodyB.position.y)})`;
                    // console.log(`collisionEnd ${bodyAdata}->${bodyBdata}`);
                }
            });
        }

        /**
         * Set the timing based events ticks/updates
         */
        setEngineEvents() {
            // Tick Events
            Events.on(this.runner, 'beforeTick', (event) => {
                let bodies = Composite.allBodies(this.engine.world);
                for (let i = 0; i < bodies.length; i++) {
                    let body = bodies[i];
                    if (!body.isStatic) {
                        if (body.speed > 2) {
                            body.speed = body.entity.speed;
                        }
                        if (body.velocity.x <= -2 || body.velocity.x >= 2) {
                            body.entity.force.x = body.entity.speed * 0.00025;
                        }
                        if (body.velocity.y <= -2 || body.velocity.y >= 2) {
                            body.entity.force.y = body.entity.speed * 0.00025;
                        }
                        if (body.position.x > this.engine.world.bounds.max.x) {
                            body.position.x = this.engine.world.bounds.max.x - 1;
                            body.entity.force.x = -body.entity.speed * 0.00025;
                        }
                        if (body.position.x < this.engine.world.bounds.min.x) {
                            body.position.x = this.engine.world.bounds.min.x + 1;
                            body.entity.force.x = body.entity.speed * 0.00025;
                        }
                        if (body.position.y > this.engine.world.bounds.max.y) {
                            body.position.y = this.engine.world.bounds.max.y - 1;
                            body.entity.force.y = -body.entity.speed * 0.00025;
                        }
                        if (body.position.y < this.engine.world.bounds.min.y) {
                            body.position.y = this.engine.world.bounds.min.y + 1;
                            body.entity.force.y = body.entity.speed * 0.00025;
                        }
                    }
                }
            });

            Events.on(this.runner, 'tick', (event) => {
                let bodies = Composite.allBodies(this.engine.world);
                for (let i = 0; i < bodies.length; i++) {
                    if (!bodies[i].isStatic) {
                        bodies[i].entity.tick(this.engine);
                    }
                }
            });

            Events.on(this.runner, 'afterTick', (event) => {
                // let bodies = Composite.allBodies(this.engine.world);
                // for (let i = 0; i < bodies.length; i++) {
                //     var body = bodies[i];
                //     if (!body.isStatic) {
                //         if (body.speed > 2) {
                //             body.speed = body.entity.speed;
                //         }
                //         if (body.velocity.x <= -2 || body.velocity.x >= 2) {
                //             body.entity.force.x = body.speed * 0.0025;
                //         }
                //         if (body.velocity.y <= -2 || body.velocity.y >= 2) {
                //             body.entity.force.y = body.speed * 0.0025;
                //         }
                //     }
                // }
            });

            // Engine Update Events
            Events.on(this.runner, 'beforeUpdate', (event) => {

            });

            Events.on(this.runner, 'afterUpdate', (event) => {

            });

            // Render Events
            Events.on(this.runner, 'beforeRender', (event) => {

            });

            Events.on(this.runner, 'afterRender', (event) => {

            });
        }
    }

    MatterWorld.SceneFactory = {
        addMatter: function (items) {
            for (let i = 0, len = items.length; i < len; i++) {
                let item = items[i];
                World.add(this.engine.world, [item]);
                this.engine.render.container.addChild(item.entity.graphics);
                this.children.push(item);
            }

            return this.children;
        },
        create: function (engine) {
            this.children = [];
            this.engine = engine;

            return this;
        },
        createAgents: function (number = 1) {
            let agents = [];
            for (let k = 0; k < number; k++) {
                agents.push(this.createAgent());
            }

            return agents;
        },
        createAgent: function () {
            let agentOpts = {
                    brainType: 'RLDQN',
                    worker: false,
                    numEyes: 30,
                    numTypes: 5,
                    numActions: 4,
                    numStates: 30 * 5,
                    env: {
                        getNumStates: function () {
                            return 30 * 5;
                        },
                        getMaxNumActions: function () {
                            return 4;
                        },
                        startState: function () {
                            return 0;
                        }
                    },
                    range: 120,
                    proximity: 120
                },
                matterOpts = {
                    friction: 0,
                    frictionAir: Utility.randf(0.0, 0.9),
                    frictionStatic: 0,
                    restitution: 0,
                    density: Utility.randf(0.001, 0.01)
                },
                x = Utility.randi(10, this.engine.render.bounds.max.x - 10),
                y = Utility.randi(10, this.engine.render.bounds.max.y - 10),
                color = Common.shadeColor(blueColor, -20),
                agent = AgentFactory.create(x, y, color, agentOpts, matterOpts);

            this.engine.render.container.addChild(agent.agent.shape);

            return agent;
        },
        createFireballs: function (number = 1) {
            let flames = [];
            for (let i = 0; i < 10; i++) {
                flames.push(this.createFireball(
                    Common.choose([14, 20, 28, 30, 34, 58, 124, 140, 154, 160, 170, 174]),
                    Common.choose([14, 20, 28, 30, 34, 58, 124, 140, 154, 160, 170, 174]),
                    Common.choose([0xff0000, 0xff5500, 0xffff00, 0x00ff00, 0x0000ff, 0xff00ff]))
                );
            }

            return flames;
        },
        createFireball: function (x, y, color) {
            var fireball = FireballFactory.create(x, y, color);
            this.engine.render.container.addChild(fireball.graphics);

            return fireball;
        },
        createPlatforms: function (number = 1) {
            return [
                this.createPlatform(200, 240, 150, 30, 12),
                this.createPlatform(10, 330, 100, 30, 32),
                this.createPlatform(200, 450, 400, 30, -4),
                this.createPlatform(200, 640, 250, 30, 4)
            ];
        },
        createPlatform: function (x, y, width, height, rotationDeg) {
            var platform = PlatformFactory.create(x, y, width, height, rotationDeg * Math.PI / 180);
            this.engine.render.container.addChild(platform.graphics);

            return platform;
        }
    };

    MatterWorld.Utils = {
        rotateVertices: function (vertices, rotationRad) {
            var results = [];
            for (let i = 0, len = vertices.length; i < len; i++) {
                let vertex = vertices[i],
                    x      = vertex.x,
                    y      = vertex.y;
                vertex.x = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
                vertex.y = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);
                results.push(vertex.y);
            }

            return results;
        },
        createOrb: function (radius, edgeCount = 10) {
            var vertices = [];
            for (let index = 0, i = 0, ref = edgeCount; 0 <= ref ? i < ref : i > ref; index = 0 <= ref ? ++i : --i) {
                let angleRad = ((Math.PI * 2) / (edgeCount - 1)) * index,
                    x        = Math.cos(angleRad) * radius,
                    y        = Math.sin(angleRad) * radius;
                vertices.push({
                    x: x,
                    y: y
                });
            }
            return vertices;
        }
    };
    global.MatterWorld = MatterWorld;

}(this));
