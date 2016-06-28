(function(global) {
  'use strict';

//import Agent from './Agent.js';

/*export default*/ class EntityRLDQN extends Agent {

  /**
   * Initialize the EntityRLDQN
   * @name EntityRLDQN
   * @extends Entity
   * @constructor
   *
   * @param {Vec} position - The x, y location
   * @param {entityOpts} opts - The Entity options
   * @return {EntityRLDQN}
   */
  constructor(position, opts) {
    opts.radius = 20;
    opts.specDQN = {
      update: "qlearn", // qlearn | sarsa
      gamma: 0.9, // discount factor, [0, 1)
      epsilon: 0.2, // initial epsilon for epsilon-greedy policy, [0, 1)
      alpha: 0.01, // value function learning rate
      experienceAddEvery: 10, // number of time steps before we add another experience to replay memory
      experienceSize: 5000, // size of experience
      learningStepsPerIteration: 20,
      tdErrorClamp: 1.0, // for robustness
      numHiddenUnits: 100 // number of neurons in hidden layer
    };
    super(position, opts);

    this.name = 'Entity RLDQN';
    this.state = null;
    this.stepsPerTick = 1;
    this.BADRAD = 25;
    this.type = 5;
    this.speed = 0.50;

    // The Entity Agent's eyes
    this.eyes = [];
    for (let k = 0; k < this.numEyes; k++) {
      let eye = new Eye(k * Math.PI / 3, this);
      this.eyes.push(eye);
    }

    return this;
  }

  /**
   * Get the current state
   * @return {EntityRLDQN}
   */
  act() {
    this.state = [
      this.enemy.position.x,
      this.enemy.position.y,
      this.enemy.position.vx,
      this.enemy.position.vy,
      this.target.position.x - this.position.x,
      this.target.position.y - this.position.y,
      this.enemy.position.x - this.position.x,
      this.enemy.position.y - this.position.y
    ];
    this.action = this.brain.act(this.state);

    return this;
  }

  /**
   * Sample the next state
   */
  move() {
    for (let i = 0; i < this.collisions.length; i++) {
      let collisionObj = this.collisions[i];
      if (collisionObj.distance <= this.radius) {
        switch (collisionObj.entity.type) {
          case 0:
            // Wall
            this.position = this.oldPosition;
            this.force.x = 0;
            this.force.y = 0;
            break;
          case 1:
          case 2:
          case 3:
            break;
          case 4:
            // Other Agents
            this.force.x = collisionObj.target.vx;
            this.force.y = collisionObj.target.vy;
            break;
        }
      }
    }

    // Execute agent's desired action
    switch (this.action) {
      case 0: // Left
        this.force.x += -this.speed * 0.95;
        break;
      case 1: // Right
        this.force.x += this.speed * 0.95;
        break;
      case 2: // Up
        this.force.y += -this.speed * 0.95;
        break;
      case 3: // Down
        this.force.y += this.speed * 0.95;
        break;
    }

    // Forward the Agent by force
    this.oldPosition = this.position.clone();
    this.oldAngle = this.position.angle;

    this.position.vx = this.force.x;
    this.position.vy = this.force.y;
    this.position.advance(this.speed);
    this.direction = Utility.getDirection(this.position.direction);
    // Compute distances
    let dx1 = this.position.x - this.target.position.x, // Distance from Noms
        dy1 = this.position.y - this.target.position.y, // Distance from Noms
        dx2 = this.position.x - this.enemy.position.x, // Distance from Agent
        dy2 = this.position.y - this.enemy.position.y, // Distance from Agent
        d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1),
        d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2),
        // Compute reward we want to go close to Agent we like
        r = -d1,
        eRng = this.enemy.range;

    if (d2 < eRng) {
      // but if we're too close to the bad Agent that's bad
      r += 2 * (d2 - eRng) / eRng;
    }

    // Give bonus for gliding with no force
    //if (this.action === 4) {
    //    r += 0.05;
    //}

    let vv = r + 0.5,
        ms = 255.0,
        red, green, blue;
    if (vv > 0) {
      red = 255 - vv * ms;
      blue = 255 - vv * ms;
      this.color = parseInt(Utility.rgbToHex(red, 255, blue));
    } else {
      green = 255 + vv * ms;
      blue = 255 + vv * ms;
      this.color = parseInt(Utility.rgbToHex(255, green, blue));
    }
    this.lastReward = r;

    return this;
  }

  learn() {
    this.brain.learn(this.lastReward);
    this.epsilon = this.brain.epsilon;
  }

  /**
   * Agent's chance to act on the world
   */
  tick() {
    for (let k = 0; k < this.stepsPerTick; k++) {
      this.act();
      this.move();
      this.learn();
    }
    this.draw();

    return this;
  }
}

if (typeof process !== 'undefined') { // Checks for Node.js - http://stackoverflow.com/a/27931000/1541408
  module.exports = {
    EntityRLDQN: EntityRLDQN
  };
} else {
  global.EntityRLDQN = EntityRLDQN;
}

}(this));
