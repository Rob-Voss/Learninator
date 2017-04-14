// P2 aliases
const
  Body = p2.Body,
  Box = p2.Box,
  Circle = p2.Circle,
  Capsule = p2.Capsule,
  Convex = p2.Convex,
  ContactMaterial = p2.ContactMaterial,
  Heightfield = p2.Heightfield,
  Line = p2.Line,
  Material = p2.Material,
  Plane = p2.Plane,
  Particle = p2.Particle,
  vec2 = p2.vec2,
  World = p2.World;

/**
   * @class Game
   * @property {object} options
   */
  class Game {

  /**
   * Game
   * @constructor
   * @param {object} options
   */
  constructor(options = {}) {
    this.options = options;
    this.rendererOptions = options.renderOptions || {
          background: 0x000000,
          antialiasing: true,
          autoResize: false,
          resizable: false,
          transparent: false,
          noWebGL: true,
          useDeviceAspect: false,
          resolution: 1,//window.devicePixelRatio,
          width: 800,
          height: 400,
          pixelsPerLengthUnit: 100
        };
    /**
     * @type {P2Pixi}
     */
    this.renderer = new P2Pixi(this.rendererOptions);
    this.options.worldOptions = {};
    this.options.worldOptions.gravity = [0, -9.8];
    this.options.trackedBodyOffset = [0, 0.8];

    /**
     * @type {p2.World}
     */
    this.world = new World(this.options.worldOptions);

    this.gameObjects = [];
    this.trackedBody = null;

    this.paused = false;
    this.windowFocused = true;

    this.lastWorldStepTime = null;
    this.assetsLoaded = false;

    this.touchEnabled = false;

    this.Ball();

    if (this.options.assetUrls) {
      this.loadAssets(this.options.assetUrls);
    } else {
      this.runIfReady();
    }
  }


  addBody() {
    this.world.addBody(this.body);
    this.renderer.container.addChild(this.container);
  }

  /**
   * Adds the supplied GameObject
   * @param  {GameObject} gameObject
   */
  addGameObject(gameObject) {
    this.gameObjects.push(gameObject);
  }

  /**
   * Called after rendering
   */
  afterRender() {

  };

  /**
   * Called before rendering
   */
  beforeRender() {
    let trackedBody = this.trackedBody;
    // Focus on tracked body, if set
    if (trackedBody !== null) {
      let render = this.renderer,
          renderer = render.renderer,
          ppu = render.pixelsPerLengthUnit,
          containerPosition = render.container.position,
          trackedBodyPosition = trackedBody.position,
          trackedBodyOffset = this.options.trackedBodyOffset,
          x = ((trackedBodyOffset[0] + 1) * renderer.width * 0.5) - (trackedBodyPosition[0] * ppu),
          y = ((trackedBodyOffset[1] + 1) * renderer.height * 0.5) + (trackedBodyPosition[1] * ppu);

      containerPosition.x = x;
      containerPosition.y = y;
    }
  }

  /**
   * Called before the game loop is started
   */
  beforeRun() {
    window.addEventListener('blur', (event) => {
      this.windowBlur(event);
    });
    window.addEventListener('focus', (event) => {
      this.windowFocus(event);
    });
  };

  /**
   * Removes all GameObjects
   */
  clear() {
    while (this.gameObjects.length > 0) {
      this.gameObjects[0].delete(this);
    }
  }

  Ball(position) {
    let self = this;

    this.actorMaterial = new Material();
    this.actor = new GameObject(this, new Body({mass: 0.1, position: position || [0, 0]}), new Circle({radius: 0.25, material: this.actorMaterial}), {styleOptions: {lineWidthUnits: 0.01, lineColor: 0xFFFFFF, fillColor: 0x0000FF}});
    this.actor.lastCallTime = Game.time();
    this.actor.velocity = [];
    this.actor.speed = 1;
    this.actor.jumpSpeed = 1;
    this.actor.maximumSpeed = 15;
    this.actor.accelerationRate = 5;
    this.actor.decelerationRate = 5;
    this.actor.reverseDirectionRate = 3;
    this.actor.direction = 0;
    this.actor.touchEnabled = false;
    this.addGameObject(this.actor);

    this.groundMaterial = new Material();
    let heights = [];
    for (let i = 0; i < 1500; i++) {
      let height = 0.2 * Math.cos(0.2 * i) * Math.sin(0.5 * i) + 0.2 * Math.sin(0.1 * i) * Math.sin(0.05 * i);
      heights.push(height);
    }
    this.ground = new GameObject(this, new Body({position: [-100, 0]}), new Heightfield({heights: heights, elementWidth: 0.3, material: this.groundMaterial}), {styleOptions: {lineWidthUnits: 0.01, lineColor: 0xFFFFFF, fillColor: 0x00FF00}});
    this.addGameObject(this.ground);

    this.subGround = new GameObject(this, new Body({position: [0, -0.4]}), new Plane({material: this.groundMaterial}), {});
    this.addGameObject(this.subGround);

    // Init contact materials
    this.groundCharacterCM = new ContactMaterial(this.groundMaterial, this.actorMaterial, {friction: 1});
    this.world.addContactMaterial(this.groundCharacterCM);

    GameObject.prototype.getSpeed = function() {
      return this.speed;
    };
    GameObject.prototype.setSpeed = function(speed) {
      this.speed = speed;
    };
    GameObject.prototype.accelerateLeft = function() {
      this.direction = -1;
    };
    GameObject.prototype.accelerateRight = function() {
      this.direction = 1;
    };
    GameObject.prototype.accelerateUp = function() {
      this.direction = 2;
    };
    GameObject.prototype.endAcceleration = function() {
      this.direction = 0;
    };

    document.addEventListener('keydown', function(e) {
      let keyID = window.event ? event.keyCode : (e.keyCode !== 0 ? e.keyCode : e.which);
      switch (keyID) {
        case 37: // Left
          self.actor.accelerateLeft();
          break;
        case 38: // Up
        case 32: // Space
          self.actor.accelerateUp();
          break;
        case 39: // Right
          self.actor.accelerateRight();
          break;
      }
    });

    document.addEventListener('keyup', function(e) {
      let keyID = window.event ? event.keyCode : (e.keyCode !== 0 ? e.keyCode : e.which);
      switch (keyID) {
        case 38: // Up
        case 32: // Space
        case 37: // Left
        case 39: // Right
          self.actor.endAcceleration();
          break;
      }
    });

    this.world.on('postStep', (event) => {
      // console.log("postStep");
      let time = Game.time(),
          bObj = this.actor,
          tDelta = time - bObj.lastCallTime;
      bObj.lastCallTime = time;

      if (bObj.direction === -1) {
        // Left
        bObj.speed -= (tDelta * (bObj.accelerationRate * (bObj.speed > 0 ? bObj.reverseDirectionRate : 1)));
        if (bObj.speed < -bObj.maximumSpeed) {
          bObj.speed = -bObj.maximumSpeed;
        }
      } else if (bObj.direction  === 1) {
        // Right
        bObj.speed += (tDelta * (bObj.accelerationRate * (bObj.speed < 0 ? bObj.reverseDirectionRate : 1)));
        if (bObj.speed > bObj.maximumSpeed) {
          bObj.speed = bObj.maximumSpeed;
        }
        bObj.angle = 0.8;
      } else if (bObj.direction  === 2)  {
        if (bObj.speed < 0) {
          bObj.speed += (tDelta * bObj.decelerationRate);
        } else if (bObj.speed > 0) {
          bObj.speed -= (tDelta * bObj.decelerationRate);
        }
        bObj.body.velocity[1] = bObj.speed;
      }

      bObj.body.velocity[0] = bObj.speed;
    });

    this.world.on("beginContact", (event) => {
      // console.log("beginContact");
    });

    this.world.on("preSolve", (event) => {
      // console.log("preSolve");
    });

    this.world.on("endContact", (event) => {
      // console.log("endContact");
    });

    this.world.on("impact", (event) => {
      // console.log("impact");
    });

    this.world.on("postBroadphase", (event) => {
      // console.log("postBroadphase");
    });

    this.world.on("addSpring", (event) => {
      console.log("addSpring");
    });

    this.world.on("addBody", (event) => {
      console.log("addBody");
    });

    this.world.on("removeBody", (event) => {
      console.log("removeBody");
    });

    this.trackedBody = this.actor.body;
    this.assetsLoaded = true;
  }

  /**
   * Returns true if all async setup functions are complete
   * and the Game is ready to start.
   * Override this to implement multiple setup functions
   * @return {boolean}
   */
  isReadyToRun() {
    return this.assetsLoaded;
  }

  /**
   * Loads the supplied assets asyncronously using PIXI.loader
   * @param {string[]} assetUrls
   */
  loadAssets(assetUrls) {
    let loader = PIXI.loader;
    for (let i = 0; i < assetUrls.length; i++) {
      loader.add(assetUrls[i], assetUrls[i]);
    }

    loader.once('complete', () => {
      this.assetsLoaded = true;
      this.runIfReady();
    });

    loader.load();
  }

  /**
   * Toggles pause state
   */
  pauseToggle() {
    this.paused = !this.paused;
    if (!this.paused) {
      this.lastWorldStepTime = Game.time();
    }
  }

  /**
   * Updates the Pixi representation of the world
   */
  render() {
    for (let i = 0; i < this.gameObjects.length; i++) {
      this.gameObjects[i].updateTransforms(this);
    }
    this.renderer.renderer.render(this.renderer.stage);
  }

  /**
   * Begins the world step / render loop
   */
  run() {
    this.fixedTimeStep = 1 / 60;
    this.maxSubSteps = 10;
    this.lastWorldStepTime = Game.time();

    let update = () => {
      if (this.windowFocused && !this.paused) {
        let timeSinceLastCall = Game.time() - this.lastWorldStepTime;
        this.lastWorldStepTime = Game.time();
        this.world.step(this.fixedTimeStep, timeSinceLastCall, this.maxSubSteps);
      }
      this.beforeRender();
      this.render();
      this.afterRender();
      requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }

  /**
   * Checks if all assets are loaded and if so, runs the game
   */
  runIfReady() {
    if (this.isReadyToRun()) {
      this.beforeRun();
      this.run();
    }
  }

  /**
   * Returns the current time in seconds
   * @return {number}
   */
  static time() {
    return new Date().getTime() / 1000;
  }

  /**
   * Called when the window loses focus
   * @param {event} event
   */
  windowBlur(event) {
    this.windowFocused = false;
  }

  /**
   * Called when the window gets focus
   * @param {event} event
   */
  windowFocus(event) {
    this.windowFocused = true;
    this.pauseToggle();
  }
}
