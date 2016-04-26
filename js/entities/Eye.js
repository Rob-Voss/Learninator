(function (global) {
    "use strict";

    class Eye {

        /**
         * @name Eye
         * @constructor
         *
         * Eye sensor has a maximum range and senses entities and walls
         * @param {number} angle
         * @param {Agent} agent
         * @returns {Eye}
         */
        constructor(angle, agent) {//position = new Vec(0, 0), range = 85, proximity = 85) {
            this.angle = angle;
            this.position = agent.position;
            this.proximity = agent.proximity;
            this.range = agent.range;
            this.shape = new PIXI.Graphics();
            this.v1 = new Vec(
                agent.position.x + agent.radius * Math.sin(agent.position.angle + angle),
                agent.position.y + agent.radius * Math.cos(agent.position.angle + angle)
            );
            this.v2 = new Vec(
                this.v1.x + agent.range * Math.sin(agent.position.angle + angle),
                this.v1.y + agent.range * Math.cos(agent.position.angle + angle)
            );
            this.sensed = {
                type: -1,
                position: this.v2,
                proximity: this.proximity,
                velocity: new Vec(0, 0)
            };
            this.collisions = [];

            return this;
        }

        /**
         * Draw the lines for the eyes
         */
        draw(agent) {
            let eyeStartX = agent.position.x + agent.radius * Math.sin(agent.position.angle + this.angle),
                eyeStartY = agent.position.y + agent.radius * Math.cos(agent.position.angle + this.angle),
                eyeEndX = eyeStartX + this.sensed.proximity * Math.sin(agent.position.angle + this.angle),
                eyeEndY = eyeStartY + this.sensed.proximity * Math.cos(agent.position.angle + this.angle);

            this.v1 = new Vec(eyeStartX, eyeStartY);
            this.v2 = new Vec(eyeEndX, eyeEndY);
            this.shape.clear();
            this.shape.moveTo(eyeStartX, eyeStartY);
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
            this.shape.lineTo(eyeEndX, eyeEndY);
            this.shape.endFill();
        }

        /**
         * Sense the surroundings
         * @param {Agent} agent
         */
        sense(agent) {
            let eyeStartX = agent.position.x + agent.radius * Math.sin(agent.position.angle + this.angle),
                eyeStartY = agent.position.y + agent.radius * Math.cos(agent.position.angle + this.angle),
                eyeEndX = eyeStartX + this.range * Math.sin(agent.position.angle + this.angle),
                eyeEndY = eyeStartY + this.range * Math.cos(agent.position.angle + this.angle);
            this.v1 = new Vec(eyeStartX, eyeStartY);
            this.v2 = new Vec(eyeEndX, eyeEndY);

            // Reset our eye data
            this.sensed = {
                type: -1,
                position: this.v2,
                proximity: this.range,
                velocity: new Vec(0, 0)
            };

            if (this.collisions.length > 1) {
                let closeObj;
                for (let i = 0; i < this.collisions.length; i++) {
                    if (closeObj === undefined) {
                        closeObj = this.collisions[i];
                    }
                    closeObj = (this.collisions[i].distance <= closeObj.distance) ? this.collisions[i] : closeObj;
                }
                this.collisions = [closeObj];
            }

            for (let i = 0; i < this.collisions.length; i++) {
                let closeObj = this.collisions[i];
                if (closeObj !== undefined && closeObj.id !== agent.id) {
                    if (closeObj.distance <= this.range) {
                        this.sensed.type = closeObj.entity.type;
                        this.sensed.proximity = closeObj.distance;
                        this.sensed.position = closeObj.vecI;
                        if ('vx' in closeObj.vecI) {
                            this.sensed.velocity.x = closeObj.vecI.vx;
                            this.sensed.velocity.y = closeObj.vecI.vy;
                        } else {
                            this.sensed.velocity = new Vec(0, 0);
                        }
                    }
                }
            }

        }
    }
    global.Eye = Eye;

}(this));