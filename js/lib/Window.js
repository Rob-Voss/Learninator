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
	class Window {
		constructor (size, minSize) {
			this.v = [];
			this.size = typeof (size) === 'undefined' ? 100 : size;
			this.minsize = typeof (minSize) === 'undefined' ? 20 : minSize;
			this.sum = 0;
		};

		/**
		 * Add a value
		 * @param {type} x
		 * @returns {undefined}
		 */
		add (x) {
			this.v.push(x);
			this.sum += x;
			if (this.v.length > this.size) {
				var xold = this.v.shift();
				this.sum -= xold;
			}
		};
		
		/**
		 * Get the average of all
		 * @returns {Window_L3.Window.v.length|Number}
		 */
		getAverage () {
			if (this.v.length < this.minsize) {
				return -1;
			} else {
				return this.sum / this.v.length;
			}
		};

		/**
		 * Reset the Window
		 * @returns {undefined}
		 */
		reset () {
			this.v = [];
			this.sum = 0;
		};
	};

	global.Window = Window;

}(this));