var Interactions = Interactions || {};

(function (global) {
	"use strict";

	/**
	 * Holder for interactions with the world
	 * @returns {Interactions}
	 */
	var Interactions = function () {
		if (document.defaultView && document.defaultView.getComputedStyle) {
			this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['paddingLeft'], 10) || 0;
			this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['paddingTop'], 10) || 0;
			this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['borderLeftWidth'], 10) || 0;
			this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['borderTopWidth'], 10) || 0;
		}

		var html = document.body.parentNode;
		this.htmlTop = html.offsetTop;
		this.htmlLeft = html.offsetLeft;

		this.mouse = {};

		// Keep track of when we are dragging
		this.dragging = false;

		// See mousedown and mousemove events for explanation
		this.dragoff = new Vec(0,0);

		// Currently selected object. In the future an array for multiple selection
		this.selection = null;

		// **** Options! ****
		this.selectionColor = '#CC0000';
		this.selectionWidth = 1;

		/**
		 * Event handler
		 * @param {MouseEvent} event
		 * @returns {undefined}
		 */
		function eventHandler(event) {
			event.preventDefault();

			switch(event.type) {
				case 'contextmenu':
					console.log('Right Click');
					break;
				case 'click':
					mouseClick(event);
					break;
				case 'mouseup':
					mouseUp(event);
					break;
				case 'mousedown':
					mouseDown(event);
					break;
				case 'mousemove':
					mouseMove(event);
					break;
				case 'dblclick':
					doubleClick(event);
					break;
				case 'drag':
					console.log('Drag');
					break;
				case 'drop':
					console.log('Drop');
					break;

			}
		};

		// This fixes a problem where double clicking causes text to get selected on the canvas
		this.canvas.addEventListener('selectstart', function (event) {
			event.preventDefault();
			return false;
		});

		// Event Handlers
		this.canvas.addEventListener('contextmenu', eventHandler, false);
		this.canvas.addEventListener('click', eventHandler, false);
		this.canvas.addEventListener('dblclick', eventHandler, false);
		this.canvas.addEventListener('mouseup', eventHandler, false);
		this.canvas.addEventListener('mousedown', eventHandler, false);
		this.canvas.addEventListener('mousemove', mouseMove, false);

		var _this = this;

		/**
		 * Creates an object with x and y defined, set to the mouse position relative
		 * to the state's canvas.
		 * @param {MouseEvent} event
		 * @returns {undefined}
		 */
		function getMouse(event) {
			var element = _this.canvas,
				offset = new Vec(0,0);

			// Compute the total offset
			if (element.offsetParent !== undefined) {
				do {
					offset.x += element.offsetLeft;
					offset.y += element.offsetTop;
				} while ((element = element.offsetParent));
			}

			// Add padding and border style widths to offset
			// Also add the <html> offsets in case there's a position:fixed bar
			offset.x += _this.stylePaddingLeft + _this.styleBorderLeft + _this.htmlLeft;
			offset.y += _this.stylePaddingTop + _this.styleBorderTop + _this.htmlTop;

			// We return a Vec with x and y defined
			_this.mouse.pos = new Vec(event.pageX - offset.x, event.pageY - offset.y);
			_this.mouse.offset = new Vec(offset.x, offset.y);
			_this.mouse.button = event.button;
		};

		/**
		 * Mouse Down
		 * @param {MouseEvent} event
		 * @returns {undefined}
		 */
		function mouseDown(event) {
			getMouse(event);
			if (_this.entities.length > 0) {
				for (var i = _this.entities.length - 1; i >= 0; i--) {
					var entity = _this.entities[i];
					if (entity.contains !== undefined && entity.contains(_this.mouse.pos)) {
						var mySel = entity;
						_this.selection = mySel;
						if (_this.mouse.button === 0) {
							var offX = _this.mouse.pos.x - _this.selection.pos.x,
								offY = _this.mouse.pos.y - _this.selection.pos.y;

							_this.dragoff = new Vec(offX, offY);
							_this.dragging = true;
							return _this.selection.click(event);
						} else {
							_this.dragging = false;
							return _this.selection.contextMenu(event);
						}
					}
				}

				if (_this.selection) {
					_this.selection = null;
					_this.dragging = false;
				}
			} else {
				return _this.click(event);
			}
		};

		/**
		 * Mouse move
		 * @param {MouseEvent} event
		 * @returns {undefined}
		 */
		function mouseMove(event) {
			getMouse(event);
			if (_this.selection) {
				if (_this.dragoff.x !== 0 && _this.dragoff.y !== 0) {
					_this.dragging = true;
					var offX = _this.mouse.pos.x - _this.dragoff.x,
						offY = _this.mouse.pos.y - _this.dragoff.y;

					_this.selection.pos = new Vec(offX, offY);
					_this.dragging = true;
					_this.redraw = false;
					return _this.selection.drag(event);
				}
				_this.dragging = false;
				_this.redraw = true;
			}
			return;
		};

		/**
		 * Mouse release
		 * @param {MouseEvent} event
		 * @returns {undefined}
		 */
		function mouseUp(event) {
			getMouse(event);
			if (_this.selection && _this.dragging) {
				// Set the selection new position
				var offX = _this.mouse.pos.x - _this.dragoff.x,
					offY = _this.mouse.pos.y - _this.dragoff.y;

				_this.selection.pos = new Vec(offX, offY);
				_this.dragging = false;
				_this.redraw = false;
				_this.selection.drop(event);
				_this.selection = null;
				return;
			}
			_this.selection = null;
			return;
		};

		/**
		 * Mouse Click
		 * @param {MouseEvent} event
		 * @returns {undefined}
		 */
		function mouseClick(event) {
			getMouse(event);
			console.log('Mouse Click');
			return;
		};

		/**
		 * Mouse Click
		 * @param {MouseEvent} event
		 * @returns {undefined}
		 */
		function doubleClick(event) {
			getMouse(event);
			console.log('Double Click');
			return;
		};

	};

	global.Interactions = Interactions;

}(this));
