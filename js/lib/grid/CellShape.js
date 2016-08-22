/**
 * Original code borrowed from
 * https://github.com/felipecsl/random-maze-generator
 *
 */
(function (global) {
  'use strict';

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
      this.size = Utility.getOpt(opts, 'cellSize', 50);
      this.pointy = Utility.getOpt(opts, 'pointy', false);
      this.useSprite = Utility.getOpt(opts, 'useSprite', false);
      this.fill = Utility.getOpt(opts, 'fill', false);
      this.cheats = Utility.getOpt(opts, 'cheats', false);
      this.isOver = false;
      this.isDown = false;
      this.color = 0x000000;
      this.alpha = 0;
      this.walls = [];
      this.center = new Vec(
        this.x * this.size + (this.size / 2),
        this.y * this.size + (this.size / 2)
      );
      this.corners = [
        new Vec(this.x * this.size, this.y * this.size),
        new Vec(this.x * this.size + this.size, this.y * this.size),
        new Vec(this.x * this.size + this.size, this.y * this.size + this.size),
        new Vec(this.x * this.size, this.y * this.size + this.size)
      ];

      // Add a container to hold our display cheats
      this.cheatsContainer = new PIXI.Container();
      if (this.useSprite) {
        this.graphics = new PIXI.Sprite.fromFrame('floor.png');
        this.graphics.width = this.size;
        this.graphics.height = this.size;
        this.graphics.anchor.set(0.5, 0.5);
      } else {
        this.graphics = new PIXI.Graphics();
      }
      this.graphics.interactive = true;
      this.graphics
        .on('mousedown', (event) => {
            this.event = event;
            this.data = event.data;
            this.color = 0x00FF00;
            this.alpha = 0.5;
            this.isDown = true;
            this.draw();
          })
        .on('mouseup', (event) => {
            this.event = event;
            this.color = 0x000000;
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
            this.color = 0x000000;
            this.alpha = 0;
            this.isOver = false;
            this.draw();
          });
      this.draw();
      this.graphics.addChild(this.cheatsContainer);

      return this;
    }

    /**
     *
     * @return {CellShape}
     */
    addCheats() {
      this.txtOpts = {font: '10px Arial', fill: '#FF0000', align: 'center'};

      if (this.cheats.gridLocation && this.gridText === undefined) {
        this.gridText = new PIXI.Text(this.toString(), this.txtOpts);
        this.gridText.position.set(this.center.x - 8, this.center.y - 4);
        this.cheatsContainer.addChild(this.gridText);
      }

      if (this.cheats.position && this.posText === undefined) {
        this.posText = new PIXI.Text(this.center.toString() + '\n' + this.toString(), this.txtOpts);
        this.posText.position.set(this.center.x - this.size / 2, this.center.y - 7);
        this.cheatsContainer.addChild(this.posText);
      }

      return this;
    }

    /**
     *
     * @return {CellShape}
     */
    draw() {
      if (this.useSprite) {
        this.graphics.position.x = this.center.x;
        this.graphics.position.y = this.center.y;
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

        if (this.reward && this.value) {
          let rew = this.reward.toFixed(1),
            val = this.value.toFixed(2);
          if (this.rewardText === undefined) {
            this.rewardText = new PIXI.Text(rew !== 0.0 ? 'R' + rew : '', {
              font: '8px Arial',
              fill: rew < 0.0 ? '#000000' : '#00FF00',
              align: 'center'
            });
            this.rewardText.anchor = new PIXI.Point(0.5, 0.5);
            this.rewardText.position.set(this.center.x, this.center.y - 8);
            this.graphics.addChild(this.rewardText);
          } else {
            this.rewardText = this.graphics.getChildAt(this.graphics.getChildIndex(this.rewardText));
            this.rewardText.text = rew !== "0.0" ? 'R' + rew : '';
          }

          if (this.valueText === undefined) {
            this.valueText = new PIXI.Text(val !== 0.00 ? val : '', {
              font: '8px Arial',
              fill: val < 0.0 ? '#000000' : '#00FF00',
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

    /**
     *
     * @return {CellShape}
     */
    updateCheats() {
      this.addCheats();
      if (this.cheats.gridLocation) {
        this.gridText = this.cheatsContainer.getChildAt(this.cheatsContainer.getChildIndex(this.gridText));
        this.gridText.text = this.toString();
      } else {
        if (this.gridText !== undefined) {
          this.cheatsContainer.removeChildAt(this.cheatsContainer.getChildIndex(this.gridText));
          this.gridText = undefined;
        }
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

      return this;
    }

    add(a, b) {
      return super.add(a, b);
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
  }

// Checks for Node.js - http://stackoverflow.com/a/27931000/1541408
  if (typeof process !== 'undefined') {
    module.exports = {
      CellShape: CellShape
    };
  } else {
    global.CellShape = CellShape;
  }

}(this));
