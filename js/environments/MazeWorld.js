(function (global) {
    "use strict";

    /**
     * Maze contains many agents and walls and food and stuff
     *
     * @returns {MazeWorld}
     * @constructor
     */
    var MazeWorld = function () {
        this.canvas = document.getElementById("world");
        this.xCount = 10;
        this.yCount = 10;
        this.numItems = 40;
        this.closed = false;
        this.cheats = true;
        this.maze = new Maze(this);
        this.Rarr = null;
        this.Aarr = null;

        this.agentTDOpts = {
            brainType: 'TD',
            numEyes: 9,
            numTypes: 3,
            width: 20,
            height: 20,
            radius: 10,
            collision: false,
            interactive: false,
            useSprite: false,
            movingEntities: false
        };

        this.entityOpts = {
            width: 20,
            height: 20,
            radius: 10,
            collision: false,
            interactive: false,
            useSprite: false,
            movingEntities: false
        };

        this.grid = this.maze.grid;
        this.walls = this.maze.walls;
        this.gS = this.maze.grid.yCount * this.maze.grid.xCount;

        this.agents = [
            new AgentTD(new Vec(1, 1), this.grid, this.agentTDOpts),
            new AgentTDWorker(new Vec(1, 1), this.grid, this.agentTDOpts)
        ];

        World.call(this, this, this.entityOpts);

        // init the quadtree
        var args = {
            x: 0,
            y: 0,
            height: this.height,
            width: this.width,
            maxChildren: 5,
            maxDepth: 5
        };
        this.tree = new QuadTree(args);

        this.tree.insert(this.nodes);

        return this;
    };

    MazeWorld.prototype = Object.create(World.prototype);
    MazeWorld.prototype.constructor = World;

    MazeWorld.prototype.CD = (function () {
        var nChecks;

        return {
            check: function (item, world) {
                // reset check counter
                nChecks = 0;
                var n = world.nodes.length, m, region, i, k, entity;

                // clear the quadtree
                world.tree.clear();

                // fill the quadtree
                world.tree.insert(world.nodes);

                // iterate all elements
                for (i = 0; i < n; i++) {
                    entity = world.nodes[i];
                    // get all elements in the same region as orb
                    region = world.tree.retrieve(entity, function(item) {
                        world.CD.detectCollision(entity, item);
                        nChecks++;
                    });
                }
            },
            detectCollision: function (entity1, entity2) {
                if (entity1 === entity2) {
                    return;
                }
                if (entity1.position.x + entity1.width < entity2.position.x) {
                    return;
                }
                if (entity1.position.x > entity2.position.x + entity2.width) {
                    return;
                }
                if (entity1.position.y + entity1.height < entity2.position.y) {
                    return;
                }
                if (entity1.position.y > entity2.position.y + entity2.height) {
                    return;
                }
                entity1.cleanup = true;
            },
            getNChecks: function () {
                return nChecks;
            }
        };
    }());

    /**
     * Remove the entity from the world
     * @param {Object} entity
     */
    MazeWorld.prototype.deleteEntity = function (entity) {
        this.entities.splice(this.entities.findIndex(Utility.getId, entity.id), 1);
        this.stage.removeChild(entity.shape || entity.sprite);
        this.nodes.splice(this.nodes.findIndex(Utility.getId, entity.id), 1);
    };

    /**
     *
     * @returns {World}
     */
    MazeWorld.prototype.addAgents = function () {
        // Add the agents
        var agentNames = [];
        for (let a = 0; a < this.agents.length; a++) {
            this.stage.addChild(this.agents[a].shape || this.agents[a].sprite);
            for (let ei = 0; ei < this.agents[a].eyes.length; ei++) {
                this.stage.addChild(this.agents[a].eyes[ei].shape);
            }
            agentNames.push({name:this.agents[a].name});
            this.nodes.push(this.agents[a]);
        }

        if (typeof this.rewardGraph !== 'undefined') {
            this.rewardGraph.setLegend(agentNames);
        }

        return this;
    };

    /**
     * Add an entity to the world
     */
    MazeWorld.prototype.addEntity = function () {
        let type = Utility.randi(1, 3),
            x = Utility.randi(5, this.width - 10),
            y = Utility.randi(5, this.height - 10),
            z = 0,
            vx = Math.random() * 5 - 2.5,
            vy = Math.random() * 5 - 2.5,
            vz = 0,
            position = new Vec(x, y, z, vx, vy, vz);
        let entity = new Entity(type, position, this.grid, this.entityOpts);

        // Insert the population
        this.entities.push(entity);
        this.stage.addChild(entity.shape || entity.sprite);
        this.nodes.push(entity);
    };

    MazeWorld.prototype.updatePopulation = function () {
        this.tree.clear();
        this.nodes = [];
        // draw walls in environment
        for (let i = 0, n = this.walls.length; i < n; i++) {
            //this.walls[i].draw();
        }

        // draw items
        for (let ii = 0, ni = this.entities.length; ii < ni; ii++) {
            this.nodes.push(this.entities[ii]);
        }

        // draw agents
        for (var ai = 0, na = this.agents.length; ai < na; ai++) {
            this.nodes.push(this.agents[ai]);
        }

        this.tree.insert(this.nodes);
    };

    /**
     * Set up the grid world and the actions avail
     */
    MazeWorld.prototype.reset = function () {
        // specify some rewards
        var Rarr = R.zeros(this.gS),
            Aarr = new Array(this.gS);

        for (let y = 0; y < this.grid.yCount; y++) {
            for (let x = 0; x < this.grid.xCount; x++) {
                var state = this.xyToS(x, y),
                    actions = this.grid.disconnectedNeighbors(this.grid.getCellAt(x, y)),
                    actionsAvail = {0: null, 1: null, 2: null, 3: null};
                for (let a = 0; a < actions.length; a++) {
                    let action = actions[a],
                        actionState = this.xyToS(action.x, action.y);
                    if (action.x === x - 1 && action.y === y) {
                        actionsAvail[0] = actionState;
                    } else if (action.x === x && action.y === y + 1) {
                        actionsAvail[1] = actionState;
                    } else if (action.x === x && action.y === y - 1) {
                        actionsAvail[2] = actionState;
                    } else if (action.x === x + 1 && action.y === y) {
                        actionsAvail[3] = actionState;
                    }
                    Aarr[state] = actionsAvail;
                    Rarr[state] = (actions.length >= 2) ? 1 : 0;
                }
            }
        }

        this.Rarr = Rarr;
        this.Aarr = Aarr;
    };

    /**
     * Get the reward of being in s, taking action a, and ending up in ns
     *
     * @param {Number} s
     * @param {Number} a
     * @param {Number} ns
     * @returns {Number}
     */
    MazeWorld.prototype.reward = function (s, a, ns) {
        var rew = this.Rarr[s];

        return rew;
    };

    /**
     *
     *
     * @param {Number} s
     * @param {Number} a
     * @returns {Number}
     */
    MazeWorld.prototype.nextStateDistribution = function (s, a) {
        var ns, nx, ny,
            sx = this.sToX(s),
            sy = this.sToY(s);

        switch (a) {
            case 0:
                // Left
                nx = sx - 1;
                ny = sy;
                break;
            case 1:
                // Down
                nx = sx;
                ny = sy + 1;
                break;
            case 2:
                // Up
                nx = sx;
                ny = sy - 1;
                break;
            case 3:
                // Right
                nx = sx + 1;
                ny = sy;
                break;
        }

        if (nx < 0) {
            nx = 0;
        }

        if (ny < 0) {
            ny = 0;
        }

        // gridworld is deterministic, so return only a single next state
        ns = this.xyToS(nx, ny);
        let actions = this.Aarr[s];
        if (actions[a] !== ns) {
            // Not a valid option so go back to s
            return s;
        } else {
            return ns;
        }
    };

    /**
     * Observe the raw reward of being in s, taking a, and ending up in ns
     *
     * @param {Number} s
     * @param {Number} a
     * @returns {{ns: (*|Number), r: (*|Number)}}
     */
    MazeWorld.prototype.sampleNextState = function (s, a) {
        var ns = this.nextStateDistribution(s, a),
            r = this.reward(s, a, ns);

        // every step takes a bit of negative reward
        r -= 0.01;
        var out = {
            'ns': ns,
            'r': r
        };
        if (s === (this.gS - 1)) {
            // episode is over
            out.reset_episode = true;
        }

        return out;
    };

    /**
     * Return the number of states
     *
     * @returns {Number}
     */
    MazeWorld.prototype.getNumStates = function () {
        return this.gS;
    };

    /**
     * Return the number of actions
     *
     * @returns {Number}
     */
    MazeWorld.prototype.getMaxNumActions = function () {
        return 4;
    };

    /**
     * Return the allowed actions based on s
     *
     * @returns {Array}
     */
    MazeWorld.prototype.allowedActions = function (s) {
        var x = this.sToX(s),
            y = this.sToY(s),
            as = [],
            c = this.grid.getCellAt(x, y);
        var actions = this.grid.disconnectedNeighbors(c);

        for (let a = 0; a < actions.length; a++) {
            let action = actions[a];
            if (action.x === x - 1 && action.y === y) {
                as.push(0);
            } else if (action.x === x && action.y === y + 1) {
                as.push(1);
            } else if (action.x === x && action.y === y - 1) {
                as.push(2);
            } else if (action.x === x + 1 && action.y === y) {
                as.push(3);
            }
        }

        return as;
    };

    /**
     * Convert the state to an x
     *
     * @param {Number} s
     * @returns {Number}
     */
    MazeWorld.prototype.sToX = function (s) {
        return Math.floor(s / this.grid.xCount);
    };

    /**
     * Convert the state to a y
     *
     * @param {Number} s
     * @returns {Number}
     */
    MazeWorld.prototype.sToY = function (s) {
        return s % this.grid.yCount;
    };

    /**
     * Convert an x, y to the state
     *
     * @param {Number} x
     * @param {Number} y
     * @returns {Number}
     */
    MazeWorld.prototype.xyToS = function (x, y) {
        return x * this.grid.xCount + y;
    };

    /**
     * Return a rand state
     *
     * @returns {Number}
     */
    MazeWorld.prototype.randomState = function () {
        return Math.floor(Math.random() * this.gS);
    };

    /**
     * Return the starting state
     *
     * @returns {Number}
     */
    MazeWorld.prototype.startState = function () {
        return 0;
    };

    global.MazeWorld = MazeWorld;

}(this));
