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
		horizCells: 6,
		vertCells: 6
	};
	var maze = new Maze(mazeOptions);

	var worldOptions = {
		canvas: worldCanvas,
		maze: maze,
		walls: maze.cells,
		agents: [new Agent(3), new Agent()],
		horizCells: mazeOptions.horizCells,
		vertCells: mazeOptions.vertCells
	};
	W = new World(worldOptions);
	W.rewardGraph = new Graph(graphCanvas, [{'name':'Worker'}, {'name':'Normal'}]);

//	var uiOptions = {
//		canvas: uiCanvas,
//		cellSize: worldCanvas.width / mazeOptions.horizCells
//	};
//	W.UI = new UI(uiOptions);

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

