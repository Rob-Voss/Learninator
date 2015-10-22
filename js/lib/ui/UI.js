var UI = UI || {};

(function (global) {
    "use strict";

    /**
     *
     * @param options
     * @name UI
     * @constructor
     */
    var UI = function (options) {
        this.canvas = options.canvas;
        this.ctx = this.canvas.getContext("2d");
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.horizCells = options.horizCells;
        this.vertCells = options.vertCells;
        this.vW = this.width / this.horizCells;
        this.vH = this.height / this.vertCells;
        this.cellSize = options.cellSize;

        this.entities = [];

        this.clock = 0;
        this.interval = 60;
        this.fill = 'black';

        // When set to true, the canvas will redraw everything
        this.redraw = true;
        this.drawGrid = true;
        this.pause = false;

        var _this = this;

        var button = new Button(this.canvas, this.width - 100, 1, "Click Me", function () {
            console.log('Click');
        });

        this.entities.push(button);

        // Apply the Interactions class to the world
        Interactions.apply(this);

        setInterval(function () {
            if (!_this.pause) {
                _this.tick();
                if (_this.redraw || _this.clock % 50 === 0) {
                    _this.draw();
                }
            }
        }, _this.interval);
    };

    UI.prototype = {
        /**
         * Find the area of a triangle
         * @param {Vec} v1
         * @param {Vec} v2
         * @param {Vec} v3
         * @returns {Number}
         */
        area: function (v1, v2, v3) {
            return Math.abs((v1.x * (v2.y - v3.y) + v2.x * (v3.y - v1.y) + v3.x * (v1.y - v2.y)) / 2.0);
        },
        /**
         * Clear the canvas
         * @returns {undefined}
         */
        clear: function () {
            this.ctx.clearRect(0, 0, this.width, this.height);
        },
        /**
         * Determine if a point is inside the shapes's bounds
         * @param {Vec} v
         * @returns {Boolean}
         */
        contains: function (v) {
            if (this.type === 'tria') {
                var v1 = this.pos,
                    v2 = new Vec(this.pos.x + this.width / 2, this.pos.y + this.height),
                    v3 = new Vec(this.pos.x - this.width / 2, this.pos.y + this.height),
                    A = this.area(v1, v2, v3),
                    A1 = this.area(v, v2, v3),
                    A2 = this.area(v1, v, v3),
                    A3 = this.area(v1, v2, v);
                return (A === A1 + A2 + A3);
            } else if (this.type === 'rect') {
                return (this.pos.x <= v.x) && (this.pos.x + this.width >= v.x) &&
                    (this.pos.y <= v.y) && (this.pos.y + this.height >= v.y);
            } else if (this.type === 1 || this.type === 2 || this.type === 3) {
                var result = this.pos.distFrom(v) < this.radius;

                return result;
            }
        },
        /**
         * Draws this item to a given context
         * @returns {undefined}
         */
        draw: function () {
            this.clear();

            this.ctx.fillStyle = this.fill;
            this.ctx.lineWidth = "1";
            this.ctx.strokeStyle = "black";

            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(this.width, 0);
            this.ctx.lineTo(this.width, this.height);
            this.ctx.lineTo(0, this.height);
            this.ctx.lineTo(0, 0);
            this.ctx.closePath();
            this.ctx.stroke();

            if (this.drawGrid) {
                this.ctx.addGrid(this.cellSize);
            }

            for (var i = this.entities.length - 1; i >= 0; i--) {
                this.entities[i].draw();
            }
        },
        /**
         * Tick the environment
         */
        tick: function () {
            this.clock++;

            // Drop old the items
            if (!this.redraw) {
                this.draw();
            }
        }
    };

    global.UI = UI;

}(this));
