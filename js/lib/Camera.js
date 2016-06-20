(function (global) {
    "use strict";

    /**
     *
     */
    class Camera extends PIXI.Container {

        /**
         * A camera for you
         * @param {PIXI.Container} view
         * @param {HTMLCanvas} canvas
         * @returns {Camera}
         */
        constructor(view, canvas) {
            super();

            this.canvas = canvas;
            this.worldLayer = view;
            this.mousePressPoint = [0, 0];
            this.mouseOverPoint = [0, 0];
            this.globalMousePosition = new PIXI.Point();
            this.localMousePosition;
            this.mapScaleTarget = 1.0;
            this.zoomSpeed = 0.05;

            // Enable mouse wheel zoom
            this.canvas.addEventListener('DOMMouseScroll', this.mouseScroll.bind(this)); // Firefox
            this.canvas.addEventListener('mousewheel', this.mouseScroll.bind(this));     // Not Firefox

            this.canvas.addEventListener('mousedown', this.mouseDown.bind(this));
            this.canvas.addEventListener('touchstart', this.mouseDown.bind(this));

            this.canvas.addEventListener('mouseup', this.mouseUp.bind(this));
            this.canvas.addEventListener('mouseupoutside', this.mouseUp.bind(this));
            this.canvas.addEventListener('touchend', this.mouseUp.bind(this));
            this.canvas.addEventListener('touchendoutside', this.mouseUp.bind(this));

            this.canvas.addEventListener('mousemove', this.mouseMove.bind(this));
            this.canvas.addEventListener('touchmove', this.mouseMove.bind(this));

            return this;
        }

        /**
         *
         * @param event
         */
        mouseDown(event) {
            this.data = event.data;
            this.globalMousePosition = this.toLocal(this.parent);
            this.dragging = true;
            this.mousePressPoint[0] = this.globalMousePosition.x - this.position.x;
            this.mousePressPoint[1] = this.globalMousePosition.y - this.position.y;
        }

        /**
         *
         * @param event
         */
        mouseMove() {
            this.globalMousePosition = this.toLocal(this.parent);
            if (this.dragging) {
                var position = this.toLocal(this.parent);
                this.position.x = position.x - this.mousePressPoint[0];
                this.position.y = position.y - this.mousePressPoint[1];
            } else {
                this.mouseOverPoint[0] = this.globalMousePosition.x - this.position.x;
                this.mouseOverPoint[1] = this.globalMousePosition.y - this.position.y;
            }
        }

        /**
         *
         * @param event
         */
        mouseScroll(event) {
            let factor = 1,
                // Firefox has "detail" prop with opposite sign to std wheelDelta
                delta = event.wheelDelta || -event.detail,
                localPt = new PIXI.Point(),
                point = new PIXI.Point(event.pageX, event.pageY);
            PIXI.interaction.InteractionData.prototype.getLocalPosition(this.parent, localPt, point);

            if (delta > 0) {
                // Zoom in
                factor = 1.1;
            } else {
                // Zoom out
                factor = 1 / 1.1;
            }

            this.worldLayer.pivot = localPt;
            this.worldLayer.position = point;
            this.worldLayer.scale.x = this.worldLayer.scale.x * factor;
            this.worldLayer.scale.y = this.worldLayer.scale.y * factor;
        }

        /**
         *
         * @param event
         */
        mouseUp(event) {
            this.dragging = false;
            this.data = null;
        }

        /**
         *
         */
        update() {
        //     this.localMousePosition = this.worldLayer.toLocal(this.globalMousePosition);
        //
        //     if (this.worldLayer.scale.x > this.mapScaleTarget) {
        //         this.worldLayer.scale.x -= this.zoomSpeed;
        //         this.worldLayer.scale.y -= this.zoomSpeed;
        //     } else {
        //         this.worldLayer.scale.x += this.zoomSpeed;
        //         this.worldLayer.scale.y += this.zoomSpeed;
        //     }
        //
        //     this.worldLayer.position.x = -(this.localMousePosition.x * this.worldLayer.scale.x) + this.globalMousePosition.x;
        //     this.worldLayer.position.y = -(this.localMousePosition.y * this.worldLayer.scale.y) + this.globalMousePosition.y;
        }
    }
    global.Camera = Camera;

}(this));