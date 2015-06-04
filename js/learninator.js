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
	displayCanvas = document.getElementById("display_canvas");;

	var mazeOptions = {
		canvas: worldCanvas,
		horizCells: 10,
		vertCells: 10,
		closed: true
	};
	var maze = new Maze(mazeOptions);

	var worldOptions = {
		canvas: worldCanvas,
		displayCanvas: displayCanvas,
		raycast: true,
		grid: maze.grid,
		walls: maze.walls,
		rewardGraph: new Graph(graphCanvas, [{'name':'Normal'}/*, {'name':'Worker'}, {'name':'Worker'}, {'name':'Worker'}*/]),
		agents: [new Agent()/*, new Agent('Worker'), new Agent('Worker'), new Agent('Worker')*/]
	};
	W = new World(worldOptions);

	// Globals blech
	W.memoryBank = document.getElementById('memoryBank');
	W.brainSpecs = document.getElementById('brainSpecs');
}
