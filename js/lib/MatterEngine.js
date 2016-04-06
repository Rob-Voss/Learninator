(function (global) {
    "use strict";

    // Matter aliases
    var Engine          = Matter.Engine,
        World           = Matter.World,
        Bodies          = Matter.Bodies,
        Common          = Matter.Common,

        // Canvas
        container       = document.body.querySelector('#game-container'),

        // Collison Category Groups
        wallCategory    = 0x0001,
        nomCategory     = 0x0002,
        gnarCategory    = 0x0004,
        agentCategory   = 0x0008,

        // Collison Category Colors
        redColor        = '#C44D58',
        greenColor      = '#C7F464',
        blueColor       = '#4ECDC4';

    class MatterEngine {
        constructor(options) {
            this.engine = Engine.create({
                    render: {
                        element: container,
                        controller: RenderPixi,
                        options: options
                    }
                });
            this.scene = MatterEngine.SceneFactory.create(this.engine);
            this.scene.addMatter(this.scene.createPlatforms());
            this.scene.addMatter(this.scene.createFireballs());

            return this.draw();
        }

        draw() {
            var self = this,
                timeDelta = 16;
            if (!this.scene) {
                return;
            }

            requestAnimationFrame(function () {
                return self.draw();
            });

            Engine.update(this.engine, timeDelta);
            this.scene.update();

            return this.engine.render.controller.world(this.engine);
        }
    }

    MatterEngine.SceneFactory = {
        addMatter: function (items) {
            var results = [];
            for (let i = 0, len = items.length; i < len; i++) {
                let item = items[i];
                if (!item.vertices) {
                    continue;
                }
                item.matterBody = Bodies.fromVertices(item.x, item.y, item.vertices, item.matterOptions);
                World.add(this.engine.world, [item.matterBody]);
                results.push(this.children.push(item));
            }

            return results;
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
        },
        update: function () {
            for (let i = 0, len = this.children.length; i < len; i++) {
                this.children[i].update();
            }

            return this;
        }
    };

    MatterEngine.Utils = {
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
    global.MatterEngine = MatterEngine;

}(this));
