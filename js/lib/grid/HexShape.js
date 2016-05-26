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
         * @param {number} size
         * @param {Layout} layout
         * @param {boolean} fill
         * @param {boolean} cheats
         * @returns {HexShape}
         * @constructor
         */
        constructor(hex, size = 20, layout, fill = false, cheats = false) {
            super(hex.q, hex.r, hex.s);

            this.walls = [];
            this.size = size;
            this.fill = fill;
            this.cheats = cheats;
            this.center = layout.hexToPixel(this);
            this.corners = layout.polygonCorners(this);
            this.corners.forEach((corner) => {
                this.polyCorners.push(corner.x, corner.y);
            });

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

            if (this.cheats && this.cheats.position) {
                this.posText = new PIXI.Text(this.center.toString() + '\n' + this.toString(), this.txtOpts);
                this.posText.position.set(this.center.x - this.size / 2, this.center.y - 7);
                this.cheatOverlay.addChild(this.posText);
            }

            if (this.cheats && this.cheats.gridLocation) {
                this.gridText = new PIXI.Text(this.toString(), this.txtOpts);
                this.gridText.position.set(this.center.x - this.size / 2, this.center.y);
                this.cheatOverlay.addChild(this.gridText);
            }

            if (this.cheats && this.cheats.id) {
                this.corners.forEach((corner, id) => {
                    let inside = this.center.getPointBetween(corner, 85);
                    this.idText = new PIXI.Text(id, {font: "10px Arial", fill: "#CC0000", align: "center"});
                    this.idText.anchor = new PIXI.Point(0.5, 0.5);
                    this.idText.position = new PIXI.Point(inside.x, inside.y);
                    this.cheatOverlay.addChild(this.idText);
                });
            }

            if (this.cheats && this.cheats.direction) {
                this.walls.forEach((wall, dir) => {
                    let midWall = wall.v1.getPointBetween(wall.v2, 50),
                        inside = midWall.getPointBetween(this.center, 20);
                    wall.directionText = new PIXI.Text(dir, {font: "10px Arial", fill: "#0000CC", align: "center"});
                    wall.directionText.style.fill = 0x0000FF;
                    wall.directionText.anchor = new PIXI.Point(0.5, 0.5);
                    wall.directionText.rotation = wall.angle;
                    wall.directionText.position = new PIXI.Point(inside.x, inside.y);
                    this.cheatOverlay.addChild(wall.directionText);
                });
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
