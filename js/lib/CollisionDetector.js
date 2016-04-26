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
            var region, self = this;
            target.collisions = [];

            /**
             * Collision check
             * @param {Entity} entity
             */
            function checkIt(entity) {
                let collisionObj = false;
                if (entity === target) {
                    return;
                }

                if (target.v1 !== undefined && entity.radius !== undefined) { // Eye and Entity
                    collisionObj = self.linePointIntersect(target.v1, target.v2, entity.position, entity.radius);
                } else if (target.v1 !== undefined && entity.v1 !== undefined) { // Eye and Wall
                    collisionObj = self.lineIntersect(target.v1, target.v2, entity.v1, entity.v2);
                } else if (target.radius !== undefined && entity.radius !== undefined) { // Entities
                    collisionObj = self.circleCircleCollide(entity, target);
                } else if (target.radius !== undefined && entity.v1 !== undefined) { // Wall
                    collisionObj = self.linePointIntersect(entity.v1, entity.v2, target.position, target.radius);
                }

                if (collisionObj) {
                    collisionObj.entity = entity;
                    if (target.v1 !== undefined) {
                        collisionObj.distance = target.v1.distanceTo(collisionObj.vecI);
                    }
                    if (target.radius !== undefined && entity.v1 !== undefined) {
                        collisionObj.vx = 0;
                        collisionObj.vy = 0;
                    } else {
                        collisionObj.vx = collisionObj.vecI.vx;
                        collisionObj.vy = collisionObj.vecI.vy;
                    }
                    target.collisions.push(collisionObj);
                }
            }

            switch (this.cdType) {
                case 'quad':
                    region = this.tree.retrieve(target, checkIt);
                    break;
                case 'grid':
                    if (target.gridLocation) {
                        for (let [id, ent] of target.gridLocation.population.entries()) {
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
                collPtX = ((entity.position.x * target.radius) + (target.position.x * entity.radius)) / (entity.radius + target.radius),
                collPtY = ((entity.position.y * target.radius) + (target.position.y * entity.radius)) / (entity.radius + target.radius),
                xDist = target.position.x - entity.position.x,
                yDist = target.position.y - entity.position.y,
                distFrom = target.position.distanceTo(entity.position),
                radiusDist = target.radius + entity.radius,
                distSquared = xDist * xDist + yDist * yDist;

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
                        collisionWeightB = 2 * target.radius / combinedMass,
                        vecI = new Vec(collPtX, collPtY);
                    collisionObj = {
                        vecI: vecI,
                        distance: target.position.distanceTo(vecI),
                        target: {
                            vx: target.position.vx + collisionWeightA * xCollision,
                            vy: target.position.vy + collisionWeightA * yCollision
                        },
                        entity: {
                            vx: entity.position.vx - collisionWeightB * xCollision,
                            vy: entity.position.vy - collisionWeightB * yCollision
                        }
                    };

                    return collisionObj;
                }
            }
        };

        /**
         * Line intersection helper function: line segment (v1,v2) intersect segment (v3,v4)
         * @param {Vec} pathV1 From position
         * @param {Vec} pathV2 To position
         * @param {Vec} lineV1 Wall or Line start
         * @param {Vec} lineV2 Wall or Line end
         * @returns {{vecI: Vec, vecX: number, distance: number}}
         */
        this.lineIntersect = function (pathV1, pathV2, lineV1, lineV2) {
            var denom = (lineV2.y - lineV1.y) * (pathV2.x - pathV1.x) - (lineV2.x - lineV1.x) * (pathV2.y - pathV1.y);
            if (denom === 0.0) {
                return false;
            } // parallel lines
            var ua = ((lineV2.x - lineV1.x) * (pathV1.y - lineV1.y) - (lineV2.y - lineV1.y) * (pathV1.x - lineV1.x)) / denom,
                ub = ((pathV2.x - pathV1.x) * (pathV1.y - lineV1.y) - (pathV2.y - pathV1.y) * (pathV1.x - lineV1.x)) / denom;
            if (ua > 0.0 && ua < 1.0 && ub > 0.0 && ub < 1.0) {
                var vecI = new Vec(pathV1.x + ua * (pathV2.x - pathV1.x), pathV1.y + ua * (pathV2.y - pathV1.y));
                return {
                    ua: ua,
                    ub: ub,
                    vecI: vecI
                };
            }
            return false;
        };

        /**
         * Find the position of intersect between a line and a point
         * @param {Vec} v1 From position
         * @param {Vec} v2 To position
         * @param {Vec} v0 Target position
         * @param {Number} rad Target radius
         * @returns {{vecI: Vec, vecX: number, distance: number}|boolean}
         */
        this.linePointIntersect = function (v1, v2, v0, rad) {
            var v = new Vec(v2.y - v1.y, -(v2.x - v1.x)), // perpendicular vector
                d = Math.abs((v2.x - v1.x) * (v1.y - v0.y) - (v1.x - v0.x) * (v2.y - v1.y));
            d = d / v.length();
            if (d >= rad) {
                return false;
            } else {
                v.normalize();
                v.scale(d);
                var vecX,
                    vecI = v0.add(v);
                if (Math.abs(v2.x - v1.x) > Math.abs(v2.y - v1.y)) {
                    vecX = (vecI.x - v1.x) / (v2.x - v1.x);
                } else {
                    vecX = (vecI.y - v1.y) / (v2.y - v1.y);
                }
                if (vecX > 0.0 && vecX < 1.0) {
                    return {
                        vecX: vecX,
                        vecI: vecI,
                        distance: v0.distanceTo(vecI)
                    };
                }
            }
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
            var nodes = aNode.getNodes();
            if (nodes) {
                for (let i = 0; i < nodes.length; i++) {
                    this.drawRegions(nodes[i]);
                }
            }

            let rect = new PIXI.Graphics();
            rect.clear();
            rect.lineStyle(0.5, 0xFF0000, 1);
            rect.drawRect(aNode.corners[0].x, aNode.corners[0].y, aNode.width, aNode.height);
            rect.endFill();

            if (aNode.items !== undefined) {
                let txtOpts = {font: "14px Arial", fill: "#00FF00", align: "center"},
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
                }
                this.collisionOverlay = new PIXI.Container();
                this.stage.addChild(this.collisionOverlay);
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
                    cell.shape.draw();
                    this.collisionOverlay.addChild(cell.shape.shape);
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
            });

            for (let [id, entity] of this.population.entries()) {
                let cell = this.grid.getGridLocation(entity);
                if (cell) {
                    entity.gridLocation = cell;
                    if (!entity.gridLocation.population.has(entity.id)) {
                        entity.gridLocation.population.set(entity.id, entity);
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
            this.drawRegions();
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
