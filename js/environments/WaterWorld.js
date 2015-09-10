(function (global) {
    "use strict";

    /**
     * World object contains many agents and walls and food and stuff
     *
     * @param {Object} worldOpts
     * @param {Object} entityOpts
     * @param {Object} agentOpts
     * @returns {WaterWorld}
     * @constructor
     */
    var WaterWorld = function (worldOpts, entityOpts, agentOpts) {
        worldOpts.grid = new Grid(worldOpts);

        worldOpts.agents = [
            new AgentRLDQN(new Vec(300, 300), worldOpts.grid, agentOpts),
            new AgentRLDQN(new Vec(300, 300), worldOpts.grid, agentOpts)
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
