/**
 * Eye
 *
 * @class
 */
class Eye {

  /**
   * Eye sensor has a maximum range and senses entities and walls
   * @constructor
   *
   * @param {number} angle
   * @param {Agent} agent
   * @return {Eye}
   */
  constructor(angle, agent) {
    this.angle = angle;
    this.agentAngle = agent.angle;
    this.agentRadius = agent.radius;
    this.agentId = agent.id;
    this.position = agent.position;
    this.proximity = agent.proximity;
    this.range = agent.range;
    this.graphics = new PIXI.Graphics();
    this.v1 = new Vec(
      agent.position.x + agent.radius * Math.sin(agent.angle + this.angle),
      agent.position.y + agent.radius * Math.cos(agent.angle + this.angle)
    );
    this.v2 = new Vec(
      this.v1.x * Math.sin(agent.angle + this.angle),
      this.v1.y * Math.cos(agent.angle + this.angle)
    );
    this.sensed = {
      type: -1,
      position: this.v2,
      proximity: this.proximity,
      velocity: new Vec(0, 0)
    };
    this.collisions = [];

    return this;
  }

  /**
   * Draw the lines for the eyes
   *
   * @param {Agent} agent
   */
  draw(agent) {
    this.v1 = new Vec(
      agent.position.x + agent.radius * Math.sin(agent.angle + this.angle),
      agent.position.y + agent.radius * Math.cos(agent.angle + this.angle)
    );

    this.v2 = new Vec(
      this.v1.x + this.sensed.proximity * Math.sin(agent.angle + this.angle),
      this.v1.y + this.sensed.proximity * Math.cos(agent.angle + this.angle)
    );

    this.graphics.clear();
    this.graphics.moveTo(this.v1.x, this.v1.y);
    switch (this.sensed.type) {
      case 0:
        // Is it wall or nothing?
        this.graphics.lineStyle(1, 0x000000, 1);
        break;
      case 1:
        // It is noms
        this.graphics.lineStyle(1, 0x00FF00, 1);
        break;
      case 2:
        // It is gnar gnar
        this.graphics.lineStyle(1, 0xFF0000, 1);
        break;
      case 3:
      case 4:
      case 5:
        // Is it another Agent
        this.graphics.lineStyle(1, 0x0000FF, 1);
        break;
      default:
        // Is it wall or nothing?
        this.graphics.lineStyle(1, 0x000000, 1);
        break;
    }
    this.graphics.lineTo(this.v2.x, this.v2.y);
    this.graphics.endFill();
  }

  /**
   * Sense the surroundings
   *
   * @param {Agent} agent
   */
  sense(agent) {
    // Reset our eye data
    this.sensed = {
      type: -1,
      position: this.v2,
      proximity: this.range,
      velocity: new Vec(0, 0)
    };

    if (this.collisions.length > 1) {
      let closeObj;
      for (let i = 0; i < this.collisions.length; i++) {
        if (closeObj === undefined) {
          closeObj = this.collisions[i];
        }
        closeObj = (this.collisions[i].distance <= closeObj.distance) ? this.collisions[i] : closeObj;
      }
      this.collisions = [closeObj];
    }

    for (let i = 0; i < this.collisions.length; i++) {
      let closeObj = this.collisions[i];
      if (closeObj !== undefined && closeObj.id !== this.agentId) {
        if (closeObj.distance <= this.range) {
          this.sensed.type = closeObj.entity.type;
          this.sensed.proximity = closeObj.distance;
          this.sensed.position.x = closeObj.vecI.x;
          this.sensed.position.y = closeObj.vecI.y;
          this.sensed.velocity.x = ('vx' in closeObj.vecI) ? closeObj.vecI.vx : 0;
          this.sensed.velocity.y = ('vy' in closeObj.vecI) ? closeObj.vecI.vy : 0;
        }
      }
    }
  }
}

/**
 * Options for the Agent
 * @typedef {object} agentOpts
 * @property {boolean} worker - Is the Agent a Web Worker
 * @property {string} brainType - The type of Brain to use
 * @property {number} numActions - The number of actions the Agent can take
 * @property {number} numTypes - The number of item types the Agent's eyes can see
 * @property {number} numEyes - The number of Agent's eyes
 * @property {number} numProprioception - The number of Agent's proprioception values
 * @property {number} range - The range of the Agent's eyes
 * @property {number} proximity - The proximity of the Agent's eyes
 * @property {cheatOpts} cheats - The cheats to display
 * @property {object} specTD - The brain options
 * @property {object} specDQN - The brain options
 * @property {envObject} env - The environment
 */

/**
 * Initialize the Agent
 *
 * @extends {Entity}
 * @class
 */
class Agent extends Entity {

  /**
   * Agent
   * @constructor
   *
   * @param {Vec} position - The x, y location
   * @param {agentOpts} opts - The Agent options
   * @return {Agent}
   */
  constructor(position, opts) {
    // Is it a worker
    let worker = Utility.getOpt(opts, 'worker', false);
    super((worker ? 'Agent Worker' : 'Agent'), position, opts);
    this.worker = worker;

    this.gridLocation = Utility.getOpt(opts, 'gridLocation', new Vec(0, 0));
    // Just a text value for the brain type, also useful for worker posts
    this.brainType = Utility.getOpt(opts, 'brainType', 'RL.DQNAgent');
    // The number of actions the Agent can do
    this.numActions = Utility.getOpt(opts, 'numActions', 4);
    // The number of item types the Agent's eyes can see
    this.numTypes = Utility.getOpt(opts, 'numTypes', 3);
    // The number of Agent's eyes
    this.numEyes = Utility.getOpt(opts, 'numEyes', 9);
    // The number of Agent's proprioception values
    this.numProprioception = Utility.getOpt(opts, 'numProprioception', 0);
    // The range of the Agent's eyes
    this.range = Utility.getOpt(opts, 'range', 85);
    // The proximity of the Agent's eyes
    this.proximity = Utility.getOpt(opts, 'proximity', 85);
    // The number of Agent's eyes times the number of known types
    // plus the number of proprioception values it is tracking
    this.numStates = this.numEyes * this.numTypes + this.numProprioception;

    // Reward or punishment
    this.carrot = 1;
    this.stick = -1;

    this.age = 0;
    this.action = 0;
    this.avgReward = 0;
    this.lastReward = 0;
    this.digestionSignal = 0.0;
    this.epsilon = 0.000;
    this.brain = {};
    this.brainState = {};

    this.nStepsHistory = [];
    this.nStepsCounter = 0;
    this.nflot = 1000;
    this.score = 0;
    this.pts = [];

    // The Agent's actions
    this.actions = [];
    for (let i = 0; i < this.numActions; i++) {
      this.actions.push(i);
    }

    // The Agent's environment
    this.env = Utility.getOpt(opts, 'env', {
      getNumStates: () => this.numStates,
      getMaxNumActions: () => this.numActions,
      startState: () => 0
    });

    // The Agent's eyes
    if (this.eyes === undefined) {
      this.eyes = [];
      let numEyes = this.numEyes;
      for (let k = 0; k < this.numEyes; k++) {
        let angle = Math.ceil(360 * k / this.numEyes) * Math.PI / 180;
        let eye = new Eye(angle, this);
        this.eyes.push(eye);
      }
    }

    // Set the brain options
    this.brainOpts = [];
    this.brainOpts.DQNAgent = Utility.getOpt(opts, 'specDQN', {
      update: 'qlearn', // qlearn | sarsa
      gamma: 0.9, // discount factor, [0, 1)
      epsilon: 0.2, // initial epsilon for epsilon-greedy policy, [0, 1)
      alpha: 0.005, // value function learning rate
      // number of time steps before we add another experience
      // to replay memory
      experienceAddEvery: 5,
      experienceSize: 10000, // size of experience
      learningStepsPerIteration: 5,
      tdErrorClamp: 1.0, // for robustness
      numHiddenUnits: 100 // number of neurons in hidden layer
    });

    this.brainOpts.TDAgent = Utility.getOpt(opts, 'specTD', {
      update: 'qlearn', // 'qlearn' or 'sarsa'
      gamma: 0.9, // discount factor, [0, 1)
      epsilon: 0.2, // initial epsilon for epsilon-greedy policy, [0, 1)
      alpha: 0.1, // value function learning rate
      lambda: 0, // eligibility trace decay, [0,1). 0 = no eligibility traces
      replacingTraces: true, // use replacing or accumulating traces
      planN: 50, // number of planning steps per iteration. 0 = no planning
      // non-standard, updates policy smoothly to follow max_a Q
      smoothPolicyUpdate: true,
      beta: 0.1 // learning rate for smooth policy update
    });

    this.reset();

    return this;
  }

  /**
   * Agent's chance to act on the world
   *
   * @return {Agent}
   */
  act() {
    // in forward pass the agent simply behaves in the environment
    let ne = this.numEyes * this.numTypes,
      inputArray = new Array(this.numStates);
    for (let ae = 0, ne = this.numEyes; ae < ne; ae++) {
      let eye = this.eyes[ae];
      eye.sense(this);
      inputArray[ae * this.numTypes] = 1.0;
      inputArray[ae * this.numTypes + 1] = 1.0;
      inputArray[ae * this.numTypes + 2] = 1.0;
      // velocity information of the sensed target
      inputArray[ae * this.numTypes + 3] = eye.sensed.velocity.x;
      inputArray[ae * this.numTypes + 4] = eye.sensed.velocity.y;
      if (eye.sensed.type !== -1) {
        // sensedType is 0 for wall, 1 for food and 2 for poison.
        // lets do a 1-of-k encoding into the input array
        inputArray[ae * this.numTypes + eye.sensed.type] = eye.sensed.proximity / eye.range;
      }
    }

    // proprioception and orientation
    inputArray[ne] = this.position.vx;
    inputArray[ne + 1] = this.position.vy;

    if (!this.worker) {
      this.action = this.brain.act(inputArray);
    } else {
      this.post('act', inputArray);
    }

    return this;
  }

  /**
   * Modify position based on collision
   *
   * @param {Object} collisionObj
   */
  collision(collisionObj) {
    if (collisionObj.distance <= this.radius) {
      switch (collisionObj.entity.type) {
        case 0:
          // Wall
          this.position = this.oldPosition;
          this.force.x = 0;
          this.force.y = 0;
          break;
        case 1:
          // Noms
          this.digestionSignal += this.carrot;
          collisionObj.entity.cleanUp = true;
          break;
        case 2:
          // Gnars
          this.digestionSignal += this.stick;
          collisionObj.entity.cleanUp = true;
          break;
        case 3:
        case 4:
          // Other Agents
          this.force.x = collisionObj.target.vx;
          this.force.y = collisionObj.target.vy;
          break;
      }
    }
  }

  /**
   * Draw the Agent
   *
   * @returns {Agent}
   */
  draw() {
    super.draw();
    // Loop through the eyes and draw them
    for (let ae = 0, ne = this.numEyes; ae < ne; ae++) {
      this.eyes[ae].draw(this);
    }

    return this;
  }

  /**
   * Agent's chance to learn
   *
   * @return {Agent}
   */
  learn() {
    this.lastReward = this.digestionSignal;
    if (this.digestionSignal > 1) {
      console.log('digestionSignal is greater than 1');
    }
    // var proximity_reward = 0.0;
    // var num_eyes = this.eyes.length;
    // for(var i=0;i<num_eyes;i++) {
    //   var e = this.eyes[i];
    //   // agents dont like to see walls, especially up close
    //   proximity_reward += e.sensed_type === 0 ? e.sensed_proximity/e.max_range : 1.0;
    // }
    // proximity_reward = proximity_reward/num_eyes;
    // reward += proximity_reward;

    //var forward_reward = 0.0;
    //if(this.actionix === 0) forward_reward = 1;

    if (!this.worker) {
      this.brain.learn(this.lastReward);
      this.epsilon = this.brain.epsilon;
      this.digestionSignal = 0;
    } else {
      this.post('learn', this.lastReward);
    }

    return this;
  }

  /**
   * Load a pre-trained agent
   *
   * @param {string} file
   * @return {Agent}
   */
  load(file) {
    $.getJSON(file, (data) => {
      if (!this.worker) {
        if (this.brain.valueNet !== undefined) {
          this.brain.valueNet.fromJSON(data);
        } else {
          this.brain.fromJSON(data);
        }
        this.brain.epsilon = 0.05;
        this.brain.alpha = 0;
      } else {
        this.post('load', Utility.Strings.stringify(data));
      }
    });

    return this;
  }

  /**
   * Move around
   *
   * @return {Agent}
   */
  move() {
    for (let i = 0; i < this.collisions.length; i++) {
      this.collision(this.collisions[i]);
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

    return this;
  }

  /**
   * Reset or set up the Agent
   *
   * @return {Agent}
   */
  reset() {
    let b = this.brainType.split('.');
    // If it's a worker then we have to load it a bit different
    if (!this.worker) {
      this.brain = new window[b[0]][b[1]](this.env, this.brainOpts[b[1]]);

      return this;
    } else {
      this.post = (cmd, input) => {
        this.brain.postMessage({
          target: this.brainType,
          cmd: cmd,
          input: input
        });
      };

      let jEnv = Utility.Strings.stringify(this.env),
        jOpts = Utility.Strings.stringify(this.brainOpts);

      this.brain = new Worker('js/lib/external/rl.js');
      this.brain.onmessage = (e) => {
        let data = e.data;
        switch (data.cmd) {
          case 'act':
            if (data.msg === 'complete') {
              this.action = data.input;
              this.move();
              this.learn();
            }
            break;
          case 'init':
            if (data.msg === 'complete') {
              //
            }
            break;
          case 'learn':
            if (data.msg === 'complete') {
              this.brainState = Utility.Strings.stringify(data.input);
            }
            break;
          case 'load':
            if (data.msg === 'complete') {
              this.brainState = Utility.Strings.stringify(data.input);
            }
            break;
          case 'save':
            if (data.msg === 'complete') {
              this.brainState = Utility.Strings.stringify(data.input);
            }
            break;
          default:
            console.log('Unknown: ' + data.cmd + ' message:' + data.msg);
            break;
        }
      };

      this.post('init', {env: jEnv, opts: jOpts});
    }

    return this;
  }

  /**
   * Save the brain state
   *
   * @return {Agent}
   */
  save() {
    if (!this.worker) {
      this.brainState = Utility.Strings.stringify(this.brain.toJSON());
    } else {
      this.post('save');
    }

    return this.brainState;
  }

  /**
   * Tick the agent
   *
   * @return {Agent}
   */
  tick() {
    // Let the agents behave in the world based on their input
    this.act();

    // If it's not a worker we need to run the rest of the steps
    if (!this.worker) {
      // Move eet!
      this.move();
      // This is where the agents learns based on the feedback of their
      // actions on the environment
      this.learn();
    }

    return this;
  }
}
