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
            quad: true,
            grid: false,
            walls: false
        };

        this.agents = [
            new AgentRLDQN(new Vec(Utility.randi(3, this.width - 2), Utility.randi(3, this.height - 2)), {
                brainType: 'RLDQN',
                env: {
                    numActions: 4,
                    numStates: 30 * 5,
                    numEyes: 30,
                    numTypes: 5,
                    range: 120,
                    proximity: 120,
                    getMaxNumActions: function () {
                        return this.numActions;
                    },
                    getNumStates: function () {
                        return this.numStates;
                    }
                },
                radius: 10,
                collision: true,
                interactive: true,
                useSprite: false,
                cheats: {
                    gridLocation: false,
                    position: false,
                    id: false,
                    name: true
                },
                worker: true
            })
        ];
        this.numAgents = this.agents.length;

        this.numEntities = 3;
        this.entityOpts = {
            radius: 10,
            collision: true,
            interactive: true,
            useSprite: false,
            movingEntities: true,
            cheats: {
                gridLocation: false,
                position: false,
                id: true,
                name: false
            }
        };

        this.gridOptions = {
            width: this.width,
            height: this.height,
            tileSize: 20,
            tileSpacing: 50,
            pointyTiles: true
        };
        this.grid = new HexGrid(this.gridOptions);
        this.grid.shapeRectangle(3, 3, Hex);
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

        this.walls.push(new Wall(new Vec(0, 0), new Vec(0 + this.width, 0), this.cheats.walls));
        this.walls.push(new Wall(new Vec(0 + this.width, 0), new Vec(0 + this.width, 0 + this.height), this.cheats.walls));
        this.walls.push(new Wall(new Vec(0 + this.width, 0 + this.height), new Vec(0, 0 + this.height), this.cheats.walls));
        this.walls.push(new Wall(new Vec(0, 0 + this.height), new Vec(0, 0), this.cheats.walls));

        World.call(this);

        this.stage.addChild(this.grid.getGrid(false));

        return this;
    }

    HexWorld.prototype = Object.create(World.prototype);
    HexWorld.prototype.constructor = World;

    global.HexWorld = HexWorld;

}(this));
