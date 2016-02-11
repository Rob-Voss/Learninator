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
        this.pos = position;
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
        this.pos = agent.pos.clone();
        this.shape.clear();

        switch (this.sensedType) {
            case 1:
                // It is noms
                this.shape.lineStyle(0.5, 0xFF0000);
                break;
            case 2:
                // It is gnar gnar
                this.shape.lineStyle(0.5, 0x00FF00);
                break;
            default:
                // Is it wall or nothing?
                this.shape.lineStyle(0.5, 0x000000);
                break;
        }

        let aEyeX = this.pos.x + this.sensedProximity * Math.sin(agent.angle + this.angle),
            aEyeY = this.pos.y + this.sensedProximity * Math.cos(agent.angle + this.angle);

        this.maxPos = new Vec(aEyeX, aEyeY);

        // Draw the agent's line of sights
        this.shape.moveTo(this.pos.x, this.pos.y);
        this.shape.lineTo(this.maxPos.x, this.maxPos.y);
    }

    /**
     * Sense the surroundings
     * @param agent
     */
    sense(agent, world) {
        this.pos = agent.pos.clone();
        let aEyeX = this.pos.x + this.maxRange * Math.sin(agent.angle + this.angle),
            aEyeY = this.pos.y + this.maxRange * Math.cos(agent.angle + this.angle);

        this.maxPos = new Vec(aEyeX, aEyeY);

        let result = world.sightCheck(this.pos, this.maxPos, this.maxRange);
        if (result) {
            // eye collided with an entity
            let distance = result.vecI.distanceTo(this.pos);
            if (distance <= this.maxRange) {
                // eye collided with an entity
                this.sensedProximity = result.vecI.distanceTo(this.pos);
                this.sensedType = result.target.type;
                if ('vx' in result.vecI) {
                    this.vx = ('vx' in result.vecI) ? result.vecI.vx : 0;
                    this.vy = ('vy' in result.vecI) ? result.vecI.vy : 0;
                }

                return result;
            }
        }
        this.sensedProximity = this.maxRange;
        this.sensedType = -1;
        this.vx = 0;
        this.vy = 0;

        return;
    }
}

global.Eye = Eye;

}(this));