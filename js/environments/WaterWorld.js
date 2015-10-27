(function (global) {
    "use strict";

    /**
     * World object contains many agents and walls and food and stuff
     * @returns {WaterWorld}
     * @name WaterWorld
     * @extends World
     * @constructor
     */
    function WaterWorld() {
        this.canvas = document.getElementById("world");
        this.mazeOptions = {
            xCount: 4,
            yCount: 4,
            width: this.canvas.width,
            height: this.canvas.height,
            closed: true
        };
        this.maze = new Maze(this.mazeOptions);
        this.grid = this.maze.grid;
        this.walls = this.maze.walls;

        this.cheats = {
            quad: true,
            grid: false,
            population: false,
            walls: false
        };

        this.numEntities = 50;
        this.entityOpts = {
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
        };

        this.agents = [
            new AgentRLDQN(new Vec(Utility.randi(3, this.width - 2), Utility.randi(3, this.height - 2)), {
                brainType: 'RLDQN',
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
                    name: true
                },
                worker: true
            }),
            new AgentRLDQN(new Vec(Utility.randi(3, this.width - 2), Utility.randi(3, this.height - 2)), {
                brainType: 'RLDQN',
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
                    name: true
                },
                worker: true
            })
        ];
        this.numAgents = this.agents.length;

        this.agents[0].load('zoo/wateragent.json');
        this.agents[1].load('zoo/wateragent.json');

        World.call(this);
        world.stage.addChild(new Menu());

        return this;
    }

    WaterWorld.prototype = Object.create(World.prototype);
    WaterWorld.prototype.constructor = World;

    global.WaterWorld = WaterWorld;

}(this));
