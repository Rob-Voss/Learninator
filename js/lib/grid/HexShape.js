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
            this.hex = hex;
            this.layout = layout;
            this.size = size;
            this.fill = fill;
            this.color = colorForHex(this.q, this.r, this.s);
            this.population = new Map();
            this.corners = [];
            this.walls = [];

            if (this.layout) {
                this.pos = this.layout.hexToPixel(hex);
                this.corners = this.layout.polygonCorners(this.pos);
                for (let c = 0; c < this.corners.length; c++) {
                    let x1 = this.corners[c].x,
                        y1 = this.corners[c].y,
                        x2, y2;
                    if (c !== this.corners.length - 1) {
                        x2 = this.corners[c + 1].x;
                        y2 = this.corners[c + 1].y;
                    } else {
                        x2 = this.corners[0].x;
                        y2 = this.corners[0].y;
                    }
                    let v1 = new Vec(x1, y1),
                        v2 = new Vec(x2, y2);
                    this.walls.push(new Wall(v1, v2));
                }
            } else {
                this.pointy = true;
                for (let i = 0; i < 6; i++) {
                    var angleAdd = (this.pointy) ? 30 : 0,
                        angleDeg = 60 * i + angleAdd,
                        angleRad = Math.PI / 180 * angleDeg;
                    this.corners.push(new Point(this.pos.x + this.size * Math.cos(angleRad),
                        this.pos.y + this.size * Math.sin(angleRad)));
                }
            }

            this.shape = new PIXI.Graphics();
            this.shape.interactive = true;
            this.shape.alpha = 0.09;
            this.shape.color = this.color;
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
                posText = new PIXI.Text(this.hex.toString() + "\n" + this.pos.toString(), txtOpts);
            posText.position.set(this.pos.x - this.size / 2, this.pos.y - 7);
            this.cheatOverlay.addChild(posText);

            this.shape.addChild(this.cheatOverlay);

            return this;
        }
    }

    global.HexShape = HexShape;

})(this);
