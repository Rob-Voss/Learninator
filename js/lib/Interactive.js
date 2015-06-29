(function (global) {
    "use strict";

    class Interactive {
        constructor() {

        }

        init(entity) {
            entity.sprite.width = entity.width;
            entity.sprite.height = entity.height;
            entity.sprite.anchor.set(0.5, 0.5);
            entity.sprite.position.set(entity.position.x, entity.position.y);
            entity.sprite.interactive = entity.interactive;
            if (entity.interactive === true) {
                entity.sprite
                    .on('mousedown', this.onDragStart)
                    .on('touchstart', this.onDragStart)
                    .on('mouseup', this.onDragEnd)
                    .on('mouseupoutside', this.onDragEnd)
                    .on('touchend', this.onDragEnd)
                    .on('touchendoutside', this.onDragEnd)
                    .on('mouseover', this.onMouseOver)
                    .on('mouseout', this.onMouseOut)
                    .on('mousemove', this.onDragMove)
                    .on('touchmove', this.onDragMove);
                entity.sprite.entity = entity;
            }
        }

        onDragStart(event) {
            this.data = event.data;
            this.alpha = 0.5;
            this.dragging = true;
        }

        onDragMove() {
            if (this.dragging) {
                var newPosition = this.data.getLocalPosition(this.parent);
                this.position.set(newPosition.x, newPosition.y);
                this.entity.position.set(newPosition.x, newPosition.y);
                this.entity.position.round();
            }
        }

        onDragEnd() {
            this.alpha = 1;
            this.dragging = false;
            this.entity.position.set(this.position.x, this.position.y);
            this.entity.position.round();
            // set the interaction data to null
            this.data = null;
        }

        onMouseDown() {
            this.isdown = true;
            this.alpha = 1;
        }

        onMouseUp() {
            this.isdown = false;
        }

        onMouseOver() {
            this.isOver = true;
            if (this.isdown) {
                return;
            }
        }

        onMouseOut() {
            this.isOver = false;
            if (this.isdown) {
                return;
            }
        }
    }

    global.Interactive = Interactive;

}(this));
