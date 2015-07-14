(function (global) {
    "use strict";

    class Entity extends Interactive {
        /**
         * Initialize the Entity
         * @param typeId
         * @param position
         * @param grid
         * @param opts
         * @returns {Entity}
         */
        constructor(typeId, position, grid, opts) {
            var entityTypes = ['Wall', 'Nom', 'Gnar', 'Agent'],
                defaults = {
                    interactive: false,
                    collision: false,
                    display: undefined
                };
            opts = opts || defaults;
            super(opts);

            this.id = Utility.guid();
            this.name = entityTypes[typeId];
            this.type = typeId || 1;
            this.position = position || new Vec(5, 5);
            this.interactive = opts.interactive;
            this.collision = opts.collision;
            this.gridLocation = new Vec(0, 0);

            this.age = 0;
            this.angle = 0;
            this.rot1 = 0.0;
            this.rot2 = 0.0;
            this.width = 20;
            this.height = 20;
            this.radius = 10;

            // Remember the old position
            this.oldPos = this.position.clone();

            // Remember the old angle
            this.oldAngle = this.angle;

            this.texture = PIXI.Texture.fromImage('img/' + entityTypes[typeId] + '.png');
            this.sprite = new PIXI.Sprite(this.texture);
            this.sprite.texture.baseTexture.on('loaded', function () {
                // after load function here
            });

            this.sprite.width = this.width;
            this.sprite.height = this.height;
            this.sprite.anchor.set(0.5, 0.5);
            this.sprite.position.set(this.position.x, this.position.y);

            var _this = this;

            super.interactive(_this);

            return _this;
        }

        move() {

        }
    }

    global.Entity = Entity;

}(this));
