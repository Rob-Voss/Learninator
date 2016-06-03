/**
 * Original code borrowed from https://github.com/felipecsl/random-maze-generator
 *
 */
(function (global) {
    "use strict";

    class CellShape extends Cell {

        /**
         * Create a CellShape
         * @name CellShape
         * @constructor
         *
         * @param {Cell} cell
         * @param {number} size
         * @param {boolean} fill
         * @param {object} cheats
         * @returns {CellShape}
         */
        constructor(cell, size, fill = false, cheats = false) {
            super(cell.x, cell.y, cell.z);

            this.size = size;
            this.fill = fill;
            this.cheats = cheats;
            this.useSprite = false;
            this.isOver = false;
            this.isDown = false;
            this.color = 0xFFFFFF;
            this.alpha = 1;

            this.walls = [];

            this.center = new Vec(
                this.x * this.size + (this.size / 2),
                this.y * this.size + (this.size / 2)
            );

            this.corners = [
                new Vec(this.x * this.size, this.y * this.size),
                new Vec(this.x * this.size + this.size, this.y * this.size),
                new Vec(this.x * this.size + this.size, this.y * this.size + this.size),
                new Vec(this.x * this.size, this.y * this.size + this.size)
            ];

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
                    this.color = 0x00FF00;
                    this.alpha = 1;
                    this.isDown = true;
                    this.draw();
                })
                .on('mouseup', (event) => {
                    this.event = event;
                    this.color = 0xFFFFFF;
                    this.alpha = 1;
                    this.isDown = false;
                    this.draw();
                })
                .on('mouseover', (event) => {
                    this.event = event;
                    this.color = 0xFF0000;
                    this.alpha = 1;
                    this.isOver = true;
                    this.draw();
                })
                .on('mouseout', (event) => {
                    this.event = event;
                    this.color = 0xFFFFFF;
                    this.alpha = 1;
                    this.isOver = false;
                    this.draw();
                });
            graphicObj.addChild(this.cheatsContainer);

            return this;
        }

        /**
         *
         * @returns {CellShape}
         */
        addCheats() {
            this.txtOpts = {font: "10px Arial", fill: "#FF0000", align: "center"};

            if (this.cheats.gridLocation && this.gridText === undefined) {
                this.gridText = new PIXI.Text(this.toString(), this.txtOpts);
                this.gridText.position.set(this.center.x - 8, this.center.y - 4);
                this.cheatsContainer.addChild(this.gridText);
            }

            if (this.cheats.position && this.posText === undefined) {
                this.posText = new PIXI.Text(this.center.toString() + '\n' + this.toString(), this.txtOpts);
                this.posText.position.set(this.center.x - this.size / 2, this.center.y - 7);
                this.cheatsContainer.addChild(this.posText);
            }

            return this;
        }

        /**
         *
         * @returns {CellShape}
         */
        draw() {
            if (this.useSprite) {
                this.sprite.position.set(this.center.x, this.center.y);
            } else {
                this.shape.clear();
                this.shape.color = this.color;
                this.shape.lineStyle(0, 0x000000, this.alpha);
                if (this.fill) {
                    this.shape.beginFill(this.color, this.alpha);
                }
                this.shape.drawRect(this.corners[0].x, this.corners[0].y, this.size, this.size);
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

        /**
         *
         * @returns {CellShape}
         */
        updateCheats() {
            this.addCheats();
            if (this.cheats.gridLocation) {
                this.gridText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.gridText));
                this.gridText.text = this.toString();
            } else {
                if (this.gridText !== undefined) {
                    this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(this.gridText));
                    this.gridText = undefined;
                }
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

            return this;
        }
    }
    global.CellShape = CellShape;

}(this));
