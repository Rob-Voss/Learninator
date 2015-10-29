var AgentRLDQN = AgentRLDQN || {};

(function (global) {
    "use strict";

    /**
     * Initialize the AgentRLDQN
     * @name AgentRLDQN
     * @extends Agent
     * @constructor
     *
     * @param {Vec} position - The x, y location
     * @param {agentOpts} opts - The Agent options
     * @returns {AgentRLDQN}
     */
    function AgentRLDQN(position, opts) {
        // Reward or punishment
        this.carrot = +1;
        this.stick = -1;

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

        Agent.call(this, position, opts);

        this.reset();
    }

    AgentRLDQN.prototype = Object.create(Agent.prototype);
    AgentRLDQN.prototype.constructor = Agent;

    /**
     * Agent's chance to act on the world
     * @returns {AgentRLDQN}
     */
    AgentRLDQN.prototype.act = function () {
        // Loop through the eyes and check the walls and nearby entities
        for (let e = 0; e < this.numEyes; e++) {
            this.eyes[e].sense(this);
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
        this.pts.push(this.digestionSignal);

        if (!this.worker) {
            this.brain.learn(this.digestionSignal);
            this.epsilon = this.brain.epsilon;
        } else {
            this.post('learn', this.digestionSignal);
        }

        return this;
    };

    /**
     * Move around
     * @returns {AgentRLDQN}
     */
    AgentRLDQN.prototype.move = function () {
        var speed = 1;
        this.oldAngle = this.angle;
        this.oldPos = this.position.clone();
        this.digestionSignal = 0;

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
        this.position.x += this.position.vx;
        this.position.y += this.position.vy;

        // Check the world for collisions
        this.world.check(this, false);

        for (let w = 0, wl = this.world.walls.length; w < wl; w++) {
            var wall = this.world.walls[w],
                result = this.world.lineIntersect(this.oldPos, this.position, wall.v1, wall.v2, this.radius);
            if (result) {
                this.collisions.unshift(wall);
            }
        }

        // Go through and process what we ate/hit
        var minRes = false;
        for (let i = 0; i < this.collisions.length; i++) {
            // Nom or Gnar
            if (this.collisions[i].type === 1 || this.collisions[i].type === 2) {
                for (let w = 0, wl = this.world.walls.length; w < wl; w++) {
                    var wall = this.world.walls[w],
                        result = this.world.lineIntersect(this.position, this.collisions[i].position, wall.v1, wall.v2, this.radius);
                    if (result) {
                        if (!minRes) {
                            minRes = result;
                        } else {
                            // Check if it's closer
                            if (result.vecX < minRes.vecX) {
                                // If yes, replace it
                                minRes = result;
                            }
                        }
                    }
                }

                if (!minRes) {
                    //let rewardBySize = this.carrot + (this.collisions[i].radius / 100),
                    //    stickBySize = this.stick - (this.collisions[i].radius / 100);
                    //this.digestionSignal += (this.collisions[i].type === 1) ? rewardBySize : stickBySize;
                    this.digestionSignal += (this.collisions[i].type === 1) ? this.carrot : this.stick;
                    this.collisions[i].cleanUp = true;
                }
            } else if (this.collisions[i].type === 3 || this.collisions[i].type === 4) {
                // Agent
                //console.log('Watch it ' + this.collisions[i].name);
            } else if (this.collisions[i].type === 0) {
                // Wall
                this.position = this.oldPos.clone();
                this.position.vx = 0;
                this.position.vy = 0;
            }
        }

        // Handle boundary conditions.. bounce Agent
        var top = this.world.height - (this.world.height - this.radius),
            bottom = this.world.height - this.radius,
            left = this.world.width - (this.world.width - this.radius),
            right = this.world.width - this.radius;
        if (this.position.x < left) {
            this.position.x = left;
            this.position.vx = 0;
            this.position.vy = 0;
        }

        if (this.position.x > right) {
            this.position.x = right;
            this.position.vx = 0;
            this.position.vy = 0;
        }

        if (this.position.y < top) {
            this.position.y = top;
            this.position.vx = 0;
            this.position.vy = 0;
        }

        if (this.position.y > bottom) {
            this.position.y = bottom;
            this.position.vx = 0;
            this.position.vy = 0;
        }

        if (this.useSprite) {
            this.sprite.position.set(this.position.x, this.position.y);
        }

        return this;
    };

    /**
     * Reset or set up the Agent
     */
    AgentRLDQN.prototype.reset = function () {
        var _this = this;

        // If it's a worker then we have to load it a bit different
        if (!this.worker) {
            this.brain = new DQNAgent(this.env, this.brainOpts);

            return this;
        } else {
            this.post = function (cmd, input) {
                this.brain.postMessage({target: 'DQN', cmd: cmd, input: input});
            };

            var jEnv = Utility.stringify(this.env),
                jOpts = Utility.stringify(this.brainOpts);

            this.brain = new Worker('js/lib/external/rl.js');
            this.brain.onmessage = function (e) {
                var data = e.data;
                switch (data.cmd) {
                    case 'act':
                        if (data.msg === 'complete') {
                            _this.action = data.input;
                            _this.move();
                            _this.learn();
                        }
                        break;
                    case 'init':
                        if (data.msg === 'complete') {
                            //
                        }
                        break;
                    case 'learn':
                        if (data.msg === 'complete') {
                            _this.epsilon = parseFloat(data.input);
                        }
                        break;
                    case 'load':
                        if (data.msg === 'complete') {
                            //
                        }
                        break;
                    case 'save':
                        if (data.msg === 'complete') {
                            _this.brainState = JSON.stringify(data.input);
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
    };


    global.AgentRLDQN = AgentRLDQN;

}(this));
