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
            this.id = Utility.guid();
            this.age = 0;
            this.body = body;
            this.radius = (this.type === 2) ? 10 : this.body.circleRadius;
            this.body.label = this.id;
            this.type = (typeOf === 'string') ? entityTypes.indexOf(type) : type || 1;
            this.typeName = entityTypes[this.type];
            this.name = (this.name === undefined) ? entityTypes[this.type] : this.name;
            this.action = Common.choose([0, 1, 2, 3]);

            return this;
        }

        draw() {

        }

        move() {
            let v = {x: 0, y: 0};
            switch (this.action) {
                case 0: // Left
                    v.x += -0.95;
                    break;
                case 1: // Right
                    v.x += 0.95;
                    break;
                case 2: // Up
                    v.y += -0.95;
                    break;
                case 3: // Down
                    v.y += 0.95;
                    break;
            }
            v.x *= 0.005;
            v.y *= 0.005;

            Body.applyForce(this.body, this.body.position, v);
        }

        /**
         * Do work son
         */
        tick() {
            this.age += 1;
            this.move();
            
            return this;
        }
    }
    global.PhysicalEntity = PhysicalEntity;

}(this));
