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
            this.reward = null;
            this.value = null;
            this.size = size;
            this.fill = fill;
            this.cheats = cheats;
            this.center = layout.hexToPixel(this);
            this.corners = layout.polygonCorners(this);
            this.corners.forEach((corner) => {
                this.polyCorners.push(corner.x, corner.y);
            });

            this.useSprite = false;
            this.isOver = false;
            this.isDown = false;
            this.color = this.colorForHex(this.q, this.r, this.s);
            this.alpha = 0.2;

            // Add a container to hold our display cheats
            this.cheatsContainer = new PIXI.Container();
            let graphicObj = null;
            if (this.useSprite) {
                this.texture = PIXI.Texture.fromImage('img/' + this.typeName.replace(' ', '') + '.png');
                this.sprite = new PIXI.Sprite(this.texture);
                this.sprite.width = this.width;
                this.sprite.height = this.height;
                this.sprite.anchor.set(0.5, 0.5);
                graphicObj = this.sprite;
            } else {
                this.shape = new PIXI.Graphics();
                graphicObj = this.shape;
            }

            this.draw();

            graphicObj.interactive = true;
            graphicObj
                .on('mousedown', (event) => {
                    this.event = event;
                    this.data = event.data;
                    // this.color = 0x00FF00;
                    this.alpha = 1;
                    this.isDown = true;
                    this.draw();
                })
                .on('mouseup', (event) => {
                    this.event = event;
                    // this.color = this.colorForHex(this.q, this.r, this.s);
                    this.alpha = 0.2;
                    this.isDown = false;
                    this.draw();
                })
                .on('mouseover', (event) => {
                    this.event = event;
                    // this.color = 0xFF0000;
                    this.alpha = 0.5;
                    this.isOver = true;
                    this.draw();
                })
                .on('mouseout', (event) => {
                    this.event = event;
                    // this.color = this.colorForHex(this.q, this.r, this.s);
                    this.alpha = 0.2;
                    this.isOver = false;
                    this.draw();
                });
            graphicObj.addChild(this.cheatsContainer);

            return this;
        }

        addCheats() {
            this.txtOpts = {font: "10px Arial", fill: "#CC0000", align: "center"};
            if (this.cheats.id) {
                this.corners.forEach((corner, id) => {
                    if (corner.idText === undefined) {
                        let inside = this.center.getPointBetween(corner, 85);
                        corner.idText = new PIXI.Text(id, this.txtOpts);
                        corner.idText.anchor = new PIXI.Point(0.5, 0.5);
                        corner.idText.position = new PIXI.Point(inside.x, inside.y);
                        this.cheatsContainer.addChild(corner.idText);
                    }
                });
            }

            if (this.cheats.direction) {
                this.walls.forEach((wall, dir) => {
                    if (wall.directionText === undefined) {
                        let midWall = wall.v1.getPointBetween(wall.v2, 50),
                            inside = midWall.getPointBetween(this.center, 20);
                        this.txtOpts.fill = "#0000CC";
                        wall.directionText = new PIXI.Text(dir, this.txtOpts);
                        wall.directionText.style.fill = 0x0000FF;
                        wall.directionText.anchor = new PIXI.Point(0.5, 0.5);
                        wall.directionText.rotation = wall.angle;
                        wall.directionText.position = new PIXI.Point(inside.x, inside.y);
                        this.cheatsContainer.addChild(wall.directionText);
                    }
                });
                this.txtOpts.fill = "#CC0000";
            }

            if (this.cheats.position && this.posText === undefined) {
                this.posText = new PIXI.Text(this.center.toString(), this.txtOpts);
                this.posText.position.set(this.center.x - 8, this.center.y - 10);
                this.cheatsContainer.addChild(this.posText);
            }

            if (this.cheats.gridLocation && this.gridText === undefined) {
                this.gridText = new PIXI.Text(this.toString(), this.txtOpts);
                this.gridText.position.set(this.center.x - 8, this.center.y - 5);
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
            if (this.useSprite) {
                this.sprite.position.set(this.center.x, this.center.y);
            } else {
                this.shape.clear();
                this.shape.color = this.color;
                this.shape.lineStyle(0, 0x000000, 0);
                if (this.fill) {
                    this.shape.beginFill(this.color, this.alpha);
                }
                this.shape.drawPolygon(this.polyCorners);
                if (this.fill) {
                    this.shape.endFill();
                }
                this.bounds = this.shape.getBounds();

                if (this.reward !== null && this.value !== null) {
                    let rew = this.reward.toFixed(1),
                        val = this.value.toFixed(2);
                    if (this.rewardText === undefined) {
                        this.rewardText = new PIXI.Text(rew !== "0.0" ? 'R' + rew : '', {
                            font: "8px Arial",
                            fill: rew < 0.0 ? "#000000" : "#00FF00",
                            align: "center"
                        });
                        this.rewardText.anchor = new PIXI.Point(0.5, 0.5);
                        this.rewardText.position.set(this.center.x, this.center.y - 8);
                        this.shape.addChild(this.rewardText);
                    } else {
                        this.rewardText = this.shape.getChildAt(this.shape.getChildIndex(this.rewardText));
                        this.rewardText.text = rew !== "0.0" ? 'R' + rew : '';
                    }

                    if (this.valueText === undefined) {
                        this.valueText = new PIXI.Text(val !== 0.00 ? val : '', {
                            font: "8px Arial",
                            fill: val === "0.00" ? "#000000" : "#00FF00",
                            align: "center"
                        });
                        this.valueText.anchor = new PIXI.Point(0.5, 0.5);
                        this.valueText.position.set(this.center.x, this.center.y);
                        this.shape.addChild(this.valueText);
                    } else {
                        this.valueText = this.shape.getChildAt(this.shape.getChildIndex(this.valueText));
                        this.valueText.text = val !== "0.00" ? val : '';
                    }
                }
            }

            this.updateCheats();

            return this;
        }

        updateCheats() {
            this.addCheats();
            if (this.cheats.id) {
                this.corners.forEach((corner, id) => {
                    corner.idText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(corner.idText));
                    corner.idText.text = id;
                });
            } else {
                if (this.idText !== undefined) {
                    this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(this.idText));
                    this.idText = undefined;
                }
            }

            if (this.cheats.direction) {
                this.walls.forEach((wall, dir) => {
                    wall.directionText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(wall.directionText));
                    wall.directionText.text = dir;
                });
            } else {
                this.walls.forEach((wall, dir) => {
                    if (wall.directionText !== undefined) {
                        this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(wall.directionText));
                        wall.directionText = undefined;
                    }
                });
            }

            if (this.cheats.position) {
                this.posText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.posText));
                this.posText.text = this.center.toString();
            } else {
                if (this.posText !== undefined) {
                    this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(this.posText));
                    this.posText = undefined;
                }
            }

            if (this.cheats.gridLocation) {
                this.gridText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.gridText));
                this.gridText.text = this.toString();
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
