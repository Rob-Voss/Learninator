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

	// We are going to use a maze for the environment and give it three agents
	W = new World(worldCanvas);
	W.maze = new Maze(worldCanvas, 10, 10);
	W.maze.draw();
	W.walls = W.maze.cells;
	W.agents = [new Agent(3)];
	W.rewardGraph = new Graph(graphCanvas, W.agents);

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

