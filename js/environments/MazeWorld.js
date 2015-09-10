(function (global) {
    "use strict";

    /**
     * Maze contains many agents and walls and food and stuff
     *
     * @returns {MazeWorld}
     * @constructor
     */
    var MazeWorld = function () {
        var agentOpts = {
                brainType: 'TD',
                numEyes: 9,
                numTypes: 3,
                range: 85,
                proximity: 85,
                width: 20,
                height: 20,
                radius: 10,
                canvas: document.getElementById("rewardGraph"),
                cheats: false,
                collision: true,
                interactive: false,
                useSprite: false,
                movingEntities: false
            },
            entityOpts = {
                width: 20,
                height: 20,
                radius: 10,
                cheats: false,
                collision: true,
                interactive: false,
                useSprite: false,
                movingEntities: false
            },
            worldOpts = {
                canvas: document.getElementById("world"),
                xCount: 4,
                yCount: 4,
                closed: false,
                numItems: 40,
                cheats: false
            };

        this.maze = new Maze(worldOpts);

        worldOpts.grid = this.maze.grid;

        worldOpts.agents = [
            new AgentTD(new Vec(1, 1), worldOpts.grid, agentOpts)
        ];

        worldOpts.walls = this.maze.walls;

        World.call(this, worldOpts, entityOpts);

        return this;
    };

    MazeWorld.prototype = Object.create(World.prototype);
    MazeWorld.prototype.constructor = World;

    global.MazeWorld = MazeWorld;

}(this));
