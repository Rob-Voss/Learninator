(function (global) {
    "use strict";

    class HexWorld extends World {
        /**
         * A Hexagonal world
         * @name HexWorld
         * @extends World
         * @constructor
         *
         * @returns {HexWorld}
         */
        constructor() {
            let renderOpts = {
                antialiasing: false,
                autoResize: false,
                resizable: false,
                transparent: false,
                resolution: 1,//window.devicePixelRatio,
                width: 800,
                height: 800
            };

            let agentOpts   = {
                    brainType: 'RL.DQNAgent',
                    worker: false,
                    range: 90,
                    proximity: 90,
                    radius: 10,
                    numEyes: 30,
                    numTypes: 5,
                    numActions: 4,
                    numProprioception: 2,
                    collision: true,
                    interactive: false,
                    useSprite: false
                },
                agents      = [
                    new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts),
                    new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts)
                ],
                cheats = {
                    id: false,
                    name: false,
                    angle: false,
                    brute: false,
                    bounds: false,
                    direction: false,
                    grid: false,
                    gridLocation: false,
                    position: false,
                    quad: false,
                    walls: false
                },
                gridOpts = {
                    width: renderOpts.width,
                    height: renderOpts.height,
                    buffer: 0,
                    cellSize: 10,
                    cellSpacing: 0,
                    size: 2,
                    pointy: true,
                    fill: false,
                    cheats: {
                        id: true,
                        name: false,
                        angle: false,
                        brute: false,
                        bounds: false,
                        direction: true,
                        grid: false,
                        gridLocation: false,
                        position: false,
                        quad: false,
                        walls: false
                    }
                },
                orientation = (gridOpts.pointy ? Layout.layoutPointy : Layout.layoutFlat),
                size = new Point(gridOpts.width / gridOpts.cellSize, gridOpts.height / gridOpts.cellSize),
                origin = new Point(gridOpts.width / 2, gridOpts.height / 2),
                layout = new Layout(orientation, size, origin),
                shape = HexGrid.shapeHexagon(gridOpts.size, gridOpts.cellSize, layout, gridOpts.fill, gridOpts.cheats),
                // shape = HexGrid.shapeRectangle(gridOpts.size, gridOpts.size, gridOpts.cellSize, layout, gridOpts.fill, gridOpts.cheats, gridOpts.pointy),
                // shape = HexGrid.shapeRing(0, 0, gridOpts.size, gridOpts.cellSize, layout, gridOpts.fill, gridOpts.cheats),
                // shape = HexGrid.shapeParallelogram(0, 0, gridOpts.size, gridOpts.size, gridOpts.cellSize, layout, gridOpts.fill, gridOpts.cheats),
                // shape = HexGrid.shapeTrapezoidal(0, gridOpts.size, 0, gridOpts.size, false, gridOpts.cellSize, layout, gridOpts.fill, gridOpts.cheats),
                // shape = HexGrid.shapeTriangle1(gridOpts.size, gridOpts.cellSize, layout, gridOpts.fill, gridOpts.cheats),
                // shape = HexGrid.shapeTriangle2(gridOpts.size, gridOpts.cellSize, layout, gridOpts.fill, gridOpts.cheats),
                grid = new HexGrid(gridOpts, shape, layout);
            let maze = new Maze(grid.init()),
                worldOpts   = {
                    simSpeed: 1,
                    cheats: cheats,
                    collision: {
                        type: 'brute'
                    },
                    grid: maze.grid,
                    maze: maze,
                    numEntities: 20,
                    entityOpts: {
                        radius: 10,
                        collision: true,
                        interactive: true,
                        useSprite: false,
                        moving: true
                    }
                };

            super(agents, maze.walls, worldOpts, renderOpts);
            // this.agents[0].load('zoo/wateragent.json');
            // this.agents[1].load('zoo/wateragent.json');

            return this;
        }

        drawSolution() {
            this.maze.drawSolution(this.stage);
        }
    }
    global.HexWorld = HexWorld;

}(this));
