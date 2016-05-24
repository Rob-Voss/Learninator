(function (global) {
    "use strict";

    const renderOpts = {
            antialiasing: false,
            autoResize: false,
            resizable: false,
            transparent: false,
            resolution: window.devicePixelRatio,
            noWebGL: false,
            width: 600,
            height: 600
        },
        worldOpts = {
            collision: {
                type: 'brute'
                // type: 'grid'
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
        };

    class WaterWorld extends World {

        /**
         * World object contains many agents and walls and food and stuff
         * @name WaterWorld
         * @extends World
         * @constructor
         *
         * @returns {WaterWorld}
         */
        constructor() {
            let agents = [
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
            let maze = new Maze(gridOptions);

            worldOpts.grid = maze.grid;
            super(agents, maze.walls, worldOpts, renderOpts);
            this.agents[0].load('zoo/wateragent.json');
            // this.agents[1].load('zoo/wateragent.json');

            return this;
        }
    }
    global.WaterWorld = WaterWorld;

}(this));
