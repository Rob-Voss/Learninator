var Window = Window || {};

(function (global) {
    "use strict";

    /**
     * A window stores _size_ number of values and returns averages. Useful for
     * keeping running track of validation or training accuracy during SGD
     * @param {Number} size
     * @param {Number} minSize
     * @returns {undefined}
     */
    var Window = function (size, minSize) {
        this.v = [];
        this.size = size === undefined ? 100 : size;
        this.minsize = minSize === undefined ? 20 : minSize;
        this.sum = 0;

        return this;
    };

    Window.prototype = {

        /**
         * Add a value
         * @param {type} x
         * @returns {undefined}
         */
        add: function (x) {
            this.v.push(x);
            this.sum += x;
            if (this.v.length > this.size) {
                var xold = this.v.shift();
                this.sum -= xold;
            }
        },
        /**
         * Get the average of all
         * @returns {Window_L3.Window.v.length|Number}
         */
        getAverage: function () {
            if (this.v.length < this.minsize) {
                return -1;
            }
            return this.sum / this.v.length;
        },
        /**
         * Reset the Window
         * @returns {undefined}
         */
        reset: function () {
            this.v = [];
            this.sum = 0;
        }
    };

    global.Window = Window;

}(this));