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
            this.id = Utility.Strings.guid();
            this.type = 0;
            this.v1 = v1;
            this.v2 = v2;
            this.cheats = cheats;
            this.width = (this.v2.x - this.v1.x <= 0) ? 1 : this.v2.x - this.v1.x;
            this.height = (this.v2.y - this.v1.y <= 0) ? 1 : this.v2.y - this.v1.y;
            this.len = this.v2.distanceTo(this.v1);
            this.angle = this.v2.angleBetween(this.v1);
            this.rotation = this.angle * Math.PI / 180;

            this.shape = new PIXI.Graphics();
            this.draw();

            return this;
        }

        /**
         * 
         * @returns {Wall}
         */
        draw() {
            if (this.cheats) {
                let wallText = new PIXI.Text(this.id.substring(0, 10), {
                    font: "12px Arial",
                    fill: "#000000",
                    align: "center"
                });
                wallText.position.set(this.v1.x, this.v1.y);

                if (this.cheatOverlay !== undefined) {
                    this.shape.removeChild(this.cheatOverlay);
                }
                this.cheatOverlay = new PIXI.Container();
                this.cheatOverlay.addChild(wallText);
                this.shape.addChild(this.cheatOverlay);
            }

            this.shape.clear();
            this.shape.lineStyle(1, 0x000000);
            this.shape.beginFill(0x000000);
            this.shape.moveTo(this.v1.x, this.v1.y);
            this.shape.lineTo(this.v2.x, this.v2.y);
            this.shape.endFill();
            this.bounds = this.shape.getBounds();

            return this;
        }
    }

    global.Wall = Wall;

}(this));