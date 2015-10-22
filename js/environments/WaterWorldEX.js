(function (global) {
    "use strict";

    /**
     * World object contains many agents and walls and food and stuff
     * @returns {WaterWorldEX}
     * @name WaterWorldEX
     * @extends World
     * @constructor
     */
    function WaterWorldEX() {
        this.canvas = document.getElementById("world");
        this.rewardGraph = new RewardGraph({
            canvas: document.getElementById("rewardGraph"),
            stepHorizon: 1000
        });
        this.xCount = 1;
        this.yCount = 1;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.numItems = 40;
        this.numEntityAgents = 2;
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

        this.useFlot = true;
        this.useGraph = false;

        this.entityAgentOpts = {
            brainType: 'RLDQN',
            numEyes: 6,
            numTypes: 5,
            range: 85,
            proximity: 85,
            radius: 20,
            collision: true,
            interactive: false,
            useSprite: false,
            movingEntities: true,
            cheats: {
                gridLocation: false,
                position: false,
                name: false,
                id: true
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
            new AgentRLDQN(new Vec(Utility.randi(3, this.width - 2), Utility.randi(3, this.height - 2)),
                {
                    brainType: 'RLDQN',
                    numEyes: 30,
                    numTypes: 5,
                    range: 120,
                    proximity: 120,
                    radius: 10,
                    worker: false,
                    collision: true,
                    interactive: false,
                    useSprite: false,
                    cheats: {
                        gridLocation: false,
                        position: false,
                        name: false,
                        id: true
                    }
                }),
            new AgentRLDQN(new Vec(Utility.randi(3, this.width - 2), Utility.randi(3, this.height - 2)),
                {
                    brainType: 'RLDQN',
                    numEyes: 30,
                    numTypes: 5,
                    range: 120,
                    proximity: 120,
                    radius: 10,
                    worker: false,
                    collision: true,
                    interactive: false,
                    useSprite: false,
                    cheats: {
                        gridLocation: false,
                        position: false,
                        name: false,
                        id: true
                    }
                })
        ];

        this.walls = [
            new Wall(new Vec(0, 0), new Vec(0 + this.width, 0)),
            new Wall(new Vec(0 + this.width, 0), new Vec(0 + this.width, 0 + this.height)),
            new Wall(new Vec(0 + this.width, 0 + this.height), new Vec(0, 0 + this.height)),
            new Wall(new Vec(0, 0 + this.height), new Vec(0, 0))
        ];

        World.call(this, this, this.entityOpts);
        this.addEntityAgents();

        //this.agents[0].load('zoo/wateragent.json');
        //this.agents[1].load('zoo/wateragent.json');
        //this.entityAgents[0].load('zoo/puckagent.json');
        //this.entityAgents[1].load('zoo/puckagent.json');

        return this;
    }

    WaterWorldEX.prototype = Object.create(World.prototype);
    WaterWorldEX.prototype.constructor = World;

    global.WaterWorldEX = WaterWorldEX;

}(this));
