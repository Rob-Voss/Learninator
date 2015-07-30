(function (global) {
    "use strict";

    /**
     * Initialize the Entity
     * @param typeId
     * @param position
     * @param grid
     * @param opts
     * @returns {Entity}
     */
    var Entity = function (typeId, position, grid, opts) {
        var entityTypes = ['Wall', 'Nom', 'Gnar', 'Agent'];

        this.id = Utility.guid();
        this.name = entityTypes[typeId];
        this.type = typeId || 1;
        this.position = position || new Vec(5, 5);
        this.interactive = opts.interactive;
        this.collision = opts.collision;
        this.gridLocation = new Vec(0, 0);
        this.cleanUp = false;

        this.age = 0;
        this.angle = 0;
        this.rot1 = 0.0;
        this.rot2 = 0.0;
        this.width = 20;
        this.height = 20;
        this.radius = 10;

        // Remember the old position and angle
        this.oldPos = this.position;
        this.oldAngle = this.angle;
        var _this = this;

        this.texture = PIXI.Texture.fromImage('img/' + entityTypes[typeId] + '.png');
        this.sprite = new PIXI.Sprite(this.texture);
        this.sprite.texture.baseTexture.on('loaded', function () {
            // after load function here
        });

        this.sprite.width = this.width;
        this.sprite.height = this.height;
        this.sprite.anchor.set(0.5, 0.5);
        this.sprite.position.set(this.position.x, this.position.y);
        this.sprite.interactive = this.interactive;

        this.shape = new PIXI.Graphics();
        if (this.sprite.interactive === true) {
            this.sprite
                .on('mousedown', _this.onDragStart)
                .on('touchstart', _this.onDragStart)
                .on('mouseup', _this.onDragEnd)
                .on('mouseupoutside', _this.onDragEnd)
                .on('touchend', _this.onDragEnd)
                .on('touchendoutside', _this.onDragEnd)
                .on('mouseover', _this.onMouseOver)
                .on('mouseout', _this.onMouseOut)
                .on('mousemove', _this.onDragMove)
                .on('touchmove', _this.onDragMove);
            this.sprite.entity = _this;
        }

        this.draw = function () {
            this.sprite.position.set(this.position.x, this.position.y);

            this.shape.clear();
            this.shape.lineStyle(0xFFFFFF);
            switch (this.type) {
            case 1:
                this.shape.beginFill(0xFF0000);
                break;
            case 2:
                this.shape.beginFill(0x00FF00);
                break;
            }
            this.shape.drawCircle(this.position.x, this.position.y, this.radius);
            this.shape.endFill();
            this.shape.clear();
        };

        /**
         * Move around
         * @param {Object} smallWorld
         */
        this.move = function (smallWorld) {
            this.oldPos = this.position;

            // Move the items
            this.position.advance();
            if (this.position.x < 0) {
                this.position.x = 0;
                this.position.vx *= -1;
            }
            if (this.position.x > smallWorld.width) {
                this.position.x = smallWorld.width;
                this.position.vx *= -1;
            }
            if (this.position.y < 0) {
                this.position.y = 0;
                this.position.vy *= -1;
            }
            if (this.position.y > smallWorld.height) {
                this.position.y = smallWorld.height;
                this.position.vy *= -1;
            }

            this.position.round();
            this.sprite.position.set(this.position.x, this.position.y);
        };

        /**
         * Do work son
         * @param {Object} smallWorld
         */
        this.tick = function (smallWorld) {
            this.age += 1;

            if (smallWorld.movingEntities) {
                this.move(smallWorld);
            }
            if (smallWorld.cheats) {
                // Update the item's gridLocation label
                this.sprite.getChildAt(0).text = this.gridLocation.x + ':' + this.gridLocation.y;
                this.sprite.getChildAt(1).text = this.position.x + ':' + this.position.y;
            }
        };

        /**
         * Perform the start of a drag
         * @param event
         */
        this.onDragStart = function (event) {
            this.data = event.data;
            this.alpha = 0.5;
            this.dragging = true;
        };

        /**
         * Perform the move of a drag
         */
        this.onDragMove = function () {
            if (this.dragging) {
                var newPosition = this.data.getLocalPosition(this.parent);
                this.position.set(newPosition.x, newPosition.y);
                this.entity.position.set(newPosition.x, newPosition.y);
                this.entity.position.round();
            }
        };

        /**
         * Perform the end of a drag
         */
        this.onDragEnd = function () {
            this.alpha = 1;
            this.dragging = false;
            this.entity.position.set(this.position.x, this.position.y);
            this.entity.position.round();
            // set the interaction data to null
            this.data = null;
        };

        /**
         * Perform the action for mouse down
         */
        this.onMouseDown = function () {
            this.isdown = true;
            this.alpha = 1;
        };

        /**
         * Perform the action for mouse up
         */
        this.onMouseUp = function () {
            this.isdown = false;
        };

        /**
         * Perform the action for mouse over
         */
        this.onMouseOver = function () {
            this.isOver = true;
            if (this.isdown) {
                return;
            }
        };

        /**
         * Perform the action for mouse out
         */
        this.onMouseOut = function () {
            this.isOver = false;
            if (this.isdown) {
                return;
            }
        };

        return this;
    };

    Entity.prototype = {};

    global.Entity = Entity;

}(this));
