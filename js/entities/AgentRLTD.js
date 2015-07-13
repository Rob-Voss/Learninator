(function (global) {
    "use strict";

    // Gridworld
    var Gridworld = function () {
        this.Rarr = null; // reward array
        this.T = null; // cell types, 0 = normal, 1 = cliff
        this.reset();
    };

    Gridworld.prototype = {
        reset: function () {

            // hardcoding one gridworld for now
            this.gh = 10;
            this.gw = 10;
            this.gs = this.gh * this.gw; // number of states

            // specify some rewards
            var Rarr = R.zeros(this.gs);
            var T = R.zeros(this.gs);
            Rarr[55] = 1;

            Rarr[54] = -1;
            //Rarr[63] = -1;
            Rarr[64] = -1;
            Rarr[65] = -1;
            Rarr[85] = -1;
            Rarr[86] = -1;

            Rarr[37] = -1;
            Rarr[33] = -1;
            //Rarr[77] = -1;
            Rarr[67] = -1;
            Rarr[57] = -1;

            // make some cliffs
            for (q = 0; q < 8; q++) {
                var off = (q + 1) * this.gh + 2;
                T[off] = 1;
                Rarr[off] = 0;
            }
            for (q = 0; q < 6; q++) {
                var off = 4 * this.gh + q + 2;
                T[off] = 1;
                Rarr[off] = 0;
            }
            T[5 * this.gh + 2] = 0;
            Rarr[5 * this.gh + 2] = 0; // make a hole
            this.Rarr = Rarr;
            this.T = T;
        },
        reward: function (s, a, ns) {
            // reward of being in s, taking action a, and ending up in ns
            return this.Rarr[s];
        },
        nextStateDistribution: function (s, a) {
            // given (s,a) return distribution over s' (in sparse form)
            if (this.T[s] === 1) {
                // cliff! oh no!
                // var ns = 0; // reset to state zero (start)
            } else if (s === 55) {
                // agent wins! teleport to start
                var ns = this.startState();
                while (this.T[ns] === 1) {
                    var ns = this.randomState();
                }
            } else {
                // ordinary space
                var nx, ny;
                var x = this.stox(s);
                var y = this.stoy(s);
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
                var ns = nx * this.gh + ny;
                if (this.T[ns] === 1) {
                    // actually never mind, this is a wall. reset the agent
                    var ns = s;
                }
            }
            // gridworld is deterministic, so return only a single next state
            return ns;
        },
        sampleNextState: function (s, a) {
            // gridworld is deterministic, so this is easy
            var ns = this.nextStateDistribution(s, a);
            var r = this.Rarr[s]; // observe the raw reward of being in s, taking a, and ending up in ns
            r -= 0.01; // every step takes a bit of negative reward
            var out = {'ns': ns, 'r': r};
            if (s === 55 && ns === 0) {
                // episode is over
                out.reset_episode = true;
            }
            return out;
        },
        allowedActions: function (s) {
            var x = this.stox(s);
            var y = this.stoy(s);
            var as = [];
            if (x > 0) {
                as.push(0);
            }
            if (y > 0) {
                as.push(1);
            }
            if (y < this.gh - 1) {
                as.push(2);
            }
            if (x < this.gw - 1) {
                as.push(3);
            }
            return as;
        },
        randomState: function () {
            return Math.floor(Math.random() * this.gs);
        },
        startState: function () {
            return 0;
        },
        getNumStates: function () {
            return this.gs;
        },
        getMaxNumActions: function () {
            return 4;
        },

        // private functions
        stox: function (s) {
            return Math.floor(s / this.gh);
        },
        stoy: function (s) {
            return s % this.gh;
        },
        xytos: function (x, y) {
            return x * this.gh + y;
        }
    };

    class AgentRLTD extends Agent {

        /**
         * Initialize the DQN Agent
         * @param position
         * @param grid
         * @param options
         * @returns {AgentDQN}
         */
        constructor(position, grid, options) {
            super(position, grid, options);

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
            env.getNumStates = function () {
                return _this.numStates;
            };
            env.getMaxNumActions = function () {
                return _this.numActions;
            };
            env.allowedActions = function (s) {
                var x = this.stox(s), y = this.stoy(s), as = [];
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
                return Math.floor(Math.random() * this.numStates);
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

            return _this;
        }

        /**
         * Agent's chance to act on the world
         */
        act() {
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
        learn() {
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
        move(smallWorld) {
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

            //this.position.round();
            //this.position.advance();

            this.sprite.rotation = -this.angle;
            this.direction = Utility.getDirection(this.angle);

            // Handle boundary conditions.. bounce agent
            Utility.boundaryCheck(this, smallWorld.width, smallWorld.height);
        }

    }

    global.AgentRLTD = AgentRLTD;

}(this));

