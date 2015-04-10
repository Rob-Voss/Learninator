var CanvasState = CanvasState || {REVISION: '0.1'};

(function (global) {
	"use strict";

	var CanvasState = function (canvas) {
		this.canvas = canvas;
		this.width = this.canvas.width;
		this.height = this.canvas.height;
		this.ctx = this.canvas.getContext('2d');

		// This complicates things a little but but fixes mouse co-ordinate problems
		// when there's a border or padding. See getMouse for more detail
		var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
		if (document.defaultView && document.defaultView.getComputedStyle) {
			this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
			this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
			this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
			this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;
		}

		// Some pages have fixed-position bars at the top or left of the page
		// They will mess up mouse coordinates and this fixes that
		var html = document.body.parentNode;
		this.htmlTop = html.offsetTop;
		this.htmlLeft = html.offsetLeft;

		this.valid = false; // When set to false, the canvas will redraw everything
		this.shapes = []; // The collection of things to be drawn
		this.dragging = false; // Keep track of when we are dragging
		// Currently selected object. In the future an array for multiple selection
		this.selection = null;
		this.dragoff = new Vec(0,0); // See mousedown and mousemove events for explanation

		var myState = this;

		// This fixes a problem where double clicking causes text to get selected on the canvas
		canvas.addEventListener('selectstart', function (e) {
			e.preventDefault();
			return false;
		}, false);

		// Up, down, and move are for dragging
		canvas.addEventListener('mousedown', function (e) {
			myState.mouseDown(e);
		}, true);

		// Track the mouse movement
		canvas.addEventListener('mousemove', function (e) {
			myState.mouseMove(e);
		}, true);

		// Track when the mouse selection is let go of
		canvas.addEventListener('mouseup', function (e) {
			myState.mouseUp(e);
		}, true);

		// Double click for making new shapes
		canvas.addEventListener('dblclick', function (e) {
			myState.doubleClick(e);
		}, true);

		// **** Options! ****
		this.selectionColor = '#CC0000';
		this.selectionWidth = 1;
		this.interval = 30;

		setInterval(function () {
			myState.draw();
		}, myState.interval);
	};

	CanvasState.prototype = {
		/**
		 * Mouse move
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		mouseMove: function (e) {
			if (this.dragging) {
				var mouse = this.getMouse(e);
				// We don't want to drag the object by its top-left corner, we want to drag it
				// from where we clicked. Thats why we saved the offset and use it here
				this.selection = new Vec(mouse.x - this.dragoff.x, mouse.y - this.dragoff.y);
				this.valid = false; // Something's dragging so we must redraw
			}
		},
		/**
		 * Mouse release
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		mouseUp: function (e) {
			this.dragging = false;
		},
		/**
		 * Mouse click
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		mouseDown: function (e) {
			var mouse = this.getMouse(e),
				v = new Vec(mouse.x, mouse.y),
				l = this.shapes.length;
			for (var i = l - 1; i >= 0; i--) {
				if (this.shapes[i].contains(v)) {
					var mySel = this.shapes[i].pos;
					// Keep track of where in the object we clicked
					// so we can move it smoothly (see mousemove)
					this.dragoff.x = v.x - mySel.x;
					this.dragoff.y = v.y - mySel.y;
					this.dragging = true;
					this.selection = mySel;
					this.valid = false;
					return;
				}
			}
			// If we haven't returned, it means that we have failed to select anything.
			if (this.selection) {
				// If there was an object selected, we deselect it
				this.selection = null;
				this.valid = false; // Need to clear the old selection border
			}
		},
		/**
		 * Double click with the mouse
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		doubleClick: function (e) {
			var mouse = this.getMouse(e);
			this.addShape(new Shape('rect', new Vec(mouse.x - 10, mouse.y - 10), 20, 20, 0, 'rgba(0,255,0,.6)'));
		},
		/**
		 * Add a shape to the canvas
		 * @param {Shape} shape
		 * @returns {undefined}
		 */
		addShape: function (shape) {
			this.shapes.push(shape);
			this.valid = false;
		},
		/**
		 * Clear the canvas
		 * @returns {undefined}
		 */
		clear: function () {
			this.ctx.clearRect(0, 0, this.width, this.height);
		},
		/**
		 * While draw is called as often as the INTERVAL variable demands, It
		 * only ever does something if the canvas gets invalidated by our code
		 * @returns {undefined}
		 */
		draw: function () {
			// if our state is invalid, redraw and validate!
			if (!this.valid) {
				var ctx = this.ctx;
				var shapes = this.shapes;
				this.clear();

				// ** Add stuff you want drawn in the background all the time here **

				// Draw all shapes
				var l = shapes.length;
				for (var i = 0; i < l; i++) {
					var shape = shapes[i];
					// We can skip the drawing of elements that have moved off the screen:
					if (shape.pos.x > this.width ||
							shape.pos.y > this.height ||
							shape.pos.x + shape.width < 0 ||
							shape.pos.y + shape.height < 0) {
						continue;
					}
					shapes[i].draw(ctx);
				}

				// Highlight the selection
				// Right now this is just a stroke along the edge of the selected Shape
				if (this.selection !== null) {
					ctx.strokeStyle = this.selectionColor;
					ctx.lineWidth = this.selectionWidth;
					var mySel = this.selection;
					ctx.strokeRect(mySel.x, mySel.y, mySel.width, mySel.height);
				}

				// ** Add stuff you want drawn on top all the time here **

				this.valid = true;
			}
		},
		/**
		 * Creates an object with x and y defined, set to the mouse position relative
		 * to the state's canvas. If you wanna be super-correct this can be tricky,
		 * we have to worry about padding and borders
		 * @param {MouseEvent} e
		 * @returns {CanvasState_L3.CanvasState.prototype.getMouse.CanvasStateAnonym$0}
		 */
		getMouse: function (e) {
			var element = this.canvas, 
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
			offset.x += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
			offset.y += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

			// We return a simple javascript object (a hash) with x and y defined
			var mouseLoc = new Vec(e.pageX - offset.x, e.pageY - offset.y);
			
			return mouseLoc;
		}
	};

	global.CanvasState = CanvasState;

}(this));
