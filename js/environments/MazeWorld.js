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
                    resolution: 1,///window.devicePixelRatio,
                    noWebGL: false,
                    width: 600,
                    height: 600
                },
                agents = [
                    new Agent(new Vec(1, 1), {
                        brainType: 'convnetjs.TDAgent',
                        numEyes: 9,
                        numTypes: 3,
                        range: 85,
                        proximity: 85,
                        radius: 10,
                        worker: false,
                        collision: true,
                        interactive: false,
                        useSprite: false,
                        cheats: {
                            gridLocation: false,
                            position: false,
                            name: false,
                            id: false
                        }
                    }),
                    new Agent(new Vec(1, 1), {
                        brainType: 'convnetjs.TDAgent',
                        numEyes: 9,
                        numTypes: 3,
                        range: 85,
                        proximity: 85,
                        radius: 10,
                        worker: false,
                        collision: true,
                        interactive: false,
                        useSprite: false,
                        cheats: {
                            gridLocation: false,
                            position: false,
                            name: false,
                            id: false
                        }
                    })
                ],
                maze = new Maze({
                    xCount: 4,
                    yCount: 2,
                    width: renderOpts.width,
                    height: renderOpts.height,
                    closed: false,
                    cheats: false
                }),
                worldOpts = {
                    grid: maze.grid,
                    simSpeed: 1,
                    collision: {
                        type: 'grid'
                    },
                    cheats: {
                        quad: false,
                        grid: true,
                        walls: false
                    },
                    numEntities: 30
                };

            super(agents, maze.walls, worldOpts, renderOpts);
            this.agents[0].load('zoo/mazeagent.json');

            return this;
        }
    }

    global.MazeWorld = MazeWorld;

}(this));
