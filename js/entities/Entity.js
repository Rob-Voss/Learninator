(function (global) {
    "use strict";

    class Entity extends Interactive {
        /**
         * Initialize the Entity
         * @param type
         * @param position
         * @param grid
         * @param opts
         * @returns {Entity}
         */
        constructor(type, position, grid, opts) {
            var defaults = {
                interactive: false,
                collision: false,
                display: undefined
            };
            super(opts || defaults);

            this.id = Utility.guid();
            this.position = position || new Vec(5, 5);
            this.camera = opts.display;
            this.interactive = opts.interactive;
            this.collision = opts.collision;
            if (grid !== undefined) {
                grid.getGridLocation(this);
            } else {
                this.gridLocation = new Vec(0, 0);
            }

            this.age = 0;
            this.angle = 0;
            this.rot1 = 0.0;
            this.rot2 = 0.0;
            this.width = 20;
            this.height = 20;
            this.radius = 10;
            this.cleanUp = false;

            // Remember the old position
            this.oldPos = this.position.clone();

            // Remember the old angle
            this.oldAngle = this.angle;

            this.texture = PIXI.Texture.fromImage('img/' + type + '.png');
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

    }

    global.Entity = Entity;

}(this));