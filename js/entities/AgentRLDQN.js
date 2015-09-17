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
        Entity.call(this, 3, position, env, opts);

        // The number of item types the Agent's eyes can see
        this.numTypes = typeof(opts.numTypes) === 'number' ? opts.numTypes : 3;

        // The number of Agent's eyes
        this.numEyes = typeof(opts.numEyes) === 'number' ? opts.numEyes :  9;

        this.name = "Agent RLDQN";

        this.carrot = +1;
        this.stick = -1;
        this.action = null;
        this.lastReward = 0;
        this.digestionSignal = 0.0;
        this.rewardBonus = 0.0;
        this.previousActionIdx = -1;
        this.pts = [];
        this.digested = [];
        this.direction = 'N';

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

        // The number of Agent's eyes, each one sees the number of knownTypes + the two velocity inputs
        this.numStates = this.numEyes * this.numTypes + 2;
        var _this = this;

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
        this.worker = (typeof opts.worker !== 'boolean') ? false : opts.worker;

        if (!this.worker) {
            this.brain = new DQNAgent(_this, this.brainOpts);

            return this;
        } else {
            var jEnv = JSON.stringify(_this),
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
                        _this.act();
                    }
                    break;
                case 'learn':
                    if (data.msg === 'complete') {
                        
                    }
                    break;
                default:
                    console.log('Unknown command: ' + data.cmd + ' message:' + data.msg);
                    break;
                }
            };

            this.brain.postMessage({cmd: 'init', input: {env: jEnv, opts: jOpts}});
        }
    };

    /**
     * Agent's chance to act on the world
     */
    AgentRLDQN.prototype.act = function () {
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
            this.brain.postMessage({cmd: 'act', input: inputArray});
        }

        return this;
    };

    /**
     * Draws it
     *
     * @returns {Entity}
     */
    AgentRLDQN.prototype.draw = function () {
        if (this.useSprite) {
            this.sprite.position.set(this.position.x, this.position.y);
            this.sprite.rotation = -this.angle;
        } else {
            this.shape.clear();
            this.shape.lineStyle(0x000000);

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
     * Agent's chance to learn
     */
    AgentRLDQN.prototype.learn = function () {
        let reward = this.digestionSignal
        this.lastReward = reward

        if (!this.worker) {
            this.action = this.brain.learn(reward);
        } else {
            this.brain.postMessage({cmd: 'learn', input: reward});
        }

        return this;
    };

    /**
     * Move around
     * @param {Object} smallWorld
     */
    AgentRLDQN.prototype.move = function (smallWorld) {
        var oldAngle = this.angle,
            speed = 1;
        // Apply outputs of agents on environment
        this.oldPos = this.position.clone();
        this.oldAngle = oldAngle;

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
            var result = Utility.collisionCheck(this.oldPos, this.position, smallWorld.walls, []);
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
        if (this.position.x > smallWorld.width - 2) {
            this.position.x = smallWorld.width - 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }
        if (this.position.y < 2) {
            this.position.y = 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }
        if (this.position.y > smallWorld.height - 2) {
            this.position.y = smallWorld.height - 2;
            this.position.vx = 0;
            this.position.vy = 0;
        }

        this.position.advance();
        this.position.round();

        if (this.useSprite) {
            this.sprite.position.set(this.position.x, this.position.y);
        }

        return this;
    };

    /**
     * Tick the agent
     * @param {Object} smallWorld
     */
    AgentRLDQN.prototype.tick = function (smallWorld) {
        // Check for food
        // Gather up all the entities nearby based on cell population
        this.digested = [];

        // Loop through the eyes and check the walls and nearby entities
        for (var e = 0; e < this.numEyes; e++) {
            this.eyes[e].sense(this.position, this.angle, smallWorld.walls, smallWorld.entities);
        }

        // Let the agents behave in the world based on their input
        this.act();

        this.move(smallWorld);

        for (let j = 0; j < smallWorld.entities.length; j++) {
            let entity = smallWorld.entities[j],
                dist = this.position.distFrom(entity.position);
            if (dist < entity.radius + this.radius) {
                var result = Utility.collisionCheck(this.position, entity.position, smallWorld.walls, smallWorld.entities);
                if (!result) {
                    this.digestionSignal += (entity.type === 1) ? this.carrot : this.stick;
                    this.digested.push(entity);
                    entity.cleanup = true;
                }
            }
        }

        // This is where the agents learns based on the feedback of their actions on the environment
        this.learn();

        if (this.digested.length > 0) {
            switch (this.brainType) {
                case 'TD':
                case 'RLTD':
                    if (!this.worker) {
                        this.pts.push(this.brain.average_reward_window.getAverage().toFixed(1));
                    }
                    break;
                case 'RLDQN':
                    this.pts.push(this.lastReward * 0.999 + this.lastReward * 0.001);
                    break;
            }
        }

        return this;
    };

    global.AgentRLDQN = AgentRLDQN;

}(this));
