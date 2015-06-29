(function (global) {
    "use strict";

    /**
     * Eye sensor has a maximum range and senses walls
     * @param {Number} angle
     * @returns {Eye}
     */
    class Eye {
        constructor(angle) {
            this.angle = angle;
            this.maxRange = 85;
            this.sensedProximity = 85;
            this.sensedType = -1;
            this.numInputs = 5;

            // PIXI graphics
            this.shape = new PIXI.Graphics();
            this.shape.lineStyle(1, 0x000000);

            return this;
        }

        sense(agent, walls, entities) {
            this.shape.clear();
            if (agent.collision !== true) {
                walls = [];
            }

            var X = agent.position.x + this.maxRange * Math.sin(agent.angle + this.angle),
                Y = agent.position.y + this.maxRange * Math.cos(agent.angle + this.angle),
                result = Utility.collisionCheck(agent.position, new Vec(X, Y), walls, entities);

            if (result) {
                // eye collided with an entity
                this.sensedProximity = result.vecI.distanceTo(agent.position);
                this.sensedType = result.type;
                if ('vx' in result) {
                    this.vx = result.vx;
                    this.vy = result.vy;
                } else {
                    this.vx = 0;
                    this.vy = 0;
                }
            } else {
                this.sensedProximity = this.maxRange;
                this.sensedType = -1;
                this.vx = 0;
                this.vy = 0;
            }
        }

        draw(agent) {
            switch (this.sensedType) {
                // Is it wall or nothing?
                case -1:
                case 0:
                    this.shape.lineStyle(0.5, 0x000000);
                    break;
                // It is noms
                case 1:
                    this.shape.lineStyle(0.5, 0xFF0000);
                    break;
                // It is gnar gnar
                case 2:
                    this.shape.lineStyle(0.5, 0x00FF00);
                    break;
                // Is it another Agent
                case 3:
                    this.shape.lineStyle(0.5, 0xFAFAFA);
                    break;
            }

            var aEyeX = agent.oldPos.x + this.sensedProximity * Math.sin(agent.oldAngle + this.angle),
                aEyeY = agent.oldPos.y + this.sensedProximity * Math.cos(agent.oldAngle + this.angle);

            // Draw the agent's line of sights
            this.shape.moveTo(agent.oldPos.x, agent.oldPos.y);
            this.shape.lineTo(aEyeX, aEyeY);
        }
    }

    global.Eye = Eye;

}(this));

