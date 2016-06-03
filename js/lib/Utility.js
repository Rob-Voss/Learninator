/**
 *
 * @name Utility
 * @type {Utility}
 * @property {function} assert
 * @property {function} flt2str
 * @property {function} getDirection
 * @property {function} getId
 * @property {function} getOpt
 * @property {function} loadJSON
 * @property {function} parse
 * @property {function} stringify
 * @property {function} guid
 * @property {function} S4
 * @property {function} loader
 * @property {function} Arrays
 * @property {function} Maths
 * @property {function} Strings
 */
var Utility = Utility || {};

(function (global) {
    "use strict";

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
     * Calculate the direction.
     * @param angle
     * @returns {string}
     */
    Utility.getDirection = function (angle) {
        if (angle < 0) {
            angle += 360;
        }
        let directions = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'],
            octant = Math.round(8 * angle / (2 * Math.PI) + 8) % 8;
        return directions[octant];
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
     * Syntactic sugar function for getting default parameter values
     * @param {Object} opt
     * @param {String} fieldName
     * @param {Mixed} defaultValue
     * @returns {*}
     */
    Utility.getOpt = function (opt, fieldName, defaultValue) {
        if (opt === undefined) {
            return defaultValue;
        }
        return (typeof opt[fieldName] !== 'undefined') ? opt[fieldName] : defaultValue;
    };

    /**
     * Load JSON
     * @param file
     * @param callback
     */
    Utility.loadJSON = function (file, callback) {
        let xObj = new XMLHttpRequest();
        xObj.overrideMimeType("application/json");
        xObj.open('GET', file, true);
        xObj.onreadystatechange = function () {
            if (xObj.readyState === 4 && xObj.status === 200) {
                callback(xObj.responseText);
            }
        };
        xObj.send(null);
    };

    /**
     *
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @returns {string}
     */
    Utility.rgbToHex = function (r, g, b) {
        return parseInt("0x" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1));
    };

    /**
     *
     * @param hex
     * @returns {*}
     */
    Utility.hexToRgb = function (hex) {
        if (!isNaN(hex)) {
            hex = "#" + hex.toString(16);
        }
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
        });
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
    };

    /**
     * Usage:  Load different file types with one callback
     * Promise.all([
     * load.js('lib/highlighter.js'),
     * load.js('lib/main.js'),
     * load.css('lib/highlighter.css'),
     * load.img('images/logo.png')
     * ]).then(function() {
     *    console.log('Everything has loaded!');
     * }).catch(function() {
     *    console.log('Oh no, epic failure!');
     * });
     * @type {{css, js, img}}
     */
    Utility.loader = (function() {

        /**
         * Function which returns a function:
         * https://davidwalsh.name/javascript-functions
         */
        function _load(tag) {
            return function(url) {
                // This promise will be used by Promise.all
                // to determine success or failure
                return new Promise(function(resolve, reject) {
                    var element = document.createElement(tag);
                    var parent = 'body';
                    var attr = 'src';

                    // Important success and error for the promise
                    element.onload = function() {
                        resolve(url);
                    };
                    element.onerror = function() {
                        reject(url);
                    };

                    // Need to set different attributes depending on tag type
                    switch(tag) {
                        case 'script':
                            element.async = true;
                            break;
                        case 'link':
                            element.type = 'text/css';
                            element.rel = 'stylesheet';
                            attr = 'href';
                            parent = 'head';
                    }

                    // Inject into document to kick off loading
                    element[attr] = url;
                    document[parent].appendChild(element);
                });
            };
        }

        return {
            css: _load('link'),
            js: _load('script'),
            img: _load('img')
        };
    })();

    /**
     *
     */
    Utility.Arrays = (function () {

        /**
         *
         * @constructor
         */
        function Arrays() {
        }

        /**
         *
         * @param {Array} arr
         * @returns {Array}
         */
        Arrays.arrUnique = function (arr) {
            var h = {}, output = [];
            for (var i = 0, n = arr.length; i < n; i++) {
                if (!h[arr[i]]) {
                    h[arr[i]] = true;
                    output.push(arr[i]);
                }
            }
            return output;
        };

        /**
         *
         * @param {Array} arr
         * @param {object} elt
         * @returns {boolean}
         */
        Arrays.arrContains = function (arr, elt) {
            for (var i = 0, n = arr.length; i < n; i++) {
                if (arr[i] === elt) {
                    return i;
                }
            }
            return false;
        };

        /**
         * Find an object in the array via id attribute
         * @param {Array} ar
         * @param {string} id
         * @returns {object}
         */
        Arrays.findObject = function (ar, id) {
            ar.map(function (el) {
                return el.id;
            }).indexOf(id);
        };

        return Arrays;
    })();

    /**
     *
     */
    Utility.Maths = (function () {

        // Random number utilities
        let retV = false,
            vVal = 0.0;

        /**
         *
         * @constructor
         */
        function Maths() {
        }

        /**
         * Gaussian random number
         * @returns {number}
         */
        Maths.gaussRandom = function () {
            if (retV) {
                retV = false;
                return vVal;
            }

            let u = 2 * Math.random() - 1,
                v = 2 * Math.random() - 1,
                r = u * u + v * v,
                c = Math.sqrt(-2 * Math.log(r) / r);
            if (r === 0 || r > 1) {
                return Maths.gaussRandom();
            }

            vVal = v * c; // cache this
            retV = true;

            return u * c;
        };

        /**
         * return max and min of a given non-empty array.
         * @param w
         * @returns {*}
         */
        Maths.maxMin = function (w) {
            if (w.length === 0) {
                return {};
            } // ... ;s
            var maxv = w[0];
            var minv = w[0];
            var maxi = 0;
            var mini = 0;
            var n = w.length;
            for (var i = 1; i < n; i++) {
                if (w[i] > maxv) {
                    maxv = w[i];
                    maxi = i;
                }
                if (w[i] < minv) {
                    minv = w[i];
                    mini = i;
                }
            }
            return {maxi: maxi, maxv: maxv, mini: mini, minv: minv, dv: maxv - minv};
        };

        /**
         * Return a random Float within the range of a-b
         * @param {number} lo
         * @param {number} hi
         * @returns {number}
         */
        Maths.randf = function (lo, hi) {
            return Math.random() * (hi - lo) + lo;
        };

        /**
         * Return a random Integer within the range of a-b
         * @param {number} lo
         * @param {number} hi
         * @returns {number}
         */
        Maths.randi = function (lo, hi) {
            return Math.floor(this.randf(lo, hi));
        };

        /**
         * Return a random Number
         * @param {float} mu
         * @param {float} std
         * @returns {number}
         */
        Maths.randn = function (mu, std) {
            return mu + Maths.gaussRandom() * std;
        };

        /**
         * create random permutation of numbers, in range [0...n-1]
         * @param n
         * @returns {Array}
         */
        Maths.randperm = function (n) {
            var i = n,
                j = 0,
                temp;
            var array = [];
            for (var q = 0; q < n; q++)array[q] = q;
            while (i--) {
                j = Math.floor(Math.random() * (i + 1));
                temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;
        };

        /**
         * A helper function returns array of zeros of length n
         * and uses typed arrays if available
         * @param {number} n
         * @returns {Float64Array}
         */
        Maths.zeros = function (n) {
            if (typeof n === 'undefined' || isNaN(n)) {
                return [];
            }
            if (typeof ArrayBuffer === 'undefined') {
                // lacking browser support
                let arr = new Array(n);
                for (let i = 0; i < n; i++) {
                    arr[i] = 0;
                }
                return arr;
            } else {
                return new Float64Array(n);
            }
        };

        /**
         *
         * @param element
         * @returns {{x: number, y: number}}
         */
        Maths.getElementPosition = function (element) {
            var elem = element, tagname = "", x = 0, y = 0;
            while ((typeof (elem) === "object") && (typeof (elem.tagName) !== "undefined")) {
                y += elem.offsetTop;
                x += elem.offsetLeft;
                tagname = elem.tagName.toUpperCase();
                if (tagname === "BODY") {
                    elem = 0;
                }
                if (typeof (elem) === "object") {
                    if (typeof (elem.offsetParent) === "object") {
                        elem = elem.offsetParent;
                    }
                }
            }
            return { x: x, y: y };
        };

        /**
         *
         * @param x1
         * @param y1
         * @param x2
         * @param y2
         * @returns {number}
         */
        Maths.dist = function (x1, y1, x2, y2) {
            var dx = x2 - x1;
            var dy = y2 - y1;
            return Math.sqrt(dx * dx + dy * dy);
        };

        /**
         *
         * @param sx
         * @param sy
         * @param ex
         * @param ey
         * @param checkX
         * @param checkY
         * @returns {boolean}
         */
        Maths.isPointOnWall = function (sx, sy, ex, ey, checkX, checkY) {
            var dist1 = Maths.dist(sx, sy, checkX, checkY);
            var dist2 = Maths.dist(checkX, checkY, ex, ey);
            var dist3 = Maths.dist(sx, sy, ex, ey);
            return ((dist1 + dist2) === dist3);
        };

        /**
         *
         * @param min
         * @param max
         * @param round
         * @returns {*}
         */
        Maths.range = function (min, max, round) {
            if (typeof round === "undefined") { round = true; }
            if (round) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            } else {
                return Math.random() * (max - min) + min;
            }
        };

        /**
         *
         * @param value
         * @returns {number}
         */
        Maths.degree = function (value) {
            return value / Maths.ONED;
        };

        /**
         *
         * @param value
         * @returns {number}
         */
        Maths.radian = function (value) {
            return value * Maths.ONED;
        };

        /**
         *
         * @param val
         * @param min
         * @param max
         * @returns {number}
         */
        Maths.clamp = function (val, min, max) {
            return Math.max(min, Math.min(max, val));
        };

        /**
         *
         * @param pt1
         * @param pt2
         * @returns {number}
         */
        Maths.angleBetweenPt = function (pt1, pt2) {
            return Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x);
        };

        /**
         *
         * @param value
         * @param low
         * @param high
         * @param low2
         * @param high2
         * @returns {*}
         */
        Maths.map = function (value, low, high, low2, high2) {
            var percent = (value - low) / (high - low);
            return low2 + percent * (high2 - low2);
        };

        /**
         * sample from list lst according to probabilities in list probs
         * the two lists are of same size, and probs adds up to 1
         * @param lst
         * @param probs
         * @returns {*}
         */
        Maths.weightedSample = function (lst, probs) {
            var p = randf(0, 1.0);
            var cumprob = 0.0;
            for (var k = 0, n = lst.length; k < n; k++) {
                cumprob += probs[k];
                if (p < cumprob) {
                    return lst[k];
                }
            }
        };

        /**
         *
         * @param {Entity} circle
         * @param {Entity} rect
         * @returns {boolean}
         */
        Maths.rectCircleCollide = function (circle, rect) {
            var distX = Math.abs(circle.position.x - rect.position.x - rect.width / 2),
                distY = Math.abs(circle.position.y - rect.position.y - rect.height / 2);
            if (distX > (rect.width / 2 + circle.radius)) {
                return false;
            }
            if (distY > (rect.height / 2 + circle.radius)) {
                return false;
            }
            if (distX <= (rect.width / 2)) {
                return true;
            }
            if (distY <= (rect.height / 2)) {
                return true;
            }
            var dx = distX - rect.width / 2,
                dy = distY - rect.height / 2;

            return (dx * dx + dy * dy <= (circle.radius * circle.radius));
        };

        /**
         *
         * @param {Vec|Vector} a1
         * @param {Vec|Vector} a2
         * @param {Vec|Vector} b1
         * @param {Vec|Vector} b2
         * @returns {object}
         */
        Maths.intersectLineLine = function (a1, a2, b1, b2) {
            var result = {
                hit: false,
                data: null,
                denom: ((b2.y - b1.y) * (a2.x - a1.x)) - ((b2.x - b1.x) * (a2.y - a1.y))
            };

            if (result.denom !== 0) {
                var a = a1.y - b1.y,
                    b = a1.x - b1.x,
                    nr1 = ((b2.x - b1.x) * a) - ((b2.y - b1.y) * b),
                    nr2 = ((a2.x - a1.x) * a) - ((a2.y - a1.y) * b);
                a = nr1 / result.denom;
                b = nr2 / result.denom;
                if (a > 0 && a < 1 && b > 0 && b < 1) {
                    var intersectX = a1.x + (a * (a2.x - a1.x)),
                        intersectY = a1.y + (a * (a2.y - a1.y));
                    result.hit = true;
                    result.data = [new Vector(intersectX, intersectY)];
                    result.distance = Vector.distance(a1, result.data[0]);
                    result.vx = 0;
                    result.vy = 0;
                }
            }
            return result;
        };

        /**
         *
         * @param {Vec|Vector} a1
         * @param {Vec|Vector} a2
         * @param {Vec|Vector} c
         * @param {number} r
         * @returns {object}
         */
        Maths.intersectCircleLine = function (a1, a2, c, r) {
            var result = {hit: false, data: null},
                a = (a2.x - a1.x) * (a2.x - a1.x) + (a2.y - a1.y) * (a2.y - a1.y),
                b = 2 * ((a2.x - a1.x) * (a1.x - c.x) + (a2.y - a1.y) * (a1.y - c.y)),
                cc = c.x * c.x + c.y * c.y + a1.x * a1.x + a1.y * a1.y - 2 * (c.x * a1.x + c.y * a1.y) - r * r,
                deter = b * b - 4 * a * cc;
            if (deter < 0) {

            } else if (deter === 0) {

            } else {
                var e = Math.sqrt(deter),
                    u1 = (-b + e) / (2 * a),
                    u2 = (-b - e) / (2 * a),
                    intersectData = [];
                if (u1 > 0 && u1 < 1) {
                    intersectData.push(Vector.lerp(a1, a2, u1));
                }
                if (u2 > 0 && u2 < 1) {
                    intersectData.push(Vector.lerp(a1, a2, u2));
                }
                if (intersectData.length > 0) {
                    result.hit = true;
                    result.data = intersectData;
                    result.distance = Vector.distance(c, result.data[0]);
                }
            }
            return result;
        };
        Maths.ONED = Math.PI / 180;

        return Maths;
    })();

    /**
     *
     */
    Utility.Strings = (function () {

        /**
         *
         * @constructor
         */
        function Strings() {
        }

        /**
         * Returns string representation of float but truncated to length of d digits
         * @param {number} x Float
         * @param {number} d Decimals
         * @returns {String}
         */
        Strings.flt2str = function (x, d) {
            d = (d === undefined) ? 5 : d;
            let dd = Math.pow(10, d);

            return '' + Math.floor(x * dd) / dd;
        };

        /**
         * Parse an object that has been stringified, and rebuild it's functions
         * @param {String} str
         */
        Strings.parse = function (str) {
            return JSON.parse(str, function (key, value) {
                if (typeof value !== 'string') {
                    return value;
                }
                return (value.substring(0, 8) === 'function') ? eval('(' + value + ')') : value;
            });
        };

        /**
         * Stringify an object including it's functions if it has any
         * @param {Object} obj
         */
        Strings.stringify = function (obj) {
            return JSON.stringify(obj, function (key, value) {
                return (typeof value === 'function') ? value.toString() : value;
            });
        };

        /**
         * Generate a UUID
         * @returns {String}
         */
        Strings.guid = function () {
            return (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0, 3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
        };

        /**
         * Do stuff
         * @returns {string}
         */
        Strings.S4 = function () {
            return (((1 + Math.random()) * 0x10000) || 0).toString(16).substring(1);
        };

        return Strings;
    })();

    global.Utility = Utility;

}(this));