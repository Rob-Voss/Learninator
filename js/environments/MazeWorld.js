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
                    resolution: window.devicePixelRatio,
                    noWebGL: false,
                    width: 600,
                    height: 600
                },
                agents = [
                    new AgentTD(new Vec(1, 1), {
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
                            id: false,
                            name: false,
                            direction: false,
                            gridLocation: false,
                            position: false,
                            bounds: false
                        }
                    }),
                    new AgentTD(new Vec(1, 1), {
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
                            id: false,
                            name: false,
                            direction: false,
                            gridLocation: false,
                            position: false,
                            bounds: false
                        }
                    })
                ],
                maze = new Maze({
                    xCount: 4,
                    yCount: 3,
                    width: renderOpts.width,
                    height: renderOpts.height,
                    closed: false,
                    cheats: false
                }),
                worldOpts = {
                    grid: maze.grid,
                    simSpeed: 1,
                    collision: {
                        type: 'brute'
                    },
                    cheats: {
                        brute: false,
                        quad: false,
                        grid: false,
                        walls: false
                    },
                    numEntities: 30,
                    entityOpts: {
                        radius: 10,
                        collision: true,
                        interactive: true,
                        useSprite: false,
                        moving: false,
                        cheats: {
                            id: false,
                            name: false,
                            direction: false,
                            gridLocation: false,
                            position: false,
                            bounds: false
                        }
                    }
                };

            super(agents, maze.walls, worldOpts, renderOpts);
            // this.agents[0].load('zoo/mazeagent.json');

            return this;
        }
    }

    global.MazeWorld = MazeWorld;

}(this));
