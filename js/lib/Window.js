var Window = Window || {};

(function (global) {
    "use strict";

    /**
     * A window stores _size_ number of values and returns averages. Useful for
     * keeping running track of validation or training accuracy during SGD
     * @name Window
     * @constructor
     *
     * @param {number} size
     * @param {number} minSize
     * @returns {Window}
     */
    let Window = function (size, minSize) {
        this.v = [];
        this.size = size || 100;
        this.minsize = minSize || 20;
        this.sum = 0;

        return this;
    };

    Window.prototype = {
        /**
         * Add a value
         * @param {number} x
         */
        add: function (x) {
            this.v.push(x);
            this.sum += x;
            if (this.v.length > this.size) {
                let xold = this.v.shift();
                this.sum -= xold;
            }
        },
        /**
         * Get the average of all
         * @returns {Number}
         */
        getAverage: function () {
            if (this.v.length < this.minsize) {
                return -1;
            }
            return this.sum / this.v.length;
        },
        /**
         * Reset the Window
         */
        reset: function () {
            this.v = [];
            this.sum = 0;
        }
    };

    global.Window = Window;

}(this));