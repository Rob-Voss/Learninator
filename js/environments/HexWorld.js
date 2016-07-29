(function(global) {
  'use strict';

  class HexWorld extends World {
    /**
     * A Hexagonal world
     * @name HexWorld
     * @extends World
     * @constructor
     *
     * @return {HexWorld}
     */
    constructor() {
      let renderOpts = {
            backgroundColor: 0xFFFFFF,
            antialiasing: true,
            autoResize: false,
            resizable: true,
            transparent: false,
            resolution: window.devicePixelRatio,
            width: 800,
            height: 800
          },
          /**
           * @type {cheatsOpts}
           */
          cheats = {
            id: false,
            name: false,
            angle: false,
            bounds: false,
            direction: false,
            gridLocation: false,
            position: false
          },
          /**
           * @type {agentOpts}
           */
          agentOpts = {
            brainType: 'RL.DQNAgent',
            range: 90,
            proximity: 90,
            radius: 10,
            numEyes: 30,
            numTypes: 5,
            numActions: 4,
            numProprioception: 2,
            collision: true,
            interactive: false,
            useSprite: false,
            worker: false,
            cheats: cheats
          },
          /**
           * @type {gridOpts}
           */
          gridOpts = {
            width: renderOpts.width,
            height: renderOpts.height,
            buffer: 0,
            size: 4,
            cellSize: 80,
            cellSpacing: 0,
            pointy: true,
            useSprite: true,
            fill: false,
            cheats: cheats
          },
          orientation = (gridOpts.pointy ? Layout.layoutPointy : Layout.layoutFlat),
          size = new Point(gridOpts.cellSize, gridOpts.cellSize),
          origin = new Point(gridOpts.width / 2, gridOpts.height / 2),
          //origin = new Point(0, 0),
          layout = new Layout(orientation, size, origin),
          cells = HexGrid.shapeRectangle(layout, gridOpts),
          //cells = HexGrid.shapeHexagon(layout, gridOpts),
          //cells = HexGrid.shapeRing(0, 0, layout, gridOpts),
          //cells = HexGrid.shapeParallelogram(-1, -2, 1, 1, layout, gridOpts),
          //cells = HexGrid.shapeTrapezoidal(-1, 1, -2, 1, false, layout, gridOpts),
          //cells = HexGrid.shapeTriangle1(2, layout, gridOpts),
          //cells = HexGrid.shapeTriangle2(2, layout, gridOpts),
          grid = new HexGrid(layout, cells, gridOpts),
          maze = new Maze(grid.init()),
          agents = [
            new Agent(new Vec(grid.startCell.center.x, grid.startCell.center.y), agentOpts),
            new Agent(new Vec(grid.startCell.center.x, grid.startCell.center.y), agentOpts)
          ],
          worldOpts = {
            simSpeed: 1,
            cheats: cheats,
            grid: maze.grid,
            maze: maze,
            collision: {
              type: 'brute'
            },
            numEntities: 20,
            entityOpts: {
              radius: 10,
              collision: true,
              interactive: true,
              useSprite: false,
              moving: true,
              cheats: cheats
            }
          };

      super(agents, maze.walls, worldOpts, renderOpts);

      this.init();

      return this;
    }

    drawSolution() {
      this.maze.drawSolution(this.stage);
    }
  }
  global.HexWorld = HexWorld;

}(this));
