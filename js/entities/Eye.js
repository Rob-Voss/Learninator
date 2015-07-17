(function (global) {
    "use strict";

    /**
     * Eye sensor has a maximum range and senses walls
     * @param {Number} angle
     * @returns {Eye}
     */
    var Eye = function (angle) {
        this.angle = angle;
        this.maxRange = 120;
        this.sensedProximity = 120;
        this.sensedType = -1;

        // PIXI graphics
        this.shape = new PIXI.Graphics();

        /**
         * Draw the lines for the eyes
         * @param agent
         */
        this.draw = function (agent) {
            this.shape.clear();
            switch (this.sensedType) {
            case -1:
            case 0:
                // Is it wall or nothing?
                this.shape.lineStyle(0.5, 0x000000);
                break;
            case 1:
                // It is noms
                this.shape.lineStyle(0.5, 0xFF0000);
                break;
            case 2:
                // It is gnar gnar
                this.shape.lineStyle(0.5, 0x00FF00);
                break;
            case 3:
                // Is it another Agent
                this.shape.lineStyle(0.5, 0xFAFAFA);
                break;
            }

            var aEyeX = agent.position.x + this.sensedProximity * Math.sin(agent.angle + this.angle),
                aEyeY = agent.position.y + this.sensedProximity * Math.cos(agent.angle + this.angle);

            // Draw the agent's line of sights
            this.shape.moveTo(agent.position.x, agent.position.y);
            this.shape.lineTo(aEyeX, aEyeY);
        };

        /**
         * Sense the surroundings
         * @param agentPos
         * @param agentAngle
         * @param walls
         * @param entities
         */
        this.sense = function (agentPos, agentAngle, walls, entities) {
            this.shape.clear();
            var X = agentPos.x + this.maxRange * Math.sin(agentAngle + this.angle),
                Y = agentPos.y + this.maxRange * Math.cos(agentAngle + this.angle),
                result = Utility.collisionCheck(agentPos, new Vec(X, Y), walls, entities);
            if (result) {
                // eye collided with an entity
                this.sensedProximity = result.vecI.distanceTo(agentPos);
                this.sensedType = result.type;
                if ('vx' in result) {
                    this.vx = result.position.vx;
                    this.vy = result.position.vy;
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
        };

        return this;
    };

    global.Eye = Eye;

}(this));

