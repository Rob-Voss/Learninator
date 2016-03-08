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
                    return;
                }
                // If both entities have a radius
                if (entity.radius !== undefined && target.radius !== undefined) {
                    // Use the circle collision check
                    collisionObj = self.circleCircleCollide(entity, target);
                } else if (entity.v1 !== undefined && target.radius !== undefined) {
                    // Is it an entity versus a wall?
                    collisionObj = self.lineCircleCollide(entity, target);
                    // collisionObj = self.circleLineCollide(entity, target.pos, target.radius);
                    // collisionObj = self.lineIntersect(target.oldPos, target.pos, entity.v2, entity.v1, target.radius);
                    // collisionObj = self.linePointIntersect(entity.v1, entity.v2, target.pos, target.radius);
                }

                if (collisionObj) {
                    collisionObj.id = entity.id;
                    collisionObj.type = entity.type;
                    target.collisions.push(collisionObj);

                    return collisionObj;
                }
                // Nada so return
                return;
            }

            switch (this.cdType) {
            case 'quad':
                region = this.tree.retrieve(target, checkIt);
                if (region) {
                    console.log('Region:' + region);
                }
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
         * @param {Vec} v0 Target position
         * @param {number} radius Target radius
         * @returns {Object|Boolean}
         */
        this.circleLineCollide = function (line, v0, radius) {
            let lp1 = line.v1.sub(v0),
                lp2 = line.v2.sub(v0),
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
                result.distance = v0.distanceTo(result.vecI);
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
                result.vecI = vI1.pointBetween(vI2, 50);
                result.distance = v0.distanceTo(result.vecI);
            }

            return result;
        };

        /**
         * Check for a collison between a line and circle
         * @param {Wall} line
         * @param {Entity} circle
         * @param {Object} nearest
         * @returns {boolean}
         */
        this.lineCircleCollide = function (line, circle, nearest) {
            let tmp = {x: 0, y: 0},
                collisionObj = {x: 0, y: 0, vx: 0, vy: 0};
            //check to see if start or end points lie within circle
            if (this.pointCircleCollide(line.v1, circle)) {
                if (nearest) {
                    nearest.x = line.v1.x;
                    nearest.y = line.v1.y;
                }
                return true;
            }
            if (this.pointCircleCollide(line.v2, circle)) {
                if (nearest) {
                    nearest.x = line.v2.x;
                    nearest.y = line.v2.y;
                }
                return true;
            }

            var x1 = line.v1.x,
                y1 = line.v1.y,
                x2 = line.v2.x,
                y2 = line.v2.y,
                cx = circle.pos.x,
                cy = circle.pos.y,
            // vector distance
                dx = x2 - x1,
                dy = y2 - y1,
            // vector lc
                lcx = cx - x1,
                lcy = cy - y1,
            // vector lc
                lcx2 = cx - x2,
                lcy2 = cy - y2,
            // project lc onto d, resulting in vector p
                dLen2 = dx * dx + dy * dy, //len2 of d
                px = dx,
                py = dy;
            if (dLen2 > 0) {
                let dp = (lcx * dx + lcy * dy) / dLen2,
                    dp2 = (lcx2 * dx + lcy2 * dy) / dLen2;
                px *= dp;
                py *= dp;
            }

            if (!nearest) {
                nearest = tmp;
            }
            nearest.x = x1 + px;
            nearest.y = y1 + py;

            //len2 of p
            let pLen2 = px * px + py * py;
            let cos = Math.cos(line.rotation),
                sin = Math.sin(line.rotation),
            //get position of ball, relative to line
                gx1 = circle.pos.x - line.v1.x,
                gy1 = circle.pos.y - line.v1.y,
            //rotate coordinates
                gy2 = cos * gy1 - sin * gx1,
            //rotate velocity
                vy1 = cos * circle.pos.vy - sin * circle.pos.vx;
            //perform bounce with rotated values
            if (gy2 > -circle.radius && gy2 < vy1) {
                //rotate coordinates
                let gx2 = cos * gx1 + sin * gy1,
                //rotate velocity
                    vx1 = cos * circle.pos.vx + sin * circle.pos.vy;
                gy2 = -circle.radius;
                vy1 *= -0.6;
                //rotate everything back
                gx1 = cos * gx2 - sin * gy2;
                gy1 = cos * gy2 + sin * gx2;
                collisionObj.vecI = new Vec(line.v1.x + gx1, line.v1.y + gy1, cos * vx1 - sin * vy1, cos * vy1 + sin * vx1);
            }
            //check collision
            let collided = this.pointCircleCollide(nearest, circle) && (pLen2 <= dLen2) && ((px * dx + py * dy) >= 0);

            if (collided) {
                return collisionObj;
            }
            return false;
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
         * @returns {{vecI: Vec, vecX: number, distance: number}|boolean}
         */
        this.linePointIntersect = function (v1, v2, v0, rad) {
            // Create a perpendicular vector
            var x = v2.y - v1.y,
                y = v2.x - v1.x,
                xDiff = v1.y - v0.y,
                yDiff = v1.x - v0.x,
                v = new Vec(x, -y),
                d = Math.abs(y * xDiff - yDiff * x);

            d = d / v.length();
            if (d > rad * rad) {
                return false;
            }

            v.normalize();
            v.scale(d);

            let vecI = v0.add(v),
                vecX = (Math.abs(y) > Math.abs(x)) ? (vecI.x - v1.x) / (y) : (vecI.y - v1.y) / (x);

            if (vecX > 0.0 && vecX < 1.0) {
                return  {
                    vecI: vecI,
                    vecX: vecX,
                    distance: v0.distanceTo(vecI)
                };
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
            var dx = circle.pos.x - point.x,
                dy = circle.pos.y - point.y,
                collided = dx * dx + dy * dy <= circle.radius * circle.radius;

            return collided;
        };

        /**
         * A helper function to get check for colliding walls/items
         * @param {Vec} v1 start position
         * @param {Vec} v2 end position
         * @param {Array} walls
         * @param {Map} entities
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
            var nodes = aNode.getNodes();
            if (nodes) {
                for (let i = 0; i < nodes.length; i++) {
                    this.drawRegions(nodes[i]);
                }
            }

            let rect = new PIXI.Graphics();
            rect.clear();
            rect.lineStyle(1, 0xFF0000, 0.9);
            rect.beginFill(0xFFFFFF, 0.09);
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
            let len = this.population.size;

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
