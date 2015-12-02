var World = World || {},
    Wall = Wall || {};

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
        var _this = this,
            rendererOptions = {
                antialiasing: false,
                transparent: false,
                resolution: window.devicePixelRatio,
                autoResize: true
            };

        this.width = this.width || Utility.getOpt(worldOpts, 'width', 600);
        this.height = this.height || Utility.getOpt(worldOpts, 'height', 600);
        this.resizable = this.resizable || Utility.getOpt(worldOpts, 'resizable', false);

        this.clock = 0;
        this.pause = false;

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

        function resize() {
            // Determine which screen dimension is most constrained
            var ratio = Math.min(window.innerWidth / _this.width, window.innerHeight / _this.height);
            // Scale the view appropriately to fill that dimension
            _this.stage.scale.x = _this.stage.scale.y = ratio;
            // Update the renderer dimensions
            _this.renderer.resize(Math.ceil(_this.width * ratio), Math.ceil(_this.height * ratio));
        }

        // Create the canvas in which the game will show, and a
        // generic container for all the graphical objects
        this.renderer = PIXI.autoDetectRenderer(this.width, this.height, rendererOptions);
        this.renderer.backgroundColor = 0xFFFFFF;
        // Round the pixels
        //this.renderer.roundPixels = true;

        // Put the renderer on screen in the corner
        this.renderer.view.style.position = "absolute";
        this.renderer.view.style.top = "0px";
        this.renderer.view.style.left = "0px";

        // The stage is essentially a display list of all game objects
        // for Pixi to render; it's used in resize(), so it must exist
        this.stage = new PIXI.Container();

        // Actually place the renderer onto the page for display
        document.body.querySelector('.game-container').appendChild(this.renderer.view);

        if (this.resizable) {
            // Listen for and adapt to changes to the screen size, e.g.,
            // user changing the window or rotating their device
            window.addEventListener("resize", resize);

            // Size the renderer to fill the screen
            resize();
        }

        this.setCollisionDetection(this.collision);
        this.populate(worldOpts);
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
     * Set up the population
     * @param {Object} worldOpts
     * @returns {World}
     */
    World.prototype.populate = function (worldOpts) {
        // Walls
        this.wallContainer = new PIXI.Container();
        this.walls = this.walls || Utility.getOpt(worldOpts, 'walls', [
            new Wall(new Vec(0, 0), new Vec(0 + this.width, 0), this.cheats.walls),
            new Wall(new Vec(0 + this.width, 0), new Vec(0 + this.width, 0 + this.height), this.cheats.walls),
            new Wall(new Vec(0 + this.width, 0 + this.height), new Vec(0, 0 + this.height), this.cheats.walls),
            new Wall(new Vec(0, 0 + this.height), new Vec(0, 0), this.cheats.walls)
        ]);
        this.addWalls();
        this.stage.addChild(this.wallContainer);

        // Add the entities
        this.entityContainer = new PIXI.Container();
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
        this.addEntities();
        this.stage.addChild(this.entityContainer);

        // Population of Agents that are considered 'smart' entities for the environment
        this.entityAgentContainer = new PIXI.Container();
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
        this.addEntityAgents();
        this.stage.addChild(this.entityAgentContainer);

        // Population of Agents for the environment
        this.agentContainer = new PIXI.Container();
        this.numAgents = this.numAgents || Utility.getOpt(worldOpts, 'numAgents', 0);
        this.agents = this.agents || Utility.getOpt(worldOpts, 'agents', []);
        this.addAgents();
        this.stage.addChild(this.agentContainer);

        return this;
    };

    /**
     * Add the Agents
     * @returns {World}
     */
    World.prototype.addAgents = function () {
        // Add the agents
        for (let a = 0; a < this.numAgents; a++) {
            this.agents[a].color = this.agents[a].hexStyles[this.agents[a].type];
            let agentContainer = new PIXI.Container();
            for (let ei = 0; ei < this.agents[a].eyes.length; ei++) {
                agentContainer.addChild(this.agents[a].eyes[ei].shape);
            }
            agentContainer.addChild(this.agents[a].shape || this.agents[a].sprite);
            this.agentContainer.addChild(agentContainer);
        }

        return this;
    };

    /**
     * Add some noms
     * @returns {World}
     */
    World.prototype.addEntityAgents = function () {
        for (let k = 0; k < this.numEntityAgents; k++) {
            let agentContainer = new PIXI.Container(),
                x = Utility.randi(5, this.width - 10),
                y = Utility.randi(5, this.height - 10),
                vx = Math.random() * 5 - 2.5,
                vy = Math.random() * 5 - 2.5,
                position = new Vec(x, y, 0, vx, vy),
                entity = new EntityRLDQN(position, this.entityAgentOpts);
            entity.enemy = this.agents[k];
            entity.target = (k === 0) ? this.agents[k + 1] : this.agents[k - 1];
            for (let ei = 0; ei < entity.eyes.length; ei++) {
                agentContainer.addChild(entity.eyes[ei].shape);
            }
            agentContainer.addChild(entity.shape || entity.sprite);
            this.entityAgentContainer.addChild(agentContainer);
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
            this.tree.insert(entity);
            this.entities.push(entity);
            this.entityContainer.addChild(entity.shape || entity.sprite);
        }

        return this;
    };

    /**
     * Add the Walls
     * @returns {World}
     */
    World.prototype.addWalls = function () {
        // Add the walls to the world
        for (let w = 0; w < this.walls.length; w++) {
            this.wallContainer.addChild(this.walls[w].shape);
        }

        return this;
    };

    /**
     * Remove the entity from the world
     * @param {Object} entity
     * @returns {World}
     */
    World.prototype.deleteEntity = function (entity) {
        this.entities.splice(this.entities.findIndex(Utility.getId, entity.id), 1);
        let entityIdx = this.entityContainer.getChildIndex(entity.shape || entity.sprite);
        this.entityContainer.removeChildAt(entityIdx);

        return this;
    };

    /**
     * Draws the world
     * @returns {World}
     */
    World.prototype.draw = function () {
        // draw items
        for (let e = 0, ni = this.entities.length; e < ni; e++) {
            this.entities[e].draw();
        }

        // draw agents
        for (let a = 0, na = this.agents.length; a < na; a++) {
            // draw agents body
            this.agents[a].draw();
        }

        // draw entity agents
        for (let a = 0, na = this.entityAgents.length; a < na; a++) {
            // draw agents body
            this.entityAgents[a].draw();
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

        // Loop through entity agents
        for (let a = 0, na = this.entityAgents.length; a < na; a++) {
            // draw agents body
            this.entityAgents[a].tick(this);
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
            if (this.display !== undefined) {
                this.display.updateItem(a, '[' + agent.id.substring(0, 4) + '] Avg: ' + agent.avgReward + ' Epsi: ' + agent.epsilon);
            }
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
        // flot reward graph stuff
        this.nflot = 1000;
        this.smoothRewardHistory = [];
        this.smoothReward = [];
        this.flott = [];

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

    global.World = World;

}(this));
