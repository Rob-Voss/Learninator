var Item = Item || {REVISION: '0.1'};

(function (global) {
	"use strict";

	/**
	 * Item is circle thing on the floor that agent can interact with (see or eat, etc)
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} type
	 * @returns {undefined}
	 */
	var Item = function (x, y, type, rad, w, h) {
		this.pos = new Vec(x, y); // position
		this.w = w || 0; // width of item
		this.h = h || 0; // height of item
		this.type = type; // type of item
		this.rad = rad || 10; // default radius
		this.age = 0;
		this.cleanUp = false;
	};

	global.Item = Item;

}(this));
