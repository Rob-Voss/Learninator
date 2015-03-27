/**
 * Item is circle thing on the floor that agent can interact with (see or eat, etc)
 * @param {Number} x
 * @param {Number} y
 * @param {Number} type
 * @returns {Item}
 */
var Item = function (x, y, type) {
	this.pos = new Vec(x, y); // position
	this.type = type; // type of item
	this.rad = 5; // default radius
	this.age = 0;
	this.cleanUp = false;
};
