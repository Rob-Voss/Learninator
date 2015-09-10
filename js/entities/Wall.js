(function (global) {
    "use strict";

    /**
     * Wall is made up of two Vectors
     * @param {Vec} v1
     * @param {Vec} v2
     * @returns {Wall}
     */
    var Wall = function (v1, v2, opts) {
        this.v1 = v1;
        this.v2 = v2;
        this.type = 0;

        this.shape = new PIXI.Graphics();
        this.draw();

        return this;
    };

    /**
     * Draws it
     */
    Wall.prototype.draw = function () {
        this.shape.clear();
        this.shape.lineStyle(1, 0x000000);
        this.shape.beginFill(0x000000);
        this.shape.moveTo(this.v1.x, this.v1.y);
        this.shape.lineTo(this.v2.x, this.v2.y);
        this.shape.endFill();
    };

    global.Wall = Wall;

}(this));
