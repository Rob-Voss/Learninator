var WaterWorldEX = WaterWorldEX || {},
    Vec = Vec || {},
    World = World || {};

(function (global) {
    "use strict";

    class WaterWorldEX extends World {
        /**
         * World object contains many agents and walls and food and stuff
         * @name WaterWorldEX
         * @extends World
         * @constructor
         *
         * @returns {WaterWorldEX}
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
                    brainType: 'RL.DQNAgent',
                    numActions: 4,
                    numEyes: 30,
                    numTypes: 5,
                    numPriopreception: 2,
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
                    new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts),
                    new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts)
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
                        moving: true,
                        cheats: {
                            id: false,
                            direction: false,
                            name: false,
                            gridLocation: false,
                            position: false
                        }
                    },
                    numEntityAgents: 2,
                    entityAgentOpts: {
                        brainType: 'RL.DQNAgent',
                        worker: false,
                        range: 85,
                        proximity: 85,
                        radius: 10,
                        numEyes: 6,
                        numTypes: 5,
                        numActions: 5,
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
