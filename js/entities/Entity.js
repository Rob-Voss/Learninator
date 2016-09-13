(function(global) {
  'use strict';

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
     * @constructor
     *
     * @param {number|string} type - A type id (wall,nom,gnar,agent)
     * @param {Vec} position - The x, y location
     * @param {entityOpts} opts - The Entity options
     * @param {cheatOpts} opts.cheats - The cheats to display
     * @return {Entity}
     */
    constructor(type, position, opts) {
      this.id = Utility.Strings.guid();
      this.txtOpts = {fontSize: '10px Arial', fill: '#000000', align: 'center'};
      if (typeof type === 'string') {
        this.type = Entity.entityTypes.indexOf(type);
        this.typeName = type;
        this.name = (this.name === undefined) ? type : this.name;
      } else if (typeof type === 'number') {
        this.type = type || 1;
        this.typeName = Entity.entityTypes[this.type];
        this.name = (this.name === undefined) ? Entity.entityTypes[this.type] : this.name;
      }
      this.color = Entity.hexStyles[this.type];
      this.alpha = 1;
      this.options = opts || {
            radius: 10,
            interactive: false,
            useSprite: false,
            moving: false,
            cheats: false
          };
      // Remember the old position and angle
      this.position = position || new Vec(5, 5);
      this.angle = this.position.getAngle();
      this.oldPosition = this.position.clone();
      this.oldAngle = this.angle;
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
      this.gridLocation = Utility.getOpt(this.options, 'gridLocation', {});

      this.age = 0;
      this.speed = 1;
      this.rot1 = 0.0;
      this.rot2 = 0.0;
      this.collisions = [];
      this.cleanUp = false;

      // Add a container to hold our display cheats
      this.cheatsContainer = new PIXI.Container();
      let typeName = this.typeName.replace(' ', ''),
          sprite = (this.type === 4) ? 'explorer' : typeName;
      if (this.useSprite) {
        this.graphics = new PIXI.Sprite(PIXI.Texture.fromFrame(sprite + '.png'));
        this.graphics.anchor.set(0.5, 0.5);
        this.graphics.scale.set(1, 1);
        this.graphics.position.x = this.position.x;
        this.graphics.position.y = this.position.y;
      } else {
        this.graphics = new PIXI.Graphics();
      }

      this.draw();

      if (this.interactive === true) {
        this.isOver = false;
        this.isDown = false;
        this.graphics.interactive = true;
        this.graphics
        .on('mousedown', (e) => this.onMouseDown(e))
        .on('touchstart', (e) => this.onDragStart(e))
        .on('mouseup', (e) => this.onMouseUp(e))
        .on('mouseupoutside', (e) => this.onDragEnd(e))
        .on('touchend', (e) => this.onDragEnd(e))
        .on('touchendoutside', (e) => this.onDragEnd(e))
        .on('mouseover', (e) => this.onMouseOver(e))
        .on('mouseout', (e) => this.onMouseOut(e))
        .on('mousemove', (e) => this.onDragMove(e))
        .on('touchmove', (e) => this.onDragMove(e));
      }
      this.graphics.addChild(this.cheatsContainer);

      return this;
    }

    /**
     * Set up the cheat displays
     * @return {Entity}
     */
    addCheats() {
      if (this.cheats.angle && this.anglePointer === undefined) {
        let dirV = new Vec(
            this.position.x + this.radius * Math.sin(this.position.direction),
            this.position.y + this.radius * Math.cos(this.position.direction)
        );
        this.graphics.lineStyle(2, 0x000000, 2);
        this.graphics.beginFill();
        this.graphics.moveTo(this.position.x, this.position.y);
        this.graphics.lineTo(dirV.x, dirV.y);
        this.graphics.endFill();
      }

      if (this.bounds && this.cheats.bounds && this.boundsRect === undefined) {
        let h = this.bounds.height,
            w = this.bounds.width;
        this.graphics.lineStyle(1, 0xFF0000, 1);
        this.graphics.beginFill();
        this.graphics.drawRect(this.bounds.x, this.bounds.y, w, h);
        this.graphics.endFill();
      }

      if (this.cheats.id && this.idText === undefined) {
        let x = this.position.x + this.radius,
            y = this.position.y + (this.radius * 3);
        this.idText = new PIXI.Text(this.id.substring(0, 10), this.txtOpts);
        this.idText.position.set(x, y);
        this.cheatsContainer.addChild(this.idText);
      }

      if (this.cheats.direction && this.directionText === undefined) {
        let x = this.position.x + this.radius,
            y = this.position.y + (this.radius * 4);
        this.directionText = new PIXI.Text(this.direction, this.txtOpts);
        this.directionText.position.set(x, y);
        this.cheatsContainer.addChild(this.directionText);
      }

      if (this.cheats.name && this.nameText === undefined) {
        let x = this.position.x + this.radius,
            y = this.position.y + (this.radius * 2);
        this.nameText = new PIXI.Text(this.name, this.txtOpts);
        this.nameText.position.set(x, y);
        this.cheatsContainer.addChild(this.nameText);
      }

      if (this.cheats.position && this.posText === undefined) {
        let x = this.position.x + this.radius,
            y = this.position.y + (this.radius * 1),
            textP = 'Pos(' + Utility.Strings.flt2str(this.position.x, 0) +
                ', ' + Utility.Strings.flt2str(this.position.y, 0) + ')',
            textV = ' Vel(' + Utility.Strings.flt2str(this.position.vx, 1) +
                ', ' + Utility.Strings.flt2str(this.position.vy, 1) + ')';

        this.posText = new PIXI.Text(textP + textV, this.txtOpts);
        this.posText.position.set(x, y);
        this.cheatsContainer.addChild(this.posText);
      }

      if (this.cheats.gridLocation && this.gridText === undefined) {
        let x = this.position.x + this.radius,
            y = this.position.y + (this.radius * -0.5),
            text = '(' + this.gridLocation.toString() + ')';
        this.gridText = new PIXI.Text(text, this.txtOpts);
        this.gridText.position.set(x, y);
        this.cheatsContainer.addChild(this.gridText);
      }

      return this;
    }

    /**
     * Update the cheats if they are on
     * @return {Entity}
     */
    updateCheats() {
      this.addCheats();

      if (this.cheats.angle) {
        let dirV = new Vec(
            this.position.x + this.radius * Math.sin(this.position.direction),
            this.position.y + this.radius * Math.cos(this.position.direction)
        );
        this.graphics.lineStyle(2, 0x000000, 2);
        this.graphics.beginFill();
        this.graphics.moveTo(this.position.x, this.position.y);
        this.graphics.lineTo(dirV.x, dirV.y);
        this.graphics.endFill();
      }

      if (this.cheats.bounds) {
        let h = this.bounds.height,
            w = this.bounds.width;
        this.graphics.lineStyle(1, 0xFF0000, 1);
        this.graphics.beginFill();
        this.graphics.drawRect(this.bounds.x, this.bounds.y, w, h);
        this.graphics.endFill();
      }

      if (this.cheats.id) {
        let x = this.position.x + this.radius,
            y = this.position.y + (this.radius * 3);
        this.idText = this.cheatsContainer.getChildAt(
            this.cheatsContainer.getChildIndex(this.idText)
        );
        this.idText.position.set(x, y);
      } else {
        if (this.idText !== undefined) {
          this.cheatsContainer.removeChildAt(
              this.cheatsContainer.getChildIndex(this.idText)
          );
          this.idText = undefined;
        }
      }

      if (this.cheats.name) {
        let x = this.position.x + this.radius,
            y = this.position.y + (this.radius * 2);
        this.nameText = this.cheatsContainer.getChildAt(
            this.cheatsContainer.getChildIndex(this.nameText)
        );
        this.nameText.position.set(x, y);
      } else {
        if (this.nameText !== undefined) {
          this.cheatsContainer.removeChildAt(
              this.cheatsContainer.getChildIndex(this.nameText)
          );
          this.nameText = undefined;
        }
      }

      if (this.cheats.direction) {
        let x = this.position.x + this.radius,
            y = this.position.y + (this.radius * 4);
        this.directionText = this.cheatsContainer.getChildAt(
            this.cheatsContainer.getChildIndex(this.directionText)
        );
        this.directionText.text = this.direction;
        this.directionText.position.set(x, y);
      } else {
        if (this.directionText !== undefined) {
          this.cheatsContainer.removeChildAt(
              this.cheatsContainer.getChildIndex(this.directionText)
          );
          this.directionText = undefined;
        }
      }

      if (this.cheats.position) {
        let x = this.position.x + this.radius,
            y = this.position.y + (this.radius * 1),
            textP = 'Pos(' + Utility.Strings.flt2str(this.position.x, 0) +
                ', ' + Utility.Strings.flt2str(this.position.y, 0) + ')',
            textV = ' Vel(' + Utility.Strings.flt2str(this.position.vx, 1) +
                ', ' + Utility.Strings.flt2str(this.position.vy, 1) + ')';
        this.posText = this.cheatsContainer.getChildAt(
            this.cheatsContainer.getChildIndex(this.posText)
        );
        this.posText.text = textP + textV;
        this.posText.position.set(x, y);
      } else {
        if (this.posText !== undefined) {
          this.cheatsContainer.removeChildAt(
              this.cheatsContainer.getChildIndex(this.posText)
          );
          this.posText = undefined;
        }
      }

      if (this.cheats.gridLocation) {
        let x = this.position.x + this.radius,
            y = this.position.y + (this.radius * -0.5),
            idx = this.cheatsContainer.getChildIndex(this.gridText);
        this.gridText = this.cheatsContainer.getChildAt(idx);
        this.gridText.text = this.gridLocation.toString();
        this.gridText.position.set(x, y);
      } else {
        if (this.gridText !== undefined) {
          let idx = this.cheatsContainer.getChildIndex(this.gridText);
          this.cheatsContainer.removeChildAt(idx);
          this.gridText = undefined;
        }
      }

      return this;
    }

    /**
     * Draws it
     * @return {Entity}
     */
    draw() {
      let x = this.position.x,
          y = this.position.y;
      if (this.useSprite) {
        this.graphics.position.x = x;
        this.graphics.position.y = y;
      } else {
        this.graphics.clear();
        this.graphics.lineStyle(0.5, 0x000000, 0.8);
        this.graphics.beginFill(this.color, this.alpha);
        if (this.type === 2) {
          this.vertices = Entity.drawShape(x, y, 8, 10, 5, 0);
          this.graphics.drawPolygon(this.vertices);
        } else {
          this.graphics.drawCircle(x, y, this.radius);
        }
        this.graphics.endFill();
        this.bounds = this.graphics.getBounds();
      }

      this.updateCheats();

      return this;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} points - number of points
     * (or number of sides for polygons)
     * @param {number} radA - "outer" radius of the star
     * @param {number} radB - "inner" radius of the star
     * (if equal to radius1, a polygon is drawn)
     * @param {number} a - initial angle (clockwise),
     * by default, stars and polygons are 'pointing' up
     */
    static drawShape(x, y, points, radA, radB, a) {
      let i, angle, radius, vertices = [];
      if (radB !== radA) {
        points = 2 * points;
      }
      for (i = 0; i <= points; i++) {
        angle = i * 2 * Math.PI / points - Math.PI / 2 + a;
        radius = i % 2 === 0 ? radA : radB;
        let px = x + radius * Math.cos(angle),
            py = y + radius * Math.sin(angle);
        vertices.push(px, py);
      }

      return vertices;
    }

    /**
     * Move around
     * @return {Entity}
     */
    move() {
      for (let i = 0; i < this.collisions.length; i++) {
        let cObj = this.collisions[i];
        if (cObj.distance <= this.radius) {
          switch (cObj.entity.type) {
            case 0:
              // Wall
              // Get the vector that points out from the
              // surface the circle is bouncing on.
              let bLN = Vec.vectorBetween(
                  this.position,
                  cObj.vecI
                  ).unitVector(),
                  // Set the new circle velocity by reflecting
                  // the old velocity in `bounceLineNormal`.
                  dot = this.position.vx * bLN.x + this.position.vy * bLN.y;

              this.force.x -= 2 * dot * bLN.x;
              this.force.y -= 2 * dot * bLN.y;

              if (this.force.x > 3 ||
                  this.force.y > 3 ||
                  this.force.x < -3 ||
                  this.force.y < -3) {
                this.force.scale(0.095);
              }
              break;
            case 1:
            case 2:
              // Noms or Gnars
              this.force.x = cObj.target.vx;
              this.force.y = cObj.target.vy;
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
     * @return {Entity}
     */
    tick() {
      this.age += 1;
      if (this.moving) {
        this.move();
      }
      this.draw();

      return this;
    }

    /**
     * Perform the start of a drag
     *
     * @param {MouseEvent} event
     * @return {Entity}
     */
    onDragStart(event) {
      this.data = event.data;
      this.alpha = 0.5;
      this.dragging = true;

      return this;
    }

    /**
     * Perform the move of a drag
     *
     * @return {Entity}
     */
    onDragMove(event) {
      this.data = event.data;
      if (this.dragging) {
        let newPosition = this.data.getLocalPosition(event.target.parent);
        this.position.set(newPosition.x, newPosition.y);
        this.draw();
      }

      return this;
    }

    /**
     * Perform the end of a drag
     *
     * @return {Entity}
     */
    onDragEnd(event) {
      this.data = event.data;
      this.alpha = 1;
      this.dragging = false;
      let newPosition = this.data.getLocalPosition(event.target.parent);
      this.position.set(newPosition.x, newPosition.y);

      // set the interaction data to null
      this.data = null;

      return this;
    }

    /**
     * Perform the action for mouse down
     *
     * @return {Entity}
     */
    onMouseDown(event) {
      this.data = event.data;
      this.isDown = true;
      this.alpha = 1;

      return this;
    }

    /**
     * Perform the action for mouse up
     *
     * @return {Entity}
     */
    onMouseUp(event) {
      this.data = event.data;
      this.isDown = false;

      return this;
    }

    /**
     * Perform the action for mouse over
     *
     * @return {Entity}
     */
    onMouseOver(event) {
      this.data = event.data;
      this.isOver = true;
      if (this.isDown) {
        return this;
      }

      return this;
    }

    /**
     * Perform the action for mouse out
     *
     * @return {Entity}
     */
    onMouseOut(event) {
      this.data = event.data;
      this.isOver = false;
      if (this.isDown) {
        return this;
      }

      return this;
    }
  }

  Entity.entityTypes = ['Wall', 'Nom', 'Gnar', 'Entity Agent', 'Agent', 'Agent Worker'];
  Entity.styles = ['black', 'green', 'red', 'olive', 'blue', 'navy', 'magenta', 'cyan', 'purple', 'aqua', 'lime'];
  Entity.hexStyles = [0x000000, 0x00FF00, 0xFF0000, 0x808000, 0x0000FF, 0x000080, 0xFF00FF, 0x00FFFF, 0x800080, 0x00FFFF, 0x00FF00];

// Checks for Node.js - http://stackoverflow.com/a/27931000/1541408
  if (typeof process !== 'undefined') {
    module.exports = {
      Entity: Entity
    };
  } else {
    global.Entity = Entity;
  }

}(this));
