
function Ball(position) {
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

    if (bObj.direction == -1) {
      bObj.speed -= (tDelta * (bObj.accelerationRate * (bObj.speed > 0 ? bObj.reverseDirectionRate : 1)));
      if (bObj.speed < -bObj.maximumSpeed) {
        bObj.speed = -bObj.maximumSpeed;
      }
    } else if (bObj.direction  == 1) {
      bObj.speed += (tDelta * (bObj.accelerationRate * (bObj.speed < 0 ? bObj.reverseDirectionRate : 1)));
      if (bObj.speed > bObj.maximumSpeed) {
        bObj.speed = bObj.maximumSpeed;
      }
    } else if (bObj.direction  == 2)  {
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
