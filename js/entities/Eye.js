/**
 * Eye sensor has a maximum range and senses walls
 * @param {Number} angle
 * @returns {Eye}
 */
var Eye = function (angle) {
	this.angle = angle; // Angle relative to agent its on
	this.maxRange = 85; // Max range of the eye's vision
	this.sensedProximity = 85; // What the eye is seeing. will be set in world.tick()
	this.sensedType = -1; // what does the eye see?
};

