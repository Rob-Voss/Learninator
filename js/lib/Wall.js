(function (global) {
    "use strict";

    class Wall {
        /**
         * Wall is made up of two Vectors
         * @name Wall
         * @constructor
         *
         * @param {Vec} v1
         * @param {Vec} v2
         * @param {boolean} cheats
         * @returns {Wall}
         */
        constructor(v1 = new Vec(0, 0), v2 = new Vec(0, 0), cheats = false) {
            this.id = Utility.guid();
            this.type = 0;
            this.v1 = v1;
            this.v2 = v2;
            this.position = this.v2.pointBetween(this.v1, 50);
            this.width = (this.v2.x - this.v1.x <= 0) ? 2 : this.v2.x - this.v1.x;
            this.height = (this.v2.y - this.v1.y <= 0) ? 2 : this.v2.y - this.v1.y;
            this.len = this.v2.distanceTo(this.v1);
            this.angle = this.v2.angleBetween(this.v1);
            this.rotation = this.angle  * Math.PI / 180;

            this.shape = new PIXI.Graphics();
            this.shape.clear();
            this.shape.lineStyle(1, 0x000000, 1);
            this.shape.moveTo(this.v1.x, this.v1.y);
            this.shape.lineTo(this.v2.x, this.v2.y);
            this.shape.endFill();
            if (cheats) {
                this.cheatsContainer = new PIXI.Container();
                let wallText = new PIXI.Text(this.id.substring(0, 10), {
                        font: "12px Arial",
                        fill: "#000000",
                        align: "center"
                    }),
                    angle = (this.angle < 0) ? this.angle * -1 : this.angle * 1,
                    addX = (angle === 90) ? ((this.v1.x === 600) ? -6 : 6) : 0,
                    addY = (angle === 180 || angle === 0) ? ((this.v1.y === 600) ? -6 : 6) : 0;
                wallText.anchor.x = wallText.anchor.y = 0.5;
                wallText.rotation = ((angle === 180) ? 0 : angle) * Math.PI / 180;

                wallText.position.set(this.position.x + addX, this.position.y + addY);
                this.cheatsContainer.addChild(wallText);
                this.shape.addChild(this.cheatsContainer);
            }

            return this;
        }
    }

    global.Wall = Wall;

}(this));