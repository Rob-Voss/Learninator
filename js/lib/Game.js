const Body = p2.Body,
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

class Game {

  /**
   * @constructor
   * @param  {Object} options
   */
  constructor(options) {
    options = options || {};
    options.pixiAdapterOptions = options.pixiAdapterOptions || {
          background: 0x000000,
          antialiasing: false,
          autoResize: false,
          resizable: false,
          transparent: false,
          noWebGL: false,
          useDeviceAspect: false,
          resolution: window.devicePixelRatio,
          width: 800,
          height: 400,
          pixelsPerLengthUnit: 80
        };
    options.pixiAdapter = options.pixiAdapter || new p2Pixi(options.pixiAdapterOptions);
    options.worldOptions = options.worldOptions || {};
    options.worldOptions.gravity = options.worldOptions.gravity || [0, -9.8];
    options.trackedBodyOffset = options.trackedBodyOffset || [0, 0.8];

    this.options = options;
    this.pixiAdapter = options.pixiAdapter;
    this.world = new World(options.worldOptions);

    this.gameObjects = [];
    this.trackedBody = null;

    this.paused = false;
    this.windowFocused = true;

    this.lastWorldStepTime = null;
    this.assetsLoaded = false;

    this.world.defaultContactMaterial.friction = 0.5;
    this.world.setGlobalStiffness(1e5);
    this.touchEnabled = false;

    this.Ball();

    if (options.assetUrls) {
      this.loadAssets(options.assetUrls);
    } else {
      this.runIfReady();
    }
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
      let pixiAdapter = this.pixiAdapter,
          renderer = pixiAdapter.renderer,
          ppu = pixiAdapter.pixelsPerLengthUnit,
          containerPosition = pixiAdapter.container.position,
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
    var self = this;
    window.addEventListener('blur', function(e) {
      self.windowBlur(e);
    });
    window.addEventListener('focus', function(e) {
      self.windowFocus(e);
    });
  };

  /**
   * Removes all GameObjects
   */
  clear() {
    while (this.gameObjects.length > 0) {
      Game.removeGameObject(this.gameObjects[0]);
    }
  }

  Ball(position) {
    var self = this;

    this.actorMaterial = new Material();
    this.actor = new GameObject(self, new Body({mass: 0.1, position: position || [0, 0]}), new Circle({radius: 0.25, material: this.actorMaterial}), {styleOptions: {lineWidthUnits: 0.01, lineColor: 0xFFFFFF, fillColor: 0x0000FF}});
    this.actor.lastCallTime = Game.time();
    this.actor.velocity = [];
    this.actor.speed = 2;
    this.actor.jumpSpeed = 6;
    this.actor.maximumSpeed = 25;
    this.actor.accelerationRate = 10;
    this.actor.decelerationRate = 10;
    this.actor.reverseDirectionRate = 3;
    this.actor.direction = 0;
    this.actor.touchEnabled = false;
    this.addGameObject(this.actor);

    this.groundMaterial = new Material();
    var heights = [];
    for (var i = 0; i < 500; i++) {
      heights.push(0.2 * Math.cos(0.2 * i) * Math.sin(0.5 * i) + 0.2 * Math.sin(0.1 * i) * Math.sin(0.05 * i));
    }
    this.ground = new GameObject(self, new Body({position: [-100, 0]}), new Heightfield({heights: heights, elementWidth: 0.3, material: this.groundMaterial}), {styleOptions: {lineWidthUnits: 0.01, lineColor: 0xFFFFFF, fillColor: 0x00FF00}});
    this.addGameObject(this.ground);

    this.subGround = new GameObject(self, new Body({position: [0, -0.4]}), new Plane({material: this.groundMaterial}), {});
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
    GameObject.prototype.endAcceleration = function() {
      this.direction = 0;
    };

    document.addEventListener('keydown', function(e) {
      var keyID = window.event ? event.keyCode : (e.keyCode !== 0 ? e.keyCode : e.which);
      switch (keyID) {
        case 37:
          self.actor.accelerateLeft();
          break;
        case 38: // up
        case 32: // space
          //self.actor.body.velocity[1] = -self.jumpSpeed;
          break;
        case 39:
          self.actor.accelerateRight();
          break;
      }
    });

    document.addEventListener('keyup', function(e) {
      var keyID = window.event ? event.keyCode : (e.keyCode !== 0 ? e.keyCode : e.which);
      switch (keyID) {
        case 38: // up
        case 32:
          //self.actor.body.velocity[1] = 0;
          break;
        case 37:
        case 39:
          self.actor.endAcceleration();
          break;
      }
    });

    /*
     if (this.touchEnabled) {
     function onViewportTouchHold(e) {
     var touch = e.changedTouches ? e.changedTouches[0] : e;
     if (touch.clientX <= self.pixiAdapter.windowWidth / 2) {
     self.actor.accelerateLeft();
     } else {
     self.actor.accelerateRight();
     }
     }

     function onViewportRelease(e) {
     self.actor.endAcceleration();
     }

     self.pixiAdapter.renderer.view.addEventListener('touchstart', onViewportTouchHold, false);
     self.pixiAdapter.renderer.view.addEventListener('touchend', onViewportRelease, false);

     self.pixiAdapter.renderer.view.addEventListener('mousedown', onViewportTouchHold, false);
     self.pixiAdapter.renderer.view.addEventListener('mouseup', onViewportRelease, false);
     }
     */

    this.world.on('postStep', function(e) {
      var time = Game.time(),
          bObj = self.actor,
          tDelta = time - bObj.lastCallTime;
      bObj.lastCallTime = time;

      if (bObj.direction < 0) {
        bObj.speed -= (tDelta * (bObj.accelerationRate * (bObj.speed > 0 ? bObj.reverseDirectionRate : 1)));
        if (bObj.speed < -bObj.maximumSpeed) {
          bObj.speed = -bObj.maximumSpeed;
        }
      } else if (bObj.direction > 0) {
        bObj.speed += (tDelta * (bObj.accelerationRate * (bObj.speed < 0 ? bObj.reverseDirectionRate : 1)));
        if (bObj.speed > bObj.maximumSpeed) {
          bObj.speed = bObj.maximumSpeed;
        }
      } else {
        if (bObj.speed < 0) {
          bObj.speed += (tDelta * bObj.decelerationRate);
        } else if (bObj.speed > 0) {
          bObj.speed -= (tDelta * bObj.decelerationRate);
        }
      }

      bObj.body.velocity[0] = bObj.speed;
    });
    this.trackedBody = this.actor.body;
    this.assetsLoaded = true;
  }

  /**
   * Returns true if all async setup functions are complete
   * and the Game is ready to start.
   * Override this to implement multiple setup functions
   * @return {Boolean}
   */
  isReadyToRun() {
    return this.assetsLoaded;
  }

  /**
   * Loads the supplied assets asyncronously using PIXI.loader
   * @param  {String[]} assetUrls
   */
  loadAssets(assetUrls) {
    var loader = PIXI.loader,
        self = this;
    for (let i = 0; i < assetUrls.length; i++) {
      loader.add(assetUrls[i], assetUrls[i]);
    }

    loader.once('complete', function() {
      self.assetsLoaded = true;
      self.runIfReady();
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
   * Removes the supplied GameObject
   * @param  {GameObject} gameObject
   */
  static removeGameObject(gameObject) {
    gameObject.remove();
  }

  /**
   * Updates the Pixi representation of the world
   */
  render() {
    let gameObjects = this.gameObjects,
        pixiAdapter = this.pixiAdapter;
    for (let i = 0; i < gameObjects.length; i++) {
      gameObjects[i].updateTransforms(this);
    }
    pixiAdapter.renderer.render(pixiAdapter.stage);
  }

  /**
   * Begins the world step / render loop
   */
  run() {
    this.lastWorldStepTime = Game.time();

    var self = this;

    function update() {
      if (self.windowFocused && !self.paused) {
        let timeSinceLastCall = Game.time() - self.lastWorldStepTime;
        self.lastWorldStepTime = Game.time();
        self.world.step(1 / 60, timeSinceLastCall, 10);
      }
      self.beforeRender();
      self.render();
      self.afterRender();
      requestAnimationFrame(update);
    }

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
   * @return {Number}
   */
  static time() {
    return new Date().getTime() / 1000;
  }

  /**
   * Called when the window loses focus
   * @param  {Event} e
   */
  windowBlur(e) {
    this.windowFocused = false;
  }

  /**
   * Called when the window gets focus
   * @param  {Event} e
   */
  windowFocus(e) {
    this.windowFocused = true;
    if (!this.paused) {
      this.lastWorldStepTime = Game.time();
    }
  }
}