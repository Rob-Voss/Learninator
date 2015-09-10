(function (global) {
    "use strict";

    /**
     * Maze contains many agents and walls and food and stuff
     *
     * @param {Object} worldOpts
     * @param {Object} entityOpts
     * @param {Object} agentOpts
     * @returns {MazeWorld}
     * @constructor
     */
    var MazeWorld = function (worldOpts, entityOpts, agentOpts) {
        this.maze = new Maze(worldOpts);

        worldOpts.grid = this.maze.grid;

        worldOpts.agents = [
            new AgentTD(new Vec(50, 50), worldOpts.grid, agentOpts)
        ];

        worldOpts.walls = this.maze.walls;

        World.call(this, worldOpts, entityOpts);

        return this;
    };

    MazeWorld.prototype = Object.create(World.prototype);
    MazeWorld.prototype.constructor = World;

    global.MazeWorld = MazeWorld;

}(this));
