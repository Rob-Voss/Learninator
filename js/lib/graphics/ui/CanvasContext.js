CanvasRenderingContext2D.prototype.addGrid = function (delta, width, height) {
    // define the default values for the optional arguments
    if (!arguments[0])
        delta = 100;
    if (!arguments[1])
        width = 500;
    if (!arguments[2])
        height = 500;

    // draw the vertical and horizontal lines
    this.clearRect(0, 0, width, height);
    this.lineWidth = 0.1;
    this.strokeStyle = 'blue';
    this.font = '8px sans-serif';
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

    // set the text parameters and write the number values to the vertical and horizontal lines
    this.font = '8px sans-serif';
    this.lineWidth = 0.3;

    // 1. writing the numbers to the x axis
    var textY = height - 1; // y-coordinate for the number strings
    for (var i = 0; i * delta <= width - delta; i++) {
        var x = i * delta,
            text = i * delta;
        this.strokeText(text, x, textY);
    }

    // 2. writing the numbers to the y axis
    var textX = width - 15; // x-coordinate for the number strings
    for (var j = 0; j * delta <= height - delta; j++) {
        var y = j * delta,
            text = j * delta;
        this.strokeText(text, textX, y);
    }
};