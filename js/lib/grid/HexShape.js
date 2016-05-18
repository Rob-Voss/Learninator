var HexShape = HexShape || {};

/**
 * Inspired by https://github.com/RobertBrewitz/axial-hexagonal-grid
 */
(function (global) {
    "use strict";

    /**
     * Return a color for this Hex based on it's coords
     * x = green, y = purple, z = blue
     * @returns {number}
     */
    function colorForHex(q, r, s) {
        if (q === 0 && r === 0 && s === 0) {
            return 0x000000;
        } else if (q === 0) {
            return 0x59981b;
        } else if (r === 0) {
            return 0x0077b3;
        } else if (s === 0) {
            return 0xb34db2;
        } else {
            return 0xC0C0C0;
        }
    }

    class HexShape {
        /**
         *
         * @param {Layout} layout
         * @param {number} size
         * @param {boolean} fill
         * @returns {HexShape}
         * @constructor
         */
        constructor(hex, layout = false, size = 20, fill = false) {
            Object.assign(this, hex);
            this.layout = layout;
            this.size = size;
            this.fill = fill;
            this.color = colorForHex(this.q, this.r, this.s);
            this.shape = new PIXI.Graphics();
            this.draw();
            this.shape.interactive = true;
            this.shape
                .on('mousedown', (event) => {
                    this.data = event.data;
                    this.color = 0x00FF00;
                })
                .on('mouseup', (event) => {
                    this.color = colorForHex(this.q, this.r, this.s);
                })
                .on('mouseover', (event) => {
                    this.color = 0xFF0000;
                })
                .on('mouseout', (event) => {
                    this.color = colorForHex(this.q, this.r, this.s);
                });
            this.bounds = this.shape.getBounds();

            return this;
        }

        draw() {
            this.shape.clear();
            this.shape.lineStyle(1, 0xFF0000, 0.9);
            this.shape.beginFill(this.color, 0.09);
            for (let i = 0; i <= this.corners.length; i++) {
                if (i === 0) {
                    this.shape.moveTo(this.corners[i].x, this.corners[i].y);
                } else if (i === 6) {
                    this.shape.lineTo(this.corners[0].x, this.corners[0].y);
                } else {
                    this.shape.lineTo(this.corners[i].x, this.corners[i].y);
                }
            }
            this.shape.endFill();

            if (this.cheatOverlay !== undefined) {
                this.shape.removeChild(this.cheatOverlay);
            }
            this.cheatOverlay = new PIXI.Container();

            let txtOpts = {font: "10px Arial", fill: "#000000", align: "center"},
                posText = new PIXI.Text(this.center.toString(), txtOpts);
            posText.position.set(this.center.x - this.size / 2, this.center.y - 7);
            this.cheatOverlay.addChild(posText);

            this.shape.addChild(this.cheatOverlay);

            return this;
        }
    }
    global.HexShape = HexShape;

})(this);
