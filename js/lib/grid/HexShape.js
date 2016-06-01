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
            this.txtOpts = {font: "10px Arial", fill: "#000000", align: "center"};

            // Add a container to hold our display cheats
            this.cheatsContainer = new PIXI.Container();
            this.draw();
            this.shape.addChild(this.cheatsContainer);

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
                    this.alpha = 0.5;
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

        addCheats() {
            if (this.cheats.id && this.idText === undefined) {
                this.corners.forEach((corner, id) => {
                    let inside = this.center.getPointBetween(corner, 85);
                    this.idText = new PIXI.Text(id, {font: "10px Arial", fill: "#CC0000", align: "center"});
                    this.idText.anchor = new PIXI.Point(0.5, 0.5);
                    this.idText.position = new PIXI.Point(inside.x, inside.y);
                    this.cheatsContainer.addChild(this.idText);
                });
            }

            if (this.cheats.direction) {
                this.walls.forEach((wall, dir) => {
                    if (wall.directionText === undefined) {
                        let midWall = wall.v1.getPointBetween(wall.v2, 50),
                            inside = midWall.getPointBetween(this.center, 20);
                        wall.directionText = new PIXI.Text(dir, {font: "10px Arial", fill: "#0000CC", align: "center"});
                        wall.directionText.style.fill = 0x0000FF;
                        wall.directionText.anchor = new PIXI.Point(0.5, 0.5);
                        wall.directionText.rotation = wall.angle;
                        wall.directionText.position = new PIXI.Point(inside.x, inside.y);
                        this.cheatsContainer.addChild(wall.directionText);
                    }
                });
            }

            if (this.cheats.position && this.posText === undefined) {
                this.posText = new PIXI.Text(this.center.toString() + '\n' + this.toString(), this.txtOpts);
                this.posText.position.set(this.center.x - this.size / 2, this.center.y - 7);
                this.cheatsContainer.addChild(this.posText);
            }

            if (this.cheats.gridLocation && this.gridText === undefined) {
                this.gridText = new PIXI.Text(this.toString(), this.txtOpts);
                this.gridText.position.set(this.center.x - this.size / 2, this.center.y);
                this.cheatsContainer.addChild(this.gridText);
            }

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
            this.shape.clear();
            this.shape.lineStyle(0, 0x000000, 0);
            if (this.fill) {
                this.shape.beginFill(this.color, this.alpha);
            }
            this.shape.drawPolygon(this.polyCorners);
            if (this.fill) {
                this.shape.endFill();
            }
            this.bounds = this.shape.getBounds();

            this.updateCheats();

            return this;
        }

        updateCheats() {
            this.addCheats();
            if (this.cheats.id) {
                this.corners.forEach((corner, id) => {
                    this.idText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.idText));
                    this.idText.text = id;
                });
            } else {
                if (this.idText !== undefined) {
                    this.corners.forEach((corner, id) => {
                        this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(this.idText));
                        this.idText = undefined;
                    });
                }
            }

            if (this.cheats.direction) {
                this.walls.forEach((wall, dir) => {
                    wall.directionText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(wall.directionText));
                    wall.directionText.text = dir;
                });
            } else {
                if (this.nameText !== undefined) {
                    this.walls.forEach((wall, dir) => {
                    this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(wall.directionText));
                        wall.nameText = undefined;
                    });
                }
            }

            if (this.cheats.position) {
                this.posText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.posText));
                this.posText = this.center.toString() + '\n' + this.toString();
            } else {
                if (this.posText !== undefined) {
                    this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(this.posText));
                    this.posText = undefined;
                }
            }

            if (this.cheats.gridLocation) {
                this.gridText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.gridText));
                this.gridText = this.toString();
            } else {
                if (this.gridText !== undefined) {
                    this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(this.gridText));
                    this.gridText = undefined;
                }
            }

            return this;
        }
    }
    global.HexShape = HexShape;

})(this);
