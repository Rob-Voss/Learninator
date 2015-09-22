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
        this.useFlot = true;
        this.useGraph = false;
        this.useGrid = false;
        this.useQuad = true;
        this.cheats = {
            population: true,
            walls: false
        };

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
            cheats: {
                gridLocation: false,
                position: false,
                name: true
            }
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
            cheats: {
                gridLocation: false,
                position: false,
                name: false
            }
        };

        this.walls = [
            new Wall(new Vec(0, 0), new Vec(0 + this.canvas.width, 0)),
            new Wall(new Vec(0 + this.canvas.width, 0), new Vec(0 + this.canvas.width, 0 + this.canvas.height)),
            new Wall(new Vec(0 + this.canvas.width, 0 + this.canvas.height), new Vec(0, 0 + this.canvas.height)),
            new Wall(new Vec(0, 0 + this.canvas.height), new Vec(0, 0))
        ];

        World.call(this, this, this.entityOpts);

        this.addAgents();
        this.addEntities();

        return this;
    };

    WaterWorldEX.prototype = Object.create(World.prototype);
    WaterWorldEX.prototype.constructor = World;

    WaterWorldEX.prototype.env = function () {
        /**
         * Set up the puck world and the actions avail
         */
        this.reset = function () {
            // Puck x,y,z,vx,vy,vz
            this.puck = {};
            this.target = {};
            this.enemy = {};
            this.puck.position = new Vec(Math.random(), Math.random(), 0, Math.random() * 0.05 - 0.025, Math.random() * 0.05 - 0.025);
            this.target.position = new Vec(Math.random(), Math.random()); // target
            this.enemy.position = new Vec(Math.random(), Math.random()); // enemy
            this.radius = 0.05;
            this.t = 0;

            this.BADRAD = 0.25;
            this.tick();
        };

        /**
         * Return the number of states
         *
         * @returns {Number}
         */
        this.getNumStates = function () {
            return 8; // x,y,vx,vy, puck dx,dy
        };

        /**
         * Return the number of actions
         *
         * @returns {Number}
         */
        this.getMaxNumActions = function () {
            return 5; // left, right, up, down, nothing
        };

        this.getState = function () {
            var s = [
                this.puck.position.x - 0.5,
                this.puck.position.y - 0.5,
                this.puck.position.vx * 10,
                this.puck.position.vy * 10,
                this.target.position.x - this.puck.position.x,
                this.target.position.y - this.puck.position.y,
                this.enemy.position.x - this.puck.position.x,
                this.enemy.position.y - this.puck.position.y
            ];
            return s;
        };

        /**
         */
        this.sampleNextState = function () {
            // world dynamics
            this.puck.position.x += this.puck.position.vx; // newton
            this.puck.position.y += this.puck.position.vy;
            this.puck.position.vx *= 0.95; // damping
            this.puck.position.vy *= 0.95;

            // agent action influences puck velocity
            var accel = 0.002;
            switch (this.action) {
                case 0:
                    this.puck.position.vx -= accel;
                    break;
                case 1:
                    this.puck.position.vx += accel;
                    break;
                case 2:
                    this.puck.position.vy -= accel;
                    break;
                case 3:
                    this.puck.position.vy += accel;
                    break;
            }

            // handle boundary conditions and bounce
            if (this.puck.position.x < this.radius) {
                this.puck.position.vx *= -0.5; // bounce!
                this.puck.position.x = this.radius;
            }
            if (this.puck.position.x > 1 - this.radius) {
                this.puck.position.vx *= -0.5;
                this.puck.position.x = 1 - this.radius;
            }
            if (this.puck.position.y < this.radius) {
                this.puck.position.vy *= -0.5; // bounce!
                this.puck.position.y = this.radius;
            }
            if (this.puck.position.y > 1 - this.radius) {
                this.puck.position.vy *= -0.5;
                this.puck.position.y = 1 - this.radius;
            }

            this.t += 1;
            if (this.t % 73 === 0) {
                this.enemy.position.x = Math.random(); // reset the target location
                this.enemy.position.y = Math.random();
            }

            // compute distances
            var dx1 = this.puck.position.x - this.target.position.x, // Distance from gewdness
                dy1 = this.puck.position.y - this.target.position.y, // Distance from gewdness
                d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1),
                dx2 = this.puck.position.x - this.enemy.position.x, // Distance from badness
                dy2 = this.puck.position.y - this.enemy.position.y, // Distance from badness
                d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2),
                dxnorm = dx2 / d2,
                dynorm = dy2 / d2,
                speed = 0.001;
            this.enemy.position.x += speed * dxnorm;
            this.enemy.position.y += speed * dynorm;

            // compute reward
            // want to go close to green
            var r = -d1;
            if (d2 < this.BADRAD) {
                // but if we're too close to red that's bad
                r += 2 * (d2 - this.BADRAD) / this.BADRAD;
            }

            // give bonus for gliding with no force
            if (this.action === 4) {
                r += 0.05;
            }

            // evolve state in time
            var ns = this.getState(),
                out = {
                    ns: ns,
                    r: r
                };

            return out;
        };
    };

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
        // draw smart entities
        for (let i = 0, n = this.entities.length; i < n; i++) {
            this.entities[i].draw();

            // draw agents sight
            if (typeof this.entities[i].eyes !== 'undefined') {
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
