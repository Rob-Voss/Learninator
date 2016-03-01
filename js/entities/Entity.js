(function (global) {
    "use strict";

    /**
     * Options for the cheats to display
     * @typedef {Object} cheatOpts
     * @property {boolean} position - Show Vec x, y
     * @property {boolean} name - Show the name
     * @property {boolean} id - Show the ID
     * @property {boolean} gridLocation - Show the gridLocation x, y
     */

    /**
     * Options for the Entity
     * @typedef {Object} entityOpts
     * @property {number} radius - The radius of the Entity
     * @property {number} width - The width of the Entity
     * @property {number} height - The height of the Entity
     * @property {boolean} interactive - Is it interactive
     * @property {boolean} collision - Does it collide with stuff
     * @property {boolean} movingEntities - Does it move
     * @property {boolean} useSprite - Should it use a sprite
     * @property {cheatOpts} cheats - The cheats to display
     */

    class Entity {
        /**
         * Initialize the Entity
         * @name Entity
         * @constructor
         *
         * @param {number|string} type A type id (wall,nom,gnar,agent)
         * @param {Vec} position - The x, y location
         * @param {entityOpts} opts - The Entity options
         * @param {cheatOpts} opts.cheats - The cheats to display
         * @returns {Entity}
         */
        constructor(type, position = new Vec(5, 5), opts) {
            this.entityTypes = ['Wall', 'Nom', 'Gnar', 'Agent', 'Agent Worker', 'Entity Agent'];
            this.styles = ['black', 'red', 'green', 'blue', 'navy', 'magenta', 'cyan', 'purple', 'aqua', 'olive', 'lime'];
            this.hexStyles = [0x000000, 0xFF0000, 0x00FF00, 0x0000FF, 0x000080, 0xFF00FF, 0x00FFFF, 0x800080, 0x00FFFF, 0x808000, 0x00FF00];

            let typeOf = typeof type;
            if (typeOf === 'string') {
                this.type = this.entityTypes.indexOf(type);
                this.typeName = type;
                this.color = this.hexStyles[this.type];
                this.legendColor = this.styles[this.type];
                this.name = (this.name === undefined) ? type : this.name;
            } else if (typeOf === 'number') {
                this.type = type || 1;
                this.typeName = this.entityTypes[this.type];
                this.color = this.hexStyles[this.type];
                this.legendColor = this.styles[this.type];
                this.name = (this.name === undefined) ? this.entityTypes[this.type] : this.name;
            }

            this.id = Utility.guid();
            this.pos = position;
            this.angle = this.pos.getAngle();
            this.radius = Utility.getOpt(opts, 'radius', undefined);
            this.width = Utility.getOpt(opts, 'width', undefined);
            this.height = Utility.getOpt(opts, 'height', undefined);
            this.size = this.radius || this.width;
            this.interactive = Utility.getOpt(opts, 'interactive', false);
            this.collision = Utility.getOpt(opts, 'collision', true);
            this.movingEntities = Utility.getOpt(opts, 'movingEntities', false);
            this.useSprite = Utility.getOpt(opts, 'useSprite', false);

            this.cheats = Utility.getOpt(opts, 'cheats', false);
            this.gridLocation = {};
            this.cleanUp = false;
            this.direction = Utility.getDirection(this.angle);

            this.age = 0;

            // Remember the old position and angle
            this.oldPos = this.pos.clone();
            this.oldAngle = 0;

            this.rot1 = 0.0;
            this.rot2 = 0.0;
            this.collisions = [];

            // Add a container to hold our display cheats
            this.cheatsContainer = new PIXI.Container();
            this.addCheats();

            let entity;
            if (this.useSprite) {
                this.texture = PIXI.Texture.fromImage('img/' + this.typeName.replace(' ', '') + '.png');
                this.sprite = new PIXI.Sprite(this.texture);
                this.sprite.width = this.width;
                this.sprite.height = this.height;
                this.sprite.anchor.set(0.5, 0.5);
                this.sprite.position.set(this.pos.x, this.pos.y);
                this.sprite.addChild(this.cheatsContainer);
                entity = this.sprite;
            } else {
                this.shape = new PIXI.Graphics();
                this.shape.addChild(this.cheatsContainer);
                entity = this.shape;
            }

            if (this.interactive === true) {
                this.isOver = false;
                this.isDown = false;
                entity.interactive = true;
                entity
                    .on('mousedown', (e, data) => {
                        this.onDragStart(e);
                    })
                    .on('touchstart', (e, data) => {
                        this.onDragStart(e);
                    })
                    .on('mouseup', (e, data) => {
                        this.onDragEnd();
                    })
                    .on('mouseupoutside', (e, data) => {
                        this.onDragEnd();
                    })
                    .on('touchend', (e, data) => {
                        this.onDragEnd();
                    })
                    .on('touchendoutside', (e, data) => {
                        this.onDragEnd();
                    })
                    .on('mouseover', (e, data) => {
                        this.onMouseOver();
                    })
                    .on('mouseout', (e, data) => {
                        this.onMouseOut();
                    })
                    .on('mousemove', (e, data) => {
                        this.onDragMove();
                    })
                    .on('touchmove', (e, data) => {
                        this.onDragMove();
                    });
            }

            return this;
        }

        /**
         * Set up the cheat displays
         * @returns {Entity}
         */
        addCheats() {
            let fontOpts = {font: "10px Arial", fill: "#FF0000", align: "center"};

            // If cheats are on then show the entities grid location and x,y coords
            if (this.cheats.gridLocation && this.gridText === undefined) {
                let textG = ' Grid(' + this.gridLocation.x + ',' + this.gridLocation.y + ')';

                this.gridText = new PIXI.Text(textG, fontOpts);
                this.gridText.position.set(this.pos.x + this.radius, this.pos.y - (this.radius * 2));
                this.cheatsContainer.addChild(this.gridText);
            }

            // If cheats are on then show the entities position and velocity
            if (this.cheats.pos && this.posText === undefined) {
                let textP = ' Pos(' + this.pos.x + ', ' + this.pos.y + ')',
                    textV = ' Vel(' + Utility.flt2str(this.pos.vx, 4) + ', ' + Utility.flt2str(this.pos.vy, 4) + ')';

                this.posText = new PIXI.Text(textP + textV, fontOpts);
                this.posText.position.set(this.pos.x + this.radius, this.pos.y - this.radius);
                this.cheatsContainer.addChild(this.posText);
            }

            // If cheats are on then show the entities name
            if (this.cheats.name && this.nameText === undefined) {
                this.nameText = new PIXI.Text(this.name, fontOpts);
                this.nameText.position.set(this.pos.x + this.radius, this.pos.y + this.radius);
                this.cheatsContainer.addChild(this.nameText);
            }

            // If cheats are on then show the entities id
            if (this.cheats.id && this.idText === undefined) {
                this.idText = new PIXI.Text(this.id.substring(0, 10), fontOpts);
                this.idText.position.set(this.pos.x + this.radius, this.pos.y + (this.radius * 2));
                this.cheatsContainer.addChild(this.idText);
            }

            return this;
        }

        /**
         * Update the cheats if they are on
         * @returns {Entity}
         */
        updateCheats() {
            let posText, gridText, nameText, idText;
            // If cheats are on then show the entities grid location and x,y coords
            if (this.cheats.gridLocation) {
                if (this.gridText === undefined) {
                    this.addCheats();
                }
                gridText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.gridText));
                gridText.text = '(' + this.gridLocation.toString() + ')';
                gridText.position.set(this.pos.x + this.radius, this.pos.y + (this.radius));
            } else {
                if (this.gridText !== undefined) {
                    let index = this.cheatsContainer.getChildIndex(this.gridText);
                    this.cheatsContainer.removeChildAt(index);
                    this.gridText = undefined;
                }
            }

            // If cheats are on then show the entities position and velocity
            if (this.cheats.pos) {
                if (this.posText === undefined) {
                    this.addCheats();
                }
                let textP = ' Pos(' + this.pos.x + ', ' + this.pos.y + ')',
                    textV = ' Vel(' + Utility.flt2str(this.pos.vx, 4) + ', ' + Utility.flt2str(this.pos.vy, 4) + ')';
                posText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.posText));
                posText.text = textP + textV;
                posText.position.set(this.pos.x + this.radius, this.pos.y + (this.radius * 1));
            } else {
                if (this.posText !== undefined) {
                    let index = this.cheatsContainer.getChildIndex(this.posText);
                    this.cheatsContainer.removeChildAt(index);
                    this.posText = undefined;
                }
            }

            // If cheats are on then show the entities name
            if (this.cheats.name) {
                if (this.nameText === undefined) {
                    this.addCheats();
                }
                nameText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.nameText));
                nameText.position.set(this.pos.x + this.radius, this.pos.y + (this.radius * 2));
            } else {
                if (this.nameText !== undefined) {
                    let index = this.cheatsContainer.getChildIndex(this.nameText);
                    this.cheatsContainer.removeChildAt(index);
                    this.nameText = undefined;
                }
            }

            // If cheats are on then show the entities id
            if (this.cheats.id) {
                if (this.idText === undefined) {
                    this.addCheats();
                }
                idText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.idText));
                idText.position.set(this.pos.x + this.radius, this.pos.y + (this.radius * 3));
            } else {
                if (this.idText !== undefined) {
                    let index = this.cheatsContainer.getChildIndex(this.idText);
                    this.cheatsContainer.removeChildAt(index);
                    this.idText = undefined;
                }
            }

            return this;
        }

        /**
         * Draws it
         * @returns {Entity}
         */
        draw() {
            if (this.useSprite) {
                this.sprite.position.set(this.pos.x, this.pos.y);
            } else {
                this.shape.clear();
                this.shape.lineStyle(1, 0x000000);
                this.shape.beginFill(this.color);
                this.shape.drawCircle(this.pos.x, this.pos.y, this.radius);
                this.shape.endFill();
            }

            if (this.cheats) {
                this.updateCheats();
            }

            return this;
        }

        /**
         * Move around
         * @returns {Entity}
         */
        move(world) {
            this.oldPos = this.pos.clone();
            this.angle = this.pos.getAngle();
            this.direction = Utility.getDirection(this.pos.angle);
            this.pos.advance();

            if (world.check(this)) {
                for (let i = 0; i < this.collisions.length; i++) {
                    let collisionObj = this.collisions[i];
                    if (world.population.has(collisionObj.id)) {
                        let entity = world.population.get(collisionObj.id);
                        // Wall
                        if (collisionObj.type === 0) {
                            let between = this.pos.getVectorBetween(this.pos, collisionObj.vecI),
                            // Get the vector that points out from the surface the circle is bouncing on.
                                bounceLineNormal = between.getUnitVector(),
                            // Set the new circle velocity by reflecting the old velocity in `bounceLineNormal`.
                                dot = this.pos.vx * bounceLineNormal.x + this.pos.vy * bounceLineNormal.y;

                            this.pos.vx -= 2 * dot * bounceLineNormal.x;
                            this.pos.vy -= 2 * dot * bounceLineNormal.y;
                            this.pos.x = this.oldPos.x;
                            this.pos.y = this.oldPos.y;
                        } else if (collisionObj.type === 1 || collisionObj.type === 2) {
                            this.pos.vx = collisionObj.target.vx;
                            this.pos.vy = collisionObj.target.vy;
                            entity.pos.vx = collisionObj.entity.vx;
                            entity.pos.vy = collisionObj.entity.vy;
                        }
                    }
                }
            }

            // Handle boundary conditions.. bounce Agent
            let top = world.height - (world.height - this.radius),
                bottom = world.height - this.radius,
                left = world.width - (world.width - this.radius),
                right = world.width - this.radius;
            if (this.pos.x < left) {
                this.pos.x = left;
                this.pos.vx *= -1;
            }

            if (this.pos.x > right) {
                this.pos.x = right;
                this.pos.vx *= -1;
            }

            if (this.pos.y < top) {
                this.pos.y = top;
                this.pos.vy *= -1;
            }

            if (this.pos.y > bottom) {
                this.pos.y = bottom;
                this.pos.vy *= -1;
            }


            if (this.useSprite) {
                this.sprite.position.set(this.pos.x, this.pos.y);
            }

            return this;
        }

        /**
         * Do work son
         * @param {Object} world
         * @returns {Entity}
         */
        tick(world) {
            this.age += 1;

            if (this.movingEntities) {
                this.move(world);
            }

            return this;
        }

        /**
         * Perform the start of a drag
         *
         * @param {MouseEvent} event
         * @returns {Entity}
         */
        onDragStart(event) {
            this.data = event.data;
            this.interactionTarget = event.target;
            this.alpha = 0.5;
            this.dragging = true;

            return this;
        }

        /**
         * Perform the move of a drag
         *
         * @returns {Entity}
         */
        onDragMove() {
            if (this.dragging) {
                let newPosition = this.data.getLocalPosition(this.interactionTarget.parent);
                this.pos.set(newPosition.x, newPosition.y);
            }

            return this;
        }

        /**
         * Perform the end of a drag
         *
         * @returns {Entity}
         */
        onDragEnd() {
            this.alpha = 1;
            this.dragging = false;
            let newPosition = this.data.getLocalPosition(this.interactionTarget.parent);
            this.pos.set(newPosition.x, newPosition.y);

            // set the interaction data to null
            this.data = null;
            this.interactionTarget = null;

            return this;
        }

        /**
         * Perform the action for mouse down
         *
         * @returns {Entity}
         */
        onMouseDown() {
            this.isDown = true;
            this.alpha = 1;

            return this;
        }

        /**
         * Perform the action for mouse up
         *
         * @returns {Entity}
         */
        onMouseUp() {
            this.isDown = false;

            return this;
        }

        /**
         * Perform the action for mouse over
         *
         * @returns {Entity}
         */
        onMouseOver() {
            this.isOver = true;
            if (this.isDown) {
                return this;
            }

            return this;
        }

        /**
         * Perform the action for mouse out
         *
         * @returns {Entity}
         */
        onMouseOut() {
            this.isOver = false;
            if (this.isDown) {
                return this;
            }

            return this;
        }
    }

    global.Entity = Entity;

}(this));
