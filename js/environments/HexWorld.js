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

        this.cheats = {
            quad: false,
            grid: false,
            walls: false
        };

        this.numEntities = 10;
        this.entityOpts = {
            radius: 10,
            collision: true,
            interactive: true,
            useSprite: false,
            movingEntities: true,
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
            tileSize: 40,
            tileSpacing: 55,
            pointyTiles: true
        };

        this.walls.push(new Wall(new Vec(0, 0), new Vec(0 + this.width, 0), this.cheats.walls));
        this.walls.push(new Wall(new Vec(0 + this.width, 0), new Vec(0 + this.width, 0 + this.height), this.cheats.walls));
        this.walls.push(new Wall(new Vec(0 + this.width, 0 + this.height), new Vec(0, 0 + this.height), this.cheats.walls));
        this.walls.push(new Wall(new Vec(0, 0 + this.height), new Vec(0, 0), this.cheats.walls));

        this.grid = new HexGrid(this.gridOptions);
        this.grid.shapeRectangle(2, 2, Hex);

        for (let i = 0; i < this.grid.cells.length; i++) {
            let cell = this.grid.cells[i];
            for (let c = 0; c < cell.corners.length; c++) {
                let x1 = cell.corners[c].x,
                    y1 = cell.corners[c].y,
                    x2, y2;
                if (c !== cell.corners.length - 1) {
                    x2 = cell.corners[c + 1].x;
                    y2 = cell.corners[c + 1].y;
                } else {
                    x2 = cell.corners[0].x;
                    y2 = cell.corners[0].y;
                }
                let v1 = new Vec(x1, y1),
                    v2 = new Vec(x2, y2);
                this.walls.push(new Wall(v1, v2));
            }
        }

        World.call(this);
        this.stage.addChild(this.grid.getGrid(false));
        this.agents[0].load('zoo/wateragent.json');

        return this;
    }

    HexWorld.prototype = Object.create(World.prototype);
    HexWorld.prototype.constructor = World;

    /**
     * Tick the environment
     * @returns {World}
     */
    HexWorld.prototype.tick = function () {
        this.updatePopulation();

        // Loop through the entities of the world and make them do work son!
        for (let e = 0; e < this.entities.length; e++) {
            this.entities[e].tick(this);
        }

        this.updatePopulation();
        Phys.updateCircles(this);
        this.draw();

        return this;
    };

    global.HexWorld = HexWorld;

}(this));
