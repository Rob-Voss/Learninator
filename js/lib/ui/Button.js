/**
 *
 * @param canvas
 * @param x
 * @param y
 * @param label
 * @param onclick
 * @constructor
 */
function Button(canvas, x, y, label, onclick) {
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
    this.pos = new Vec(x, y);
    this.label = label;
    this.onclick = onclick;
    this.width = 100;
    this.height = 22;
    this.state = "up";
    this.borderColor = "#999999";
    this.upColor = "#cccccc";
    this.overColor = "#dddddd";
    this.downColor = "#aaaaaa";
    this.draw();
}

/**
 *
 */
Button.prototype.draw = function () {
    // draw border
    this.context.fillStyle = this.borderColor;
    this.context.fillRect(this.pos.x, this.pos.y, this.width, this.height);

    if (this.state === "over") {
        this.context.fillStyle = this.overColor;
    } else if (this.state === "down") {
        this.context.fillStyle = this.downColor;
    } else {
        this.context.fillStyle = this.upColor;
    }
    this.context.fillRect(this.pos.x + 1, this.pos.y + 1, this.width - 2, this.height - 2);

    // draw label
    this.context.font = "12px Arial";
    this.context.fillStyle = "#000000";
    this.context.fillText(this.label, this.pos.x + (this.width - this.context.measureText(this.label).width) / 2, this.pos.y + (this.height + 9) / 2);
};

/**
 *
 * @param e
 * @param mouse
 * @returns {boolean}
 */
Button.prototype.contains = function (e, mouse) {
    if (mouse.pos.x > this.pos.x && mouse.pos.x < this.pos.x + this.width &&
        mouse.pos.y > this.pos.y && mouse.pos.y < this.pos.y + this.height) {
        return true;
    }
    return false;
};

/**
 *
 * @param e
 * @param mouse
 */
Button.prototype.mouseClick = function (e, mouse) {
    if (mouse.pos.x > this.pos.x && mouse.pos.x < this.pos.x + this.width &&
        mouse.pos.y > this.pos.y && mouse.pos.y < this.pos.y + this.height) {
        this.state = "down";
    } else {
        this.state = "up";
    }
    this.draw();
};

/**
 *
 * @param e
 * @param mouse
 */
Button.prototype.mouseUp = function (e, mouse) {
    if (mouse.pos.x > this.pos.x && mouse.pos.x < this.pos.x + this.width &&
        mouse.pos.y > this.pos.y && mouse.pos.y < this.pos.y + this.height) {
        this.state = "over";
        if (this.onclick != null) {
            this.onclick();
        }
        this.mouseClick(e, mouse);
    } else {
        this.state = "up";
    }
    this.draw();
};

/**
 *
 * @param e
 * @param mouse
 */
Button.prototype.mouseMove = function (e, mouse) {
    if (mouse.pos.x > this.pos.x && mouse.pos.x < this.pos.x + this.width &&
        mouse.pos.y > this.pos.y && mouse.pos.y < this.pos.y + this.height) {
        this.state = "over";
    } else {
        this.state = "up";
    }
    this.draw();
};