var Utility = Utility || {},
    PhysicalAgent = PhysicalAgent || {},
    PhysicalEntity = PhysicalEntity || {};

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
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        Query = Matter.Query,
        Runner = Matter.Runner,
        Svg = Matter.Svg,
        Vector = Matter.Vector,
        Vertices = Matter.Vertices,
        container = document.body.querySelector('.canvas-container'),
        defaultCategory = 0x0001,
        redCategory = 0x0002,
        greenCategory = 0x0004,
        blueCategory = 0x0008,
        redColor = '#C44D58',
        blueColor = '#4ECDC4',
        greenColor = '#C7F464';

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
         * @returns {MatterWorld}
         */
        constructor(width = 800, height = 800) {
            this.width = width;
            this.height = height;
            this.clock = 0;
            this.bodies = [];
            this.population = new Map();
            if (useTools) {
                this.useInspector = useInspector;
                this.isMobile = isMobile;
            }

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
                        background: '#222',
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
                        showDebug: true,
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
            World.add(this.engine.world, this.mouseConstraint);

            // pass mouse to renderer to enable showMousePosition
            this.engine.render.mouse = this.mouseConstraint.mouse;

            // Ground
            var buffer = 2,
                wallOpts = {
                    isStatic: true,
                    render: {
                        visible: false
                    }
                };
            World.add(this.engine.world, Bodies.rectangle(buffer, this.height / 2, buffer, this.height * buffer, wallOpts));
            World.add(this.engine.world, Bodies.rectangle(this.width / 2, buffer, this.height * buffer, buffer, wallOpts));
            World.add(this.engine.world, Bodies.rectangle(this.width - buffer, this.height / 2, buffer, this.height * buffer, wallOpts));
            World.add(this.engine.world, Bodies.rectangle(this.width / 2, this.height, this.width * buffer, buffer, wallOpts));

            // Water
            var waterBlockOpts = {
                    isStatic: true,
                    render: {
                        fillStyle: '#fff',
                        lineWidth: 0
                    }
                },
                waterBlock = Bodies.rectangle(this.width * 0.5, this.height * 1.5, this.width * 2, this.height, waterBlockOpts),
                particleWidth = 2,
                numParticles = Math.floor((this.engine.render.options.width) / (particleWidth + 2)),
                particleOpts = {
                    restitution: 0.7,
                    friction: 0.2,
                    frictionAir: 0,
                    density: 0.01,
                    render: {
                        fillStyle: '#fff',
                        lineWidth: 0,
                        strokeStyle: '#fff'
                    }
                },
                waterParticles = Composites.stack(0, h - 50, numParticles, 3, 0, 0, function(x, y, column, row) {
                    return Bodies.circle(x, y, particleWidth, particleOpts, 100);
                });
            World.add(this.engine.world, [waterParticles, waterBlock]);
            this.engine.render.options.background = '#000';
            this.engine.render.options.wireframes = false;

            // let agent = this.addAgents(1);
            // this.addEntities(20);
            this.setEvents();

            if (document.getElementById('flotreward')) {
                this.rewards = new FlotGraph([agent]);
            }

            this.runner = Engine.run(this.engine);

            // create a Matter.Gui
            if (useTools) {
                this.gui = Gui.create(this.engine);
                this.initControls(this.gui);
                Gui.update(this.gui);
            }

            return this;
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
                        friction: Utility.randf(0.0, 0.9),
                        frictionAir: Utility.randf(0.0, 0.9),
                        frictionStatic: Utility.randf(0.0, 10.0),
                        restitution: Utility.randf(0.1, 0.9),
                        density: Utility.randf(0.001, 0.01)
                    },
                    body = Bodies.circle(entityOpt.position.x, entityOpt.position.y, 10, entityOpt),
                    entity = new PhysicalAgent(body, agentOpts);

                this.population.set(body.label, entity);
                World.add(this.engine.world, body);

                return entity;
            }

            return this;
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
                            radius:0
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
                    type = Utility.randi(1, 3);
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

                this.population.set(body.label, entity);
                World.add(this.engine.world, body);
            }

            return this;
        }

        /**
         * Remove the entity from the world
         * @param {string} id
         * @returns {MatterWorld}
         */
        deleteEntity(id) {
            if (this.population.has(id)) {
                let entity = this.population.get(id);
                World.remove(this.engine.world, entity.body);
                this.population.delete(id);
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
         * Set the Events to listen for
         */
        setEvents() {
            let self = this,
                counter = 0;

            Events.on(this.engine, 'tick', function(event) {
                // counter += 1;
                // if (self.mouseConstraint.mouse.button !== -1) {
                //     // console.log(self.mouseConstraint.mouse.button);
                // }
                // if (counter >= 60 * 1) {
                //     counter = 0;
                // }
                // for (let [id, entity] of self.population.entries()) {
                //     if (counter === 0 && (entity.type === 1 || entity.type === 2)) {
                //         entity.action = Common.choose([0, 1, 2, 3]);
                //     }
                //     entity.tick(self);
                // }
                //
                // if (this.rewards) {
                //     this.rewards.graphRewards();
                // }
            });

            Events.on(this.engine.render, 'beforeRender', function(event) {

            });

            Events.on(this.engine.render, 'afterRender', function(event) {
                // for (let [id, entity] of self.population.entries()) {
                //     entity.draw(self);
                // }
            });

            Events.on(this.engine, 'beforeUpdate', function (event) {
                var bodies = particles.bodies;
                for (var i = 0; i < bodies.length; i++) {
                    var body = bodies[i];

                    if (!body.isStatic) {
                        Body.translate(body, {
                            x: Common.random(-1, 1) * 0.25,
                            y: Common.random(-1, 1) * 0.25
                        });
                    }
                }
            });

            Events.on(this.engine, 'afterUpdate', function (event) {

            });

            Events.on(this.engine, 'collisionStart', function (event) {
                // var pairs = event.pairs;
                // for (let q = 0; q < pairs.length; q++) {
                //     let pair = pairs[q];
                //     pair.bodyA.render.fillStyle = '#bbbbbb';
                //     pair.bodyB.render.fillStyle = '#bbbbbb';
                // }
            });

            Events.on(this.engine, 'collisionActive', function (event) {
                // var pairs = event.pairs;
                // for (let q = 0; q < pairs.length; q++) {
                //     let pair = pairs[q];
                //     if (!pair.bodyA.isStatic && !pair.bodyB.isStatic) {
                //         let entityA = self.population.get(pair.bodyA.label),
                //             entityB = self.population.get(pair.bodyB.label);
                //         if (entityA && entityB && entityA.type === 3 && (entityB.type === 1 || entityB.type === 2)) {
                //             entityA.digestion = entityB.type === 1 ? 1 : -1;
                //             self.deleteEntity(pair.bodyB.label);
                //             self.addEntities(2);
                //         }
                //     }
                // }
            });

            Events.on(this.engine, 'collisionEnd', function (event) {
                var pairs = event.pairs;
                for (let q = 0; q < pairs.length; q++) {
                    let pair = pairs[q];
                if (!pair.bodyA.isStatic && !pair.bodyB.isStatic) {
                    let entityA = self.population.get(pair.bodyA.label),
                        entityB = self.population.get(pair.bodyB.label);
                    if (entityA && entityB && entityA.type === 3 && (entityB.type === 1 || entityB.type === 2)) {
                        entityA.digestion += entityB.type === 1 ? 1 : -1;
                        self.deleteEntity(pair.bodyB.label);
                        self.addEntities();
                    }
                }
                }
            });
        }

    }

    global.MatterWorld = MatterWorld;

}(this));
