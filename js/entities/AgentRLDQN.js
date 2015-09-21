(function (global) {
    "use strict";

    /**
     * Initialize the AgentRLDQN
     * @param {Vec} position
     * @param {Object} env
     * @param {Object} opts
     * @returns {AgentRLDQN}
     */
    var AgentRLDQN = function (position, env, opts) {
        // Is it a worker
        this.worker = typeof opts.worker !== 'boolean' ? false : opts.worker;
        this.name = 'Agent RLDQN';
        if (this.worker) {
            this.name += ' Worker';
        }

        Entity.call(this, 3, position, env, opts);

        // The number of item types the Agent's eyes can see
        this.numTypes = typeof opts.numTypes === 'number' ? opts.numTypes : 3;
        // The number of Agent's eyes
        this.numEyes = typeof opts.numEyes === 'number' ? opts.numEyes : 9;
        // The number of Agent's eyes, each one sees the number of knownTypes + the two velocity inputs
        this.numStates = this.numEyes * this.numTypes + 2;

        this.carrot = +1;
        this.stick = -1;
        this.action = null;
        this.lastReward = 0;
        this.digestionSignal = 0.0;
        this.epsilon = 0.000;
        this.pts = [];
        this.direction = 'N';
        this.world = {};

        // The Agent's eyes
        this.eyes = [];
        for (var k = 0; k < this.numEyes; k++) {
            this.eyes.push(new Eye(k * 0.21, opts.range, opts.proximity));
        }

        // The Agent's actions
        this.actions = [];
        this.actions.push(0);
        this.actions.push(1);
        this.actions.push(2);
        this.actions.push(3);

        // The number of possible angles the Agent can turn
        this.numActions = this.actions.length;

        this.brainOpts = opts.spec || {
            update: "qlearn", // qlearn | sarsa
            gamma: 0.9, // discount factor, [0, 1)
            epsilon: 0.2, // initial epsilon for epsilon-greedy policy, [0, 1)
            alpha: 0.005, // value function learning rate
            experience_add_every: 5, // number of time steps before we add another experience to replay memory
            experience_size: 10000, // size of experience
            learning_steps_per_iteration: 5,
            tderror_clamp: 1.0, // for robustness
            num_hidden_units: 100 // number of neurons in hidden layer
        };

        // Set up the environment variable for RL
        this.env = {
            numActions: this.numActions,
            numStates: this.numStates
        };
        this.env.getMaxNumActions = function () {
            return this.numActions;
        };
        this.env.getNumStates = function () {
            return this.numStates;
        };

        var _this = this;

        if (!this.worker) {
            this.brain = new DQNAgent(_this.env, this.brainOpts);

            return this;
        } else {
            this.post = function (cmd, input) {
                this.brain.postMessage({target: 'DQN', cmd: cmd, input: input});
            };
            var jEnv = Utility.stringify(_this.env),
                jOpts = JSON.stringify(_this.brainOpts);

            this.brain = new Worker('js/lib/external/rl.js');
            this.brain.onmessage = function (e) {
                var data = e.data;
                switch (data.cmd) {
                    case 'init':
                        if (data.msg === 'complete') {

                        }
                        break;
                    case 'act':
                        if (data.msg === 'complete') {
                            _this.action = data.input;
                            _this.move();
                            _this.eat();
                            _this.learn();
                        }
                        break;
                    case 'learn':
                        if (data.msg === 'complete') {
                            _this.epsilon = data.input;
                        }
                        break;
                    case 'load':
                        if (data.msg === 'complete') {
                            _this.epsilon = data.input;
                        }
                        break;
                    default:
                        console.log('Unknown command: ' + data.cmd + ' message:' + data.msg);
                        break;
                }
            };

            this.post('init', {env: jEnv, opts: jOpts});
        }
    };

    /**
     * Find nearby entities to nom on
     * @returns {AgentRLDQN}
     */
    AgentRLDQN.prototype.eat = function () {
        this.digestionSignal = 0;
        for (let j = 0; j < this.world.entities.length; j++) {
            let entity = this.world.entities[j],
                dist = this.position.distFrom(entity.position);
            if (dist < entity.radius + this.radius) {
                var result = Utility.collisionCheck(this.position, entity.position, this.world.walls, this.world.entities);
                if (!result) {
                    this.digestionSignal += (entity.type === 1) ? this.carrot : this.stick;
                    this.world.deleteEntity(entity);
                }
            }
        }

        return this;
    }

    /**
     * Tick the agent
     * @returns {AgentRLDQN}
     */
    AgentRLDQN.prototype.tick = function (world) {
        this.world = world;
        this.start = new Date().getTime();

        // Let the agents behave in the world based on their input
        this.act();

        // If it's not a worker we need to run the rest of the steps
        if (!this.worker) {
            // Move eet!
            this.move();
            // Find nearby entities to nom
            this.eat();
            // This is where the agents learns based on the feedback of their actions on the environment
            this.learn();
        }

        if (this.cheats) {
            if (this.useSprite === true) {
                this.sprite.getChildAt(0).position.set(this.position.x + this.radius, this.position.y);
                this.sprite.getChildAt(1).position.set(this.position.x + this.radius, this.position.y + (this.radius /2) + 5);
                this.sprite.getChildAt(2).position.set(this.position.x + this.radius, this.position.y + this.radius);
            } else {
                this.shape.getChildAt(0).position.set(this.position.x + this.radius, this.position.y);
                this.shape.getChildAt(1).position.set(this.position.x + this.radius, this.position.y + (this.radius /2) + 5);
                this.shape.getChildAt(2).position.set(this.position.x + this.radius, this.position.y + this.radius);
            }
        }

        return this;
    };

    /**
     * Agent's chance to act on the world
     * @returns {AgentRLDQN}
     */
    AgentRLDQN.prototype.act = function () {
        // Loop through the eyes and check the walls and nearby entities
        for (var e = 0; e < this.numEyes; e++) {
            this.eyes[e].sense(this.position, this.angle, this.world.walls, this.world.entities);
        }

        // in forward pass the agent simply behaves in the environment
        var ne = this.numEyes * this.numTypes,
            inputArray = new Array(this.numStates);
        for (let i = 0; i < this.numEyes; i++) {
            let eye = this.eyes[i];
            inputArray[i * this.numTypes] = 1.0;
            inputArray[i * this.numTypes + 1] = 1.0;
            inputArray[i * this.numTypes + 2] = 1.0;
            inputArray[i * this.numTypes + 3] = eye.vx; // velocity information of the sensed target
            inputArray[i * this.numTypes + 4] = eye.vy;
            if (eye.sensedType !== -1) {
                // sensedType is 0 for wall, 1 for food and 2 for poison.
                // lets do a 1-of-k encoding into the input array
                inputArray[i * this.numTypes + eye.sensedType] = eye.sensedProximity / eye.maxRange; // normalize to [0,1]
            }
        }

        // proprioception and orientation
        inputArray[ne + 0] = this.position.vx;
        inputArray[ne + 1] = this.position.vy;

        if (!this.worker) {
            this.action = this.brain.act(inputArray);
        } else {
            this.post('act', inputArray);
        }

        return this;
    };

    /**
     * Agent's chance to learn
     * @returns {AgentRLDQN}
     */
    AgentRLDQN.prototype.learn = function () {
        this.lastReward = this.digestionSignal;
        //this.pts.push(this.lastReward);

        if (!this.worker) {
            this.brain.learn(this.digestionSignal);
            this.epsilon = this.brain.epsilon;
        } else {
            this.post('learn', this.digestionSignal);
        }

        return this;
    };

    /**
     * Load a pre-trained agent
     * @param file
     */
    AgentRLDQN.prototype.load = function (file) {
        var _this = this;
        $.getJSON(file, function(data) {
            if (!_this.worker) {
                _this.brain.fromJSON(data);
                _this.brain.epsilon = 0.05;
                _this.brain.alpha = 0;
            } else {
                _this.post('load', JSON.stringify(data));
            }
        });
        return this;
    };

    /**
     * Draws it
     * @returns {AgentRLDQN}
     */
    AgentRLDQN.prototype.draw = function () {
        if (this.useSprite) {
            this.sprite.position.set(this.position.x, this.position.y);
            this.sprite.rotation = -this.angle;
        } else {
            this.shape.clear();
            this.shape.lineStyle(1, 0x000000);

            switch (this.type) {
                case 1:
                    this.shape.beginFill(0xFF0000);
                    break;
                case 2:
                    this.shape.beginFill(0x00FF00);
                    break;
                case 3:
                    this.shape.beginFill(0x0000FF);
                    break;
            }
            this.shape.drawCircle(this.position.x, this.position.y, this.radius);
            this.shape.endFill();
        }

        return this;
    };

    /**
     * Move around
     * @returns {AgentRLDQN}
     */
    AgentRLDQN.prototype.move = function () {
        var oldAngle = this.angle,
            speed = 1;
        // Apply outputs of agents on environment
        this.oldPos = this.position.clone();

        // Execute agent's desired action
        switch (this.action) {
            case 0:
                this.position.vx += -speed;
                break;
            case 1:
                this.position.vx += speed;
                break;
            case 2:
                this.position.vy += -speed;
                break;
            case 3:
                this.position.vy += speed;
                break;
        }

        // Forward the agent by velocity
        this.position.vx *= 0.95;
        this.position.vy *= 0.95;

        if (this.collision) {
            // The agent is trying to move from pos to oPos so we need to check walls
            var result = Utility.collisionCheck(this.oldPos, this.position, this.world.walls, []);
            if (result) {
                // The agent derped! Wall collision! Reset their position
                this.position = this.oldPos;
            }
        }

        // Handle boundary conditions.. bounce Agent
        if (this.position.x < 2) {
            this.position.x = 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }
        if (this.position.x > this.world.width - 2) {
            this.position.x = this.world.width - 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }
        if (this.position.y < 2) {
            this.position.y = 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }
        if (this.position.y > this.world.height - 2) {
            this.position.y = this.world.height - 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }

        this.position.advance();
        this.position.round();

        if (this.useSprite) {
            this.sprite.position.set(this.position.x, this.position.y);
        }

        var end = new Date().getTime(),
            dist = this.position.distFrom(this.oldPos),
            accel = dist / Math.pow(this.start - end, 2);

        switch (this.action) {
            case 0:
                this.position.ax = -accel;
                break;
            case 1:
                this.position.ax = accel;
                break;
            case 2:
                this.position.ay = -accel;
                break;
            case 3:
                this.position.ay = accel;
                break;
        }
        return this;
    };

    global.AgentRLDQN = AgentRLDQN;

}(this));
