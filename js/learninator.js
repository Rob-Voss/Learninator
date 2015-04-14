/**
 * Global world object
 * @type {World}
 */
var world;

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
	world = new World(worldCanvas, walls, agents);
	world.rewardGraph = new Graph(graphCanvas, world.agents);

	// Globals blech
	world.memoryBank = document.getElementById('memoryBank');
	world.brainSpecs = document.getElementById('brainSpecs');

	world.go('mid');
}

