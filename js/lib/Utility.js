var Utility = Utility || {REVISION: '0.1'};

(function (global) {
	"use strict";

	/**
	 * Returns string representation of float but truncated to length of d digits
	 * @param {Number} x
	 * @param {Number} d
	 * @returns {String}
	 */
	Utility.flt2str = function (x, d) {
		if (typeof (d) === 'undefined') {
			var d = 5;
		}
		var dd = 1.0 * Math.pow(10, d);

		return '' + Math.floor(x * dd) / dd;
	};
	/**
	 * Find the position of intersect between a line and a point
	 * @param {Vec} v1
	 * @param {Vec} v2
	 * @param {Vec} v0
	 * @param {Number} rad
	 * @returns {Object|Boolean}
	 */
	Utility.linePointIntersect = function (v1, v2, v0, rad) {
		// Create a perpendicular vector
		var x = v2.y - v1.y,
			y = v2.x - v1.x,
			xDiff = v1.y - v0.y,
			yDiff = v1.x - v0.x,
			v = new Vec(x, -y),
			d = Math.abs(y * xDiff - yDiff * x),
			vecX = 0;

		d = d / v.length();
		if (d > rad) {
			return false;
		}

		v.normalize();
		v.scale(d);

		var vecI = v0.add(v);
		if (Math.abs(y) > Math.abs(x)) {
			vecX = (vecI.x - v1.x) / (y);
		} else {
			vecX = (vecI.y - v1.y) / (x);
		}
		if (vecX > 0.0 && vecX < 1.0) {
			return {
				vecX: vecX,
				vecI: vecI
			};
		}
		return false;
	};
	/**
	 * Line intersection helper function: line segment (v1,v2) intersect segment (v3,v4)
	 * @param {Vec} v1
	 * @param {Vec} v2
	 * @param {Vec} v3
	 * @param {Vec} v4
	 * @returns {Object|Boolean}
	 */
	Utility.lineIntersect = function (v1, v2, v3, v4) {
		// Line 1: 1st Point
		var x1 = v1.x,
			y1 = v1.y,
			// Line 1: 2nd Point
			x2 = v2.x,
			y2 = v2.y,
			// Line 2: 1st Point
			x3 = v3.x,
			y3 = v3.y,
			// Line 2: 2nd Point
			x4 = v4.x,
			y4 = v4.y,
			denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

		if (denom === 0.0) {
			// Parallel lines if it be this yar!
			return false;
		}

		var pX = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom,
			pY = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

		if (pX > 0.0 && pX < 1.0 && pY > 0.0 && pY < 1.0) {
			// Intersection point
			var vecI = new Vec(x1 + pX * (x2 - x1), y1 + pX * (y2 - y1));

			return {
				vecX: pX,
				vecY: pY,
				vecI: vecI
			};
		}
		return false;
	};
	/**
	 * Add a box
	 * @param {List} lst
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} w
	 * @param {Number} h
	 * @returns {List}
	 */
	Utility.utilAddBox = function (lst, x, y, w, h) {
		var xw = x + w,
			yh = y + h;

		lst.push(new Wall(new Vec(x, y), new Vec(xw, y)));
		lst.push(new Wall(new Vec(xw, y), new Vec(xw, yh)));
		lst.push(new Wall(new Vec(xw, yh), new Vec(x, yh)));
		lst.push(new Wall(new Vec(x, yh), new Vec(x, y)));

		return lst;
	};

	global.Utility = Utility;

}(this));