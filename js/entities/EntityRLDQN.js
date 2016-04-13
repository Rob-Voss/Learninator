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
            let self = this;

            this.name = 'Entity RLDQN';
            this.action = null;
            this.state = null;
            this.stepsPerTick = 1;
            this.BADRAD = 25;
            this.type = 5;
            this.stepsPerTick = 1;

            // Reward or punishment
            this.carrot = +1;
            this.stick = -1;
            this.lastReward = 0;
            this.pts = [];

            // The Agent's actions
            this.actions = [];
            this.actions.push(0);
            this.actions.push(1);
            this.actions.push(2);
            this.actions.push(3);
            this.actions.push(4);

            // The number of possible angles the Agent can turn
            this.numActions = this.actions.length;

            // The number of Agent's eyes, each one sees the number of knownTypes + stuff
            this.numStates = this.numEyes * this.numTypes + 6;

            // The Agent's eyes
            this.eyes = [];
            for (let k = 0; k < this.numEyes; k++) {
                this.eyes.push(new Eye(k * Math.PI / 3, this.position, 75, 75));
            }

            this.brain = new RL.DQNAgent(this, this.brainOpts);

            return this;
        }

        /**
         * Agent's chance to act on the world
         */
        act() {
            // in forward pass the agent simply behaves in the environment
            let ne = this.numEyes * this.numTypes,
                inputArray = new Array(this.numStates);
            for (let i = 0; i < this.numEyes; i++) {
                let eye = this.eyes[i];
                inputArray[i * this.numTypes] = 1.0; // Wall?
                inputArray[i * this.numTypes + 1] = 1.0; // Nom?
                inputArray[i * this.numTypes + 2] = 1.0; // Gnar?
                inputArray[i * this.numTypes + 3] = eye.vx; // Agent?
                inputArray[i * this.numTypes + 4] = eye.vy; // Agent?
                if (eye.sensedType !== -1) {
                    // sensedType is 0 wall, 1 food, 2 poison, 3->5 Agent.
                    // lets do a 1-of-k encoding into the input array
                    inputArray[i * this.numTypes + eye.sensedType] = eye.sensedProximity / eye.maxRange; // normalize to [0,1]
                }
            }

            // proprioception and orientation
            inputArray[ne + 0] = this.position.vx;
            inputArray[ne + 1] = this.position.vy;

            this.state = inputArray;

            return this;
        }

        /**
         * Return the number of states
         * @returns {number}
         */
        getNumStates() {
            return 8; //this.numStates; // x,y,vx,vy, puck dx,dy
        }

        /**
         * Return the number of actions
         * @returns {number}
         */
        getMaxNumActions() {
            return this.actions.length; // left, right, up, down, nothing
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
        sampleNextState(world) {
            let speed = 0.50;

            // Execute agent's desired action
            switch (this.action) {
                case 0: // Right
                    this.position.vx -= speed;
                    break;
                case 1: // Left
                    this.position.vx += speed;
                    break;
                case 2: // Up
                    this.position.vy -= speed;
                    break;
                case 3: // Down
                    this.position.vy += speed;
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
            this.position.advance();

            if (world.check(this)) {
                for (let i = 0; i < this.collisions.length; i++) {
                    let collObj = this.collisions[i];
                    if (collObj.type === 0) {
                        // Wall
                        this.position = this.oldPos.clone();
                        this.position.vx = 0;
                        this.position.vy = 0;
                    } else if (collObj.type >= 1 && collObj.type <= 4) {
                        this.position.vx = collObj.target.vx;
                        this.position.vy = collObj.target.vy;
                        if (world.population.has(collObj.id)){
                            let entity = world.population.get(collObj.id);
                            entity.position.vy = collObj.entity.vy;
                            entity.position.vy = collObj.entity.vy;
                        }
                    }
                }
            }

            // Handle boundary conditions.. bounce Agent
            let top = world.height - (world.height - this.radius),
                bottom = world.height - this.radius,
                left = world.width - (world.width - this.radius),
                right = world.width - this.radius;
            if (this.position.x < left) {
                this.position.x = left;
                this.position.vx *= -1;
            }

            if (this.position.x > right) {
                this.position.x = right;
                this.position.vx *= -1;
            }

            if (this.position.y < top) {
                this.position.y = top;
                this.position.vy *= -1;
            }

            if (this.position.y > bottom) {
                this.position.y = bottom;
                this.position.vy *= -1;
            }

            if (this.useSprite) {
                this.sprite.position.set(this.position.x, this.position.y);
            }

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
         * @param {World} world
         */
        tick(world) {
            for (let k = 0; k < this.stepsPerTick; k++) {
                this.getState();
                this.action = this.brain.act(this.state);
                this.sampleNextState(world);

                // this.pts.push(this.lastReward);
                this.brain.learn(this.lastReward);
                this.epsilon = this.brain.epsilon;
            }

            return this;
        }
    }

    global.EntityRLDQN = EntityRLDQN;

}(this));

