(function (global) {
    "use strict";

    class Display extends PIXI.Container {

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
        constructor(pos, opts) {
            super();
            this.interactive = true;
            this.layout = new Grid();

            this.displayX = pos.x || 0;
            this.displayY = pos.y || 0;
            this.displayTitle = Utility.getOpt(opts, 'title', "");
            this.displayWidth = Utility.getOpt(opts, 'width', 100);
            this.displayHeight = Utility.getOpt(opts, 'height', 100);
            this.displayRows = Utility.getOpt(opts, 'rows', 2);
            this.displayCols = Utility.getOpt(opts, 'cols', 1);

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
            this.titleText = new PIXI.Text(this.displayTitle, {fontSize: "12px Arial", fill: "#FFFFFF", align: "left"});
            this.titleText.position.set(this.displayX + contentMargin, this.displayY + contentMargin);
            this.addChild(this.titleText);
            this.items = new PIXI.Container();
            for (var y = 0; y < this.displayRows; y++) {
                for (var x = 0; x < this.displayCols; x++) {
                    this.layout = [this.displayCols];
                    this.layout[x] = [this.displayRows];
                    let textObj = new PIXI.Text('R:' + y + 'C:' + x, {fontSize: "10px Arial", fill: "#FF0000"}),
                        colW = (this.displayWidth / this.displayCols) / 2,
                        colH = (this.displayHeight / this.displayRows) / 2,
                        ix = margin + 6 + x * colW,
                        iy = margin + 6 + titleMargin + y * colH;
                    textObj.anchor = new PIXI.Point(0, 0);
                    textObj.position.set(ix, iy);
                    this.items.addChild(textObj);
                    this.layout[x][y] = textObj;
                }
            }
            this.addChild(this.items);

            return this;
        }

        /**
         *
         * @param x
         * @param value
         */
        updateItem(x, value) {
            this.getChildAt(2 + x).text = value;
        }

        /**
         *
         * @param text
         */
        addRow(text) {
            this.addChild(new PIXI.Text(text, {fontSize: "20px Arial", fill: "#FFFFFF"}));
        }

        /**
         *
         * @param text
         */
        addCol(text) {
            this.addChild(new PIXI.Text(text, {fontSize: "20px Arial", fill: "#FFFFFF"}));
        }

        /**
         *
         * @param x
         * @param y
         * @param obj
         * @param callback
         */
        addItem(x, y, obj, callback) {
            this.layout[x][y] = obj;
        }

    }

    global.Display = Display;

}(this));
