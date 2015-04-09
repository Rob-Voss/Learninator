var Shape = Shape || {REVISION: '0.1'};

(function (global) {
	"use strict";

	var Shape = function (x, y, w, h, fill) {
		this.x = x || 0;
		this.y = y || 0;
		this.w = w || 1;
		this.h = h || 1;
		this.fill = fill || '#AAAAAA';
	};

	/**
	 *
	 * @type type
	 */
	Shape.prototype = {
		/**
		 * Draws this shape to a given context
		 * @param {type} ctx
		 * @returns {undefined}
		 */
		draw: function (ctx) {
			ctx.fillStyle = this.fill;
			ctx.fillRect(this.x, this.y, this.w, this.h);
		},
		/**
		 * Determine if a point is inside the shape's bounds
		 * @param {type} mx
		 * @param {type} my
		 * @returns {Boolean}
		 */
		contains: function (mx, my) {
			// All we have to do is make sure the Mouse X,Y fall in the area between
			// the shape's X and (X + Width) and its Y and (Y + Height)
			return  (this.x <= mx) && (this.x + this.w >= mx) &&
					(this.y <= my) && (this.y + this.h >= my);
		}
	};

	global.Shape = Shape;

}(this));

// If you dont want to use <body onLoad='init()'>
// You could uncomment this init() reference and place the script reference inside the body tag
//init();
//
//function init() {
//  var s = new CanvasState(document.getElementById('canvas1'));
//  s.addShape(new Shape(40,40,50,50)); // The default is gray
//  s.addShape(new Shape(60,140,40,60, 'lightskyblue'));
//  // Lets make some partially transparent
//  s.addShape(new Shape(80,150,60,30, 'rgba(127, 255, 212, .5)'));
//  s.addShape(new Shape(125,80,30,80, 'rgba(245, 222, 179, .7)'));
//}

// Now go make something amazing!
