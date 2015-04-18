/**
 * Global world object
 * @type {World}
 */
var W = W || {};

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

	var maze = new Maze(worldCanvas, 3, 3, true);

	// We are going to use a maze for the environment and give it three agents
	W = new World(worldCanvas, maze.cells, [new Agent(3)]);

	W.rewardGraph = new Graph(graphCanvas, [{'name':'Agent'}]);

	// Globals blech
	W.memoryBank = document.getElementById('memoryBank');
	W.brainSpecs = document.getElementById('brainSpecs');

	W.go('mid');
}

function solve() {
	W.valid = true;
	W.go('min');
	W.maze.solve();
}

