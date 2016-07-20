var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
    b2EdgeChainDef = Box2D.Collision.Shapes.b2EdgeChainDef,
    b2EdgeShape = Box2D.Collision.Shapes.b2EdgeShape,
    b2MassData = Box2D.Collision.Shapes.b2MassData,
    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
    b2Shape = Box2D.Collision.Shapes.b2Shape,
    b2CircleContact = Box2D.Dynamics.Contacts.b2CircleContact,
    b2Contact = Box2D.Dynamics.Contacts.b2Contact,
    b2ContactConstraint = Box2D.Dynamics.Contacts.b2ContactConstraint,
    b2ContactConstraintPoint = Box2D.Dynamics.Contacts.b2ContactConstraintPoint,
    b2ContactEdge = Box2D.Dynamics.Contacts.b2ContactEdge,
    b2ContactFactory = Box2D.Dynamics.Contacts.b2ContactFactory,
    b2ContactRegister = Box2D.Dynamics.Contacts.b2ContactRegister,
    b2ContactResult = Box2D.Dynamics.Contacts.b2ContactResult,
    b2ContactSolver = Box2D.Dynamics.Contacts.b2ContactSolver,
    b2EdgeAndCircleContact = Box2D.Dynamics.Contacts.b2EdgeAndCircleContact,
    b2NullContact = Box2D.Dynamics.Contacts.b2NullContact,
    b2PolyAndCircleContact = Box2D.Dynamics.Contacts.b2PolyAndCircleContact,
    b2PolyAndEdgeContact = Box2D.Dynamics.Contacts.b2PolyAndEdgeContact,
    b2PolygonContact = Box2D.Dynamics.Contacts.b2PolygonContact,
    b2PositionSolverManifold = Box2D.Dynamics.Contacts.b2PositionSolverManifold,
    b2Body = Box2D.Dynamics.b2Body,
    b2_staticBody = Box2D.Dynamics.b2Body.b2_staticBody,
    b2_kinematicBody = Box2D.Dynamics.b2Body.b2_kinematicBody,
    b2_dynamicBody = Box2D.Dynamics.b2Body.b2_dynamicBody,
    b2BodyDef = Box2D.Dynamics.b2BodyDef,
    b2ContactFilter = Box2D.Dynamics.b2ContactFilter,
    b2ContactImpulse = Box2D.Dynamics.b2ContactImpulse,
    b2ContactListener = Box2D.Dynamics.b2ContactListener,
    b2ContactManager = Box2D.Dynamics.b2ContactManager,
    b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
    b2DestructionListener = Box2D.Dynamics.b2DestructionListener,
    b2FilterData = Box2D.Dynamics.b2FilterData,
    b2Fixture = Box2D.Dynamics.b2Fixture,
    b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
    b2Island = Box2D.Dynamics.b2Island,
    b2TimeStep = Box2D.Dynamics.b2TimeStep,
    b2World = Box2D.Dynamics.b2World,
    b2Color = Box2D.Common.b2Color,
    b2internal = Box2D.Common.b2internal,
    b2Settings = Box2D.Common.b2Settings,
    b2Mat22 = Box2D.Common.Math.b2Mat22,
    b2Mat33 = Box2D.Common.Math.b2Mat33,
    b2Math = Box2D.Common.Math.b2Math,
    b2Sweep = Box2D.Common.Math.b2Sweep,
    b2Transform = Box2D.Common.Math.b2Transform,
    b2Vec2 = Box2D.Common.Math.b2Vec2,
    b2Vec3 = Box2D.Common.Math.b2Vec3,
    b2AABB = Box2D.Collision.b2AABB,
    b2Bound = Box2D.Collision.b2Bound,
    b2BoundValues = Box2D.Collision.b2BoundValues,
    b2Collision = Box2D.Collision.b2Collision,
    b2ContactID = Box2D.Collision.b2ContactID,
    b2ContactPoint = Box2D.Collision.b2ContactPoint,
    b2Distance = Box2D.Collision.b2Distance,
    b2DistanceInput = Box2D.Collision.b2DistanceInput,
    b2DistanceOutput = Box2D.Collision.b2DistanceOutput,
    b2DistanceProxy = Box2D.Collision.b2DistanceProxy,
    b2DynamicTree = Box2D.Collision.b2DynamicTree,
    b2DynamicTreeBroadPhase = Box2D.Collision.b2DynamicTreeBroadPhase,
    b2DynamicTreeNode = Box2D.Collision.b2DynamicTreeNode,
    b2DynamicTreePair = Box2D.Collision.b2DynamicTreePair,
    b2Manifold = Box2D.Collision.b2Manifold,
    b2ManifoldPoint = Box2D.Collision.b2ManifoldPoint,
    b2Point = Box2D.Collision.b2Point,
    b2RayCastInput = Box2D.Collision.b2RayCastInput,
    b2RayCastOutput = Box2D.Collision.b2RayCastOutput,
    b2Segment = Box2D.Collision.b2Segment,
    b2SeparationFunction = Box2D.Collision.b2SeparationFunction,
    b2Simplex = Box2D.Collision.b2Simplex,
    b2SimplexCache = Box2D.Collision.b2SimplexCache,
    b2SimplexVertex = Box2D.Collision.b2SimplexVertex,
    b2TimeOfImpact = Box2D.Collision.b2TimeOfImpact,
    b2TOIInput = Box2D.Collision.b2TOIInput,
    b2WorldManifold = Box2D.Collision.b2WorldManifold,
    ClipVertex = Box2D.Collision.ClipVertex,
    Features = Box2D.Collision.Features,
    IBroadPhase = Box2D.Collision.IBroadPhase,
    b2Joint = Box2D.Dynamics.Joints.b2Joint,
    b2JointDef = Box2D.Dynamics.Joints.b2JointDef,
    b2JointEdge = Box2D.Dynamics.Joints.b2JointEdge,
    b2LineJoint = Box2D.Dynamics.Joints.b2LineJoint,
    b2LineJointDef = Box2D.Dynamics.Joints.b2LineJointDef,
    b2MouseJoint = Box2D.Dynamics.Joints.b2MouseJoint,
    b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef,
    b2PrismaticJoint = Box2D.Dynamics.Joints.b2PrismaticJoint,
    b2PrismaticJointDef = Box2D.Dynamics.Joints.b2PrismaticJointDef,
    b2PulleyJoint = Box2D.Dynamics.Joints.b2PulleyJoint,
    b2PulleyJointDef = Box2D.Dynamics.Joints.b2PulleyJointDef,
    b2RevoluteJoint = Box2D.Dynamics.Joints.b2RevoluteJoint,
    b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef,
    b2WeldJoint = Box2D.Dynamics.Joints.b2WeldJoint,
    b2WeldJointDef = Box2D.Dynamics.Joints.b2WeldJointDef,
    b2DistanceJoint = Box2D.Dynamics.Joints.b2DistanceJoint,
    b2DistanceJointDef = Box2D.Dynamics.Joints.b2DistanceJointDef,
    b2FrictionJoint = Box2D.Dynamics.Joints.b2FrictionJoint,
    b2FrictionJointDef = Box2D.Dynamics.Joints.b2FrictionJointDef;

var e_shapeBit = 0x0001;
var e_jointBit = 0x0002;
var e_aabbBit = 0x0004;
var e_pairBit = 0x0008;
var e_centerOfMassBit = 0x0010;

var PTM = 32;

var world = null;
var mouseJointGroundBody;
var canvas;
var context;
var myDebugDraw;
var mouseDownQueryCallback;
var visibleFixturesQueryCallback;
var mouseJoint = null;
var run = true;
var frameTime60 = 0;
var statusUpdateCounter = 0;
var showStats = false;
var mouseDown = false;
var shiftDown = false;
var originTransform;
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
/**
 * @author kozakluke@gmail.com
 */
(function Main() {
  const STAGE_WIDTH = 640, STAGE_HEIGHT = 480;
  const METER = 100;

  var bodies = [], actors = [];
  var stage, renderer;
  var world, mouseJoint;
  var touchX, touchY;
  var isBegin;
  var stats;

  (function init() {
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (function() {
        return window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback) {
              window.setTimeout(callback, 1000 / 60);
            };
      })();
    }

    window.onload = onLoad;
  })();

//for drawing polygons as one path
  function drawLinePolygon(poly, xf) {
    let vertexCount = parseInt(poly.GetVertexCount()),
     localVertices = poly.GetVertices(),
     vertices = new Vector(vertexCount);
    for (let i = 0; i < vertexCount; ++i) {
      vertices[i] = b2Math.MulX(xf, localVertices[i]);
    }
    let drawScale = myDebugDraw.m_drawScale;
    renderer.context.moveTo(vertices[0].x * drawScale, vertices[0].y * drawScale);
    for (let i = 1; i < vertexCount; i++) {
      renderer.context.lineTo(vertices[i].x * drawScale, vertices[i].y * drawScale);
    }
    renderer.context.lineTo(vertices[0].x * drawScale, vertices[0].y * drawScale);
  }

  function onLoad() {
    const container = document.createElement("div");
    document.body.appendChild(container);

    stats = new Stats();
    container.appendChild(stats.domElement);
    stats.domElement.style.position = "absolute";

    stage = new PIXI.Stage(0xDDDDDD, true);

    renderer = PIXI.autoDetectRenderer(STAGE_WIDTH, STAGE_HEIGHT, undefined, false);
    document.body.appendChild(renderer.view);
    onLoadAssets();
  }

  function onLoadAssets() {
    world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(0, 10), true);
    var def = JSON.parse('{}'),
        object = new Walker();
    loadSceneIntoWorld(def, world);
    object.walkerJoints = getNamedJoints(world, "walkerjoint");
    let bodiesA = getNamedBodies(world, "walkerchassis");
    if (bodiesA.length > 0) {
      object.chassisBody = bodiesA[0];
    }
    let VisibleFixturesQueryCallback = function() {
      this.m_fixtures = [];
    };
    VisibleFixturesQueryCallback.prototype.ReportFixture = function(fixture) {
      this.m_fixtures.push(fixture);
      return true;
    };

    let viewAABB = new b2AABB(),
        visibleFixturesQueryCallback = new VisibleFixturesQueryCallback(),
        f, b, xf, sh,
        color = new b2Color(0, 0, 0),
        circleFixtures = [],
        polygonFixtures = [],
        staticPolygonFixtures = [],
        kinematicPolygonFixtures = [],
        dynamicPolygonFixtures = [];
    var currentViewCenterWorld = getWorldPointFromPixelPoint(viewCenterPixel);
    var viewHalfwidth = 0.5 * renderer.view.width / PTM;
    var viewHalfheight = 0.5 * renderer.view.height / PTM;
    viewAABB.lowerBound.Set(currentViewCenterWorld.x - viewHalfwidth, currentViewCenterWorld.y - viewHalfheight);
    viewAABB.upperBound.Set(currentViewCenterWorld.x + viewHalfwidth, currentViewCenterWorld.y + viewHalfheight);
    visibleFixturesQueryCallback.m_fixtures = [];
    world.QueryAABB(visibleFixturesQueryCallback, viewAABB);
    //polygonFixtures.push(object);
    for (var i = 0; i < visibleFixturesQueryCallback.m_fixtures.length; i++) {
      f = visibleFixturesQueryCallback.m_fixtures[i];
      s = f.GetShape();
      if (s.GetType() == b2Shape.e_circleShape) {
        circleFixtures.push(f);
      }
      else if (s.GetType() == b2Shape.e_polygonShape) {
        polygonFixtures.push(f);
      }
    }
    for (var i = 0; i < polygonFixtures.length; i++) {
      f = polygonFixtures[i];
      b = f.GetBody();
      if (b.GetType() == b2_staticBody) {
        staticPolygonFixtures.push(f);
      } else if (b.GetType() == b2_kinematicBody) {
        kinematicPolygonFixtures.push(f);
      } else {
        dynamicPolygonFixtures.push(f);
      }
    }

    renderer.context.strokeStyle = "rgb(230,178,178)";
    renderer.context.beginPath();//draw all dynamic polygons as one path
    for (var i = 0; i < dynamicPolygonFixtures.length; i++) {
      f = dynamicPolygonFixtures[i];
      sh = f.GetShape();
      b = f.GetBody();
      xf = b.GetTransform();
      //world.DrawShape(s, xf, color);
      drawLinePolygon(sh, xf);
    }
    renderer.context.closePath();
    renderer.context.stroke();

    document.addEventListener("mousedown", function(event) {
      isBegin = true;
      onMove(event);
      document.addEventListener("mousemove", onMove, true);
    }, true);

    document.addEventListener("mouseup", function(event) {
      document.removeEventListener("mousemove", onMove, true);
      isBegin = false;
      touchX = undefined;
      touchY = undefined;
    }, true);

    renderer.view.addEventListener("touchstart", function(event) {
      isBegin = true;
      onMove(event);
      renderer.view.addEventListener("touchmove", onMove, true);
    }, true);

    renderer.view.addEventListener("touchend", function(event) {
      renderer.view.removeEventListener("touchmove", onMove, true);
      isBegin = false;
      touchX = undefined;
      touchY = undefined;
    }, true);

    update();
  }

  function getWorldPointFromPixelPoint(pixelPoint) {
    return {
      x: (pixelPoint.x - canvasOffset.x) / PTM,
      y: (pixelPoint.y - (renderer.view.height - canvasOffset.y)) / PTM
    };
  }

//load the scene into an already existing world variable
  function loadSceneIntoWorld(worldJso, world) {
    if (worldJso.hasOwnProperty('body')) {
      for (let i = 0; i < worldJso.body.length; i++) {
        let bodyJso = worldJso.body[i];
        let bodyA = loadBodyFromRUBE(bodyJso, world);
        if (bodyA) {
          bodies.push(bodyA);
        }
      }
    }

    var loadedJoints = [];
    if (worldJso.hasOwnProperty('joint')) {
      for (let i = 0; i < worldJso.joint.length; i++) {
        let joint = loadJointFromRUBE(worldJso.joint[i], world, bodies);
        if (joint) {
          loadedJoints.push(joint);
        }
      }
    }

  }

  function getBodyAtMouse() {
    const mousePos = new Box2D.Common.Math.b2Vec2(touchX, touchY);
    const aabb = new Box2D.Collision.b2AABB();
    aabb.lowerBound.Set(touchX - 0.001, touchY - 0.001);
    aabb.upperBound.Set(touchX + 0.001, touchY + 0.001);

    var body;
    world.QueryAABB(
        function(fixture) {
          if (fixture.GetBody().GetType() != Box2D.Dynamics.b2BodyDef.b2_staticBody) {
            if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePos)) {
              body = fixture.GetBody();
              return false;
            }
          }
          return true;
        }, aabb);

    return body;
  }

  function onMove(event) {
    if (event["changedTouches"]) {
      var touche = event["changedTouches"][0];
      touchX = touche.pageX / METER;
      touchY = touche.pageY / METER;
    }
    else {
      touchX = event.clientX / METER;
      touchY = event.clientY / METER;
    }
  }

  function update() {
    requestAnimationFrame(update);

    if (isBegin && !mouseJoint) {
      const dragBody = getBodyAtMouse();
      if (dragBody) {
        const jointDef = new Box2D.Dynamics.Joints.b2MouseJointDef();
        jointDef.bodyA = world.GetGroundBody();
        jointDef.bodyB = dragBody;
        jointDef.target.Set(touchX, touchY);
        jointDef.collideConnected = true;
        jointDef.maxForce = 300.0 * dragBody.GetMass();
        mouseJoint = world.CreateJoint(jointDef);
        dragBody.SetAwake(true);
      }
    }

    if (mouseJoint) {
      if (isBegin) {
        mouseJoint.SetTarget(new Box2D.Common.Math.b2Vec2(touchX, touchY));
      } else {
        world.DestroyJoint(mouseJoint);
        mouseJoint = null;
      }
    }

    world.Step(1 / 60, 3, 3);
    world.ClearForces();

    let n = actors.length;
    for (let i = 0; i < n; i++) {
      let body = bodies[i],
       actor = actors[i],
       position = body.GetPosition();
      actor.position.x = position.x * 100;
      actor.position.y = position.y * 100;
      actor.rotation = body.GetAngle();
    }

    renderer.render(stage);
    stats.update();
  }
})();
