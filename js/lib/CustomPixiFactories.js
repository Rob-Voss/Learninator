var AgentFactory, FireballFactory, MainSceneFactory, PlatformFactory, FlameFactory,
    Utility = Utility || {};

// Matter aliases
var Engine          = Matter.Engine,
    World           = Matter.World,
    Bodies          = Matter.Bodies,
    Common          = Matter.Common;

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

    AgentFactory = {
        /**
         *
         * @param {number} x
         * @param {number} y
         * @param {string} color
         * @param {object} agentOpts
         * @param {object} matterOpts
         * @returns {{x: Object, y: Object, color: *, agent: AgentRLDQN, graphics: (i.Graphics|b.Graphics|c.Graphics), update: state.update, vertices: *, matterOptions: *}}
         */
        create: function (x, y, color, agentOpts, matterOpts) {
            var radius = 10,
                body = Bodies.fromVertices(x, y, MatterEngine.Utils.createOrb(radius), matterOpts);
            agentOpts.radius = radius;

            return state = {
                matterBody: body,
                agent: new PhysicalAgent(body, agentOpts),
                update: function () {
                    return AgentFactory.update(state);
                }
            };
        },
        /**
         *
         * @param state
         * @returns {*}
         */
        update: function (state) {
            state.agent.tick();

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
            if (particleCount === null) {
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