var HexWorld = HexWorld || {},
    AgentRLDQN = AgentRLDQN || {},
    Hex = Hex || {},
    HexGrid = HexGrid || {},
    Utility = Utility || {},
    Vec = Vec || {},
    World = World || {};

(function (global) {
    "use strict";

    /**
     * A Hexagonal world
     * @name HexWorld
     * @extends World
     * @constructor
     *
     * @returns {HexWorld}
     */
    function HexWorld() {
        this.width = 600;
        this.height = 600;
        this.walls = [];
        this.collision = {
            type: 'grid'
        };

        this.numEntities = 10;//350;
        this.entityOpts = {
            radius: 5,
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

        let gridOptions = {
            width: this.width,
            height: this.height,
            size: 2,
            tileSize: 60,
            tileSpacing: 0,
            fill: false
        };
        this.grid = new HexGrid(gridOptions);
        this.walls = this.grid.walls;

        World.call(this);

        this.stage.addChild(this.grid.cellsContainer);

        //this.agents[0].load('zoo/wateragent.json');

        return this;
    }

    HexWorld.prototype = Object.create(World.prototype);
    HexWorld.prototype.constructor = World;

    global.HexWorld = HexWorld;

}(this));
