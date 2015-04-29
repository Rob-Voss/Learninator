CanvasRenderingContext2D.prototype.addGrid = function (delta, color, fontParams) {
	// define the default values for the optional arguments
	if (!arguments[0])
		delta = 100;
	if (!arguments[1])
		color = 'blue';
	if (!arguments[2])
		fontParams = '8px sans-serif';

	// extend the canvas width and height by delta
	var width = this.canvas.width;
	var height = this.canvas.height;

	// draw the vertical and horizontal lines
	this.lineWidth = 0.1;
	this.strokeStyle = color;
	this.font = fontParams;
	this.beginPath();

	for (var i = 0; i * delta < width; i++) {
		this.moveTo(i * delta, 0);
		this.lineTo(i * delta, height);
	}

	for (var j = 0; j * delta < height; j++) {
		this.moveTo(0, j * delta);
		this.lineTo(width, j * delta);
	}
	this.closePath();
	this.stroke();

	// draw a thicker line, which is the border of the original canvas
	this.lineWidth = 0.5;
	this.beginPath();
	this.moveTo(0, 0);
	this.lineTo(width, 0);
	this.lineTo(width, height);
	this.lineTo(0, height);
	this.lineTo(0, 0);
	this.closePath();
	this.stroke();

	// set the text parameters and write the number values to the vertical and horizontal lines
	this.font = fontParams;
	this.lineWidth = 0.3;

	// 1. writing the numbers to the x axis
	var textY = height - 1; // y-coordinate for the number strings
	for (var i = 0; i * delta <= width; i++) {
		var x = i * delta,
				text = i * delta;
		this.strokeText(text, x, textY);
	}

	// 2. writing the numbers to the y axis
	var textX = width - 15; // x-coordinate for the number strings
	for (var j = 0; j * delta <= height; j++) {
		var y = j * delta,
				text = j * delta;
		this.strokeText(text, textX, y);
	}
};