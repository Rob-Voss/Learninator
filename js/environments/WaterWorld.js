var WaterWorld = WaterWorld || {},
    Maze = Maze || {},
    Vec = Vec || {},
    World = World || {};

(function (global) {
    "use strict";

    /**
     * World object contains many agents and walls and food and stuff
     * @name WaterWorld
     * @extends World
     * @constructor
     *
     * @returns {WaterWorld}
     */
    function WaterWorld() {
        this.width = 800;
        this.height = 800;
        this.mazeOptions = {
            xCount: 2,
            yCount: 2,
            width: this.width,
            height: this.height,
            closed: true
        };
        this.maze = new Maze(this.mazeOptions);
        this.grid = this.maze.grid;
        this.walls = this.maze.walls;

        this.cheats = {
            quad: false,
            grid: false,
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
            new AgentRLDQN(new Vec(Utility.randi(3, this.width - 2), Utility.randi(3, this.height - 2)),
                {
                    brainType: 'RLDQN',
                    env: Utility.stringify({
                        getNumStates: function () {
                            return 30 * 5;
                        },
                        getMaxNumActions: function () {
                            return 4;
                        },
                        startState: function () {
                            return 0;
                        }
                    }),
                    numActions: 4,
                    numStates: 30 * 5,
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
            new AgentRLDQN(new Vec(Utility.randi(3, this.width - 2), Utility.randi(3, this.height - 2)),
                {
                    brainType: 'RLDQN',
                    env: Utility.stringify({
                        getNumStates: function () {
                            return 30 * 5;
                        },
                        getMaxNumActions: function () {
                            return 4;
                        },
                        startState: function () {
                            return 0;
                        }
                    }),
                    numActions: 4,
                    numStates: 30 * 5,
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

        this.simSpeed = 1;

        World.call(this);

        return this;
    }

    WaterWorld.prototype = Object.create(World.prototype);
    WaterWorld.prototype.constructor = World;

    global.WaterWorld = WaterWorld;

}(this));
