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
        if (opts.type === 'grid') {
            GridCD.apply(this);
        } else if (opts.type === 'quad') {
            QuadCD.apply(this);
        } else if (opts.type === 'brute') {
            BruteCD.apply(this);
        }

        /**
         *
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
         *
         * @param {Wall} line
         * @param {Entity} circle
         * @param {Object} nearest
         * @returns {boolean}
         */
        this.circleLineCollide = function (line, circle, nearest) {
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
                collisionObj.vx = cos * vx1 - sin * vy1;
                collisionObj.vy = cos * vy1 + sin * vx1;
                collisionObj.x = line.v1.x + gx1;
                collisionObj.y = line.v1.y + gy1;
            }
            //check collision
            let collided = this.pointCircleCollide(nearest, circle) && (pLen2 <= dLen2) && ((px * dx + py * dy) >= 0);

            if (collided) {
                return collisionObj;
            }
            return false;
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
                    xDist = target.pos.x - entity.pos.x,
                    yDist = target.pos.y - entity.pos.y,
                    distFrom = target.pos.distFrom(entity.pos),
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
                                    type: target.type,
                                    vx: target.pos.vx + collisionWeightA * xCollision,
                                    vy: target.pos.vy + collisionWeightA * yCollision
                                },
                                entity: {
                                    type: entity.type,
                                    vx: entity.pos.vx - collisionWeightB * xCollision,
                                    vy: entity.pos.vy - collisionWeightB * yCollision
                                }
                            };

                        return collisionObj;
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
         * @param {number} radius
         * @returns {boolean}
         */
        this.sightCheck = function (v1, v2, walls, entities, radius) {
            var minRes = false,
                rad = radius || 0;

            // Collide with walls
            if (walls) {
                for (var i = 0, wl = walls.length; i < wl; i++) {
                    var wall = walls[i],
                        wResult = this.lineIntersect(v1, v2, wall.v1, wall.v2, rad);
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
                        iResult = this.linePointIntersect(v1, v2, entity.pos, entity.size);
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
         * Find the position of intersect between a line and a point with a radius
         * @param {Vec} v1 From position
         * @param {Vec} v2 To position
         * @param {Vec} v0 Target position
         * @param {number} radius Target radius
         * @returns {Object|Boolean}
         */
        this.linePointIntersect = function (v1, v2, v0, radius) {
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
            if (d > radius) {
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
        this.lineIntersect = function (v1, v2, v3, v4, radius) {
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
         * Set up the CD function
         * @param target
         */
        this.check = function (target) {
            var region, collisionObj,
                _this = this;
            target.collisions = [];

            /**
             * Collision check
             * @param {Entity} entity
             */
            function checkIt(entity) {
                if (entity === target) {
                    return;
                }
                var edibleEntity = (entity.type === 2 || entity.type === 1),
                    edibleTarget = (target.type === 2 || target.type === 1),
                    agentTarget = (target.type === 3 || target.type === 4 || target.type === 5),
                    agentEntity = (entity.type === 3 || entity.type === 4 || entity.type === 5);

                // If both entities have a radius
                if (entity.radius !== undefined && target.radius !== undefined) {
                    // Use the circle collision check
                    collisionObj = _this.circleCircleCollide(entity, target);
                    if (collisionObj) {
                        // If there was a collision between an agent and an edible entity
                        if ((edibleTarget && edibleEntity) ||
                            (agentTarget && edibleEntity)) {
                            // If there was a collision between edible entities
                            target.pos.vx = collisionObj.target.vx;
                            target.pos.vy = collisionObj.target.vy;
                            entity.pos.vx = collisionObj.entity.vx;
                            entity.pos.vy = collisionObj.entity.vy;
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
                } else {
                    collisionObj = _this.circleLineCollide(entity, target);
                    if (collisionObj) {
                        // Reset the position
                        target.pos = target.oldPos.clone();
                        // If it's a consumable try and change the direction
                        if (target.type === 2 || target.type === 1) {
                            target.pos.vx = collisionObj.vx;
                            target.pos.vy = collisionObj.vy;
                            // If it's an Agent bounce it
                        } else if (target.type === 3 || target.type === 4) {
                            target.pos.vx = 0;
                            target.pos.vy = 0;
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
                }
            }

            region = this.tree.retrieve(target, checkIt);

            return collisionObj;
        };

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

            for (let wi = 0, ni = this.walls.length; wi < ni; wi++) {
                this.nodes.push(this.walls[wi]);
            }

            for (let ii = 0, ni = this.entities.length; ii < ni; ii++) {
                this.nodes.push(this.entities[ii]);
            }

            for (let ai = 0, na = this.agents.length; ai < na; ai++) {
                this.nodes.push(this.agents[ai]);
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
        this.cellWidth = this.width / this.grid.xCount;
        this.cellHeight = this.height / this.grid.yCount;

        /**
         * Set up the CD function
         * @param {Entity} target
         */
        this.check = function (target) {
            target.collisions = [];
            // Loop through all the entities in the current cell and check distances
            let cell = this.grid.getCellAt(target.gridLocation.x, target.gridLocation.y);
            for (let p = 0; p < cell.population.length; p++) {
                let entities = this.entities,
                    entity = entities.find(Utility.getId, cell.population[p]);
                if (entity) {
                    let dist = target.pos.distanceTo(entity.pos),
                        distFrom = target.pos.distFrom(entity.pos);
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
            // Draw the grid
            if (this.cheats.grid) {
                // Clear the collision detection holder
                if (this.collisionOverlay !== undefined) {
                    this.stage.removeChild(this.collisionOverlay);
                }
                this.collisionOverlay = new PIXI.Container();

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

                        // Draw population counts text
                        let fontOpts = {font: "20px Arial", fill: "#006400", align: "center"},
                            popText = new PIXI.Text(yCell.population.length, fontOpts);
                        popText.pos.set(coords.bottom.left.x + (this.cellWidth / 2), coords.bottom.left.y - (this.cellHeight / 2));
                        grid.addChild(popText);

                        this.collisionOverlay.addChild(grid);
                    }
                }
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
    global.GridCD = GridCD;

    /**
     * Brute Force CD
     * @name BruteCD
     * @constructor
     */
    var BruteCD = function () {
        /**
         * Set up the CD function
         * @param {Entity} target
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
                    let collisionObj = this.circleCircleCollide(entity, target);
                    if (collisionObj) {
                        // If there was a collision between an agent and an edible entity
                        if ((edibleEntity && edibleTarget) ||
                            (edibleTarget && entity.type === 5) ||
                            (entity.type === 5 && target.type === 5) ||
                            (entity.type === 5 && (target.type === 3 || target.type === 4))) {
                            // If there was a collision between edible entities
                            target.pos.vx = collisionObj.target.vx;
                            target.pos.vy = collisionObj.target.vy;
                            entity.pos.vx = collisionObj.entity.vx;
                            entity.pos.vy = collisionObj.entity.vy;
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
                    let result = this.lineIntersect(target.oldPos, target.pos, entity.v1, entity.v2);
                    if (result) {
                        // Reset the position
                        target.pos = target.oldPos.clone();
                        // If it's a consumable try and change the direction
                        if (target.type === 2 || target.type === 1) {
                            target.pos.vx *= -1;
                            target.pos.vy *= -1;
                            // If it's an Agent bounce it
                        } else if (target.type === 3 || target.type === 4) {
                            target.pos.vx = 0;
                            target.pos.vy = 0;
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
            // Clear the collision detection holder
            if (this.collisionOverlay !== undefined) {
                this.stage.removeChild(this.collisionOverlay);
            }
            this.collisionOverlay = new PIXI.Container();

            let fontOpts = {font: "20px Arial", fill: "#006400", align: "center"},
                popText = new PIXI.Text(this.entities.length, fontOpts);
            popText.pos.set(this.width / 2, this.height / 2);
            this.collisionOverlay.addChild(popText);
            this.stage.addChild(this.collisionOverlay);

        };

        /**
         * Update the population
         */
        this.updatePopulation = function () {

        };
    };
    global.BruteCD = BruteCD;

}(this));
