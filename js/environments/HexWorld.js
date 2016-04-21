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
            let opts = {
                    antialiasing: true,
                    autoResize: false,
                    resizable: false,
                    transparent: false,
                    resolution: 1,///window.devicePixelRatio,
                    noWebGL: false,
                    width: 600,
                    height: 600
                },
                agentOpts = {
                    brainType: 'RL.DQNAgent',
                    worker: false,
                    numEyes: 30,
                    numTypes: 5,
                    numActions: 4,
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
                    new Agent(new Vec(Utility.randi(3, opts.width - 2), Utility.randi(3, opts.height - 2)), agentOpts),
                    new Agent(new Vec(Utility.randi(3, opts.width - 2), Utility.randi(3, opts.height - 2)), agentOpts)
                ],
                gridOptions = {
                    width: opts.width,
                    height: opts.height,
                    size: 2,
                    tileSize: 60,
                    tileSpacing: 0,
                    fill: false
                },
                grid = new HexGrid(gridOptions),
                worldOpts = {
                    grid: grid,
                    simSpeed: 1,
                    collision: {
                       type: 'brute'
                    },
                    cheats: {
                        brute: true,
                        quad: false,
                        grid: false,
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
                            id: true,
                            name: false,
                            gridLocation: false,
                            position: false
                        }
                    }
                };

            super(agents, grid.walls, worldOpts, opts);
            // this.agents[0].load('zoo/wateragent.json');
            // this.agents[1].load('zoo/wateragent.json');

            return this;
        }
    }

    global.HexWorld = HexWorld;

}(this));
