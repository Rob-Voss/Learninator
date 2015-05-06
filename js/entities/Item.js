var Item = Item || {};
var Utility = Utility || {};

(function (global) {
	"use strict";

	/**
	 * Item is circle thing on the floor that agent can interact with (see or eat, etc)
	 * @param {String} type
	 * @param {Vec} v
	 * @param {Number} w
	 * @param {Number} h
	 * @param {Number} r
	 * @returns {undefined}
	 */
	var Item = function (type, v, w, h, r) {
		var _this = this;
		this.type = type || 1; // type of item
		this.width = w || 20; // width of item
		this.height = h || 20; // height of item
		this.radius = r || 10; // default radius
		this.pos = v || new Vec(this.radius, this.radius); // position
		this.age = 0;
		this.id = Utility.guid();
		this.cleanUp = false;
		this.fill = '#AAAAAA';
		this.gridLocation = new Vec(0, 0);

		this.image = new Image();
		this.image.onload = imageLoaded;
		this.image.src = (this.type === 1) ? 'img/Nom.png' : 'img/Gnar.png';
		this.dragging = false;
		this.redraw = true;

		function imageLoaded(e) {
			var image = e.target;
			_this.hitArea = new Vec(image.width/2, image.height/2);
		};
	};

	/**
	 *
	 * @type Item
	 */
	Item.prototype = {
		tick: function (world) {
			this.age += 1;
			if (this.age > 5000 && world.clock % 100 === 0 && Utility.randf(0, 1) < 0.1) {
				this.cleanUp = true;
			}
		},
		/**
		 * Check if there was a collision
		 * @param {Object} minRes
		 * @param {Vec} v1
		 * @param {Vec} v2
		 * @returns {Object}
		 */
		collisionCheck: function (minRes, v1, v2) {
			var iResult = Utility.linePointIntersect(v1, v2, this.pos, this.width);
			if (iResult) {
				iResult.type = this.type;
				iResult.id = this.id;
				iResult.radius = this.radius;
				iResult.pos = this.pos;
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
		contains: function (event, mouse) {
			return this.pos.distFrom(mouse.pos) < this.radius;;
		},
		/**
		 * Draws this item to a given context
		 * @param {CanvasRenderingContext2D} ctx
		 * @returns {undefined}
		 */
		draw: function (ctx) {
			if (this.redraw) {
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
		},
		mouseClick: function(e, mouse) {
			console.log('Item Click');
		},
		contextMenu: function(e, mouse) {
			console.log('Item Right Click');
		},
		doubleClick: function(e, mouse) {
			console.log('Item Double Click');
		},
		mouseMove: function(e, mouse) {
			console.log('Item Move');
		},
		mouseUp: function(e, mouse) {
			console.log('Item Release');
		},
		mouseDrag: function(e, mouse) {
			console.log('Item Drag');
		},
		mouseDrop: function(e, mouse) {
			console.log('Item Drop');
		}
	};

	global.Item = Item;

}(this));
