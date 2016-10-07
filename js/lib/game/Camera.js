(function(global) {
  'use strict';

  /**
   *
   */
  class Camera extends PIXI.DisplayObject {

    /**
     * A camera for you
     * @param {PIXI.Container} view
     * @param {HTMLCanvas} canvas
     * @return {Camera}
     */
    constructor(view, canvas) {
      super();

      this.canvas = canvas;
      this.worldLayer = view;
      this.mousePressPoint = [0, 0];
      this.mouseOverPoint = [0, 0];
      this.globalMousePosition = new PIXI.Point();
      this.localMousePosition = new PIXI.Point();
      this.mapScaleTarget = 1.0;
      this.zoomSpeed = 0.05;

      // Enable mouse wheel zoom
      // Firefox
      this.canvas.addEventListener('DOMMouseScroll', this.zoom.bind(this));
      // Not Firefox
      this.canvas.addEventListener('mousewheel', this.zoom.bind(this));

      this.canvas.addEventListener('mousedown', this.click.bind(this));
      this.canvas.addEventListener('touchstart', this.click.bind(this));

      this.canvas.addEventListener('mouseup', this.release.bind(this));
      this.canvas.addEventListener('mouseupoutside', this.release.bind(this));
      this.canvas.addEventListener('touchend', this.release.bind(this));
      this.canvas.addEventListener('touchendoutside', this.release.bind(this));

      this.canvas.addEventListener('mousemove', this.drag.bind(this));
      this.canvas.addEventListener('touchmove', this.drag.bind(this));

      return this;
    }

    /**
     *
     * @param {event} event
     */
    click(event) {
      this.data = event.data;
      this.globalMousePosition = this.toLocal(this.parent);
      this.dragging = true;
      this.mousePressPoint[0] = this.globalMousePosition.x - this.position.x;
      this.mousePressPoint[1] = this.globalMousePosition.y - this.position.y;
    }

    /**
     *
     * @param {event} event
     */
    drag(event) {
      this.globalMousePosition = this.toLocal(this.parent);
      if (this.dragging) {
        let position = this.toLocal(this.parent);
        this.position.x = position.x - this.mousePressPoint[0];
        this.position.y = position.y - this.mousePressPoint[1];
      } else {
        this.mouseOverPoint[0] = this.globalMousePosition.x - this.position.x;
        this.mouseOverPoint[1] = this.globalMousePosition.y - this.position.y;
      }
    }

    /**
     *
     * @param {event} event
     */
    zoom(event) {
      // Firefox has "detail" prop with opposite sign to std wheelDelta
      let delta = event.wheelDelta || -event.detail,
          localPt = new PIXI.Point(),
          point = new PIXI.Point(event.pageX, event.pageY),
          factor = (delta > 0) ? 1.1 : 1 / 1.1,
          interaction = PIXI.interaction.InteractionData;
      interaction.prototype.getLocalPosition(this.parent, localPt, point);

      this.worldLayer.pivot = localPt;
      this.worldLayer.position = point;
      this.worldLayer.scale.x *= factor;
      this.worldLayer.scale.y *= factor;
    }

    /**
     *
     * @param {event} event
     */
    release(event) {
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
      //     this.worldLayer.position.x = -(this.localMousePosition.x * this.worldLayer.scale.x) +
      // this.globalMousePosition.x; this.worldLayer.position.y = -(this.localMousePosition.y *
      // this.worldLayer.scale.y) + this.globalMousePosition.y;
    }
  }

  // Checks for Node.js - http://stackoverflow.com/a/27931000/1541408
  if (typeof process !== 'undefined') {
    module.exports = {
      Camera: Camera
    };
  } else {
    global.Camera = Camera;
  }

}(this));