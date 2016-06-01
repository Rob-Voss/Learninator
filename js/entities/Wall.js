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
         * @param {number} direction
         * @returns {Wall}
         */
        constructor(v1 = new Vec(0, 0), v2 = new Vec(0, 0), cheats, direction) {
            this.id = Utility.Strings.guid();
            this.type = 0;
            this.direction = direction || 0;
            this.v1 = v1;
            this.v2 = v2;
            this.cheats = cheats || false;
            this.width = (this.v2.x - this.v1.x <= 0) ? 1 : this.v2.x - this.v1.x;
            this.height = (this.v2.y - this.v1.y <= 0) ? 1 : this.v2.y - this.v1.y;
            this.len = this.v1.distanceTo(this.v2);
            this.angle = this.v1.angleBetween(this.v2);
            this.rotation = this.angle * Math.PI / 180;
            this.shape = new PIXI.Graphics();
            this.fontOpts = {font: "12px Arial", fill: "#000000", align: "center"};

            // Add a container to hold our display cheats
            this.cheatsContainer = new PIXI.Container();
            this.draw();
            this.shape.addChild(this.cheatsContainer);

            return this;
        }

        addCheats() {
            let midWall = this.v1.getPointBetween(this.v2, 50);

            if (this.cheats.id && this.idText === undefined) {
                this.idText = new PIXI.Text(this.id.substring(0, 6), this.fontOpts);
                this.idText.anchor = new PIXI.Point(0.5, 0.5);
                this.idText.rotation = this.angle;
                this.idText.position.set(midWall.x + 4, midWall.y + 4);
                this.cheatsContainer.addChild(this.idText);
            }

            if (this.cheats.direction && this.directionText === undefined) {
                this.directionText = new PIXI.Text(this.direction, this.fontOpts);
                this.directionText.anchor = new PIXI.Point(0.5, 0.5);
                this.directionText.rotation = this.angle;
                this.directionText.position.set(midWall.x + 4, midWall.y + 4);
                this.cheatsContainer.addChild(this.directionText);
            }

            if (this.cheats.angle && this.angleInd === undefined) {
                this.angleInd = new PIXI.Text(Utility.Strings.flt2str(this.angle, 2), this.fontOpts);
                this.angleInd.anchor = new PIXI.Point(0.5, 0.5);
                this.angleInd.rotation = this.angle;
                this.angleInd.position.set(midWall.x + 4, midWall.y + 4);
                this.cheatsContainer.addChild(this.angleInd);
            }

            return this;
        }

        /**
         *
         * @returns {Wall}
         */
        draw() {
            this.shape.clear();
            this.shape.lineStyle(1, 0x000000);
            this.shape.beginFill(0x000000);
            this.shape.moveTo(this.v1.x, this.v1.y);
            this.shape.lineTo(this.v2.x, this.v2.y);
            this.shape.endFill();
            this.bounds = this.shape.getBounds();

            this.updateCheats();

            return this;
        }

        updateCheats() {
            this.addCheats();
            if (this.cheats.id) {
                this.idText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.idText));
                this.idText.text = this.id.substring(0, 6);
            } else {
                if (this.idText !== undefined) {
                    this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(this.idText));
                    this.idText = undefined;
                }
            }

            if (this.cheats.direction) {
                this.directionText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.directionText));
                this.directionText.text = this.direction;
            } else {
                if (this.directionText !== undefined) {
                    this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(this.directionText));
                    this.directionText = undefined;
                }
            }

            if (this.cheats.angle) {
                this.angleInd = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.angleInd));
                this.angleInd.text = Utility.Strings.flt2str(this.angle, 2);
            } else {
                if (this.angleInd !== undefined) {
                    this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(this.angleInd));
                    this.angleInd = undefined;
                }
            }

            return this;
        }
    }
    global.Wall = Wall;

}(this));