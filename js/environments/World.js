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

        this.addWalls();
        this.addAgents();
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
                _this.tick();
            }
            _this.renderer.render(_this.stage);
            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);

        return this;
    };

    /**
     *
     * @returns {World}
     */
    World.prototype.addAgents = function () {
        // Add the agents
        for (let a = 0; a < this.agents.length; a++) {
            let agentContainer = new PIXI.Container();
            for (let ei = 0; ei < this.agents[a].eyes.length; ei++) {
                agentContainer.addChild(this.agents[a].eyes[ei].shape);
            }
            agentContainer.addChild(this.agents[a].shape || this.agents[a].sprite);
            this.stage.addChild(agentContainer);
        }

        if (this.useGraph === true && this.rewardGraph !== undefined) {
            let agentNames = [];
            for (let an = 0; an < this.agents.length; an++) {
                agentNames.push({name: this.agents[an].name});
            }
            this.rewardGraph.setLegend(agentNames);
        }

        return this;
    };

    /**
     *
     * @returns {World}
     */
    World.prototype.addEntities = function () {
        // Populating the world
        for (let k = 0; k < this.numItems; k++) {
            this.addEntity();
        }

        return this;
    };

    /**
     * Add an entity to the world
     */
    World.prototype.addEntity = function () {
        // Random radius
        this.entityOpts.radius = 10;//Utility.randi(5, 10);
        let type = Utility.randi(1, 3),
            x = Utility.randi(2, this.width - 2),
            y = Utility.randi(2, this.height - 2),
            vx = Utility.randf(-2, 2),
            vy = Utility.randf(-2, 2),
            position = new Vec(x, y, 0, vx, vy, 0),
            entity = new Entity(type, position, this.entityOpts);

        // Insert the population
        this.entities.push(entity);
        this.stage.addChild(entity.shape || entity.sprite);

        return this;
    };

    /**
     *
     * @returns {World}
     */
    World.prototype.addWalls = function () {
        this.wallContainer = new PIXI.Container();
        // Add the walls to the world
        for (let w = 0; w < this.walls.length; w++) {
            this.wallContainer.addChild(this.walls[w].shape);
            if (this.cheats.walls === true) {
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
     */
    World.prototype.deleteEntity = function (entity) {
        this.entities.splice(this.entities.findIndex(Utility.getId, entity.id), 1);
        this.stage.removeChild(entity.shape || entity.sprite);

        return this;
    };

    /**
     * Draws the world
     *
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
            // draw agents sight
            for (let ae = 0, ne = this.agents[a].eyes.length; ae < ne; ae++) {
                this.agents[a].eyes[ae].draw(this.agents[a].position, this.agents[a].angle);
            }
        }

        this.graphRewards();
    };

    /**
     * Tick the environment
     */
    World.prototype.tick = function () {
        this.lastTime = this.clock;
        this.clock++;
        this.updatePopulation();

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
            if ((this.entities[e].type === 2 && this.entities[e].age > 2500 ) || this.entities[e].age > 5000 || this.entities[e].cleanUp === true) {
                this.deleteEntity(this.entities[e]);
            }
        }

        // If we have less then the number of items allowed throw a random one in
        if (this.entities.length < this.numItems && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
            for (let ni = 0; ni < (this.numItems - this.entities.length); ni++) {
                this.addEntity();
            }
        }

        this.updatePopulation();
        this.draw();
    };

    /**
     * Graph the agent rewards
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
    };

    /**
     * Initialize the Flot class
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
