(function (global) {
    "use strict";

    var Body = p2.Body,
        Circle = p2.Circle,
        Box = p2.Box,
        Convex = p2.Convex,
        Plane = p2.Plane,
        Shape = p2.Shape;

    class WaterWorldP2 {

        /**
         * World object contains many agents and walls and food and stuff
         * @name WaterWorldP2
         * @constructor
         *
         * @return {WaterWorldP2}
         */
        constructor() {
            // Init p2.js
            this.world = new p2.World({
                gravity: [0, -0.5]
            });
            this.renderOpts = {
                antialiasing: false,
                autoResize: false,
                resolution: window.devicePixelRatio,
                resizable: false,
                transparent: false,
                noWebGL: true,
                width: 600,
                height: 600
            };

            this.width = this.renderOpts.width;
            this.height = this.renderOpts.height;
            this.resizable = this.renderOpts.resizable;

            // Pixi.js zoom level
            this.zoom = 50;
            this.clock = 0;
            this.pause = false;
            this.fixedTimeStep = 1 / 60;
            this.maxSubSteps = 10;

            // Create the canvas in which the game will show, and a
            // generic container for all the graphical objects
            this.renderer = PIXI.autoDetectRenderer(this.width, this.height, this.renderOpts);
            this.renderer.backgroundColor = 0xCCCCCC;
            // Put the renderer on screen in the corner
            this.renderer.view.style.pos = "absolute";
            this.renderer.view.style.top = "0px";
            this.renderer.view.style.left = "0px";
            // The stage is essentially a display list of all game objects
            // for Pixi to render; it's used in resize(), so it must exist
            this.scene = new PIXI.Container();
            this.stage = new PIXI.Container();
            this.stage.addChild(this.scene);

            // Add transform to the container
            this.scene.position.x = this.renderer.width / 2; // center at origin
            this.scene.position.y = this.renderer.height / 2;
            this.scene.scale.x = this.zoom;  // zoom in
            this.scene.scale.y = -this.zoom; // Note: we flip the y axis to make "up" the physics "up"

            if (this.resizable) {
                var resize = () => {
                    // Determine which screen dimension is most constrained
                    let ratio = Math.min(window.innerWidth / this.width, window.innerHeight / this.height);
                    // Scale the view appropriately to fill that dimension
                    this.stage.scale.x = this.stage.scale.y = ratio;
                    // Update the renderer dimensions
                    this.renderer.resize(Math.ceil(this.width * ratio), Math.ceil(this.height * ratio));
                };

                // Listen for and adapt to changes to the screen size, e.g.,
                // user changing the window or rotating their device
                window.addEventListener("resize", resize);

                // Size the renderer to fill the screen
                resize();
            }

            // Actually place the renderer onto the page for display
            document.body.querySelector('#game-container').appendChild(this.renderer.view);

            let shapes = [
                {
                    body: new Body({
                        mass: 5,
                        angle: 0,
                        angularVelocity: 0,
                        position: [-2.3, 5],
                        velocity: [0, 0]
                        // position: [-2.5, 5],
                        // velocity: [-2, 10]
                    }),
                    shape: new Box({width: 2, height: 1})
                },
                {
                    body: new Body({
                        mass: 1,
                        angle: 0,
                        angularVelocity: 0,
                        position: [-2.5, 2],
                        velocity: [0, 0]
                        // position: [0, 5],
                        // velocity: [0, 10]
                    }),
                    shape: new Circle({radius: 1})
                },
                {
                    body: new Body({position: [0, -3]}),
                    shape: new Plane()
                }
            ];
            this.addBodies(shapes);
            this.addEvents();

            // Animation loop
            var animate = (timeMilliseconds) => {
                requestAnimationFrame(animate);
                var timeSinceLastCall = 0;
                if (timeMilliseconds !== undefined && this.lastTimeMilliseconds !== undefined) {
                    timeSinceLastCall = (timeMilliseconds - this.lastTimeMilliseconds) / 1000;
                }

                // Move physics bodies forward in time
                this.world.step(this.fixedTimeStep, timeSinceLastCall, this.maxSubSteps);
                this.lastTimeMilliseconds = timeMilliseconds;

                // Tick the world
                this.tick();

                // Render scene
                this.renderer.render(this.stage);
            };
            requestAnimationFrame(animate);

            return this;
        }

        /**
         * @param {Array} bodies
         * @return {WaterWorldP2}
         */
        addBodies(bodies) {
            this.entityLayer = [];
            for (let i = 0; i < bodies.length; i++) {
                let entity = bodies[i];
                entity.body.addShape(entity.shape);
                entity.graphics = new PIXI.Graphics();
                entity.graphics.lineStyle(0.005, 0x00000, 1);
                switch (entity.shape.type) {
                    case Shape.CIRCLE:
                        entity.graphics.beginFill(0x00ff00, 0.5);
                        entity.graphics.drawCircle(-entity.shape.width / 2, -entity.shape.height / 2, entity.shape.radius);
                        entity.graphics.endFill();
                        break;
                    case Shape.BOX:
                    case Shape.CONVEX:
                        entity.graphics.beginFill(0xff0000, 0.5);
                        entity.graphics.drawRect(-entity.shape.width / 2, -entity.shape.height / 2, entity.shape.width, entity.shape.height);
                        entity.graphics.endFill();
                        break;
                    case Shape.PLANE:
                        entity.graphics.beginFill(0x000000);
                        entity.graphics.drawRect(-entity.shape.width / 2, -entity.shape.height / 2, entity.shape.width, entity.shape.height);
                        entity.graphics.endFill();
                        break;
                }

                this.entityLayer.push(entity);
                // Add the body to our world
                this.world.addBody(entity.body);
                // Add the body to our container
                this.scene.addChild(entity.graphics);
            }

            return this;
        }

        /**
         *
         */
        addEvents() {
            this.world.on("beginContact", (event) => {

            });

            this.world.on("endContact", (event) => {

            });

            this.world.on("impact", (event) => {

            });

            this.world.on("postBroadphase", (event) => {

            });

            this.world.on("preSolve", (event) => {

            });

            this.world.on("addSpring", (event) => {

            });

            this.world.on("addBody", (event) => {

            });

            this.world.on("removeBody", (event) => {

            });
        }

        /**
         * Tick the environment
         * @return {WaterWorldP2}
         */
        tick() {
            for (let i = 0; i < this.entityLayer.length; i++) {
                let entity = this.entityLayer[i];
                if (entity.remove) {
                    this.world.removeBody(entity.body);
                }
                // Transfer positions of the physics objects to Pixi.js
                entity.graphics.position.x = entity.body.position[0];
                entity.graphics.position.y = entity.body.position[1];
                entity.graphics.rotation = entity.body.angle;
            }

            return this;
        }
    }
    global.WaterWorldP2 = WaterWorldP2;

}(this));
