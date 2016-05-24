var HexShape = HexShape || {};

/**
 * Inspired by https://github.com/RobertBrewitz/axial-hexagonal-grid
 */
(function (global) {
    "use strict";

    /**
     *
     */
    class HexShape extends Hex {

        /**
         *
         * @param {Hex|object} hex
         * @param {Layout} layout
         * @param {number} size
         * @param {boolean} fill
         * @param {boolean} cheats
         * @returns {HexShape}
         * @constructor
         */
        constructor(hex, layout, size = 20, fill = false, cheats = false) {
            super(hex.q, hex.r, hex.s);

            this.size = size;
            this.fill = fill;
            this.cheats = cheats;
            this.center = layout.hexToPixel(hex);
            for (let i = 0; i < 6; i++) {
                var offset = layout.hexCornerOffset(i);
                this.polyCorners.push(this.center.x + offset.x, this.center.y + offset.y);
                this.corners.push(new Vec(this.center.x + offset.x, this.center.y + offset.y));
            }
            this.color = this.colorForHex(this.q, this.r, this.s);
            this.alpha = 0.2;

            this.shape = new PIXI.Graphics();
            this.shape.color = this.color;
            this.shape.interactive = true;
            this.draw();
            this.shape
                .on('mousedown', (event) => {
                    this.event = event;
                    this.color = 0x00FF00;
                    this.alpha = 1;
                    this.draw();
                })
                .on('mouseup', (event) => {
                    this.event = event;
                    this.color = this.colorForHex(this.q, this.r, this.s);
                    this.alpha = 0.2;
                    this.draw();
                })
                .on('mouseover', (event) => {
                    this.event = event;
                    this.color = 0xFF0000;
                    this.alpha = 1;
                    this.draw();
                })
                .on('mouseout', (event) => {
                    this.event = event;
                    this.color = this.colorForHex(this.q, this.r, this.s);
                    this.alpha = 0.2;
                    this.draw();
                });

            return this;
        }

        /**
         * Return a color for this Hex based on it's coords
         * x = green, y = purple, z = blue
         * @returns {number}
         */
        colorForHex(q, r, s) {
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

        /**
         *
         * @returns {HexShape}
         */
        draw() {
            this.txtOpts = {font: "10px Arial", fill: "#000000", align: "center"};
            if (this.cheatOverlay !== undefined) {
                this.shape.removeChild(this.cheatOverlay);
            }
            this.cheatOverlay = new PIXI.Container();

            if (this.cheats.position) {
                this.posText = new PIXI.Text(this.center.toString() + '\n' + this.toString(), this.txtOpts);
                this.posText.position.set(this.center.x - this.size / 2, this.center.y - 7);
                this.cheatOverlay.addChild(this.posText);
            }

            if (this.cheats.gridLocation) {
                this.gridText = new PIXI.Text(this.toString(), this.txtOpts);
                this.gridText.position.set(this.center.x - this.size / 2, this.center.y - 7);
                this.cheatOverlay.addChild(this.gridText);
            }

            this.shape.clear();
            this.shape.lineStyle(0, 0x000000, 0);
            if (this.fill) {
                this.shape.beginFill(this.color, this.alpha);
            }
            this.shape.drawPolygon(this.polyCorners);
            if (this.fill) {
                this.shape.endFill();
            }
            this.shape.addChild(this.cheatOverlay);
            this.bounds = this.shape.getBounds();

            return this;
        }

    }
    global.HexShape = HexShape;

})(this);
