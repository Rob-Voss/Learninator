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
		this.width = w || 0; // width of item
		this.height = h || 0; // height of item
		this.radius = r || 10; // default radius
		this.pos = v || new Vec(this.radius, this.radius); // position
		this.age = 0;
		this.cleanUp = false;
		this.fill = fill || '#AAAAAA';

		this.types = ['Wall', 'Nom', 'Gnar'];
		this.name = this.types[this.type];
	};

	/**
	 *
	 * @type Item
	 */
	Item.prototype = {
		/**
		 * Draws this item to a given context
		 * @param {CanvasRenderingContext2D} ctx
		 * @returns {undefined}
		 */
		draw: function (ctx) {
			ctx.fillStyle = this.fill;
			ctx.lineWidth = "1";
			ctx.strokeStyle = "black";

			if (this.type === 'rect' || this.type === 'undefined') {
				ctx.beginPath();
				ctx.rect(this.pos.x, this.pos.y, this.width, this.height);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			} else if(this.type === 'circ') {
				ctx.beginPath();
				ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.stroke();
				ctx.fill();
			} else if(this.type === 'tria') {
				ctx.beginPath();
				ctx.moveTo(this.pos.x, this.pos.y);
				ctx.lineTo(this.pos.x + this.width / 2, this.pos.y + this.height);
				ctx.lineTo(this.pos.x - this.width / 2, this.pos.y + this.height);
				ctx.closePath();
				ctx.stroke();
				ctx.fill();
			} else if(this.type === 'bubb') {
				var r = this.pos.x + this.width;
				var b = this.pos.y + this.height;

				ctx.beginPath();
				ctx.moveTo(this.pos.x + this.radius, this.pos.y);
				ctx.lineTo(this.pos.x + this.radius / 2, this.pos.y - 10);
				ctx.lineTo(this.pos.x + this.radius * 2, this.pos.y);
				ctx.lineTo(r - this.radius, this.pos.y);
				ctx.quadraticCurveTo(r, this.pos.y, r, this.pos.y + this.radius);
				ctx.lineTo(r, this.pos.y + this.height - this.radius);
				ctx.quadraticCurveTo(r, b, r - this.radius, b);
				ctx.lineTo(this.pos.x + this.radius, b);
				ctx.quadraticCurveTo(this.pos.x, b, this.pos.x, b - this.radius);
				ctx.lineTo(this.pos.x, this.pos.y + this.radius);
				ctx.quadraticCurveTo(this.pos.x, this.pos.y, this.pos.x + this.radius, this.pos.y);
				ctx.stroke();
			}
		},
		/**
		 * Find the area
		 * @param {Vec} v1
		 * @param {Vec} v2
		 * @param {Vec} v3
		 * @returns {Number}
		 */
		area: function (v1, v2, v3) {
			return Math.abs((v1.x * (v2.y - v3.y) + v2.x * (v3.y - v1.y) + v3.x * (v1.y - v2.y)) / 2.0);
		},
		/**
		 * Determine if a point is inside the shape's bounds
		 * @param {Vec} v
		 * @returns {Boolean}
		 */
		contains: function (v) {
			if (this.type === 'tria') {
				var v1 = this.pos,
					v2 = new Vec(this.pos.x + this.width / 2, this.pos.y + this.height),
					v3 = new Vec(this.pos.x - this.width / 2, this.pos.y + this.height),
					A = this.area(v1, v2, v3),
					A1 = this.area(v, v2, v3),
					A2 = this.area(v1, v, v3),
					A3 = this.area(v1, v2, v);
				return (A === A1 + A2 + A3);
			} else if (this.type === 'rect') {
				return  (this.pos.x <= v.x) && (this.pos.x + this.width >= v.x) &&
						(this.pos.y <= v.y) && (this.pos.y + this.height >= v.y);
			} else if (this.type === 1 || this.type === 2 || this.type === 3) {
				var result = this.pos.distFrom(v) < this.radius;

				return result;
			}
		},
		/**
		 * What to do when clicked
		 * @param {Item} i
		 * @returns {undefined}
		 */
		onClick: function(i) {
			console.log('Click:' + this.types[i.type]);
		},
		/**
		 * What to do when double clicked
		 * @param {Item} i
		 * @returns {undefined}
		 */
		onDoubleClick: function(i) {
			console.log('DoubleClick:' + this.types[i.type]);
		},
		/**
		 * What to do when dragged
		 * @param {Item} i
		 * @returns {undefined}
		 */
		onDrag: function(i) {
			console.log('Drag:' + this.types[i.type]);
		},
		/**
		 * What to do when dropped
		 * @param {Item} i
		 * @returns {undefined}
		 */
		onDrop: function(i) {
			console.log('Drop:' + this.types[i.type]);
		},
		/**
		 * What to do when released
		 * @param {Item} i
		 * @returns {undefined}
		 */
		onRelease: function(i) {
			console.log('Release:' + this.types[i.type]);
		}
	};

	global.Item = Item;

}(this));
