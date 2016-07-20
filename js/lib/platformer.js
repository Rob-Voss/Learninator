//  http://brm.io/matter-js/docs/
//  http://brm.io/matter-js/demo/#mixed
//  https://github.com/liabru/matter-js/blob/master/demo/js/Demo.js
//  https://en.wikipedia.org/wiki/Rotation_matrix

/*
 ideas
 change the collision filter group for the body the portal is on
 if the player touches the portal make the player not able to collide with the wall
 add in some invisible edges to the portal
 if the player's center touches the portal teleport to the other portal
 make portals fireable with ray casting  (consider using point checks, not raycasting)
 https://github.com/liabru/matter-js/issues/181
 */

function rotateVector(vector, angle) {
  return {
    x: vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
    y: vector.x * Math.sin(angle) + vector.y * Math.cos(angle)
  };
}

//game objects values
var game = {
  cycle: 0,
  width: 1200,
  height: 800
};

var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Events = Matter.Events,
    Body = Matter.Body,
    //Composites = Matter.Composites,
    Bodies = Matter.Bodies;

// create an engine
var engine = Engine.create();

var render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: game.width, //window.outerWidth,
    height: game.height, //window.innerHeight,
    pixelRatio: 1,
    background: 'rgba(255, 0, 0, 0.0)',
    wireframeBackground: '#222',
    enabled: true,
    wireframes: false,
    showVelocity: false,
    showAngleIndicator: true,
    showCollisions: false,
  }
});

//add the walls
var offset = 5;
World.add(engine.world, [
  Bodies.rectangle(400, -offset, game.width * 2 + 2 * offset, 50, {
    isStatic: true
  }),
  Bodies.rectangle(400, game.height + offset, game.width * 2 + 2 * offset, 50, {
    isStatic: true
  }),
  Bodies.rectangle(game.width + offset, 300, 50, game.height * 2 + 2 * offset, {
    isStatic: true
  }),
  Bodies.rectangle(-offset, 300, 50, game.height * 2 + 2 * offset, {
    isStatic: true
  })
]);

// add some ramps to the world for the bodies to roll down
World.add(engine.world, [
  //Bodies.rectangle(200, 150, 700, 20, { isStatic: true, angle: Math.PI * 0.06 }),
  Bodies.rectangle(620, 270, 1000, 50, {
    isStatic: true,
    angle: -Math.PI * 0.1
  }),
  Bodies.rectangle(260, 780, 700, 300, {
    isStatic: true,
    angle: Math.PI * 0.15
  }),
  Bodies.rectangle(1050, 750, 600, 100, {
    isStatic: true,
    //angle: -Math.PI * 0.1
  }),
]);

//adds some balls
for (var i = 0; i < 25; i++) {
  World.add(engine.world, Bodies.circle(400, 200, 16, {
        density: 0.0005,
        friction: 0,//0.05,
        frictionStatic: 0.5,
        frictionAir: 0.001,
        restitution: 0.5,
        portal: -1, // 0,1 for each portal  and -1 for no portal
        render: {
          strokeStyle: 'darkgrey',
          fillStyle: 'grey'
        },
      })
  );
}
//add portals
var portal0 = Bodies.rectangle(900 - 150, game.height - 60, 70, 15, {
  portal: 0,
  chamfer: {radius: 10},
  isStatic: true,
  isSensor: true,
  render: { //orange
    strokeStyle: '#ffb366',
    fillStyle: '#ffb366',
    //lineWidth: 20,
    opacity: 0.5,
  },
  angle: Math.PI * 0.5
});

var portal1 = Bodies.rectangle(640, 20, 70, 15, {
  portal: 1,
  chamfer: {radius: 10},
  isStatic: true,
  isSensor: true,
  render: { //blue
    strokeStyle: '#66d9ff',
    fillStyle: '#66d9ff',
    opacity: 0.5,
  },
  angle: Math.PI//Math.PI*0.5
});

//add the player
const playerRadius = 25;
var player = Bodies.circle(800, game.height - 200, playerRadius, {
  density: 0.001,
  friction: 0.7,
  frictionStatic: 0,
  frictionAir: 0.005,
  restitution: 0.3,
  ground: false,
  jumpCD: 0,
  portal: -1, // 0,1 for each portal  and -1 for no portal
  collisionFilter: {
    category: 1,
    group: 1,
    mask: 1
  },
  render: {
    strokeStyle: 'black',
    fillStyle: 'darkgrey'
  },
});
player.collisionFilter.group = -1;

//this sensor check if the player is on the ground to enable jumping
var playerSensor = Bodies.rectangle(0, 0, playerRadius, 5, {
  isSensor: true,
  render: {
    visible: false
  },
  //isStatic: true,
});
playerSensor.collisionFilter.group = -1;

//populate world
World.add(engine.world, [player, playerSensor, portal0, portal1]);

//looks for key presses and logs them
var keys = [];
document.body.addEventListener("keydown", function(e) {
  keys[e.keyCode] = true;
});
document.body.addEventListener("keyup", function(e) {
  keys[e.keyCode] = false;
});

function playerGroundCheck(event, ground) { //runs on collisions events
  var pairs = event.pairs;
  for (var i = 0, j = pairs.length; i != j; ++i) {
    var pair = pairs[i];
    if (pair.bodyA === playerSensor) {
      player.ground = ground;
    } else if (pair.bodyB === playerSensor) {
      player.ground = ground;
    }
  }
}

function touchingPortals(event, pEnter, pExit) {
  var pairs = event.pairs;
  var d = {x: 0, y: 0};
  for (var i = 0, j = pairs.length; i != j; ++i) {
    var pair = pairs[i];
    if (pair.bodyB === pEnter && pair.bodyA.portal != pEnter.portal) {
      //body exiting the portal keeps track of what portal they just left so they don't renter
      pair.bodyA.portal = pExit.portal;
      d = {
        x: -(pEnter.position.x - pair.bodyA.position.x) * 0.5,
        y: (pEnter.position.y - pair.bodyA.position.y) * 0.5
      };
      Body.setPosition(pair.bodyA, pExit.position);
      Body.translate(pair.bodyA, d);
      // rotate velocity
      Matter.Body.setVelocity(pair.bodyA, rotateVector(pair.bodyA.velocity, pExit.angle - pEnter.angle))
    } else if (pair.bodyA === pEnter && pair.bodyB.portal != pEnter.portal) {
      //body exiting the portal keeps track of what portal they just left so they don't renter
      pair.bodyB.portal = pExit.portal;
      d = {
        x: -(pEnter.position.x - pair.bodyB.position.x) * 0.5,
        y: (pEnter.position.y - pair.bodyB.position.y) * 0.5
      };
      Body.setPosition(pair.bodyB, pExit.position);
      Body.translate(pair.bodyB, d);
      // rotate velocity
      Matter.Body.setVelocity(pair.bodyB, rotateVector(pair.bodyB.velocity, pExit.angle - pEnter.angle))
    }
    /* if (pair.bodyB === portal1) {
     Body.setPosition(pair.bodyA, portal0.position)
     } else if (pair.bodyA === portal1) {
     Body.setPosition(pair.bodyB, portal0.position)
     } */
  }
}

function exitingPortal(event, portal) {
  var pairs = event.pairs;
  for (var i = 0, j = pairs.length; i != j; ++i) {
    var pair = pairs[i];
    if (pair.bodyA === portal) {
      pair.bodyB.portal = -1;
    } else if (pair.bodyB === portal) {
      pair.bodyA.portal = -1;
    }
  }
}

//at the start of a colision for player
Events.on(engine, "collisionStart", function(event) {
  playerGroundCheck(event, true);
  touchingPortals(event, portal0, portal1);
  touchingPortals(event, portal1, portal0);
});
//ongoing checks for collisions for player
Events.on(engine, "collisionActive", function(event) {
  playerGroundCheck(event, true)
});
//at the end of a colision for player set ground to false
Events.on(engine, 'collisionEnd', function(event) {
  playerGroundCheck(event, false);
  exitingPortal(event, portal0);
  exitingPortal(event, portal1);
});

Events.on(engine, "afterTick", function(event) {
  //set sensor velocity to zero so it collides properly
  Matter.Body.setVelocity(playerSensor, {
    x: 0,
    y: 0
  });
  //move sensor to below the player
  Body.setPosition(playerSensor, {
    x: player.position.x,
    y: player.position.y + playerRadius
  });
});

Events.on(engine, "beforeTick", function(event) {
  game.cycle++;
  //jump
  if (keys[38] && player.ground && player.jumpCD < game.cycle) {
    player.jumpCD = game.cycle + 10; //adds a cooldown to jump
    player.force = {
      x: 0,
      y: -0.07
    };
  }
  //spin left and right
  const spin = 0.05;
  const limit = 0.3;
  if (keys[37] && player.angularVelocity > -limit) {
    player.torque = -spin;
  } else {
    if (keys[39] && player.angularVelocity < limit) {
      player.torque = spin;
    }
  }
});

// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);
