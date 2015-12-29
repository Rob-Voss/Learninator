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
            quad: true,
            grid: true,
            walls: false
        };

        this.numEntities = 100;
        this.entityOpts = {
            radius: 10,
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

        this.gridOptions = {
            width: this.width,
            height: this.height,
            tileSize: 40,
            tileSpacing: 0,
            pointyTiles: false
        };
        this.grid = new HexGrid(this.gridOptions);
        this.grid.shapeRectangle(5, 5, Hex);
        let gridContainer = this.grid.getGrid(false, true);
        this.walls = this.grid.walls;

        this.walls.push(new Wall(new Vec(0, 0), new Vec(this.width, 0), this.cheats.walls));
        this.walls.push(new Wall(new Vec(this.width, 0), new Vec(this.width, this.height), this.cheats.walls));
        this.walls.push(new Wall(new Vec(this.width, this.height), new Vec(0, this.height), this.cheats.walls));
        this.walls.push(new Wall(new Vec(0, this.height), new Vec(0, 0), this.cheats.walls));

        World.call(this);
        this.stage.addChild(gridContainer);
        //this.agents[0].load('zoo/wateragent.json');

        return this;
    }

    HexWorld.prototype = Object.create(World.prototype);
    HexWorld.prototype.constructor = World;

    global.HexWorld = HexWorld;

}(this));
