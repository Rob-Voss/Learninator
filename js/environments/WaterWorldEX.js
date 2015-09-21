(function (global) {
    "use strict";

    /**
     * World object contains many agents and walls and food and stuff
     *
     * @returns {WaterWorldEX}
     * @constructor
     */
    var WaterWorldEX = function () {
        this.canvas = document.getElementById("world");
        this.xCount = 1;
        this.yCount = 1;
        this.numEntities = 10;
        this.numEntityAgents = 10;
        this.closed = true;
        this.cheats = false;
        this.entities = [];
        this.nodes = [];

        // flot stuff
        this.nflot = 1000;
        this.smoothRewardHistory = [];
        this.smoothReward = [];
        this.flott = [];

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

        this.initFlot = function () {
            for (let a = 0; a < this.agents.length; a++) {
                this.smoothReward[a] = null;
                this.smoothRewardHistory[a] = null;
            }
            this.container = document.getElementById('flotreward');
            this.series = [];
            for (let a = 0, ac = this.agents.length; a < ac; a++) {
                this.flott[a] = 0;
                this.smoothRewardHistory[a] = [];
                this.series[a] = {
                    data: this.getFlotRewards(a),
                    lines: {fill: true},
                    color: a,
                    label: this.agents[a].name
                };
            }

            this.plot = $.plot(this.container, this.series, {
                grid: {
                    borderWidth: 1,
                    minBorderMargin: 20,
                    labelMargin: 10,
                    backgroundColor: {
                        colors: ["#FFF", "#e4f4f4"]
                    },
                    margin: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                    }
                },
                xaxis: {
                    min: 0,
                    max: this.nflot
                },
                yaxis: {
                    min: -0.10,
                    max: 0.10
                }
            });
        };

        /**
         *
         * @param {Number} an
         * @returns {Array}
         */
        this.getFlotRewards = function (an) {
            // zip rewards into flot data
            var res = [];
            if (this.smoothRewardHistory[an] === null) {
                this.smoothRewardHistory[an] = [];
            }

            for (var i = 0, hl = this.smoothRewardHistory[an].length; i < hl; i++) {
                res.push([i, this.smoothRewardHistory[an][i]]);
            }

            return res;
        };

        this.graphRewards = function () {
            for (var a = 0, ac = this.agents.length; a < ac; a++) {
                var agent = this.agents[a],
                    rew = agent.lastReward;

                if (this.smoothReward[a] === null) {
                    this.smoothReward[a] = rew;
                }
                this.smoothReward[a] = this.smoothReward[a] * 0.999 + rew * 0.001;
                this.flott[a] += 1;
                if (this.flott[a] === 50) {
                    for (var i = 0, hl = this.smoothRewardHistory[a].length; i <= hl; i++) {
                        // record smooth reward
                        if (hl >= this.nflot) {
                            this.smoothRewardHistory[a] = this.smoothRewardHistory[a].slice(1);
                        }
                        this.smoothRewardHistory[a].push(this.smoothReward[a]);
                        this.flott[a] = 0;
                    }
                }
            }

            for (var an = 0, al = this.agents.length; an < al; an++) {
                if (typeof this.series[an] !== 'undefined') {
                    this.series[an].data = this.getFlotRewards(an);
                }
            }

            this.plot.setData(this.series);
            this.plot.draw();
        };

        World.call(this, this, this.entityOpts);

        this.addAgents();
        this.addEntities();
        this.updatePopulation();

        this.initFlot();

        return this;
    };

    WaterWorldEX.prototype = Object.create(World.prototype);
    WaterWorldEX.prototype.constructor = World;

    /**
     * Add the Agents
     * @returns {World}
     */
    WaterWorldEX.prototype.addAgents = function () {
        var vec1 = new Vec(Utility.randi(2, this.canvas.width - 2), Utility.randi(2, this.canvas.height - 2));

        this.agents = [
            new AgentRLDQN(vec1, this, this.agentOpts)
        ];
        //this.agents[0].load('zoo/wateragent.json');

        // Add the agents
        for (let a = 0; a < this.agents.length; a++) {
            this.stage.addChild(this.agents[a].shape || this.agents[a].sprite);
            for (let ei = 0; ei < this.agents[a].eyes.length; ei++) {
                this.stage.addChild(this.agents[a].eyes[ei].shape);
            }
        }

        return this;
    };

    /**
     * Add some noms
     * @returns {World}
     */
    WaterWorldEX.prototype.addEntities = function () {
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
            } else if(type === 2 && Utility.randf(0, 1) < 0.25) {
                entity = new EntityRLDQN(position, this, this.entityOpts);

                // Insert the population
                this.stage.addChild(entity.shape || entity.sprite);
                for (let ei = 0; ei < entity.eyes.length; ei++) {
                    this.stage.addChild(entity.eyes[ei].shape);
                }
            } else {
                entity = new Entity(type, position, this, this.entityOpts);
                this.stage.addChild(entity.shape || entity.sprite);
            }

            this.entities.push(entity);
        }
    };

    /**
     * Remove the entity from the world
     * @param {Object} entity
     */
    WaterWorldEX.prototype.deleteEntity = function (entity) {
        this.nodes.splice(this.nodes.findIndex(Utility.getId, entity.id), 1);
        this.entities.splice(this.entities.findIndex(Utility.getId, entity.id), 1);
        this.stage.removeChild(entity.shape || entity.sprite);
    };

    /**
     * Update the QuadTree
     */
    WaterWorldEX.prototype.updatePopulation = function () {
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
    WaterWorldEX.prototype.draw = function () {
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
            if (typeof this.entities[i].eyes !== 'undefined') {
                // draw agents sight
                for (let ei = 0, ne = this.entities[i].eyes.length; ei < ne; ei++) {
                    this.entities[i].eyes[ei].draw(this.entities[i].position, this.entities[i].angle);
                }
            }
        }

    };

    /**
     * Tick the environment
     */
    WaterWorldEX.prototype.tick = function () {
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

    global.WaterWorldEX = WaterWorldEX;

}(this));
