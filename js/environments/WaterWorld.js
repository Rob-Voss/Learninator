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
            let opts = {
                    antialiasing: true,
                    autoResize: false,
                    resizable: false,
                    transparent: false,
                    resolution: 1,///window.devicePixelRatio,
                    noWebGL: false,
                    width: 800,
                    height: 800
                },
                agentOpts = {
                    brainType: 'RLDQN',
                    worker: false,
                    numEyes: 30,
                    numTypes: 5,
                    numActions: 4,
                    numStates: 30 * 5,
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
                    range: 120,
                    proximity: 120,
                    radius: 10,
                    collision: true,
                    interactive: false,
                    useSprite: false,
                    cheats: {
                        id: true,
                        name: false,
                        gridLocation: false,
                        position: false
                    }
                },
                agents = [
                    new AgentRLDQN(new Vec(Utility.randi(3, opts.width - 2), Utility.randi(3, opts.height - 2)), agentOpts),
                    new AgentRLDQN(new Vec(Utility.randi(3, opts.width - 2), Utility.randi(3, opts.height - 2)), agentOpts)
                ],
                maze = new Maze({
                    xCount: 5,
                    yCount: 2,
                    width: opts.width,
                    height: opts.height,
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
                        brute: false,
                        quad: false,
                        grid: true,
                        walls: false
                    },
                    numEntities: 20,
                    entityOpts: {
                        radius: 10,
                        collision: true,
                        interactive: true,
                        useSprite: false,
                        movingEntities: true,
                        cheats: {
                            id: false,
                            name: false,
                            gridLocation: false,
                            position: false
                        }
                    }
                };

            super(agents, maze.walls, worldOpts, opts);
            // this.agents[0].load('zoo/wateragent.json');
            // this.agents[1].load('zoo/wateragent.json');

            // super([], maze.walls, worldOpts, renderOpts);

            return this;
        }
    }

    global.WaterWorld = WaterWorld;

}(this));
