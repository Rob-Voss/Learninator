(function (global) {
    "use strict";

    /**
     * Collision detection options
     * @typedef {Object} cdOpts
     * @property {String} type - The collision type 'quad','grid','brute'
     * @property {number} maxChildren - The max number of children: 'quad' only
     * @property {number} maxDepth - The max depth of the nodes: 'quad' only
     */

    /**
     * Collision Detector wrapper
     * @name CollisionDetector
     * @constructor
     *
     * @param {cdOpts} opts
     */
    var CollisionDetector = function (opts) {
        this.cdType = opts.type;
        if (this.cdType === 'grid') {
            GridCD.apply(this);
        } else if (this.cdType === 'quad') {
            QuadCD.apply(this);
        } else if (this.cdType === 'brute') {
            BruteCD.apply(this);
        }

        /**
         * Set up the CD function
         * @param {Entity} target
         */
        this.check = function (target) {
            var region,
                collisionObj = false,
                self = this;
            target.collisions = [];

            /**
             * Collision check
             * @param {Entity} entity
             */
            function checkIt(entity) {
                if (entity === target) { return false; }
                if (entity.radius !== undefined && target.radius !== undefined) {
                    // If both entities have a radius use the circle collision check
                    collisionObj = self.circleCircleCollide(entity, target);
                } else {
                    // Is it an entity versus a wall?
                    collisionObj = self.circleLineCollide(entity, target.pos, target.radius);
                }
                if (collisionObj) {
                    collisionObj.id = entity.id;
                    collisionObj.type = entity.type;
                    target.collisions.push(collisionObj);
                }
            }

            switch (this.cdType) {
                case 'quad':
                    region = this.tree.retrieve(target, checkIt);
                    break;
                case 'grid':
                    if (target.gridLocation.population) {
                        // Loop through all the entities in the current cell and check distances
                        target.gridLocation.population.some(function (ent) {
                            checkIt(ent);
                        });
                    }
                    break;
                case 'brute':
                    let tmpAll = this.walls.concat(this.agents, this.entities, this.entityAgents);
                    tmpAll.some(function (ent) {
                        checkIt(ent);
                    });
                    break;
            }

            return collisionObj;
        };

        /**
         * Check for collision of circular entities, and calculate collision point
         * as well as velocity changes that should occur to them
         * @param {Entity} entity
         * @param {Entity} target
         * @returns {{collPtX: number, collPtY: number, distSquared: number, distFrom: (*|Number), target: {vx: *, vy: *}, entity: {vx: number, vy: number}}}
         */
        this.circleCircleCollide = function (entity, target) {
            if (entity.radius !== undefined && target.radius !== undefined) {
                var collPtX = ((entity.pos.x * target.radius) + (target.pos.x * entity.radius)) / (entity.radius + target.radius),
                    collPtY = ((entity.pos.y * target.radius) + (target.pos.y * entity.radius)) / (entity.radius + target.radius),
                //d = target.pos.
                    xDist = target.pos.x - entity.pos.x,
                    yDist = target.pos.y - entity.pos.y,
                    distFrom = target.pos.distanceTo(entity.pos),
                    radiusDist = target.radius + entity.radius,
                    distSquared = xDist * xDist + yDist * yDist,
                    radiusSquared = (target.radius + entity.radius) * (target.radius + entity.radius);

                // Check the squared distances instead of the the distances,
                // same result, but avoids a square root.
                if (distFrom <= radiusDist) {
                    var xVelocity = entity.pos.vx - target.pos.vx,
                        yVelocity = entity.pos.vy - target.pos.vy,
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
                            collisionWeightB = 2 * target.radius / combinedMass,
                            collisionObj = {
                                collPtX: collPtX,
                                collPtY: collPtY,
                                distance: {
                                    distanceSquared: distSquared,
                                    radiusSquared: radiusSquared,
                                    distanceFrom: distFrom,
                                    radiusFrom: radiusDist
                                },
                                target: {
                                    vx: target.pos.vx + collisionWeightA * xCollision,
                                    vy: target.pos.vy + collisionWeightA * yCollision
                                },
                                entity: {
                                    vx: entity.pos.vx - collisionWeightB * xCollision,
                                    vy: entity.pos.vy - collisionWeightB * yCollision
                                }
                            };

                        return collisionObj;
                    }
                } else {
                    return;
                }
            } else {
                return;
            }
        };

        /**
         * Find the position of intersect between a line and a point with a radius
         * @param {Vec} v1 From position
         * @param {Vec} v2 To position
         * @param {Vec} circle Target position
         * @param {number} radius Target radius
         * @returns {Object|Boolean}
         */
        this.circleLineCollide = function (line, circle, radius) {
            let lp1 = line.v1.sub(circle),
                lp2 = line.v2.sub(circle),
                lp2MinusLp1 = lp2.sub(lp1),
                a = lp2MinusLp1.lengthSq(),
                b = 2 * lp2MinusLp1.dot(lp1),
                c = lp1.lengthSq() - (radius * radius),
                delta = b * b - (4 * a * c),
                result = false;

            if (delta < 0) {
                // No hit
            } else if (delta === 0) {
                // Edge of circle hit single point
                let u = -b / (2 * a);
                result = {};
                result.pX = u;
                result.pY = 0;
                result.vecI = new Vec(line.v1.x + (u * lp2MinusLp1.x), line.v1.y + (u * lp2MinusLp1.y));
                result.distance = circle.distanceTo(result.vecI);
            } else if (delta > 0) {
                // Circle breached the line at two points!
                let delta2 = Math.sqrt(delta),
                    u1 = (-b + delta2) / (2 * a),
                    u2 = (-b - delta2) / (2 * a),
                    vI1 = new Vec(line.v1.x + (u1 * lp2MinusLp1.x), line.v1.y + (u1 * lp2MinusLp1.y)),
                    vI2 = new Vec(line.v1.x + (u2 * lp2MinusLp1.x), line.v1.y + (u2 * lp2MinusLp1.y));
                result = {};
                result.pX = u1;
                result.pY = u2;
                result.vecIs = [vI1, vI2];
                result.vecI = vI1.getPointBetween(vI2, 50);
                result.distance = circle.distanceTo(result.vecI);
            }

            return result;
        };

        /**
         * Line intersection helper function: line segment (v1,v2) intersect segment (v3,v4)
         * @param {Vec} pathV1 From position
         * @param {Vec} pathV2 To position
         * @param {Vec} lineV1 Wall or Line start
         * @param {Vec} lineV2 Wall or Line end
         * @returns {Object|Boolean}
         */
        this.lineIntersect = function (pathV1, pathV2, lineV1, lineV2) {
            let l = pathV2.sub(pathV1),
                ls = pathV1.sub(lineV1),
                es = lineV2.sub(lineV1),
                denom = es.y * l.x - es.x * l.y;

            if (denom === 0.0) {
                // They be parallel lines if it be this yar!
                return false;
            }

            let pX = es.crossProd(ls) / denom,
                pY = l.crossProd(ls) / denom,
                vecI = new Vec(pathV1.x + pX * l.x, pathV1.y + pX * l.y);

            if (pX > 0.0 && pX < 1.0 && pY > 0.0 && pY < 1.0) {
                // Intersection point
                let result = {};
                result.distance = pathV2.distanceTo(vecI);
                result.angle = vecI.angleBetween(pathV2);
                result.radians = result.angle * Math.PI / 180;
                result.vecX = pX;
                result.vecY = pY;
                result.vecI = vecI;

                return result;
            }

            return false;
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
         * See if a circle touches a point
         * @param {Point} point
         * @param {Entity} circle
         * @returns {boolean}
         */
        this.pointCircleCollide = function (point, circle) {
            if (circle.radius === 0) {
                return false;
            }
            let collided = circle.pos.sub(point).lengthSq() <= circle.radius * circle.radius;

            return collided;
        };

        /**
         * A helper function to get check for colliding walls/items
         * @param {Vec} v1
         * @param {Vec} v2
         * @param {Array} walls
         * @param {Array} entities
         * @param {number} radius
         * @returns {boolean}
         */
        this.sightCheck = function (v1, v2, radius) {
            var minRes = false,
                rad = radius || 0;

            // Collide with items
            for (let [id, entity] of this.population.entries()) {
                if (entity.type !== 0) {
                    let iResult = this.circleLineCollide({v1: v1, v2: v2}, entity.pos, rad + entity.radius);
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
                } else {
                    let wResult = this.lineIntersect(v1, v2, entity.v1, entity.v2);
                    if (wResult) {
                        wResult.target = entity;
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

            return minRes;
        };
    };

    global.CollisionDetector = CollisionDetector;

    /**
     * QuadTree CD
     * @name QuadCD
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
         * Draw the regions from a node
         * @param {Node} aNode
         */
        this.drawRegions = function (aNode) {
            var nodes = aNode.getNodes(),
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

            if (aNode.items !== undefined) {
                let popText = new PIXI.Text(aNode.items.length, {font: "20px Arial", fill: "#006400", align: "center"});
                popText.position.set(aNode.x + aNode.width / 2, aNode.y + aNode.height / 2);
                rect.addChild(popText);
            }

            this.collisionOverlay.addChild(rect);
        };

        /**
         * Update the population
         */
        this.updatePopulation = function () {
            this.tree.clear();
            this.nodes = [];

            for (let [id, entity] of this.population.entries()) {
                this.nodes.push(entity);
            }

            this.tree.insert(this.nodes);

            if (this.cheats.quad) {
                if (this.collisionOverlay !== undefined) {
                    this.stage.removeChild(this.collisionOverlay);
                }
                this.collisionOverlay = new PIXI.Container();

                this.drawRegions(this.tree.root);
                this.stage.addChild(this.collisionOverlay);
            } else {
                if (this.collisionOverlay !== undefined) {
                    this.stage.removeChild(this.collisionOverlay);
                    this.collisionOverlay = new PIXI.Container();
                }
            }
        };
    };

    global.QuadCD = QuadCD;

    /**
     * Grid CD
     * @name GridCD
     * @constructor
     */
    var GridCD = function () {
        this.path = this.grid.path;
        this.cellWidth = this.grid.cellWidth;
        this.cellHeight = this.grid.cellHeight;

        /**
         * Draw the regions of the grid
         */
        this.drawRegions = function () {
            // Draw the grid
            if (this.cheats.grid) {
                // Clear the collision detection holder
                if (this.collisionOverlay !== undefined) {
                    this.stage.removeChild(this.collisionOverlay);
                }
                this.collisionOverlay = new PIXI.Container();

                // If we are using grid based collision set up an overlay
                this.grid.cells.forEach((row) => {
                    if (!Array.isArray(row)) {
                        let txtOpts = {font: "10px Arial", fill: "#00FF00", align: "center"},
                            popText = new PIXI.Text(row.population.length, txtOpts);
                        popText.position.set(row.corners[0].x + row.width / 2, row.corners[0].y + row.height / 2);
                        this.collisionOverlay.addChild(popText);
                    } else {
                        row.forEach(function (cell) {
                            let txtOpts = {font: "10px Arial", fill: "#00FF00", align: "center"},
                                popText = new PIXI.Text(cell.population.length, txtOpts);
                            popText.position.set(cell.corners[0].x + cell.width / 2, cell.corners[0].y + cell.height / 2);
                            this.collisionOverlay.addChild(popText);
                        });
                    }
                });

                this.stage.addChild(this.collisionOverlay);
            } else {
                // Clear the collision detection holder
                if (this.collisionOverlay !== undefined) {
                    this.stage.removeChild(this.collisionOverlay);
                    this.collisionOverlay = new PIXI.Container();
                }
            }
        };

        /**
         * Update populations counts and grids
         */
        this.updatePopulation = function () {
            // Reset the cell's population's
            this.grid.cells.forEach((row) => {
                if (!Array.isArray(row)) {
                    row.population = row.walls;
                } else {
                    row.forEach((cell) => cell.population = cell.walls);
                }
            });

            this.entities.forEach((entity) => {
                this.grid.getGridLocation(entity);
                if (entity.gridLocation.population !== undefined) {
                    let idx = entity.gridLocation.population.findIndex(Utility.getId, entity.id);
                    if (idx === -1) {
                        entity.gridLocation.population.push(entity);
                    }
                }
            });

            this.entityAgents.forEach((entityAgent) => {
                this.grid.getGridLocation(entityAgent);
                if (entityAgent.gridLocation.population !== undefined) {
                    let idx = entityAgent.gridLocation.population.findIndex(Utility.getId, entityAgent.id);
                    if (idx === -1) {
                        entityAgent.gridLocation.population.push(entityAgent);
                    }
                }
            });

            this.agents.forEach((agent) => {
                this.grid.getGridLocation(agent);
                if (agent.gridLocation.population !== undefined) {
                    let idx = agent.gridLocation.population.findIndex(Utility.getId, agent.id);
                    if (idx === -1) {
                        agent.gridLocation.population.push(agent);
                    }
                }
            });

            this.drawRegions();
        };
    };
    global.GridCD = GridCD;

    /**
     * Brute Force CD
     * @name BruteCD
     * @constructor
     */
    var BruteCD = function () {
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
    global.BruteCD = BruteCD;

}(this));
