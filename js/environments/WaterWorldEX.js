var WaterWorldEX = WaterWorldEX || {},
    Vec = Vec || {},
    World = World || {};

(function (global) {
    "use strict";

    class WaterWorldEX extends World {

        /**
         * World object contains many agents and walls and food and stuff
         * @name WaterWorldEX
         * @extends World
         * @constructor
         *
         * @returns {WaterWorldEX}
         */
        constructor() {
            let renderOpts = {
                    antialiasing: false,
                    autoResize: false,
                    resizable: false,
                    transparent: false,
                    resolution: 1,//window.devicePixelRatio,
                    width: 600,
                    height: 600
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
                agentOpts = {
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
                    worker: false,
                    cheats: cheats
                },
                agents = [
                    new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts),
                    new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts)
                ],
                gridOptions = {
                    width: renderOpts.width,
                    height: renderOpts.height,
                    cheats: cheats,
                    buffer: 0,
                    cellSize: 60,
                    cellSpacing: 20,
                    size: 3,
                    pointy: false,
                    fill: false
                },
                grid = new Grid(gridOptions);
            gridOptions.grid = grid;
            let maze = new Maze(gridOptions),
                worldOpts = {
                    collision: {
                        type: 'brute',
                        cheats: cheats
                    },
                    numEntities: 10,
                    entityOpts: {
                        radius: 10,
                        interactive: false,
                        useSprite: false,
                        moving: true,
                        cheats: cheats
                    },
                    numEntityAgents: 2,
                    entityAgentOpts: {
                        brainType: 'RL.DQNAgent',
                        numActions: 5,
                        numEyes: 6,
                        numTypes: 5,
                        numProprioception: 2,
                        range: 85,
                        proximity: 85,
                        radius: 10,
                        interactive: false,
                        useSprite: false,
                        worker: false,
                        cheats: cheats
                    },
                    grid: maze.grid,
                    cheats: cheats
                };

            super(agents, maze.walls, worldOpts, renderOpts);

            this.entityAgents[0].enemy = this.agents[0];
            this.entityAgents[0].target = this.agents[1];

            this.entityAgents[1].enemy = this.agents[1];
            this.entityAgents[1].target = this.agents[0];

            return this;
        }
    }
    global.WaterWorldEX = WaterWorldEX;

}(this));
