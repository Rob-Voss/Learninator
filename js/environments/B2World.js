(function(global) {
  "use strict";

  var b2CircleShape = box2d.b2CircleShape,
      b2EdgeChainDef = box2d.b2EdgeChainDef,
      b2EdgeShape = box2d.b2EdgeShape,
      b2MassData = box2d.b2MassData,
      b2PolygonShape = box2d.b2PolygonShape,
      b2Shape = box2d.b2Shape,
      b2CircleContact = box2d.b2CircleContact,
      b2Contact = box2d.b2Contact,
      b2ContactConstraint = box2d.b2ContactConstraint,
      b2ContactConstraintPoint = box2d.b2ContactConstraintPoint,
      b2ContactEdge = box2d.b2ContactEdge,
      b2ContactFactory = box2d.b2ContactFactory,
      b2ContactRegister = box2d.b2ContactRegister,
      b2ContactResult = box2d.b2ContactResult,
      b2ContactSolver = box2d.b2ContactSolver,
      b2EdgeAndCircleContact = box2d.b2EdgeAndCircleContact,
      b2NullContact = box2d.b2NullContact,
      b2PolyAndCircleContact = box2d.b2PolyAndCircleContact,
      b2PolyAndEdgeContact = box2d.b2PolyAndEdgeContact,
      b2PolygonContact = box2d.b2PolygonContact,
      b2PositionSolverManifold = box2d.b2PositionSolverManifold,
      b2Body = box2d.b2Body,
      b2_staticBody = box2d.b2Body.b2_staticBody,
      b2_kinematicBody = box2d.b2Body.b2_kinematicBody,
      b2_dynamicBody = box2d.b2Body.b2_dynamicBody,
      b2BodyDef = box2d.b2BodyDef,
      b2ContactFilter = box2d.b2ContactFilter,
      b2ContactImpulse = box2d.b2ContactImpulse,
      b2ContactListener = box2d.b2ContactListener,
      b2ContactManager = box2d.b2ContactManager,
      b2DebugDraw = box2d.b2DebugDraw,
      b2DestructionListener = box2d.b2DestructionListener,
      b2FilterData = box2d.b2FilterData,
      b2Fixture = box2d.b2Fixture,
      b2FixtureDef = box2d.b2FixtureDef,
      b2Island = box2d.b2Island,
      b2TimeStep = box2d.b2TimeStep,
      b2World = box2d.b2World,
      b2Color = box2d.b2Color,
      b2internal = box2d.b2internal,
      b2Settings = box2d.b2Settings,
      b2Mat22 = box2d.b2Mat22,
      b2Mat33 = box2d.b2Mat33,
      b2Math = box2d.b2Math,
      b2Sweep = box2d.b2Sweep,
      b2Transform = box2d.b2Transform,
      b2Vec2 = box2d.b2Vec2,
      b2Vec3 = box2d.b2Vec3,
      b2AABB = box2d.b2AABB,
      b2Bound = box2d.b2Bound,
      b2BoundValues = box2d.b2BoundValues,
      b2Collision = box2d.b2Collision,
      b2ContactID = box2d.b2ContactID,
      b2ContactPoint = box2d.b2ContactPoint,
      b2Distance = box2d.b2Distance,
      b2DistanceInput = box2d.b2DistanceInput,
      b2DistanceOutput = box2d.b2DistanceOutput,
      b2DistanceProxy = box2d.b2DistanceProxy,
      b2DynamicTree = box2d.b2DynamicTree,
      b2DynamicTreeBroadPhase = box2d.b2DynamicTreeBroadPhase,
      b2DynamicTreeNode = box2d.b2DynamicTreeNode,
      b2DynamicTreePair = box2d.b2DynamicTreePair,
      b2Manifold = box2d.b2Manifold,
      b2ManifoldPoint = box2d.b2ManifoldPoint,
      b2Point = box2d.b2Point,
      b2RayCastInput = box2d.b2RayCastInput,
      b2RayCastOutput = box2d.b2RayCastOutput,
      b2Segment = box2d.b2Segment,
      b2SeparationFunction = box2d.b2SeparationFunction,
      b2Simplex = box2d.b2Simplex,
      b2SimplexCache = box2d.b2SimplexCache,
      b2SimplexVertex = box2d.b2SimplexVertex,
      b2TimeOfImpact = box2d.b2TimeOfImpact,
      b2TOIInput = box2d.b2TOIInput,
      b2WorldManifold = box2d.b2WorldManifold,
      ClipVertex = box2d.ClipVertex,
      Features = box2d.Features,
      IBroadPhase = box2d.IBroadPhase,
      b2Joint = box2d.b2Joint,
      b2JointDef = box2d.b2JointDef,
      b2JointEdge = box2d.b2JointEdge,
      b2LineJoint = box2d.b2LineJoint,
      b2LineJointDef = box2d.b2LineJointDef,
      b2MouseJoint = box2d.b2MouseJoint,
      b2MouseJointDef = box2d.b2MouseJointDef,
      b2PrismaticJoint = box2d.b2PrismaticJoint,
      b2PrismaticJointDef = box2d.b2PrismaticJointDef,
      b2PulleyJoint = box2d.b2PulleyJoint,
      b2PulleyJointDef = box2d.b2PulleyJointDef,
      b2RevoluteJoint = box2d.b2RevoluteJoint,
      b2RevoluteJointDef = box2d.b2RevoluteJointDef,
      b2WeldJoint = box2d.b2WeldJoint,
      b2WeldJointDef = box2d.b2WeldJointDef,
      b2DistanceJoint = box2d.b2DistanceJoint,
      b2DistanceJointDef = box2d.b2DistanceJointDef,
      b2FrictionJoint = box2d.b2FrictionJoint,
      b2FrictionJointDef = box2d.b2FrictionJointDef,

      e_shapeBit = 0x0001,
      e_jointBit = 0x0002,
      e_aabbBit = 0x0004,
      e_pairBit = 0x0008,
      e_centerOfMassBit = 0x0010,
      PTM = 32,
      world = null,
      mouseJointGroundBody,
      canvas,
      context,
      myDebugDraw,
      mouseDownQueryCallback,
      visibleFixturesQueryCallback,
      mouseJoint = null,
      run = true,
      frameTime60 = 0,
      statusUpdateCounter = 0,
      showStats = false,
      mouseDown = false,
      shiftDown = false,
      originTransform;
  var mousePosPixel = {
    x: 0,
    y: 0
  };
  var prevMousePosPixel = {
    x: 0,
    y: 0
  };
  var mousePosWorld = {
    x: 0,
    y: 0
  };
  var canvasOffset = {
    x: 0,
    y: 0
  };
  var viewCenterPixel = {
    x: 320,
    y: 240
  };
  var viewAABB;

  class B2World {

    /**
     * World object contains many agents and walls and food and stuff
     * @name B2World
     * @constructor
     *
     * @return {B2World}
     */
    constructor() {
      this.renderOpts = {
        antialiasing: false,
        autoResize: false,
        resolution: window.devicePixelRatio,
        resizable: false,
        transparent: false,
        noWebGL: true,
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
      this.bodies = [];
      this.actors = [];
      this.entityLayer = [];

      this.renderer = PIXI.autoDetectRenderer(this.width, this.height, this.renderOpts);
      this.renderer.backgroundColor = 0xCCCCCC;
      this.renderer.view.style.pos = "absolute";
      this.renderer.view.style.top = "0px";
      this.renderer.view.style.left = "0px";
      this.scene = new PIXI.Container();
      this.stage = new PIXI.Container();
      this.stage.addChild(this.scene);

      this.scene.position.x = this.renderer.width / 2;
      this.scene.position.y = this.renderer.height / 2;
      this.scene.scale.x = this.zoom;
      this.scene.scale.y = -this.zoom;

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

      this.graphics = new PIXI.Graphics();
      this.stage.addChild(this.graphics);
      this.world = new b2World(new b2Vec2(0, 10), true);
      this.world.SetDebugDraw(new b2Pixi(this.graphics, new b2Vec2(0, 0)));

      this.merps();

      // Animation loop
      var animate = (timeMilliseconds) => {
        requestAnimationFrame(animate);
        var timeSinceLastCall = 0;
        if (timeMilliseconds !== undefined && this.lastTimeMilliseconds !== undefined) {
          timeSinceLastCall = (timeMilliseconds - this.lastTimeMilliseconds) / 1000;
        }

        // Move physics bodies forward in time
        this.world.Step(this.fixedTimeStep, timeSinceLastCall, this.maxSubSteps);
        this.world.ClearForces();
        this.lastTimeMilliseconds = timeMilliseconds;

        this.world.DrawDebugData();
        this.tick();
        this.renderer.render(this.stage);
      };
      requestAnimationFrame(animate);

      return this;
    }

    merps() {
      var SCALE = 30,
          NULL_CENTER = {x: null, y: null};

      function Entity(id, x, y, angle, center, color) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.angle = angle || 0;
        this.center = center;
        this.color = color || "red";
      }

      Entity.prototype.update = function(state) {
        this.x = state.x;
        this.y = state.y;
        this.center = state.c;
        this.angle = state.a;
      };

      Entity.build = function(def) {
        if (def.radius) {
          return new CircleEntity(def.id, def.x, def.y, def.angle, NULL_CENTER, def.color, def.radius);
        } else if (def.polys) {
          return new PolygonEntity(def.id, def.x, def.y, def.angle, NULL_CENTER, def.color, def.polys);
        } else {
          return new RectangleEntity(def.id, def.x, def.y, def.angle, NULL_CENTER, def.color, def.halfWidth, def.halfHeight);
        }
      };

      function CircleEntity(id, x, y, angle, center, color, radius) {
        color = color || 'aqua';
        Entity.call(this, id, x, y, angle, center, color);
        this.radius = radius;
      }

      CircleEntity.prototype = new Entity();
      CircleEntity.prototype.constructor = CircleEntity;

      function RectangleEntity(id, x, y, angle, center, color, halfWidth, halfHeight) {
        Entity.call(this, id, x, y, angle, center, color);
        this.halfWidth = halfWidth;
        this.halfHeight = halfHeight;
      }

      RectangleEntity.prototype = new Entity();
      RectangleEntity.prototype.constructor = RectangleEntity;

      function PolygonEntity(id, x, y, angle, center, color, polys) {
        Entity.call(this, id, x, y, angle, center, color);
        this.polys = polys;
      }

      PolygonEntity.prototype = new Entity();
      PolygonEntity.prototype.constructor = PolygonEntity;

      var bodies = [],
          initialState = [
            {
              id: "ground",
              x: this.width / 2 / SCALE,
              y: this.height * 0.66 / SCALE,
              angle: (15 * Math.PI) / 180,
              halfHeight: 0.5,
              halfWidth: this.width / SCALE,
              color: 'yellow'
            },
            {id: "wheel1", x: 1, y: 4, radius: 1.5},
            {id: "wheel2", x: 6, y: 4, radius: 0.5},
            {id: "chassis", x: 3.5, y: 4, halfHeight: 0.15, halfWidth: 2.5}
          ];

      for (var i = 0; i < initialState.length; i++) {
        bodies[initialState[i].id] = Entity.build(initialState[i]);
      }

      this.addBodies(bodies);

    }

    /**
     * @param {Array} bodies
     * @return {B2World}
     */
    addBodies(bodies) {
      for (let i = 0; i < bodies.length; i++) {
        let entity = bodies[i];
        entity.body.addShape(entity.shape);
        entity.graphics = new PIXI.Graphics();
        entity.graphics.lineStyle(0.005, 0x00000, 1);
        switch (entity.shape.type) {
          case Shape.CIRCLE:
            entity.graphics.beginFill(0x00ff00, 0.5);
            entity.graphics.drawCircle(-entity.shape.width / 2, -entity.shape.height / 2, entity.shape.radius);
            entity.graphics.endFill();
            break;
          case Shape.BOX:
          case Shape.CONVEX:
            entity.graphics.beginFill(0xff0000, 0.5);
            entity.graphics.drawRect(-entity.shape.width / 2, -entity.shape.height / 2, entity.shape.width, entity.shape.height);
            entity.graphics.endFill();
            break;
          case Shape.PLANE:
            entity.graphics.beginFill(0x000000);
            entity.graphics.drawRect(-entity.shape.width / 2, -entity.shape.height / 2, entity.shape.width, entity.shape.height);
            entity.graphics.endFill();
            break;
        }

        this.entityLayer.push(entity);
        // Add the body to our world
        this.world.addBody(entity.body);
        // Add the body to our container
        this.scene.addChild(entity.graphics);
      }

      return this;
    }

    /**
     *
     */
    addEvents() {
      this.world.on("beginContact", (event) => {

      });

      this.world.on("endContact", (event) => {

      });

      this.world.on("impact", (event) => {

      });

      this.world.on("postBroadphase", (event) => {

      });

      this.world.on("preSolve", (event) => {

      });

      this.world.on("addSpring", (event) => {

      });

      this.world.on("addBody", (event) => {

      });

      this.world.on("removeBody", (event) => {

      });
    }

    /**
     *
     * @param touchX
     * @param touchY
     * @returns {*}
     */
    getBodyAtMouse(touchX, touchY) {
      const mousePos = new b2Vec2(touchX, touchY);
      const aabb = new b2AABB();
      aabb.lowerBound.Set(touchX - 0.001, touchY - 0.001);
      aabb.upperBound.Set(touchX + 0.001, touchY + 0.001);

      var body;
      this.world.QueryAABB(
          function(fixture) {
            if (fixture.GetBody().GetType() !== b2BodyDef.b2_staticBody) {
              if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePos)) {
                body = fixture.GetBody();
                return false;
              }
            }
            return true;
          }, aabb);

      return body;
    }

    /**
     * Tick the environment
     * @return {B2World}
     */
    tick() {
      for (let i = 0; i < this.entityLayer.length; i++) {
        let entity = this.entityLayer[i];

        // Transfer positions of the physics objects to Pixi.js
        entity.graphics.position.x = entity.body.position[0];
        entity.graphics.position.y = entity.body.position[1];
        entity.graphics.rotation = entity.body.angle;
      }

      return this;
    }
  }
  global.B2World = B2World;

}(this));
