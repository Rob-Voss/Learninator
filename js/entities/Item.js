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
		this.type = type || 1;
		this.pos = v || new Vec(0, 0);
		this.gridLocation = new Cell(0, 0);
		this.width = w || 20;
		this.height = h || 20;
		this.radius = r || 10;
		this.age = 0;
		this.cleanUp = false;
		var _this = this;

		this.texture = PIXI.Texture.fromImage((this.type === 1) ? 'img/Nom.png' : 'img/Gnar.png');
		this.sprite = new PIXI.Sprite(this.texture);
		this.sprite.interactive = true;
		this.sprite.width = this.width;
		this.sprite.height = this.height;
		this.sprite.anchor.set(0.5, 0.5);
		this.sprite.position.set(this.pos.x, this.pos.y);
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
	};

	/**
	 *
	 * @type Item
	 */
	Item.prototype = {
		updateLocation: function() {
			
		},
		onDragStart: function(event) {
			this.data = event.data;
			this.alpha = 0.5;
			this.dragging = true;
		},
		onDragMove: function() {
			if(this.dragging) {
				var newPosition = this.data.getLocalPosition(this.parent);
				this.position.set(newPosition.x, newPosition.y);
				this.entity.pos.set(newPosition.x, newPosition.y);
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
