var Matter = Matter || {},
    Utility = Utility || {},
    MatterEntity = MatterEntity || {};

(function (global) {
    "use strict";

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
            var self = this,
                Bodies = Matter.Bodies,
                Body = Matter.Body,
                Engine = Matter.Engine,
                Events = Matter.Events,
                Mouse = Matter.Mouse,
                Vector = Matter.Vector,
                Vertices = Matter.Vertices,
                World = Matter.World,
                container = document.body.querySelector('.game-container');

            this.width = width;
            this.height = height;
            this.bodies = [];
            this.population = new Map();

            this.renderOpts = {
                background: '#fafafa',
                enabled: true,
                enableSleeping: false,
                hasBounds: false,
                width: width,
                height: height,
                wireframeBackground: '#222',
                wireframes: true,
                showAngleIndicator: true,
                showAxes: true,
                showSleeping: true,
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
                showVelocity: true,
                showVertexNumbers: false,
                positionIterations: 10,
                velocityIterations: 30,
                metrics: {
                    extended: true
                }
            };

            this.engine = Engine.create(container, this.renderOpts);
            this.engine.timing.isFixed = true;
            this.engine.timing.timeScale = 1;
            this.engine.world.gravity.y = 0;
            this.engine.world.gravity.x = 0;

            this.runner = Engine.run(this.engine);
            this.canvas = this.engine.render.canvas;
            this.mouse = Mouse.create(this.canvas);

            // Ground
            var offset = 5;
            this.bodies.push(Bodies.rectangle(400, -offset, 800.5 + 2 * offset, 50.5, {isStatic: true}));
            this.bodies.push(Bodies.rectangle(400, 600 + offset, 800.5 + 2 * offset, 50.5, {isStatic: true}));
            this.bodies.push(Bodies.rectangle(800 + offset, 300, 50.5, 600.5 + 2 * offset, {isStatic: true}));
            this.bodies.push(Bodies.rectangle(-offset, 300, 50.5, 600.5 + 2 * offset, {isStatic: true}));

            // Entities
            this.addEntities(150);

            // Events.on(self.engine, 'tick', function () {
            //     for (let i = 0; i < self.bodies.length; i++) {
            //         var body = self.bodies[i];
            //         Body.applyForce(body, body.position, body.velocity);
            //     }
            // });

            // Events.on(self.engine, 'beforeUpdate', function () {
            //     for (let i = 0; i < self.bodies.length; i++) {
            //         var body = self.bodies[i];
            //     }
            // });

            // Events.on(self.engine, 'afterUpdate', function () {
            //     for (let i = 0; i < self.bodies.length; i++) {
            //         var body = self.bodies[i];
            //     }
            // });

            // Events.on(self.engine, 'collisionActive', function () {
            //     for (let i = 0; i < self.bodies.length; i++) {
            //         var body = self.bodies[i];
            //     }
            // });

            // Events.on(self.engine, 'collisionStart', function () {
            //     for (let i = 0; i < self.bodies.length; i++) {
            //         var body = self.bodies[i];
            //     }
            // });

            // Events.on(self.engine, 'collisionEnd', function () {
            //     for (let i = 0; i < self.bodies.length; i++) {
            //         var body = self.bodies[i];
            //     }
            // });

            World.add(this.engine.world, this.bodies);

            return this;
        }

        /**
         * Add new entities
         * @parameter {number} number
         * @returns {World}
         */
        addEntities(number) {
            if (number === undefined) {
                number = 1;
            }
            // Populating the world
            for (let k = 0; k < number; k++) {
                let entityOpt = {
                        x: Utility.randi(15, this.width - 15),
                        y: Utility.randi(15, this.height - 15),
                        velocity: {
                            x: Utility.randf(-0.005, 0.005),
                            y: Utility.randf(-0.005, 0.005)
                        },
                        mass: 0.000,
                        angle: Utility.randf(0, 3.145),
                        frictionAir: 0.000,
                        restitution: 0.0,
                        density: 1
                    },
                    circle = Matter.Bodies.circle(entityOpt.x, entityOpt.y, 15, entityOpt),
                    entity = new MatterEntity('Nom', circle);

                this.bodies.push(entity.body);
                this.population.set(entity.id, entity);
            }

            return this;
        }

        /**
         * Remove the entity from the world
         * @param {string} id
         * @returns {World}
         */
        deleteEntity(id) {
            if (this.population.has(id)) {
                this.population.delete(id);
            }
            return this;
        }
    }

    var concave = function (World) {
        var arrow = Vertices.fromPath('40 0 40 20 100 20 100 80 40 80 40 100 0 50'),
            chevron = Vertices.fromPath('100 0 75 50 100 100 25 100 0 50 25 0'),
            star = Vertices.fromPath('50 0 63 38 100 38 69 59 82 100 50 75 18 100 31 59 0 38 37 38'),
            horseShoe = Vertices.fromPath('35 7 19 17 14 38 14 58 25 79 45 85 65 84 65 66 46 67 34 59 30 44 33 29 45 23 66 23 66 7 53 7');

        var stack = Composites.stack(50, 50, 6, 4, 10, 10, function (x, y, column, row) {
            var color = Common.choose(['#556270', '#4ECDC4', '#C7F464', '#FF6B6B', '#C44D58']);
            return Bodies.fromVertices(x, y, Common.choose([arrow, chevron, star, horseShoe]), {
                render: {
                    fillStyle: color,
                    strokeStyle: color
                }
            }, true);
        });

        World.add(_world, stack);
    };

    var collisionFiltering = function () {
        // define our categories
        // (as bit fields, there are up to 32 available)
        var defaultCategory = 0x0001,
            redCategory = 0x0002,
            greenCategory = 0x0004,
            blueCategory = 0x0008;

        var redColor = '#C44D58',
            blueColor = '#4ECDC4',
            greenColor = '#C7F464';

        // create a stack with varying body categories
        // (but these bodies can all collide with each other)
        World.add(_world,
            Composites.stack(275, 150, 5, 10, 10, 10, function (x, y, column, row) {
                var category = redCategory,
                    color = redColor;

                if (row > 5) {
                    category = blueCategory;
                    color = blueColor;
                } else if (row > 2) {
                    category = greenCategory;
                    color = greenColor;
                }

                return Bodies.circle(x, y, 20, {
                    collisionFilter: {
                        category: category
                    },
                    render: {
                        strokeStyle: color,
                        fillStyle: 'transparent'
                    }
                });
            })
        );

        // this body will only collide with the walls and the green bodies
        World.add(_world,
            Bodies.circle(310, 40, 30, {
                collisionFilter: {
                    mask: defaultCategory | greenCategory
                },
                render: {
                    strokeStyle: Common.shadeColor(greenColor, -20),
                    fillStyle: greenColor
                }
            })
        );

        // this body will only collide with the walls and the red bodies
        World.add(_world,
            Bodies.circle(400, 40, 30, {
                collisionFilter: {
                    mask: defaultCategory | redCategory
                },
                render: {
                    strokeStyle: Common.shadeColor(redColor, -20),
                    fillStyle: redColor
                }
            })
        );

        // this body will only collide with the walls and the blue bodies
        World.add(_world,
            Bodies.circle(480, 40, 30, {
                collisionFilter: {
                    mask: defaultCategory | blueCategory
                },
                render: {
                    strokeStyle: Common.shadeColor(blueColor, -20),
                    fillStyle: blueColor
                }
            })
        );

        // red category objects should not be draggable with the mouse
        _mouseConstraint.collisionFilter.mask = defaultCategory | blueCategory | greenCategory;

        var renderOptions = _engine.render.options;
        renderOptions.wireframes = false;
        renderOptions.background = '#222';
        renderOptions.showAngleIndicator = false;
    };

    global.MatterWorld = MatterWorld;

}(this));
