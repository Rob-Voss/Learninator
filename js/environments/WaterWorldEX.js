(function (global) {
    "use strict";

    /**
     * World object contains many agents and walls and food and stuff
     *
     * @returns {WaterWorldEX}
     * @constructor
     */
    var WaterWorldEX = function () {
        this.canvas = document.getElementById("world");
        this.rewardGraph = new RewardGraph({
            canvas: document.getElementById("rewardGraph"),
            stepHorizon: 1000
        });
        this.xCount = 1;
        this.yCount = 1;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.numItems = 60;
        this.numEntityAgents = 4;
        this.closed = true;

        // Collision type
        this.cdType = 'brute';
        this.maxChildren = 3;
        this.maxDepth = 20;

        this.cheats = {
            quad: false,
            grid: false,
            population: false,
            walls: false
        };

        this.useFlot = false;
        this.useGraph = true;

        this.entityAgentOpts = {
            brainType: 'RLDQN',
            numEyes: 6,
            numTypes: 5,
            radius: 20,
            collision: true,
            interactive: false,
            useSprite: false,
            movingEntities: true,
            cheats: {
                gridLocation: false,
                position: false,
                name: false,
                id: false
            }
        };

        this.entityOpts = {
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
            new AgentRLDQN(new Vec(Utility.randi(3, this.canvas.width - 2), Utility.randi(3, this.canvas.height - 2)),
                {
                    brainType: 'RLDQN',
                    numEyes: 30,
                    numTypes: 3,
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
            new AgentRLDQN(new Vec(Utility.randi(3, this.canvas.width - 2), Utility.randi(3, this.canvas.height - 2)),
                {
                    brainType: 'RLDQN',
                    numEyes: 30,
                    numTypes: 3,
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

        this.walls = [
            new Wall(new Vec(0, 0), new Vec(0 + this.canvas.width, 0)),
            new Wall(new Vec(0 + this.canvas.width, 0), new Vec(0 + this.canvas.width, 0 + this.canvas.height)),
            new Wall(new Vec(0 + this.canvas.width, 0 + this.canvas.height), new Vec(0, 0 + this.canvas.height)),
            new Wall(new Vec(0, 0 + this.canvas.height), new Vec(0, 0))
        ];

        World.call(this, this, this.entityOpts);

        this.addEntityAgents();

        return this;
    };

    WaterWorldEX.prototype = Object.create(World.prototype);
    WaterWorldEX.prototype.constructor = World;

    global.WaterWorldEX = WaterWorldEX;

}(this));
