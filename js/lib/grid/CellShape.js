/**
 * Original code borrowed from https://github.com/felipecsl/random-maze-generator
 *
 */
(function (global) {
    "use strict";

    class CellShape extends Cell {
        /**
         * Create a cell
         * @name Cell
         * @constructor
         *
         * @param {number} x
         * @param {number} y
         * @param {number} width
         * @param {number} height
         * @returns {Cell}
         */
        constructor(x = 0, y = 0, width = 10, height = 10) {
            super(x, y);
            let self = this;

            this.shape = new PIXI.Graphics();
            this.shape.interactive = true;
            this.shape
                .on('mousedown', function (event) {
                    this.data = event.data;
                    self.color = 0x00FF00;
                })
                .on('mouseup', function (event) {
                    self.color = 0xFFFFFF;
                })
                .on('mouseover', function (event) {
                    self.color = 0xFF0000;
                })
                .on('mouseout', function (event) {
                    self.color = 0xFFFFFF;
                });
            //this.shape.entity = self;
            this.shape.alpha = 0.09;
            this.shape.color = this.color;

            return this;
        }

        draw() {
            this.shape.clear();
            this.shape.lineStyle(1, 0x000000);
            this.shape.beginFill(this.color);
            this.shape.moveTo(this.corners[0].x, this.corners[0].y);
            this.shape.lineTo(this.corners[1].x, this.corners[1].y);
            this.shape.lineTo(this.corners[2].x, this.corners[2].y);
            this.shape.lineTo(this.corners[3].x, this.corners[3].y);
            this.shape.lineTo(this.corners[0].x, this.corners[0].y);
            this.shape.endFill();

            if (this.cheatOverlay !== undefined) {
                this.shape.removeChild(this.cheatOverlay);
            }
            this.cheatOverlay = new PIXI.Container();

            let txtOpts = {font: "10px Arial", fill: "#000000", align: "center"},
                posText = new PIXI.Text(this.toString(), txtOpts);
            posText.position.set(this.corners[0].x + this.width / 2, this.corners[0].y + this.height / 2 + 13);
            this.cheatOverlay.addChild(posText);

            this.shape.addChild(this.cheatOverlay);
        }
    }

    global.CellShape = CellShape;

}(this));
