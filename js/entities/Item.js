var Item = Item || {};

(function (global) {
	"use strict";

	/**
	 * Item is circle thing on the floor that agent can interact with (see or eat, etc)
	 * @param {String} type
	 * @param {Vec} v
	 * @param {Number} w
	 * @param {Number} h
	 * @param {Number} r
	 * @param {String} fill
	 * @returns {undefined}
	 */
	var Item = function (type, v, w, h, r, fill) {
		this.type = type || 1; // type of item
		this.width = w || 20; // width of item
		this.height = h || 20; // height of item
		this.radius = r || 10; // default radius
		this.pos = v || new Vec(this.radius, this.radius); // position
		this.age = 0;
		this.cleanUp = false;
		this.fill = fill || '#AAAAAA';
		this.image = new Image();
		this.image.src = (this.type === 1) ? 'img/Apple.png' : 'img/Poison.png';
		this.name = '';
		this.dragging = false;
		this.valid = false;

		/**
		 * What to do when clicked
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.click = function(e) {
			console.log('Item Click:' + this.type);
			return;
		};

		/**
		 * What to do when right clicked
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.contextMenu = function(e) {
			console.log('Item Right Click:' + this.type);
		};

		/**
		 * What to do when double clicked
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.doubleClick = function(e) {
			console.log('Item Double Click:' + this.type);
		};

		/**
		 * What to do when dragged
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.drag = function(e) {
			console.log('Item Drag:' + this.type);
		};

		/**
		 * What to do when dropped
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.drop = function(e) {
			console.log('Item Drop:' + this.type);
		};

	};

	/**
	 *
	 * @type Item
	 */
	Item.prototype = {
		/**
		 * Find the area of a triangle
		 * @param {Vec} v1
		 * @param {Vec} v2
		 * @param {Vec} v3
		 * @returns {Number}
		 */
		area: function (v1, v2, v3) {
			return Math.abs((v1.x * (v2.y - v3.y) + v2.x * (v3.y - v1.y) + v3.x * (v1.y - v2.y)) / 2.0);
		},
		/**
		 * Check if there was a collision
		 * @param {Object} minRes
		 * @param {Vec} v1
		 * @param {Vec} v2
		 * @returns {Object}
		 */
		collisionCheck: function (minRes, v1, v2) {
			var iResult = Utility.linePointIntersect(v1, v2, this.pos, this.radius);
			if (iResult) {
				iResult.type = this.type; // Store type of item
				if (!minRes) {
					minRes = iResult;
				} else {
					if (iResult.vecX < minRes.vecX) {
						minRes = iResult;
					}
				}
			}
			return minRes;
		},
		/**
		 * Determine if a point is inside the shape's bounds
		 * @param {Vec} v
		 * @returns {Boolean}
		 */
		contains: function (v) {
			var result = this.pos.distFrom(v) < this.radius;
			return result;
		},
		/**
		 * Draws this item to a given context
		 * @param {CanvasRenderingContext2D} ctx
		 * @returns {undefined}
		 */
		draw: function (ctx) {
			if (!this.valid) {
				ctx.fillStyle = this.fill;
				ctx.lineWidth = "1";
				ctx.strokeStyle = "black";
				if (this.image) {
					ctx.drawImage(this.image, this.pos.x - this.radius, this.pos.y - this.radius, this.width, this.height);
				} else {
					if (this.type === 1)
						ctx.fillStyle = "rgb(255, 150, 150)";
					if (this.type === 2)
						ctx.fillStyle = "rgb(150, 255, 150)";
					ctx.strokeStyle = "rgb(0,0,0)";
					ctx.beginPath();
					ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
					ctx.fill();
					ctx.stroke();
				}
			}
		}
	};

	global.Item = Item;

}(this));
