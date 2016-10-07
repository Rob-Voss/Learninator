(function(global) {
  'use strict';

  class WaterWorldEX extends GameWorld {

    /**
     * World object contains many agents and walls and food and stuff
     * @name WaterWorldEX
     * @extends GameWorld
     * @constructor
     *
     * @return {WaterWorldEX}
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
            numActions: 4,
            numEyes: 30,
            numTypes: 5,
            numPriopreception: 2,
            range: 120,
            proximity: 120,
            radius: 10,
            interactive: false,
            useSprite: false,
            worker: false
          },
          entity: {
            number: 20,
            radius: 10,
            interactive: true,
            useSprite: false,
            moving: true
          },
          entityAgent: {
            number: 2,
            radius: 10,
            interactive: true,
            useSprite: false,
            moving: true
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

      this.init();

      return this;
    }

    /**
     * Initialize the world
     */
    init() {
      let animate = () => {
        if (!this.pause) {
          this.deltaTime = GameWorld.time() - this.lastTime;
          this.lastTime = GameWorld.time();
          for (let k = 0; k < this.stepsPerTick; k++) {
            this.tick(this.deltaTime);
          }
        }
        this.renderer.render(this.stage);
        requestAnimationFrame(animate);
      };

      // Walls
      this.addWalls();
      // Add the entities
      this.addEntities();
      // Population of Agents that are considered 'smart' entities for the environment
      this.addEntityAgents();
      // Population of Agents for the environment
      this.addAgents();

      this.entityAgents[0].enemy = this.agents[0];
      this.entityAgents[0].target = this.agents[1];

      this.entityAgents[1].enemy = this.agents[1];
      this.entityAgents[1].target = this.agents[0];

      this.deltaTime = 0;
      this.lastTime = GameWorld.time();
      animate();
    }

  }
  global.WaterWorldEX = WaterWorldEX;

}(this));
