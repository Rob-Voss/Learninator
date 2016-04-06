(function (global) {
    "use strict";

    const entityTypes = ['Wall', 'Nom', 'Gnar', 'Agent', 'Agent Worker', 'Entity Agent'],
          styles = ['black', 'red', 'green', 'blue', 'navy', 'magenta', 'cyan', 'purple', 'aqua', 'olive', 'lime'],
          hexStyles = [0x000000, 0xFF0000, 0x00FF00, 0x0000FF, 0x000080, 0xFF00FF, 0x00FFFF, 0x800080, 0x00FFFF, 0x808000, 0x00FF00],
          rgbStyles = ['#000000', '#C44D58', '#C7F464', '#4ECDC4'];

    // Matter aliases
    var Body = Matter.Body,
        Common = Matter.Common;

    class PhysicalEntity {

        /**
         * Initialize the PhysicalEntity
         * @name PhysicalEntity
         * @constructor
         *
         * @param {number|string} type - A type id (wall,nom,gnar,agent)
         * @param {Matter.Body} body - The Matter.js body
         * @returns {PhysicalEntity}
         */
        constructor(type, body) {
            this.id = Utility.guid();
            this.type = (typeof type === 'string') ? entityTypes.indexOf(type) : type || 1;
            this.name = entityTypes[this.type];
            this.color = hexStyles[this.type];
            this.typeName = entityTypes[this.type];
            this.body = body;
            this.body.label = this.name;
            this.radius = (this.type === 2) ? 10 : this.body.circleRadius;
            this.age = 0;
            this.speed = 1;
            this.force = {
                x: Common.random(-this.speed, this.speed) * 0.0025,
                y: Common.random(-this.speed, this.speed) * 0.0025
            };

            return this;
        }

        /**
         *
         */
        move() {
            Body.applyForce(this.body, this.body.position, this.force);
        }

        /**
         * Do work son
         * @param {Matter.Engine} engine
         * @returns {PhysicalEntity}
         */
        tick(engine) {
            this.age += 1;
            this.move();

            return this;
        }
    }
    global.PhysicalEntity = PhysicalEntity;

}(this));
