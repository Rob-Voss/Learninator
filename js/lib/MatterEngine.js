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

        /**
         *
         * @param {number} seed
         * @param {MainSceneFactory} sceneFactory
         * @param {object} options
         * @returns {{loadScene: state.loadScene}}
         */
        constructor(seed, sceneFactory, options) {
            this.seed = seed;
            this.sceneFactory = sceneFactory;
            this.options = options;
            this.canvas = container;
            this.engine = Engine.create({
                render: {
                    element: this.canvas,
                    controller: RenderPixi,
                    options: this.options
                }
            });
            this.scene = this.sceneFactory.create(this.seed, this.engine);

            return this.draw();
        }

        /**
         *
         * @returns {*}
         */
        draw() {
            var self = this;
            this.timeDelta = 16;
            if (!this.scene) {
                return;
            }

            requestAnimationFrame(function () {
                return self.draw();
            });

            Engine.update(this.engine, this.timeDelta);
            this.scene.update();

            return this.engine.render.controller.world(this.engine);
        }
    }

    MatterEngine.SceneFactory = {
        /**
         *
         * @param childFactory
         * @param engine
         * @returns {{children: Array, update: update, addMatter: addMatter, addMouseEvents: addMouseEvents}}
         */
        create: function (childFactory, engine) {
            this.engine = engine;
            this.childFactory = childFactory;
            this.children = [];

            this.state = {
                update: function () {
                    return MatterEngine.SceneFactory.update();
                },
                addMatter: function (items) {
                    return MatterEngine.SceneFactory.addMatter(items);
                }
            };

            return this.state;
        },
        /**
         *
         * @returns {*}
         */
        update: function () {
            var ref = this.children;
            for (let i = 0, len = ref.length; i < len; i++) {
                let child = ref[i];
                child.update();
            }

            return this.childFactory.update(this.state);
        },
        /**
         *
         * @param {Array} items
         * @returns {Array}
         */
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
        }
    };

    MatterEngine.Utils = {
        /**
         *
         * @param {Array} vertices
         * @param {number} rotationRad
         * @returns {Array}
         */
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
        /**
         *
         * @param {number} radius
         * @param {number} edgeCount
         * @returns {Array}
         */
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
