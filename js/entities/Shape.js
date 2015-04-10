var Shape = Shape || {REVISION: '0.1'};

(function (global) {
	"use strict";

	/**
	 * Create a shape
	 * @param {String} t
	 * @param {Vec} v1
	 * @param {Number} w
	 * @param {Number} h
	 * @param {Number} r
	 * @param {String} fill
	 * @returns {Shape_L3.Shape}
	 */
	var Shape = function (t, v1, w, h, r, fill) {
		this.pos = v1 || new Vec(0,0); // position

		this.type = t || undefined;
		this.width = w || 0;
		this.height = h || 0;
		this.radius = r || 0;

		this.fill = fill || '#AAAAAA';
	};

	/**
	 *
	 * @type Shape
	 */
	Shape.prototype = {
		/**
		 * Draws this shape to a given context
		 * @param {CanvasRenderingContext2D} ctx
		 * @returns {undefined}
		 */
		draw: function (ctx) {
			ctx.fillStyle = this.fill;
			ctx.strokeStyle = "black";
			ctx.lineWidth = "1";

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
		 * Determine if a point is inside the shape's bounds
		 * @param {Vec} v1
		 * @returns {Boolean}
		 */
		contains: function (v1) {
			if (this.type === 'rect' || this.type === 'bubb') {
				var dist = (this.pos.x <= v1.x) && 
						(this.pos.x + this.width >= v1.x) &&
						(this.pos.y <= v1.y) && 
						(this.pos.y + this.height >= v1.y);
				return dist;
			} else if (this.type === 'circ') {
				var dist = v1.distFrom(this.pos) < this.radius;
				return dist;
			}
		}
	};

	global.Shape = Shape;

}(this));
