(function (global) {
    "use strict";

    /**
     * Initialize the Entity
     *
     * @param {Number} typeId A type id (wall,nom,gnar,agent)
     * @param {Vec} position A vector of the position
     * @param {Object} opts Entity Options
     * @constructor
     * @returns {Entity}
     */
    var Entity = function (typeId, position, opts) {
        var entityTypes = ['Wall', 'Nom', 'Gnar', 'Agent'];

        this.id = Utility.guid();
        this.name = (this.name === undefined) ? entityTypes[typeId] : this.name;
        this.type = typeId || 1;
        this.position = position || new Vec(5, 5);
        this.radius = Utility.getOpt(opts, 'radius', 10);
        this.width = Utility.getOpt(opts, 'width', this.radius * 2);
        this.height = Utility.getOpt(opts, 'height', this.radius * 2);

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
            this.texture = PIXI.Texture.fromImage('img/' + entityTypes[typeId] + '.png');
            this.sprite = new PIXI.Sprite(this.texture);
            this.sprite.width = this.width;
            this.sprite.height = this.height;
            this.sprite.anchor.set(0.5, 0.5);
            this.sprite.position.set(this.position.x, this.position.y);
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
        }

        // If cheats are on then show the entities grid location and x,y coords
        if (this.cheats) {
            this.addCheats();
        }

        return this;
    };

    /**
     * Set up the cheat displays
     */
    Entity.prototype.addCheats = function () {
        var fontOpts = {font: "10px Arial", fill: "#FF0000", align: "center"};
        this.cheatsContainer = new PIXI.Container();

        // If cheats are on then show the entities grid location and x,y coords
        if (this.cheats.gridLocation === true) {
            var textG = ' Grid(' + this.gridLocation.x + ',' + this.gridLocation.y + ')';

            this.gridText = new PIXI.Text(textG, fontOpts);
            this.gridText.position.set(this.position.x + this.radius, this.position.y - (this.radius * 2));
            this.cheatsContainer.addChild(this.gridText);
        }

        // If cheats are on then show the entities position and velocity
        if (this.cheats.position === true) {
            var textP = ' Pos(' + this.position.x + ', ' + this.position.y + ')',
                textV = ' Vel(' + Utility.flt2str(this.position.vx, 4) + ', ' + Utility.flt2str(this.position.vy, 4) + ')';

            this.posText = new PIXI.Text(textP + textV, fontOpts);
            this.posText.position.set(this.position.x + this.radius, this.position.y - this.radius);
            this.cheatsContainer.addChild(this.posText);
        }

        // If cheats are on then show the entities name
        if (this.cheats.name === true) {
            this.nameText = new PIXI.Text(this.name, fontOpts);
            this.nameText.position.set(this.position.x + this.radius, this.position.y + this.radius);
            this.cheatsContainer.addChild(this.nameText);
        }

        // If cheats are on then show the entities id
        if (this.cheats.id === true) {
            this.idText = new PIXI.Text(this.id, fontOpts);
            this.idText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 2));
            this.cheatsContainer.addChild(this.idText);
        }

        if (this.useSprite === true) {
            this.sprite.addChild(this.cheatsContainer);
        } else {
            this.shape.addChild(this.cheatsContainer);
        }
    };

    /**
     *
     */
    Entity.prototype.updateCheats = function () {
        var posText, gridText, nameText, idText;
        // If cheats are on then show the entities grid location and x,y coords
        if (this.cheats.gridLocation === true) {
            gridText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.gridText));

            gridText.text = ' Grid(' + this.gridLocation.x + ',' + this.gridLocation.y + ')';
            gridText.position.set(this.position.x + this.radius, this.position.y + (this.radius));
        }

        // If cheats are on then show the entities position and velocity
        if (this.cheats.position === true) {
            var textP = ' Pos(' + this.position.x + ', ' + this.position.y + ')',
                textV = ' Vel(' + Utility.flt2str(this.position.vx, 4) + ', ' + Utility.flt2str(this.position.vy, 4) + ')';
            posText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.posText));

            posText.text = textP + textV;
            posText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 1));
        }

        // If cheats are on then show the entities name
        if (this.cheats.name === true) {
            nameText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.nameText));

            nameText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 2));
        }

        // If cheats are on then show the entities id
        if (this.cheats.id === true) {
            idText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.idText));

            idText.position.set(this.position.x + this.radius, this.position.y + (this.radius * 3));
        }
    };

    /**
     * Draws it
     * @returns {Entity}
     */
    Entity.prototype.draw = function () {
        if (this.useSprite) {
            this.sprite.position.set(this.position.x, this.position.y);
            this.sprite.rotation = -this.angle;
        } else {
            this.shape.clear();
            this.shape.lineStyle(1, 0x000000);

            switch (this.type) {
            case 1:
                this.shape.beginFill(0xFF0000);
                break;
            case 2:
                this.shape.beginFill(0x00FF00);
                break;
            case 3:
                this.shape.beginFill(0x0000FF);
                break;
            }
            this.shape.drawCircle(this.position.x, this.position.y, this.radius);
            this.shape.endFill();
        }

        return this;
    };

    /**
     * Move around
     * @returns {Entity}
     */
    Entity.prototype.move = function () {
        var oldAngle = this.angle,
            speed = 0.05;
        this.oldPos = this.position.clone();

        this.position.x += this.position.vx;
        this.position.y += this.position.vy;

        // Handle boundary conditions.. bounce Agent
        if (this.position.x < 2) {
            this.position.x = 2;
            this.position.vx *= -1;
        }
        if (this.position.x > this.world.width - 2) {
            this.position.x = this.world.width - 2;
            this.position.vx *= -1;
        }
        if (this.position.y < 2) {
            this.position.y = 2;
            this.position.vy *= -1;
        }
        if (this.position.y > this.world.height - 2) {
            this.position.y = this.world.height - 2;
            this.position.vy *= -1;
        }

        if (this.useSprite) {
            this.sprite.position.set(this.position.x, this.position.y);
        }

        var end = new Date().getTime(),
            dist = this.position.distFrom(this.oldPos);

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

        if (this.cheats) {
            this.updateCheats();
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
            this.entity.position.round();
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
        this.entity.position.set(this.position.x, this.position.y);
        this.entity.position.round();
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
