/**
 * The flags for what to display for 'cheats'
 * @typedef {Object} cheatsOpts
 * @property {boolean} id
 * @property {boolean} name
 * @property {boolean} angle
 * @property {boolean} bounds
 * @property {boolean} direction
 * @property {boolean} gridLocation
 * @property {boolean} position
 */
const cheatOpts = {
    id: false,
    name: false,
    angle: false,
    bounds: false,
    direction: false,
    gridLocation: false,
    position: false
  },
  /**
   * Default collision engine options
   * @typedef {Object} collisionOpts
   * @property {string} type - The speed of the simulation
   * @property {number} maxChildren - The speed of the simulation
   * @property {number} simSpeed - The speed of the simulation
   * @property {cheatOpts} cheats - The speed of the simulation
   */
  collisionOpts = {
    type: 'quad',
    maxChildren: 3,
    maxDepth: 8,
    cheats: cheatOpts
  },
  /**
   *
   * @type {Element}
   */
  element = document.body.querySelector('#game-container'),
  /**
   * Default options for the World renderer
   * @typedef {Object} renderOpts
   * @property {boolean} antialiasing - sets antialias (only applicable in chrome at the moment)
   * @property {HTMLCanvasElement} view - the canvas to use as a view, optional
   * @property {boolean} transparent - If the render view is transparent, default false
   * @property {boolean} preserveDrawingBuffer - enables drawing buffer preservation, enable this if you
   *      need to call toDataUrl on the webgl context
   * @property {number} resolution - the resolution of the renderer, retina would be 2
   * @property {boolean} noWebGL - prevents selection of WebGL renderer, even if such is present
   * @property {number} width - The width
   * @property {number} height - The height
   */
  renderOpts = {
    background: '0xFFFFFF',
    antialiasing: true,
    autoResize: false,
    resolution: window.devicePixelRatio,
    resizable: true,
    transparent: true,
    noWebGL: false,
    width: 800,
    height: 800
  },
  /**
   * Options for the World
   * @typedef {Object} worldOpts
   * @property {number} simSpeed - The speed of the simulation
   * @property {collisionOpts} collision - The collision definition
   * @property {cheatOpts} cheats - The cheats definition
   * @property {renderOpts} render - The render options to use for them
   * @property {agentOpts} agent - The Agent options to use for them
   * @property {entityOpts} entity - The Entity options to use for them
   * @property {entityAgentOpts} entityAgent - The EntityAgent options to use for them
   * @property {Grid} grid - The grid to use
   * @property {Maze} maze - The maze to use
   */
  worldOpts = {
    simSpeed: 1,
    collision: collisionOpts,
    cheats: cheatOpts,
    render: renderOpts,
    agent: {
      number: 0,
      radius: 10,
      collision: true,
      interactive: true,
      useSprite: false,
      moving: true,
      cheats: cheatOpts
    },
    entity: {
      number: 0,
      radius: 10,
      collision: true,
      interactive: true,
      useSprite: false,
      moving: true,
      cheats: cheatOpts
    },
    entityAgent: {
      number: 0,
      radius: 10,
      collision: true,
      interactive: true,
      useSprite: false,
      moving: true,
      cheats: cheatOpts
    },
    grid: {},
    maze: {}
  },

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
  blackColor = '#000000';

/**
 * @class GameWorld
 * @property {worldOpts} options
 * @property {Array} agents
 * @property {Array} agentOpts
 * @property {Array} entityAgents
 * @property {Array} entityAgentOpts
 * @property {Array} entities
 * @property {Array} entityOpts
 * @property {Array} walls
 * @property {Grid} grid
 * @property {Maze} maze
 * @property {number} simSpeed
 * @property {string} theme
 * @property {cheatOpts} cheats
 * @property {collisionOpts} collision
 * @property {number} sid
 * @property {number} stepsPerTick
 * @property {number} clock
 * @property {boolean} pause
 * @property {number} width
 * @property {number} height
 * @property {boolean} resizable
 */
class GameWorld {

  /**
   * Make a World
   * @constructor
   *
   * @param {Array} agents
   * @param {Array} walls
   * @param {worldOpts} options
   * @return {GameWorld}
   */
  constructor(agents = [], walls = [], options = worldOpts) {
    this.walls = walls;
    this.options = options;
    this.grid = Utility.getOpt(this.options, 'grid', false);
    this.maze = Utility.getOpt(this.options, 'maze', false);
    this.simSpeed = Utility.getOpt(this.options, 'simSpeed', 1);
    this.theme = Utility.getOpt(this.options, 'theme', 'space');
    this.cheats = Utility.getOpt(this.options, 'cheats', cheatOpts);
    this.collision = Utility.getOpt(this.options, 'collision', collisionOpts);
    this.numEntities = Utility.getOpt(this.options.entity, 'number', 0);
    this.numEntityAgents = Utility.getOpt(this.options.entityAgent, 'number', 0);

    this.sid = -1;
    this.stepsPerTick = 1;
    this.clock = 0;
    this.pause = false;
    this.width = this.options.render.width;
    this.height = this.options.render.height;
    this.resizable = this.options.render.resizable;

    // this.renderer = new Pixi(element, this.options.render);
    this.renderer = PIXI.autoDetectRenderer(this.width, this.height, this.options.render);
    this.renderer.backgroundColor = this.options.render.background || 0xFFFFFF;
    this.renderer.view.style.pos = 'absolute';
    this.renderer.view.style.top = '0px';
    this.renderer.view.style.left = '0px';
    this.canvas = this.renderer.view;
    element.appendChild(this.canvas);

    this.agents = agents || [];
    this.entityAgents = [];
    this.entities = [];
    this.settings = {
      pause: this.pause,
      simSpeed: this.simSpeed,
      render: this.options.render,
      cheats: this.cheats,
      agents: this.options.agent,
      entities: this.options.entity,
      entityAgents: this.options.entityAgent
    };
    this.population = new Map();
    this.stage = new PIXI.Container();
    this.stage.interactive = true;

    this.uiLayer = new PIXI.Container();
    this.uiLayer.id = 'uiLayer';
    this.worldLayer = new PIXI.Container();
    this.worldLayer.id = 'worldLayer';
    this.staticLayer = new PIXI.Container();
    this.staticLayer.id = 'staticLayer';
    this.entityLayer = new PIXI.Container();
    this.entityLayer.id = 'entityLayer';
    if (this.grid && this.grid.cellsContainer) {
      this.gridLayer = this.grid.cellsContainer;
      this.gridLayer.id = 'gridLayer';
      this.worldLayer.addChild(this.gridLayer);
    }
    this.worldLayer.addChild(this.staticLayer);
    this.worldLayer.addChild(this.entityLayer);
    this.stage.addChild(this.worldLayer);
    this.stage.addChild(this.uiLayer);

    if (this.resizable) {
      let resize = () => {
        let ratio = Math.min(window.innerWidth / this.width, window.innerHeight / this.height);
        this.stage.scale.x = this.stage.scale.y = ratio;
        this.renderer.resize(Math.ceil(this.width * ratio), Math.ceil(this.height * ratio));
      };
      window.addEventListener("resize", resize);
      resize();
    }
    if (CollisionDetector) {
      CollisionDetector.apply(this, [this.collision]);
    }

    return this;
  }

  parallaxTest() {
    let that = this;
    this.zoom = 1;
    this.useZoom = true;

    this.baseContainer = new PIXI.Container();
    this.camera = new ParallaxCamera(this.renderer, this.baseContainer, 150, 10);
    this.stage.addChild(this.baseContainer);

    this.bgLayer = new ParallaxLayer(-10); // Bottom
    this.entityLayer = new ParallaxLayer(1); // Main
    this.uiLayer = new ParallaxLayer(10); // Top

    this.camera.addLayer(this.bgLayer);
    this.camera.addLayer(this.entityLayer);
    this.camera.addLayer(this.uiLayer);

    // Set background
    this.bg = new PIXI.Graphics();
    this.bg.beginFill(0xFFFFFF);
    this.bg.drawRect(0, 0, this.width, this.height);
    this.bg.endFill();
    this.bgLayer.addChild(this.bg);

    // Draw target layer
    this.target = new PIXI.Graphics();
    this.target.beginFill(0xFF0000, 1);
    this.target.drawRect(0, 0, 100, 100);
    this.target.endFill();
    this.entityLayer.addChild(this.target);

    this.camera.setTarget(this.target, false);

    // Draw camera boundaries
    this.bounds = new PIXI.Graphics();
    this.bounds.lineStyle(10, 0x00FF00, 0.3);
    this.bounds.beginFill(0x0000FF, 0.3);
    this.bounds.drawRect(0, 0, this.width, this.height);
    this.bounds.endFill();
    this.camera.bounds = new PIXI.Rectangle(-this.width, -this.height, this.width * 2, this.height * 2);
    this.uiLayer.addChild(this.bounds);

    let gridOpts = {
      width: this.width,
      height: this.height,
      buffer: 0,
      size: 10,
      cellSize: 60,
      cellSpacing: 0,
      fill: true,
      closed: false,
      useSprite: false,
      cheats: cheatOptsDef
    };
    this.grid = new Grid(null, null, gridOpts);
    this.maze = new Maze(this.grid.init());
    this.walls = this.maze.walls;
    this.addWalls();
    this.addEntities(40);

    let update = function () {
        if (that.isMoving) {
          that.renderer.plugins.interaction.eventData.data.getLocalPosition(that.target.parent, that._p);
          let dx = that._p.x - that.target.x,
            dy = that._p.y - that.target.y,
            angle = Math.atan2(dy, dx);
          that.target.x += 8 * Math.cos(angle);
          that.target.y += 8 * Math.sin(angle);
        }

        if (that.useZoom) {
          that.camera.zoom += (that.zoom - that.camera.zoom) / 15;
        }

        that.camera.update();
      },
      initControls = function () {
        that.touchId = -1;
        that.isMoving = false;
        that._p = new PIXI.Point(0, 0);

        let zoom = 0.6;

        that.stage.on('mousedown', function (e) {
          that.isMoving = true;
          that.zoom = zoom;
        });

        that.stage.on('mouseup', function (e) {
          that.isMoving = false;
          that.zoom = 1;
        });

        that.stage.on('touchstart', function (e) {
          if (that.touchId != -1) {
            return;
          }
          that.touchId = e.data.identifier;
          that.isMoving = true;
          that.zoom = zoom;
        });

        that.stage.on('touchend', function (e) {
          if (e.data.identifier != that.touchId) {
            return;
          }
          that.touchId = -1;
          that.isMoving = false;
          that.zoom = 1;
        });
      },
      animate = () => {
        if (!that.pause) {
          that.deltaTime = GameWorld.time() - that.lastTime;
          that.lastTime = GameWorld.time();
          update();
        }
        that.renderer.render(that.stage);
        requestAnimationFrame(animate);
      };

    this.deltaTime = 0;
    this.lastTime = GameWorld.time();
    initControls();
    animate();

    return this;
  }

  /**
   * Initialize the world
   */
  init() {
    let animate = () => {
      if (!this.pause) {
        this.deltaTime = GameWorld.time() - this.lastTime;
        this.lastTime = GameWorld.time();
        for (let k = 0; k < this.stepsPerTick; k++) {
          this.tick(this.deltaTime);
        }
      }
      this.renderer.render(this.stage);
      requestAnimationFrame(animate);
    };

    // Walls
    this.addWalls();
    // Add the entities
    this.addEntities();
    // Population of Agents that are considered 'smart' entities for the environment
    this.addEntityAgents();
    // Population of Agents for the environment
    this.addAgents();

    this.deltaTime = 0;
    this.lastTime = GameWorld.time();

    animate();
  }

  /**
   * Add the Agents
   *
   * @return {GameWorld}
   */
  addAgents() {
    // Add the agents
    for (let a = 0; a < this.agents.length; a++) {
      if (this.agents[a].eyes !== undefined) {
        for (let ei = 0; ei < this.agents[a].eyes.length; ei++) {
          this.agents[a].graphics.addChild(this.agents[a].eyes[ei].graphics);
        }
      }
      if (this.agents[a].hexStyles !== undefined) {
        this.agents[a].color = this.agents[a].hexStyles[this.agents[a].type];
      }
      this.entityLayer.addChild(this.agents[a].graphics);
      this.population.set(this.agents[a].id, this.agents[a]);
    }

    return this;
  }

  /**
   * Add some entities that are Agents
   *
   * @return {GameWorld}
   */
  addEntityAgents() {
    let startXY,
      r = this.options.entityAgent.radius;
    for (let k = 0; k < this.numEntityAgents; k++) {
      if (this.grid && this.grid.startCell !== undefined) {
        let numb = Math.floor(Math.random() * this.grid.cells.length),
          startCell = this.grid.cells[numb],
          randAdd = Utility.Maths.randi(-7, 7);
        startXY = new Vec(startCell.center.x + randAdd, startCell.center.y + randAdd);
      } else {
        startXY = new Vec(
          Utility.Maths.randi(r, this.width - r),
          Utility.Maths.randi(r, this.height - r)
        );
      }
      startXY.vx = Math.random() * 5 - 2.5;
      startXY.vy = Math.random() * 5 - 2.5;
      let entityAgent = new EntityRLDQN(startXY, this.options.entityAgent);
      for (let ei = 0; ei < entityAgent.eyes.length; ei++) {
        entityAgent.graphics.addChild(entityAgent.eyes[ei].graphics);
      }
      this.entityAgents.push(entityAgent);
      this.entityLayer.addChild(entityAgent.graphics);
      this.population.set(entityAgent.id, entityAgent);
    }

    return this;
  }

  /**
   * Add new entities
   *
   * @parameter {number} number
   * @return {GameWorld}
   */
  addEntities(number = null) {
    let startXY,
      r = this.options.entity.radius,
      num = (number) ? number : this.numEntities;
    this.entities = [];
    // Populating the world
    for (let k = 0; k < num; k++) {
      if (this.grid && this.grid.startCell !== undefined) {
        let n = Math.floor(Math.random() * this.grid.cells.length),
          startCell = this.grid.cells[n],
          randAdd = Utility.Maths.randi(-(this.grid.cellSize / 2 - r), this.grid.cellSize / 2 - r);
        startXY = new Vec(
          Utility.Maths.randi(r, this.width - r),
          Utility.Maths.randi(r, this.height - r)
          // startCell.center.x + randAdd,
          // startCell.center.y + randAdd
        );
        this.options.entity.gridLocation = startCell;
      } else {
        startXY = new Vec(
          Utility.Maths.randi(r, this.width - r),
          Utility.Maths.randi(r, this.height - r)
        );
      }
      startXY.vx = Utility.Maths.randf(-3, 3);
      startXY.vy = Utility.Maths.randf(-3, 3);
      let entity = new Entity(Utility.Maths.randi(1, 3), startXY, this.options.entity);

      this.entities.push(entity);
      this.entityLayer.addChild(entity.graphics);
      this.population.set(entity.id, entity);
      // if (entity.cheatsContainer !== undefined) {
      //   this.uiLayer.addChild(entity.cheatsContainer);
      // }
    }

    return this;
  }

  /**
   * Add the Walls
   *
   * @return {GameWorld}
   */
  addWalls() {
    if (this.walls.length < 1) {
      this.walls = [];
      this.walls.push(new Wall(new Vec(1, 1), new Vec(this.width - 1, 1), this.cheats, 'Top'));
      this.walls.push(new Wall(new Vec(this.width - 1, 1), new Vec(this.width - 1, this.height - 1), this.cheats, 'Right'));
      this.walls.push(new Wall(new Vec(1, this.height - 1), new Vec(this.width - 1, this.height - 1), this.cheats, 'Bottom'));
      this.walls.push(new Wall(new Vec(1, 1), new Vec(1, this.height - 1), this.cheats, 'Left'));
    }
    // Add the walls to the world
    this.walls.forEach((wall) => {
      this.entityLayer.addChild(wall.graphics);
      this.population.set(wall.id, wall);
    });

    return this;
  }

  /**
   * Remove the entity from the world
   *
   * @param {string} id
   * @return {GameWorld}
   */
  deleteEntity(id) {
    if (this.population.has(id)) {
      let entity = this.population.get(id);
      this.entityLayer.removeChildAt(
        this.entityLayer.getChildIndex(entity.graphics)
      );
      this.population.delete(id);
    }
    return this;
  }

  /**
   * Load a EZGUI theme
   *
   * @param guiObj
   * @param theme
   */
  loadTheme(guiObj, theme) {
    PIXI.utils.textureCache = {};
    PIXI.utils.baseTextureCache = {};

    return EZGUI.Theme.load(['img/gui-themes/' + theme + '-theme/' + theme + '-theme.json'], () => {
      this.guiContainer = EZGUI.create(guiObj, theme);
      this.pause = true;
      EZGUI.components.btnSave.on('click', (event) => {
        this.event = event;
        this.guiContainer.visible = false;
        this.pause = false;
      });
      EZGUI.components.btnCancel.on('click', (event) => {
        this.event = event;
        this.guiContainer.visible = false;
        this.pause = false;
      });
      this.stage.addChild(this.guiContainer);
    });
  }

  /**
   *
   * @param event
   */
  onWheel(event) {
    // Firefox has "detail" prop with opposite sign to std wheelDelta
    let delta = event.wheelDelta || -event.detail,
      localPt = new PIXI.Point(),
      point = new PIXI.Point(event.pageX, event.pageY),
      factor = (delta > 0) ? 1.1 : 1 / 1.1,
      interaction = PIXI.interaction.InteractionData;
    interaction.prototype.getLocalPosition(this.parent, localPt, point);

    this.stage.pivot = localPt;
    this.stage.position = point;
    this.stage.scale.x *= factor;
    this.stage.scale.y *= factor;
  }

  /**
   * Toggles pause
   */
  pauseToggle() {
    this.pause = !this.pause;
    if (!this.pause) {
      this.lastTime = this.time();
    }
  }

  /**
   *
   */
  setSize() {
    // Determine which screen dimension is most constrained
    let ratio = Math.min(window.innerWidth / this.width, window.innerHeight / this.height);
    // Scale the view appropriately to fill that dimension
    this.stage.scale.x = this.stage.scale.y = ratio;
    // Update the renderer dimensions
    this.renderer.resize(Math.ceil(this.width * ratio), Math.ceil(this.height * ratio));
  }

  /**
   * Tick the environment
   *
   * @param {number} timeSinceLast
   * @return {GameWorld}
   */
  tick(timeSinceLast) {
    this.updatePopulation();

    let popCount = 0;
    for (let [id, entity] of this.population.entries()) {
      if (entity.type !== 0) {
        // Check them for collisions
        this.check(entity);
        // Loop through the eyes and check the walls and nearby entities
        for (let ae = 0, ne = entity.numEyes; ae < ne; ae++) {
          this.check(entity.eyes[ae]);
        }

        // Tick them
        entity.tick();

        let top = this.height - (this.height - entity.radius),
          bottom = this.height - entity.radius,
          left = this.width - (this.width - entity.radius),
          right = this.width - entity.radius;

        // Tweak them
        if (entity.position.x < left) {
          entity.position.x = left;
          entity.force.x = entity.speed * 0.95;
        }

        if (entity.position.x > right) {
          entity.position.x = right;
          entity.force.x = -entity.speed * 0.95;
        }

        if (entity.position.y < top) {
          entity.position.y = top;
          entity.force.y = entity.speed * 0.95;
        }

        if (entity.position.y > bottom) {
          entity.position.y = bottom;
          entity.force.y = -entity.speed * 0.95;
        }

        if (entity.useSprite) {
          entity.sprite.position.set(entity.position.x, entity.position.y);
        }
        if (entity.cleanUp === true || ((entity.type === 2 || entity.type === 1) && entity.age > 5000)) {
          this.deleteEntity(entity.id);
        } else if (entity.type === 2 || entity.type === 1) {
          popCount++;
        }
      }
      entity.draw();
    }

    // If we have less then the number of Items allowed throw a random one in
    if (popCount < this.numEntities) {
      this.addEntities(this.numEntities - popCount);
    }

    if (this.rewards) {

      this.rewards.graphRewards();
    }

    return this;
  }

  /**
   * Return the time
   *
   * @return {number}
   */
  static time() {
    return new Date().getTime() / 1000;
  }
}
