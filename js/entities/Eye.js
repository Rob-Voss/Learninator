(function (global) {
    "use strict";

    class Eye {
        /**
         * Eye sensor has a maximum range and senses entities and walls
         * @param angle
         * @param range
         * @param proximity
         * @returns {Eye}
         * @name Eye
         * @constructor
         */
        constructor(angle, position = new Vec(0, 0), range = 85, proximity = 85) {
            this.angle = angle;
            this.maxRange = range;
            this.position = position;
            this.maxPos = position;
            this.radius = range;
            this.sensedProximity = proximity;
            this.sensedType = -1;
            this.collisions = [];
            this.vx = 0;
            this.vy = 0;

            // PIXI graphics
            this.shape = new PIXI.Graphics();

            return this;
        }

        /**
         * Draw the lines for the eyes
         * @param agent
         */
        draw(agent) {
            this.position = agent.position.clone();
            this.shape.clear();

            switch (this.sensedType) {
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
                case -1:
                case 0:
                    // Is it wall or nothing?
                    this.shape.lineStyle(0.5, 0x000000, 1);
                    break;
            }

            let aEyeX = this.position.x + this.sensedProximity * Math.sin(agent.angle + this.angle),
                aEyeY = this.position.y + this.sensedProximity * Math.cos(agent.angle + this.angle),
                eyeV = new Vec(aEyeX, aEyeY);
            this.maxPos = eyeV;

            // Draw the agent's line of sights
            this.shape.moveTo(this.position.x, this.position.y);
            this.shape.lineTo(aEyeX, aEyeY);
        }

        /**
         * Sense the surroundings
         * @param agent
         */
        sense(agent, world) {
            this.position = agent.position.clone();
            let result,
                aEyeX = this.position.x + this.maxRange * Math.sin(agent.angle + this.angle),
                aEyeY = this.position.y + this.maxRange * Math.cos(agent.angle + this.angle),
                eyeV = new Vec(aEyeX, aEyeY);
            this.maxPos = eyeV;

            result = world.sightCheck(this.position, this.maxPos, world.walls, world.population, agent.radius);
            if (result && result.target.id !== agent.id && result.distance <= this.maxRange) {
                // eye collided with an entity
                this.sensedProximity = result.vecI.distanceTo(this.position);
                this.sensedType = result.target.type;
                if ('vx' in result.vecI) {
                    this.x = result.vecI.x;
                    this.y = result.vecI.y;
                    this.vx = result.vecI.vx;
                    this.vy = result.vecI.vy;
                } else {
                    this.x = 0;
                    this.y = 0;
                    this.vx = 0;
                    this.vy = 0;
                }
            } else {
                this.sensedProximity = this.maxRange;
                this.sensedType = -1;
                this.x = 0;
                this.y = 0;
                this.vx = 0;
                this.vy = 0;
            }
        }
    }

    global.Eye = Eye;

}(this));