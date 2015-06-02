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
 * The UI Canvas
 * @type {Canvas}
 */
var uiCanvas;

/**
 * Create existance!
 */
function start() {
	worldCanvas = document.getElementById("world_canvas");
	graphCanvas = document.getElementById("graph_canvas");
	uiCanvas = document.getElementById("ui_canvas");;

	var mazeOptions = {
		canvas: worldCanvas,
		horizCells: 4,
		vertCells: 4,
		closed: true
	};
	var maze = new Maze(mazeOptions);

	var worldOptions = {
		canvas: worldCanvas,
		graph: maze.graph,
		walls: maze.walls,
		agents: [new Agent(), new Agent('Worker')]
	};
	W = new World(worldOptions);
	W.rewardGraph = new Graph(graphCanvas, [{'name':'Normal'}, {'name':'Worker'}]);

	// Globals blech
	W.memoryBank = document.getElementById('memoryBank');
	W.brainSpecs = document.getElementById('brainSpecs');
}

function solve() {
	W.redraw = true;
	W.maze.solve();
	W.maze.drawSolution();
	W.pause = true;
}

