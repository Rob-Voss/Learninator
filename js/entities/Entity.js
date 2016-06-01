(function (global) {
    "use strict";

    var Utility = global.Utility,
        Vec = global.Vec || {};

    /**
     * Options for the cheats to display
     * @typedef {Object} cheatOpts
     * @property {boolean} id - Show the ID
     * @property {boolean} name - Show the name
     * @property {boolean} direction - Show direction
     * @property {boolean} position - Show Vec x, y
     * @property {boolean} gridLocation - Show the gridLocation x, y
     */

    /**
     * Options for the Entity
     * @typedef {Object} entityOpts
     * @property {number} radius - The radius of the Entity
     * @property {number} width - The width of the Entity
     * @property {number} height - The height of the Entity
     * @property {boolean} interactive - Is it interactive
     * @property {boolean} moving - Does it move
     * @property {boolean} useSprite - Should it use a sprite
     * @property {cheatOpts} cheats - The cheats to display
     */
    class Entity {

        /**
         * Initialize the Entity
         * @name Entity
         * @constructor
         *
         * @param {number|string} type - A type id (wall,nom,gnar,agent)
         * @param {Vec} position - The x, y location
         * @param {entityOpts} opts - The Entity options
         * @param {cheatOpts} opts.cheats - The cheats to display
         * @returns {Entity}
         */
        constructor(type, position = new Vec(5, 5), opts) {
            let typeOf = typeof type;
            if (typeOf === 'string') {
                this.type = Entity.entityTypes.indexOf(type);
                this.typeName = type;
                this.color = Entity.hexStyles[this.type];
                this.name = (this.name === undefined) ? type : this.name;
            } else if (typeOf === 'number') {
                this.type = type || 1;
                this.typeName = Entity.entityTypes[this.type];
                this.color = Entity.hexStyles[this.type];
                this.name = (this.name === undefined) ? Entity.entityTypes[this.type] : this.name;
            }

            this.id = Utility.Strings.guid();
            this.options = opts || {
                radius: 10,
                interactive: false,
                useSprite: false,
                moving: false,
                cheats: false
            };
            // Remember the old position and angle
            this.position = position;
            this.oldPosition = this.position.clone();
            this.oldAngle = this.position.angle;
            this.force = new Vec(0, 0);

            this.radius = Utility.getOpt(this.options, 'radius', undefined);
            this.width = Utility.getOpt(this.options, 'width', undefined);
            this.height = Utility.getOpt(this.options, 'height', undefined);
            this.size = this.radius * 2 || this.width;
            this.interactive = Utility.getOpt(this.options, 'interactive', false);
            this.moving = Utility.getOpt(this.options, 'moving', false);
            this.useSprite = Utility.getOpt(this.options, 'useSprite', false);

            this.cheats = Utility.getOpt(this.options, 'cheats', false);
            this.direction = Utility.getDirection(this.position.getAngle(true));

            this.age = 0;
            this.speed = 1;
            this.rot1 = 0.0;
            this.rot2 = 0.0;
            this.collisions = [];
            this.gridLocation = {};
            this.cleanUp = false;
            if (this.type === 2) {
                this.vertices = Entity.drawShape(this.position.x, this.position.y, 8, 10, 5, 0);
            }

            // Add a container to hold our display cheats
            this.cheatsContainer = new PIXI.Container();
            this.addCheats();

            if (this.useSprite) {
                this.texture = PIXI.Texture.fromImage('img/' + this.typeName.replace(' ', '') + '.png');
                this.sprite = new PIXI.Sprite(this.texture);
                this.sprite.width = this.width;
                this.sprite.height = this.height;
                this.sprite.anchor.set(0.5, 0.5);
                this.draw();
                this.sprite.addChild(this.cheatsContainer);
            } else {
                this.shape = new PIXI.Graphics();
                this.draw();
                this.shape.addChild(this.cheatsContainer);
            }

            if (this.interactive === true) {
                this.isOver = false;
                this.isDown = false;
                this.shape.interactive = true;
                this.shape
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

            if (this.cheats.angle && this.anglePointer === undefined) {
                let dirV = new Vec(
                    this.position.x + this.radius * Math.sin(this.position.direction),
                    this.position.y + this.radius * Math.cos(this.position.direction)
                );
                this.anglePointer = new PIXI.Graphics();
                this.anglePointer.lineStyle(2, 0x000000, 2);
                this.anglePointer.moveTo(this.position.x, this.position.y);
                this.anglePointer.lineTo(dirV.x, dirV.y);
                this.cheatsContainer.addChild(this.anglePointer);
            }

            if (this.cheats.gridLocation && this.gridText === undefined) {
                this.gridText = new PIXI.Text('(' + this.gridLocation.toString() + ')', fontOpts);
                this.gridText.position.set(this.position.x + this.radius, this.position.y + (this.radius * -0.5));
                this.cheatsContainer.addChild(this.gridText);
            }

            if (this.cheats.position && this.posText === undefined) {
                let textP = 'Pos(' + Utility.Strings.flt2str(this.position.x, 0) + ', ' + Utility.Strings.flt2str(this.position.y, 0) + ')',
                    textV = ' Vel(' + Utility.Strings.flt2str(this.position.vx, 1) + ', ' + Utility.Strings.flt2str(this.position.vy, 1) + ')';

                this.posText = new PIXI.Text(textP + textV, fontOpts);
                this.posText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 1));
                this.cheatsContainer.addChild(this.posText);
            }

            if (this.cheats.name && this.nameText === undefined) {
                this.nameText = new PIXI.Text(this.name, fontOpts);
                this.nameText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 2));
                this.cheatsContainer.addChild(this.nameText);
            }

            if (this.cheats.id && this.idText === undefined) {
                this.idText = new PIXI.Text(this.id.substring(0, 10), fontOpts);
                this.idText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 3));
                this.cheatsContainer.addChild(this.idText);
            }

            if (this.cheats.direction && this.directionText === undefined) {
                this.directionText = new PIXI.Text(this.direction, fontOpts);
                this.directionText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 4));
                this.cheatsContainer.addChild(this.directionText);
            }

            if (this.bounds && this.cheats.bounds && this.boundsRect === undefined) {
                this.boundsRect = new PIXI.Graphics();
                this.boundsRect.lineStyle(1, 0xFF0000, 1);
                this.boundsRect.drawRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
                this.boundsRect.endFill();
                this.cheatsContainer.addChild(this.boundsRect);
            }

            return this;
        }

        /**
         * Update the cheats if they are on
         * @returns {Entity}
         */
        updateCheats() {
            this.addCheats();
            if (this.cheats.angle) {
                let dirV = new Vec(
                    this.position.x + this.radius * Math.sin(this.position.direction),
                    this.position.y + this.radius * Math.cos(this.position.direction)
                );
                this.anglePointer.clear();
                this.anglePointer.lineStyle(2, 0x000000, 2);
                this.anglePointer.moveTo(this.position.x, this.position.y);
                this.anglePointer.lineTo(dirV.x, dirV.y);
            } else {
                if (this.anglePointer !== undefined) {
                    let index = this.cheatsContainer.getChildIndex(this.anglePointer);
                    this.cheatsContainer.removeChildAt(index);
                    this.anglePointer = undefined;
                }
            }

            if (this.cheats.gridLocation) {
                this.gridText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.gridText));
                this.gridText.text = '(' + this.gridLocation.toString() + ')';
                this.gridText.position.set(this.position.x + this.radius, this.position.y + (this.radius * -0.5));
            } else {
                if (this.gridText !== undefined) {
                    let index = this.cheatsContainer.getChildIndex(this.gridText);
                    this.cheatsContainer.removeChildAt(index);
                    this.gridText = undefined;
                }
            }

            if (this.cheats.position) {
                let textP = 'Pos(' + Utility.Strings.flt2str(this.position.x, 0) + ', ' + Utility.Strings.flt2str(this.position.y, 0) + ')',
                    textV = ' Vel(' + Utility.Strings.flt2str(this.position.vx, 1) + ', ' + Utility.Strings.flt2str(this.position.vy, 1) + ')';
                this.posText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.posText));
                this.posText.text = textP + textV;
                this.posText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 1));
            } else {
                if (this.posText !== undefined) {
                    let index = this.cheatsContainer.getChildIndex(this.posText);
                    this.cheatsContainer.removeChildAt(index);
                    this.posText = undefined;
                }
            }

            if (this.cheats.name) {
                this.nameText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.nameText));
                this.nameText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 2));
            } else {
                if (this.nameText !== undefined) {
                    let index = this.cheatsContainer.getChildIndex(this.nameText);
                    this.cheatsContainer.removeChildAt(index);
                    this.nameText = undefined;
                }
            }

            if (this.cheats.id) {
                this.idText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.idText));
                this.idText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 3));
            } else {
                if (this.idText !== undefined) {
                    let index = this.cheatsContainer.getChildIndex(this.idText);
                    this.cheatsContainer.removeChildAt(index);
                    this.idText = undefined;
                }
            }

            if (this.cheats.direction) {
                this.directionText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.directionText));
                this.directionText.text = this.direction;
                this.directionText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 4));
            } else {
                if (this.directionText !== undefined) {
                    let index = this.cheatsContainer.getChildIndex(this.directionText);
                    this.cheatsContainer.removeChildAt(index);
                    this.directionText = undefined;
                }
            }

            if (this.cheats.bounds) {
                this.boundsRect.clear();
                this.boundsRect.lineStyle(1, 0xFF0000, 1);
                this.boundsRect.drawRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
                this.boundsRect.endFill();
            } else {
                if (this.boundsRect !== undefined) {
                    let index = this.cheatsContainer.getChildIndex(this.boundsRect);
                    this.cheatsContainer.removeChildAt(index);
                    this.boundsRect = undefined;
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
                this.sprite.position.set(this.position.x, this.position.y);
            } else {
                this.shape.clear();
                this.shape.lineStyle(0.5, 0x000000, 0.8);
                this.shape.beginFill(this.color);
                if (this.type === 2) {
                    this.vertices = Entity.drawShape(this.position.x, this.position.y, 8, 10, 5, 0);
                    this.shape.drawPolygon(this.vertices);
                } else {
                    this.shape.drawCircle(this.position.x, this.position.y, this.radius);
                }
                this.shape.endFill();
                this.bounds = this.shape.getBounds();
            }

            this.updateCheats();

            return this;
        }

        /**
         *
         * @param x
         * @param y
         * @param points - number of points (or number of sides for polygons)
         * @param radius1 - "outer" radius of the star
         * @param radius2 - "inner" radius of the star (if equal to radius1, a polygon is drawn)
         * @param alpha0 - initial angle (clockwise), by default, stars and polygons are 'pointing' up
         */
        static drawShape(x, y, points, radius1, radius2, alpha0) {
            var i, angle, radius, vertices = [];
            if (radius2 !== radius1) {
                points = 2 * points;
            }
            for (i = 0; i <= points; i++) {
                angle = i * 2 * Math.PI / points - Math.PI / 2 + alpha0;
                radius = i % 2 === 0 ? radius1 : radius2;
                let px = x + radius * Math.cos(angle),
                    py = y + radius * Math.sin(angle);
                vertices.push(px, py);
            }

            return vertices;
        }

        /**
         * Move around
         * @returns {Entity}
         */
        move() {
            for (let i = 0; i < this.collisions.length; i++) {
                let collisionObj = this.collisions[i];
                if (collisionObj.distance <= this.radius) {
                    switch (collisionObj.entity.type) {
                        case 0:
                            // Wall
                            // Get the vector that points out from the surface the circle is bouncing on.
                            let bounceLineNormal = Vec.vectorBetween(this.position, collisionObj.vecI).unitVector(),
                            // Set the new circle velocity by reflecting the old velocity in `bounceLineNormal`.
                                dot = this.position.vx * bounceLineNormal.x + this.position.vy * bounceLineNormal.y;

                            this.force.x -= 2 * dot * bounceLineNormal.x;
                            this.force.y -= 2 * dot * bounceLineNormal.y;

                            if (this.force.x > 3 || this.force.y > 3 || this.force.x < -3 || this.force.y < -3) {
                                this.force.scale(0.095);
                            }
                            break;
                        case 1:
                        case 2:
                            // Noms or Gnars
                            this.force.x = collisionObj.target.vx;
                            this.force.y = collisionObj.target.vy;
                            break;
                        case 3:
                        case 4:
                            break;
                    }
                }
            }

            // Execute entity's desired action
            this.action = (this.age % 1600) ? Utility.Maths.randi(0, 4) : this.action;
            switch (this.action) {
                case 0: // Left
                    this.force.x += -this.speed * 0.095;
                    break;
                case 1: // Right
                    this.force.x += this.speed * 0.095;
                    break;
                case 2: // Up
                    this.force.y += -this.speed * 0.095;
                    break;
                case 3: // Down
                    this.force.y += this.speed * 0.095;
                    break;
                // case 4: // Down
                //     this.force.y += this.speed * 0.95;
                //     break;
                // case 5: // Down
                //     this.force.y += this.speed * 0.95;
                //     break;
                // case 6: // Down
                //     this.force.y += this.speed * 0.95;
                //     break;
                // case 7: // Down
                //     this.force.y += this.speed * 0.95;
                //     break;
            }

            // Forward the Entity by force
            this.oldPosition = this.position.clone();
            this.oldAngle = this.position.angle;

            this.position.vx = this.force.x;
            this.position.vy = this.force.y;
            this.position.advance(this.speed);
            this.direction = Utility.getDirection(this.position.direction);

            return this;
        }

        /**
         * Do work son
         * @returns {Entity}
         */
        tick() {
            this.age += 1;
            this.draw();
            if (this.moving) {
                this.move();
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
                this.position.set(newPosition.x, newPosition.y);
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
            this.position.set(newPosition.x, newPosition.y);

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
    Entity.entityTypes = ['Wall', 'Nom', 'Gnar', 'Entity Agent', 'Agent', 'Agent Worker'];
    Entity.styles = ['black', 'green', 'red',  'olive', 'blue', 'navy', 'magenta', 'cyan', 'purple', 'aqua', 'lime'];
    Entity.hexStyles = [0x000000, 0x00FF00, 0xFF0000, 0x808000, 0x0000FF, 0x000080, 0xFF00FF, 0x00FFFF, 0x800080, 0x00FFFF, 0x00FF00];
    global.Entity = Entity;

}(this));
