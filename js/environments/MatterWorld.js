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
        container       = document.body.querySelector('.canvas-container'),
        defaultCategory = 0x0001,
        redCategory     = 0x0002,
        greenCategory   = 0x0004,
        blueCategory    = 0x0008,
        redColor        = '#C44D58',
        blueColor       = '#4ECDC4',
        greenColor      = '#C7F464';

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
        constructor(width = 800, height = 800) {
            this.width = width;
            this.height = height;
            this.clock = 0;
            this.agents = [];

            this.engineOpts = {
                enabled: true,
                enableSleeping: false,
                metrics: {
                    extended: true
                },
                world: {
                    gravity: {
                        y: 0,
                        x: 0
                    }
                },
                render: {
                    options: {
                        width: width,
                        height: height,
                        background: '#000',
                        enabled: true,
                        wireframes: false,
                        wireframeBackground: '#222',
                        showAngleIndicator: true,
                        showAxes: false,
                        showSleeping: false,
                        showBounds: false,
                        showBroadphase: false,
                        showCollisions: true,
                        showConvexHulls: false,
                        showDebug: false,
                        showIds: false,
                        showInternalEdges: false,
                        showPositions: false,
                        showShadows: false,
                        showSeparations: false,
                        showVelocity: false,
                        showVertexNumbers: false
                    }
                }
            };

            this.engine = Engine.create(container, this.engineOpts);
            this.canvas = this.engine.render.canvas;
            // add a mouse controlled constraint
            this.mouseConstraint = MouseConstraint.create(this.engine);
            // pass mouse to renderer to enable showMousePosition
            this.engine.render.mouse = this.mouseConstraint.mouse;
            World.add(this.engine.world, this.mouseConstraint);

            if (useTools) {
                this.useInspector = useInspector;
                this.isMobile = isMobile;
                // create a Matter.Gui
                this.gui = Gui.create(this.engine);
                this.initControls(this.gui);
                Gui.update(this.gui);
            }

            // Ground
            var buffer   = 2,
                wallOpts = {
                    isStatic: true,
                    render: {
                        visible: false
                    },
                    label: 'Wall'
                };
            World.addBody(this.engine.world, Bodies.rectangle(buffer, this.height / 2, buffer, this.height * buffer, wallOpts));
            World.addBody(this.engine.world, Bodies.rectangle(this.width / 2, buffer, this.height * buffer, buffer, wallOpts));
            World.addBody(this.engine.world, Bodies.rectangle(this.width - buffer, this.height / 2, buffer, this.height * buffer, wallOpts));
            World.addBody(this.engine.world, Bodies.rectangle(this.width / 2, this.height, this.width * buffer, buffer, wallOpts));

            this.agents = this.addAgents(1);
            this.addEntities(50);

            if (document.getElementById('flotreward')) {
                this.rewards = new FlotGraph(this.agents);
            }

            this.runner = Engine.run(this.engine);

            this.setRunnerEvents();
            this.setCollisionEvents();
            this.setWorldEvents();

            return this;
        }

        /**
         * Add new agents
         * @parameter {number} number
         * @returns {Array}
         */
        addAgents(number = 1) {
            let agents = [];
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
                        // collisionFilter: {
                        //     category: blueCategory,
                        //     mask: defaultCategory | greenCategory | redCategory
                        // },
                        position: {
                            x: Utility.randi(4, this.width - 4),
                            y: Utility.randi(4, this.height - 4)
                        },
                        render: {
                            strokeStyle: Common.shadeColor(blueColor, -20),
                            fillStyle: blueColor
                        },
                        friction: 0,//Utility.randf(0.0, 0.9),
                        frictionAir: Utility.randf(0.0, 0.9),
                        frictionStatic: 0,//Utility.randf(0.0, 10.0),
                        restitution: 0,//Utility.randf(0.1, 0.9),
                        density: Utility.randf(0.001, 0.01)
                    },
                    body      = Bodies.circle(entityOpt.position.x, entityOpt.position.y, 10, entityOpt),
                    entity    = new PhysicalAgent(body, agentOpts);

                Body.set(body, 'entity', entity);
                World.add(this.engine.world, body);
                agents.push(entity);
            }

            return agents;
        }

        /**
         * Add new entities
         * @parameter {number} number
         * @returns {MatterWorld}
         */
        addEntities(number = 1) {
            // Populating the world
            for (let k = 0; k < number; k++) {
                let body, entity,
                    entityOpt = {
                        chamfer: {
                            radius: 0
                        },
                        // collisionFilter: {
                        //     category: redCategory,
                        //     mask: defaultCategory// | greenCategory | redCategory | blueCategory
                        // },
                        position: {
                            x: Utility.randi(4, this.width - 4),
                            y: Utility.randi(4, this.height - 4)
                        },
                        friction: Utility.randf(0.0, 0.9),
                        frictionAir: Utility.randf(0.0, 0.9),
                        frictionStatic: Utility.randf(0.0, 10.0),
                        restitution: Utility.randf(0.1, 0.9),
                        density: Utility.randf(0.001, 0.01)
                    },
                    type      = Utility.randi(1, 3);
                if (type === 1) {
                    // entityOpt.collisionFilter.category = redCategory;
                    entityOpt.render = {
                        strokeStyle: Common.shadeColor(redColor, -20),
                        fillStyle: redColor
                    };
                    body = Bodies.circle(entityOpt.position.x, entityOpt.position.y, 10, entityOpt);
                } else {
                    // entityOpt.collisionFilter.category = greenCategory;
                    entityOpt.chamfer.radius = 30;
                    entityOpt.render = {
                        strokeStyle: Common.shadeColor(greenColor, -20),
                        fillStyle: greenColor
                    };
                    body = Bodies.polygon(entityOpt.position.x, entityOpt.position.y, 8, 10, entityOpt);
                }
                entity = new PhysicalEntity(type, body);
                Body.set(body, 'entity', entity);
                World.add(this.engine.world, body);
            }

            return this;
        }

        /**
         * Set up the GUI for MatterTools
         * @param gui
         */
        initControls(gui) {
            let self = this;

            // need to add mouse constraint back in after gui clear or load is pressed
            Events.on(gui, 'clear load', function () {
                // add a mouse controlled constraint
                self.mouseConstraint = MouseConstraint.create(self.engine);
                World.add(self.engine.world, self.mouseConstraint);

                // pass mouse to renderer to enable showMousePosition
                self.engine.render.mouse = self.mouseConstraint.mouse;

                World.add(self.engine.world, self.mouseConstraint);
            });

            // need to rebind mouse on render change
            Events.on(gui, 'setRenderer', function () {
                Mouse.setElement(self.mouseConstraint.mouse, self.engine.render.canvas);
            });

            // create a Matter.Inspector
            if (Inspector && this.useInspector) {
                this.inspector = Inspector.create(self.engine);

                Events.on(this.inspector, 'import', function () {
                    self.mouseConstraint = MouseConstraint.create(self.engine);
                    World.add(self.engine.world, self.mouseConstraint);
                });

                Events.on(this.inspector, 'play', function () {
                    self.mouseConstraint = MouseConstraint.create(self.engine);
                    World.add(self.engine.world, self.mouseConstraint);
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
            // Add Events
            Events.on(this.engine.world, 'beforeAdd', function (event) {

            });

            Events.on(this.engine.world, 'afterAdd', function (event) {

            });

            // Remove Events
            Events.on(this.engine.world, 'beforeRemove', function (event) {

            });

            Events.on(this.engine.world, 'afterRemove', function (event) {

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
                    if (!pairs[q].bodyA.isStatic && !pairs[q].bodyB.isStatic) {
                        if (pairs[q].bodyA.label === 'Agent' && (pairs[q].bodyB.label === 'Nom' || pairs[q].bodyB.label === 'Gnar')) {
                            let body = Composite.get(self.engine.world, pairs[q].bodyB.id, 'body');
                            if (body) {
                                pairs[q].bodyA.entity.digestion += pairs[q].bodyB.label === 'Nom' ? 1 : -1;
                                World.remove(self.engine.world, body);
                                self.addEntities();
                            }
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
                for (let i = 0; i < self.engine.world.bodies.length; i++) {
                    if (!self.engine.world.bodies[i].isStatic) {
                        self.engine.world.bodies[i].entity.tick(self);
                    }
                }
            });

            Events.on(this.runner, 'afterTick', function (event) {

            });

            // Engine Update Events
            Events.on(this.runner, 'beforeUpdate', function (event) {

            });

            Events.on(this.runner, 'afterUpdate', function (event) {
                let bodies = Composite.allBodies(self.engine.world);
                World.clear(self.engine.world);
                Pairs.clear(self.engine.pairs);
                World.add(self.engine.world, bodies);
                World.add(self.engine.world, self.mouseConstraint);
            });

            // Render Events
            Events.on(this.runner, 'beforeRender', function (event) {

            });

            Events.on(this.runner, 'afterRender', function (event) {
                for (let i = 0; i < self.agents.length; i++) {
                    self.agents[i].draw(self);
                }
                if (self.rewards) {
                    self.rewards.graphRewards();
                }
            });
        }
    }

    global.MatterWorld = MatterWorld;

}(this));
