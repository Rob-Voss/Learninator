(function (global) {
    "use strict";

    class Eye {
        /**
         * Eye sensor has a maximum range and senses entities and walls
         * @param angle
         * @param range
         * @returns {Eye}
         * @name Eye
         * @constructor
         */
        constructor(angle, position = new Vec(0, 0), range = 85) {
            this.angle = angle;
            this.maxRange = range;
            this.position = position;
            this.minPos = new Vec(this.position.x * Math.sin(this.angle), this.position.y * Math.cos(this.angle));
            this.maxPos = new Vec(this.position.x + this.maxRange * Math.sin(this.angle), this.position.y + this.maxRange * Math.cos(this.angle));
            this.collisions = [];
            this.sensed = {
                type: -1,
                proximity: this.maxRange,
                position: this.maxPos,
                velocity: new Vec(0, 0)
            };

            // PIXI graphics
            this.shape = new PIXI.Graphics();

            return this;
        }

        /**
         * Draw the lines for the eyes
         * @param agent
         */
        draw() {
            this.shape.clear();
            switch (this.sensed.type) {
                case 1:
                    // It is noms
                    this.shape.lineStyle(0.5, 0xFF0000, 1);
                    break;
                case 2:
                    // It is gnar gnar
                    this.shape.lineStyle(0.5, 0x00FF00, 1);
                    break;
                case 3:
                case 4:
                case 5:
                    // Is it another Agent
                    this.shape.lineStyle(0.5, 0x0000FF, 1);
                    break;
                default:
                    // Is it wall or nothing?
                    this.shape.lineStyle(0.5, 0x000000, 1);
                    break;
            }

            // Draw the agent's line of sights
            this.shape.moveTo(this.position.x, this.position.y);
            this.shape.lineTo(this.sensed.position.x, this.sensed.position.y);
            this.shape.endFill();
        }

        /**
         * Sense the surroundings
         * @param agent
         */
        sense(agent) {
            let eyeStartX = agent.position.x + agent.radius * Math.sin(agent.angle + this.angle),
                eyeStartY = agent.position.y + agent.radius * Math.cos(agent.angle + this.angle),
                eyeEndX = agent.position.x + this.maxRange * Math.sin(agent.angle + this.angle),
                eyeEndY = agent.position.y + this.maxRange * Math.cos(agent.angle + this.angle);
            this.position = new Vec(eyeStartX, eyeStartY);
            this.minPos = new Vec(eyeStartX, eyeStartY);
            this.maxPos = new Vec(eyeEndX, eyeEndY);

            // Reset our eye data
            this.sensed = {
                type: -1,
                proximity: this.maxRange,
                position: this.maxPos,
                velocity: new Vec(0, 0)
            };

            for (let i = 0; i < this.collisions.length; i++) {
                let collisionObj = this.collisions[i],
                    distance = collisionObj.distance;
                if (distance <= this.maxRange && collisionObj.id !== agent.id) {
                    this.sensed.type = collisionObj.type;
                    this.sensed.proximity = collisionObj.distance;
                    this.sensed.position.x = collisionObj.vecI.x;
                    this.sensed.position.y = collisionObj.vecI.y;
                    if ('vx' in collisionObj.vecI) {
                        this.sensed.velocity.x = collisionObj.vecI.vx;
                        this.sensed.velocity.y = collisionObj.vecI.vy;
                    } else {
                        this.sensed.velocity = new Vec(0, 0);
                    }
                    break;
                }
            }
        }
    }
    global.Eye = Eye;

}(this));