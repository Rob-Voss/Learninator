/**
 * CellShape
 * @class
 * @extends Cell
 * @property {number} cellSize
 * @property {number} cellWidth
 * @property {number} cellHeight
 * @property {number} cellSpacing
 * @property {boolean} pointy
 * @property {boolean} useSprite
 * @property {boolean} fill
 * @property {boolean} cheats
 * @property {Vec} center
 * @property {Array} corners
 * @property {boolean} isOver
 * @property {boolean} isDown
 * @property {string} color
 * @property {number} alpha
 * @property {Array} walls
 * @property {txtOpts} txtOpts
 * @property {PIXI.Container} cheatsContainer
 * @property {PIXI.Container} wallContainer
 * @property {PIXI.Sprite|PIXI.Graphics} graphics
 */
class CellShape extends Cell {

  /**
   * Create a CellShape
   * @constructor
   *
   * @param {number} x
   * @param {number} y
   * @param {gridOpts} opts
   * @return {CellShape}
   */
  constructor(x, y, opts) {
    super(x, y);

    this.cellSize = Utility.getOpt(opts, 'cellSize', 50);
    this.cellWidth = Utility.getOpt(opts, 'cellWidth', 50);
    this.cellHeight = Utility.getOpt(opts, 'cellHeight', 50);
    this.cellSpacing = Utility.getOpt(opts, 'cellSpacing', 0);
    this.pointy = Utility.getOpt(opts, 'pointy', false);
    this.useSprite = Utility.getOpt(opts, 'useSprite', false);
    this.fill = Utility.getOpt(opts, 'fill', false);
    this.cheats = Utility.getOpt(opts, 'cheats', false);
    this.center = new Vec(
      this.x * this.cellWidth + (this.cellWidth / 2),
      this.y * this.cellHeight + (this.cellHeight / 2)
    );
    this.corners = [
      new Vec(this.x * this.cellWidth, this.y * this.cellHeight),
      new Vec(this.x * this.cellWidth + this.cellWidth, this.y * this.cellHeight),
      new Vec(this.x * this.cellWidth + this.cellWidth, this.y * this.cellHeight + this.cellHeight),
      new Vec(this.x * this.cellWidth, this.y * this.cellHeight + this.cellHeight)
    ];
    this.isOver = false;
    this.isDown = false;
    this.color = 0xFFFFFF;
    this.alpha = 0;
    this.walls = [];
    this.txtOpts = {
      fontSize: '9px',
      fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
      fill: '#000000',
      align: 'left'
    };
    // Add a container to hold our display cheats
    this.cheatsContainer = new PIXI.Container();
    this.wallContainer = new PIXI.Container();
    if (this.useSprite) {
      this.graphics = new PIXI.Sprite.fromFrame('floor.png');
      this.graphics.width = this.cellSize;
      this.graphics.height = this.cellSize;
      this.graphics.anchor.set(0.5, 0.5);
      this.graphics.scale.set(1, 1);
      this.graphics.position.x = this.center.x;
      this.graphics.position.y = this.center.y;
      this.graphics.alpha = this.alpha;
    } else {
      this.graphics = new PIXI.Graphics();
    }

    this.graphics.interactive = true;
    this.graphics
      .on('mousedown', (event) => {
        this.event = event;
        this.data = event.data;
        this.color = 0x00FF00;
        this.alpha = 1;
        this.isDown = true;
        this.draw();
      })
      .on('mouseup', (event) => {
        this.event = event;
        this.color = 0xFFFFFF;
        this.alpha = 0;
        this.isDown = false;
        this.draw();
      })
      .on('mouseover', (event) => {
        this.event = event;
        this.color = 0xFF0000;
        this.alpha = 0.5;
        this.isOver = true;
        this.draw();
      })
      .on('mouseout', (event) => {
        this.event = event;
        this.color = 0xFFFFFF;
        this.alpha = 0;
        this.isOver = false;
        this.draw();
      });
    this.graphics.addChild(this.cheatsContainer);
    this.graphics.addChild(this.wallContainer);
    this.draw();

    return this;
  }

  /**
   * Add cheats to the cheat container
   * @return {CellShape}
   */
  addCheats() {
    if (this.cheats.id) {
      this.corners.forEach((corner, id) => {
        if (corner.idText === undefined) {
          let inside = this.center.getPointBetween(corner, 85);
          corner.idText = new PIXI.Text(id, this.txtOpts);
          corner.idText.anchor = new PIXI.Point(0.5, 0.5);
          corner.idText.position = new PIXI.Point(inside.x, inside.y);
          this.cheatsContainer.addChild(corner.idText);
        }
      });
    }

    if (this.cheats.direction) {
      this.walls.forEach((wall, dir) => {
        if (wall.directionText === undefined) {
          let midWall = wall.v1.getPointBetween(wall.v2, 50),
            inside = midWall.getPointBetween(this.center, 20);
          this.txtOpts.fill = "#0000CC";
          wall.directionText = new PIXI.Text(dir, this.txtOpts);
          wall.directionText.style.fill = 0x0000FF;
          wall.directionText.anchor = new PIXI.Point(0.5, 0.5);
          wall.directionText.rotation = wall.angle;
          wall.directionText.position = new PIXI.Point(inside.x, inside.y);
          this.cheatsContainer.addChild(wall.directionText);
        }
      });
      this.txtOpts.fill = "#CC0000";
    }

    if (this.cheats.position && this.posText === undefined) {
      this.posText = new PIXI.Text(this.center.toString() + '\n' + this.toString(), this.txtOpts);
      this.posText.position.set(this.center.x - this.size / 2, this.center.y - 7);
      this.cheatsContainer.addChild(this.posText);
    }

    if (this.cheats.gridLocation && this.gridText === undefined) {
      this.gridText = new PIXI.Text(this.toString(), this.txtOpts);
      this.gridText.position.set(this.center.x - 8, this.center.y - 4);
      this.cheatsContainer.addChild(this.gridText);
    }

    return this;
  }

  /**
   * Update the values of the cheats
   * @return {CellShape}
   */
  updateCheats() {
    this.addCheats();
    if (this.cheats.id) {
      this.corners.forEach((corner, id) => {
        corner.idText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(corner.idText));
        corner.idText.text = id;
      });
    } else {
      this.corners.forEach((corner) => {
        if (corner.idText !== undefined) {
          this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(corner.idText));
          corner.idText = undefined;
        }
      });
    }

    if (this.cheats.direction) {
      this.walls.forEach((wall, dir) => {
        wall.directionText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(wall.directionText));
        wall.directionText.text = dir;
      });
    } else {
      this.walls.forEach((wall) => {
        if (wall.directionText !== undefined) {
          this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(wall.directionText));
          wall.directionText = undefined;
        }
      });
    }

    if (this.cheats.position) {
      this.posText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.posText));
      this.posText.text = this.center.toString();
    } else {
      if (this.posText !== undefined) {
        this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(this.posText));
        this.posText = undefined;
      }
    }

    if (this.cheats.gridLocation) {
      this.gridText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.gridText));
      this.gridText.text = this.toString();
    } else {
      if (this.gridText !== undefined) {
        this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(this.gridText));
        this.gridText = undefined;
      }
    }
    return this;
  }

  /**
   * Draw the graphics
   * @return {CellShape}
   */
  draw() {
    if (this.useSprite) {
      this.graphics.position.x = this.center.x;
      this.graphics.position.y = this.center.y;
      this.graphics.alpha = this.alpha;
    } else {
      this.graphics.clear();
      this.graphics.lineStyle(0, 0x000000, this.alpha);
      if (this.fill) {
        this.graphics.beginFill(this.color, this.alpha);
      }
      this.graphics.drawRect(this.corners[0].x, this.corners[0].y, this.size, this.size);
      if (this.fill) {
        this.graphics.endFill();
      }
      this.bounds = this.graphics.getBounds();

      if (this.reward !== null && this.value !== null) {
        let rew = this.reward.toFixed(1),
          val = this.value.toFixed(2),
          rewTxt = 'R:' + rew,
          valTxt = 'V:' + val;
        if (this.rewardText === undefined) {
          this.rewardText = new PIXI.Text(rewTxt, this.txtOpts);
          this.rewardText.anchor = new PIXI.Point(0.5, 0.5);
          this.rewardText.position.set(this.center.x, this.center.y - 8);
          this.graphics.addChild(this.rewardText);
        } else {
          this.rewardText = this.graphics.getChildAt(this.graphics.getChildIndex(this.rewardText));
        }
        this.rewardText.text = (rew != 0) ? rewTxt : '';

        if (this.valueText === undefined) {
          this.valueText = new PIXI.Text(valTxt, this.txtOpts);
          this.valueText.anchor = new PIXI.Point(0.5, 0.5);
          this.valueText.position.set(this.center.x, this.center.y + 8);
          this.graphics.addChild(this.valueText);
        } else {
          this.valueText = this.graphics.getChildAt(this.graphics.getChildIndex(this.valueText));
        }
        this.valueText.text = (val != 0) ? valTxt : '';
      }
    }

    this.updateCheats();

    return this;
  }

  /**
   * Add a cell
   * @param {Cell} a
   * @param {Cell} b
   * @returns {Cell}
   */
  add(a, b) {
    return super.add(a, b);
  }

  /**
   *
   * @returns {Array}
   */
  pathToOrigin() {
    return super.pathToOrigin();
  }

  /**
   *
   * @param cell
   * @param dir
   * @returns {Cell}
   */
  neighbor(cell, dir) {
    return Cell.neighbor(cell, dir);
  }

  /**
   *
   * @returns {number}
   */
  score() {
    return super.score();
  }

  /**
   *
   * @returns {*[]}
   */
  toArray() {
    return super.toArray();
  }

  /**
   *
   * @returns {string}
   */
  toString() {
    return super.toString();
  }

  /**
   *
   * @returns {Cell}
   */
  visit() {
    return super.visit();
  }
}
