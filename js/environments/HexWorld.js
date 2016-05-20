(function (global) {
    "use strict";

    class HexWorld extends World {
        /**
         * A Hexagonal world
         * @name HexWorld
         * @extends World
         * @constructor
         *
         * @returns {HexWorld}
         */
        constructor() {
            let renderOpts = {
                antialiasing: false,
                autoResize: false,
                resizable: false,
                transparent: false,
                resolution: 1,//window.devicePixelRatio,
                width: 800,
                height: 800
            };

            let agentOpts = {
                brainType: 'RL.DQNAgent',
                worker: false,
                range: 90,
                proximity: 90,
                radius: 10,
                numEyes: 30,
                numTypes: 5,
                numActions: 4,
                numProprioception: 2,
                collision: true,
                interactive: false,
                useSprite: false
            };
            let agents    = [
                new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts),
                new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts)
            ];

            let worldOpts = {
                simSpeed: 1,
                collision: {
                    type: 'brute',
                    cheats: false
                },
                cheats: {
                    id: false,
                    name: false,
                    direction: false,
                    gridLocation: false,
                    position: false,
                    walls: false
                },
                numEntities: 20,
                entityOpts: {
                    radius: 10,
                    collision: true,
                    interactive: true,
                    useSprite: false,
                    moving: true
                }
            };

            let gridOptions = {
                    width: renderOpts.width,
                    height: renderOpts.height,
                    cheats: worldOpts.cheats,
                    buffer: 0,
                    cellSize: 30,
                    cellSpacing: 20,
                    size: 5,
                    pointy: true,
                    fill: false
                },
                grid        = new HexGrid(gridOptions);

            let maze = new Maze({
                xCount: grid.xCount,
                yCount: grid.yCount,
                width: renderOpts.width,
                height: renderOpts.height,
                closed: false,
                cheats: false,
                grid: grid
            });

            worldOpts.grid = maze.grid;
            super(agents, maze.walls, worldOpts, renderOpts);
            // this.agents[0].load('zoo/wateragent.json');
            // this.agents[1].load('zoo/wateragent.json');

            return this;
        }
    }
    global.HexWorld = HexWorld;

}(this));
