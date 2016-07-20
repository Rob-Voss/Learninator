(function(global) {
  "use strict";

  const entityTypes = ['Wall', 'Nom', 'Gnar', 'Agent', 'Agent Worker', 'Entity Agent'],
      // Matter aliases
      Body = Matter.Body,
      Vector = Matter.Vector,
      Query = Matter.Query;

  class Eye {

    /**
     * Eye
     * @constructor
     *
     * Eye sensor has a maximum range and senses entities and walls
     * @param {number} angle
     * @param {Agent} agent
     * @return {Eye}
     */
    constructor(angle, agent) {
      this.angle = angle;
      this.agentAngle = agent.body.angle;
      this.agentRadius = agent.radius;
      this.range = agent.range;
      this.position = agent.body.position;
      this.v1 = Vector.create(
          this.position.x + this.agentRadius * Math.sin(this.agentAngle + this.angle),
          this.position.y + this.agentRadius * Math.cos(this.agentAngle + this.angle)
      );
      this.v2 = Vector.create(
          this.v1.x + agent.range * Math.sin(this.agentAngle + this.angle),
          this.v1.y + agent.range * Math.cos(this.agentAngle + this.angle)
      );
      this.sensed = {
        type: -1,
        position: this.v2,
        proximity: agent.proximity,
        velocity: Vector.create(0, 0)
      };
      this.collisions = [];

      return this;
    }
  }

  class PhysicalAgent {

    /**
     * Initialize the Agent
     * @extends Entity
     * @constructor
     *
     * @param {Matter.Body} body - The Matter.Body
     * @param {agentOpts} opts - The Agent options
     * @return {PhysicalAgent}
     */
    constructor(body, opts) {
      this.id = 'agent-' + body.id;
      this.body = body;
      this.body.label = 'Agent';
      this.angle = this.body.angle;
      this.position = this.body.position;
      this.radius = this.body.circleRadius;
      this.type = entityTypes.indexOf(this.body.label);
      this.speed = 1;
      this.force = Vector.create(0, 0);
      this.name = 'Physical Agent';
      this.age = 0;
      this.action = 0;
      this.color = 0x0000FF;
      this.avgReward = 0;
      this.lastReward = 0;
      this.digestion = 0.0;
      this.epsilon = 0.000;
      this.brain = {};
      this.brainState = {};

      // Reward or punishment
      this.carrot = 1;
      this.stick = -1;

      this.nStepsHistory = [];
      this.pts = [];

      // Is it a worker
      this.worker = Utility.getOpt(opts, 'worker', false);
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
      // The number of Agent's eyes times the number of known types plus the number of
      // proprioception values it is tracking
      this.numStates = this.numEyes * this.numTypes + this.numProprioception;

      // The Agent's actions
      this.actions = [];
      for (let i = 0; i < this.numActions; i++) {
        this.actions.push(i);
      }

      // Set the brain options
      this.brainOpts = Utility.getOpt(opts, 'spec', {
        update: 'qlearn',
        gamma: 0.9,
        epsilon: 0.2,
        alpha: 0.005,
        experienceAddEvery: 5,
        experienceSize: 10000,
        learningStepsPerIteration: 5,
        tdErrorClamp: 1.0,
        numHiddenUnits: 100
      });

      // The Agent's environment
      this.env = Utility.getOpt(opts, 'env', {
        getNumStates: () => {
          return this.numStates;
        },
        getMaxNumActions: () => {
          return this.numActions;
        },
        startState: () => {
          return 0;
        }
      });

      // The Agent's eyes
      if (this.eyes === undefined) {
        this.eyes = [];
        for (let k = 0; k < this.numEyes; k++) {
          this.eyes.push(new Eye(k * 0.21, this));
        }
      }

      this.reset();

      return this;
    }

    /**
     * Load a pre-trained agent
     * @param {String} file
     */
    load(file) {
      let self = this;
      $.getJSON(file, (data) => {
        if (self.brain.valueNet !== undefined) {
          self.brain.valueNet.fromJSON(data);
        } else {
          self.brain.fromJSON(data);
        }
        self.brain.epsilon = 0.05;
        self.brain.alpha = 0;
      });

      return self;
    }

    /**
     * Reset or set up the Agent
     * @return {PhysicalAgent}
     */
    reset() {
      let brain = this.brainType.split('.');
      // If it's a worker then we have to load it a bit different
      if (!this.worker) {
        this.brain = new global[brain[0]][brain[1]](this.env, this.brainOpts);

        return this;
      } else {
        this.post = (cmd, input) => {
          this.brain.postMessage({target: this.brainType, cmd: cmd, input: input});
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
                this.brainState = JSON.stringify(data.input);
              }
              break;
            case 'load':
              if (data.msg === 'complete') {
                this.brainState = JSON.stringify(data.input);
              }
              break;
            case 'save':
              if (data.msg === 'complete') {
                this.brainState = JSON.stringify(data.input);
              }
              break;
            default:
              console.log('Unknown command: ' + data.cmd + ' message:' + data.msg);
              break;
          }
        };

        this.post('init', {env: jEnv, opts: jOpts});
      }

      return this;
    }

    /**
     * Tick the agent
     * @param {array} bodies
     * @return {PhysicalAgent}
     */
    tick(bodies) {
      this.age += 1;
      // Let the agents behave in the world based on their input

      let ne = this.numEyes * this.numTypes,
          input = new Array(this.numStates);
      for (let i = 0; i < this.eyes.length; i++) {
        let eye = this.eyes[i];
        // Check for Ray collisions
        eye.v1 = Vector.create(
            this.body.position.x + this.radius * Math.sin(this.body.angle + eye.angle),
            this.body.position.y + this.radius * Math.cos(this.body.angle + eye.angle)
        );
        eye.v2 = Vector.create(
            this.body.position.x + this.range * Math.sin(this.body.angle + eye.angle),
            this.body.position.y + this.range * Math.cos(this.body.angle + eye.angle)
        );
        let collisions = Query.ray(bodies, eye.v1, eye.v2, 1);

        // Reset our eye data
        eye.sensed = {
          type: -1,
          proximity: this.range,
          position: this.eyes[i].v2,
          velocity: {x: 0, y: 0}
        };

        // Loop through the Ray collisions and record what the eyes saw
        for (let ic = 0; ic < collisions.length; ic++) {
          let collision = collisions[ic], vecI;
          if (collision.bodyA.id !== this.body.id) {
            if (collision.body.entity !== undefined && collision.body.entity.type === 0) {
              let entity = collision.body.entity,
                  p1 = eye.v1, p2 = eye.v2,
                  l1 = Vector.create(entity.x, entity.y),
                  l2 = Vector.create(entity.x + entity.width, entity.y + entity.height),
                  denom = (l2.y - l1.y) * (p2.x - p1.x) - (l2.x - l1.x) * (p2.y - p1.y);
              if (denom !== 0.0) {
                let ua = ((l2.x - l1.x) * (p1.y - l1.y) - (l2.y - l1.y) * (p1.x - l1.x)) / denom,
                    ub = ((p2.x - p1.x) * (p1.y - l1.y) - (p2.y - p1.y) * (p1.x - l1.x)) / denom;
                if (ua > 0.0 && ua < 1.0 && ub > 0.0 && ub < 1.0) {
                  vecI = Vector.create(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
                  eye.sensed.position = vecI;
                }
              }
              eye.sensed.type = collision.body.entity.type;
            } else {
              let vecI = Vector.create(collision.body.position.x, collision.body.position.y);
              eye.sensed.position = vecI;
              eye.sensed.type = (collision.body.entity !== undefined) ? collision.body.entity.type : -1;
            }

            let dx = this.body.position.x - eye.sensed.position.x,
                dy = this.body.position.y - eye.sensed.position.y,
                dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > this.range) {
              //console.log(dist);
            }
            eye.sensed.proximity = dist;
            eye.sensed.velocity.x = collision.body.velocity.x;
            eye.sensed.velocity.y = collision.body.velocity.y;
          }
        }

        // Populate the sensory input array
        input[i * this.numTypes] = 1;
        input[i * this.numTypes + 1] = 1;
        input[i * this.numTypes + 2] = 1;
        // velocity information of the sensed target
        input[i * this.numTypes + 3] = eye.sensed.velocity.x;
        input[i * this.numTypes + 4] = eye.sensed.velocity.y;
        if (eye.sensed.type !== -1) {
          // sensedType is 0 for wall, 1 for food and 2 for poison. lets
          // do a 1-of-k encoding into the input array normalize to [0,1]
          let inputId = i * this.numTypes + eye.sensed.type;
          input[inputId] = eye.sensed.proximity / eye.range;
          if (isNaN(input[inputId])) {
            console.log(inputId + 'isNaN');
          }
        }
      }

      // proprioceptive and orientation
      input[ne] = this.body.velocity.x;
      input[ne + 1] = this.body.velocity.y;

      this.action = this.brain.act(input);

      // Execute agent's desired action
      switch (this.action) {
        case 0: // Left
          this.force.x = -this.speed * 0.0025;
          break;
        case 1: // Right
          this.force.x = this.speed * 0.0025;
          break;
        case 2: // Up
          this.force.y = -this.speed * 0.0025;
          break;
        case 3: // Down
          this.force.y = this.speed * 0.0025;
          break;
      }
      Body.applyForce(this.body, this.body.position, this.force);
      this.position = this.body.position;

      this.lastReward = this.digestion;
      if (this.lastReward > 1) {
        console.log('lastReward greater than 1');
      } else if (this.lastReward < -1) {
        console.log('lastReward less than -1');
      }
      this.brain.learn(this.digestion);
      this.epsilon = this.brain.epsilon;
      this.digestion = 0;

      return this;
    }

  }
  global.PhysicalAgent = PhysicalAgent;

}(this));