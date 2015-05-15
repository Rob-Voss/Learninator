var Utility = Utility || {};

(function (global) {
	"use strict";

	var Utility = {};

	/**
	 * Return a random Float within the range of a-b
	 * @param {Float} a
	 * @param {Float} b
	 * @returns {Number}
	 */
	Utility.randf = function(a, b) {
		return Math.random()*(b-a)+a;
	};

	/**
	 * Return a random Integer within the range of a-b
	 * @param {Float} a
	 * @param {Float} b
	 * @returns {Number}
	 */
	Utility.randi = function(a, b) {
		return Math.floor(Math.random()*(b-a)+a);
	};

	/**
	 * Find an object in the array via id attribute
	 * @param {Array} ar
	 * @param {String} id
	 * @returns {undefined}
	 */
	Utility.findObject = function (ar, id) {
		ar.map(function(el) {
			return el.id;
		}).indexOf(id);
	};

	Utility.getId = function (element, index, array) {
		if (element.id === this) {
			return true;
		}
		return false;
	};

	/**
	 * Return the location within a grid
	 * @param {Object} entity
	 * @param {Array} cells
	 * @param {Number} width
	 * @param {Number} height
	 * @returns {Number}
	 */
	Utility.getGridLocation = function (entity, cells, width, height) {
		for(var h = 0, hCell; hCell = cells[h++];) {
			for(var v = 0, vCell; vCell = hCell[v++];) {
				var topLeft = vCell.x * width,
					topRight = topLeft + width,
					bottomLeft = vCell.y * height,
					bottomRight = bottomLeft + height;
				if ((entity.pos.x >= topLeft && entity.pos.x <= topRight) &&
					(entity.pos.y >= bottomLeft && entity.pos.y <= bottomRight)) {
					return cells[h-1][v-1];
				}
			}
		}
	};

	/**
	 * A helper function to get check for colliding walls/items
	 * @param {Vec} v1
	 * @param {Vec} v2
	 * @param {Array} walls
	 * @param {Array} entities
	 * @returns {Boolean}
	 */
	Utility.collisionCheck = function (v1, v2, walls, entities) {
		var minRes = false;

		// Collide with walls
		if (walls) {
			// @TODO Need to check the current cell first so we
			// don't loop through all the walls
			for (var i = 0, wall; wall = walls[i++];) {
				var wResult = Utility.lineIntersect(v1, v2, wall.v1, wall.v2);
				if (wResult) {
					wResult.type = 0; // 0 is wall
					if (!minRes) {
						minRes = wResult;
					} else {
						// Check if it's closer
						if (wResult.vecX < minRes.vecX) {
							// If yes, replace it
							minRes = wResult;
						}
					}
				}
			}
		}

		// Collide with items
		if (entities) {
			// @TODO Need to check the current cell first so we
			// don't check all the items
			for (var i = 0, entity; entity = entities[i++];) {
				var iResult = Utility.linePointIntersect(v1, v2, entity.pos, entity.radius);
				if (iResult) {
					iResult.type = entity.type;
					iResult.id = entity.id;
					iResult.radius = entity.radius;
					iResult.pos = entity.pos;
					if (!minRes) {
						minRes = iResult;
					} else {
						if (iResult.vecX < minRes.vecX) {
							minRes = iResult;
						}
					}
				}
			}
		}

		return minRes;
	};
	/**
	 * Max and min of an array
	 * @param {Array} a
	 * @returns {Object}
	 */
	Utility.maxmin = function (a) {
		if (a.length === 0) {
			return {};
		}

		var maxv = a[0],
			minv = a[0],
			maxi = 0,
			mini = 0,
			result = {};

		for (var i = 0, item; item = a[i++];) {
			if (item > maxv) {
				maxv = item;
				maxi = i;
			} else if (item < minv) {
				minv = item;
				mini = i;
			}
		}

		result.maxi = maxi;
		result.maxv = maxv;
		result.mini = mini;
		result.minv = minv;
		result.dv = maxv - minv;

		return result;
	};

	/**
	 * Returns string representation of float but truncated to length of d digits
	 * @param {Number} x
	 * @param {Number} d
	 * @returns {String}
	 */
	Utility.flt2str = function (x, d) {
		if (typeof(d) === undefined) {
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
			vecX = 0,
			result = {};

		d = d / v.length();
		if (d > rad) {
			return false;
		}

		v.normalize();
		v.scale(d);

		var vecI = v0.add(v);
		vecX = (Math.abs(y) > Math.abs(x)) ? (vecI.x - v1.x) / (y) : (vecI.y - v1.y) / (x);

		if (vecX > 0.0 && vecX < 1.0) {
			result.vecX = vecX;
			result.vecI = vecI;

			return result;
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
			denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1),
			result = {};

		if (denom === 0.0) {
			// They be parallel lines if it be this yar!
			return false;
		}

		var pX = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom,
			pY = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

		if (pX > 0.0 && pX < 1.0 && pY > 0.0 && pY < 1.0) {
			// Intersection point
			var vecI = new Vec(x1 + pX * (x2 - x1), y1 + pX * (y2 - y1));

			result.vecX = pX;
			result.vecY = pY;
			result.vecI = vecI;

			return result;
		}
		return false;
	};

	/**
	 * Find the area of a triangle
	 * @param {Vec} v1
	 * @param {Vec} v2
	 * @param {Vec} v3
	 * @returns {Number}
	 */
	Utility.area = function (v1, v2, v3) {
		return Math.abs((v1.x * (v2.y - v3.y) + v2.x * (v3.y - v1.y) + v3.x * (v1.y - v2.y)) / 2.0);
	};

	/**
	 * Do stuff
	 * @returns {Number}
	 */
	Utility.S4 = function () {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	};

	/**
	 * Generate a UUID
	 * @returns {String}
	 */
	Utility.guid = function () {
		return (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0,3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
	};

	global.Utility = Utility;

}(this));