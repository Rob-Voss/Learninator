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
         * @param {boolean} fill
         * @param {object} cheats
         * @returns {CellShape}
         */
        constructor(cell, fill = false, cheats = false) {
            super(cell.x, cell.y, cell.size);

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
            this.walls = [];
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

            this.fill = fill;
            this.cheats = cheats;
            this.color = 0xFFFFFF;
            this.shape = new PIXI.Graphics();
            this.shape.interactive = true;
            this.draw();

            this.shape
                .on('mousedown', (event) => {
                    this.event = event;
                    this.data = event.data;
                    this.color = 0x00FF00;
                    this.alpha = 1;
                    this.draw();
                })
                .on('mouseup', (event) => {
                    this.event = event;
                    this.color = 0xFFFFFF;
                    this.alpha = 1;
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
                    this.color = 0xFFFFFF;
                    this.alpha = 1;
                    this.draw();
                });

            return this;
        }

        draw() {
            this.shape.color = this.color;
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
                this.gridText.position.set(this.center.x - 8, this.center.y - 4);
                this.cheatOverlay.addChild(this.gridText);
            }

            this.shape.clear();
            this.shape.lineStyle(0, 0x000000, this.alpha);
            if (this.fill) {
                this.shape.beginFill(this.color, this.alpha);
            }
            this.shape.drawRect(this.corners[0].x, this.corners[0].y, this.size, this.size);
            if (this.fill) {
                this.shape.endFill();
            }
            this.shape.addChild(this.cheatOverlay);
            this.bounds = this.shape.getBounds();

            return this;
        }
    }
    global.CellShape = CellShape;

}(this));
