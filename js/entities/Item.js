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
		this.fill = '#AAAAAA';

		// create a texture from an image path
		this.texture = PIXI.Texture.fromImage((this.type === 1) ? 'img/Nom.png' : 'img/Gnar.png');
		// create a new Sprite using the texture
		this.sprite = new PIXI.Sprite(this.texture);

		// center the sprites anchor point
		this.sprite.anchor.x = 0.5;
		this.sprite.anchor.y = 0.5;

		// move the sprite t the center of the screen
		this.sprite.position.x = this.pos.x;
		this.sprite.position.y = this.pos.y;

		this.dragging = false;
		this.redraw = true;
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
			return this.pos.distFrom(mouse.pos) < this.radius;;
		},
		mouseClick: function(e, mouse) {
			console.log('Item Click');
		},
		rightClick: function(e, mouse) {
			console.log('Item Right Click');
		},
		doubleClick: function(e, mouse) {
			console.log('Item Double Click');
		},
		mouseMove: function(e, mouse) {
			console.log('Item Move');
		},
		mouseUp: function(e, mouse) {
			console.log('Item Release');
		},
		mouseDrag: function(e, mouse) {
			console.log('Item Drag');
		},
		mouseDrop: function(e, mouse) {
			console.log('Item Drop');
		}
	};

	global.Item = Item;

}(this));
