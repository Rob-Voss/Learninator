(function (global) {
    "use strict";

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
                    range: 120,
                    proximity: 120,
                    radius: 10,
                    numEyes: 30,
                    numTypes: 5,
                    numActions: 4,
                    numProprioception: 2,
                    collision: true,
                    interactive: false,
                    useSprite: false,
                    cheats: {
                        id: false,
                        direction: false,
                        name: false,
                        gridLocation: false,
                        position: false
                    }
                },
                agents = [
                    new Agent(new Vec(Utility.randi(3, renderOpts.width - 1), Utility.randi(3, renderOpts.height - 1)), agentOpts),
                    new Agent(new Vec(Utility.randi(3, renderOpts.width - 1), Utility.randi(3, renderOpts.height - 1)), agentOpts)
                ],
                maze = new Maze({
                    xCount: 2,
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
                    numEntities: 10,
                    entityOpts: {
                        radius: 10,
                        collision: true,
                        interactive: true,
                        useSprite: false,
                        moving: true,
                        cheats: {
                            id: false,
                            direction: false,
                            name: false,
                            gridLocation: false,
                            position: false
                        }
                    }
                };

            super(agents, maze.walls, worldOpts, renderOpts);
            // this.agents[0].load('zoo/wateragent.json');
            return this;
        }
    }

    global.WaterWorld = WaterWorld;

}(this));
