(function (global) {
  "use strict";

  /**
   * @extends Hex
   */
  class HexShape extends Hex {

    /**
     *
     * @param {Hex|{q: *, r: *, s: *}} hex
     * @param {Layout} layout
     * @param {gridOpts} opts
     * @return {HexShape}
     * @constructor
     */
    constructor(hex, layout, opts) {
      super(hex.q, hex.r, hex.s);
      this.layout = layout;
      this.size = Utility.getOpt(opts, 'size', 10);
      this.cellSize = Utility.getOpt(opts, 'cellSize', 50);
      this.cellSpacing = Utility.getOpt(opts, 'cellSpacing', 0);
      this.pointy = Utility.getOpt(opts, 'pointy', false);
      this.useSprite = Utility.getOpt(opts, 'useSprite', false);
      this.fill = Utility.getOpt(opts, 'fill', false);
      this.cheats = Utility.getOpt(opts, 'cheats', false);
      this.center = this.layout.hexToPixel(this);
      this.corners = this.layout.polygonCorners(this);
      this.corners.forEach((corner) => {
        this.polyCorners.push(corner.x, corner.y);
      });
      this.height = this.cellSize * 2;
      this.width = Math.sqrt(3) / 2 * this.height;

      this.isOver = false;
      this.isDown = false;
      this.reward = null;
      this.value = null;
      this.walls = [];

      // Add a container to hold our display cheats
      this.cheatsContainer = new PIXI.Container();
      this.wallContainer = new PIXI.Container();
      this.color = HexShape.colorForHex(this.q, this.r, this.s);
      this.alpha = 1;
      if (this.useSprite) {
        this.graphics = new PIXI.Sprite(PIXI.Texture.fromFrame('dirt_0' + Utility.Maths.randi(1, 9) + '.png'));
        this.graphics.anchor.set(0.5, 0.5);
        this.graphics.scale.set(1, 1);
        this.graphics.position.x = this.center.x;
        this.graphics.position.y = this.center.y;
        this.graphics.alpha = this.alpha;
        if (!this.pointy) {
          this.graphics.rotation = 0.523599;
        }
      } else {
        this.graphics = new PIXI.Graphics();
      }

      this.draw();

      this.graphics.interactive = true;
      this.graphics
        .on('mousedown', (event) => {
            this.event = event;
            this.data = event.data;
            this.color = 0x00FF00;
            this.alpha = 0.7;
            this.isDown = true;
            this.draw();
        })
        .on('mouseup', (event) => {
            this.event = event;
            this.color = HexShape.colorForHex(this.q, this.r, this.s);
            this.alpha = 1;
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
            this.color = HexShape.colorForHex(this.q, this.r, this.s);
            this.alpha = 1;
            this.isOver = false;
            this.draw();
        });
      this.graphics.addChild(this.cheatsContainer);

      return this;
    }

    /**
     * Add cheats to the cheat container
     * @returns {HexShape}
     */
    addCheats() {
      this.txtOpts = {fontSize: "10px Arial", fill: "#CC0000", align: "center"};
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
        this.posText = new PIXI.Text(this.center.toString(), this.txtOpts);
        this.posText.position.set(this.center.x - 8, this.center.y - 10);
        this.cheatsContainer.addChild(this.posText);
      }

      if (this.cheats.gridLocation && this.gridText === undefined) {
        this.gridText = new PIXI.Text(this.toString(), this.txtOpts);
        this.gridText.position.set(this.center.x - 8, this.center.y - 5);
        this.cheatsContainer.addChild(this.gridText);
      }

      return this;
    }

    /**
     * Draw the shape
     * @return {HexShape}
     */
    draw() {
      if (this.useSprite) {
        this.graphics.position.x = this.center.x;
        this.graphics.position.y = this.center.y;
        this.graphics.alpha = this.alpha;
      } else {
        this.graphics.clear();
        this.graphics.color = this.color;
        this.graphics.lineStyle(0, 0x000000, 0);
        if (this.fill) {
          this.graphics.beginFill(this.color, this.alpha);
        }
        this.graphics.drawPolygon(this.polyCorners);
        if (this.fill) {
          this.graphics.endFill();
        }
        this.bounds = this.graphics.getBounds();

        if (this.reward !== null && this.value !== null) {
          let rew = this.reward.toFixed(1),
            val = this.value.toFixed(2);
          if (this.rewardText === undefined) {
            this.rewardText = new PIXI.Text(rew !== 0.0 ? 'R' + rew : '', {
              fontSize: '8px Arial',
              fill: rew < 0.0 ? '#000000' : '#000000',
              align: 'center'
            });
            this.rewardText.anchor = new PIXI.Point(0.5, 0.5);
            this.rewardText.position.set(this.center.x, this.center.y - 8);
            this.graphics.addChild(this.rewardText);
          } else {
            this.rewardText = this.graphics.getChildAt(this.graphics.getChildIndex(this.rewardText));
            this.rewardText.text = rew !== 0.0 ? 'R' + rew : '';
          }

          if (this.valueText === undefined) {
            this.valueText = new PIXI.Text(val !== 0.00 ? val : '', {
              fontSize: '8px Arial',
              fill: val === 0.0 ? '#000000' : '#000000',
              align: 'center'
            });
            this.valueText.anchor = new PIXI.Point(0.5, 0.5);
            this.valueText.position.set(this.center.x, this.center.y);
            this.graphics.addChild(this.valueText);
          } else {
            this.valueText = this.graphics.getChildAt(this.graphics.getChildIndex(this.valueText));
            this.valueText.text = val !== 0.00 ? val : '';
          }
        }
      }

      this.updateCheats();

      return this;
    }

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
     *
     * @param {Hex} hex
     * @param {Number} dir
     * @returns {Hex}
     */
    diagonalNeighbor(hex, dir) {
      return super.diagonalNeighbor(hex, dir);
    }

    /**
     *
     * @param {Hex} a
     * @param {Hex} b
     * @returns {number}
     */
    distance(a, b) {
      return super.distance(a, b);
    }

    lineDraw(a, b) {
      return super.lineDraw(a, b);
    }

    neighbor(cell, dir) {
      return super.neighbor(cell, dir);
    }

    pathToOrigin() {
      return super.pathToOrigin();
    }

    score() {
      return super.score();
    }

    toArray() {
      return super.toArray();
    }

    toString() {
      return super.toString();
    }

    visit() {
      return super.visit();
    }

    /* Static Functions */

    add(a, b) {
      return Hex.add(a, b);
    }

    diagonals(dir) {
      return Hex.diagonals(dir);
    }

    direction(dir) {
      return Hex.direction(dir);
    }

    len(hex) {
      return Hex.len(hex);
    }

    lerp(a, b, t) {
      return Hex.lerp(a, b, t)
    }

    round(hex) {
      return Hex.round(hex);
    }

    scale(hex, k) {
      return Hex.scale(hex, k);
    }

    subtract(a, b) {
      return Hex.subtract(a, b);
    }

    /**
     * Return a color for this Hex based on it's coords
     * x = green, y = purple, z = blue
     * @return {number}
     */
    static colorForHex(q, r, s) {
      if (q === 0 && r === 0 && s === 0) {
        return 0x000000;
      } else if (q === 0) {
        return 0x59981b;
      } else if (r === 0) {
        return 0x0077b3;
      } else if (s === 0) {
        return 0xb34db2;
      } else {
        return 0xC0C0C0;
      }
    }

  }

// Checks for Node.js - http://stackoverflow.com/a/27931000/1541408
  if (typeof process !== 'undefined') {
    module.exports = {
      HexShape: HexShape
    };
  } else {
    global.HexShape = HexShape;
  }

})(this);
