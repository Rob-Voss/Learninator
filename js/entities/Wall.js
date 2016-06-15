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
         * @param {number} direction
         * @param {object} options
         * @returns {Wall}
         */
        constructor(v1 = new Vec(0, 0), v2 = new Vec(0, 0), direction, options) {
            this.id = Utility.Strings.guid();
            this.v1 = v1;
            this.v2 = v2;
            this.options = options || false;
            this.useSprite = options.useSprite || false;
            this.sprite = options.sprite || false;
            this.cheats = options.cheats || false;
            this.direction = direction || 0;
            this.type = 0;
            let tmpAngle = Math.round(this.v1.angleBetween(this.v2, true));
            this.angle = tmpAngle < 0 ? tmpAngle + 360 : tmpAngle;
            this.rotation = this.angle * Math.PI / 180;
            this.len = this.v1.distanceTo(this.v2);
            this.position = this.v1.getPointBetween(this.v2, 50);
            this.width = (this.angle !== 0) ? 5 : this.len;
            this.height = (this.angle !== 0) ? this.len : 5;
            this.fontOpts = {font: "12px Arial", fill: "#000000", align: "center"};

            // Add a container to hold our display cheats
            this.cheatsContainer = new PIXI.Container();
            if (this.useSprite) {
                this.graphics = new PIXI.Sprite.fromFrame(this.sprite);
                this.graphics.anchor.set(0.5, 0.5);
                this.graphics.width = this.width;
                this.graphics.height = this.height;
                // this.graphics.rotation = this.v1.angleBetween(this.v2);
                this.graphics.rotation = this.rotation;
            } else {
                this.graphics = new PIXI.Graphics();
            }
            this.draw();
            this.graphics.addChild(this.cheatsContainer);

            return this;
        }

        addCheats() {
            if (this.cheats.id && this.idText === undefined) {
                this.idText = new PIXI.Text(this.id.substring(0, 6), this.fontOpts);
                this.idText.anchor = new PIXI.Point(0.5, 0.5);
                this.idText.rotation = this.rotation;
                this.idText.position.set(this.position.x, this.position.y);
                this.cheatsContainer.addChild(this.idText);
            }

            if (this.cheats.direction && this.directionText === undefined) {
                this.directionText = new PIXI.Text(this.direction, this.fontOpts);
                this.directionText.anchor = new PIXI.Point(0.5, 0.5);
                this.directionText.rotation = this.rotation;
                this.directionText.position.set(this.position.x + 5, this.position.y + 5);
                this.cheatsContainer.addChild(this.directionText);
            }

            if (this.cheats.angle && this.angleInd === undefined) {
                this.angleInd = new PIXI.Text(Utility.Strings.flt2str(this.angle, 2), this.fontOpts);
                this.angleInd.anchor = new PIXI.Point(0.5, 0.5);
                this.angleInd.rotation = this.rotation;
                this.angleInd.position.set(this.position.x - 5, this.position.y - 5);
                this.cheatsContainer.addChild(this.angleInd);
            }

            return this;
        }

        /**
         *
         * @returns {Wall}
         */
        draw() {
            if (this.useSprite) {
                this.graphics.position.x = this.position.x;
                this.graphics.position.y = this.position.y;
                // this.graphics.rotation = this.v1.angleBetween(this.v2);
                this.graphics.rotation = this.rotation;
            } else {
                this.graphics.clear();
                this.graphics.lineStyle(2, 0x0000FF);
                this.graphics.beginFill(0x000000);
                this.graphics.moveTo(this.v1.x, this.v1.y);
                this.graphics.lineTo(this.v2.x, this.v2.y);
                this.graphics.endFill();
            }
            this.bounds = this.graphics.getBounds();

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