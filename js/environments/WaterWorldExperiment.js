(function (global) {
    "use strict";

    /**
     * World object contains many agents and walls and food and stuff
     *
     * @returns {WaterWorld}
     * @constructor
     */
    var WaterWorld = function () {
        this.canvas = document.getElementById("world");
        this.xCount = 1;
        this.yCount = 1;
        this.numEntities = 10;
        this.numEntityAgents = 10;
        this.closed = true;
        this.cheats = false;
        this.entities = [];
        this.nodes = [];

        this.agentOpts = {
            brainType: 'RLDQN',
            numEyes: 30,
            numTypes: 5,
            width: 20,
            height: 20,
            radius: 10,
            collision: true,
            interactive: false,
            useSprite: false,
            cheats: false
        };

        this.entityOpts = {
            brainType: 'RLDQN',
            numEyes: 4,
            numTypes: 1,
            width: 20,
            height: 20,
            radius: 10,
            collision: true,
            interactive: false,
            useSprite: false,
            movingEntities: true,
            cheats: false
        };

        this.walls = [
            new Wall(new Vec(0, 0), new Vec(0 + this.canvas.width, 0)),
            new Wall(new Vec(0 + this.canvas.width, 0), new Vec(0 + this.canvas.width, 0 + this.canvas.height)),
            new Wall(new Vec(0 + this.canvas.width, 0 + this.canvas.height), new Vec(0, 0 + this.canvas.height)),
            new Wall(new Vec(0, 0 + this.canvas.height), new Vec(0, 0))
        ];

        World.call(this, this, this.entityOpts);

        // init the quadtree
        var args = {
            x: 0,
            y: 0,
            height: this.canvas.height,
            width: this.canvas.width,
            maxChildren: 5,
            maxDepth: 5
        };
        this.tree = new QuadTree(args);

        this.addAgents();
        this.addEntities();
        this.updatePopulation();

        return this;
    };

    WaterWorld.prototype = Object.create(World.prototype);
    WaterWorld.prototype.constructor = World;

    /**
     * Add the Agents
     * @returns {World}
     */
    WaterWorld.prototype.addAgents = function () {
        this.agents = [
            new AgentRLDQN(new Vec(300, 300), this, this.agentOpts)
        ];
        this.agents[0].load('zoo/wateragent.json');

        // Add the agents
        for (let a = 0; a < this.agents.length; a++) {
            this.stage.addChild(this.agents[a].shape || this.agents[a].sprite);
            for (let ei = 0; ei < this.agents[a].eyes.length; ei++) {
                this.stage.addChild(this.agents[a].eyes[ei].shape);
            }
            this.agents.push(this.agents[a]);
        }

        return this;
    };

    /**
     * Add some noms
     * @returns {World}
     */
    WaterWorld.prototype.addEntities = function () {
        for (let k = 0; k < this.numEntities; k++) {
            let type = Utility.randi(1, 3),
                x = Utility.randi(5, this.canvas.width - 10),
                y = Utility.randi(5, this.canvas.height - 10),
                z = 0,
                vx = Math.random() * 5 - 2.5,
                vy = Math.random() * 5 - 2.5,
                vz = 0,
                position = new Vec(x, y, z, vx, vy, vz),
                entity;
            if (type === 1) {
                entity = new Entity(type, position, this, this.entityOpts);
                this.stage.addChild(entity.shape || entity.sprite);
            } else {
                entity = new EntityRLDQN(position, this, this.entityOpts);

                // Insert the population
                this.stage.addChild(entity.shape || entity.sprite);
                for (let ei = 0; ei < entity.eyes.length; ei++) {
                    this.stage.addChild(entity.eyes[ei].shape);
                }
            }

            this.entities.push(entity);
        }
    };

    /**
     * Remove the entity from the world
     * @param {Object} entity
     */
    World.prototype.deleteEntity = function (entity) {
        this.nodes.splice(this.nodes.findIndex(Utility.getId, entity.id), 1);
        this.entities.splice(this.entities.findIndex(Utility.getId, entity.id), 1);
        this.stage.removeChild(entity.shape || entity.sprite);
    };

    /**
     * Update the QuadTree
     */
    WaterWorld.prototype.updatePopulation = function () {
        this.tree.clear();
        this.nodes = [];

        for (let i = 0, ni = this.entities.length; i < ni; i++) {
            this.nodes.push(this.entities[i]);
        }

        for (let i = 0, na = this.agents.length; i < na; i++) {
            this.nodes.push(this.agents[i]);
        }

        this.tree.insert(this.nodes);
    };

    /**
     * Draw it all
     */
    WaterWorld.prototype.draw = function () {
        // draw walls in environment
        for (let i = 0, n = this.walls.length; i < n; i++) {
            this.walls[i].draw();
        }

        // draw agents
        for (let i = 0, ni = this.agents.length; i < ni; i++) {
            this.agents[i].draw();

            // draw agents sight
            for (let ei = 0, ne = this.agents[i].eyes.length; ei < ne; ei++) {
                this.agents[i].eyes[ei].draw(this.agents[i].position, this.agents[i].angle);
            }
        }

        for (let i = 0, n = this.entities.length; i < n; i++) {
            this.entities[i].draw();

            // draw agents sight
            for (let ei = 0, ne = this.entities[i].eyes.length; ei < ne; ei++) {
                this.entities[i].eyes[ei].draw(this.entities[i].position, this.entities[i].angle);
            }
        }

    };

    /**
     * Tick the environment
     */
    WaterWorld.prototype.tick = function () {
        // Reset the cell's population's
        this.updatePopulation();

        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].tick(this);
        }

        // Loop through and destroy old items
        for (let e = 0; e < this.nodes.length; e++) {
            if (this.nodes[e].cleanUp === true) {
                this.deleteEntity(this.nodes[e]);
            }
        }
    };

    global.WaterWorld = WaterWorld;

}(this));
