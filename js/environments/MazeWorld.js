var MazeWorld = MazeWorld || {};

(function (global) {
    "use strict";

    /**
     * Maze contains many agents and walls and food and stuff
     * @name MazeWorld
     * @extends World
     * @constructor
     *
     * @returns {MazeWorld}
     */
    function MazeWorld() {
        this.canvas = document.getElementById('world');
        this.mazeOptions = {
            xCount: 6,
            yCount: 6,
            closed: true,
            width: this.canvas.width,
            height: this.canvas.height
        };
        this.maze = new Maze(this.mazeOptions);
        this.grid = this.maze.grid;
        this.walls = this.maze.walls;

        this.numEntities = 40;
        this.entityOpts = {
            radius: 10,
            collision: true,
            interactive: false,
            useSprite: false,
            movingEntities: false,
            cheats: {
                gridLocation: false,
                position: false,
                id: false,
                name: false
            }
        };

        this.Rarr = null;
        this.Aarr = null;

        this.agents = [
            new AgentTD(new Vec(1, 1), {
                brainType: 'TD',
                numEyes: 9,
                numTypes: 3,
                range: 85,
                proximity: 85,
                radius: 10,
                worker: true,
                collision: true,
                interactive: false,
                useSprite: false,
                cheats: {
                    gridLocation: false,
                    position: false,
                    name: false,
                    id: false
                }
            }),
            new AgentTD(new Vec(1, 1), {
                brainType: 'TD',
                numEyes: 9,
                numTypes: 3,
                range: 85,
                proximity: 85,
                radius: 10,
                worker: true,
                collision: true,
                interactive: false,
                useSprite: false,
                cheats: {
                    gridLocation: false,
                    position: false,
                    name: false,
                    id: false
                }
            })
        ];
        this.numAgents = this.agents.length;

        World.call(this);

        return this;
    }

    MazeWorld.prototype = Object.create(World.prototype);
    MazeWorld.prototype.constructor = World;

    global.MazeWorld = MazeWorld;

}(this));
