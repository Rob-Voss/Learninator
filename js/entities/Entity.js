(function (global) {
    "use strict";

    class Entity extends Interactive {
        /**
         * Initialize the Entity
         * @param type
         * @param position
         * @param grid
         * @param options
         * @returns {Entity}
         */
        constructor(type, position, grid, options) {
            var opts = options || {interactive: false, collision: false, display: undefined};
            super(opts);

            this.id = Utility.guid();
            this.name = type || 'Derps';
            this.camera = opts.display;
            this.position = position || new Vec(0, 0);
            this.gridLocation = grid.getGridLocation(this);
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

            this.texture = PIXI.Texture.fromImage('img/' + type + '.png');
            this.sprite = new PIXI.Sprite(this.texture);
            this.sprite.texture.baseTexture.on('loaded', function () {

            });

            this.sprite.width = this.width;
            this.sprite.height = this.height;
            this.sprite.anchor.set(0.5, 0.5);
            this.sprite.position.set(this.position.x, this.position.y);
            this.sprite.interactive = this.interactive;

            var _this = this;

            super.init(_this);

            return _this;
        }

    }

    global.Entity = Entity;

}(this));
