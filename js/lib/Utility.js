var Utility = Utility || {};

(function (global) {
    "use strict";

    // Random number utilities
    var retV = false,
        vVal = 0.0;

    /**
     * Utility fun
     * @param condition
     * @param message
     */
    Utility.assert = function (condition, message) {
        // from http://stackoverflow.com/questions/15313418/javascript-assert
        if (!condition) {
            message = message || "Assertion failed";
            if (Error !== undefined) {
                throw new Error(message);
            }
            throw message; // Fallback
        }
    };

    /**
     * Stringify an object including it's functions if it has any
     * @param {Object} obj
     */
    Utility.stringify = function (obj) {
        return JSON.stringify(obj, function (key, value) {
            return (typeof value === 'function') ? value.toString() : value;
        });
    };

    /**
     * Parse an object that has been stringified, and rebuild it's functions
     * @param {String} str
     */
    Utility.parse = function (str) {
        return JSON.parse(str, function (key, value) {
            if (typeof value !== 'string') {
                return value;
            }
            return (value.substring(0, 8) === 'function') ? eval('(' + value + ')') : value;
        });
    };

    /**
     * Syntactic sugar function for getting default parameter values
     * @param {Object} opt
     * @param {String} fieldName
     * @param {Mixed} defaultValue
     * @returns {*}
     */
    Utility.getOpt = function (opt, fieldName, defaultValue) {
        if (typeof opt === 'undefined') {
            return defaultValue;
        }
        return (typeof opt[fieldName] !== 'undefined') ? opt[fieldName] : defaultValue;
    };

    /**
     * Gaussian random number
     * @returns {Number}
     */
    Utility.gaussRandom = function () {
        if (retV) {
            retV = false;

            return vVal;
        }

        var u = 2 * Math.random() - 1,
            v = 2 * Math.random() - 1,
            r = u * u + v * v,
            c = Math.sqrt(-2 * Math.log(r) / r);
        if (r === 0 || r > 1) {
            return Utility.gaussRandom();
        }

        vVal = v * c; // cache this
        retV = true;

        return u * c;
    };

    /**
     * Return a random Float within the range of a-b
     * @param {Float} lo
     * @param {Float} hi
     * @returns {Number}
     */
    Utility.randf = function (lo, hi) {
        return Math.random() * (hi - lo) + lo;
    };

    /**
     * Return a random Integer within the range of a-b
     * @param {Number} lo
     * @param {Number} hi
     * @returns {Number}
     */
    Utility.randi = function (lo, hi) {
        return Math.floor(this.randf(lo, hi));
    };

    /**
     * Return a random Number
     * @param {Float} mu
     * @param {Float} std
     * @returns {Number}
     */
    Utility.randn = function (mu, std) {
        return mu + Utility.gaussRandom() * std;
    };

    /**
     * A helper function returns array of zeros of length n
     * and uses typed arrays if available
     * @param {Number} n
     * @returns {Float64Array}
     */
    Utility.zeros = function (n) {
        if (typeof n === 'undefined' || isNaN(n)) {
            return [];
        }
        if (typeof ArrayBuffer === 'undefined') {
            // lacking browser support
            var arr = new Array(n);
            for (let i = 0; i < n; i++) {
                arr[i] = 0;
            }
            return arr;
        } else {
            return new Float64Array(n);
        }
    };

    /**
     * Find an object in the array via id attribute
     *
     * @param {Array} ar
     * @param {String} id
     * @returns {undefined}
     */
    Utility.findObject = function (ar, id) {
        ar.map(function (el) {
            return el.id;
        }).indexOf(id);
    };

    /**
     * Get the object with the matching id property
     *
     * @param element
     * @param index
     * @param array
     * @returns {boolean}
     */
    Utility.getId = function (element, index, array) {
        if (element.id === this) {
            return true;
        }
        return false;
    };

    /**
     * Load JSON
     * @param file
     * @param callback
     */
    Utility.loadJSON = function (file, callback) {
        var xObj = new XMLHttpRequest();
        xObj.overrideMimeType("application/json");
        xObj.open('GET', file, true);
        xObj.onreadystatechange = function () {
            if (xObj.readyState === 4 && xObj.status === "200") {
                callback(xObj.responseText);
            }
        };
        xObj.send(null);
    };

    /**
     * Calculate the direction.
     * @param angle
     * @returns {string}
     */
    Utility.getDirection = function (angle) {
        var directions = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'],
            octant = Math.round(8 * angle / (2 * Math.PI) + 8) % 8;
        return directions[octant];
    };

    /**
     * Check for collision of circular entities, and calculate collsion point
     * as well as velocity changes that should occur to them
     * @param {Entity} entity
     * @param {Entity} target
     * @returns {{collPtX: number, collPtY: number, distSquared: number, distFrom: (*|Number), target: {vx: *, vy: *}, entity: {vx: number, vy: number}}}
     */
    Utility.circleCollision = function (entity, target) {
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
                            radiusFrom: radiusDist,
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
    Utility.collisionCheck = function (v1, v2, walls, entities, radius) {
        var minRes = false,
            rad = radius ? radius : 0;

        // Collide with walls
        if (walls) {
            for (var i = 0, wl = walls.length; i < wl; i++) {
                var wall = walls[i],
                    wResult = Utility.lineIntersect(v1, v2, wall.v1, wall.v2);
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
                    iResult = Utility.linePointIntersect(v1, v2, entity.position, entity.radius + rad);
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
     * Returns string representation of float but truncated to length of d digits
     * @param {Number} x Float
     * @param {Number} d Decimals
     * @returns {String}
     */
    Utility.flt2str = function (x, d) {
        d = (typeof(d) === undefined) ? 5 : d;
        var dd = 1.0 * Math.pow(10, d);

        return '' + Math.floor(x * dd) / dd;
    };

    /**
     * Find the position of intersect between a line and a point
     * @param {Vec} v1 From position
     * @param {Vec} v2 To position
     * @param {Vec} v0 Target position
     * @param {Number} rad Target radius
     * @returns {Object|Boolean}
     */
    Utility.linePointIntersect = function (v1, v2, v0, rad) {
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
    Utility.lineIntersect = function (v1, v2, v3, v4, rad) {
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

    /**
     * Find the area of a triangle
     * @param {Vec} v1
     * @param {Vec} v2
     * @param {Vec} v3
     * @returns {Number}
     */
    Utility.area = function (v1, v2, v3) {
        return Math.abs((v1.x * (v2.y - v3.y) + v2.x * (v3.y - v1.y) + v3.x * (v1.y - v2.y)) / 2.0);
    };

    /**
     * Do stuff
     * @returns {Number}
     */
    Utility.S4 = function () {
        return (((1 + Math.random()) * 0x10000) || 0).toString(16).substring(1);
    };

    /**
     * Generate a UUID
     * @returns {String}
     */
    Utility.guid = function () {
        return (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0, 3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
    };

    global.Utility = Utility;

}(this));