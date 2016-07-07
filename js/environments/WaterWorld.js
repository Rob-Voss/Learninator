(function(global) {
  'use strict';

  const renderOpts = {
        antialiasing: false,
        autoResize: false,
        backgroundColor: 0xCCCCCC,
        resizable: false,
        transparent: false,
        resolution: 1,//window.devicePixelRatio,
        noWebGL: false,
        width: 600,
        height: 600
      },
      worldOpts = {
        collision: {
          type: 'brute'
        },
        cheats: {
          brute: false,
          quad: false,
          grid: false,
          walls: false
        },
        numEntities: 20,
        entityOpts: {
          radius: 10,
          interactive: true,
          useSprite: false,
          moving: true
        }
      },
      agentOpts = {
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
      cheats = {
        id: false,
        name: false,
        angle: false,
        bounds: false,
        direction: false,
        gridLocation: false,
        position: false,
        walls: false
      },
      gridOptions = {
        width: renderOpts.width,
        height: renderOpts.height,
        cheats: cheats,
        buffer: 0,
        cellSize: 200,
        cellSpacing: 0,
        size: 3,
        pointy: false,
        fill: true
      };

  class WaterWorld extends World {

    /**
     * World object contains many agents and walls and food and stuff
     * @extends World
     * @constructor
     *
     * @return {WaterWorld}
     */
    constructor() {
      let grid = new Grid(null, null, gridOptions),
          maze = new Maze(grid.init()),
          agents = [
            new Agent(new Vec(grid.startCell.center.x, grid.startCell.center.y), agentOpts),
            new Agent(new Vec(grid.startCell.center.x, grid.startCell.center.y), agentOpts)
          ];

      worldOpts.grid = maze.grid;
      worldOpts.maze = maze;
      super(agents, maze.walls, worldOpts, renderOpts);
      // this.agents[0].load('zoo/wateragent.json');
      this.agents[1].load('zoo/wateragent.json');

      if (document.getElementById('flotreward')) {
        this.rewards = new FlotGraph(this.agents);
      }
      this.init();

      return this;
    }

  }
  global.WaterWorld = WaterWorld;

}(this));
