(function (global) {
    "use strict";

    class Interactive {

        /**
         * New interactive based object
         * @param options
         */
        constructor(options) {

        }

        /**
         * Initialize interactivity
         * @param entity
         */
        interactive(entity) {
            entity.sprite.interactive = entity.interactive;
            if (entity.sprite.interactive === true) {
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

        /**
         * Perform the start of a drag
         * @param event
         */
        onDragStart(event) {
            this.data = event.data;
            this.alpha = 0.5;
            this.dragging = true;
        }

        /**
         * Perform the move of a drag
         */
        onDragMove() {
            if (this.dragging) {
                var newPosition = this.data.getLocalPosition(this.parent);
                this.position.set(newPosition.x, newPosition.y);
                this.entity.position.set(newPosition.x, newPosition.y);
                this.entity.position.round();
            }
        }

        /**
         * Perform the end of a drag
         */
        onDragEnd() {
            this.alpha = 1;
            this.dragging = false;
            this.entity.position.set(this.position.x, this.position.y);
            this.entity.position.round();
            // set the interaction data to null
            this.data = null;
        }

        /**
         * Perform the action for mouse down
         */
        onMouseDown() {
            this.isdown = true;
            this.alpha = 1;
        }

        /**
         * Perform the action for mouse up
         */
        onMouseUp() {
            this.isdown = false;
        }

        /**
         * Perform the action for mouse over
         */
        onMouseOver() {
            this.isOver = true;
            if (this.isdown) {
                return;
            }
        }

        /**
         * Perform the action for mouse out
         */
        onMouseOut() {
            this.isOver = false;
            if (this.isdown) {
                return;
            }
        }
    }

    global.Interactive = Interactive;

}(this));
