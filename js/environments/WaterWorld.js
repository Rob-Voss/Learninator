(function (global) {
    "use strict";

    /**
     * World object contains many agents and walls and food and stuff
     *
     * @returns {WaterWorld}
     * @constructor
     */
    var WaterWorld = function () {
        this.canvas = document.getElementById("world");
        this.xCount = 10;
        this.yCount = 10;
        this.numItems = 40;
        this.useFlot = true;
        this.useGraph = false;
        this.useGrid = true;
        this.useQuad = false;
        this.cheats = {
            population: true,
            walls: false
        };
        this.closed = true;

        var agentOpts = {
            brainType: 'RLDQN',
            numEyes: 30,
            numTypes: 5,
            width: 20,
            height: 20,
            radius: 10,
            collision: true,
            interactive: false,
            useSprite: false,
            cheats: {
                gridLocation: false,
                position: false,
                name: true
            }
        };

        var agentWOpts = {
            brainType: 'RLDQN',
            numEyes: 30,
            numTypes: 5,
            width: 20,
            height: 20,
            radius: 10,
            collision: true,
            interactive: false,
            useSprite: false,
            cheats: {
                gridLocation: false,
                position: false,
                name: true
            },
            worker: true
        };

        var entityOpts = {
            width: 20,
            height: 20,
            radius: 10,
            collision: true,
            interactive: false,
            useSprite: false,
            movingEntities: true,
            cheats: {
                gridLocation: false,
                position: false,
                name: false
            }
        };

        var vec1 = new Vec(Utility.randi(2, this.canvas.width - 2), Utility.randi(2, this.canvas.height - 2)),
            vec2 = new Vec(Utility.randi(2, this.canvas.width - 2), Utility.randi(2, this.canvas.height - 2));

        this.agents = [
            new AgentRLDQN(vec1, this, agentOpts),
            new AgentRLDQN(vec2, this, agentWOpts)
        ];

        this.agents[0].load('zoo/wateragent.json');
        //this.agents[1].load('zoo/wateragent.json');

        this.walls = [
            new Wall(new Vec(0, 0), new Vec(0 + this.canvas.width, 0)),
            new Wall(new Vec(0 + this.canvas.width, 0), new Vec(0 + this.canvas.width, 0 + this.canvas.height)),
            new Wall(new Vec(0 + this.canvas.width, 0 + this.canvas.height), new Vec(0, 0 + this.canvas.height)),
            new Wall(new Vec(0, 0 + this.canvas.height), new Vec(0, 0))
        ];

        World.call(this, this, entityOpts);

        return this;
    };

    WaterWorld.prototype = Object.create(World.prototype);
    WaterWorld.prototype.constructor = World;

    global.WaterWorld = WaterWorld;

}(this));
