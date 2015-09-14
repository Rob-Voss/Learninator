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
            },
            worldOpts = {
                canvas: document.getElementById("world"),
                rewardGraph: false,
                xCount: 1,
                yCount: 1,
                closed: true,
                numItems: 40,
                cheats: false
            };

        worldOpts.agents = this.agents = [
            new AgentRLDQN(new Vec(300, 300), this, agentOpts)
        ];

        worldOpts.agents[0].load('zoo/wateragent.json');

        worldOpts.walls = [
            new Wall(new Vec(0, 0), new Vec(0 + worldOpts.canvas.width, 0)),
            new Wall(new Vec(0 + worldOpts.canvas.width, 0), new Vec(0 + worldOpts.canvas.width, 0 + worldOpts.canvas.height)),
            new Wall(new Vec(0 + worldOpts.canvas.width, 0 + worldOpts.canvas.height), new Vec(0, 0 + worldOpts.canvas.height)),
            new Wall(new Vec(0, 0 + worldOpts.canvas.height), new Vec(0, 0))
        ];

        World.call(this, worldOpts, entityOpts);

        return this;
    };

    WaterWorld.prototype = Object.create(World.prototype);
    WaterWorld.prototype.constructor = World;

    global.WaterWorld = WaterWorld;

}(this));
