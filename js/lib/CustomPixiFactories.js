var FireballFactory, MainSceneFactory, PlatformFactory, FlameFactory,
    Utility = Utility || {};

(function () {

    FlameFactory = {
        /**
         * @param {number} x
         * @param {number} y
         * @param random
         * @param {number} count
         * @param color
         * @returns {{color: *, graphics: (PIXI.Graphics|i.Graphics|b.Graphics|c.Graphics), random: *, x: Object, y: Object, particles: *, update: state.update, position: Vec}}
         */
        create: function (x, y, random, count, color) {
            var state, graphics = new PIXI.Graphics;
            graphics.position.x = x;
            graphics.position.y = y;

            return state = {
                color: color,
                graphics: graphics,
                random: random,
                x: x,
                y: y,
                particles: FlameFactory.createParticles(count, random, color),
                update: function (options) {
                    return FlameFactory.update(state, options);
                },
                position: graphics.position
            };
        },
        /**
         *
         * @param state
         * @param options
         */
        update: function (state, options) {
            var color, deltaX, deltaY, graphics, i, index, len, particle, position, random, ref;
            if (options === null) {
                options = {};
            }
            graphics = state.graphics;
            random = state.random;
            position = state.position;
            color = state.color;
            if (options.mouse) {
                state.position.x = options.mouse.x;
                state.position.y = options.mouse.y;
            }
            graphics.clear();
            deltaX = state.position.x - state.x;
            deltaY = state.position.y - state.y;
            graphics.position.x = state.x = state.position.x;
            graphics.position.y = state.y = state.position.y;
            graphics.blendMode = PIXI.BLEND_MODES.SCREEN;
            ref = state.particles;
            for (index = i = 0, len = ref.length; i < len; index = ++i) {
                particle = ref[index];
                graphics.beginFill(particle.color);
                graphics.fillAlpha = Math.round(particle.remainingLife / particle.life * 100) * 0.01;
                graphics.drawCircle(particle.location.x, particle.location.y, particle.radius);
                particle.remainingLife--;
                particle.radius -= 0.5;
                particle.location.x += particle.speed.x - deltaX;
                particle.location.y += particle.speed.y - deltaY;
                if (particle.remainingLife < 0 || particle.radius < 2) {
                    FlameFactory.initParticle(state.particles[index], random, color);
                }
            }
            graphics.beginFill(color);

            return graphics.drawCircle(0, 0, 6);
        },
        /**
         *
         * @param particle
         * @param random
         * @param color
         * @returns {*}
         */
        initParticle: function (particle, random, color) {
            particle.speed = {
                x: (random() * 1) - 0.5,
                y: -(random() * 2)
            };
            particle.location = {x: 0, y: 0};
            particle.radius = 3 + random() + 4;
            particle.life = 20 + random() + 12;
            particle.remainingLife = particle.life;
            particle.color = color;

            return particle;
        },
        /**
         *
         * @param count
         * @param random
         * @param color
         * @returns {*}
         */
        createParticles: function (count, random, color) {
            var i, results;
            return (function () {
                results = [];
                for (var i = 0; 0 <= count ? i < count : i > count; 0 <= count ? i++ : i--) {
                    results.push(i);
                }

                return results;
            }).apply(this).map(function () {
                return FlameFactory.initParticle({}, random, color);
            });
        }
    };

    MainSceneFactory = {
        /**
         *
         * @param {number} seed
         * @param {Matter.Engine} engine
         * @returns {*|{children: Array, update: state.update, addMatter: state.addMatter, addMouseEvents: state.addMouseEvents, matter: Object}}
         */
        create: function (seed, engine) {
            var state;
            state = MatterEngine.SceneFactory.create(MainSceneFactory, engine);
            state.addMatter(MainSceneFactory.createPlatforms(engine.render.container));
            state.addMatter(MainSceneFactory.createFireballs(engine.render.container));

            return state;
        },
        /**
         *
         */
        update: function () {
        },
        /**
         * Add new agents
         * @parameter {number} number
         * @returns {MatterWorld}
         */
        createAgents: function (container, number = 1) {
            let agents = [];
            for (let k = 0; k < number; k++) {
                agents.push(MainSceneFactory.createAgent(container));
            }

            return agents;
        },
        /**
         *
         * @param container
         * @returns {*[]}
         */
        createFireballs: function (container) {
            let flames = [];
            for (let i = 0; i < 10; i++) {
                flames.push(MainSceneFactory.createFireball(container,
                    Matter.Common.choose([14, 20, 28, 30, 34, 58, 124, 140, 154, 160, 170, 174]),
                    Matter.Common.choose([14, 20, 28, 30, 34, 58, 124, 140, 154, 160, 170, 174]),
                    Matter.Common.choose([0xff0000, 0xff5500, 0xffff00, 0x00ff00, 0x0000ff, 0xff00ff]))
                );
            }

            return flames;
        },
        /**
         *
         * @param container
         * @returns {*[]}
         */
        createPlatforms: function (container) {
            return [
                MainSceneFactory.createPlatform(container, 200, 240, 150, 30, 12),
                MainSceneFactory.createPlatform(container, 10, 330, 100, 30, 32),
                MainSceneFactory.createPlatform(container, 200, 450, 300, 30, -4),
                MainSceneFactory.createPlatform(container, 200, 640, 250, 30, 4)
            ];
        },
        /**
         *
         * @param container
         * @returns {x}
         */
        createAgent: function (container) {
            var agentOpts = {
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
                x = Utility.randi(10, this.width - 10),
                y = Utility.randi(10, this.height - 10),
                color = Common.shadeColor('#4ECDC4', -20),
                agent = AgentFactory.create(x, y, color, agentOpts, matterOpts);

            container.addChild(agent.graphics);

            return agent;
        },
        /**
         *
         * @param container
         * @param x
         * @param y
         * @param width
         * @param height
         * @param rotationDeg
         * @returns {x|*}
         */
        createPlatform: function (container, x, y, width, height, rotationDeg) {
            var platform = PlatformFactory.create(x, y, width, height, rotationDeg * Math.PI / 180);
            container.addChild(platform.graphics);

            return platform;
        },
        /**
         *
         * @param container
         * @param x
         * @param y
         * @param color
         * @returns {x|*}
         */
        createFireball: function (container, x, y, color) {
            var fireball = FireballFactory.create(x, y, color);
            container.addChild(fireball.graphics);

            return fireball;
        },

        /**
         * Add new entities
         * @parameter {number} number
         * @returns {MatterWorld}
         */
        addEntities: function (container, number = 1) {
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
                            x: Utility.randi(10, this.width - 10),
                            y: Utility.randi(10, this.height - 10)
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
                        fillStyle: redColor
                    };
                    body = Bodies.circle(entityOpt.position.x, entityOpt.position.y, 10, entityOpt);
                } else {
                    entityOpt.collisionFilter.category = gnarCategory;
                    entityOpt.chamfer.radius = 30;
                    entityOpt.render = {
                        strokeStyle: Common.shadeColor(greenColor, -20),
                        fillStyle: greenColor
                    };
                    body = Bodies.polygon(entityOpt.position.x, entityOpt.position.y, 8, 10, entityOpt);
                }
                entity = new PhysicalEntity(type, body);

                Body.set(body, 'entity', entity);
                World.add(this.world, body);
            }

            return this;
        },

        /**
         * Add walls
         */
        addWalls: function () {
            // Ground
            var buffer   = 5,
                wallOpts = {isStatic: true, render: {visible: true}, label: 'Wall'};
            // Left
            World.addBody(this.world, Bodies.rectangle(buffer, this.height / 2, 2, this.height, wallOpts));
            // Top
            World.addBody(this.world, Bodies.rectangle(this.width / 2, buffer, this.width, 2, wallOpts));
            // Right
            World.addBody(this.world, Bodies.rectangle(this.width - buffer, this.height / 2, 2, this.height, wallOpts));
            // Bottom
            World.addBody(this.world, Bodies.rectangle(this.width / 2, this.height - buffer, this.width, 2, wallOpts));
        }

    };

    AgentFactory = {
        /**
         *
         * @param {number} x
         * @param {number} y
         * @param {string} color
         * @param {object} agentOpts
         * @param {object} matterOpts
         * @returns {{x: Object, y: Object, color: *, graphics: (i.Graphics|b.Graphics|c.Graphics), update: update, position: Vec}}
         */
        create: function (x, y, color, agentOpts, matterOpts) {
            var graphics = new PIXI.Graphics;
            graphics.position.x = x;
            graphics.position.y = y;

            return {
                x: x,
                y: y,
                color: color,
                graphics: graphics,
                update: function (options) {
                    return AgentFactory.update(state, options);
                },
                position: graphics.position
            };
        },
        create: function (x, y, color, agentOpts, matterOpts) {
            var radius = 10,
                graphics = new PIXI.Container(),
                state = {
                    x: x,
                    y: y,
                    color: color,
                    graphics: graphics,
                    update: function () {
                        return AgentFactory.update(state);
                    },
                    matterOptions: matterOpts
                };
            state.graphics.addChild(state.graphics);

            return state;
        }
    };

    PlatformFactory = {
        /**
         *
         * @param x
         * @param y
         * @param width
         * @param height
         * @param rotationRad
         * @returns {{x: Object, y: Object, width: *, height: *, rotationRad: *, graphics: (PIXI.Graphics|b.Graphics|i.Graphics|c.Graphics), update: state.update, vertices: *, matterOptions: {isStatic: boolean}}|*}
         */
        create: function (x, y, width, height, rotationRad) {
            var graphics, state, vertices;
            vertices = PlatformFactory.setVertices(width, height);
            MatterEngine.Utils.rotateVertices(vertices, rotationRad);
            graphics = new PIXI.Graphics();
            state = {
                x: x,
                y: y,
                width: width,
                height: height,
                rotationRad: rotationRad,
                graphics: graphics,
                update: function () {
                    return PlatformFactory.update(state);
                },
                vertices: vertices,
                matterOptions: {
                    isStatic: true
                }
            };
            PlatformFactory.draw(state);

            return state;
        },
        /**
         *
         */
        update: function () {
        },
        /**
         *
         * @param width
         * @param height
         * @returns {*[]}
         */
        setVertices: function (width, height) {
            var halfHeight, halfWidth;
            halfWidth = width / 2;
            halfHeight = height / 2;

            return [
                {
                    x: -halfWidth,
                    y: -halfHeight
                }, {
                    x: halfWidth,
                    y: -halfHeight
                }, {
                    x: halfWidth,
                    y: halfHeight
                }, {
                    x: -halfWidth,
                    y: halfHeight
                }
            ];
        },
        /**
         *
         * @param state
         * @returns {Object|*}
         */
        draw: function (state) {
            var graphics, i, index, ref, vertices, x, y;
            graphics = state.graphics;
            x = state.x;
            y = state.y;
            vertices = state.vertices;
            graphics.beginFill(0xcccccc);
            graphics.lineStyle(2, 0x111111);
            graphics.moveTo(vertices[0].x, vertices[0].y);
            for (index = i = 1, ref = vertices.length; 1 <= ref ? i < ref : i > ref; index = 1 <= ref ? ++i : --i) {
                graphics.lineTo(vertices[index].x, vertices[index].y);
            }
            graphics.lineTo(vertices[0].x, vertices[0].y);
            graphics.endFill();
            graphics.position.x = x;

            return graphics.position.y = y;
        }
    };

    FireballFactory = {
        /**
         *
         * @param {number} x
         * @param {number} y
         * @param color
         * @param {number} particleCount
         * @returns {{x: Object, y: Object, color: *, graphics: PIXI.Container, flame: (*|{color: *, graphics: (PIXI.Graphics|b.Graphics|i.Graphics|c.Graphics), random: *, x: Object, y: Object, particles: *, update: state.update, position: (b.Point|i.Point)}), update: state.update, vertices: (*|Array), matterOptions: {friction: number, restitution: number, density: number}}|*}
         */
        create: function (x, y, color, particleCount) {
            var colorHex, graphics, radius, state;
            if (particleCount == null) {
                particleCount = 10;
            }
            radius = 6;
            colorHex = "#" + (color.toString(16));
            graphics = new PIXI.Container();
            state = {
                x: x,
                y: y,
                color: color,
                graphics: graphics,
                flame: FlameFactory.create(x, y, Math.random, particleCount, color),
                update: function () {
                    return FireballFactory.update(state);
                },
                vertices: MatterEngine.Utils.createOrb(radius),
                matterOptions: {
                    friction: 0.00001,
                    restitution: 0.5,
                    density: 0.001
                }
            };
            state.graphics.addChild(state.flame.graphics);

            return state;
        },
        /**
         *
         * @param state
         * @returns {*}
         */
        update: function (state) {
            return state.flame.update({
                mouse: state.matterBody.position
            });
        }
    };

}).call(this);