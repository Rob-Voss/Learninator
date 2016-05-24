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
        constructor(v1 = new Vec(0, 0), v2 = new Vec(0, 0), cheats = false, name = null) {
            this.id = Utility.Strings.guid();
            this.name = name || '';
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
            this.cheatsContainer = new PIXI.Container();
            this.shape.addChild(this.cheatsContainer);
            this.fontOpts = {
                font: "12px Arial",
                fill: "#000000",
                align: "center"
            };
            if (this.cheats && this.cheats.id) {
                this.idText = new PIXI.Text(this.id.substring(0, 5), this.fontOpts);
                this.idText.position.set(this.v1.x - 3, this.v1.y - 3);
                this.cheatsContainer.addChild(this.idText);
            }

            if (this.cheats && this.cheats.name) {
                this.nameText = new PIXI.Text(this.name, this.fontOpts);
                this.nameText.position.set(this.v2.x - 3, this.v2.y - 3);
                this.cheatsContainer.addChild(this.nameText);
            }

            if (this.cheats && this.cheats.direction) {
                this.nameText = new PIXI.Text(this.name, this.fontOpts);
                this.nameText.position.set(this.v2.x - 3, this.v2.y - 3);
                this.cheatsContainer.addChild(this.nameText);
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

        /**
         *
         * @returns {Wall}
         */
        draw() {

            return this;
        }
    }

    global.Wall = Wall;

}(this));