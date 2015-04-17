var Interactions = Interactions || {};

(function (global) {
	"use strict";

	/**
	 * Holder for interactions with the world
	 * @returns {Interactions}
	 */
	var Interactions = function (canvas) {
		var self = this;
		self.mouse = {};

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
			self.mouse.pos = new Vec(e.pageX - offset.x, e.pageY - offset.y);
			self.mouse.button = e.button;
		};

		/**
		 * Double click with the mouse
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.doubleClick = function (e) {
			if (this.selection) {
				this.selection.onDoubleClick(this.selection);
			} else {
				this.onDoubleClick(self.mouse);
			}
		};

		/**
		 * Mouse Down
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.mouseDown = function (e) {
			// Check for affected items
			for (var i = this.items.length - 1; i >= 0; i--) {
				if (this.items[i].contains(self.mouse.pos)) {
					var mySel = this.items[i];
					this.selection = mySel;
					if (self.mouse.button === 0) {
						this.dragging = true;
						return this.selection.onClick(self.mouse.pos);
					}
					return;
				}
			}

			// Check for affected Agents
			for (var i = this.agents.length - 1; i >= 0; i--) {
				if (this.agents[i].contains(self.mouse.pos)) {
					var mySel = this.agents[i];
					this.selection = mySel;
					if (self.mouse.button === 0) {
						return this.selection.onClick(self.mouse.pos);
					}
					return;
				}
			}

			if (this.selection) {
				this.selection = null;
				this.dragging = false;
			}
		};

		/**
		 * Mouse move
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.mouseMove = function (e) {
			if (this.selection) {
				if (this.dragoff.x !== 0 && this.dragoff.y !== 0) {
					this.dragging = true;
					// Keep track of where in the object we clicked
					// so we can move it smoothly (see mousemove)
					var offX = self.mouse.pos.x - this.dragoff.x,
						offY = self.mouse.pos.y - this.dragoff.y;

					this.selection.pos = new Vec(offX, offY);
					this.valid = false;
				} else {
					this.dragging = false;
					this.valid = true;
				}
				return this.selection.onDrag(this.selection);
			}
			this.dragging = false;
		};

		/**
		 * Mouse release
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.mouseUp = function (e) {
			if (this.selection && this.dragging) {
				// Set the selection new position
				var offX = self.mouse.pos.x - this.dragoff.x,
					offY = self.mouse.pos.y - this.dragoff.y;
				this.selection.pos = new Vec(offX, offY);
				this.selection.onDrop(this.selection);
			}
			// Reset the dragging flag
			this.dragging = false;
			this.selection = null;
			this.valid = false;
		};

		/**
		 * Right click with the mouse
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.rightClick = function (e) {
			if (this.selection) {
				this.selection.onRightClick(this.selection);
			} else {
				this.onRightClick();
			}
		};

		// This fixes a problem where double clicking causes text to get selected on the canvas
		canvas.addEventListener('selectstart', function (e) {
			e.preventDefault();
			return false;
		}, false);

		// Double click for making new items
		canvas.addEventListener('dblclick', function (e) {
			self.getMouse(e);
			self.doubleClick(e);
		}, true);

		// Right click
		canvas.addEventListener('contextmenu', function (e) {
			e.preventDefault();
			self.getMouse(e);
			self.rightClick(e);
		}, true);

		// Up, down, and move are for dragging
		canvas.addEventListener('mousedown', function (e) {
			self.getMouse(e);
			self.mouseDown(e);
		}, true);

		// Track when the mouse selection is let go of
		canvas.addEventListener('mouseup', function (e) {
			self.getMouse(e);
			self.mouseUp(e);
		}, true);

		// Track the mouse movement
		canvas.addEventListener('mousemove', function (e) {
			self.getMouse(e);
			self.mouseMove(e);
		}, true);

	};

	global.Interactions = Interactions;

}(this));
