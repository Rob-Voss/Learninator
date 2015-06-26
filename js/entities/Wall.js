(function (global) {
    "use strict";

    /**
     * Wall is made up of two Vectors
     * @param {Vec} v1
     * @param {Vec} v2
     * @returns {Wall}
     */
    class Wall {
		constructor(v1, v2) {
            this._v1 = v1;
			this._v2 = v2;
			this.type = 0;

			this.shape = new PIXI.Graphics();

			this.shape.lineStyle(1, 0x0000FF);
			this.shape.moveTo(this._v1.x, this._v1.y);
			this.shape.lineTo(this._v2.x, this._v2.y);
			this.shape.endFill();

			//function Bitmap(src, width, height) {
			//	this.image = new Image();
			//	this.image.src = src;
			//	this.width = width;
			//	this.height = height;
			//}
            //
			//this.wallTexture = new Bitmap('img/Wall.jpg', 1024, 1024);

			return this;
		}

		get v1() {
			return this._v1;
		}

		set v1(value) {
			if (value instanceof Vec) {
				this._v1 = value;
			} else {
				console.log('v1 value is not a Vec');
			}
		}

		get v2() {
			return this._v2;
		}

		set v2(value) {
			if (value instanceof Vec) {
				this._v2 = value;
			} else {
				console.log('v2 value is not a Vec');
			}
		}
	}
	
	global.Wall = Wall;

}(this));
