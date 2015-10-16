(function (global) {
    "use strict";

    /**
     * Eye sensor has a maximum range and senses walls
     * @param angle
     * @param range
     * @param proximity
     * @returns {Eye}
     * @constructor
     */
    var Eye = function (angle, position, range, proximity) {
        this.angle = angle;
        this.maxRange = range || 85;
        this.sensedProximity = proximity || 85;
        this.position = position || new Vec(0, 0);
        this.maxPos = new Vec(0, 0);
        this.sensedType = -1;
        this.collisions = [];

        // PIXI graphics
        this.shape = new PIXI.Graphics();

        return this;
    };

    /**
     * Draw the lines for the eyes
     * @param agent
     */
    Eye.prototype.draw = function (agent) {
        this.position = agent.position.clone();
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
        case 4:
            // Is it another Agent
            this.shape.lineStyle(0.5, 0xFAFAFA);
            break;
        default:
            this.shape.lineStyle(0.5, 0x000000);
            break;
        }

        var aEyeX = this.position.x + this.sensedProximity * Math.sin(agent.angle + this.angle),
            aEyeY = this.position.y + this.sensedProximity * Math.cos(agent.angle + this.angle);
        this.maxPos.set(aEyeX, aEyeY);

        // Draw the agent's line of sights
        this.shape.moveTo(this.position.x, this.position.y);
        this.shape.lineTo(aEyeX, aEyeY);
    };

    /**
     * Sense the surroundings
     * @param agent
     */
    Eye.prototype.sense = function (agent) {
        this.position = agent.position.clone();
        var aEyeX = this.position.x + this.maxRange * Math.sin(agent.angle + this.angle),
            aEyeY = this.position.y + this.maxRange * Math.cos(agent.angle + this.angle),
            result;
        this.maxPos.set(aEyeX, aEyeY);
        var tmpEnts = agent.world.agents.concat(agent.world.entities);
        result = Utility.collisionCheck(this.position, this.maxPos, agent.world.walls, tmpEnts);
        if (result) {
            // eye collided with an entity
            this.sensedProximity = result.vecI.distFrom(this.position);
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
    };

    global.Eye = Eye;

}(this));

