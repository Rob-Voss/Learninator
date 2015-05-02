var UI = UI || {};

(function (global) {
	"use strict";

	var UI = function () {
		this.ctx = this.canvas.getContext('2d');
		this.width = this.canvas.width;
		this.height = this.canvas.height;

		// When set to false, the canvas will redraw everything
		this.redraw = false;

		/**
		 * What to do when clicked
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.click = function(e) {
			console.log('UI Click');
			return;
		};

		/**
		 * What to do when right clicked
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.contextMenu = function(e) {
			console.log('UI Right Click');
		};

		/**
		 * What to do when double clicked
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.doubleClick = function(e) {
			console.log('UI Double Click');
		};

		/**
		 * What to do when dragged
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.drag = function(e) {
			console.log('UI Drag');
		};

		/**
		 * What to do when dropped
		 * @param {MouseEvent} e
		 * @returns {undefined}
		 */
		this.drop = function(e) {
			console.log('UI Drop');
		};

		this.interval = 60;
		this.fill = 'black';
		var self = this;

		// Apply the Interactions class to the world
		Interactions.apply(this, [canvas]);

		setInterval(function () {
			self.tick();
			if (!self.redraw || self.clock % 50 === 0) {
				self.draw();
			}
		}, self.interval);
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
		 * Determine if a point is inside the shape's bounds
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
				return  (this.pos.x <= v.x) && (this.pos.x + this.width >= v.x) &&
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

			if (this.type === 'rect' || (this.type === undefined && this.mouse.pos !== undefined)) {
				this.ctx.beginPath();
				this.ctx.rect(this.mouse.pos.x - 10, this.mouse.pos.y - 10, 20, 20);
				this.ctx.closePath();
				this.ctx.fill();
				this.ctx.stroke();
			} else if (this.type === 'circ') {
				this.ctx.beginPath();
				this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
				this.ctx.closePath();
				this.ctx.stroke();
				this.ctx.fill();
			} else if (this.type === 'tria') {
				this.ctx.beginPath();
				this.ctx.moveTo(this.pos.x, this.pos.y);
				this.ctx.lineTo(this.pos.x + this.width / 2, this.pos.y + this.height);
				this.ctx.lineTo(this.pos.x - this.width / 2, this.pos.y + this.height);
				this.ctx.closePath();
				this.ctx.stroke();
				this.ctx.fill();
			} else if (this.type === 'bubb') {
				var r = this.pos.x + this.width;
				var b = this.pos.y + this.height;

				this.ctx.beginPath();
				this.ctx.moveTo(this.pos.x + this.radius, this.pos.y);
				this.ctx.lineTo(this.pos.x + this.radius / 2, this.pos.y - 10);
				this.ctx.lineTo(this.pos.x + this.radius * 2, this.pos.y);
				this.ctx.lineTo(r - this.radius, this.pos.y);
				this.ctx.quadraticCurveTo(r, this.pos.y, r, this.pos.y + this.radius);
				this.ctx.lineTo(r, this.pos.y + this.height - this.radius);
				this.ctx.quadraticCurveTo(r, b, r - this.radius, b);
				this.ctx.lineTo(this.pos.x + this.radius, b);
				this.ctx.quadraticCurveTo(this.pos.x, b, this.pos.x, b - this.radius);
				this.ctx.lineTo(this.pos.x, this.pos.y + this.radius);
				this.ctx.quadraticCurveTo(this.pos.x, this.pos.y, this.pos.x + this.radius, this.pos.y);
				this.ctx.stroke();
			} else if (this.type === 1 || this.type === 2) {
				if (this.image) {
					this.ctx.drawImage(this.image, this.pos.x - this.radius, this.pos.y - this.radius, this.width, this.height);
				} else {
					if (this.type === 1)
						this.ctx.fillStyle = "rgb(255, 150, 150)";
					if (this.type === 2)
						this.ctx.fillStyle = "rgb(150, 255, 150)";
					this.ctx.strokeStyle = "rgb(0,0,0)";
					this.ctx.beginPath();
					this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
					this.ctx.fill();
					this.ctx.stroke();
				}
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
