(function (global) {
    "use strict";

    /**
     * Initialize the DQN Agent
     * @param position
     * @param grid
     * @param opts
     * @returns {AgentDQN}
     */
    var AgentRLTD = function (position, grid, opts) {
        Agent.call(this, position, grid, opts);

        this.carrot = +1;
        this.stick = -1;

        // The number of item types the Agent's eyes can see (wall, green, red thing proximity)
        this.numTypes = 3;

        // The number of Agent's eyes
        this.numEyes = 9;

        // The number of Agent's eyes, each one sees the number of knownTypes
        this.numStates = this.numEyes * this.numTypes;

        // Amount of temporal memory. 0 = agent lives in-the-moment :)
        this.temporalWindow = 1;

        // The Agent's eyes
        this.eyes = [];
        for (var k = 0; k < this.numEyes; k++) {
            this.eyes.push(new Eye((k - this.numTypes) * 0.25));
        }

        // The Agent's actions
        this.actions = [];
        this.actions.push([1, 1]);
        this.actions.push([0.8, 1]);
        this.actions.push([1, 0.8]);
        this.actions.push([0.5, 0]);
        this.actions.push([0, 0.5]);

        // The number of possible angles the Agent can turn
        this.numActions = this.actions.length;

        // Size of the network
        this.networkSize = this.numStates * this.temporalWindow + this.numActions * this.temporalWindow + this.numStates;

        var _this = this;

        var env = {};
        env.grid = grid;
        env.gH = grid.yCount;
        env.gW = grid.xCount;
        env.gS = grid.yCount * grid.xCount;

        env.reset = function () {
            // specify some rewards
            var Rarr = R.zeros(this.gS),
                T = R.zeros(this.gS);

            for (var i=0;i<this.gW;i++) {
                for (var j=0;j<this.gH;j++) {
                    Rarr[i] = this.grid.cells[i][j].heuristic;
                }
            }
            this.Rarr = Rarr;
            this.T = T;
        };

        env.reward = function (s, a, ns) {
            // reward of being in s, taking action a, and ending up in ns
            return this.Rarr[s];
        };

        env.nextStateDistribution = function (s, a) {
            var ns;
            // given (s,a) return distribution over s' (in sparse form)
            if (this.T[s] === 1) {
                // cliff! oh no!
                // var ns = 0; // reset to state zero (start)
            } else if (s === 55) {
                // agent wins! teleport to start
                ns = this.startState();
                while (this.T[ns] === 1) {
                    ns = this.randomState();
                }
            } else {
                // ordinary space
                var nx, ny,
                    x = this.stox(s),
                    y = this.stoy(s);
                if (a === 0) {
                    nx = x - 1;
                    ny = y;
                }
                if (a === 1) {
                    nx = x;
                    ny = y - 1;
                }
                if (a === 2) {
                    nx = x;
                    ny = y + 1;
                }
                if (a === 3) {
                    nx = x + 1;
                    ny = y;
                }

                ns = nx * this.gH + ny;
                if (this.T[ns] === 1) {
                    // actually never mind, this is a wall. reset the agent
                    ns = s;
                }
            }

            // gridworld is deterministic, so return only a single next state
            return ns;
        };

        env.sampleNextState = function (s, a) {
            var ns = this.nextStateDistribution(s, a);
            // observe the raw reward of being in s, taking a, and ending up in ns
            var r = this.Rarr[s];
            // every step takes a bit of negative reward
            r -= 0.01;
            var out = {'ns': ns, 'r': r};
            if (s === 55 && ns === 0) {
                // episode is over
                out.reset_episode = true;
            }

            return out;
        };

        env.getNumStates = function () {
            return _this.numStates;
        };
        env.getMaxNumActions = function () {
            return _this.numActions;
        };
        env.allowedActions = function (s) {
            var x = this.stox(s),
                y = this.stoy(s),
                as = [];
            if (x > 0) {
                as.push(0);
            }
            if (y > 0) {
                as.push(1);
            }
            if (y < 600 - 1) {
                as.push(2);
            }
            if (x < 600 - 1) {
                as.push(3);
            }
            return as;
        };
        env.stox = function (s) {
            return Math.floor(s / 600);
        };
        env.stoy = function (s) {
            return s % 600;
        };
        env.xytos = function (x, y) {
            return x * 600 + y;
        };
        env.randomState = function () {
            return Math.floor(Math.random() * _this.numStates);
        };
        env.startState = function () {
            return 0;
        };

        this.brainOpts = {
            update: 'qlearn', // 'qlearn' or 'sarsa'
            gamma: 0.9, // discount factor, [0, 1)
            epsilon: 0.2, // initial epsilon for epsilon-greedy policy, [0, 1)
            alpha: 0.1, // value function learning rate
            lambda: 0, // eligibility trace decay, [0,1). 0 = no eligibility traces
            replacing_traces: true, // use replacing or accumulating traces
            planN: 50, // number of planning steps per iteration. 0 = no planning
            smooth_policy_update: true, // non-standard, updates policy smoothly to follow max_a Q
            beta: 0.1 // learning rate for smooth policy update
        };

        this.brain = new RL.TDAgent(env, this.brainOpts);
        var state = env.startState();

        /**
         * Agent's chance to act on the world
         */
        this.act = function () {
            // Create input to brain
            var inputArray = new Array(this.numEyes * this.numTypes);
            for (var i = 0; i < this.numEyes; i++) {
                var eye = this.eyes[i];
                inputArray[i * this.numTypes + 0] = 1.0;
                inputArray[i * this.numTypes + 1] = 1.0;
                inputArray[i * this.numTypes + 2] = 1.0;
                if (eye.sensedType !== -1) {
                    // sensedType is 0 for wall, 1 for food and 2 for poison lets do
                    // a 1-of-k encoding into the input array normalize to [0,1]
                    inputArray[i * this.numTypes + eye.sensedType] = eye.sensedProximity / eye.maxRange;
                }
            }

            // Get action from brain
            this.previousActionIdx = this.actionIndex;
            this.actionIndex = this.brain.act(inputArray);

            // Demultiplex into behavior variables
            this.rot1 = this.actions[this.actionIndex][0] * 1;
            this.rot2 = this.actions[this.actionIndex][1] * 1;
        }

        /**
         * The agent learns
         * @returns {undefined}
         */
        this.learn = function () {
            // Compute the reward
            var proximityReward = 0.0;
            for (var ei = 0; ei < this.numEyes; ei++) {
                var eye = this.eyes[ei];
                // Agents don't like to see walls, especially up close
                proximityReward += eye.sensedType === 0 ? eye.sensedProximity / eye.maxRange : 1.0;
            }

            // Calculate the proximity reward
            proximityReward = proximityReward / this.numEyes;
            proximityReward = Math.min(1.0, proximityReward * 2);

            // Agents like to go straight forward
            var forwardReward = 0.0;
            if (this.actionIndex === 0 && proximityReward > 0.75) {
                forwardReward = 0.1 * proximityReward;
            }
            // Agents like to eat good things
            var digestionReward = this.digestionSignal;
            this.digestionSignal = 0.0;

            var reward = proximityReward + forwardReward + digestionReward;

            // pass to brain for learning
            this.brain.backward(reward);
        }

        /**
         * Agent's chance to move in the world
         * @param smallWorld
         */
        this.move = function (smallWorld) {
            // Steer the agent according to outputs of wheel velocities
            var v = new Vec(0, this.radius / 2.0);
            v = v.rotate(this.angle + Math.PI / 2);
            var w1pos = this.position.add(v), // Positions of wheel 1
                w2pos = this.position.sub(v); // Positions of wheel 2
            var vv = this.position.sub(w2pos);
            vv = vv.rotate(-this.rot1);
            var vv2 = this.position.sub(w1pos);
            vv2 = vv2.rotate(this.rot2);
            var newPos = w2pos.add(vv),
                newPos2 = w1pos.add(vv2);

            newPos.scale(0.5);
            newPos2.scale(0.5);

            this.position = newPos.add(newPos2);

            this.angle -= this.rot1;
            if (this.angle < 0) {
                this.angle += 2 * Math.PI;
            }

            this.angle += this.rot2;
            if (this.angle > 2 * Math.PI) {
                this.angle -= 2 * Math.PI;
            }

            if (this.collision) {
                // The agent is trying to move from pos to oPos so we need to check walls
                var result = Utility.collisionCheck(this.oldPos, this.position, smallWorld.walls);
                if (result) {
                    // The agent derped! Wall collision! Reset their position
                    this.position = this.oldPos.clone();
                }
            }

            this.position.round();
            this.position.advance();

            this.sprite.rotation = -this.angle;
            this.direction = Utility.getDirection(this.angle);

            // Handle boundary conditions.. bounce agent
            Utility.boundaryCheck(this, smallWorld.width, smallWorld.height);
        };

        return _this;
    };

    global.AgentRLTD = AgentRLTD;

}(this));

