(function (global) {
    "use strict";

    class AgentDQN extends Agent {
        /**
         * Initialize the DQN Agent
         * @param position
         * @param grid
         * @param options
         * @returns {AgentDQN}
         */
        constructor(position, grid, options) {
            super('DQN', position, grid, options);

            this.carrot = +1;
            this.stick = -1;

            var _this = this;

            return _this;
        }

        /**
         * Agent's chance to act on the world
         */
        act() {
            // in forward pass the agent simply behaves in the environment
            var ne = this.numEyes * this.numTypes;
            var inputArray = new Array(this.numStates);
            for (var i = 0; i < this.numEyes; i++) {
                var eye = this.eyes[i];
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

            this.action = this.brain.act(inputArray);
        }

        /**
         * Agent's chance to learn
         */
        learn() {
            this.lastReward = this.digestionSignal; // for vis
            this.brain.learn(this.digestionSignal);
        }

        /**
         * Agent's chance to move in the world
         * @param smallWorld
         */
        move(smallWorld) {
            // execute agent's desired action
            var speed = 1;
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

            // forward the agent by velocity
            this.position.vx *= 0.95;
            this.position.vy *= 0.95;

            this.position.advance();
            this.position.round();

            if (this.collision) {
                // The agent is trying to move from pos to oPos so we need to check walls
                var result = Utility.collisionCheck(this.oldPos, this.position, smallWorld.walls);
                if (result) {
                    // The agent derped! Wall collision! Reset their position
                    this.position = this.oldPos.clone();
                }
            }

            // Handle boundary conditions.. bounce agent
            Utility.boundaryCheck(this, smallWorld.width, smallWorld.height);
        }

    }

    global.AgentDQN = AgentDQN;

}(this));

