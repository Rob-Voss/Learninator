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
        this.rewardGraph = new Graph({canvas:document.getElementById("rewardGraph")});
        this.xCount = 4;
        this.yCount = 4;
        this.numItems = 40;
        this.closed = false;
        this.cheats = false;
        this.maze = new Maze(this);
        this.Rarr = null;
        this.Aarr = null;

        this.agentTDOpts = {
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

        this.agentRLTDOpts = {
            brainType: 'RLTD',
            numEyes: 0,
            numTypes: 0,
            width: 20,
            height: 20,
            radius: 10,
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
            //new AgentRLTD(new Vec(1, 1), this, this.agentRLTDOpts),
            //new AgentTD(new Vec(1, 1), this.grid, this.agentTDOpts),
            new AgentTDWorker(new Vec(1, 1), this.grid, this.agentTDOpts)
        ];

        World.call(this, this, this.entityOpts);

        return this;
    };

    MazeWorld.prototype = Object.create(World.prototype);
    MazeWorld.prototype.constructor = World;

    global.MazeWorld = MazeWorld;

}(this));
