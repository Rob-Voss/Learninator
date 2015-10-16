(function (global) {
    "use strict";

    /**
     * Make a World
     * @param {Object} opts
     * @param {Object} entityOpts
     * @returns {World}
     */
    var World = function (opts, entityOpts) {
        var _this = this;
        this.canvas = Utility.getOpt(opts, 'canvas', document.getElementById('world'));
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Population/collision detection type
        this.numItems = Utility.getOpt(opts, 'numItems', 20);
        this.cheats = Utility.getOpt(opts, 'cheats', false);

        // Basics for the environment
        this.agents = Utility.getOpt(opts, 'agents', []);
        this.entities = Utility.getOpt(opts, 'entities', []);
        this.walls = Utility.getOpt(opts, 'walls', []);

        // Entity options
        this.entityOpts = entityOpts;

        this.clock = 0;
        this.pause = false;

        // PIXI gewdness
        this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {view: this.canvas}, true);
        this.renderer.backgroundColor = 0xFFFFFF;
        document.body.appendChild(this.renderer.view);
        this.stage = new PIXI.Container();

        if (this.cdType === 'grid') {
            GridCD.apply(this);
        } else if (this.cdType === 'quad') {
            QuadCD.apply(this);
        } else if (this.cdType === 'brute') {
            BruteCD.apply(this);
        }

        this.addAgents();
        this.addWalls();
        this.addEntities();

        if (this.useFlot === true) {
            // flot stuff
            this.nflot = 1000;
            this.smoothRewardHistory = [];
            this.smoothReward = [];
            this.flott = [];

            this.initFlot();
        } else if (this.useGraph === true) {
            this.rewardGraph = Utility.getOpt(opts, 'rewardGraph', new RewardGraph(opts));
        }

        function animate() {
            if (!_this.pause) {
                _this.updatePopulation();
                _this.tick();
                _this.updatePopulation();
                _this.draw();
            }
            _this.renderer.render(_this.stage);
            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);

        return this;
    };

    /**
     * Add the Agents
     * @returns {World}
     */
    World.prototype.addAgents = function () {
        // Add the agents
        let agents = [],
            lastColor;
        for (let a = 0; a < this.agents.length; a++) {
            let agentContainer = new PIXI.Container();
            for (let ei = 0; ei < this.agents[a].eyes.length; ei++) {
                agentContainer.addChild(this.agents[a].eyes[ei].shape);
            }
            agentContainer.addChild(this.agents[a].shape || this.agents[a].sprite);
            this.stage.addChild(agentContainer);

            this.agents[a].color = this.agents[a].hexStyles[this.agents[a].type];
            // If we are already using another agent's color, mix it up a bit
            if (this.agents[a].legendColor === lastColor) {
                this.agents[a].legendColor = this.agents[a].styles[this.agents[a].type + 1];
            }
            // Set up the Legend in the reward graph
            if (this.useGraph === true && this.rewardGraph !== undefined) {
                agents.push({
                    name: this.agents[a].name,
                    color: this.agents[a].legendColor
                });
            }
            lastColor = this.agents[a].legendColor;
        }

        if (this.useGraph === true && this.rewardGraph !== undefined) {
            this.rewardGraph.setLegend(agents);
        }

        return this;
    };

    /**
     * Add some noms
     * @returns {World}
     */
    World.prototype.addEntityAgents = function () {
        for (let k = 0; k < this.numEntityAgents; k++) {
            let x = Utility.randi(5, this.width - 10),
                y = Utility.randi(5, this.height - 10),
                vx = Math.random() * 5 - 2.5,
                vy = Math.random() * 5 - 2.5,
                position = new Vec(x, y, 0, vx, vy),
                entity = new EntityRLDQN(position, this.entityAgentOpts);
            entity.target = this.entities[Utility.randi(0, this.numEntityAgents)];
            entity.enemy = this.agents[Utility.randi(0, this.agents.length)];

            let agentContainer = new PIXI.Container();
            for (let ei = 0; ei < entity.eyes.length; ei++) {
                agentContainer.addChild(entity.eyes[ei].shape);
            }
            agentContainer.addChild(entity.shape || entity.sprite);
            this.stage.addChild(agentContainer);

            this.agents.push(entity);
        }

        return this;
    };

    /**
     * Add new entities
     * @parameter {Number} number
     * @returns {World}
     */
    World.prototype.addEntities = function (number) {
        if (number === undefined) {
            number = this.numItems - this.entities.length;
        }
        // Populating the world
        for (let k = 0; k < number; k++) {
            this.addEntity();
        }

        return this;
    };

    /**
     * Add an entity to the world
     * @returns {World}
     */
    World.prototype.addEntity = function () {
        // Random radius
        this.entityOpts.radius = 10;//Utility.randi(5, 10);
        let type = Utility.randi(1, 3),
            x = Utility.randi(2, this.width - 2),
            y = Utility.randi(2, this.height - 2),
            vx = Utility.randf(-2, 2),
            vy = Utility.randf(-2, 2),
            position = new Vec(x, y, 0, vx, vy),
            entity = new Entity(type, position, this.entityOpts);

        // Insert the population
        this.entities.push(entity);
        this.stage.addChild(entity.shape || entity.sprite);

        return this;
    };

    /**
     * Add the Walls
     * @returns {World}
     */
    World.prototype.addWalls = function () {
        this.wallContainer = new PIXI.Container();
        // Add the walls to the world
        for (let w = 0; w < this.walls.length; w++) {
            this.wallContainer.addChild(this.walls[w].shape);
            if (this.cheats.walls) {
                let wallText = new PIXI.Text(w, {font: "10px Arial", fill: "#640000", align: "center"});
                wallText.position.set(this.walls[w].v1.x + 10, this.walls[w].v1.y);
                this.wallContainer.addChild(wallText);
            }
        }
        this.stage.addChild(this.wallContainer);

        return this;
    };

    /**
     * Remove the entity from the world
     * @param {Object} entity
     * @returns {World}
     */
    World.prototype.deleteEntity = function (entity) {
        this.entities.splice(this.entities.findIndex(Utility.getId, entity.id), 1);
        this.stage.removeChild(entity.shape || entity.sprite);

        return this;
    };

    /**
     * Draws the world
     * @returns {World}
     */
    World.prototype.draw = function () {
        // draw walls in environment
        for (let i = 0, n = this.walls.length; i < n; i++) {
            this.walls[i].draw();
        }

        // draw items
        for (let e = 0, ni = this.entities.length; e < ni; e++) {
            this.entities[e].draw();
            if (this.entities[e].cheats) {
                this.entities[e].updateCheats();
            }
        }

        // draw agents
        for (let a = 0, na = this.agents.length; a < na; a++) {
            // draw agents body
            this.agents[a].draw();
            if (this.agents[a].cheats) {
                this.agents[a].updateCheats();
            }
        }

        this.graphRewards();

        return this;
    };

    /**
     * Tick the environment
     * @returns {World}
     */
    World.prototype.tick = function () {
        this.lastTime = this.clock;
        this.clock++;

        // Loop through the agents of the world and make them do work!
        for (let a = 0; a < this.agents.length; a++) {
            this.agents[a].tick(this);
        }

        // Loop through the entities of the world and make them do work son!
        for (let e = 0; e < this.entities.length; e++) {
            this.entities[e].tick(this);
        }

        // Loop through and destroy old items
        for (let e = 0; e < this.entities.length; e++) {
            let entity = this.entities[e],
                edibleEntity = (entity.type === 2 || entity.type === 1);
            if ((entity.type === 2 && entity.age > 2500 ) || (edibleEntity && entity.age > 5000) || entity.cleanUp === true) {
                this.deleteEntity(this.entities[e]);
            }
        }

        // If we have less then the number of Items allowed throw a random one in
        if (this.entities.length < this.numItems && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
            this.addEntities(this.numItems - this.entities.length);
        }

        // If we have less then the number of Agents allowed throw a random one in
        //if (this.agents.length < this.numAgents && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
            //var missing = this.numAgents - this.agents.length;
            //for (let na = 0; na < missing; na++) {
            //    this.addAgent();
            //}
        //}

        return this;
    };

    /**
     * Graph the agent rewards
     * @returns {World}
     */
    World.prototype.graphRewards = function () {
        // If we are using flot based rewards
        if (this.useFlot === true) {
            for (let a = 0, ac = this.agents.length; a < ac; a++) {
                let agent = this.agents[a],
                    rew = agent.lastReward;

                if (this.smoothReward[a] === null) {
                    this.smoothReward[a] = rew;
                }
                this.smoothReward[a] = this.smoothReward[a] * 0.999 + rew * 0.001;
                this.flott[a] += 1;
                if (this.flott[a] === 50) {
                    for (let i = 0, hl = this.smoothRewardHistory[a].length; i <= hl; i++) {
                        // record smooth reward
                        if (hl >= this.nflot) {
                            this.smoothRewardHistory[a] = this.smoothRewardHistory[a].slice(1);
                        }
                        this.smoothRewardHistory[a].push(this.smoothReward[a]);
                        this.flott[a] = 0;
                    }
                }
                if (typeof this.series[a] !== 'undefined') {
                    this.series[a].data = this.getFlotRewards(a);
                }
                // Clear them up since we've drawn them
                this.agents[a].pts = [];
            }

            this.plot.setData(this.series);
            this.plot.draw();
        } else if (this.useGraph === true) {
            // Or maybe we are using simple Graph based rewards
            for (let a = 0, al = this.agents.length; a < al; a++) {
                if (this.clock % 100 === 0 && this.agents[a].pts.length !== 0) {
                    // Throw some points on a Graph
                    this.rewardGraph.addPoint(this.clock / 100, a, this.agents[a].pts);
                    this.rewardGraph.drawPoints();
                    // Clear them up since we've drawn them
                    this.agents[a].pts = [];
                }
            }
        }

        return this;
    };

    /**
     * Initialize the Flot class
     * @returns {World}
     */
    World.prototype.initFlot = function () {
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
                lines: {
                    fill: true
                },
                color: a,
                label: this.agents[a].name
            };
        }

        this.plot = $.plot(this.container, this.series, {
            grid: {
                borderWidth: 1,
                minBorderMargin: 20,
                labelMargin: 5,
                backgroundColor: {
                    colors: ["#FFF", "#e4f4f4"]
                },
                margin: {
                    top: 5,
                    bottom: 5,
                    left: 5
                }
            },
            xaxis: {
                min: 0,
                max: this.nflot
            },
            yaxis: {
                min: -2.0,
                max: 2.0
            }
        });

        return this;
    };

    /**
     * zip rewards into flot data
     * @param {Number} an
     * @returns {Array}
     */
    World.prototype.getFlotRewards = function (an) {
        var res = [];
        if (this.smoothRewardHistory[an] === null) {
            this.smoothRewardHistory[an] = [];
        }

        for (let i = 0, hl = this.smoothRewardHistory[an].length; i < hl; i++) {
            res.push([i, this.smoothRewardHistory[an][i]]);
        }

        return res;
    };

    global.World = World;

}(this));
