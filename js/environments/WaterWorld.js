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
                new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts)],
                maze = new Maze({
                    xCount: 3,
                    yCount: 3,
                    width: renderOpts.width,
                    height: renderOpts.height,
                    closed: false,
                    cheats: false
                });

            worldOpts.grid = maze.grid;
            super(agents, maze.walls, worldOpts, renderOpts);
            this.agents[0].load('zoo/wateragent.json');
            // this.agents[1].load('zoo/wateragent.json');

            return this;
        }
    }
    global.WaterWorld = WaterWorld;

}(this));
