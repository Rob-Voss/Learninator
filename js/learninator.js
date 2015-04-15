/**
 * Global world object
 * @type {World}
 */
var world;

/**
 * The World Canvas
 * @type {HTMLCanvasElement}
 */
var worldCanvas;

/**
 * The Graph Canvas for the charts
 * @type {Canvas}
 */
var graphCanvas;

/**
 * Create existance!
 */
function start() {
	worldCanvas = document.getElementById("world_canvas");
	graphCanvas = document.getElementById("graph_canvas");

	var maze = new Maze(worldCanvas, 3, 3);
	maze.generate();
	maze.draw();

	// We are going to use a maze for the environment and give it three agents
	var walls = maze.cells;
	var agents = [new Agent(3)];
//	agents[0].loadMemory("js/SmartAgent.json");
	world = new World(worldCanvas, walls, agents);
	world.rewardGraph = new Graph(graphCanvas, world.agents);

	// Globals blech
	world.memoryBank = document.getElementById('memoryBank');
	world.brainSpecs = document.getElementById('brainSpecs');

	world.go('mid');
}

function solve() {
	world.valid = true;
	world.go('min');
	world.maze.solve();
}

