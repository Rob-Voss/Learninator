var Matter = Matter || {},
    Utility = Utility || {},
    PhysicalEntity = PhysicalEntity || {};

(function (global) {
    "use strict";

    // Matter aliases
    var Engine = Matter.Engine,
        World = Matter.World,
        Bodies = Matter.Bodies,
        Body = Matter.Body,
        Composite = Matter.Composite,
        Composites = Matter.Composites,
        Common = Matter.Common,
        Constraint = Matter.Constraint,
        Events = Matter.Events,
        Bounds = Matter.Bounds,
        Vector = Matter.Vector,
        Vertices = Matter.Vertices,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        Query = Matter.Query,
        Svg = Matter.Svg,
        container = document.body.querySelector('.game-container');

    // MatterTools aliases
    if (window.MatterTools) {
        var useTools = true,
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
            this.bodies = [];
            this.population = new Map();
            if (useTools) {
                this.useInspector = useInspector;
                this.isMobile = isMobile;
            }

            this.engineOpts = {
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
                        background: '#ffffff',
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
            var buffer = 1,
                wallOpts = {isStatic: true, render: {strokeStyle: '#555', fillStyle: '#555'}},
                top = Bodies.rectangle(this.width / 2, buffer, this.height - buffer, buffer, wallOpts),
                bottom = Bodies.rectangle(this.width / 2, this.height - buffer, this.width - buffer, buffer, wallOpts),
                left = Bodies.rectangle(buffer, this.height / 2, buffer, this.height - buffer, wallOpts),
                right = Bodies.rectangle(this.width - buffer, this.height / 2, buffer, this.height - buffer, wallOpts);

            this.bodies.push(left);
            this.bodies.push(top);
            this.bodies.push(right);
            this.bodies.push(bottom);

            // this.addAgents(1);
            // this.setCollisionFiltering();
            this.addEntities(25);
            this.setEvents();

            World.add(this.engine.world, this.bodies);

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
        addAgents(number) {
            if (number === undefined) {
                number = 1;
            }
            // Populating the world
            for (let k = 0; k < number; k++) {
                let entityOpt = {
                        angle: -Math.PI * Utility.randf(0, 1),
                        position: {
                            x: Utility.randi(4, this.height - 4),
                            y: Utility.randi(4, this.height - 4)
                        }
                    },
                    size = Utility.randi(5, 15),
                    type = Utility.randi(1, 3),
                    circle = Matter.Bodies.circle(entityOpt.x, entityOpt.y, size, entityOpt),
                    entity = new PhysicalAgent(type, circle);

                this.bodies.push(entity.body);
                this.population.set(entity.id, entity);
            }

            return this;
        }

        /**
         * Add new entities
         * @parameter {number} number
         * @returns {MatterWorld}
         */
        addEntities(number) {
            if (number === undefined) {
                number = 1;
            }
            // Populating the world
            for (let k = 0; k < number; k++) {
                let entityOpt = {
                        angle: 0,
                        position: {
                            x: Utility.randi(4, this.height - 4),
                            y: Utility.randi(4, this.height - 4)
                        },
                        frictionAir: Utility.randf(0.001, 0.1),
                        friction: Utility.randf(0.0001, 0.1),
                        restitution: Utility.randf(0.1, 0.9),
                        mass: 0.000,
                        density: 1
                    },
                    size = Utility.randi(10, 15),
                    type = Utility.randi(1, 3),
                    body = Matter.Bodies.circle(entityOpt.x, entityOpt.y, size, entityOpt),
                    entity = new PhysicalEntity(type, body);
                Body.setAngle(body, -Math.PI * 0.26);
                Body.setAngularVelocity(body, 0.2);

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
         *
         */
        setEvents() {
            let self = this,
                counter = 0,
                action = 0;

            var moveAction = function(body) {
                let speed = Utility.randi(0, 5),
                    velocity = getRandomForce(body);

                // Execute agent's desired action
                switch (action) {
                    case 0: // Left
                        velocity.x += -speed;
                        break;
                    case 1: // Right
                        velocity.x += speed;
                        break;
                    case 2: // Up
                        velocity.y += -speed;
                        break;
                    case 3: // Down
                        velocity.y += speed;
                        break;
                }

                // Forward the agent by velocity
                velocity.x *= 0.95;
                velocity.y *= 0.95;
                Body.setVelocity(body, velocity);
            };

            /**
             * Using the Body's mass return a random force
             * @param {Body} body
             * @returns {{x: number, y: number}}
             */
            var getRandomForce = function(body) {
                let forceMagnitude = 0.01 * body.mass,
                    fx = (forceMagnitude + Common.random() * forceMagnitude) * Common.choose([1, -1]),
                    fv = -forceMagnitude + Common.random() * -forceMagnitude;

                return {x: fx, y: fv};
            };

            Events.on(this.engine, 'tick', function (event) {
                counter += 1;
                if (self.mouseConstraint.mouse.button !== -1) {
                    // console.log(self.mouseConstraint.mouse.button);
                }

                for (let i = 0; i < self.bodies.length; i++) {
                    let body = self.bodies[i];

                    if (!body.isStatic) {
                        // every 1.5 sec
                        if (counter >= 60 * 1.5) {
                            action = Utility.randi(0, 4);
                        }
                        Body.setAngularVelocity(body, 0.02);
                        // moveAction(body);
                    }
                }
            });

            Events.on(this.engine, 'beforeUpdate', function (event) {
                // for (let i = 0; i < self.bodies.length; i++) {
                //     let body = self.bodies[i],
                //         px = body.position.x * Math.sin(self.engine.timing.timestamp * 0.002),
                //         py = body.position.y * Math.sin(self.engine.timing.timestamp * 0.003);
                //
                //     if (!body.isStatic) {
                //         Body.setVelocity(body, {x: px - body.position.x, y: py - body.position.y});
                //         Body.setAngularVelocity(body, 0.02);
                //         Body.setPosition(body, {x: px - body.position.x, y: py - body.position.y});
                //         Body.rotate(body, 0.02);
                //     }
                // }

            });

            Events.on(this.engine, 'afterUpdate', function (event) {
                // for (let i = 0; i < self.bodies.length; i++) {
                //     let body = self.bodies[i];
                // }
            });

            Events.on(this.engine, 'collisionStart', function (event) {
                var pairs = event.pairs;

                // change object colours to show those starting a collision
                for (let q = 0; q < pairs.length; q++) {
                    var pair = pairs[q];
                    pair.bodyA.render.fillStyle = '#bbbbbb';
                    pair.bodyB.render.fillStyle = '#bbbbbb';
                }
            });

            Events.on(this.engine, 'collisionActive', function (event) {
                var pairs = event.pairs;

                // change object colours to show those in an active collision (e.g. resting contact)
                for (var q = 0; q < pairs.length; q++) {
                    var pair = pairs[q];
                    pair.bodyA.render.fillStyle = '#aaaaaa';
                    pair.bodyB.render.fillStyle = '#aaaaaa';
                }
            });

            Events.on(this.engine, 'collisionEnd', function (event) {
                var pairs = event.pairs;

                // change object colours to show those ending a collision
                for (var q = 0; q < pairs.length; q++) {
                    var pair = pairs[q];
                    pair.bodyA.render.fillStyle = pair.bodyA.color;
                    pair.bodyB.render.fillStyle = pair.bodyB.color;
                }
            });
        }

        setCollisionFiltering() {
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
            World.add(this.engine.world,
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
            World.add(this.engine.world,
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
            World.add(this.engine.world,
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
            World.add(this.engine.world,
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
        }
    }

    global.MatterWorld = MatterWorld;

}(this));
