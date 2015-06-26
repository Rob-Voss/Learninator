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
    class Item extends Interactive {
		constructor (type, position, radius, interactive) {
            super();

			this.id = Utility.guid();
			this.type = type || 1;
			this.position = position || new Vec(0, 0, Math.random()*5-2.5, Math.random()*5-2.5);
            this.gridLocation = new Cell(0, 0);
			this.width = 20;
			this.height = 20;
			this.radius = radius || 10;
			this.age = 0;
			this.cleanUp = false;
			this.interactive = interactive || false;

			// Remember the Item's old position
			this.oldPos = this.position.clone();

			// Remember the Item's old angle
			this.oldAngle = this.angle;

			this.texture = PIXI.Texture.fromImage((this.type === 1) ? 'img/Nom.png' : 'img/Gnar.png');
			this.sprite = new PIXI.Sprite(this.texture);
			this.sprite.width = this.width;
			this.sprite.height = this.height;
			this.sprite.anchor.set(0.5, 0.5);
			this.sprite.position.set(this.position.x, this.position.y);
            this.sprite.interactive = this.interactive;

            var _this = this;

			if (this.interactive === true) {
				this.sprite
					.on('mousedown', super.onDragStart)
					.on('touchstart', super.onDragStart)
					.on('mouseup', super.onDragEnd)
					.on('mouseupoutside', super.onDragEnd)
					.on('touchend', super.onDragEnd)
					.on('touchendoutside', super.onDragEnd)
					.on('mouseover', super.onMouseOver)
					.on('mouseout', super.onMouseOut)
					.on('mousemove', super.onDragMove)
					.on('touchmove', super.onDragMove);
				this.sprite.entity = _this;
			}

			return this;
		}

		move (smallWorld) {
			this.oldPos = this.position.clone();

			if(this.position.x < 2) {
				this.position.x = 2;
				this.position.vx *= -1;
			}
			if(this.position.x > smallWorld.width) {
				this.position.x = smallWorld.width;
				this.position.vx *= -1;
			}
			if(this.position.y < 2) {
				this.position.y = 2;
				this.position.vy *= -1;
			}
			if(this.position.y > smallWorld.height) {
				this.position.y = smallWorld.height;
				this.position.vy *= -1;
			}
            this.position.advance();
            this.position.ceil();

			// The item is trying to move from pos to oPos so we need to check walls
			var result = Utility.collisionCheck(this.oldPos, this.position, smallWorld.walls);
			if (result) {
				var d = this.position.distanceTo(result.vecI);
				// The item derped! Wall collision! Reset their position
				if (result && d <= this.radius) {
					this.position = this.oldPos;
					this.position.vx *= -1;
					this.position.vy *= -1;
				}
			}

			// Handle boundary conditions.. bounce item
			Utility.boundaryCheck(this, smallWorld.width, smallWorld.height);
		}

		tick (smallWorld) {
			this.age += 1;

			if (smallWorld.movingEntities) {
				this.move(smallWorld);
			}

            // Update the item's gridLocation label
            this.sprite.getChildAt(0).text = this.gridLocation.x + ':' + this.gridLocation.y;
            this.sprite.getChildAt(1).text = this.position.x + ':' + this.position.y;
		}
	}

	global.Item = Item;

}(this));
