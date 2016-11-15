(function (global) {
  'use strict';

  class WaterWorld extends GameWorld {

    /**
     * World object contains many agents and walls and food and stuff
     * @extends GameWorld
     * @constructor
     *
     * @return {WaterWorld}
     */
    constructor() {
      let worldOpts = {
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
            cellSize: 100,
            cellSpacing: 0,
            size: 8,
            pointy: false,
            fill: false
          },
          render: {
            background: 0xFFFFFF,
            antialiasing: true,
            autoResize: false,
            resizable: false,
            transparent: false,
            resolution: 1,
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
            worker: true,
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
        grid = new Grid(null, null, worldOpts.grid),
        maze = new Maze(grid.init()),
        agents = [
          new Agent(new Vec(grid.startCell.center.x, grid.startCell.center.y), worldOpts.agent),
          new Agent(new Vec(grid.startCell.center.x, grid.startCell.center.y), worldOpts.agent)
        ];
      worldOpts.grid = maze.grid;
      worldOpts.maze = maze;

      super(agents, maze.walls, worldOpts);
      // this.agents[0].load('zoo/wateragent.json');
      //this.agents[1].load('zoo/wateragent.json');

      if (document.getElementById('flotreward')) {
        this.rewards = new FlotGraph(this.agents);
      }
      this.init();

      return this;
    }

  }
  global.WaterWorld = WaterWorld;

}(this));
