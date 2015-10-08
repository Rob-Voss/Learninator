(function (global) {
    "use strict";

    /**
     * World object contains many agents and walls and food and stuff
     * @returns {WaterWorld}
     * @constructor
     */
    var WaterWorld = function () {
        this.canvas = document.getElementById("world");
        this.rewardGraph = new RewardGraph({
            canvas: document.getElementById("rewardGraph"),
            stepHorizon: 1000
        });
        this.xCount = 2;
        this.yCount = 2;
        this.numItems = 20;
        this.closed = true;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.maze = new Maze(this);
        this.grid = this.maze.grid;
        this.walls = this.maze.walls;

        // Reward graphing type
        this.useFlot = false;
        this.useGraph = true;

        // Collision type
        this.cdType = 'quad';
        this.maxChildren = 2;
        this.maxDepth = 10;

        this.cheats = {
            quad: true,
            grid: false,
            population: false,
            walls: false
        };

        var agentOpts = {
            brainType: 'RLDQN',
            numEyes: 30,
            numTypes: 5,
            radius: 10,
            collision: true,
            interactive: false,
            useSprite: false,
            cheats: {
                gridLocation: false,
                position: false,
                id: false,
                name: true
            }
        };

        var agentWOpts = {
            brainType: 'RLDQN',
            numEyes: 30,
            numTypes: 5,
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
        };

        var entityOpts = {
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

        var vec1 = new Vec(Utility.randi(3, this.canvas.width - 2), Utility.randi(3, this.canvas.height - 2)),
            vec2 = new Vec(Utility.randi(3, this.canvas.width - 2), Utility.randi(3, this.canvas.height - 2));

        this.agents = [
            //new AgentRLDQN(vec1, agentWOpts),
            new AgentRLDQN(vec2, agentOpts)
        ];

        this.agents[0].load('zoo/wateragent.json');
        //this.agents[1].load('zoo/wateragent.json');

        World.call(this, this, entityOpts);

        return this;
    };

    WaterWorld.prototype = Object.create(World.prototype);
    WaterWorld.prototype.constructor = World;

    global.WaterWorld = WaterWorld;

}(this));
