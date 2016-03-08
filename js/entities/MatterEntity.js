(function (global) {
    "use strict";

    /**
     * Options for the cheats to display
     * @typedef {Object} cheatOpts
     * @property {boolean} position - Show Vec x, y
     * @property {boolean} name - Show the name
     * @property {boolean} id - Show the ID
     * @property {boolean} gridLocation - Show the gridLocation x, y
     */

    /**
     * Options for the Entity
     * @typedef {Object} entityOpts
     * @property {number} radius - The radius of the Entity
     * @property {number} width - The width of the Entity
     * @property {number} height - The height of the Entity
     * @property {boolean} interactive - Is it interactive
     * @property {boolean} collision - Does it collide with stuff
     * @property {boolean} movingEntities - Does it move
     * @property {boolean} useSprite - Should it use a sprite
     * @property {cheatOpts} cheats - The cheats to display
     */

    class MatterEntity {
        /**
         * Initialize the Entity
         * @name Entity
         * @constructor
         *
         * @param {number|string} type - A type id (wall,nom,gnar,agent)
         * @param {Matter.Body} body - The Matter.js body
         * @returns {Entity}
         */
        constructor(type, body) {
            this.entityTypes = ['Wall', 'Nom', 'Gnar', 'Agent', 'Agent Worker', 'Entity Agent'];
            this.styles = ['black', 'red', 'green', 'blue', 'navy', 'magenta', 'cyan', 'purple', 'aqua', 'olive', 'lime'];
            this.hexStyles = [0x000000, 0xFF0000, 0x00FF00, 0x0000FF, 0x000080, 0xFF00FF, 0x00FFFF, 0x800080, 0x00FFFF, 0x808000, 0x00FF00];

            let typeOf = typeof type;
            if (typeOf === 'string') {
                this.type = this.entityTypes.indexOf(type);
                this.typeName = type;
                this.color = this.hexStyles[this.type];
                this.name = (this.name === undefined) ? type : this.name;
            } else if (typeOf === 'number') {
                this.type = type || 1;
                this.typeName = this.entityTypes[this.type];
                this.color = this.hexStyles[this.type];
                this.name = (this.name === undefined) ? this.entityTypes[this.type] : this.name;
            }

            this.id = Utility.guid();
            this.age = 0;
            this.body = body;
            this.collisions = [];

            return this;
        }

        /**
         * Draws it
         * @returns {Entity}
         */
        draw() {
            return this;
        }

        /**
         * Move around
         * @returns {Entity}
         */
        move() {
            this.oldAngle = this.body.angle;
            this.oldPos = this.body.position;
            Matter.Body.applyForce(this.body, this.body.velocity);
            return this;
        }

        /**
         * Do work son
         * @param {Object} world
         * @returns {Entity}
         */
        tick() {
            this.age += 1;
            this.move();

            return this;
        }
    }

    global.MatterEntity = MatterEntity;

}(this));
