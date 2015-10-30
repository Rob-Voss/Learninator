(function (global) {
    "use strict";

    /**
     * Make a World
     * @name World
     * @constructor
     *
     * @param {worldOpts} worldOpts
     * @returns {World}
     */
    function World(worldOpts) {
        var _this = this;
        this.canvas = this.canvas || document.getElementById('world');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // PIXI gewdness
        this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {view: this.canvas, transparent: true}, true);
        this.renderer.roundPixels = true;
        document.body.appendChild(this.renderer.view);
        this.stage = new PIXI.Container();

        //this.menuOpts = {
        //    render: {
        //        width: this.width,
        //        height: this.height
        //    },
        //    menu: {
        //        x: 0,
        //        y: 0,
        //        width: 120,
        //        height: 60
        //    }
        //};
        //this.menu = Utility.getOpt(worldOpts, 'menu', new Menu(this.menuOpts));
        //this.stage.addChild(this.menu);

        this.displayOpts = {
            title: 'Agent Scores',
            width: 120,
            height: 60,
            render: {
                width: this.width,
                height: this.height
            }
        };
        this.display = new Display(0, 0, this.displayOpts);
        this.stage.addChild(this.display);

        this.clock = 0;
        this.pause = false;

        // flot reward graph stuff
        this.nflot = 1000;
        this.smoothRewardHistory = [];
        this.smoothReward = [];
        this.flott = [];

        // The speed to run the simulation at
        this.simSpeed = this.simSpeed || Utility.getOpt(worldOpts, 'simSpeed', 1);

        // The collision detection type
        this.collision = this.collision || Utility.getOpt(worldOpts, 'collision', {
            type: 'quad',
            maxChildren: 1,
            maxDepth: 20
        });

        // The cheats to display
        this.cheats = this.cheats || Utility.getOpt(worldOpts, 'cheats', {
            quad: false,
            grid: false,
            walls: false
        });

        // Walls
        this.walls = this.walls || Utility.getOpt(worldOpts, 'walls', [
            new Wall(new Vec(0, 0), new Vec(0 + this.width, 0)),
            new Wall(new Vec(0 + this.width, 0), new Vec(0 + this.width, 0 + this.height)),
            new Wall(new Vec(0 + this.width, 0 + this.height), new Vec(0, 0 + this.height)),
            new Wall(new Vec(0, 0 + this.height), new Vec(0, 0))
        ]);

        // Population of Agents for the environment
        this.numAgents = this.numAgents || Utility.getOpt(worldOpts, 'numAgents', 0);
        this.agents = this.agents || Utility.getOpt(worldOpts, 'agents', []);

        // Population of Agents that are considered 'smart' entities for the environment
        this.numEntityAgents = this.numEntityAgents || Utility.getOpt(worldOpts, 'numEntityAgents', 0);
        this.entityAgents = this.entityAgents || Utility.getOpt(worldOpts, 'entityAgents', []);
        // Entity Agent options
        this.entityAgentOpts = this.entityAgentOpts || Utility.getOpt(worldOpts, 'entityAgentOpts', {
            radius: 10,
            collision: true,
            interactive: true,
            useSprite: false,
            movingEntities: false,
            cheats: {
                gridLocation: false,
                position: false,
                name: false,
                id: false
            }
        });

        this.numEntities = this.numEntities || Utility.getOpt(worldOpts, 'numEntities', 20);
        this.entities = this.entities || Utility.getOpt(worldOpts, 'entities', []);
        // Entity options
        this.entityOpts = this.entityOpts || Utility.getOpt(worldOpts, 'entityOpts', {
            radius: 10,
            collision: true,
            interactive: true,
            useSprite: false,
            movingEntities: false,
            cheats: {
                gridLocation: false,
                position: false,
                name: false,
                id: false
            }
        });

        this.setCollisionDetection(this.collision);

        this.addWalls();
        this.addAgents();
        this.addEntityAgents();
        this.addEntities();

        this.initFlot();

        function animate() {
            if (!_this.pause) {
                let ticker = 0;
                switch (parseFloat(_this.simSpeed)) {
                    case 1:
                        ticker = 1;
                        break;
                    case 2:
                        ticker = 30;
                        break;
                    case 3:
                        ticker = 60;
                        break;
                }
                for (let k = 0; k < ticker; k++) {
                    _this.tick();
                }
            }
            _this.renderer.render(_this.stage);
            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);

        return this;
    }

    /**
     * Add the Agents
     * @returns {World}
     */
    World.prototype.addAgents = function () {
        // Add the agents
        for (let a = 0; a < this.numAgents; a++) {
            let agentContainer = new PIXI.Container();
            for (let ei = 0; ei < this.agents[a].eyes.length; ei++) {
                agentContainer.addChild(this.agents[a].eyes[ei].shape);
            }
            agentContainer.addChild(this.agents[a].shape || this.agents[a].sprite);
            this.stage.addChild(agentContainer);

            this.agents[a].color = this.agents[a].hexStyles[this.agents[a].type];
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

            entity.enemy = this.agents[k];
            entity.target = (k === 0) ? this.agents[k + 1] : this.agents[k - 1];

            let agentContainer = new PIXI.Container();
            for (let ei = 0; ei < entity.eyes.length; ei++) {
                agentContainer.addChild(entity.eyes[ei].shape);
            }
            agentContainer.addChild(entity.shape || entity.sprite);
            this.stage.addChild(agentContainer);
            this.entityAgents.push(entity);
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
            number = this.numEntities - this.entities.length;
        }
        // Populating the world
        for (let k = 0; k < number; k++) {
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
        }

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
        let idx = this.stage.getChildIndex(entity.shape || entity.sprite);
        this.stage.removeChildAt(idx);

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
        }

        // draw agents
        for (let a = 0, na = this.agents.length; a < na; a++) {
            // draw agents body
            this.agents[a].draw();
        }

        this.graphRewards();

        return this;
    };

    /**
     * Set up the collision detection
     * @param {Object} collision
     * @returns {World}
     */
    World.prototype.setCollisionDetection = function (collision) {
        CollisionDetector.apply(this, [collision]);

        return this;
    };

    /**
     * Tick the environment
     * @returns {World}
     */
    World.prototype.tick = function () {
        this.updatePopulation();
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
        if (this.entities.length < this.numEntities) {
            this.addEntities();
        }

        // If we have less then the number of Agents allowed throw a random one in
        //if (this.agents.length < this.numAgents && this.clock % 10 === 0 && Utility.randf(0, 1) < 0.25) {
        //var missing = this.numAgents - this.agents.length;
        //for (let na = 0; na < missing; na++) {
        //    this.addAgent();
        //}
        //}

        this.updatePopulation();
        this.draw();

        return this;
    };

    /**
     * Graph the agent rewards
     * @returns {World}
     */
    World.prototype.graphRewards = function () {
        for (let a = 0, ac = this.agents.length; a < ac; a++) {
            let agent = this.agents[a],
                rew = agent.lastReward;
            this.display.updateItem(a, '[' + agent.id.substring(0, 5) + '] Avg: ' + agent.avgReward + ' Epsi: ' + agent.epsilon);

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

        return this;
    };

    /**
     * Initialize the Flot class
     * @returns {World}
     */
    World.prototype.initFlot = function () {
        var _this = this;
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
                label: this.agents[a].id.substring(0, 10)
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
                min: -0.1,
                max: 0.1
            }
        });

        setInterval(function () {
            for (let a = 0, ac = _this.agents.length; a < ac; a++) {
                _this.series[a].data = _this.getFlotRewards(a);
            }
            _this.plot.setData(_this.series);
            _this.plot.draw();
        }, 100);

        return this;
    };

    /**
     * zip rewards into flot data
     * @param {Number} a
     * @returns {Array}
     */
    World.prototype.getFlotRewards = function (a) {
        var res = [];
        if (this.smoothRewardHistory[a] === null) {
            this.smoothRewardHistory[a] = [];
        }

        for (let i = 0, hl = this.smoothRewardHistory[a].length; i < hl; i++) {
            res.push([i, this.smoothRewardHistory[a][i]]);
        }

        return res;
    };

    /**
     * Wall is made up of two Vectors
     * @name Wall
     * @constructor
     *
     * @param {Vec} v1
     * @param {Vec} v2
     * @returns {Wall}
     */
    function Wall(v1, v2) {
        this.type = 0;
        this.v1 = v1;
        this.v2 = v2;
        this.position = new Vec((v1.x + v2.x) / 2, (v1.y + v2.y) / 2);
        // Is it wider than it is high or visaversa
        var dist = v1.distFrom(v2);
        this.width = (v1.x < v2.x) ? dist : 2;
        this.height = (v1.y < v2.y) ? dist : 2;

        this.shape = new PIXI.Graphics();
        this.draw();

        return this;
    }

    /**
     * Draws it
     * @returns {Wall}
     */
    Wall.prototype.draw = function () {
        this.shape.clear();
        this.shape.lineStyle(1, 0x000000);
        this.shape.moveTo(this.v1.x, this.v1.y);
        this.shape.lineTo(this.v2.x, this.v2.y);
        this.shape.endFill();

        return this;
    };

    global.Wall = Wall;
    global.World = World;

}(this));
