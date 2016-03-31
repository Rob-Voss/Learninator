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
            let typeOf = typeof type;
            this.age = 0;
            this.body = body;
            this.id = Utility.guid();
            this.type = (typeOf === 'string') ? entityTypes.indexOf(type) : type || 1;
            this.typeName = entityTypes[this.type];
            this.name = (this.name === undefined) ? entityTypes[this.type] : this.name;
            this.body.label = this.name;
            this.radius = (this.type === 2) ? 10 : this.body.circleRadius;
            this.force = {
                x: Common.random(-1, 1) * 0.0025,
                y: Common.random(-1, 1) * 0.0025
            };

            return this;
        }

        /**
         *
         * @param {World} world
         */
        draw(world) {

        }

        /**
         *
         */
        move() {
            Body.applyForce(this.body, this.body.position, {
                x: Common.random(-1, 1) * 0.0025,
                y: Common.random(-1, 1) * 0.0025
            });
        }

        /**
         * Do work son
         * @param {World} world
         * @returns {PhysicalEntity}
         */
        tick(world) {
            this.age += 1;
            this.draw(world);
            this.move();

            return this;
        }
    }
    global.PhysicalEntity = PhysicalEntity;

}(this));
