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
            this.width = (this.v2.x - this.v1.x <= 0) ? 2 : this.v2.x - this.v1.x;
            this.height = (this.v2.y - this.v1.y <= 0) ? 2 : this.v2.y - this.v1.y;
            this.len = this.v2.distanceTo(this.v1);
            this.angle = this.v2.angleBetween(this.v1);
            this.rotation = this.angle * Math.PI / 180;

            this.shape = new PIXI.Graphics();
            this.shape.clear();
            this.shape.lineStyle(1, 0x000000, 1);
            this.shape.drawRect(this.v1.x, this.v1.y, this.width, this.height);
            this.shape.endFill();
            this.bounds = this.shape.getBounds();

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

                wallText.position.set(this.v1.x + addX, this.v1.y + addY);
                this.cheatsContainer.addChild(wallText);
                this.shape.addChild(this.cheatsContainer);
                this.shape.lineStyle(1, 0xFF0000, 1);
                this.shape.drawRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
                this.shape.endFill();
            }

            return this;
        }
    }

    global.Wall = Wall;

}(this));