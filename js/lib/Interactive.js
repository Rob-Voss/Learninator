(function (global) {
    "use strict";

    class Interactive {
        constructor () {
            "use strict";

        }

        onDragStart (event) {
            this.data = event.data;
            this.alpha = 0.5;
            this.dragging = true;
        }

        onDragMove () {
            if(this.dragging) {
                var newPosition = this.data.getLocalPosition(this.parent);
                this.position.set(newPosition.x, newPosition.y);
                this.entity.position.x = newPosition.x;
                this.entity.position.y = newPosition.y;
            }
        }

        onDragEnd () {
            this.alpha = 1;
            this.dragging = false;
            this.entity.position.x = this.position.x;
            this.entity.position.y = this.position.y;
            // set the interaction data to null
            this.data = null;
        }

        onMouseDown () {
            this.isdown = true;
            this.alpha = 1;
        }

        onMouseUp () {
            this.isdown = false;
        }

        onMouseOver () {
            this.isOver = true;
            if (this.isdown) {
                return;
            }
        }

        onMouseOut () {
            this.isOver = false;
            if (this.isdown) {
                return;
            }
        }
    }

    global.Interactive = Interactive;

}(this));
