(function (global) {
  'use strict';

  class HexWorld extends GameWorld {
    /**
     * A Hexagonal world
     * @name HexWorld
     * @extends GameWorld
     * @constructor
     *
     * @return {HexWorld}
     */
    constructor() {
      var worldOpts = {
          collision: {
            type: 'brute',
            cheats: {
              brute: false,
              quad: false,
              grid: false,
              walls: false
            },
          },
          grid: {
            width: 800,
            height: 800,
            buffer: 0,
            size: 15,
            cellSize: 30,
            cellSpacing: 10,
            useSprite: false,
            pointy: false,
            fill: false
          },
          render: {
            background: 0xFFFFFF,
            antialiasing: false,
            autoResize: false,
            resizable: false,
            transparent: false,
            resolution: window.devicePixelRatio,
            noWebGL: false,
            width: 800,
            height: 800
          },
          cheats: {
            id: false,
            name: false,
            angle: false,
            bounds: false,
            direction: false,
            gridLocation: false,
            position: false,
            brute: false,
            quad: false,
            grid: false,
            walls: false
          },
          agent: {
            brainType: 'RL.DQNAgent',
            range: 85,
            proximity: 85,
            radius: 10,
            numEyes: 30,
            numTypes: 5,
            numActions: 4,
            numProprioception: 2,
            worker: false,
            interactive: false,
            useSprite: false
          },
          entity: {
            number: 20,
            radius: 10,
            interactive: true,
            useSprite: false,
            moving: true
          },
          entityAgent: {
            number: 0,
            radius: 0,
            interactive: false,
            useSprite: false,
            moving: false
          }
        },
        orientation = (worldOpts.grid.pointy ? Layout.layoutPointy : Layout.layoutFlat),
        size = new Point(worldOpts.grid.width / worldOpts.grid.cellSize, worldOpts.grid.height / worldOpts.grid.cellSize),
        origin = new Point(worldOpts.grid.width / 2, worldOpts.grid.height / 2),
        layout = new Layout(orientation, size, origin),
        shape = HexGrid.shapeRectangle(layout, worldOpts.grid),
        grid = new HexGrid(worldOpts.grid, shape, layout),
        maze = new Maze(grid.init()),
        agents = [
          new Agent(new Vec(grid.startCell.center.x, grid.startCell.center.y), worldOpts.agent),
          new Agent(new Vec(grid.startCell.center.x, grid.startCell.center.y), worldOpts.agent)
        ];
      worldOpts.grid = grid;
      worldOpts.maze = maze;
      super(agents, maze.walls, worldOpts);

      this.init();

      return this;
    }

    drawSolution() {
      this.maze.drawSolution(this.stage);
    }
  }
  global.HexWorld = HexWorld;

}(this));
