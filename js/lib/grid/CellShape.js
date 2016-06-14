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

            this.useSprite = false;
            // Add a container to hold our display cheats
            this.cheatsContainer = new PIXI.Container();
            if (this.useSprite) {
                this.sprites = PIXI.loader.resources["../../img/treasureHunter.json"].textures;
                this.graphics = new PIXI.Sprite(this.sprites['floor.png']);
                // this.texture = PIXI.Texture.fromImage('img/' + this.typeName.replace(' ', '') + '.png');
                // this.graphics = new PIXI.Sprite(this.texture);
                this.graphics.width = this.size;
                this.graphics.height = this.size;
                this.graphics.anchor.set(0.5, 0.5);
            } else {
                this.graphics = new PIXI.Graphics();
            }
            this.graphics.interactive = true;
            this.graphics
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
            this.draw();
            this.graphics.addChild(this.cheatsContainer);

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
                this.graphics.position.set(this.center.x, this.center.y);
            } else {
                this.graphics.clear();
                this.graphics.color = this.color;
                this.graphics.lineStyle(0, 0x000000, this.alpha);
                if (this.fill) {
                    this.graphics.beginFill(this.color, this.alpha);
                }
                this.graphics.drawRect(this.corners[0].x, this.corners[0].y, this.size, this.size);
                if (this.fill) {
                    this.graphics.endFill();
                }
                this.bounds = this.graphics.getBounds();

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
                        this.graphics.addChild(this.rewardText);
                    } else {
                        this.rewardText = this.graphics.getChildAt(this.graphics.getChildIndex(this.rewardText));
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
                        this.graphics.addChild(this.valueText);
                    } else {
                        this.valueText = this.graphics.getChildAt(this.graphics.getChildIndex(this.valueText));
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
