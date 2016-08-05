(function(global) {
  "use strict";

  var Body = p2.Body,
      Circle = p2.Circle,
      Box = p2.Box,
      Convex = p2.Convex,
      Plane = p2.Plane,
      Shape = p2.Shape,
      zoom = 50,
      jumpSpeed = 6,
      walkSpeed = 2,
      buttons = {
        space: 0,
        left: 0,
        right: 0
      };
  class P2World {

    /**
     * World object contains many agents and walls and food and stuff
     * @name P2World
     * @constructor
     *
     * @return {P2World}
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
        noWebGL: false,
        width: 600,
        height: 600
      };

      this.width = this.renderOpts.width;
      this.height = this.renderOpts.height;
      this.resizable = this.renderOpts.resizable;

      this.zoom = 50;
      this.clock = 0;
      this.pause = false;
      this.fixedTimeStep = 1 / 60;
      this.maxSubSteps = 10;

      this.renderer = PIXI.autoDetectRenderer(this.width, this.height, this.renderOpts);
      this.renderer.backgroundColor = 0xCCCCCC;
      this.renderer.view.style.pos = "absolute";
      this.renderer.view.style.top = "0px";
      this.renderer.view.style.left = "0px";
      this.scene = new PIXI.Graphics();
      this.stage = new PIXI.Container();
      this.stage.addChild(this.scene);

      this.scene.position.x = this.renderer.width / 2;
      this.scene.position.y = this.renderer.height / 2;
      this.scene.scale.x = this.zoom;
      this.scene.scale.y = -this.zoom; // Note: we flip the y axis to make "up" the physics "up"

      if (this.resizable) {
        var resize = () => {
          let ratio = Math.min(window.innerWidth / this.width, window.innerHeight / this.height);
          this.stage.scale.x = this.stage.scale.y = ratio;
          this.renderer.resize(Math.ceil(this.width * ratio), Math.ceil(this.height * ratio));
        };
        window.addEventListener("resize", resize);
        resize();
      }
      document.body.querySelector('#game-container').appendChild(this.renderer.view);

      this.world.defaultContactMaterial.friction = 0.5;
      this.world.setGlobalStiffness(1e5);

      var groundMaterial = new p2.Material(),
          characterMaterial = new p2.Material(),
          boxMaterial = new p2.Material(),
          platforms = [],
          boxes = [],
          platformPositions = [[2, 0], [0, 1], [-2, 2]],
          boxPositions = [[2, 1], [0, 2], [-2, 3]],

          characterBody = new Body({
            mass: 1,
            position: [0, 3],
            fixedRotation: true,
            damping: 0.5
          }),
          characterShape = new p2.Circle({
            radius: 0.2,
            material: characterMaterial
          }),

          planeShape = new p2.Plane({
            material: groundMaterial
          }),
          planeBody = new p2.Body({
            position: [0, -1]
          });

      for (var i = 0; i < platformPositions.length; i++) {
        var platformBody = new p2.Body({
              mass: 0,
              position: platformPositions[i],
              type: p2.Body.KINEMATIC
            }),
            platformShape = new p2.Box({
              width: 1,
              height: 0.3,
              material: groundMaterial
            });
        platformBody.addShape(platformShape);
        this.world.addBody(platformBody);
        platforms.push(platformBody);
      }

      for (let i = 0; i < boxPositions.length; i++) {
        var boxBody = new p2.Body({
              mass: 1,
              position: boxPositions[i]
            }),
            boxShape = new p2.Box({
              width: 0.8,
              height: 0.8,
              material: boxMaterial
            });
        boxBody.addShape(boxShape);
        this.world.addBody(boxBody);
        boxes.push(boxBody);
      }

      characterBody.addShape(characterShape);
      this.world.addBody(characterBody);

      planeBody.addShape(planeShape);
      this.world.addBody(planeBody);

      // Init contact materials
      var groundCharacterCM = new p2.ContactMaterial(groundMaterial, characterMaterial, {
            friction: 0, // No friction between character and ground
          }),
          boxCharacterCM = new p2.ContactMaterial(boxMaterial, characterMaterial, {
            friction: 0, // No friction between character and boxes
          }),
          boxGroundCM = new p2.ContactMaterial(boxMaterial, groundMaterial, {
            friction: 0.6, // Between boxes and ground
          });

      this.world.addContactMaterial(groundCharacterCM);
      this.world.addContactMaterial(boxCharacterCM);
      this.world.addContactMaterial(boxGroundCM);

      // Allow pass through platforms from below
      var passThroughBody;

      this.world.on("beginContact", (evt) => {
        if (evt.bodyA !== characterBody && evt.bodyB !== characterBody) {
          return;
        }
        let otherBody = evt.bodyA === characterBody ? evt.bodyB : evt.bodyA;
        if (platforms.indexOf(otherBody) !== -1 && otherBody.position[1] > characterBody.position[1]) {
          passThroughBody = otherBody;
        }
      });

      this.world.on("preSolve", (evt) => {
        for (let i = 0; i < evt.contactEquations.length; i++) {
          let eq = evt.contactEquations[i];
          if ((eq.bodyA === characterBody && eq.bodyB === passThroughBody) || eq.bodyB === characterBody && eq.bodyA === passThroughBody) {
            eq.enabled = false;
          }
        }
        for (let i = 0; i < evt.frictionEquations.length; i++) {
          let eq = evt.frictionEquations[i];
          if ((eq.bodyA === characterBody && eq.bodyB === passThroughBody) || eq.bodyB === characterBody && eq.bodyA === passThroughBody) {
            eq.enabled = false;
          }
        }
      });

      this.world.on("endContact", (evt) => {
        if ((evt.bodyA === characterBody && evt.bodyB === passThroughBody) || evt.bodyB === characterBody && evt.bodyA === passThroughBody) {
          passThroughBody = undefined;
        }
      });

      this.world.on("impact", (event) => {

      });

      this.world.on("postBroadphase", (event) => {

      });

      this.world.on("postStep", (event) => {
        for (let i = 0; i < platforms.length; i++) {
          platforms[i].velocity[0] = 2 * Math.sin(this.world.time);
        }
        // Apply button response
        characterBody.velocity[0] = walkSpeed * (buttons.right - buttons.left);
      });

      this.world.on("addSpring", (event) => {

      });

      this.world.on("addBody", (event) => {

      });

      this.world.on("removeBody", (event) => {

      });

      var checkIfCanJump = () => {
        for (var i = 0; i < this.world.narrowphase.contactEquations.length; i++) {
          var c = this.world.narrowphase.contactEquations[i];
          if (c.bodyA === characterBody || c.bodyB === characterBody) {
            var d = c.normalA[1];
            if (c.bodyA === characterBody) {
              d *= -1;
            }
            if (d > 0.5) {
              return true;
            }
          }
        }
        return false;
      };

      window.onkeydown = function(event) {
        switch (event.keyCode) {
          case 38: // up
          case 32: // space
            if (!buttons.space) {
              if (checkIfCanJump()) {
                characterBody.velocity[1] = jumpSpeed;
              }
              buttons.space = true;
            }
            break;
          case 39:
            buttons.right = 1;
            break;
          case 37:
            buttons.left = 1;
            break;
        }
      };

      window.onkeyup = function(event) {
        switch (event.keyCode) {
          case 38: // up
          case 32:
            buttons.space = 0;
            break;
          case 39:
            buttons.right = 0;
            break;
          case 37:
            buttons.left = 0;
            break;
        }
      };

      var animate = (timeMilliseconds) => {
        requestAnimationFrame(animate);
        var timeSinceLastCall = 0;
        if (timeMilliseconds !== undefined && this.lastTimeMilliseconds !== undefined) {
          timeSinceLastCall = (timeMilliseconds - this.lastTimeMilliseconds) / 1000;
        }

        this.world.step(this.fixedTimeStep, timeSinceLastCall, this.maxSubSteps);
        this.lastTimeMilliseconds = timeMilliseconds;
        this.scene.clear();
        this.scene.lineStyle(0.005, 0x00000, 1);

        this.renderer.render(this.stage);
      };
      requestAnimationFrame(animate);

      return this;
    }

  }
  global.P2World = P2World;

}(this));
