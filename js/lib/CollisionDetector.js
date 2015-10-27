var CollisionDetector = CollisionDetector || {};

(function (global) {
    "use strict";

    /**
     * Collision Detector wrapper
     * @name CollisionDetector
     * @constructor
     */
    var CollisionDetector = function () {
        if (this.collision.type === 'grid') {
            GridCD.apply(this);
        } else if (this.collision.type === 'quad') {
            QuadCD.apply(this);
        } else if (this.collision.type === 'brute') {
            BruteCD.apply(this);
        }

        /**
         * Check for collision of circular entities, and calculate collsion point
         * as well as velocity changes that should occur to them
         * @param {Entity} entity
         * @param {Entity} target
         * @returns {{collPtX: number, collPtY: number, distSquared: number, distFrom: (*|Number), target: {vx: *, vy: *}, entity: {vx: number, vy: number}}}
         */
        this.circleCollision = function (entity, target) {
            if (entity.radius !== undefined && target.radius !== undefined) {
                var collPtX = ((entity.position.x * target.radius) + (target.position.x * entity.radius)) / (entity.radius + target.radius),
                    collPtY = ((entity.position.y * target.radius) + (target.position.y * entity.radius)) / (entity.radius + target.radius),
                    xDist = target.position.x - entity.position.x,
                    yDist = target.position.y - entity.position.y,
                    distFrom = target.position.distFrom(entity.position),
                    radiusDist = target.radius + entity.radius,
                    distSquared = xDist * xDist + yDist * yDist,
                    radiusSquared = (target.radius + entity.radius) * (target.radius + entity.radius);

                // Check the squared distances instead of the the distances,
                // same result, but avoids a square root.
                if (distFrom <= radiusDist) {
                    var xVelocity = entity.position.vx - target.position.vx,
                        yVelocity = entity.position.vy - target.position.vy,
                        dotProduct = xDist * xVelocity + yDist * yVelocity;
                    // Neat vector maths, used for checking if the objects are moving towards one another.
                    if (dotProduct > 0) {
                        var collisionScale = dotProduct / distSquared,
                            xCollision = xDist * collisionScale,
                            yCollision = yDist * collisionScale,
                        // The Collision vector is the speed difference projected on the Dist vector,
                        // thus it is the component of the speed difference needed for the collision.
                            combinedMass = (target.type === 5 ? target.radius * 2 : target.radius) + (entity.type === 5 ? entity.radius * 2 : entity.radius),
                            collisionWeightA = 2 * entity.radius / combinedMass,
                            collisionWeightB = 2 * target.radius / combinedMass;

                        return {
                            collPtX: collPtX,
                            collPtY: collPtY,
                            distance: {
                                distanceSquared: distSquared,
                                radiusSquared: radiusSquared,
                                distanceFrom: distFrom,
                                radiusFrom: radiusDist
                            },
                            target: {
                                type: target.type,
                                vx: target.position.vx + collisionWeightA * xCollision,
                                vy: target.position.vy + collisionWeightA * yCollision
                            },
                            entity: {
                                type: entity.type,
                                vx: entity.position.vx - collisionWeightB * xCollision,
                                vy: entity.position.vy - collisionWeightB * yCollision
                            }
                        };
                    }
                } else {
                    return;
                }
            }
        };

        /**
         * A helper function to get check for colliding walls/items
         * @param {Vec} v1
         * @param {Vec} v2
         * @param {Array} walls
         * @param {Array} entities
         * @param {Number} radius
         * @returns {Boolean}
         */
        this.sightCheck = function (v1, v2, walls, entities, radius) {
            var minRes = false,
                rad = radius ? radius : 0;

            // Collide with walls
            if (walls) {
                for (var i = 0, wl = walls.length; i < wl; i++) {
                    var wall = walls[i],
                        wResult = this.lineIntersect(v1, v2, wall.v1, wall.v2);
                    if (wResult) {
                        wResult.target = wall;
                        if (!minRes) {
                            minRes = wResult;
                        } else {
                            // Check if it's closer
                            if (wResult.vecX < minRes.vecX) {
                                // If yes, replace it
                                minRes = wResult;
                            }
                        }
                    }
                }
            }

            // Collide with items
            if (entities) {
                for (var e = 0, el = entities.length; e < el; e++) {
                    var entity = entities[e],
                        iResult = this.linePointIntersect(v1, v2, entity.position, entity.radius + rad);
                    if (iResult) {
                        iResult.target = entity;
                        if (!minRes) {
                            minRes = iResult;
                        } else {
                            if (iResult.vecX < minRes.vecX) {
                                minRes = iResult;
                            }
                        }
                    }
                }
            }
            return minRes;
        };

        /**
         * Find the position of intersect between a line and a point
         * @param {Vec} v1 From position
         * @param {Vec} v2 To position
         * @param {Vec} v0 Target position
         * @param {Number} rad Target radius
         * @returns {Object|Boolean}
         */
        this.linePointIntersect = function (v1, v2, v0, rad) {
            // Create a perpendicular vector
            var x = v2.y - v1.y,
                y = v2.x - v1.x,
                xDiff = v1.y - v0.y,
                yDiff = v1.x - v0.x,
                v = new Vec(x, -y),
                d = Math.abs(y * xDiff - yDiff * x),
                vecX = 0,
                result = {};

            d = d / v.length();
            if (d > rad) {
                return false;
            }

            v.normalize();
            v.scale(d);

            var vecI = v0.add(v);
            vecX = (Math.abs(y) > Math.abs(x)) ? (vecI.x - v1.x) / (y) : (vecI.y - v1.y) / (x);

            if (vecX > 0.0 && vecX < 1.0) {
                result.vecX = vecX;
                result.vecI = vecI;

                return result;
            }
            return false;
        };

        /**
         * Line intersection helper function: line segment (v1,v2) intersect segment (v3,v4)
         * @param {Vec} v1 From position
         * @param {Vec} v2 To position
         * @param {Vec} v3 Wall or Line start
         * @param {Vec} v4 Wall or Line end
         * @returns {Object|Boolean}
         */
        this.lineIntersect = function (v1, v2, v3, v4, rad) {
            var denom = (v4.y - v3.y) * (v2.x - v1.x) - (v4.x - v3.x) * (v2.y - v1.y),
                result = {};

            if (denom === 0.0) {
                // They be parallel lines if it be this yar!
                return false;
            }

            var pX = ((v4.x - v3.x) * (v1.y - v3.y) - (v4.y - v3.y) * (v1.x - v3.x)) / denom,
                pY = ((v2.x - v1.x) * (v1.y - v3.y) - (v2.y - v1.y) * (v1.x - v3.x)) / denom;

            if (pX > 0.0 && pX < 1.0 && pY > 0.0 && pY < 1.0) {
                // Intersection point
                var vecI = new Vec(v1.x + pX * (v2.x - v1.x), v1.y + pX * (v2.y - v1.y));

                result.distance = v2.distanceTo(vecI);
                result.vecX = pX;
                result.vecY = pY;
                result.vecI = vecI;

                return result;
            }

            return false;
        };

    };

    /**
     * QuadTree CD
     * @constructor
     */
    var QuadCD = function () {
        this.nodes = [];
        // init the quadtree
        var args = {
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
         */
        this.check = function (target) {
            var region, _this = this, collisionObj;
            target.collisions = [];

            /**
             * Collision check
             * @param entity
             */
            function checkIt(entity) {
                if (entity === target) {
                    return;
                }
                var edibleEntity = (entity.type === 2 || entity.type === 1),
                    edibleTarget = (target.type === 2 || target.type === 1);

                // If both entities have a radius
                if (entity.radius !== undefined && target.radius !== undefined) {
                    // Use the circle collision check
                    collisionObj = _this.circleCollision(entity, target);
                    if (collisionObj) {
                        // If there was a collision between an agent and an edible entity
                        if ((edibleTarget || entity.type === 5) && (edibleEntity || entity.type === 5)) {
                            // If there was a collision between edible entities
                            target.position.vx = collisionObj.target.vx;
                            target.position.vy = collisionObj.target.vy;
                            entity.position.vx = collisionObj.entity.vx;
                            entity.position.vy = collisionObj.entity.vy;
                        }
                        // If the entity doesn't already exist then add it
                        let idx = target.collisions.findIndex(Utility.getId, entity.id);
                        if (idx === -1) {
                            target.collisions.push(entity);
                        }
                    } else {
                        // Nada so return
                        return;
                    }
                    // Is it an entity versus a wall?
                } else if ((entity.width !== undefined && entity.height !== undefined) && target.radius !== undefined) {
                    collisionObj = this.lineIntersect(target.oldPos, target.position, entity.v1, entity.v2);
                    if (collisionObj) {
                        // Reset the position
                        target.position = target.oldPos.clone();
                        // If the entity doesn't already exist then add it
                        let idx = target.collisions.findIndex(Utility.getId, entity.id);
                        if (idx === -1) {
                            target.collisions.push(entity);
                        }
                        // If it's a consumable try and change the direction
                        if (target.type === 2 || target.type === 1) {
                            target.position.vx *= -1;
                            target.position.vy *= -1;
                            // If it's an Agent bounce it
                        } else if (target.type === 3 || target.type === 4) {
                            target.position.vx = 0;
                            target.position.vy = 0;
                        }
                    } else {
                        // Nada so return
                        return;
                    }
                }
            }

            region = this.tree.retrieve(target, checkIt);

            return collisionObj;
        };

        /**
         * Draw the regions from a node
         */
        this.drawRegions = function (aNode) {
            let nodes = aNode.getNodes(),
                rect = new PIXI.Graphics();
            if (nodes) {
                for (let i = 0; i < nodes.length; i++) {
                    this.drawRegions(nodes[i]);
                }
            }

            rect.clear();
            rect.lineStyle(0.2, 0x000000);
            rect.drawRect(aNode.x, aNode.y, aNode.width, aNode.height);
            rect.endFill();

            this.quadContainer.addChild(rect);
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

            if (this.cheats.quad) {
                this.stage.removeChild(this.quadContainer);
                this.quadContainer = new PIXI.Container();
                this.drawRegions(this.tree.root);
                this.stage.addChild(this.quadContainer);
            } else {
                if (this.quadContainer !== undefined) {
                    this.stage.removeChild(this.quadContainer);
                    this.quadContainer = new PIXI.Container();
                }
            }
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
        this.check = function (target, updatePos) {
            target.collisions = [];
            // Loop through all the entities in the current cell and check distances
            let cell = this.grid.getCellAt(target.gridLocation.x, target.gridLocation.y);
            for (let p = 0; p < cell.population.length; p++) {
                let entities = this.entities,
                    entity = entities.find(Utility.getId, cell.population[p]);
                if (entity) {
                    let dist = target.position.distanceTo(entity.position),
                        distFrom = target.position.distFrom(entity.position);
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
            } else {
                if (this.populationCounts !== undefined) {
                    this.stage.removeChild(this.populationCounts);
                    this.populationCounts = new PIXI.Container();
                }
            }

            // Draw the grid
            if (this.cheats.grid) {
                this.stage.removeChild(this.gridOverlay);
                this.gridOverlay = new PIXI.Container();

                // If we are using grid based collision set up an overlay
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
                this.stage.addChild(this.gridOverlay);
            } else {
                if (this.gridOverlay !== undefined) {
                    this.stage.removeChild(this.gridOverlay);
                    this.gridOverlay = new PIXI.Container();
                }
            }
        };

        /**
         * Update populations counts and grids
         */
        this.updatePopulation = function () {
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

            this.drawRegions(this.tree.root);
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
         */
        this.check = function (target) {
            let tmpEntities = this.agents.concat(this.entities);
            target.collisions = [];
            // Loop through all the entities in the world and check distances
            for (let j = 0; j < tmpEntities.length; j++) {
                let entity = tmpEntities[j];

                if (entity === target) {
                    continue;
                }
                let edibleEntity = (entity.type === 2 || entity.type === 1),
                    edibleTarget = (target.type === 2 || target.type === 1);
                // If both entities have a radius
                if (entity.radius !== undefined && target.radius !== undefined) {
                    // Use the circle collision check
                    var collisionObj = this.circleCollision(entity, target);
                    if (collisionObj) {
                        // If there was a collision between an agent and an edible entity
                        if ((edibleEntity && edibleTarget) ||
                            (edibleTarget && entity.type === 5) ||
                            (entity.type === 5 && target.type === 5) ||
                            (entity.type === 5 && (target.type === 3 || target.type === 4))) {
                            // If there was a collision between edible entities
                            target.position.vx = collisionObj.target.vx;
                            target.position.vy = collisionObj.target.vy;
                            entity.position.vx = collisionObj.entity.vx;
                            entity.position.vy = collisionObj.entity.vy;
                        }
                        // If the entity doesn't already exist then add it
                        let idx = target.collisions.findIndex(Utility.getId, entity.id);
                        if (idx === -1) {
                            target.collisions.push(entity);
                        }
                    } else {
                        // Nada so return
                        continue;
                    }
                    // Is it an entity versus a wall?
                } else if ((entity.width !== undefined && entity.height !== undefined) && target.radius !== undefined) {
                    var result = this.lineIntersect(target.oldPos, target.position, entity.v1, entity.v2);
                    if (result) {
                        // Reset the position
                        target.position = target.oldPos.clone();
                        // If it's a consumable try and change the direction
                        if (target.type === 2 || target.type === 1) {
                            target.position.vx *= -1;
                            target.position.vy *= -1;
                            // If it's an Agent bounce it
                        } else if (target.type === 3 || target.type === 4) {
                            target.position.vx = 0;
                            target.position.vy = 0;
                        }
                        // If the entity doesn't already exist then add it
                        let idx = target.collisions.findIndex(Utility.getId, entity.id);
                        if (idx === -1) {
                            target.collisions.push(entity);
                        }
                    } else {
                        // Nada so return
                        continue;
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

    global.CollisionDetector = CollisionDetector;

}(this));
