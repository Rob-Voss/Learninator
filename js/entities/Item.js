var Item = Item || {};
var Utility = Utility || {};

(function (global) {
	"use strict";

	/**
	 * Item is circle thing on the floor that agent can interact with (see or eat, etc)
	 * @param {String} type
	 * @param {Vec} v
	 * @param {Number} w
	 * @param {Number} h
	 * @param {Number} r
	 * @returns {undefined}
	 */
	var Item = function (type, v, w, h, r) {
		this.id = Utility.guid();
		this.type = type || 1; // type of item
		this.pos = v || new Vec(0, 0); // position
		this.gridLocation = new Vec(0, 0);
		this.width = w || 20; // width of item
		this.height = h || 20; // height of item
		this.radius = r || 10; // default radius
		this.age = 0;
		this.cleanUp = false;
		var _this = this;

		// create a texture from an image path
		this.texture = PIXI.Texture.fromImage((this.type === 1) ? 'img/Nom.png' : 'img/Gnar.png');
		// create a new Sprite using the texture
		this.sprite = new PIXI.Sprite(this.texture);
		// Add in interactivity
		this.sprite.interactive = true;

		// center the sprites anchor point
		this.sprite.anchor.x = 0.5;
		this.sprite.anchor.y = 0.5;

		// move the sprite t the center of the screen
		this.sprite.position.x = this.pos.x;
		this.sprite.position.y = this.pos.y;
		this.sprite.entity = _this;

		this.sprite
			.on('mousedown', this.onDragStart)
			.on('touchstart', this.onDragStart)
			// set the mouseup and touchend callback...
			.on('mouseup', this.onDragEnd)
			.on('mouseupoutside', this.onDragEnd)
			.on('touchend', this.onDragEnd)
			.on('touchendoutside', this.onDragEnd)
			// set the mouseover callback...
			.on('mouseover', this.onMouseOver)
			// set the mouseout callback...
			.on('mouseout', this.onMouseOut)
			// events for drag move
			.on('mousemove', this.onDragMove)
			.on('touchmove', this.onDragMove);


	};

	/**
	 *
	 * @type Item
	 */
	Item.prototype = {
		/**
		 * Determine if a point is inside the shape's bounds
		 * @param {Vec} v
		 * @returns {Boolean}
		 */
		contains: function (event, mouse) {
			return this.pos.distFrom(mouse.pos) < this.radius;
		},
		onDragStart: function(event) {
			this.data = event.data;
			this.alpha = 0.5;
			this.dragging = true;
		},
		onDragMove: function() {
			if(this.dragging) {
				var newPosition = this.data.getLocalPosition(this.parent);
				this.position.x = this.entity.pos.x = newPosition.x;
				this.position.y = this.entity.pos.y = newPosition.y;
			}
		},
		onDragEnd: function() {
			this.alpha = 1;
			this.dragging = false;
			this.entity.pos.set(this.position.x, this.position.y);
			// set the interaction data to null
			this.data = null;
		},
		onMouseDown: function() {
			this.isdown = true;
			this.alpha = 1;
		},
		onMouseUp: function() {
			this.isdown = false;
		},
		onMouseOver: function() {
			this.isOver = true;
			if (this.isdown) {
				return;
			}
		},
		onMouseOut: function() {
			this.isOver = false;
			if (this.isdown) {
				return;
			}
		}
	};

	global.Item = Item;

}(this));
