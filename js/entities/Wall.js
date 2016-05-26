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
            this.len = this.v1.distanceTo(this.v2);
            this.angle = this.v1.angleBetween(this.v2);
            this.rotation = this.angle * Math.PI / 180;

            this.shape = new PIXI.Graphics();
            this.cheatsContainer = new PIXI.Container();
            this.fontOpts = {font: "12px Arial", fill: "#000000", align: "center"};

            if (this.cheats && this.cheats.name) {
                this.nameText = new PIXI.Text(this.name, this.fontOpts);
                this.nameText.anchor = new PIXI.Point(0, 0);
                this.nameText.rotation = this.angle;
                let midWall = this.v1.getPointBetween(this.v2, 50);
                this.nameText.position = new PIXI.Point(midWall.x, midWall.y);
                this.shape.addChild(this.nameText);
            }

            if (this.cheats && this.cheats.angle) {
                this.nameText = new PIXI.Text(this.rotation, this.fontOpts);
                let midWall = this.v1.getPointBetween(this.v2, 50);
                this.nameText.position.set(midWall.x - 3, midWall.y - 3);
                this.nameText.angle = this.angle;
                this.cheatsContainer.addChild(this.nameText);
            }
            this.shape.addChild(this.cheatsContainer);

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