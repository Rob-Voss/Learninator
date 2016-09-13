(function(global) {
  "use strict";

  // Matter aliases
  const Engine = Matter.Engine,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Bounds = Matter.Bounds,
      Common = Matter.Common,
      Composite = Matter.Composite,
      Constraint = Matter.Constraint,
      Events = Matter.Events,
      Grid = Matter.Grid,
      MouseConstraint = Matter.MouseConstraint,
      Mouse = Matter.Mouse,
      Vector = Matter.Vector,

      // Canvas
      container = document.body.querySelector('#game-container'),
      graphContainer = document.body.querySelector('#flotreward'),

      // Collision Category Groups
      wallCategory = 0x0001,
      nomCategory = 0x0002,
      gnarCategory = 0x0004,
      agentCategory = 0x0008,

      // Collision Category Colors
      redColor = '#C44D58',
      greenColor = '#C7F464',
      blueColor = '#4ECDC4',

      /**
       *
       * @type {{enabled: boolean, enableSleeping: boolean, constraintIterations: number, positionIterations: number,
       *     velocityIterations: number, metrics: {extended: boolean, narrowDetections: number, narrowphaseTests:
       *     number, narrowReuse: number, narrowReuseCount: number, midphaseTests: number, broadphaseTests: number,
       *     narrowEff: number, midEff: number, broadEff: number, collisions: number, buckets: number, bodies: number,
       *     pairs: number}, timing: {timeScale: number}}}
       */
      engineOpts = {
        positionIterations: 6,
        velocityIterations: 4,
        constraintIterations: 2,
        enableSleeping: false,
        timing: {
          timeScale: 1
        },
        broadphase: {
          controller: Grid
        },
        metrics: {
          extended: true,
          narrowDetections: 0,
          narrowphaseTests: 0,
          narrowReuse: 0,
          narrowReuseCount: 0,
          midphaseTests: 0,
          broadphaseTests: 0,
          narrowEff: 0.0001,
          midEff: 0.0001,
          broadEff: 0.0001,
          collisions: 0,
          buckets: 0,
          bodies: 0,
          pairs: 0
        }
      },
      pixiOpts = {
        antialiasing: false,
        autoResize: false,
        background: 0xFFFFFF,
        resolution: window.devicePixelRatio,
        resizable: false,
        transparent: false,
        noWebGL: true,
        width: 600,
        height: 600
      },
      engine = Engine.create(engineOpts),
      renderer = new PIXI.autoDetectRenderer(pixiOpts.width, pixiOpts.height, pixiOpts),
      /**
       *
       * @type {{element: Element, options: {background: string, pixelRatio: number, enabled: boolean, hasBounds:
       *     boolean, showAngleIndicator: boolean, showAxes: boolean, showSleeping: boolean, showBounds: boolean,
       *     showBroadphase: boolean, showCollisions: boolean, showConvexHulls: boolean, showDebug: boolean, showIds:
       *     boolean, showInternalEdges: boolean, showMousePosition: boolean, showPositions: boolean, showShadows:
       *     boolean, showSeparations: boolean, showVelocity: boolean, showVertexNumbers: boolean, wireframes: boolean,
       *     wireframeBackground: string}}}
       */
      renderOpts = {
        bounds: {
          min: {x: 0, y: 0},
          max: {x: pixiOpts.width, y: pixiOpts.height}
        },
        canvas: renderer.view,
        context: renderer.context,
        stage: new PIXI.Container(),
        primitiveContainer: new PIXI.Container(),
        spriteContainer: new PIXI.Container(),
        displayContainer: new PIXI.Container(),
        element: container,
        engine: engine,
        engineOptions: engineOpts,
        renderer: renderer,
        pixiOptions: pixiOpts,
        options: {
          width: renderer.width,
          height: renderer.height,
          background: '#585858',
          pixelRatio: 1,
          enabled: true,
          hasBounds: true,
          showAngleIndicator: false,
          showAxes: false,
          showSleeping: false,
          showBounds: false,
          showBroadphase: false,
          showCollisions: false,
          showConvexHulls: false,
          showDebug: false,
          showIds: false,
          showInternalEdges: false,
          showMousePosition: false,
          showPositions: false,
          showShadows: false,
          showSeparations: false,
          showVelocity: false,
          showVertexNumbers: false,
          wireframes: false,
          wireframeBackground: '#222'
        }
      },
      /**
       * @type {gridOpts} gridOpts
       */
      gridOpts = {
        width: renderOpts.options.width,
        height: renderOpts.options.height,
        buffer: 0,
        size: 5,
        cellSize: 40,
        cellSpacing: 20,
        pointy: true,
        useSprite: false,
        fill: false,
        cheats: {}
      },
      orientation = (gridOpts.pointy ? Layout.layoutPointy : Layout.layoutFlat),
      size = new Point(gridOpts.cellSize, gridOpts.cellSize),
      origin = new Point(gridOpts.width / 2, gridOpts.height / 2),
      layout = new Layout(orientation, size, origin),
      cells = HexGrid.shapeRectangle(layout, gridOpts),
      grid = new HexGrid(layout, cells, gridOpts);

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
     * @return {MatterWorld}
     */
    constructor() {
      Common.extend(this, renderOpts);
      this.clock = 0;
      this.agents = [];
      this.width = this.options.width;
      this.height = this.options.height;
      this.runner = Engine.run(this.engine);
      this.render = new MatterPixi(this);
      this.engine.world.gravity = {x: 0, y: 0};
      this.engine.metrics.timing = this.runner;
      this.mouseConstraint = MouseConstraint.create(this.engine, {
        element: this.canvas
      });
      this.render.mouse = this.mouseConstraint.mouse;

      this.rewards = (graphContainer) ? new FlotGraph(this.agents) : false;

      if (useTools) {
        this.useInspector = useInspector;
        this.isMobile = isMobile;
        this.guiOptions = {
          broadphase: 'grid',
          amount: 1,
          size: 40,
          sides: 4,
          density: 0.001,
          restitution: 0,
          friction: 0.1,
          frictionStatic: 0.5,
          frictionAir: 0.01,
          offset: {x: 0, y: 0},
          renderer: 'canvas',
          chamfer: 0,
          isRecording: false
        };
        // create a Matter.Gui
        this.gui = Gui.create(this.engine, this.runner, this.render, this.guiOptions);
        this.initControls();
        Gui.update(this.gui, this.gui.datGui);
      }

      //this.addPerson(200, 200);
      this.addWalls();
      this.addAgents();
      //this.addPlatforms(10, 30, 150);
      this.addEntities(10);
      this.setEngineEvents();
      this.setRunnerEvents();
      this.setWorldEvents();

      this.render.run();

      return this;
    }

    /**
     * Add new agents
     * @parameter {number} number
     * @return {MatterWorld}
     */
    addAgents(number = 1) {
      // Populating the world
      for (let k = 0; k < number; k++) {
        let agentOpts = {
              worker: false,
              numEyes: 30,
              numTypes: 5,
              numActions: 4,
              numProprioception: 2,
              range: 120,
              proximity: 120
            },
            entityOpt = {
              shape: 'circle',
              position: {
                x: 400,
                y: 400
              },
              render: {
                strokeStyle: Common.shadeColor(blueColor, -20),
                fillStyle: blueColor
              },
              friction: 0,
              frictionAir: Utility.Maths.randf(0.0, 0.9),
              frictionStatic: 0,
              restitution: 0,
              density: Utility.Maths.randf(0.001, 0.01)
            },
            body = Bodies.circle(entityOpt.position.x, entityOpt.position.y, 10, entityOpt),
            entity = new PhysicalAgent(body, agentOpts);

        Body.set(body, 'entity', entity);
        this.addMatter([body]);

        this.agents.push(entity);
      }

      return this;
    }

    /**
     * Add new entities
     * @parameter {number} number
     * @return {MatterWorld}
     */
    addEntities(number = 1) {
      let bodies = [];
      // Populating the world
      for (let k = 0; k < number; k++) {
        let body, entity,
            entityOpt = {
              position: {
                x: Utility.Maths.randi(10, this.width - 10),
                y: Utility.Maths.randi(10, this.height - 10)
              },
              shape: 'circle',
              friction: 0.1,
              frictionAir: Utility.Maths.randf(0.0, 0.9),
              frictionStatic: 0.5,
              restitution: 1,
              density: Utility.Maths.randf(0.005, 0.01)
            },
            type = Utility.Maths.randi(1, 3);
        if (type === 1) {
          entityOpt.render = {
            strokeStyle: Common.shadeColor(greenColor, -20),
            fillStyle: Common.shadeColor(greenColor, -20)
          };
          body = Bodies.circle(entityOpt.position.x, entityOpt.position.y, 10, entityOpt);
        } else {
          entityOpt.shape = 'convex';
          entityOpt.chamfer = {
            radius: 30
          };
          entityOpt.render = {
            strokeStyle: Common.shadeColor(redColor, -20),
            fillStyle: Common.shadeColor(redColor, -20)
          };
          body = Bodies.polygon(entityOpt.position.x, entityOpt.position.y, 8, 10, entityOpt);
        }
        entity = new PhysicalEntity(type, body);

        Body.set(body, 'entity', entity);
        bodies.push(body);
      }
      this.addMatter(bodies);

      return this;
    }

    /**
     * Add Bodies and Graphics to the scene
     * @param {Array} items
     * @return {MatterWorld}
     */
    addMatter(items) {
      World.add(this.engine.world, items);

      return this;
    }

    /**
     * Add walls to the world
     * @return {MatterWorld}
     */
    addWalls() {
      // Ground
      let buffer = 5,
          wallOpts = {isStatic: true, render: {visible: true}, label: 'Wall', shape: 'convex'},
          left = Bodies.rectangle(buffer, this.height / 2, buffer, this.height - (buffer * 4), wallOpts),
          right = Bodies.rectangle(this.width - buffer, this.height / 2, buffer, this.height - (buffer * 4), wallOpts),
          top = Bodies.rectangle(this.width / 2, buffer, this.width - (buffer * 4), buffer, wallOpts),
          bottom = Bodies.rectangle(this.width / 2, this.height - buffer, this.width - (buffer * 4), buffer, wallOpts);

      Body.set(left, 'entity', {
        type: 0,
        x: left.position.x,
        y: buffer,
        width: buffer,
        height: this.height - (buffer * 2)
      });
      Body.set(top, 'entity', {
        type: 0,
        x: buffer,
        y: top.position.y,
        width: this.width - (buffer * 2),
        height: buffer
      });
      Body.set(right, 'entity', {
        type: 0,
        x: right.position.x,
        y: buffer,
        width: buffer,
        height: this.height - (buffer * 2)
      });
      Body.set(bottom, 'entity', {
        type: 0,
        x: buffer,
        y: bottom.position.y,
        width: this.width - (buffer * 2),
        height: buffer
      });

      this.addMatter([left, top, right, bottom]);

      return this;
    }

    /**
     *
     * @param x
     * @param y
     * @returns {MatterWorld}
     */
    addPerson(x, y) {
      var currGroup = -1;
      var headOptions = {
            label: 'head',
            friction: 1,
            frictionAir: .05,
            collisionFilter: {
              group: currGroup
            }
          },
          chestOptions = {
            label: 'chest',
            friction: 1,
            frictionAir: .05,
            collisionFilter: {
              group: currGroup - 1
            }
          },
          armOptions = {
            type: 'capsule',
            label: 'arm',
            friction: 1,
            frictionAir: .03,
            collisionFilter: {
              group: currGroup
            }
          },
          legOptions = {
            type: 'capsule',
            label: 'leg',
            friction: 1,
            frictionAir: .03,
            collisionFilter: {
              group: currGroup - 1
            }
          },
          head = Bodies.circle(x, y - 70, 30, headOptions),
          chest = Bodies.rectangle(x, y, 60, 80, chestOptions),
          rightUpperArm = Bodies.rectangle(x + 40, y - 20, 20, 40, armOptions),
          rightLowerArm = Bodies.rectangle(x + 40, y + 20, 20, 60, armOptions),
          leftUpperArm = Bodies.rectangle(x - 40, y - 20, 20, 40, armOptions),
          leftLowerArm = Bodies.rectangle(x - 40, y + 20, 20, 60, armOptions),
          leftUpperLeg = Bodies.rectangle(x - 20, y + 60, 20, 40, legOptions),
          leftLowerLeg = Bodies.rectangle(x - 20, y + 100, 20, 60, legOptions),
          rightUpperLeg = Bodies.rectangle(x + 20, y + 60, 20, 40, legOptions),
          rightLowerLeg = Bodies.rectangle(x + 20, y + 100, 20, 60, legOptions),

          //personBody = Body.create({
          //  parts: [head, chest, leftUpperArm, rightUpperArm, leftUpperLeg, rightUpperLeg, leftLowerArm,
          // rightLowerArm, leftLowerLeg, rightLowerLeg], collisionFilter: {group: currGroup - 1}, }),

          headConstraint = Constraint.create({
            label: 'headConstraint',
            bodyA: head,
            bodyB: chest,
            pointA: {x: 0, y: 30},
            pointB: {x: 0, y: -40},
            angularStiffness: 0.7,
            stiffness: 0.7
          }),
          chestToRightUpperArm = Constraint.create({
            label: 'chestToRightUpperArm',
            bodyA: chest,
            bodyB: rightUpperArm,
            pointA: {x: 25, y: -35},
            pointB: {x: 0, y: -15},
            angularStiffness: 0.7,
            stiffness: 0.7,
          }),
          chestToLeftUpperArm = Constraint.create({
            label: 'chestToLeftUpperArm',
            bodyA: chest,
            bodyB: leftUpperArm,
            pointA: {x: -25, y: -35},
            pointB: {x: 0, y: -15},
            angularStiffness: 0.7,
            stiffness: 0.7,
          }),
          upperToLowerRightArm = Constraint.create({
            label: 'upperToLowerRightArm',
            bodyA: rightUpperArm,
            bodyB: rightLowerArm,
            pointA: {x: 0, y: 15},
            pointB: {x: 0, y: -25},
            angularStiffness: 0.7,
            stiffness: 0.7
          }),
          upperToLowerLeftArm = Constraint.create({
            label: 'upperToLowerLeftArm',
            bodyA: leftUpperArm,
            bodyB: leftLowerArm,
            pointA: {x: 0, y: 15},
            pointB: {x: 0, y: -25},
            angularStiffness: 0.7,
            stiffness: 0.7
          }),
          chestToUpperLeftLeg = Constraint.create({
            label: 'chestToUpperLeftLeg',
            bodyA: chest,
            bodyB: leftUpperLeg,
            pointA: {x: -20, y: 35},
            pointB: {x: 0, y: -15},
            angularStiffness: 0.7,
            stiffness: 0.7
          }),
          chestToUpperRightLeg = Constraint.create({
            label: 'chestToUpperRightLeg',
            bodyA: chest,
            bodyB: rightUpperLeg,
            pointA: {x: 20, y: 35},
            pointB: {x: 0, y: -15},
            angularStiffness: 0.7,
            stiffness: 0.7
          }),
          upperToLowerLeftLeg = Constraint.create({
            label: 'upperToLowerLeftLeg',
            bodyA: leftUpperLeg,
            bodyB: leftLowerLeg,
            pointA: {x: 0, y: 15},
            pointB: {x: 0, y: -25},
            angularStiffness: 0.7,
            stiffness: 0.7
          }),
          upperToLowerRightLeg = Constraint.create({
            label: 'upperToLowerRightLeg',
            bodyA: rightUpperLeg,
            bodyB: rightLowerLeg,
            pointA: {x: 0, y: 15},
            pointB: {x: 0, y: -25},
            angularStiffness: 0.7,
            stiffness: 0.7
          });

      var person = Composite.create({
        bodies: [
          head,
          chest,
          rightUpperArm,
          rightLowerArm,
          leftUpperArm,
          leftLowerArm,
          leftUpperLeg,
          leftLowerLeg,
          rightUpperLeg,
          rightLowerLeg
        ],
        constraints: [
          headConstraint,
          chestToLeftUpperArm,
          chestToRightUpperArm,
          chestToUpperRightLeg,
          chestToUpperLeftLeg,
          upperToLowerLeftArm,
          upperToLowerRightArm,
          upperToLowerLeftLeg,
          upperToLowerRightLeg
        ]
      });

      return this.addMatter([person]);
      //return World.add(this.engine.world, [person]);
    }

    /**
     *
     * @param {Number} number
     * @param {Number} minWidth
     * @param {Number} maxWidth
     * @param {Number} spacing
     * @returns {MatterWorld}
     */
    addPlatforms(number, minWidth, maxWidth, spacing) {
      // Ground
      var n = Math.floor((this.height - 20) / number),
          rows = Array(n),
          platOpts = {isStatic: true, render: {visible: true}, label: 'Platform', shape: 'convex'},
          plats = [];
      for (let i = 0; i < number; i++) {
        let w = Utility.Maths.randi(minWidth, maxWidth),
            h = 5,
            x = Utility.Maths.randi(10, this.width - w),
            y = Utility.Maths.randi(10, this.height - h),
            plat = Bodies.rectangle(x, y, w, h, platOpts);
        plats.push(plat);
        Body.set(plat, 'entity', {type: 0, x: x - w, y: y - h, width: w, height: h});
      }

      this.addMatter(plats);

      return this;
    }

    /**
     * Set the viewport
     * @param {number} x
     * @param {number} y
     */
    setViewport(x, y) {
      this.viewportCenter = {
        x: this.width * 0.5,
        y: this.height * 0.5
      };

      // make the world bounds a little bigger than the render bounds
      this.engine.world.bounds.min.x = -x;
      this.engine.world.bounds.min.y = -y;
      this.engine.world.bounds.max.x = this.width + x;
      this.engine.world.bounds.max.y = this.height + y;

      // keep track of current bounds scale (view zoom)
      this.boundsScaleTarget = 1;
      this.boundsScale = {x: 1, y: 1};

      // use the engine tick event to control our view
      Events.on(this.engine, 'beforeTick', () => {
        // mouse wheel controls zoom
        let scaleFactor = this.render.mouse.wheelDelta * -0.1;
        if (scaleFactor !== 0) {
          if ((scaleFactor < 0 && this.boundsScale.x >= 0.6) || (scaleFactor > 0 && this.boundsScale.x <= 1.4)) {
            this.boundsScaleTarget += scaleFactor;
          }
        }

        // if scale has changed
        if (Math.abs(this.boundsScale.x - this.boundsScaleTarget) > 0.01) {
          // smoothly tween scale factor
          scaleFactor = (this.boundsScaleTarget - this.boundsScale.x) * 0.2;
          this.boundsScale.x += scaleFactor;
          this.boundsScale.y += scaleFactor;

          // scale the render bounds
          this.render.bounds.max.x = this.render.bounds.min.x + this.width * this.boundsScale.x;
          this.render.bounds.max.y = this.render.bounds.min.y + this.height * this.boundsScale.y;

          // translate so zoom is from centre of view
          this.translate = {
            x: this.width * scaleFactor * -0.5,
            y: this.height * scaleFactor * -0.5
          };

          Bounds.translate(this.render.bounds, this.translate);

          // update mouse
          Mouse.setScale(this.render.mouse, this.boundsScale);
          Mouse.setOffset(this.render.mouse, this.render.bounds.min);
        }

        // get vector from mouse relative to centre of viewport
        let deltaCenter = Vector.sub(this.render.mouse.absolute, this.viewportCenter),
            centerDist = Vector.magnitude(deltaCenter),
            buttonHeld = this.render.mouse.button > -1;

        // translate the view if mouse has moved over 50px from the
        // center of viewport and the button is being held
        if (centerDist > 50 && buttonHeld) {
          // create a vector to translate the view, allowing the user to control view speed
          let direction = Vector.normalise(deltaCenter),
              speed = Math.min(10, Math.pow(centerDist - 50, 2) * 0.0002);

          this.translate = Vector.mult(direction, speed);

          // prevent the view moving outside the world bounds
          if (this.render.bounds.min.x + this.translate.x < this.engine.world.bounds.min.x) {
            this.translate.x = this.engine.world.bounds.min.x - this.render.bounds.min.x;
          }

          if (this.render.bounds.max.x + this.translate.x > this.engine.world.bounds.max.x) {
            this.translate.x = this.engine.world.bounds.max.x - this.render.bounds.max.x;
          }

          if (this.render.bounds.min.y + this.translate.y < this.engine.world.bounds.min.y) {
            this.translate.y = this.engine.world.bounds.min.y - this.render.bounds.min.y;
          }

          if (this.render.bounds.max.y + this.translate.y > this.engine.world.bounds.max.y) {
            this.translate.y = this.engine.world.bounds.max.y - this.render.bounds.max.y;
          }

          // move the view
          Bounds.translate(this.render.bounds, this.translate);

          // we must update the mouse too
          Mouse.setOffset(this.render.mouse, this.render.bounds.min);
        }
      });
    }

    /**
     * Check the bounds
     * @param {Matter.Body} body
     */
    checkBounds(body) {
      let maxX = this.engine.world.bounds.max.x - body.entity.radius,
          maxY = this.engine.world.bounds.max.y - body.entity.radius,
          minX = this.engine.world.bounds.min.x + body.entity.radius,
          minY = this.engine.world.bounds.min.y + body.entity.radius,
          spdAdj = body.entity.speed * 0.00025,
          newPos = Vector.create(body.position.x, body.position.y),
          newForce = Vector.create(body.entity.force.x, body.entity.force.y);
      if (body.speed > 2) {
        body.speed = body.entity.speed;
      }
      if (body.velocity.x <= -2 || body.velocity.x >= 2) {
        newForce.x = spdAdj;
      }
      if (body.velocity.y <= -2 || body.velocity.y >= 2) {
        newForce.y = spdAdj;
      }
      if (body.position.x > maxX) {
        newPos.x = body.position.x - body.entity.radius / 2;
        newForce.x = -spdAdj;
      }
      if (body.position.x < minX) {
        newPos.x = body.position.x + body.entity.radius / 2;
        newForce.x = spdAdj;
      }
      if (body.position.y > maxY) {
        newPos.y = body.position.y - body.entity.radius / 2;
        newForce.y = -spdAdj;
      }
      if (body.position.y < minY) {
        newPos.y = body.position.y + body.entity.radius / 2;
        newForce.y = spdAdj;
      }
      this.updateBody(body, newPos, newForce);
    }

    /**
     * Set up the GUI for MatterTools
     * @return {MatterWorld}
     */
    initControls() {
      // need to add mouse constraint back in after gui clear or load is pressed
      Events.on(this.gui, 'clear load', () => {
        // add a mouse controlled constraint
        this.mouseConstraint = MouseConstraint.create(this.engine, {
          element: this.render.canvas
        });
        // pass mouse to renderer to enable showMousePosition
        this.render.mouse = this.mouseConstraint.mouse;
        World.add(this.engine.world, this.mouseConstraint);
      });

      // need to rebind mouse on render change
      Events.on(this.gui, 'setRenderer', () => {
        Mouse.setElement(this.mouseConstraint.mouse, this.canvas);
      });

      // create a Matter.Inspector
      if (Inspector && this.useInspector) {
        this.inspector = Inspector.create(this.engine);

        Events.on(this.inspector, 'import', () => {
          this.mouseConstraint = MouseConstraint.create(this.engine);
          World.add(this.engine.world, this.mouseConstraint);
        });

        Events.on(this.inspector, 'play', () => {
          this.mouseConstraint = MouseConstraint.create(this.engine);
          World.add(this.engine.world, this.mouseConstraint);
        });

        Events.on(this.inspector, 'selectStart', () => {
          this.mouseConstraint.constraint.render.visible = false;
        });

        Events.on(this.inspector, 'selectEnd', () => {
          this.mouseConstraint.constraint.render.visible = true;
        });
      }

      return this;
    }

    /**
     * Set the events for the World to respond to remove/add
     * @return {MatterWorld}
     */
    setWorldEvents() {
      // Body Add Events
      Events.on(this.engine.world, 'beforeAdd', (event) => {

      });

      Events.on(this.engine.world, 'afterAdd', (event) => {

      });

      // Body Remove Events
      Events.on(this.engine.world, 'beforeRemove', (event) => {

      });

      Events.on(this.engine.world, 'afterRemove', (event) => {
        this.addEntities();
      });

      return this;
    }

    /**
     * Set the Engine's events during collisions
     * @return {MatterWorld}
     */
    setEngineEvents() {
      // Collision Events
      Events.on(this.engine, 'collisionStart', (event) => {
        let pairs = event.pairs;
        for (let q = 0; q < pairs.length; q++) {
          let pair = pairs[q],
              bodyA = Composite.get(this.engine.world, pair.bodyA.id, 'body'),
              bodyB = Composite.get(this.engine.world, pair.bodyB.id, 'body');
          if (bodyA && bodyB && !bodyA.isStatic && !bodyB.isStatic) {
            if (bodyA.label === 'Agent') {
              bodyA.entity.digestion += bodyB.label === 'Nom' ? 1 : -1;
              bodyB.entity.cleanUp = true;
            }
          }
        }
      });

      Events.on(this.engine, 'collisionActive', (event) => {

      });

      Events.on(this.engine, 'collisionEnd', (event) => {
        let bodies = Composite.allBodies(this.engine.world);
        for (let i = 0; i < bodies.length; i++) {
          let body = bodies[i];
          if (body.entity !== undefined && body.entity.cleanUp) {
            World.remove(this.engine.world, body);
            this.render.removeBody(body);
          }
        }
      });

      return this;
    }

    /**
     * Set the Runner's events for updates
     * @return {MatterWorld}
     */
    setRunnerEvents() {
      // Tick Events
      Events.on(this.runner, 'beforeTick', (event) => {
      });

      Events.on(this.runner, 'tick', (event) => {
        let bodies = Composite.allBodies(this.engine.world);
        for (let i = 0; i < bodies.length; i++) {
          if (!bodies[i].isStatic && bodies[i].entity !== undefined) {
            bodies[i].entity.tick(bodies);
          }
        }
      });

      Events.on(this.runner, 'beforeUpdate', (event) => {

      });

      Events.on(this.runner, 'afterUpdate', (event) => {
        let bodies = Composite.allBodies(this.engine.world);
        for (let i = 0; i < bodies.length; i++) {
          if (!bodies[i].isStatic && bodies[i].entity !== undefined) {
            this.checkBounds(bodies[i]);
          }
        }
      });

      Events.on(this.render, 'beforeRender', (event) => {

      });

      Events.on(this.render, 'afterRender', (event) => {

      });

      Events.on(this.runner, 'afterTick', (event) => {
        if (this.rewards) {
          this.rewards.graphRewards();
        }
      });

      return this;
    }

    /**
     * Update the body with new position and force
     * @param {Matter.Body} body
     * @param {Matter.Vector} position
     * @param {Matter.Vector} force
     * @return {MatterWorld}
     */
    updateBody(body, position, force) {
      body.entity.force = force;
      Body.setPosition(body, position);

      return this;
    }
  }
  global.MatterWorld = MatterWorld;

}(this));
