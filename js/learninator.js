/**
 * Global world object
 * @type {World}
 */
var w;

/**
 * Canvas
 * @type {Canvas}
 */
var worldCanvas;

/**
 * Canvas
 * @type {Canvas}
 */
var graphCanvas;

/**
 * Create existance!
 */
function start() {
	worldCanvas = document.getElementById("world_canvas");
	graphCanvas = document.getElementById("graph_canvas");

	var maze = new Maze(worldCanvas, 8, 8);
	maze.generate();
	maze.draw();

	// We are going to use a maze for the environment and give it three agents
	var walls = maze.cells;
	var agents = [new Agent(1), new Agent(2), new Agent(3)];
	w = new World(worldCanvas, walls, agents);
	w.rewardGraph = new Graph(graphCanvas, w.agents);

	// Globals blech
	w.memoryBank = document.getElementById('memoryBank');
	w.brainSpecs = document.getElementById('brainSpecs');

	w.go('mid');
}

