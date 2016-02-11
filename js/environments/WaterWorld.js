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
                    antialiasing: false,
                    autoResize: true,
                    resolution: window.devicePixelRatio,
                    resizable: false,
                    transparent: false,
                    width: 800,
                    height: 800
                },
                agentOpts = {
                    brainType: 'RLDQN',
                    env: {
                        getNumStates: function () {
                            return 30 * 5;
                        },
                        getMaxNumActions: function () {
                            return 4;
                        },
                        startState: function () {
                            return 0;
                        }
                    },
                    numActions: 4,
                    numStates: 30 * 5,
                    numEyes: 30,
                    numTypes: 5,
                    range: 120,
                    proximity: 120,
                    radius: 10,
                    collision: true,
                    interactive: false,
                    useSprite: false,
                    cheats: {
                        gridLocation: false,
                        position: false,
                        id: false,
                        name: false
                    },
                    worker: false
                },
                agents = [
                    new AgentRLDQN(new Vec(Utility.randi(3, renderOpts.width - 2), Utility.randi(3, renderOpts.height - 2)), agentOpts),
                    new AgentRLDQN(new Vec(Utility.randi(3, renderOpts.width - 2), Utility.randi(3, renderOpts.height - 2)), agentOpts)
                ],
                maze = new Maze({
                    xCount: 4,
                    yCount: 3,
                    width: renderOpts.width,
                    height: renderOpts.height,
                    closed: true
                }),
                grid = maze.grid,
                worldOpts = {
                    grid: grid,
                    simSpeed: 1,
                    cheats: {
                        quad: false,
                        grid: false,
                        walls: false
                    },
                    numEntities: 50,
                    entityOpts: {
                        radius: 10,
                        collision: true,
                        interactive: false,
                        useSprite: false,
                        movingEntities: true,
                        cheats: {
                            gridLocation: false,
                            position: false,
                            id: false,
                            name: false
                        }
                    }
                };

            super(agents, maze.walls, worldOpts, renderOpts);

            return this;
        }
    }

    global.WaterWorld = WaterWorld;

}(this));
