(function (global) {
    "use strict";

    /**
     * World object contains many agents and walls and food and stuff
     *
     * @returns {WaterWorld}
     * @constructor
     */
    var WaterWorld = function () {
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
                cheats: false
            },
            entityOpts = {
                width: 20,
                height: 20,
                radius: 10,
                collision: true,
                interactive: false,
                useSprite: false,
                movingEntities: true,
                cheats: false
            };

        this.canvas = document.getElementById("world");
        this.rewardGraph = false;
        this.xCount = 1;
        this.yCount = 1;
        this.closed = true;
        this.numItems = 40;
        this.cheats = false;

        this.agents = [
            new AgentRLDQN(new Vec(300, 300), this, agentOpts)
        ];

        this.agents[0].load('zoo/wateragent.json');

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
