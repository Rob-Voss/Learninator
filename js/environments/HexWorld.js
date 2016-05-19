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
                resolution: window.devicePixelRatio,
                width: 600,
                height: 600
            };

            let agentOpts = {
                brainType: 'RL.DQNAgent',
                worker: false,
                range: 120,
                proximity: 120,
                radius: 10,
                numEyes: 30,
                numTypes: 5,
                numActions: 4,
                numProprioception: 2,
                collision: true,
                interactive: false,
                useSprite: false
            };
            let agents = [
                new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts),
                new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts)
            ];

            let worldOpts = {
                simSpeed: 1,
                collision: {
                    type: 'brute',
                    cheats: {
                        brute: false,
                        quad: false,
                        grid: false
                    }
                },
                cheats: {
                    id: false,
                    name: false,
                    direction: false,
                    gridLocation: true,
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
                size: 5,
                cheats: worldOpts.cheats,
                tileSize: 30,
                tileSpacing: 20,
                pointyTiles: false,
                fill: false
            };

            let maze = new Maze({
                xCount: renderOpts.width / gridOptions.tileSize,
                yCount: renderOpts.height / gridOptions.tileSize,
                width: renderOpts.width,
                height: renderOpts.height,
                closed: false,
                cheats: false,
                grid: new HexGrid(gridOptions)
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
