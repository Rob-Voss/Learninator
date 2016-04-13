var WaterWorldEX = WaterWorldEX || {},
    Vec = Vec || {},
    World = World || {};

(function (global) {
    "use strict";

    class WaterWorldEX extends World {
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
                    autoResize: false,
                    resizable: false,
                    transparent: false,
                    resolution: window.devicePixelRatio,
                    width: 600,
                    height: 600
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
                        name: false,
                        id: true
                    },
                    worker: false
                },
                agents = [
                    new AgentRLDQN(new Vec(Utility.randi(3, renderOpts.width - 2), Utility.randi(3, renderOpts.height - 2)), agentOpts),
                    new AgentRLDQN(new Vec(Utility.randi(3, renderOpts.width - 2), Utility.randi(3, renderOpts.height - 2)), agentOpts)
                ],
                maze = new Maze({
                    xCount: 1,
                    yCount: 1,
                    width: renderOpts.width,
                    height: renderOpts.height,
                    closed: true
                }),
                grid = maze.grid,
                worldOpts = {
                    grid: grid,
                    simSpeed: 1,
                    collision: {
                        type: 'brute'
                    },
                    cheats: {
                        quad: false,
                        grid: false,
                        walls: false
                    },
                    numEntities: 10,
                    entityOpts: {
                        radius: 10,
                        collision: true,
                        interactive: false,
                        useSprite: false,
                        movingEntities: true,
                        cheats: {
                            gridLocation: false,
                            position: false,
                            name: false,
                            id: true
                        }
                    },
                    numEntityAgents: 2,
                    entityAgentOpts: {
                        brainType: 'RLDQN',
                        env: Utility.stringify({
                            getNumStates: function () {
                                return 8 * 5;
                            },
                            getMaxNumActions: function () {
                                return 4;
                            },
                            startState: function () {
                                return 0;
                            }
                        }),
                        numActions: 4,
                        numStates: 8 * 5,
                        numEyes: 8,
                        numTypes: 5,
                        range: 85,
                        proximity: 85,
                        radius: 20,
                        collision: true,
                        interactive: false,
                        useSprite: false,
                        movingEntities: true,
                        cheats: {
                            gridLocation: false,
                            position: false,
                            name: false,
                            id: true
                        }
                    }
                };

            super(agents, maze.walls, worldOpts, renderOpts);

            this.agents[0].load('zoo/wateragent.json');
            this.agents[1].load('zoo/wateragent.json');

            this.entityAgents[0].enemy = this.agents[0];
            this.entityAgents[0].target = this.agents[1];
            this.entityAgents[0].load('zoo/puckagent.json');

            this.entityAgents[1].enemy = this.agents[1];
            this.entityAgents[1].target = this.agents[0];
            this.entityAgents[1].load('zoo/puckagent.json');

            return this;
        }
    }

    global.WaterWorldEX = WaterWorldEX;

}(this));
