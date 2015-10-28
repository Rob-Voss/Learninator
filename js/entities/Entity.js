var Entity = Entity || {};

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
    function Entity(type, position, opts) {
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
        this.position = position || new Vec(5, 5);
        this.radius = Utility.getOpt(opts, 'radius', undefined);
        this.width = Utility.getOpt(opts, 'width', undefined);
        this.height = Utility.getOpt(opts, 'height', undefined);

        this.cheats = Utility.getOpt(opts, 'cheats', false);
        this.interactive = Utility.getOpt(opts, 'interactive', false);
        this.collision = Utility.getOpt(opts, 'collision', true);
        this.movingEntities = Utility.getOpt(opts, 'movingEntities', false);
        this.useSprite = Utility.getOpt(opts, 'useSprite', false);
        this.gridLocation = new Vec(0, 0);
        this.cleanUp = false;

        this.age = 0;
        this.angle = 0;
        this.rot1 = 0.0;
        this.rot2 = 0.0;
        this.collisions = [];

        // Remember the old position and angle
        this.oldPos = this.position.clone();
        this.oldAngle = 0;

        var _this = this;

        if (this.useSprite) {
            this.texture = PIXI.Texture.fromImage('img/' + this.typeName.replace(' ','') + '.png');
            this.sprite = new PIXI.Sprite(this.texture);
            this.sprite.width = this.width;
            this.sprite.height = this.height;
            this.sprite.anchor.set(0.5, 0.5);
            this.sprite.position.set(this.position.x, this.position.y);
            this.sprite.rotation = this.angle * 0.01745329252;
            this.sprite.interactive = this.interactive;

            if (this.sprite.interactive === true) {
                this.sprite
                    .on('mousedown', _this.onDragStart)
                    .on('touchstart', _this.onDragStart)
                    .on('mouseup', _this.onDragEnd)
                    .on('mouseupoutside', _this.onDragEnd)
                    .on('touchend', _this.onDragEnd)
                    .on('touchendoutside', _this.onDragEnd)
                    .on('mouseover', _this.onMouseOver)
                    .on('mouseout', _this.onMouseOut)
                    .on('mousemove', _this.onDragMove)
                    .on('touchmove', _this.onDragMove);
                this.sprite.entity = _this;
            }
        } else {
            this.shape = new PIXI.Graphics();
            this.shape.interactive = this.interactive;
            if (this.shape.interactive === true) {
                this.shape
                    .on('mousedown', _this.onDragStart)
                    .on('touchstart', _this.onDragStart)
                    .on('mouseup', _this.onDragEnd)
                    .on('mouseupoutside', _this.onDragEnd)
                    .on('touchend', _this.onDragEnd)
                    .on('touchendoutside', _this.onDragEnd)
                    .on('mouseover', _this.onMouseOver)
                    .on('mouseout', _this.onMouseOut)
                    .on('mousemove', _this.onDragMove)
                    .on('touchmove', _this.onDragMove);
                this.shape.entity = _this;
            }
        }
        // Add a container to hold our display cheats
        this.cheatsContainer = new PIXI.Container();
        this.addCheats();

        // Now we add the container to the entity
        if (this.useSprite) {
            this.sprite.addChild(this.cheatsContainer);
        } else {
            this.shape.addChild(this.cheatsContainer);
        }

        return this;
    }

    /**
     * Set up the cheat displays
     */
    Entity.prototype.addCheats = function () {
        var fontOpts = {font: "10px Arial", fill: "#FF0000", align: "center"};

        // If cheats are on then show the entities grid location and x,y coords
        if (this.cheats.gridLocation && this.gridText === undefined) {
            let textG = ' Grid(' + this.gridLocation.x + ',' + this.gridLocation.y + ')';

            this.gridText = new PIXI.Text(textG, fontOpts);
            this.gridText.position.set(this.position.x + this.radius, this.position.y - (this.radius * 2));
            this.cheatsContainer.addChild(this.gridText);
        }

        // If cheats are on then show the entities position and velocity
        if (this.cheats.position && this.posText === undefined) {
            let textP = ' Pos(' + this.position.x + ', ' + this.position.y + ')',
                textV = ' Vel(' + Utility.flt2str(this.position.vx, 4) + ', ' + Utility.flt2str(this.position.vy, 4) + ')';

            this.posText = new PIXI.Text(textP + textV, fontOpts);
            this.posText.position.set(this.position.x + this.radius, this.position.y - this.radius);
            this.cheatsContainer.addChild(this.posText);
        }

        // If cheats are on then show the entities name
        if (this.cheats.name && this.nameText === undefined) {
            this.nameText = new PIXI.Text(this.name, fontOpts);
            this.nameText.position.set(this.position.x + this.radius, this.position.y + this.radius);
            this.cheatsContainer.addChild(this.nameText);
        }

        // If cheats are on then show the entities id
        if (this.cheats.id && this.idText === undefined) {
            this.idText = new PIXI.Text(this.id.substring(0, 10), fontOpts);
            this.idText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 2));
            this.cheatsContainer.addChild(this.idText);
        }

    };

    /**
     *
     */
    Entity.prototype.updateCheats = function () {
        var posText, gridText, nameText, idText;
        // If cheats are on then show the entities grid location and x,y coords
        if (this.cheats.gridLocation) {
            if (this.gridText === undefined) {
                this.addCheats();
            }
            gridText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.gridText));
            gridText.text = ' Grid(' + this.gridLocation.x + ',' + this.gridLocation.y + ')';
            gridText.position.set(this.position.x + this.radius, this.position.y + (this.radius));
        } else {
            if (this.gridText !== undefined) {
                let index = this.cheatsContainer.getChildIndex(this.gridText);
                this.cheatsContainer.removeChildAt(index);
                this.gridText = undefined;
            }
        }

        // If cheats are on then show the entities position and velocity
        if (this.cheats.position) {
            if (this.posText === undefined) {
                this.addCheats();
            }
            let textP = ' Pos(' + this.position.x + ', ' + this.position.y + ')',
                textV = ' Vel(' + Utility.flt2str(this.position.vx, 4) + ', ' + Utility.flt2str(this.position.vy, 4) + ')';
            posText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.posText));
            posText.text = textP + textV;
            posText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 1));
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
            nameText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 2));
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
            idText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 3));
        } else {
            if (this.idText !== undefined) {
                let index = this.cheatsContainer.getChildIndex(this.idText);
                this.cheatsContainer.removeChildAt(index);
                this.idText = undefined;
            }
        }
    };

    /**
     * Draws it
     * @returns {Entity}
     */
    Entity.prototype.draw = function () {
        if (this.useSprite) {
            this.sprite.position.set(this.position.x, this.position.y);
        } else {
            this.shape.clear();
            this.shape.lineStyle(1, 0x000000);
            this.shape.beginFill(this.color);
            this.shape.drawCircle(this.position.x, this.position.y, this.radius);
            this.shape.endFill();
        }
        // draw entities sight
        if (this.eyes !== undefined) {
            for (let ae = 0, ne = this.eyes.length; ae < ne; ae++) {
                this.eyes[ae].draw(this);
            }
        }
        if (this.cheats) {
            this.updateCheats();
        }

        return this;
    };

    /**
     * Move around
     * @returns {Entity}
     */
    Entity.prototype.move = function () {
        this.oldPos = this.position.clone();

        this.position.x += this.position.vx;
        this.position.y += this.position.vy;

        this.world.check(this);

        for (let w = 0, wl = this.world.walls.length; w < wl; w++) {
            var wall = this.world.walls[w],
                result = this.world.lineIntersect(this.oldPos, this.position, wall.v1, wall.v2, this.radius);
            if (result) {
                this.collisions.unshift(wall);
            }
        }

        for (let i = 0; i < this.collisions.length; i++) {
            if (this.collisions[i].type === 3 || this.collisions[i].type === 4) {
                // Agent
                //console.log('Oh shit it\'s a ' + this.collisions[i].name);
            } else if (this.collisions[i].type === 1 || this.collisions[i].type === 2) {
                // Edible
                //console.log('Watch it ' + this.collisions[i].name);
            } else if (this.collisions[i].type === 0) {
                // Wall
                this.position = this.oldPos.clone();
                this.position.vx *= -1;
                this.position.vy *= -1;
            }
        }

        // Handle boundary conditions.. bounce Agent
        var top = this.world.height - (this.world.height - this.radius),
            bottom = this.world.height - this.radius,
            left = this.world.width - (this.world.width - this.radius),
            right = this.world.width - this.radius;
        if (this.position.x < left) {
            this.position.x = left;
            this.position.vx *= -1;
        }

        if (this.position.x > right) {
            this.position.x = right;
            this.position.vx *= -1;
        }

        if (this.position.y < top) {
            this.position.y = top;
            this.position.vy *= -1;
        }

        if (this.position.y > bottom) {
            this.position.y = bottom;
            this.position.vy *= -1;
        }

        if (this.useSprite) {
            this.sprite.position.set(this.position.x, this.position.y);
        }

        return this;
    };

    /**
     * Do work son
     * @param {Object} world
     * @returns {Entity}
     */
    Entity.prototype.tick = function (world) {
        this.world = world;
        this.age += 1;

        if (this.movingEntities) {
            this.move();
        }

        return this;
    };

    /**
     * Perform the start of a drag
     *
     * @param {MouseEvent} event
     * @returns {Entity}
     */
    Entity.prototype.onDragStart = function (event) {
        this.data = event.data;
        this.alpha = 0.5;
        this.dragging = true;

        return this;
    };

    /**
     * Perform the move of a drag
     *
     * @returns {Entity}
     */
    Entity.prototype.onDragMove = function () {
        if (this.dragging) {
            var newPosition = this.data.getLocalPosition(this.parent);
            this.position.set(newPosition.x, newPosition.y);
            this.entity.position.set(newPosition.x, newPosition.y);
        }

        return this;
    };

    /**
     * Perform the end of a drag
     *
     * @returns {Entity}
     */
    Entity.prototype.onDragEnd = function () {
        this.alpha = 1;
        this.dragging = false;

        // set the interaction data to null
        this.data = null;

        return this;
    };

    /**
     * Perform the action for mouse down
     *
     * @returns {Entity}
     */
    Entity.prototype.onMouseDown = function () {
        this.isdown = true;
        this.alpha = 1;

        return this;
    };

    /**
     * Perform the action for mouse up
     *
     * @returns {Entity}
     */
    Entity.prototype.onMouseUp = function () {
        this.isdown = false;

        return this;
    };

    /**
     * Perform the action for mouse over
     *
     * @returns {Entity}
     */
    Entity.prototype.onMouseOver = function () {
        this.isOver = true;
        if (this.isdown) {
            return this;
        }

        return this;
    };

    /**
     * Perform the action for mouse out
     *
     * @returns {Entity}
     */
    Entity.prototype.onMouseOut = function () {
        this.isOver = false;
        if (this.isdown) {
            return this;
        }

        return this;
    };

    global.Entity = Entity;

}(this));
