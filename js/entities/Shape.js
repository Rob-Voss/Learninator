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
		this.x = v1.x || 0;
		this.y = v1.y || 0;

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

			if (this.type === 'rect' || this.type === 'undefined') {
				ctx.beginPath();
				ctx.rect(this.x, this.y, this.width, this.height);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			} else if(this.type === 'circ') {
				ctx.beginPath();
				ctx.strokeStyle = "black";
				ctx.lineWidth = "2";
				ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.stroke();
				ctx.fill();
			} else if(this.type === 'tria') {
				ctx.beginPath();
				ctx.strokeStyle = "black";
				ctx.lineWidth = "2";
				ctx.moveTo(this.x, this.y);
				ctx.lineTo(this.x + this.width / 2, this.y + this.height);
				ctx.lineTo(this.x - this.width / 2, this.y + this.height);
				ctx.closePath();
				ctx.stroke();
				ctx.fill();
			} else if(this.type === 'bubb') {
				var r = this.x + this.width;
				var b = this.y + this.height;

				ctx.beginPath();
				ctx.strokeStyle = "black";
				ctx.lineWidth = "2";
				ctx.moveTo(this.x + this.radius, this.y);
				ctx.lineTo(this.x + this.radius / 2, this.y - 10);
				ctx.lineTo(this.x + this.radius * 2, this.y);
				ctx.lineTo(r - this.radius, this.y);
				ctx.quadraticCurveTo(r, this.y, r, this.y + this.radius);
				ctx.lineTo(r, this.y + this.height - this.radius);
				ctx.quadraticCurveTo(r, b, r - this.radius, b);
				ctx.lineTo(this.x + this.radius, b);
				ctx.quadraticCurveTo(this.x, b, this.x, b - this.radius);
				ctx.lineTo(this.x, this.y + this.radius);
				ctx.quadraticCurveTo(this.x, this.y, this.x + this.radius, this.y);
				ctx.stroke();
			}
		},
		/**
		 * Determine if a point is inside the shape's bounds
		 * @param {Number} mx
		 * @param {Number} my
		 * @returns {Boolean}
		 */
		contains: function (mx, my) {
			if (this.type === 'rect') {
				return  (this.x <= mx) && (this.x + this.width >= mx) &&
						(this.y <= my) && (this.y + this.height >= my);
			} else if (this.type === 'circ') {
				var v1 = new Vec(mx,my),
					v2 = new Vec(this.x,this.y),
					dist = v1.distFrom(v2);

				return dist < this.radius;
			}
		}
	};

	global.Shape = Shape;

}(this));
