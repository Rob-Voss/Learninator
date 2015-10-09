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
        this.rewardGraph = new RewardGraph({
            canvas: document.getElementById("rewardGraph"),
            stepHorizon: 1000
        });
        this.xCount = 6;
        this.yCount = 6;
        this.closed = true;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.numItems = 20;
        this.maze = new Maze(this);
        this.useFlot = false;
        this.useGraph = true;

        // Collision type
        this.cdType = 'quad';
        this.maxChildren = 2;
        this.maxDepth = 10;

        this.closed = true;

        this.cheats = {
            quad: true,
            grid: false,
            population: true,
            walls: false
        };

        this.Rarr = null;
        this.Aarr = null;

        this.entityOpts = {
            width: 20,
            height: 20,
            radius: 10,
            collision: false,
            interactive: true,
            useSprite: false,
            movingEntities: false,
            cheats: {
                gridLocation: false,
                position: false,
                name: true,
                id: false
            }
        };

        this.grid = this.maze.grid;
        this.walls = this.maze.walls;

        this.agents = [
            new AgentTD(new Vec(1, 1), {
                brainType: 'TD',
                numEyes: 9,
                numTypes: 3,
                width: 20,
                height: 20,
                radius: 10,
                worker: true,
                collision: true,
                interactive: false,
                useSprite: false,
                cheats: {
                    gridLocation: false,
                    position: false,
                    name: true,
                    id: false
                }
            }),
            new AgentTD(new Vec(1, 1), {
                brainType: 'TD',
                numEyes: 9,
                numTypes: 3,
                width: 20,
                height: 20,
                radius: 10,
                worker: true,
                collision: true,
                interactive: false,
                useSprite: false,
                cheats: {
                    gridLocation: false,
                    position: false,
                    name: true,
                    id: false
                }
            })
        ];

        World.call(this, this, this.entityOpts);

        return this;
    };

    MazeWorld.prototype = Object.create(World.prototype);
    MazeWorld.prototype.constructor = World;

    global.MazeWorld = MazeWorld;

}(this));
