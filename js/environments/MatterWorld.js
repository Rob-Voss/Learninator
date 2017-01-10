const container = document.body.querySelector('#game-container'),
  graphContainer = document.body.querySelector('#flotreward'),

  // Collision Category Groups
  wallCollision = 0x0001,
  nomCollision = 0x0002,
  gnarCollision = 0x0004,
  agentCollision = 0x0008,

  entityTypes = ['Wall', 'Nom', 'Gnar', 'Agent', 'Agent Worker', 'Entity Agent'],
  textColorStyles = ['black', 'green', 'red', 'blue', 'navy', 'magenta', 'cyan', 'purple', 'aqua', 'olive', 'lime'],
  hexColorStyles = [0x000000, 0x00FF00, 0xFF0000, 0x0000FF, 0x000080, 0xFF00FF, 0x00FFFF, 0x800080, 0x00FFFF, 0x808000, 0x00FF00],
  entityCollisionCategories = [wallCollision, nomCollision, gnarCollision, agentCollision],

  // Collision Category Colors
  redColor = '#C44D58',
  greenColor = '#C7F464',
  blueColor = '#4ECDC4',
  blackColor = '#000000',

  width = 600,
  height = 600,

  pixiOptions = {
    antialiasing: false,
    autoResize: false,
    background: 0xFFFFFF,
    resolution: window.devicePixelRatio,
    resizable: false,
    transparent: false,
    noWebGL: false
  },

  renderOptions =  {
    background: '#585858',
    bounds: {
      min: {
        x: 0,
        y: 0
      },
      max: {
        x: width,
        y: height
      }
    },
    viewport: {
      x: width / 2,
      y: height / 2
    },
    element: container,
    height: height,
    width: width,
    enabled: true,
    hasBounds: true,
    pixelRatio: 1,
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
  },

  engineOptions = {
    enableSleeping: false,
    constraintIterations: 2,
    positionIterations: 10,
    velocityIterations: 8,
    broadphase: {
      controller: Matter.Grid
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
    },
    timing: {
      timeScale: 1
    },
    gravity: {
      x: 0,
      y: 0
    }
  },

  totalWidth = renderOptions.width + (renderOptions.viewport.x / 2),
  totalHeight = renderOptions.height + (renderOptions.viewport.y / 2),

  gridOptions = {
    buffer: 0,
    size: 3,
    cellSize: 200,
    cellSpacing: 0,
    width: totalWidth,
    height: totalHeight,
    pointy: false,
    useSprite: false,
    fill: false,
    cheats: {}
  },
  grid = new Grid(null, null, gridOptions),
  maze = new Maze(grid.init());

/**
 * @class MatterWorld
 * @property {number} clock
 * @property {Array} agents
 * @property {number} width
 * @property {number} height
 * @property {Matter.Runner} runner
 * @property {MatterPixi} render
 * @property {Matter.Engine} engine
 * @property {renderOpts} options
 */
class MatterWorld {

  /**
   * Make a World
   * @name MatterWorld
   * @constructor
   *
   * @return {MatterWorld}
   */
  constructor(renderOpts, pixiOpts, engineOpts, gridOpts) {
    this.clock = 0;
    this.agents = [];
    Common.extend(engineOptions, engineOpts);
    Common.extend(pixiOptions, pixiOpts);
    Common.extend(renderOptions, renderOpts);
    Common.extend(gridOptions, gridOpts);
    this.engineOptions = engineOptions;
    this.pixiOptions = pixiOptions;
    this.renderOptions = renderOptions;
    this.gridOptions = gridOptions;
    this.bounds = this.renderOptions.bounds;
    this.element = this.renderOptions.element;
    this.width = this.renderOptions.width;
    this.height = this.renderOptions.height;
    this.renderer = new PIXI.autoDetectRenderer(this.width, this.height, this.pixiOptions);

    this.stage = new PIXI.Container();
    this.primitiveContainer = new PIXI.Container();
    this.spriteContainer = new PIXI.Container();
    this.displayContainer = new PIXI.Container();

    this.stage.addChild(this.primitiveContainer);
    this.stage.addChild(this.spriteContainer);
    this.stage.addChild(this.displayContainer);

    this.canvas = this.renderer.view;
    this.context = this.canvas.getContext(this.renderer.CONTEXT_UID);
    this.engine = Engine.create(this.engineOptions);
    this.runner = Engine.run(this.engine);
    this.render = new MatterPixi(this);
    this.engine.world.gravity = this.engineOptions.gravity;
    this.mouseConstraint = MouseConstraint.create(this.engine, {element: this.canvas});
    this.render.mouse = this.mouseConstraint.mouse;
    this.setViewport(this.renderOptions.viewport.x, this.renderOptions.viewport.y);

    // MatterTools aliases
    if (window.MatterTools) {
      let MatterTools = window.MatterTools,
        useInspector = window.location.hash.indexOf('-inspect') !== -1,
        isMobile = /(ipad|iphone|ipod|android)/gi.test(navigator.userAgent);
      // this.setupTools(MatterTools, useInspector, isMobile);
    }

    // this.addOuterWalls();
    // this.addPlatforms(10, 30, 150, 50);
    this.addWalls(maze.walls);
    this.addAgents(1);
    this.addEntities(50);

    this.setEngineEvents();
    this.setRenderEvents();
    this.setRunnerEvents();
    this.setWorldEvents();

    this.rewards = (graphContainer) ? new FlotGraph(this.agents) : false;

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
            x: Utility.Maths.randi(50, 400),
            y: Utility.Maths.randi(50, 400)
          },
          render: {
            lineColor: Common.shadeColor(blackColor, -20),
            fillColor: Common.shadeColor(blueColor, -20)
          },
          friction: 0,
          frictionAir: Utility.Maths.randf(0.0, 0.9),
          frictionStatic: 0,
          restitution: 0,
          density: Utility.Maths.randf(0.001, 0.01),
          radius: 10
        },
        body = Bodies.circle(entityOpt.position.x, entityOpt.position.y, entityOpt.radius, entityOpt),
        entity = new PhysicalAgent(body, agentOpts);

      Body.set(body, 'entity', entity);
      Body.set(body, 'radius', entityOpt.radius);
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
          friction: 0,
          frictionAir: 0,
          frictionStatic: 0,
          restitution: 1,
          density: 0.01,
          radius: 10
        },
        type = Utility.Maths.randi(1, 3);

      if (type === 1) {
        entityOpt.shape = 'circle';
        entityOpt.render = {
          lineWidth: 0.75,
          lineColor: Common.shadeColor(blackColor, -20),
          fillColor: Common.shadeColor(greenColor, -20)
        };
        body = Bodies.circle(entityOpt.position.x, entityOpt.position.y, entityOpt.radius, entityOpt);
        Body.set(body, 'radius', entityOpt.radius);
      } else if (type === 2) {
        entityOpt.shape = 'convex';
        entityOpt.render = {
          lineWidth: 0.75,
          lineColor: Common.shadeColor(blackColor, -20),
          fillColor: Common.shadeColor(redColor, -20)
        };
        // entityOpt.vertices = MatterWorld.drawStarHexShape(entityOpt.position.x, entityOpt.position.y, 8, 10, 4, 0);
        // body = Body.create(entityOpt);
        body = Bodies.polygon(entityOpt.position.x, entityOpt.position.y, 8, entityOpt.radius, entityOpt);
        Body.set(body, 'radius', entityOpt.radius);
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
  addOuterWalls() {
    // Ground
    let buffer = 5,
      wallOpts = {
        isStatic: true,
        label: 'Wall',
        render: {
          visible: true,
          fillColor: '#FFFFFF',
          lineColor: '#FFFFFF'
        },
        shape: 'rectangle'
      },
      left = Bodies.rectangle(buffer, this.height / 2, buffer, this.height - (buffer * 4), wallOpts),
      right = Bodies.rectangle(this.width - buffer, this.height / 2, buffer, this.height - (buffer * 4), wallOpts),
      top = Bodies.rectangle(this.width / 2, buffer, this.width - (buffer * 4), buffer, wallOpts),
      bottom = Bodies.rectangle(this.width / 2, this.height - buffer, this.width - (buffer * 4), buffer, wallOpts);

    // for(let i = 0; i < grid.cells.length; i++) {
    //   let cell = grid.cells[i],
    //     wall = Bodies.fromVertices(cell.center.x, cell.center.y, cell.corners, wallOpts);
    //   this.addMatter([wall]);
    // }

    Body.set(left, 'entity', {
      type: 0,
      x: left.position.x,
      y: buffer,
      width: buffer,
      height: this.height - (buffer * 2),
      speed: 0,
      position: Vector.create(left.position.x, buffer),
      force: Vector.create(0, 0)
    });
    Body.set(left, 'width', left.entity.width);
    Body.set(left, 'height', left.entity.height);

    Body.set(top, 'entity', {
      type: 0,
      x: buffer,
      y: top.position.y,
      width: this.width - (buffer * 2),
      height: buffer,
      speed: 0,
      position: Vector.create(buffer, top.position.y),
      force: Vector.create(0, 0)
    });
    Body.set(top, 'width', top.entity.width);
    Body.set(top, 'height', top.entity.height);

    Body.set(right, 'entity', {
      type: 0,
      x: right.position.x,
      y: buffer,
      width: buffer,
      height: this.height - (buffer * 2),
      speed: 0,
      position: Vector.create(right.position.x, buffer),
      force: Vector.create(0, 0)
    });
    Body.set(right, 'width', right.entity.width);
    Body.set(right, 'height', right.entity.height);

    Body.set(bottom, 'entity', {
      type: 0,
      x: buffer,
      y: bottom.position.y,
      width: this.width - (buffer * 2),
      height: buffer,
      speed: 0,
      position: Vector.create(buffer, bottom.position.y),
      force: Vector.create(0, 0)
    });
    Body.set(bottom, 'width', bottom.entity.width);
    Body.set(bottom, 'height', bottom.entity.height);

    this.addMatter([left, top, right, bottom]);

    return this;
  }

  /**
   *
   * @param {number} number
   * @param {number} minWidth
   * @param {number} maxWidth
   * @param {number} spacing
   * @returns {MatterWorld}
   */
  addPlatforms(number, minWidth, maxWidth) {
    let platOpts = {
        isStatic: true,
        label: 'Platform',
        render: {
          visible: true,
          fillColor: '#FFFFFF',
          lineColor: '#FFFFFF'
        },
        shape: 'rectangle'
      },
      platforms = [];

    for (let i = 0; i < number; i++) {
      let w = Utility.Maths.randi(minWidth, maxWidth),
        h = 5,
        x = Utility.Maths.randi(10, this.width - w),
        y = Utility.Maths.randi(10, this.height - h),
        platform = Bodies.rectangle(x, y, w, h, platOpts);

      Body.set(platform, 'entity', {
        type: 0,
        x: x - w,
        y: y - h,
        width: w,
        height: h,
        speed: 0,
        position: Vector.create(x - w, y - h),
        force: Vector.create(0, 0)
      });
      Body.set(platform, 'width', platform.entity.width);
      Body.set(platform, 'height', platform.entity.height);

      this.checkBounds(platform);
      platforms.push(platform);

    }

    this.addMatter(platforms);

    return this;
  }

  /**
   *
   * @param {number} number
   * @param {number} minWidth
   * @param {number} maxWidth
   * @param {number} spacing
   * @returns {MatterWorld}
   */
  addWalls(walls) {
    let wallOpts = {
        isStatic: true,
        label: 'Wall',
        render: {
          visible: true,
          fillColor: '#FFFFFF',
          lineColor: '#FFFFFF'
        },
        shape: 'rectangle'
      },
      wallBodies = [];

    for (let i = 0; i < walls.length; i++) {
      let wall = walls[i],
        body = Bodies.rectangle(wall.position.x, wall.position.y, wall.width, wall.height, wallOpts);

      Body.set(body, 'entity', {
        type: 0,
        x: wall.position.x,
        y: wall.position.y,
        width: wall.width,
        height: wall.height,
        speed: 0,
        position: Vector.create(wall.position.x - wall.width, wall.position.y - wall.height),
        force: Vector.create(0, 0)
      });
      Body.set(body, 'width', body.entity.width);
      Body.set(body, 'height', body.entity.height);
      wallBodies.push(body);
    }

    this.addMatter(wallBodies);

    return this;
  }

  /**
   * Check the bounds
   * @param {Matter.Body} body
   */
  checkBounds(body) {
    let type = body.shape,
      w = (type !== 'circle') ? body.width : body.entity.radius,
      h = (type !== 'circle') ? body.height : body.entity.radius,
      maxX = this.engine.world.bounds.max.x - w,
      maxY = this.engine.world.bounds.max.y - h,
      minX = this.engine.world.bounds.min.x + w,
      minY = this.engine.world.bounds.min.y + h,
      spdAdj = body.entity.speed * 0.00025,
      newPos = Matter.Vector.create(body.position.x, body.position.y),
      newForce = Matter.Vector.create(body.entity.force.x, body.entity.force.y);
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

  setupTools(MatterTools, useInspector, isMobile) {
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
      offset: {
        x: 0,
        y: 0
      },
      renderer: 'canvas',
      chamfer: 0,
      isRecording: false
    };

    let initControls = () => {
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
      if (MatterTools.Inspector && this.useInspector) {
        this.inspector = MatterTools.Inspector.create(this.engine);

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
    };

    // create a Matter.Gui
    this.gui = MatterTools.Gui.create(this.engine, this.runner, this.render, this.guiOptions);
    initControls();
    MatterTools.Gui.update(this.gui, this.gui.datGui);
  }
  /**
   * Set the viewport
   * @param {number} x
   * @param {number} y
   */
  setViewport(x, y) {
    document.addEventListener("contextmenu", function(e){
      e.preventDefault();
    }, false);

    this.viewportCenter = Vector.create(this.width * 0.5, this.height * 0.5);
    // Make the world bounds a little bigger than the render bounds
    this.engine.world.bounds.min = Vector.create(-x, -y);
    this.engine.world.bounds.max = Vector.create(this.width + x, this.height + y);

    // keep track of current bounds scale (view zoom)
    this.boundsScaleTarget = 1;
    this.boundsScale = Vector.create(1, 1);

    // use the engine tick event to control our view
    Events.on(this.engine, 'beforeTick', () => {
      // mouse wheel controls zoom
      let scaleFactor = this.render.mouse.wheelDelta * -0.1;
      if (scaleFactor !== 0) {
        if ((scaleFactor < 0 && this.boundsScale.x >= 0.6) || (scaleFactor > 0 && this.boundsScale.x <= 1.4)) {
          this.boundsScaleTarget += scaleFactor;
        }
      }

      // If the scale has changed
      if (Math.abs(this.boundsScale.x - this.boundsScaleTarget) > 0.01) {
        // Smoothly tween scale factor
        scaleFactor = (this.boundsScaleTarget - this.boundsScale.x) * 0.2;
        this.boundsScale.x += scaleFactor;
        this.boundsScale.y += scaleFactor;

        // Scale the render bounds
        this.render.bounds.max.x = this.render.bounds.min.x + this.width * this.boundsScale.x;
        this.render.bounds.max.y = this.render.bounds.min.y + this.height * this.boundsScale.y;

        // Translate so the zoom happens from the center of view
        this.translate = Vector.create(this.width * scaleFactor * -0.5, this.height * scaleFactor * -0.5);

        Bounds.translate(this.render.bounds, this.translate);

        // Update the mouse
        Mouse.setScale(this.render.mouse, this.boundsScale);
        Mouse.setOffset(this.render.mouse, this.render.bounds.min);
      }

      // Get the Vector of the mouse relative to center of the viewport
      let deltaCenter = Vector.sub(this.render.mouse.absolute, this.viewportCenter),
        centerDist = Vector.magnitude(deltaCenter),
        buttonHeld = this.render.mouse.button;

      // Translate the view if mouse has moved over 50px from the
      // center of the viewport and the right button is being held
      if (centerDist > 50 && buttonHeld === 2) {
        // Create a vector to translate the view, allowing the user
        // to control the view speed
        let direction = Vector.normalise(deltaCenter),
          speed = Math.min(10, Math.pow(centerDist - 50, 2) * 0.0002);
        this.translate = Vector.mult(direction, speed);

        // Prevent the view from moving outside the world bounds
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

        // Move the view
        Bounds.translate(this.render.bounds, this.translate);

        // Update the mouse too
        Mouse.setOffset(this.render.mouse, this.render.bounds.min);
      }
    });
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
   * Set the Renderer's events for updates
   * @return {MatterWorld}
   */
  setRenderEvents() {
    // Render events
    Events.on(this.render, 'beforeRender', (event) => {

    });

    Events.on(this.render, 'afterRender', (event) => {

    });
  }

  /**
   * Set the Runner's events for updates
   * @return {MatterWorld}
   */
  setRunnerEvents() {
    // Tick Events
    Events.on(this.runner, 'beforeTick', (event) => {

    });

    // Update events
    Events.on(this.runner, 'beforeUpdate', (event) => {

    });

    Events.on(this.runner, 'tick', (event) => {
      let bodies = Composite.allBodies(this.engine.world);
      for (let i = 0; i < bodies.length; i++) {
        if (!bodies[i].isStatic && bodies[i].entity !== undefined) {
          bodies[i].entity.tick(bodies);
        }
      }
    });

    Events.on(this.runner, 'afterUpdate', (event) => {
      let bodies = Composite.allBodies(this.engine.world);
      for (let i = 0; i < bodies.length; i++) {
        if (!bodies[i].isStatic && bodies[i].entity !== undefined) {
          this.checkBounds(bodies[i]);
        }
      }
    });

    Events.on(this.runner, 'afterTick', (event) => {
      if (this.rewards) {
        this.rewards.graphRewards();
      }
    });

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
   * Update the body with new position and force
   * @param {Matter.Body} body
   * @param {Matter.Vector} position
   * @param {Matter.Vector} force
   * @return {MatterWorld}
   */
  updateBody(body, position, force) {
    body.entity.force = force;
    Body.applyForce(body, position, force);

    return this;
  }


  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} points - number of points (or number of sides for polygons)
   * @param {number} radA - "outer" radius of the star
   * @param {number} radB - "inner" radius of the star (if equal to radius1, a polygon is drawn)
   * @param {number} a - initial angle (clockwise), by default, stars and polygons are 'pointing' up
   */
  static drawStarHexShape(x, y, points, radA, radB, a) {
    let i, angle, radius, vertices = [];
    if (radB !== radA) {
      points = 2 * points;
    }
    for (i = 0; i <= points; i++) {
      angle = i * 2 * Math.PI / points - Math.PI / 2 + a;
      radius = i % 2 === 0 ? radA : radB;
      let px = x + radius * Math.cos(angle),
        py = y + radius * Math.sin(angle);
      vertices.push({
        x: px,
        y: py
      });
    }

    return vertices;
  }
}

MatterWorld.entityTypes = entityTypes;
MatterWorld.textColorStyles = textColorStyles;
MatterWorld.hexColorStyles = hexColorStyles;
MatterWorld.entityCollisionCategories = entityCollisionCategories;
