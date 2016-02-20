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
            var region, collisionObj, self = this;
            target.collisions = [];

            /**
             * Collision check
             * @param {Entity} entity
             */
            function checkIt(entity) {
                if (entity === target) {
                    return false;
                }
                if (entity.radius !== undefined && target.radius !== undefined) {
                    // If both entities have a radius use the circle collision check
                    collisionObj = self.circleCircleCollide(entity, target);
                } else if (entity.radius === undefined && target.radius !== undefined) {
                    // Is it an entity versus a wall?
                    collisionObj = self.circleLineCollide(entity, target.pos, target.radius);
                } else if (entity.radius !== undefined && target.radius === undefined) {
                    // Is it an entity versus a wall?
                    collisionObj = self.circleLineCollide(target, entity.pos, entity.radius);
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
                if (region) {
                    console.log(region);
                }
                break;
            case 'grid':
                let cell = this.grid.getGridLocation(target);
                if (cell) {
                    for (let [id, ent] of cell.population.entries()) {
                        checkIt(ent);
                    }
                }
                break;
            case 'brute':
                for (let [id, ent] of this.population.entries()) {
                    checkIt(ent);
                }
                break;
            }
            if (target.collisions.length > 0) {
                return true;
            }
        };

        /**
         * Check for collision of circular entities, and calculate collision point
         * as well as velocity changes that should occur to them
         * @param {Entity} entity
         * @param {Entity} target
         * @returns {{vecI: Vec, distance: number, target: {vx: number, vy: number}, entity: {vx: number, vy: number}}}
         */
        this.circleCircleCollide = function (entity, target) {
            let collisionObj,
                collPtX = ((entity.pos.x * target.radius) + (target.pos.x * entity.radius)) / (entity.radius + target.radius),
                collPtY = ((entity.pos.y * target.radius) + (target.pos.y * entity.radius)) / (entity.radius + target.radius),
                xDist = target.pos.x - entity.pos.x,
                yDist = target.pos.y - entity.pos.y,
                distFrom = target.pos.distanceTo(entity.pos),
                radiusDist = target.radius + entity.radius,
                distSquared = xDist * xDist + yDist * yDist;

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
                        vecI = new Vec(collPtX, collPtY);
                        collisionObj = {
                            vecI: vecI,
                            distance: target.pos.distanceTo(vecI),
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
            }
        };

        /**
         * Find the position of intersect between a line and a point with a radius
         * @param {Vec} v1 From position
         * @param {Vec} v2 To position
         * @param {Vec} circle Target position
         * @param {number} radius Target radius
         * @returns {{vecI: Vec, [vecIs: Array,] distance: number}}
         */
        this.circleLineCollide = function (line, circle, radius) {
            let collisionObj,
                lp1 = line.v1.sub(circle),
                lp2 = line.v2.sub(circle),
                lp2MinusLp1 = lp2.sub(lp1),
                a = lp2MinusLp1.lengthSq(),
                b = 2 * lp2MinusLp1.dot(lp1),
                c = lp1.lengthSq() - (radius * radius),
                delta = b * b - (4 * a * c);

            if (delta < 0) {
                // No hit
            } else if (delta === 0) {
                // Edge of circle hit single point
                let u = -b / (2 * a),
                    vecI = new Vec(line.v1.x + (u * lp2MinusLp1.x), line.v1.y + (u * lp2MinusLp1.y));
                collisionObj = {
                    vecI: vecI,
                    distance: circle.distanceTo(vecI)
                };
            } else if (delta > 0) {
                // Circle breached the line at two points!
                let delta2 = Math.sqrt(delta),
                    u1 = (-b + delta2) / (2 * a),
                    u2 = (-b - delta2) / (2 * a),
                    vecI1 = new Vec(line.v1.x + (u1 * lp2MinusLp1.x), line.v1.y + (u1 * lp2MinusLp1.y)),
                    vecI2 = new Vec(line.v1.x + (u2 * lp2MinusLp1.x), line.v1.y + (u2 * lp2MinusLp1.y)),
                    vecI = vecI1.getPointBetween(vecI2, 50);
                collisionObj = {
                    vecI: vecI,
                    vecIs: [vecI1, vecI2],
                    distance: circle.distanceTo(vecI)
                };
            }

            return collisionObj;
        };

        /**
         * Line intersection helper function: line segment (v1,v2) intersect segment (v3,v4)
         * @param {Vec} pathV1 From position
         * @param {Vec} pathV2 To position
         * @param {Vec} lineV1 Wall or Line start
         * @param {Vec} lineV2 Wall or Line end
         * @returns {{vecI: Vec, vecX: number, distance: number}}
         */
        this.lineLineIntersect = function (pathV1, pathV2, lineV1, lineV2) {
            let l = pathV2.sub(pathV1),
                ls = pathV1.sub(lineV1),
                es = lineV2.sub(lineV1),
                denom = es.y * l.x - es.x * l.y,
                collisionObj;

            if (denom === 0.0) {
                // They be parallel lines if it be this yar!
                return false;
            }

            let pX = es.crossProd(ls) / denom,
                pY = l.crossProd(ls) / denom,
                vecI = new Vec(pathV1.x + pX * l.x, pathV1.y + pX * l.y);

            if (pX > 0.0 && pX < 1.0 && pY > 0.0 && pY < 1.0) {
                // Intersection point
                collisionObj = {
                    vecI: vecI,
                    vecX: pX,
                    distance: pathV2.distanceTo(vecI)
                };

                return collisionObj;
            }
        };

        /**
         * Find the position of intersect between a line and a point
         * @param {Vec} v1 From position
         * @param {Vec} v2 To position
         * @param {Vec} v0 Target position
         * @param {Number} rad Target radius
         * @returns {{vecI: Vec, vecX: number, distance: number}}
         */
        this.linePointIntersect = function (v1, v2, v0, rad) {
            // Create a perpendicular vector
            var x = v2.y - v1.y,
                y = v2.x - v1.x,
                xDiff = v1.y - v0.y,
                yDiff = v1.x - v0.x,
                v = new Vec(x, -y),
                d = Math.abs(y * xDiff - yDiff * x),
                collisionObj;

            d = d / v.length();
            if (d > rad) {
                return collisionObj;
            }

            v.normalize();
            v.scale(d);

            let vecI = v0.add(v),
                vecX = (Math.abs(y) > Math.abs(x)) ? (vecI.x - v1.x) / (y) : (vecI.y - v1.y) / (x);

            if (vecX > 0.0 && vecX < 1.0) {
                collisionObj = {
                    vecI: vecI,
                    vecX: vecX,
                    distance: v0.distanceTo(vecI)
                };

                return collisionObj;
            }
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

            return circle.pos.sub(point).lengthSq() <= circle.radius * circle.radius;
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
        this.sightCheck = function (v1, v2, walls, entities, radius) {
            var minRes = false,
                wResult, iResult,
                rad = radius || 0;

            // Collide with walls
            if (walls) {
                for (var i = 0, wl = walls.length; i < wl; i++) {
                    var wall = walls[i],
                        wResult = this.lineLineIntersect(v1, v2, wall.v1, wall.v2, rad);
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
                for (let [id, entity] of entities.entries()) {
                    if (entity.type !== 0) {
                        var iResult = this.linePointIntersect(v1, v2, entity.pos, entity.radius);
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
            rect.lineStyle(0.2, 0xFF0000);
            rect.drawRect(aNode.x, aNode.y, aNode.width, aNode.height);
            rect.endFill();

            if (aNode.items !== undefined) {
                let txtOpts = {font: "10px Arial", fill: "#000000", align: "center"},
                    popText = new PIXI.Text(aNode.items.length, txtOpts);
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
                this.grid.cells.forEach((cell) => {
                    let txtOpts = {font: "10px Arial", fill: "#000000", align: "center"},
                        popText = new PIXI.Text('(' + cell.x + ',' + cell.y + ',' + cell.z + ') ' + cell.population.size, txtOpts);
                    popText.position.set(cell.corners[0].x + cell.width / 2, cell.corners[0].y + cell.height / 2);
                    this.collisionOverlay.addChild(popText);
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
            this.grid.cells.forEach((cell) => {
                cell.population = new Map();
                //cell.walls.forEach(wall => cell.population.set(wall.id, wall));
            });

            for (let [id, entity] of this.population.entries()) {
                let cell = this.grid.getGridLocation(entity);
                if (cell) {
                    entity.gridLocation = cell;
                    if (!cell.population.has(entity.id)) {
                        cell.population.set(entity.id, entity);
                    }
                }
            }

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
            // Draw the grid
            if (this.cheats.brute) {
                // Clear the collision detection holder
                if (this.collisionOverlay !== undefined) {
                    this.stage.removeChild(this.collisionOverlay);
                }
                this.collisionOverlay = new PIXI.Container();

                let txtOpts = {font: "10px Arial", fill: "#000000", align: "center"},
                    popText = new PIXI.Text(this.population.size, txtOpts);
                popText.position.set(this.width / 2, this.height / 2);
                this.collisionOverlay.addChild(popText);

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
         * Update the population
         */
        this.updatePopulation = function () {

        };
    };
    global.BruteCD = BruteCD;

    class AABB {
        /**
         * Borrowed/Modified from matter.js
         * Creates a new axis-aligned bounding box for the given vertices.
         * @constructor
         *
         * @param {Point} min
         * @param {Point} max
         * @param {Array} vertices
         * @returns {AABB} A new AABB object
         */
        constructor(min = new Point(0, 0), max = new Point(0, 0), vertices) {
            this.min = min;
            this.max = max;
            if (vertices) {
                this.update(bounds, vertices);
            }

            return this;
        }

        /**
         * Updates AABB using the given vertices and extends the AABB given a velocity.
         * @method update
         *
         * @param {Array} vecs
         */
        update(vecs) {
            this.min.x = Number.MAX_VALUE;
            this.max.x = Number.MIN_VALUE;
            this.min.y = Number.MAX_VALUE;
            this.max.y = Number.MIN_VALUE;

            vecs.forEach((vec) => {
                if (vec.x > this.max.x) {
                    this.max.x = vec.x;
                } else if (vec.x < this.min.x) {
                    this.min.x = vec.x;
                }

                if (vec.y > this.max.y) {
                    this.max.y = vec.y;
                } else if (vec.y < this.min.y) {
                    this.min.y = vec.y;
                }

                // Velocity
                if (vec.vx > 0) {
                    this.max.x += vec.vx;
                } else {
                    this.min.x += vec.vx;
                }

                if (vec.vy > 0) {
                    this.max.y += vec.vy;
                } else {
                    this.min.y += vec.vy;
                }
            });

            return this;
        }

        /**
         * Returns true if the AABB contains the given point.
         * @method contains
         *
         * @param {Vec} vec
         * @return {boolean} True if the bounds contain the point, otherwise false
         */
        contains(vec) {
            return vec.x >= this.min.x && vec.x <= this.max.x
                && vec.y >= this.min.y && vec.y <= this.max.y;
        }

        /**
         * Returns true if the two AABB intersect.
         * @method overlaps
         *
         * @param {AABB} bounds
         * @return {boolean} True if the bounds overlap, otherwise false
         */
        overlaps(bounds) {
            return (bounds.min.x <= this.max.x && bounds.max.x >= this.min.x
            && bounds.max.y >= this.min.y && bounds.min.y <= this.max.y);
        }

        /**
         * Translates the bounds by the given vector.
         * @method translate
         *
         * @param {Vec} vec
         */
        translate(vec) {
            this.min.x += vec.x;
            this.max.x += vec.x;
            this.min.y += vec.y;
            this.max.y += vec.y;
        }

        /**
         * Shifts the bounds to the given position.
         * @method shift
         *
         * @param {Vec} vec
         */
        shift(vec) {
            var deltaX = this.max.x - this.min.x,
                deltaY = this.max.y - this.min.y;

            this.min.x = vec.x;
            this.max.x = vec.x + deltaX;
            this.min.y = vec.y;
            this.max.y = vec.y + deltaY;
        }
    }

    global.AABB = AABB;

}(this));
