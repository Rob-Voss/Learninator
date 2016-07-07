(function(global) {
  'use strict';

//import 'PIXI';
//import Utility from '../lib/Utility.js';
//import Vec from '../lib/Vec.js';
//import CollisionDetector from '../lib/CollisionDetector.js';
//import Agent from '../entities/Agent.js';
//import Entity from '../entities/Entity.js';
//import EntityRLDQN from '../entities/EntityRLDQN.js';
//import Wall from '../entities/Wall.js';

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
   * @type {{id: boolean, name: boolean, angle: boolean, bounds: boolean, direction: boolean, gridLocation: boolean, position: boolean}}
   */
  const cheatOptsDef = {
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
     * @type {{type: string, maxChildren: number, maxDepth: number, cheats: {bounds: boolean}}}
     */
    collisionOptsDef = {
      type: 'quad',
      maxChildren: 10,
      maxDepth: 30,
      cheats: {
        bounds: cheatOptsDef.bounds
      }
    },
      /**
       *
       * @type {Element}
       */
    element = document.body.querySelector('#game-container'),
      /**
       * Options for the World
       * @typedef {Object} worldOpts
       * @property {number} simSpeed - The speed of the simulation
       * @property {collisionOpts} collision - The collision definition
       * @property {cheatsOpts} cheats - The cheats definition
       * @property {number} numEntities - The number of Entities to spawn
       * @property {entityOpts} entityOpts - The Entity options to use for them
       * @property {number} numEntityAgents - The number of EntityAgents to spawn
       * @property {entityAgentOpts} entityAgentOpts - The EntityAgent options to use for them
       * @property {Grid} grid - The grid to use
       * @property {Maze} maze - The maze to use
       * @type {{simSpeed: number, collision: {type: string, maxChildren: number, maxDepth: number, cheats: {bounds: boolean}}, cheats: {id: boolean, name: boolean, angle: boolean, bounds: boolean, direction: boolean, gridLocation: boolean, position: boolean}, numEntities: number, entityOpts: {radius: number, collision: boolean, interactive: boolean, useSprite: boolean, moving: boolean, cheats: {id: boolean, name: boolean, angle: boolean, bounds: boolean, direction: boolean, gridLocation: boolean, position: boolean}}, numEntityAgents: number, entityAgentOpts: {radius: number, collision: boolean, interactive: boolean, useSprite: boolean, moving: boolean, cheats: {id: boolean, name: boolean, angle: boolean, bounds: boolean, direction: boolean, gridLocation: boolean, position: boolean}}}}
       */
    worldOptsDef = {
      simSpeed: 1,
      collision: collisionOptsDef,
      cheats: cheatOptsDef,
      numEntities: 20,
      entityOpts: {
        radius: 10,
        collision: true,
        interactive: true,
        useSprite: false,
        moving: true,
        cheats: cheatOptsDef
      },
      numEntityAgents: 0,
      entityAgentOpts: {
        radius: 10,
        collision: true,
        interactive: true,
        useSprite: false,
        moving: true,
        cheats: cheatOptsDef
      }
    },
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
       * @type {{antialiasing: boolean, autoResize: boolean, background: number, resolution: *, resizable: boolean, transparent: boolean, noWebGL: boolean, width: number, height: number}}
       */
    renderOptsDef = {
      antialiasing: false,
      autoResize: false,
      background: 0xFFFFFF,
      resolution: window.devicePixelRatio,
      resizable: false,
      transparent: false,
      noWebGL: true,
      width: 600,
      height: 600
    };

/*export*/ class World {

  /**
   * Make a World
   * @constructor
   *
   * @param {Array} agents
   * @param {Array} walls
   * @param {worldOpts} worldOpts
   * @param {renderOpts} renderOpts
   * @return {World}
   */
  constructor(agents, walls, worldOpts, renderOpts) {
    this.walls = walls;
    this.renderOpts = renderOpts || renderOptsDef;
    this.options = worldOpts || worldOptsDef;
    this.grid = Utility.getOpt(this.options, 'grid', false);
    this.maze = Utility.getOpt(this.options, 'maze', false);
    this.simSpeed = Utility.getOpt(this.options, 'simSpeed', 1);
    this.theme = Utility.getOpt(this.options, 'theme', 'space');
    this.cheats = Utility.getOpt(this.options, 'cheats', cheatOptsDef);
    this.collision = Utility.getOpt(this.options, 'collision', collisionOptsDef);

    this.sid = -1;
    this.stepsPerTick = 1;
    this.clock = 0;
    this.pause = false;
    this.width = this.renderOpts.width;
    this.height = this.renderOpts.height;
    this.resizable = this.renderOpts.resizable;

    this.renderer = PIXI.autoDetectRenderer(this.width, this.height, this.renderOpts);
    this.renderer.backgroundColor = this.renderOpts.backgroundColor;
    this.renderer.view.style.pos = 'absolute';
    this.renderer.view.style.top = '0px';
    this.renderer.view.style.left = '0px';
    this.canvas = this.renderer.view;
    // Actually place the renderer onto the page for display
    element.appendChild(this.canvas);

    this.agents = agents || [];
    this.entityAgents = [];
    this.agentOpts = Utility.getOpt(this.options, 'agentOpts', {});
    this.agentOpts.cheats = JSON.parse(JSON.stringify(this.cheats));
    this.numEntities = Utility.getOpt(this.options, 'numEntities', 0);
    this.numEntityAgents = Utility.getOpt(this.options, 'numEntityAgents', 0);
    this.entityOpts = Utility.getOpt(this.options, 'entityOpts', {});
    this.entityOpts.cheats = JSON.parse(JSON.stringify(this.cheats));
    this.entityAgentOpts = Utility.getOpt(this.options, 'entityAgentOpts', {});
    this.entityAgentOpts.cheats = JSON.parse(JSON.stringify(this.cheats));
    this.settings = {
      pause: this.pause,
      simSpeed: this.simSpeed,
      cheats: this.cheats,
      agents: {
        cheats: this.agentOpts.cheats
      },
      entityLayer: {
        cheats: this.entityOpts.cheats
      },
      grid: {
        cheats: JSON.parse(JSON.stringify(this.cheats))
      },
      maze: {
        cheats: JSON.parse(JSON.stringify(this.cheats))
      }
    };

    this.population = new Map();
    this.stage = new PIXI.Container();
    this.worldLayer = new PIXI.Container();
    this.staticLayer = new PIXI.Container();
    this.entityLayer = new PIXI.Container();
    this.uiLayer = new PIXI.Container();
    this.gridLayer = (this.grid) ? this.grid.cellsContainer : new PIXI.Container();
    this.worldLayer.addChild(this.staticLayer);
    this.worldLayer.addChild(this.entityLayer);
    this.worldLayer.addChild(this.gridLayer);
    this.stage.addChild(this.worldLayer);
    this.stage.addChild(this.uiLayer);

    //this.camera = new Camera(this.worldLayer, element);
    //this.stage.addChild(this.camera);
    //this.camera.update();
    // this.interactions = new PIXI.interaction.InteractionManager(this.renderer);

    // Walls
    this.addWalls();
    // Add the entities
    this.addEntities();
    // Population of Agents that are considered 'smart' entities for the environment
    this.addEntityAgents();
    // Population of Agents for the environment
    this.addAgents();

    CollisionDetector.apply(this, [this.collision]);

    return this;
  }

  /**
   * Initialize the world
   */
  init() {
    let animate = () => {
      if (!this.pause) {
        this.deltaTime = this.time() - this.lastTime;
        this.lastTime = this.time();
        for (let k = 0; k < this.stepsPerTick; k++) {
          this.tick(this.deltaTime);
        }
      }
      this.camera.update();
      this.renderer.render(this.stage);
      requestAnimationFrame(animate);
    };

    this.deltaTime = 0;
    this.lastTime = this.time();
    animate();
  }

  /**
   * Add the Agents
   * @return {World}
   */
  addAgents() {
    // Add the agents
    for (let a = 0; a < this.agents.length; a++) {
      let agent = this.agents[a].graphics;
      if (this.agents[a].eyes !== undefined) {
        for (let ei = 0; ei < this.agents[a].eyes.length; ei++) {
          agent.addChild(this.agents[a].eyes[ei].graphics);
        }
      }
      if (this.agents[a].hexStyles !== undefined) {
        this.agents[a].color = this.agents[a].hexStyles[this.agents[a].type];
      }
      this.entityLayer.addChild(agent);
      this.population.set(this.agents[a].id, this.agents[a]);
    }

    return this;
  }

  /**
   * Add some noms
   * @return {World}
   */
  addEntityAgents() {
    let startXY,
        r = this.entityAgentOpts.radius;
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
      let entityAgent = new EntityRLDQN(startXY, this.entityAgentOpts),
          entity = entityAgent.graphics;
      for (let ei = 0; ei < entityAgent.eyes.length; ei++) {
        entity.addChild(entityAgent.eyes[ei].graphics);
      }
      this.entityAgents.push(entityAgent);
      this.entityLayer.addChild(entity);
      this.population.set(entityAgent.id, entityAgent);
    }

    return this;
  }

  /**
   * Add new entities
   * @parameter {number} number
   * @return {World}
   */
  addEntities(number = null) {
    let startXY,
        r = this.entityOpts.radius,
        num = (number) ? number : this.numEntities;

    // Populating the world
    for (let k = 0; k < num; k++) {
      if (this.grid && this.grid.startCell !== undefined) {
        let n = Math.floor(Math.random() * this.grid.cells.length),
            startCell = this.grid.cells[n],
            randAdd = Utility.Maths.randi(-(this.grid.cellSize / 2 - r), this.grid.cellSize / 2 - r);
        startXY = new Vec(startCell.center.x + randAdd, startCell.center.y + randAdd);
        this.entityOpts.gridLocation = startCell;
      } else {
        startXY = new Vec(
            Utility.Maths.randi(r, this.width - r),
            Utility.Maths.randi(r, this.height - r)
        );
      }
      startXY.vx = Utility.Maths.randf(-3, 3);
      startXY.vy = Utility.Maths.randf(-3, 3);
      let type = Utility.Maths.randi(1, 3),
          entity = new Entity(type, startXY, this.entityOpts);

      this.entityLayer.addChild(entity.graphics);
      this.population.set(entity.id, entity);
    }

    return this;
  }

  /**
   * Add the Walls
   * @return {World}
   */
  addWalls() {
    if (!this.walls) {
      this.walls.push(new Wall(new Vec(1, 1), new Vec(this.width - 1, 1), this.cheats, 'Top'));
      this.walls.push(new Wall(new Vec(this.width - 1, 1), new Vec(this.width - 1, this.height - 1), this.cheats, 'Right'));
      this.walls.push(new Wall(new Vec(1, this.height - 1), new Vec(this.width - 1, this.height - 1), this.cheats, 'Bottom'));
      this.walls.push(new Wall(new Vec(1, 1), new Vec(1, this.height - 1), this.cheats, 'Left'));
    }
    // Add the walls to the world
    this.walls.forEach((wall) => {
      this.staticLayer.addChild(wall.graphics);
      this.population.set(wall.id, wall);
    });

    return this;
  }

  /**
   * Remove the entity from the world
   * @param {string} id
   * @return {World}
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
   * @param {number} timeSinceLast
   * @return {World}
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
      } else {
        entity.draw();
      }
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
   * @return {number}
   */
  time() {
    return new Date().getTime() / 1000;
  }
}

// Checks for Node.js - http://stackoverflow.com/a/27931000/1541408
if (typeof process !== 'undefined') {
  module.exports = {
    World: World
  };
} else {
  global.World = World;
}

}(this));
