(function (global) {
    "use strict";

    class AgentTD extends Agent {
        /**
         * Initialize the Agent
         * @param interactive
         * @param display
         * @returns {AgentDQN}
         */
        constructor(interactive, display) {
            super('TD', interactive, display);
            var _this = this;

            this.carrot = +5;
            this.stick = -6;

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
                for (var nt = 0; nt < this.numTypes; nt++) {
                    inputArray[i * this.numTypes + nt] = 1.0;
                    if (eye.sensedType !== -1) {
                        // sensedType is 0 for wall, 1 for food and 2 for poison lets do
                        // a 1-of-k encoding into the input array normalize to [0,1]
                        inputArray[i * this.numTypes + eye.sensedType] = eye.sensedProximity / eye.maxRange;
                    }
                }
            }

            // Get action from brain
            this.previousActionIdx = this.actionIndex;
            this.actionIndex = this.brain.forward(inputArray);

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
                // Agents dont like to see walls, especially up close
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

            this.sprite.rotation = -this.angle;
            this.direction = Utility.getDirection(this.angle);
        }

    }

    global.AgentTD = AgentTD;

}(this));

