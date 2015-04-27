var Interactions = Interactions || {};

(function (global) {
	"use strict";

	/**
	 * Holder for interactions with the world
	 * @returns {Interactions}
	 */
	var Interactions = function (canvas) {
		// Some pages have fixed-position bars at the top or left of the page
		// They will mess up mouse coordinates and this fixes that
		var html = document.body.parentNode;
		// This complicates things a little but but fixes mouse co-ordinate problems
		// when there's a border or padding. See getMouse for more detail
		var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
		if (document.defaultView && document.defaultView.getComputedStyle) {
			this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['paddingLeft'], 10) || 0;
			this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['paddingTop'], 10) || 0;
			this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['borderLeftWidth'], 10) || 0;
			this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['borderTopWidth'], 10) || 0;
		}

		this.htmlTop = html.offsetTop;
		this.htmlLeft = html.offsetLeft;

		var self = this;
		self.mouse = {};

		// Keep track of when we are dragging
		this.dragging = false;

		// See mousedown and mousemove events for explanation
		this.dragoff = new Vec(0,0);

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
					console.log('Double Click');
					break;
				case 'drag':
					console.log('Drag');
					break;
				case 'drop':
					console.log('Drop');
					break;

			}
		};

		/**
		 * Creates an object with x and y defined, set to the mouse position relative
		 * to the state's canvas. If you wanna be super-correct this can be tricky,
		 * we have to worry about padding and borders
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		function getMouse(e) {
			var element = canvas,
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
			offset.x += self.stylePaddingLeft + self.styleBorderLeft + self.htmlLeft;
			offset.y += self.stylePaddingTop + self.styleBorderTop + self.htmlTop;

			// We return a Vec with x and y defined
			self.mouse.pos = new Vec(e.pageX - offset.x, e.pageY - offset.y);
			self.mouse.offset = new Vec(offset.x, offset.y);
			self.mouse.button = e.button;
		};

		/**
		 * Mouse Down
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		function mouseDown(e) {
			getMouse(e);
			if (self.entities.length > 0) {
				for (var i = self.entities.length - 1; i >= 0; i--) {
					var entity = self.entities[i];
					if (entity.contains !== undefined && entity.contains(self.mouse.pos)) {
						var mySel = entity;
						self.selection = mySel;
						if (self.mouse.button === 0) {
							var offX = self.mouse.pos.x - self.selection.pos.x,
								offY = self.mouse.pos.y - self.selection.pos.y;

							self.dragoff = new Vec(offX, offY);
							self.dragging = true;
							return self.selection.click(e);
						} else {
							self.dragging = false;
							return self.selection.contextMenu(e);
						}
					}
				}

				if (self.selection) {
					self.selection = null;
					self.dragging = false;
				}
			} else {
				return self.click(e);
			}
		};

		/**
		 * Mouse move
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		function mouseMove(e) {
			getMouse(e);
			console.log("Mouse at " + e.pageX + ", " + e.pageY);
			if (self.selection) {
				if (self.dragoff.x !== 0 && self.dragoff.y !== 0) {
					self.dragging = true;
					// Keep track of where in the object we clicked
					// so we can move it smoothly (see mousemove)
					var offX = self.mouse.pos.x - self.dragoff.x,
						offY = self.mouse.pos.y - self.dragoff.y;

					self.selection.pos = new Vec(offX, offY);
					self.dragging = true;
					self.redraw = false;
					return self.selection.drag(e);
				}
				self.dragging = false;
				self.redraw = true;
			}
			return;
		};

		/**
		 * Mouse release
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		function mouseUp(e) {
			getMouse(e);
			if (self.selection) {
				if (self.dragging) {
					// Set the selection new position
					var offX = self.mouse.pos.x - self.dragoff.x,
						offY = self.mouse.pos.y - self.dragoff.y;

					self.selection.pos = new Vec(offX, offY);
					self.dragging = false;
					self.redraw = false;
					self.selection.drop(e);
					self.selection = null;
					return;
				}
			}
			return;
		};

		/**
		 * Mouse Click
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		function mouseClick(e) {
			getMouse(e);
			if (self.selection) {
				console.log('Mouse Click');
			}
			return;
		};

		function mouseMoved(event) {
			console.log("Mouse at " + event.pageX + ", " + event.pageY);
//			lastEvent = event;
//			if (!scheduled) {
//				scheduled = true;
//				setTimeout(function () {
//					scheduled = false;
//					displayCoords(event);
//				}, 250);
//			}
		}

		// This fixes a problem where double clicking causes text to get selected on the canvas
		canvas.addEventListener('selectstart', function (e) {
			e.preventDefault();
			return false;
		});

		// Event Handlers
		canvas.addEventListener('contextmenu', eventHandler, false);
		canvas.addEventListener('click', eventHandler, false);
		canvas.addEventListener('dblclick', eventHandler, false);
		canvas.addEventListener('mouseup', eventHandler, false);
		canvas.addEventListener('mousedown', eventHandler, false);
		canvas.addEventListener('mousemove', mouseMove, false);
	};

	global.Interactions = Interactions;

}(this));
