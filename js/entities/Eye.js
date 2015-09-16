(function (global) {
    "use strict";

    /**
     * Eye sensor has a maximum range and senses walls
     * @param {Number} angle
     * @returns {Eye}
     */
    var Eye = function (angle, range, proximity) {
        this.angle = angle;
        this.maxRange = range || 85;
        this.sensedProximity = proximity || 85;
        this.sensedType = -1;

        // PIXI graphics
        this.shape = new PIXI.Graphics();

        return this;
    };

    /**
     * Draw the lines for the eyes
     * @param agentPos
     * @param agentAngle
     */
    Eye.prototype.draw = function (agentPos, agentAngle) {
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

        var aEyeX = agentPos.x + this.sensedProximity * Math.sin(agentAngle + this.angle),
            aEyeY = agentPos.y + this.sensedProximity * Math.cos(agentAngle + this.angle);

        // Draw the agent's line of sights
        this.shape.moveTo(agentPos.x, agentPos.y);
        this.shape.lineTo(aEyeX, aEyeY);
    };

    /**
     * Sense the surroundings
     * @param agentPos
     * @param agentAngle
     * @param walls
     * @param entities
     */
    Eye.prototype.sense = function (agentPos, agentAngle, walls, entities) {
        var X = agentPos.x + this.maxRange * Math.sin(agentAngle + this.angle),
            Y = agentPos.y + this.maxRange * Math.cos(agentAngle + this.angle),
            result = Utility.collisionCheck(agentPos, new Vec(X, Y), walls, entities);
        if (result) {
            // eye collided with an entity
            this.sensedProximity = result.vecI.distFrom(agentPos);
            this.sensedType = result.type;

            if ('vx' in result.vecI) {
                this.vx = result.vecI.vx;
                this.vy = result.vecI.vy;
                this.vz = result.vecI.vz;
            } else {
                this.vx = 0;
                this.vy = 0;
                this.vz = 0;
            }
        } else {
            this.sensedProximity = this.maxRange;
            this.sensedType = -1;
            this.vx = 0;
            this.vy = 0;
            this.vz = 0;
        }
    };

    global.Eye = Eye;

}(this));

