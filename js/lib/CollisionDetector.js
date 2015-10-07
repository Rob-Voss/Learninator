(function (global) {
    "use strict";

    /**
     * QuadTree CD
     * @constructor
     */
    var QuadCD = function () {
        this.nodes = [];
        // init the quadtree
        let args = {
            x: 0,
            y: 0,
            height: this.height,
            width: this.width,
            maxChildren: this.maxChildren,
            maxDepth: this.maxDepth
        };
        this.tree = new QuadTree(args);
        this.tree.insert(this.nodes);

        /**
         * Set up the CD function
         * @param target
         * @param updatePos
         */
        this.collisionCheck = function (target, updatePos) {
            let n = this.nodes.length, region, entity;
            target.collisions = [];

            // clear the quadtree
            this.tree.clear();

            // fill the quadtree
            this.tree.insert(this.nodes);

            // iterate all elements
            for (let i = 0; i < n; i++) {
                entity = this.nodes[i];
                // get all elements in the same region as orb
                region = this.tree.retrieve(entity, function (target) {
                    if (entity.radius !== undefined && target.radius !== undefined) {
                        Utility.circleCollision(entity, target, updatePos);
                    } else {
                        if (entity.position.x + entity.width < target.position.x) {
                            return;
                        }
                        if (entity.position.x > target.position.x + target.width) {
                            return;
                        }
                        if (entity.position.y + entity.height < target.position.y) {
                            return;
                        }
                        if (entity.position.y > target.position.y + target.height) {
                            return;
                        }
                        target.collisions.push(entity);
                    }
                });
            }
        };

        /**
         *
         */
        this.drawRegions = function (aNode) {
            if (this.cheats.quad) {
                let nodes = aNode.getNodes(),
                    rect = new PIXI.Graphics();
                if (nodes) {
                    for (let i = 0; i < nodes.length; i++) {
                        draw(nodes[i]);
                    }
                }

                rect.clear();
                rect.lineStyle(0.2, 0x000000);
                rect.drawRect(aNode.x, aNode.y, aNode.width, aNode.height);
                rect.endFill();

                this.quadContainer.addChild(rect);
            }
        };

        /**
         * Update the population
         */
        this.updatePopulation = function () {
            this.tree.clear();
            this.nodes = [];

            //for (let wi = 0, ni = this.walls.length; wi < ni; wi++) {
            //    this.nodes.push(this.walls[wi]);
            //}

            for (let ii = 0, ni = this.entities.length; ii < ni; ii++) {
                this.nodes.push(this.entities[ii]);
            }

            for (let ai = 0, na = this.agents.length; ai < na; ai++) {
                this.nodes.push(this.agents[ai]);
            }

            this.tree.insert(this.nodes);

            this.stage.removeChild(this.quadContainer);
            this.quadContainer = new PIXI.Container();
            this.stage.addChild(this.quadContainer);

            this.drawRegions(this.tree.root);
        };
    };

    /**
     * Grid CD
     * @constructor
     */
    var GridCD = function () {
        this.path = this.grid.path;
        this.cellWidth = this.width / this.grid.xCount;
        this.cellHeight = this.height / this.grid.yCount;

        /**
         * Set up the CD function
         * @param target
         * @param updatePos
         */
        this.collisionCheck = function (target, updatePos) {
            target.collisions = [];
            // Loop through all the entities in the current cell and check distances
            let cell = this.grid.getCellAt(target.gridLocation.x, target.gridLocation.y);
            for (let p = 0; p < cell.population.length; p++) {
                let entities = this.entities,
                    entity = entities.find(Utility.getId, cell.population[p]);
                if (entity) {
                    let dist = target.position.distanceTo(entity.position);
                    if (dist < entity.radius + target.radius) {
                        target.collisions.push(entity);
                    }
                }
            }
        };

        /**
         *
         */
        this.drawRegions = function () {
            // If the cheats flag is on then update population
            if (this.cheats.population) {
                this.stage.removeChild(this.populationCounts);
                this.populationCounts = new PIXI.Container();

                // If we are using grid based collision/population tracking set it up
                for (let x = 0; x < this.grid.cells.length; x++) {
                    let xCell = this.grid.cells[x];
                    for (let y = 0; y < this.grid.cells[x].length; y++) {
                        // Draw population counts text
                        let yCell = xCell[y],
                            fontOpts = {font: "20px Arial", fill: "#006400", align: "center"},
                            coords = yCell.coords,
                            popText = new PIXI.Text(yCell.population.length, fontOpts);
                        popText.position.set(coords.bottom.left.x + (this.cellWidth / 2), coords.bottom.left.y - (this.cellHeight / 2));
                        this.populationCounts.addChild(popText);
                    }
                }

                this.stage.addChild(this.populationCounts);
                for (let px = 0; px < this.grid.cells.length; px++) {
                    for (let py = 0; py < this.grid.cells[px].length; py++) {
                        this.grid.cells[px][py].populationCounts.text = this.grid.cells[px][py].population.length;
                    }
                }
            }
            // Draw the grid
            if (this.cheats.grid) {
                for (let x = 0; x < this.grid.cells.length; x++) {
                    let xCell = this.grid.cells[x];
                    for (let y = 0; y < this.grid.cells[x].length; y++) {
                        // Draw population counts text
                        let yCell = xCell[y],
                            coords = yCell.coords,
                        // Draw the grid
                            grid = new PIXI.Graphics();
                        grid.lineStyle(0.09, 0x000000);
                        grid.moveTo(coords.bottom.left.x, coords.bottom.left.y);
                        grid.lineTo(coords.bottom.right.x, coords.bottom.right.y);
                        grid.moveTo(coords.bottom.right.x, coords.bottom.right.y);
                        grid.lineTo(coords.top.right.x, coords.top.right.y);
                        grid.endFill();

                        this.gridOverlay.addChild(grid);
                    }
                }
            }
        };

        /**
         * Update populations counts and grids
         */
        this.updatePopulation = function () {
            this.stage.removeChild(this.gridOverlay);
            this.gridOverlay = new PIXI.Container();

            // Reset the cell's population's
            for (let x = 0; x < this.grid.cells.length; x++) {
                for (let y = 0; y < this.grid.cells[x].length; y++) {
                    this.grid.cells[x][y].population = [];
                }
            }

            // Loop through the entities of the world and make them do work son!
            for (let e = 0; e < this.entities.length; e++) {
                this.grid.getGridLocation(this.entities[e]);
                this.entities[e].gridLocation.population.push(this.entities[e].id);
            }

            // Loop through the agents of the world and make them do work!
            for (let a = 0; a < this.agents.length; a++) {
                this.grid.getGridLocation(this.agents[a]);
                this.agents[a].gridLocation.population.push(this.agents[a].id);
            }

            this.stage.addChild(this.gridOverlay);

            this.draw();
        };
    };

    /**
     * Brute Force CD
     * @constructor
     */
    var BruteCD = function () {
        /**
         * Set up the CD function
         * @param target
         * @param updatePos
         */
        this.collisionCheck = function (target, updatePos) {
            // Loop through all the entities in the world and check distances
            for (let j = 0; j < this.entities.length; j++) {
                let dist = target.position.distFrom(this.entities[j].position);
                if (dist < this.entities[j].radius + target.radius) {
                    let result = Utility.collisionCheck(target.position, this.entities[j].position, this.walls, this.entities, target.radius);
                    if (!result) {
                        target.collisions.push(this.entities[j]);
                    }
                }
            }
        };

        /**
         *
         */
        this.drawRegions = function () {

        };

        /**
         * Update the population
         */
        this.updatePopulation = function () {

        };
    };

    global.QuadCD = QuadCD;
    global.GridCD = GridCD;
    global.BruteCD = BruteCD;

}(this));
