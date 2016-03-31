var Utility        = Utility || {},
    PhysicalAgent  = PhysicalAgent || {},
    PhysicalEntity = PhysicalEntity || {};

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
    RenderPixi      = Matter.RenderPixi,
    Svg             = Matter.Svg,
    Vector          = Matter.Vector,
    Vertices        = Matter.Vertices,
    container       = document.body.querySelector('.game-container'),
    defaultCategory = 0x0001,
    redCategory     = 0x0002,
    greenCategory   = 0x0004,
    blueCategory    = 0x0008,
    redColor        = '#C44D58',
    blueColor       = '#4ECDC4',
    greenColor      = '#C7F464',
    engineOpts      = {
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
            element: container,
            controller: RenderPixi,
            options: {
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
    },
    entityOpts      = {
        radius: 10,
        collision: true,
        interactive: false,
        useSprite: false,
        moving: true,
        cheats: {
            gridLocation: false,
            position: false,
            name: false,
            id: false
        }
    },
    entityAgentOpts = {
        radius: 10,
        collision: true,
        interactive: false,
        useSprite: false,
        moving: false,
        cheats: {
            gridLocation: false,
            position: false,
            name: false,
            id: false
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

(function (global) {
    "use strict";

    class PhysicsWorld {

        /**
         * Make a World
         * @name World
         * @constructor
         *
         * @param {Array} agents
         * @param {worldOpts} worldOpts
         * @param {renderOpts} renderOpts
         * @returns {PhysicsWorld}
         */
        constructor(agents, worldOpts, renderOpts) {
            var self = this;
            this.rendererOpts = renderOpts || {
                    antialiasing: false,
                    autoResize: false,
                    resolution: window.devicePixelRatio,
                    resizable: false,
                    transparent: false,
                    noWebGL: true,
                    width: 600,
                    height: 600
                };

            // Get agents
            this.agents = agents || [];
            this.entityAgents = [];

            this.width = this.rendererOpts.width;
            this.height = this.rendererOpts.height;
            this.resizable = this.rendererOpts.resizable;

            this.clock = 0;
            this.pause = false;

            // The speed to run the simulation at
            this.simSpeed = Utility.getOpt(worldOpts, 'simSpeed', 1);

            this.engine = Engine.create(container, engineOpts);
            this.canvas = this.engine.render.canvas;

            this.renderer = PIXI.autoDetectRenderer(this.width, this.height, this.rendererOpts);
            this.renderer.backgroundColor = 0xFFFFFF;

            this.renderer.view.style.pos = "absolute";
            this.renderer.view.style.top = "0px";
            this.renderer.view.style.left = "0px";

            this.stage = new PIXI.Container();

            document.body.querySelector('.game-container').appendChild(this.renderer.view);

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

            this.populate(worldOpts);

            if (document.getElementById('flotreward')) {
                this.rewards = new FlotGraph(this.agents);
            }

            function resize() {
                // Determine which screen dimension is most constrained
                let ratio = Math.min(window.innerWidth / self.width, window.innerHeight / self.height);
                // Scale the view appropriately to fill that dimension
                self.stage.scale.x = self.stage.scale.y = ratio;
                // Update the renderer dimensions
                self.renderer.resize(Math.ceil(self.width * ratio), Math.ceil(self.height * ratio));
            }

            if (this.resizable) {
                // Listen for and adapt to changes to the screen size, e.g.,
                // user changing the window or rotating their device
                window.addEventListener("resize", resize);

                // Size the renderer to fill the screen
                resize();
            }

            requestAnimationFrame(animate);
            function animate() {
                if (!self.pause) {
                    let ticker = 0;
                    switch (parseFloat(self.simSpeed)) {
                        case 1:
                            ticker = 1;
                            break;
                        case 2:
                            ticker = 30;
                            break;
                        case 3:
                            ticker = 60;
                            break;
                    }
                    for (let k = 0; k < ticker; k++) {
                        self.tick();
                    }
                }
                self.renderer.render(self.stage);
                requestAnimationFrame(animate);
            }

            return this;
        }

        /**
         * Add some dumb/agent entities
         * @returns {PhysicsWorld}
         */
        addEntityAgents() {
            for (let k = 0; k < this.numEntityAgents; k++) {
                let x           = Utility.randi(5, this.width - 10),
                    y           = Utility.randi(5, this.height - 10),
                    vx          = Math.random() * 5 - 2.5,
                    vy          = Math.random() * 5 - 2.5,
                    entityAgent = new EntityRLDQN(new Vec(x, y, vx, vy), this.entityAgentOpts),
                    entity      = entityAgent.shape || entityAgent.sprite;
                for (let ei = 0; ei < entityAgent.eyes.length; ei++) {
                    entity.addChild(entityAgent.eyes[ei].shape);
                }
                this.entityAgents.push(entityAgent);
                this.populationContainer.addChild(entity);
                this.population.set(entityAgent.id, entityAgent);
            }

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
         * @returns {PhysicsWorld}
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
         * Remove the entity from the world
         * @param {string} id
         * @returns {World}
         */
        deleteEntity(id) {
            if (this.population.has(id)) {
                let entity    = this.population.get(id),
                    entityIdx = this.populationContainer.getChildIndex(entity.shape || entity.sprite);
                this.populationContainer.removeChildAt(entityIdx);
                this.population.delete(id);
            }
            return this;
        }

        /**
         * Draws the world
         * @returns {PhysicsWorld}
         */
        draw() {
            for (let [id, entity] of this.population.entries()) {
                if (entity.type !== 0) {
                    entity.draw();
                }
            }

            if (this.rewards) {
                this.rewards.graphRewards();
            }

            return this;
        }

        /**
         * Set up the population
         * @returns {PhysicsWorld}
         */
        populate(worldOpts) {
            this.populationContainer = new PIXI.Container();
            this.population = new Map();

            // Number of agents
            this.numAgents = this.agents.length;

            // Entity options
            this.numEntities = Utility.getOpt(worldOpts, 'numEntities', 5);
            this.entityOpts = Utility.getOpt(worldOpts, 'entityOpts', entityOpts);

            // Entity Agent options
            this.numEntityAgents = Utility.getOpt(worldOpts, 'numEntityAgents', 0);
            this.entityAgentOpts = Utility.getOpt(worldOpts, 'entityAgentOpts', entityAgentOpts);

            // Walls
            // this.addWalls();

            // Population of Agents for the environment
            this.addAgents();

            // Population of Agents that are considered 'smart' entities for the environment
            // this.addEntityAgents();

            // Add the entities
            this.addEntities(this.numEntities);

            this.stage.addChild(this.populationContainer);

            return this;
        }

        /**
         * Tick the environment
         * @returns {PhysicsWorld}
         */
        tick() {
            this.clock++;

            for (let [id, entity] of this.population.entries()) {
                if (entity.type !== 0) {
                    entity.tick(this);
                }
            }

            let popCount = 0;
            for (let [id, entity] of this.population.entries()) {
                if (entity.cleanUp === true || ((entity.type === 2 || entity.type === 1) && entity.age > 5000)) {
                    this.deleteEntity(entity.id);
                } else if (entity.type === 2 || entity.type === 1) {
                    popCount++;
                }
            }

            // If we have less then the number of Items allowed throw a random one in
            if (popCount < this.numEntities) {
                this.addEntities(this.numEntities - popCount);
            }

            this.draw();

            return this;
        }
    }
    global.PhysicsWorld = PhysicsWorld;

}(this));
