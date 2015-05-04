// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
(function () {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
				|| window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function (callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function () {
				callback(currTime + timeToCall);
			}, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}

	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function (id) {
			clearTimeout(id);
		};
	}

	/**
	 * Behaves the same as setInterval except uses requestAnimationFrame() where possible for better performance
	 * @param {function} fn The callback function
	 * @param {int} delay The delay in milliseconds
	 */
	window.requestInterval = function (fn, delay) {
		if (!window.requestAnimationFrame &&
				!window.webkitRequestAnimationFrame &&
				!(window.mozRequestAnimationFrame && window.mozCancelRequestAnimationFrame) && // Firefox 5 ships without cancel support
				!window.oRequestAnimationFrame &&
				!window.msRequestAnimationFrame)
			return window.setInterval(fn, delay);

		var start = new Date().getTime(),
				handle = new Object();

		function loop() {
			var current = new Date().getTime(),
					delta = current - start;

			if (delta >= delay) {
				fn.call();
				start = new Date().getTime();
			}

			handle.value = requestAnimFrame(loop);
		}
		;

		handle.value = requestAnimFrame(loop);
		return handle;
	};

	/**
	 * Behaves the same as clearInterval except uses cancelRequestAnimationFrame() where possible for better performance
	 * @param {int|object} fn The callback function
	 */
	window.clearRequestInterval = function (handle) {
		window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) :
				window.webkitCancelAnimationFrame ? window.webkitCancelAnimationFrame(handle.value) :
				window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame(handle.value) : /* Support for legacy API */
				window.mozCancelRequestAnimationFrame ? window.mozCancelRequestAnimationFrame(handle.value) :
				window.oCancelRequestAnimationFrame ? window.oCancelRequestAnimationFrame(handle.value) :
				window.msCancelRequestAnimationFrame ? window.msCancelRequestAnimationFrame(handle.value) :
				clearInterval(handle);
	};

	/**
	 * Behaves the same as setTimeout except uses requestAnimationFrame() where possible for better performance
	 * @param {function} fn The callback function
	 * @param {int} delay The delay in milliseconds
	 */

	window.requestTimeout = function (fn, delay) {
		if (!window.requestAnimationFrame &&
				!window.webkitRequestAnimationFrame &&
				!(window.mozRequestAnimationFrame && window.mozCancelRequestAnimationFrame) && // Firefox 5 ships without cancel support
				!window.oRequestAnimationFrame &&
				!window.msRequestAnimationFrame)
			return window.setTimeout(fn, delay);

		var start = new Date().getTime(),
				handle = new Object();

		function loop() {
			var current = new Date().getTime(),
					delta = current - start;

			delta >= delay ? fn.call() : handle.value = requestAnimFrame(loop);
		}
		;

		handle.value = requestAnimFrame(loop);
		return handle;
	};

	/**
	 * Behaves the same as clearTimeout except uses cancelRequestAnimationFrame() where possible for better performance
	 * @param {int|object} fn The callback function
	 */
	window.clearRequestTimeout = function (handle) {
		window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) :
				window.webkitCancelAnimationFrame ? window.webkitCancelAnimationFrame(handle.value) :
				window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame(handle.value) : /* Support for legacy API */
				window.mozCancelRequestAnimationFrame ? window.mozCancelRequestAnimationFrame(handle.value) :
				window.oCancelRequestAnimationFrame ? window.oCancelRequestAnimationFrame(handle.value) :
				window.msCancelRequestAnimationFrame ? window.msCancelRequestAnimationFrame(handle.value) :
				clearTimeout(handle);
	};
}());