(function (global) {
    "use strict";

    /**
     * Maze contains many agents and walls and food and stuff
     *
     * @returns {MazeWorld}
     * @constructor
     */
    var MazeWorld = function () {
        this.canvas = document.getElementById("world");
        this.rewardGraph = new RewardGraph({canvas:document.getElementById("rewardGraph")});
        this.xCount = 4;
        this.yCount = 4;
        this.numItems = 40;
        this.closed = false;
        this.cheats = false;
        this.maze = new Maze(this);
        this.Rarr = null;
        this.Aarr = null;

        this.TDOpts = {
            brainType: 'TD',
            numEyes: 9,
            numTypes: 3,
            width: 20,
            height: 20,
            radius: 10,
            collision: false,
            interactive: false,
            useSprite: false,
            movingEntities: false
        };

        this.TDOptsWorker = {
            brainType: 'TD',
            numEyes: 9,
            numTypes: 3,
            width: 20,
            height: 20,
            radius: 10,
            worker: true,
            collision: false,
            interactive: false,
            useSprite: false,
            movingEntities: false
        };

        this.entityOpts = {
            width: 20,
            height: 20,
            radius: 10,
            collision: false,
            interactive: false,
            useSprite: false,
            movingEntities: false
        };

        this.grid = this.maze.grid;
        this.walls = this.maze.walls;

        this.agents = [
            new AgentTD(new Vec(1, 1), this.grid, this.TDOptsWorker),
            new AgentTD(new Vec(1, 1), this.grid, this.TDOpts)
        ];

        World.call(this, this, this.entityOpts);

        return this;
    };

    MazeWorld.prototype = Object.create(World.prototype);
    MazeWorld.prototype.constructor = World;

    global.MazeWorld = MazeWorld;

}(this));
