var Interactions = Interactions || {};

(function (global) {
	"use strict";

	/**
	 * Holder for interactions with the world
	 * @returns {Interactions}
	 */
	var Interactions = function (canvas) {
		var self = this;
		
		/**
		 * Creates an object with x and y defined, set to the mouse position relative
		 * to the state's canvas. If you wanna be super-correct this can be tricky,
		 * we have to worry about padding and borders
		 * @param {MouseEvent} e
		 * @returns {CanvasState_L3.CanvasState.prototype.getMouse.CanvasStateAnonym$0}
		 */
		this.getMouse = function (e) {
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
			offset.x += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
			offset.y += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

			// We return a Vec with x and y defined
			var mouseLoc = new Vec(e.pageX - offset.x, e.pageY - offset.y);

			return mouseLoc;
		};

		/**
		 * Double click with the mouse
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.doubleClick = function (e) {
			var mouse = self.getMouse(e);
			if (this.selection) {
				console.log('DoubleClicked:' + this.selection.name);
			} else {
				console.log('DoubleClickedWorld');
				this.randItem(mouse.x, mouse.y);
			}
		};
		/**
		 * Mouse click
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.mouseDown = function (e) {
			var mouse = self.getMouse(e);
			// Check for affected items
			for (var i = this.items.length - 1; i >= 0; i--) {
				if (this.items[i].contains(mouse)) {
					var mySel = this.items[i];
					// Keep track of where in the object we clicked
					// so we can move it smoothly (see mousemove)
					this.dragoff.x = mouse.x - mySel.pos.x;
					this.dragoff.y = mouse.y - mySel.pos.y;
					this.dragging = true;
					this.valid = false;
					this.selection = mySel;
					console.log('MouseDownItem:' + this.selection.name);
					console.log('DraggingStart:' + this.selection.name);
					return;
				}
			}

			// Check for affected Agents
			for (var i = this.agents.length - 1; i >= 0; i--) {
				if (this.agents[i].contains(mouse)) {
					var mySel = this.agents[i];
					// Keep track of where in the object we clicked
					// so we can move it smoothly (see mousemove)
					this.dragoff.x = mouse.x - mySel.pos.x;
					this.dragoff.y = mouse.y - mySel.pos.y;
					// No dragging of Agents allowed
					this.dragging = false;
					this.valid = false;
					this.selection = mySel;
					console.log('MouseDownAgent:' + this.selection.name);
					return;
				}
			}
			// If we haven't returned, it means that we have failed to select anything.
			if (this.selection) {
				console.log('ResettingSelection:' + this.selection.name);
				// If there was an object selected, we deselect it
				this.selection = null;
				this.valid = false; // Need to clear the old selection border
			}
		};

		/**
		 * Mouse move
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.mouseMove = function (e) {
			if (this.selection) {
				var mouse = self.getMouse(e);
				if (this.dragging) {
					// We don't want to drag the object by its top-left corner, we want to drag it
					// from where we clicked. Thats why we saved the offset and use it here
					this.selection.pos = new Vec(mouse.x - this.dragoff.x, mouse.y - this.dragoff.y);
					// Something is being dragged so we must redraw
					this.valid = false;
					console.log('Dragging:' + this.selection.name);
				} else {
					console.log('NotDraggingDeselecting:' + this.selection.name);
					this.selection = null;
				}
			}
		};

		/**
		 * Mouse release
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.mouseUp = function (e) {
			if (this.selection) {
				var mouse = self.getMouse(e);
				// Set the selection new position
				this.selection.pos = new Vec(mouse.x - this.dragoff.x, mouse.y - this.dragoff.y);
				console.log('MouseRelease:' + this.selection.name);
			}
			// Reset the dragging flag
			this.dragging = false;
			console.log('DraggingOff');
		};

		// This fixes a problem where double clicking causes text to get selected on the canvas
		canvas.addEventListener('selectstart', function (e) {
			e.preventDefault();
			return false;
		}, false);

		// Double click for making new items
		canvas.addEventListener('dblclick', function (e) {
			self.doubleClick(e);
			if (self.selection)
				self.selection.onDoubleClick(self.selection);
		}, true);

		// Up, down, and move are for dragging
		canvas.addEventListener('mousedown', function (e) {
			self.mouseDown(e);
			if (self.selection)
				self.selection.onClick(self.selection);
		}, true);

		// Track when the mouse selection is let go of
		canvas.addEventListener('mouseup', function (e) {
			self.mouseUp(e);
			if (self.selection && self.dragging)
				self.selection.onDrop(self.selection);
			if (self.selection)
				self.selection.onRelease(self.selection);
		}, true);

		// Track the mouse movement
		canvas.addEventListener('mousemove', function (e) {
			self.mouseMove(e);
			if (self.selection && self.dragging)
				self.selection.onDrag(self.selection);
		}, true);

	};

	global.Interactions = Interactions;

}(this));
