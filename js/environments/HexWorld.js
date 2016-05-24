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

            let agentOpts   = {
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
                },
                agents      = [
                    new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts),
                    new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts)
                ],
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
                worldOpts   = {
                    simSpeed: 1,
                    collision: {
                        type: 'grid',
                        cheats: cheats
                    },
                    cheats: cheats,
                    numEntities: 20,
                    entityOpts: {
                        radius: 10,
                        collision: true,
                        interactive: true,
                        useSprite: false,
                        moving: true
                    }
                },
                gridOptions = {
                    width: renderOpts.width,
                    height: renderOpts.height,
                    cheats: cheats,
                    buffer: 0,
                    cellSize: 30,
                    cellSpacing: 20,
                    size: 7,
                    pointy: false,
                    fill: false
                },
                grid        = new HexGrid(gridOptions),
                maze        = new Maze({
                    grid: grid,
                    closed: false
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
