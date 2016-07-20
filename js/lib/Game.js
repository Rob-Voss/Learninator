class Game {

  /**
   * @constructor
   * @param  {Object} options
   */
  constructor(options) {
    options = options || {};
    options.pixiAdapterOptions = options.pixiAdapterOptions || {
          background: 0xFFFFFF,
          antialiasing: false,
          autoResize: false,
          resizable: false,
          transparent: false,
          noWebGL: false,
          useDeviceAspect: false,
          resolution: window.devicePixelRatio,
          width: 800,
          height: 800,
          pixelsPerLengthUnit: 80
        };
    options.pixiAdapter = options.pixiAdapter || new p2Pixi(options.pixiAdapterOptions);
    options.worldOptions = options.worldOptions || {};
    options.worldOptions.gravity = options.worldOptions.gravity || [0, -9.8];
    options.trackedBodyOffset = options.trackedBodyOffset || [0, 0.8];

    this.options = options;
    this.pixiAdapter = options.pixiAdapter;
    this.world = new p2.World(options.worldOptions);

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

  Ball(position) {
    var self = this;
    this.ballGameObject = new GameObject(this);
    this.groundGameObject = new GameObject(this);
    this.planeGameObject = new GameObject(this);
    this.characterMaterial = new p2.Material();
    this.groundMaterial = new p2.Material();
    this.ballGameObject.lastCallTime = this.time();

    this.ballGameObject.velocity = [];
    this.ballGameObject.speed = 2;
    this.ballGameObject.jumpSpeed = 6;
    this.ballGameObject.maximumSpeed = 25;
    this.ballGameObject.accelerationRate = 10;
    this.ballGameObject.decelerationRate = 10;
    this.ballGameObject.reverseDirectionRate = 3;
    this.ballGameObject.direction = 0;
    this.ballGameObject.touchEnabled = false;
    this.ballGameObject.lastCallTime = this.time();

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
          self.ballGameObject.accelerateLeft();
          break;
        case 38: // up
        case 32: // space
          //self.ballGameObject.bodies[0].velocity[1] = -self.jumpSpeed;
          break;
        case 39:
          self.ballGameObject.accelerateRight();
          break;
      }
    });

    document.addEventListener('keyup', function(e) {
      var keyID = window.event ? event.keyCode : (e.keyCode !== 0 ? e.keyCode : e.which);
      switch (keyID) {
        case 38: // up
        case 32:
          //self.ballGameObject.bodies[0].velocity[1] = 0;
          break;
        case 37:
        case 39:
          self.ballGameObject.endAcceleration();
          break;
      }
    });

    if (this.touchEnabled) {
      function onViewportTouchHold(e) {
        var touch = e.changedTouches ? e.changedTouches[0] : e;
        if (touch.clientX <= self.pixiAdapter.windowWidth / 2) {
          self.ballGameObject.accelerateLeft();
        } else {
          self.ballGameObject.accelerateRight();
        }
      }

      function onViewportRelease(e) {
        self.ballGameObject.endAcceleration();
      }

      self.pixiAdapter.renderer.view.addEventListener('touchstart', onViewportTouchHold, false);
      self.pixiAdapter.renderer.view.addEventListener('touchend', onViewportRelease, false);

      self.pixiAdapter.renderer.view.addEventListener('mousedown', onViewportTouchHold, false);
      self.pixiAdapter.renderer.view.addEventListener('mouseup', onViewportRelease, false);
    }

    // The Plane of.. existence!
    this.planeBody = new p2.Body({
      position: [0, -0.4]
    });
    this.planeShape = new p2.Plane({
      material: this.groundMaterial
    });
    this.planeGameObject.addBody(this.planeBody)
    .addShape(this.planeBody, this.planeShape, {
      styleOptions: {
        lineWidthUnits: 0.08,
        lineColor: 0x112233,
        fillColor: 0x110000
      }});
    this.addGameObject(this.planeGameObject);

    // Ground HeightField
    var heights = [];
    this.groundBody = new p2.Body({
      position: [-100, 0]
    });
    for (var i = 0; i < 500; i++) {
      heights.push(0.2 * Math.cos(0.2 * i) * Math.sin(0.5 * i) + 0.2 * Math.sin(0.1 * i) * Math.sin(0.05 * i));
    }
    this.groundShape = new p2.Heightfield({
      heights: heights,
      elementWidth: 0.3,
      material: this.groundMaterial
    });
    this.groundGameObject.addBody(this.groundBody)
    .addShape(this.groundBody, this.groundShape, {
      styleOptions: {
        lineWidthUnits: 0.08,
        lineColor: 0x112233,
        fillColor: 0x00FF00
      }});
    this.addGameObject(this.groundGameObject);

    // Ball
    this.ballBody = new p2.Body({
      mass: 0.1,
      position: position || [0, 0]
    });
    this.ballShape = new p2.Circle({
      radius: 0.25,
      material: this.characterMaterial
    });
    this.ballGameObject.addBody(this.ballBody)
    .addShape(this.ballBody, this.ballShape, {
      styleOptions: {
        lineWidthUnits: 0.08,
        lineColor: 0x112233,
        fillColor: 0x0000FF
      }});
    this.addGameObject(this.ballGameObject);

    // Init contact materials
    this.groundCharacterCM = new p2.ContactMaterial(this.groundMaterial, this.characterMaterial, {
      friction: 1, // No friction between character and ground
    });
    this.world.addContactMaterial(this.groundCharacterCM);

    this.world.on('postStep', function(e) {
      var time = self.time(),
          bObj = self.ballGameObject,
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

      self.ballBody.velocity[0] = bObj.speed;
    });
    this.trackedBody =  this.ballBody;
    this.assetsLoaded = true;
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
   * Returns true if all async setup functions are complete
   * and the Game is ready to start.
   * Override this to implement multiple setup functions
   * @return {Boolean}
   */
  isReadyToRun() {
    return this.assetsLoaded;
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
  time() {
    return new Date().getTime() / 1000;
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
   * Begins the world step / render loop
   */
  run() {
    this.lastWorldStepTime = this.time();

    var self = this;
    function update() {
      if (self.windowFocused && !self.paused) {
        let timeSinceLastCall = self.time() - self.lastWorldStepTime;
        self.lastWorldStepTime = self.time();
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
   * Updates the Pixi representation of the world
   */
  render() {
    let gameObjects = this.gameObjects,
        pixiAdapter = this.pixiAdapter;
    for (let i = 0; i < gameObjects.length; i++) {
      gameObjects[i].updateTransforms();
    }
    pixiAdapter.renderer.render(pixiAdapter.stage);
  }

  /**
   * Called after rendering
   */
  afterRender() {

  };

  /**
   * Adds the supplied GameObject
   * @param  {GameObject} gameObject
   */
  addGameObject(gameObject) {
    this.gameObjects.push(gameObject);
  }

  /**
   * Removes the supplied GameObject
   * @param  {GameObject} gameObject
   */
  removeGameObject(gameObject) {
    gameObject.remove();
  }

  /**
   * Removes all GameObjects
   */
  clear() {
    while (this.gameObjects.length > 0) {
      this.removeGameObject(this.gameObjects[0]);
    }
  }

  /**
   * Toggles pause state
   */
  pauseToggle() {
    this.paused = !this.paused;
    if (!this.paused) {
      this.lastWorldStepTime = this.time();
    }
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
      this.lastWorldStepTime = this.time();
    }
  }
}