(function (global) {
    "use strict";

    class MazeWorld extends World {

        /**
         * World object contains many agents and walls and food and stuff
         * @name MazeWorld
         * @extends World
         * @constructor
         *
         * @returns {MazeWorld}
         */
        constructor() {
            var cheats = {
                    id: false,
                    name: false,
                    angle: false,
                    bounds: false,
                    direction: false,
                    gridLocation: false,
                    position: false,
                    walls: false
                },
                renderOpts = {
                    antialiasing: true,
                    autoResize: false,
                    resizable: false,
                    transparent: false,
                    resolution: 1,//window.devicePixelRatio,
                    noWebGL: false,
                    width: 600,
                    height: 600
                },
                gridOpts = {
                    width: renderOpts.width,
                    height: renderOpts.height,
                    buffer: 0,
                    size: 10,
                    cellSize: 60,
                    cellSpacing: 0,
                    fill: false,
                    closed: false,
                    cheats: cheats
                },
                maze = new Maze(new Grid(gridOpts));

            let worldOpts = {
                    simSpeed: 1,
                    collision: {
                        type: 'brute'
                    },
                    grid: maze.grid,
                    cheats: cheats,
                    numEntities: 30,
                    entityOpts: {
                        radius: 10,
                        collision: true,
                        interactive: true,
                        useSprite: false,
                        moving: false
                    }
                },
                env = {
                    grid: maze.grid,
                    allowedActions: (s) => {
                        if (maze.grid.cells[s] === undefined) {
                            return;
                        }
                        return maze.grid.cells[s].neighbors;
                    },
                    getMaxNumActions: () => {
                        return 4;
                    },
                    getNumStates: () => {
                        return maze.grid.cells.length;
                    },
                    nextStateDistribution: (s, a) => {
                        return maze.grid.cells[s].neighbors[a];
                    },
                    randomState: () => {
                        return Math.floor(Math.random() * this.grid.cells.length);
                    },
                    reset: () => {
                        return maze.reset();
                    },
                    sampleNextState: (s, a) => {
                        return maze.grid.cells[s].neighbors[a];
                    },
                    startState: () => {
                        return 0;
                    },
                    sToX: (s) => {
                        return maze.grid.cells[s].x;
                    },
                    sToY: (s) => {
                        return maze.grid.cells[s].y;
                    },
                    xyToS: (x, y) => {
                        return maze.grid.getCellAt(x, y);
                    }
                },
                agentOpts   = {
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
                agents = [
                    new Agent(new Vec(renderOpts.width / 2, renderOpts.height / 2), agentOpts)
                    // new Agent(new Vec(50, 50), {
                    //         brainType: 'RL.TDAgent',
                    //         env: env,
                    //         numActions: 4,
                    //         numStates: 0,
                    //         numEyes: 0,
                    //         numTypes: 0,
                    //         numProprioception: 0,
                    //         range: 0,
                    //         proximity: 0,
                    //         radius: 10,
                    //         collision: false,
                    //         interactive: false,
                    //         useSprite: false,
                    //         worker: false
                    //     })
                ];

            super(agents, maze.walls, worldOpts, renderOpts);
            maze.drawSolution();
            this.stage.addChild(maze.cheatsContainer);
            // this.agents[0].load('zoo/mazeagent.json');

            return this;
        }
    }

    global.MazeWorld = MazeWorld;

}(this));
