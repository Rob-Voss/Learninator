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

	var mazeOptions = {
		canvas: worldCanvas,
		horizCells: 4,
		vertCells: 4
	};
	var maze = new Maze(mazeOptions);

	var worldOptions = {
		canvas: worldCanvas,
		maze: maze,
		walls: maze.cells,
		agents: [new Agent()],
		horizCells: mazeOptions.horizCells,
		vertCells: mazeOptions.vertCells
	};
	W = new World(worldOptions);
	W.rewardGraph = new Graph(graphCanvas, [{'name':'Agent'}]);
	W.UI = new UI(uiCanvas);

	// Globals blech
	W.memoryBank = document.getElementById('memoryBank');
	W.brainSpecs = document.getElementById('brainSpecs');

	W.go('max');
}

function UI() {
	uiCanvas = document.getElementById("ui_canvas");
	var context = uiCanvas.getContext('2d');

	context.addGrid(W.cellSize);

	var button = new Button(uiCanvas, 100, 100, "Click Me", function(){
        context.beginPath();
        context.arc(Math.random() * uiCanvas.width, Math.random() * uiCanvas.height, 5 + Math.random() * 15, 0, Math.PI * 2, false);
        context.fill();
    });

    $("#ui_canvas").mousedown(function(event) {
        button.checkMouseDown(event.pageX - this.offsetLeft, event.pageY - this.offsetTop);
    });

    $("#ui_canvas").mouseup(function(event) {
        button.checkMouseUp(event.pageX - this.offsetLeft, event.pageY - this.offsetTop);
    });

    $("#ui_canvas").mousemove(function(event) {
        button.checkMouseMove(event.pageX - this.offsetLeft, event.pageY - this.offsetTop);
    });
}

function solve() {
	W.redraw = true;
	W.maze.solve();
	W.maze.drawSolution();
	W.pause = true;
}

