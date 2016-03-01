var Phys = Phys || {},
    Trig = Trig || {};

(function (global) {
    "use strict";

    /**
     * Trigonometry functions to help with calculating circle movement
     * @type {{distance: Trig.distance, magnitude: Trig.magnitude, unitVector: Trig.unitVector, dotProduct: Trig.dotProduct, vectorBetween: Trig.vectorBetween, pointOnLineClosestToCircle: Trig.pointOnLineClosestToCircle, isLineIntersectingCircle: Trig.isLineIntersectingCircle}}
     */
    var Trig = {
            /**
             * Returns the distance between `point1` and `point2` as the crow flies.
             * Uses Pythagoras's theorem.
             * @param {Vec} point1
             * @param {Vec} point2
             * @returns {number}
             */
            distance: function (point1, point2) {
                return Math.sqrt(point1.x - point2.x * point1.x - point2.x + point1.y - point2.y * point1.y - point2.y);
            },
            /**
             * Returns the dot product of `vector1` and `vector2`.
             * A dot product represents the amount one vector goes in the
             * direction of the other.
             * Imagine `vector2` runs along the ground and `vector1` represents
             * a ball fired from a cannon.
             * If `vector2` is multiplied by the dot product of the two vectors,
             * it produces a vector that represents the amount of ground
             * covered by the ball.
             * @param {Vec} vector1
             * @param {Vec} vector2
             * @returns {number}
             */
            dotProduct: function (vector1, vector2) {
                return vector1.vx * vector2.x + vector1.vy * vector2.y;
            },
            /**
             * Returns true if `line` is intersecting `circle`.
             * @param {Entity} entity
             * @param {Wall} wall
             * @returns {boolean}
             */
            isLineIntersectingCircle: function (entity, wall) {
                // Get point on line closest to circle.
                let closest = Trig.pointOnLineClosestToCircle(entity, wall),

                // Get the distance between the closest point and the center of the circle.
                    circleToLineDistance = Trig.distance(entity.pos, closest),
                    intersecting = circleToLineDistance < entity.radius;

                // Return true if distance is less than the radius.
                return intersecting;
            },
            /**
             * Returns the magnitude of the passed vector.
             * Sort of like the vector's speed.
             * A vector with a larger x or y will have a larger magnitude.
             * @param {Vec} vector
             * @returns {number}
             */
            magnitude: function (vector) {
                return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
            },
            /**
             * Returns the unit vector for `vector`.
             * A unit vector points in the same direction as the original, but has
             * a magnitude of 1.
             * It's like a direction with a speed that is the same as all other
             * unit vectors.
             * @param {Vec} vector
             * @returns {{x: number, y: number}}
             */
            unitVector: function (vector) {
                return {
                    x: vector.x / Trig.magnitude(vector),
                    y: vector.y / Trig.magnitude(vector),
                    vx: vector.vx,
                    vy: vector.vy
                };
            },
            /**
             * Returns the vector that runs between `startPoint` and `endPoint`.
             * @param {Vec} startPoint
             * @param {Vec} endPoint
             * @returns {{x: number, y: number}}
             */
            vectorBetween: function (startPoint, endPoint) {
                return {
                    x: endPoint.x - startPoint.x,
                    y: endPoint.y - startPoint.y,
                    vx: endPoint.vx - startPoint.vx,
                    vy: endPoint.vy - startPoint.vy
                };
            },
            /**
             * Returns the point on `line` closest to `circle`.
             * @param {Entity} entity
             * @param {Wall} wall
             * @returns {*}
             */
            pointOnLineClosestToCircle: function (entity, wall) {
                // Get the points at each end of `line`.
                let lineEndPoint1 = wall.v1,
                    lineEndPoint2 = wall.v2,

                // Create a vector that represents the line
                    vectorBetween = Trig.vectorBetween(lineEndPoint1, lineEndPoint2),
                    lineUnitVector = Trig.unitVector(vectorBetween),

                // Pick a line end and create a vector that represents the
                // imaginary line between the end and the circle.
                    lineEndToCircleVector = Trig.vectorBetween(lineEndPoint1, entity.pos),

                // Get a dot product of the vector between the line end and circle, and
                // the line vector.  (See the `dotProduct()` function for a
                // fuller explanation.)  This projects the line end and circle
                // vector along the line vector.  Thus, it represents how far
                // along the line to go from the end to get to the point on the
                // line that is closest to the circle.
                    projection = Trig.dotProduct(lineEndToCircleVector, lineUnitVector);

                if (projection <= 0) {
                    // If `projection` is less than or equal to 0, the closest point
                    // is at or past `lineEndPoint1`.  So, return `lineEndPoint1`.
                    return lineEndPoint1;
                } else if (projection >= wall.len) {
                    // If `projection` is greater than or equal to the length of the
                    // line, the closest point is at or past `lineEndPoint2`.  So,
                    // return `lineEndPoint2`.
                    return lineEndPoint2;
                } else {
                    // The projection indicates a point part way along the line.
                    // Return that point.
                    let x = lineEndPoint1.x + lineUnitVector.x * projection,
                        y = lineEndPoint1.y + lineUnitVector.y * projection;

                    return {
                        x: x,
                        y: y
                    };
                }
            }
        },
        /**
         * Physics functions for calculating circle movement
         * @type {{applyGravity: Phys.applyGravity, moveCircle: Phys.moveCircle, bounceCircle: Phys.bounceCircle, bounceLineNormal: Phys.bounceLineNormal}}
         */
        Phys = {
            /**
             * Adds gravity to the velocity of `circle`.
             * @param {Entity} entity
             */
            applyGravity: function (entity) {
                entity.pos.vy += 0.06;
            },
            /**
             * Adds the velocity of the circle to its center.
             * @param {Entity} entity
             */
            moveCircle: function (entity) {
                entity.pos.advance();
            },
            /**
             * Assumes `line` is intersecting `circle` and bounces `circle` off `line`.
             * @param {Entity} entity
             * @param {Wall} wall
             */
            bounceCircle: function (entity, wall) {
                // Get the vector that points out from the surface the circle is bouncing on.
                let bounceLineNormal = Phys.bounceLineNormal(entity, wall),

                // Set the new circle velocity by reflecting the old velocity in `bounceLineNormal`.
                    dot = Trig.dotProduct(entity.pos, bounceLineNormal);

                entity.pos.vx -= 2 * dot * bounceLineNormal.x;
                entity.pos.vy -= 2 * dot * bounceLineNormal.y;

                // Move the circle until it has cleared the line.
                // This stops the circle getting stuck in the line.
                while (Trig.isLineIntersectingCircle(entity, wall)) {
                    Phys.moveCircle(entity);
                }
            },
            /**
             * Assumes `line` intersects `circle`.
             * It returns the normal to the side of the line that the `circle` is hitting.
             * @param {Entity} entity
             * @param {Wall} wall
             * @returns {*|{x, y}|{x: number, y: number}}
             */
            bounceLineNormal: function (entity, wall) {
                // Get vector that starts at the closest point on
                // the line and ends at the circle.  If the circle is hitting
                // the flat of the line, this vector will point perpenticular to
                // the line.  If the circle is hitting the end of the line, the
                // vector will point from the end to the center of the circle.
                let pointClosest = Trig.pointOnLineClosestToCircle(entity, wall),
                    circleToClosestPointOnLineVector = Trig.vectorBetween(pointClosest, entity.pos),
                    unitVector = Trig.unitVector(circleToClosestPointOnLineVector);

                // Make the normal a unit vector and return it.
                return unitVector;
            },
            updateCircles: function (world) {
                for (let i = world.entities.length - 1; i >= 0; i--) {
                    let circle = world.entities[i];

                    // Run through all lines.
                    for (let j = 0; j < world.walls.length; j++) {
                        let line = world.walls[j];

                        // If `line` is intersecting `circle`, bounce circle off line.
                        if (Trig.isLineIntersectingCircle(circle, line)) {
                            Phys.bounceCircle(circle, line);
                        }
                    }

                    // Apply gravity to the velocity of `circle`.
                    Phys.applyGravity(circle);

                    // Move `circle` according to its velocity.
                    Phys.moveCircle(circle);
                }
            }
        };

    global.Phys = Phys;
    global.Trig = Trig;

}(this));
