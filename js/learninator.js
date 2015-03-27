/**
 *
 * @type {cnnvis.Graph}
 */
var reward_graph = new cnnvis.Graph();

// Tick the world
function tick() {
	w.tick();
	if (!skipdraw || w.clock % 50 === 0) {
		draw();
		draw_stats();
		draw_net();
	}
}

/**
 * Reload the world, hit reset button on the world
 * @returns {undefined}
 */
function reload() {
	w.agents = [new Agent()]; // this should simply work. I think... ;\
	reward_graph = new cnnvis.Graph(); // reinit
}

/**
 * Global world object
 * @type {World}
 */
var w;

/**
 * Interval id
 * @type {Number}
 */
var current_interval_id;

/**
 *
 * @type {Boolean}
 */
var skipdraw = false;

/**
 * Create existance!
 * @returns {undefined}
 */
function start() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");

	w = new World(canvas);
	w.agents = [new Agent()];
	w.maze = new Maze(canvas);
	w.maze.generate();
	w.maze.draw();

	goslow();
}