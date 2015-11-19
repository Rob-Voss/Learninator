var HexWorld = HexWorld || {};

(function (global) {
    "use strict";

    /**
     *
     * @name HexWorld
     * @extends World
     * @constructor
     *
     * @returns {HexWorld}
     */
    function HexWorld() {
        this.width = 600;
        this.height = 600;

        this.numEntities = 2;
        this.entityOpts = {
            radius: 10,
            collision: true,
            interactive: true,
            useSprite: false,
            movingEntities: false,
            cheats: {
                gridLocation: false,
                position: false,
                id: false,
                name: false
            }
        };

        this.gridOptions = {
            width: this.width,
            height: this.height,
            tileSize: 20,
            tileSpacing: 2,
            pointyTiles: true
        };
        this.grid = new HexGrid(this.gridOptions);
        this.cells = this.grid.shapeRectangle(10, 10, Hex);

        this.Rarr = null;
        this.Aarr = null;

        this.agents = [
            new AgentTD(new Vec(1, 1), {
                brainType: 'TD',
                numEyes: 9,
                numTypes: 3,
                range: 85,
                proximity: 85,
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
        this.numAgents = this.agents.length;

        World.call(this);
        this.cellsContainer = new PIXI.Container();
        for (var ci = 0; ci < this.cells.length; ci++) {
            var q = this.cells[ci].q,
                r = this.cells[ci].r,
                hex = new Hex(q, r, -q - r, this.grid.getCenterXY(q, r), this.grid.tileSize, this.grid.pointyTiles);
            this.cellsContainer.addChild(hex.shape);
        }
        this.stage.addChild(this.cellsContainer);

        return this;
    }

    HexWorld.prototype = Object.create(World.prototype);
    HexWorld.prototype.constructor = World;

    global.HexWorld = HexWorld;

}(this));
