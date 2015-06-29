(function (global) {
    "use strict";

    class AgentDQN extends Agent {
        /**
         * Initialize the DQN Agent
         * @param interactive
         * @param display
         * @returns {AgentDQN}
         */
        constructor(interactive, display) {
            super('DQN', interactive, display);

            this.stick = +1;
            this.carrot = -1;

            return this;
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
            var reward = this.digestionSignal;
            this.lastReward = reward; // for vis
            this.brain.learn(reward);
        }

        /**
         * Agent's chance to move in the world
         * @param smallWorld
         */
        move(smallWorld) {
            // execute agent's desired action
            var speed = 1;
            if (this.action === 0) {
                this.position.vx += -speed;
            }
            if (this.action === 1) {
                this.position.vx += speed;
            }
            if (this.action === 2) {
                this.position.vy += -speed;
            }
            if (this.action === 3) {
                this.position.vy += speed;
            }

            // forward the agent by velocity
            this.position.vx *= 0.95;
            this.position.vy *= 0.95;

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

            this.position.advance();
            this.position.round();
        }

    }

    global.AgentDQN = AgentDQN;

}(this));

