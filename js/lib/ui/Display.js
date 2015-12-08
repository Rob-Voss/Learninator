(function (global) {
    "use strict";

    /**
     * @name Display
     * @constructor
     *
     * @param {Vec} pos
     * @param {Object} opts
     * @param {string} opts.title
     * @param {number} opts.width
     * @param {number} opts.height
     * @param {number} opts.rows
     * @param {number} opts.cols
     * @param {number} opts.render.width
     * @param {number} opts.render.height
     * @constructor
     */
    var Display = function (pos, opts) {
        PIXI.Container.call(this);
        this.interactive = true;

        this.displayX = pos.x || 0;
        this.displayY = pos.y || 0;
        this.displayTitle = Utility.getOpt(opts, 'title', "");
        this.displayWidth = Utility.getOpt(opts, 'width', 100);
        this.displayHeight = Utility.getOpt(opts, 'height', 100);
        this.displayRows = Utility.getOpt(opts, 'rows', 2);
        this.displayCols = Utility.getOpt(opts, 'cols', 1);
        this.renderWidth = Utility.getOpt(opts.render, 'width', 200);
        this.renderHeight = Utility.getOpt(opts.render, 'height', 200);


        // Background and border
        var margin = 4,
            contentMargin = margin + 2,
            titleMargin = 15;
        this.background = new PIXI.Graphics();
        this.background.lineStyle(0, 0x000000, 1);
        this.background.beginFill(0x203040, 1);
        this.background.drawRect(this.displayX + margin, this.displayY + margin, this.displayWidth - margin, this.displayHeight - margin);
        this.background.endFill();
        this.addChild(this.background);

        // Title text
        this.titleText = new PIXI.Text(this.displayTitle, {font: "12px Arial", fill: "#FFFFFF", align: "left"});
        this.titleText.pos.set(this.displayX + contentMargin, this.displayY + contentMargin);
        this.addChild(this.titleText);

        for (var r = 0; r < this.displayRows; r++) {
            for (var c = 0; c < this.displayCols; c++) {
                let textObj = new PIXI.Text('R:' + r + ' C:' + c, {font: "10px Arial", fill: "#FFFFFF"}),
                    colW = (this.displayWidth / this.displayCols) / 2,
                    colH = (this.displayHeight / this.displayRows) / 2,
                    x = margin + 6 + c * colW,
                    y = margin + 6 + titleMargin + r * colH;
                textObj.pos.set(x, y);
                this.addChild(textObj);
            }
        }

    };

    Display.prototype = new PIXI.Container();
    Display.prototype.constructor = Display;

    /**
     *
     * @param x
     * @param value
     */
    Display.prototype.updateItem = function (x, value) {
        let row = this.getChildAt(2 + x);
        row.text = value;
    };

    /**
     *
     */
    Display.prototype.addRow = function () {
        var button = new PIXI.Text(text, {font: "20px Arial", fill: "#FFFFFF"});

        this.addChild(button);
    };

    /**
     *
     */
    Display.prototype.addCol = function () {
        var button = new PIXI.Text(text, {font: "20px Arial", fill: "#FFFFFF"});

        this.addChild(button);
    };

    /**
     *
     * @param x
     * @param y
     * @param obj
     * @param callback
     */
    Display.prototype.addItem = function (x, y, obj, callback) {
        this.layout[x][y] = obj;
    };

    global.Display = Display;

}(this));
