var EntityRLDQN = EntityRLDQN || {};

(function (global) {
    "use strict";

    class EntityRLDQN extends Agent {
        /**
         * Initialize the EntityRLDQN
         * @name EntityRLDQN
         * @extends Entity
         * @constructor
         *
         * @param {Vec} position - The x, y location
         * @param {agentOpts} opts - The Entity options
         * @returns {EntityRLDQN}
         */
        constructor(position, opts) {
            super(position, opts);

            this.name = 'Entity RLDQN';
            this.state = null;
            this.stepsPerTick = 1;
            this.BADRAD = 25;
            this.type = 5;

            // The Entity Agent's eyes
            this.eyes = [];
            for (let k = 0; k < this.numEyes; k++) {
                this.eyes.push(new Eye(k * Math.PI / 3, this));
            }

            return this;
        }

        /**
         * Get the current state
         * @returns {EntityRLDQN}
         */
        getState() {
            this.state = [
                this.enemy.position.x / 1000,
                this.enemy.position.y / 1000,
                this.enemy.position.vx * 10,
                this.enemy.position.vy * 10,
                (this.target.position.x / 1000) - (this.position.x / 1000),
                (this.target.position.y / 1000) - (this.position.y / 1000),
                (this.enemy.position.x / 1000) - (this.position.x / 1000),
                (this.enemy.position.y / 1000) - (this.position.y / 1000)
            ];

            return this;
        }

        /**
         * Sample the next state
         */
        sampleNextState() {
            this.speed = 0.50;

            // Execute agent's desired action
            switch (this.action) {
                case 0: // Right
                    this.position.vx -= this.speed;
                    break;
                case 1: // Left
                    this.position.vx += this.speed;
                    break;
                case 2: // Up
                    this.position.vy -= this.speed;
                    break;
                case 3: // Down
                    this.position.vy += this.speed;
                    break;
                case 4: // Hover
                    this.position.vx = 0;
                    this.position.vy = 0;
                    break;
            }

            // Forward the agent by velocity
            this.position.vx *= 0.95;
            this.position.vy *= 0.95;

            // Forward the agent by velocity
            this.position.advance(this.speed);
            this.direction = Utility.getDirection(this.position.direction);

            // Compute distances
            let dx1 = (this.position.x / 1000) - (this.target.position.x / 1000), // Distance from Noms
                dy1 = (this.position.y / 1000) - (this.target.position.y / 1000), // Distance from Noms
                dx2 = (this.position.x / 1000) - (this.enemy.position.x / 1000), // Distance from Agent
                dy2 = (this.position.y / 1000) - (this.enemy.position.y / 1000), // Distance from Agent
                d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1),
                d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2),
            // Compute reward we want to go close to Agent we like
                r = -d1,
                eRng = this.enemy.range / 1000;

            if (d2 < eRng) {
                // but if we're too close to the bad Agent that's bad
                r += 2 * (d2 - eRng) / eRng;
            }

            // Give bonus for gliding with no force
            //if (this.action === 4) {
            //    r += 0.05;
            //}

            let vv = r + 0.5,
                ms = 255.0,
                red, green, blue;
            if (vv > 0) {
                red = 255 - vv * ms;
                blue = 255 - vv * ms;
                this.color = parseInt(Utility.rgbToHex(red, 255, blue));
            } else {
                green = 255 + vv * ms;
                blue = 255 + vv * ms;
                this.color = parseInt(Utility.rgbToHex(255, green, blue));
            }
            this.lastReward = r;

            return this;
        }

        /**
         * Agent's chance to act on the world
         */
        tick() {
            for (let k = 0; k < this.stepsPerTick; k++) {
                this.getState();
                this.action = this.brain.act(this.state);
                this.sampleNextState();

                this.brain.learn(this.lastReward);
                this.epsilon = this.brain.epsilon;
            }

            return this;
        }
    }
    global.EntityRLDQN = EntityRLDQN;

}(this));

