/**
 *
 * @param src
 * @param width
 * @param height
 * @name Bitmap
 * @constructor
 */
function Bitmap(src, width, height) {
    this.image = new Image();
    this.image.src = src;
    this.width = width;
    this.height = height;
}

/**
 *
 * @param size
 * @name Map
 * @constructor
 */
function Map(size) {
    this.size = size * 2;
    this.wallGrid = [];
    for (var i = 0; i < this.size; i++) {
        this.wallGrid.push([]);
        var row = this.wallGrid[i];
        for (var j = 0; j < this.size; j++) {
            row.push([]);
        }
    }
    this.skybox = new Bitmap('img/Sky.jpg', 2000, 750);
    this.wallTexture = new Bitmap('img/Wall.jpg', 1024, 1024);
    this.light = 0;
}

Map.prototype.get = function (x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x > this.size - 1 || y < 0 || y > this.size - 1) {
        return -1;
    }
    return this.wallGrid[x][y];
};

Map.prototype.populate = function (grid) {
    for (var i = 0; i < this.size / 2; i++) {
        for (var j = 0; j < this.size / 2; j++) {
            var con = grid.connectedNeighbors(grid.cells[i][j]),
                disc = grid.disconnectedNeighbors(grid.cells[i][j]);
            for (var z = 0; z < con.length; z++) {
                this.wallGrid[con[z].x + 1][con[z].y + 1] = [1];
            }
        }
    }
};

Map.prototype.randomize = function () {
    for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
            this.wallGrid[i][j] = Math.random() < 0.3 ? 1 : 0;
        }
    }
};

Map.prototype.cast = function (point, angle, range) {
    var self = this;
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    var noWall = {length2: Infinity};

    return ray({
        x: point.x,
        y: point.y,
        height: 0,
        distance: 0
    });

    function ray(origin) {
        var stepX = step(sin, cos, origin.x, origin.y);
        var stepY = step(cos, sin, origin.y, origin.x, true);
        var nextStep = stepX.length2 < stepY.length2
            ? inspect(stepX, 1, 0, origin.distance, stepX.y)
            : inspect(stepY, 0, 1, origin.distance, stepY.x);

        if (nextStep.distance > range) {
            return [origin];
        }
        return [origin].concat(ray(nextStep));
    }

    function step(rise, run, x, y, inverted) {
        if (run === 0) {
            return noWall;
        }
        var dx = run > 0 ? Math.floor(x + 1) - x : Math.ceil(x - 1) - x;
        var dy = dx * (rise / run);
        return {
            x: inverted ? y + dy : x + dx,
            y: inverted ? x + dx : y + dy,
            length2: dx * dx + dy * dy
        };
    }

    function inspect(step, shiftX, shiftY, distance, offset) {
        var dx = cos < 0 ? shiftX : 0;
        var dy = sin < 0 ? shiftY : 0;
        step.height = self.get(step.x - dx, step.y - dy);
        step.distance = distance + Math.sqrt(step.length2);
        if (shiftX) {
            step.shading = cos < 0 ? 2 : 0;
        } else {
            step.shading = sin < 0 ? 2 : 1;
        }
        step.offset = offset - Math.floor(offset);

        return step;
    }
};

Map.prototype.update = function (seconds) {
    if (this.light > 0) {
        this.light = Math.max(this.light - 10 * seconds, 0);
    } else if (Math.random() * 5 < seconds) {
        this.light = 2;
    }
};
