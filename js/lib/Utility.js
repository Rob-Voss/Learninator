var Utility = Utility || {};

(function (global) {
    "use strict";

    // Random number utilities
    var return_v = false;
    var v_val = 0.0;
    var gaussRandom = function () {
        if (return_v) {
            return_v = false;
            return v_val;
        }
        var u = 2 * Math.random() - 1;
        var v = 2 * Math.random() - 1;
        var r = u * u + v * v;
        if (r === 0 || r > 1)
            return gaussRandom();
        var c = Math.sqrt(-2 * Math.log(r) / r);
        v_val = v * c; // cache this
        return_v = true;

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
    }

    /**
     * Return a random Integer within the range of a-b
     * @param {Float} lo
     * @param {Float} hi
     * @returns {Number}
     */
    Utility.randi = function (lo, hi) {
        return Math.floor(this.randf(lo, hi));
    }

    /**
     * Return a random Number
     * @param {Float} mu
     * @param {Float} std
     * @returns {Number}
     */
    Utility.randn = function (mu, std) {
        return mu + gaussRandom() * std;
    };

    /**
     * Find an object in the array via id attribute
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
     * Check the edges of the world
     * @param entity
     * @param width
     * @param height
     */
    Utility.boundaryCheck = function (entity, width, height) {
        // handle boundary conditions.. bounce agent
        if (entity.position.x < 1) {
            entity.position.x = 1;
            entity.position.vx = 0;
            entity.position.vy = 0;
        }
        if (entity.position.x > width) {
            entity.position.x = width;
            entity.position.vx = 0;
            entity.position.vy = 0;
        }
        if (entity.position.y < 1) {
            entity.position.y = 1;
            entity.position.vx = 0;
            entity.position.vy = 0;
        }
        if (entity.position.y > height) {
            entity.position.y = height;
            entity.position.vx = 0;
            entity.position.vy = 0;
        }

        entity.sprite.position.set(entity.position.x, entity.position.y);
    };

    /**
     * A helper function to get check for colliding walls/items
     * @param {Vec} v1
     * @param {Vec} v2
     * @param {Array} walls
     * @param {Array} entities
     * @returns {Boolean}
     */
    Utility.collisionCheck = function (v1, v2, walls, entities) {
        var minRes = false;

        // Collide with walls
        if (walls) {
            for (var i = 0, wl = walls.length; i < wl; i++) {
                var wall = walls[i],
                    wResult = Utility.lineIntersect(v1, v2, wall.v1, wall.v2);
                if (wResult) {
                    wResult.type = 0; // 0 is wall
                    wResult.vx = v1.vx; // velocity information
                    wResult.vy = v1.vy;
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
                    iResult = Utility.linePointIntersect(v1, v2, entity.position, entity.radius);
                if (iResult) {
                    iResult.type = entity.type;
                    iResult.id = entity.id;
                    iResult.radius = entity.radius;
                    iResult.position = entity.position;
                    iResult.vx = entity.position.vx; // velocity information
                    iResult.vy = entity.position.vy;
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
     * @param {Number} x
     * @param {Number} d
     * @returns {String}
     */
    Utility.flt2str = function (x, d) {
        d = (typeof(d) === undefined) ? 5 : d;
        var dd = 1.0 * Math.pow(10, d);

        return '' + Math.floor(x * dd) / dd;
    };

    /**
     * Line intersection helper function: line segment (v1,v2) intersect segment (v3,v4)
     * @param p1
     * @param p2
     * @param p3
     * @param p4
     * @returns {*}
     */
    Utility.lineIntersect = function (p1, p2, p3, p4) {
        var denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
        if (denom === 0.0) {
            return false;
        } // parallel lines
        var ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
        var ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
        if (ua > 0.0 && ua < 1.0 && ub > 0.0 && ub < 1.0) {
            var up = new Vec(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
            return {vecX: ua, vecY: ub, vecI: up}; // up is intersection point
        }
        return false;
    };

    /**
     * Find the position of intersect between a line and a point
     * @param p1
     * @param p2
     * @param p0
     * @param rad
     * @returns {*}
     */
    Utility.linePointIntersect = function (p1, p2, p0, rad) {
        var v = new Vec(p2.y - p1.y, -(p2.x - p1.x)); // perpendicular vector
        var d = Math.abs((p2.x - p1.x) * (p1.y - p0.y) - (p1.x - p0.x) * (p2.y - p1.y));
        d = d / v.length();
        if (d > rad) {
            return false;
        }

        v.normalize();
        v.scale(d);
        var up = p0.add(v);
        var ua;
        if (Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y)) {
            ua = (up.x - p1.x) / (p2.x - p1.x);
        } else {
            ua = (up.y - p1.y) / (p2.y - p1.y);
        }
        if (ua > 0.0 && ua < 1.0) {
            return {vecX: ua, vecI: up};
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
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
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