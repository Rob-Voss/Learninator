(function (global) {
    "use strict";

    class MazeWorld extends World {
        /**
         * World object contains many agents and walls and food and stuff
         * @name WaterWorld
         * @extends World
         * @constructor
         *
         * @returns {WaterWorld}
         */
        constructor() {
            let renderOpts = {
                    antialiasing: true,
                    autoResize: false,
                    resizable: false,
                    transparent: false,
                    resolution: 1,//window.devicePixelRatio,
                    noWebGL: false,
                    width: 600,
                    height: 600
                },
                agentOpts = {
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
                agents = [
                    new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts)
                    // new AgentTD(new Vec(1, 1), {
                    //     brainType: 'convnetjs.TDAgent',
                    //     numEyes: 9,
                    //     numTypes: 3,
                    //     range: 85,
                    //     proximity: 85,
                    //     radius: 10,
                    //     worker: false,
                    //     collision: true,
                    //     interactive: false,
                    //     useSprite: false,
                    //     cheats: cheats
                    // })
                ],
                gridOpts = {
                    width: renderOpts.width,
                    height: renderOpts.height,
                    buffer: 0,
                    size: 10,
                    cellSize: 60,
                    cellSpacing: 0,
                    fill: false,
                    closed: false,
                    cheats: cheats
                },
                grid = new Grid(gridOpts);
            gridOpts.grid = grid;
            let maze = new Maze(gridOpts),
                worldOpts = {
                    simSpeed: 1,
                    collision: {
                        type: 'brute',
                        cheats: cheats
                    },
                    grid: maze.grid,
                    cheats: cheats,
                    numEntities: 30,
                    entityOpts: {
                        radius: 10,
                        collision: true,
                        interactive: true,
                        useSprite: false,
                        moving: false
                    }
                };

            super(agents, maze.walls, worldOpts, renderOpts);
            maze.drawSolution();
            this.stage.addChild(maze.cheatsContainer);
            // this.agents[0].load('zoo/mazeagent.json');

            return this;
        }
    }

    global.MazeWorld = MazeWorld;

}(this));
