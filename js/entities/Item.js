var Item = Item || {};
var Utility = Utility || {};

(function (global) {
	"use strict";

	/**
	 * Item is circle thing on the floor that agent can interact with (see or eat, etc)
	 * @param {String} type
	 * @param {Vec} position
	 * @param {Number} radius
	 * @param {Boolean} interactive
	 * @returns {undefined}
	 */
	class Item {
		constructor (type, position, radius, interactive) {
			this.id = Utility.guid();
			this.type = type || 1;
			this.position = position || new Vec(0, 0);
			this.velocity = new Vec(Math.random()*5-2.5, Math.random()*5-2.5);
			this.gridLocation = new Cell(0, 0);
			this.width = 20;
			this.height = 20;
			this.radius = radius || 10;
			this.age = 0;
			this.cleanUp = false;
			this.interactive = interactive || true;

			// Remember the Item's old position
			this.oldPos = this.position;

			// Remember the Item's old angle
			this.oldAngle = this.angle;

			var _this = this;

			this.texture = PIXI.Texture.fromImage((this.type === 1) ? 'img/Nom.png' : 'img/Gnar.png');
			this.sprite = new PIXI.Sprite(this.texture);
			this.sprite.width = this.width;
			this.sprite.height = this.height;
			this.sprite.anchor.set(0.5, 0.5);
			this.sprite.position.set(this.position.x, this.position.y);
			
			if (this.interactive == true) {
				this.sprite.interactive = true;
				this.sprite
					.on('mousedown', this.onDragStart)
					.on('touchstart', this.onDragStart)
					.on('mouseup', this.onDragEnd)
					.on('mouseupoutside', this.onDragEnd)
					.on('touchend', this.onDragEnd)
					.on('touchendoutside', this.onDragEnd)
					.on('mouseover', this.onMouseOver)
					.on('mouseout', this.onMouseOut)
					.on('mousemove', this.onDragMove)
					.on('touchmove', this.onDragMove);
				this.sprite.entity = _this;
			}
		};

		tick (smallWorld) {
			this.age += 1;

			if (smallWorld.movingEntities) {
				this.oldPos = new Vec(this.position.x, this.position.y);
				
				var width = smallWorld.grid.width * smallWorld.grid.cellWidth - 2,
					height = smallWorld.grid.height * smallWorld.grid.cellHeight - 2;
				
				this.position.x += this.velocity.x;
				this.position.y += this.velocity.y;

				if(this.position.x < 2) {
					this.position.x = 2;
					this.velocity.x *= -1;
				}
				if(this.position.x > width) {
					this.position.x = width;
					this.velocity.x *= -1;
				}
				if(this.position.y < 2) {
					this.position.y = 2;
					this.velocity.y *= -1;
				}
				if(this.position.y > height) {
					this.position.y = height;
					this.velocity.y *= -1;
				}

				// The item is trying to move from pos to oPos so we need to check walls
				var result = Utility.collisionCheck(this.oldPos, this.position, smallWorld.walls);
				if (result) {
					var d = this.position.distanceTo(result.vecI);
					// The item derped! Wall collision! Reset their position
					if (result && d <= this.radius) {
						this.position = this.oldPos;
						this.velocity.x *= -1;
						this.velocity.y *= -1;
					}
				}
				// Handle boundary conditions.. bounce item
				Utility.boundaryCheck(this, width, height);
			}
		};

		onDragStart (event) {
			this.data = event.data;
			this.alpha = 0.5;
			this.dragging = true;
		};

		onDragMove () {
			if(this.dragging) {
				var newPosition = this.data.getLocalPosition(this.parent);
				this.position.set(newPosition.x, newPosition.y);
				this.entity.position.set(newPosition.x, newPosition.y);
			}
		};

		onDragEnd () {
			this.alpha = 1;
			this.dragging = false;
			this.entity.position.set(this.position.x, this.position.y);
			// set the interaction data to null
			this.data = null;
		};

		onMouseDown () {
			this.isdown = true;
			this.alpha = 1;
		};

		onMouseUp () {
			this.isdown = false;
		};

		onMouseOver () {
			this.isOver = true;
			if (this.isdown) {
				return;
			}
		};
		
		onMouseOut () {
			this.isOver = false;
			if (this.isdown) {
				return;
			}
		};
	};

	global.Item = Item;

}(this));
