(function (global) {
    "use strict";

    class Item extends Entity {
        /**
         * Initialize the Item
         * @param typeId
         * @param position
         * @param grid
         * @param options
         * @returns {Item}
         */
        constructor(typeId, position, grid, options) {
            super(typeId === 1 ? 'Nom' : 'Gnar', position, grid, options);
            this.type = typeId || 1;

            this.age = 0;
            this.cleanUp = false;

            var _this = this;

            return _this;
        }

        /**
         * Move around
         * @param {Object} smallWorld
         */
        move(smallWorld) {
            if (this.position.x < 1) {
                this.position.vx *= Utility.randf(0.01, 1);
            }
            if (this.position.x > smallWorld.width) {
                this.position.vx *= Utility.randf(-0.01, -1);
            }
            if (this.position.y < 1) {
                this.position.vy *= Utility.randf(0.01, 1);
            }
            if (this.position.y > smallWorld.height) {
                this.position.vy *= Utility.randf(-0.01, -1);
            }

            this.position.advance();
            this.position.round();

            // The item is trying to move from pos to oPos so we need to check walls
            var result = Utility.collisionCheck(this.oldPos, this.position, smallWorld.walls);
            if (result) {
                var d = this.position.distanceTo(result.vecI);
                // The item derped! Wall collision! Reset their position
                if (result && d <= this.radius) {
                    this.position = this.oldPos.clone();
                    this.position.vx *= -1;
                    this.position.vy *= -1;
                }
            }

            Utility.boundaryCheck(this, smallWorld.width, smallWorld.height);
        }

        /**
         * Do work son
         * @param {Object} smallWorld
         */
        tick(smallWorld) {
            this.oldPos = this.position.clone();
            this.age += 1;

            if (smallWorld.movingEntities) {
                this.move(smallWorld);
            }
            if (smallWorld.cheats) {
                // Update the item's gridLocation label
                this.sprite.getChildAt(0).text = this.gridLocation.x + ':' + this.gridLocation.y;
                this.sprite.getChildAt(1).text = this.position.x + ':' + this.position.y;
            }
        }
    }

    global.Item = Item;

}(this));
