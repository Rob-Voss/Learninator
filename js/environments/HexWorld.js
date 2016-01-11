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

        this.cheats = {
            quad: false,
            grid: false,
            walls: false
        };

        this.numEntities = 0;
        this.entityOpts = {
            radius: 5,
            collision: true,
            interactive: true,
            useSprite: false,
            movingEntities: true,
            cheats: {
                gridLocation: true,
                position: false,
                id: false,
                name: false
            }
        };

        this.walls.push(new Wall(new Vec(0, 0), new Vec(this.width, 0), this.cheats.walls));
        this.walls.push(new Wall(new Vec(this.width, 0), new Vec(this.width, this.height), this.cheats.walls));
        this.walls.push(new Wall(new Vec(this.width, this.height), new Vec(0, this.height), this.cheats.walls));
        this.walls.push(new Wall(new Vec(0, this.height), new Vec(0, 0), this.cheats.walls));

        this.gridOptions = {
            width: this.width,
            height: this.height,
            tileSize: 30,
            tileSpacing: 0,
            pointyTiles: false
        };
        this.grid = new HexGrid(this.gridOptions);
        //this.grid.shapeRectangle(10, 10, Hex);
        this.grid.shapeHexagon(0, 0, 5, true);
        this.cellsContainer = this.grid.getGrid();

        World.call(this);

        //this.agents[0].load('zoo/wateragent.json');

        return this;
    }

    HexWorld.prototype = Object.create(World.prototype);
    HexWorld.prototype.constructor = World;

    global.HexWorld = HexWorld;

}(this));
