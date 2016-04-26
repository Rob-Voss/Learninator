/**
 *
 * @name Utility
 * @type {Utility}
 * @property {function} arrUnique
 * @property {function} arrContains
 * @property {function} assert
 * @property {function} hexToR
 * @property {function} findObject
 * @property {function} flt2str
 * @property {function} gaussRandom
 * @property {function} getDirection
 * @property {function} getOpt
 * @property {function} getId
 */
var Utility = Utility || {};

(function (global) {
    "use strict";

    // Random number utilities
    let retV = false,
        vVal = 0.0;

    /**
     *
     * @param arr
     * @returns {Array}
     */
    Utility.arrUnique = function (arr) {
        var h = {}, output = [];
        for (var i = 0, n = arr.length; i < n; i++) {
            if (!h[arr[i]]) {
                h[arr[i]] = true;
                output.push(arr[i]);
            }
        }
        return output;
    };

    Utility.arrContains = function (arr, elt) {
        for (var i = 0, n = arr.length; i < n; i++) {
            if (arr[i] === elt) return true;
        }
        return false;
    };

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
     * Returns string representation of float but truncated to length of d digits
     * @param {number} x Float
     * @param {number} d Decimals
     * @returns {String}
     */
    Utility.flt2str = function (x, d) {
        d = (typeof(d) === undefined) ? 5 : d;
        let dd = 1.0 * Math.pow(10, d);

        return '' + Math.floor(x * dd) / dd;
    };

    /**
     * Gaussian random number
     * @returns {number}
     */
    Utility.gaussRandom = function () {
        if (retV) {
            retV = false;

            return vVal;
        }

        let u = 2 * Math.random() - 1,
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
        if (typeof opt === 'undefined') {
            return defaultValue;
        }
        return (typeof opt[fieldName] !== 'undefined') ? opt[fieldName] : defaultValue;
    };

    /**
     * Generate a UUID
     * @returns {String}
     */
    Utility.guid = function () {
        return (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0, 3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
    };

    /**
     *
     * @param h
     * @returns {Number}
     */
    Utility.hexToR = function (h) {
        return parseInt(h.substring(0, 2), 16);
    };

    /**
     *
     * @param h
     * @returns {Number}
     */
    Utility.hexToG = function (h) {
        return parseInt(h.substring(2, 4), 16);
    };

    /**
     *
     * @param h
     * @returns {Number}
     */
    Utility.hexToB = function (h) {
        return parseInt(h.substring(4, 6), 16);
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
     * Load JSON
     * @param file
     * @param callback
     */
    Utility.loadJSON = function (file, callback) {
        let xObj = new XMLHttpRequest();
        xObj.overrideMimeType("application/json");
        xObj.open('GET', file, true);
        xObj.onreadystatechange = function () {
            if (xObj.readyState === 4 && xObj.status === "200") {
                callback(xObj.responseText);
            }
        };
        xObj.send(null);
    };

    // return max and min of a given non-empty array.
    Utility.maxmin = function (w) {
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
     * Return a random Float within the range of a-b
     * @param {Float} lo
     * @param {Float} hi
     * @returns {number}
     */
    Utility.randf = function (lo, hi) {
        return Math.random() * (hi - lo) + lo;
    };

    /**
     * Return a random Integer within the range of a-b
     * @param {number} lo
     * @param {number} hi
     * @returns {number}
     */
    Utility.randi = function (lo, hi) {
        return Math.floor(this.randf(lo, hi));
    };

    /**
     * Return a random Number
     * @param {Float} mu
     * @param {Float} std
     * @returns {number}
     */
    Utility.randn = function (mu, std) {
        return mu + Utility.gaussRandom() * std;
    };

    // create random permutation of numbers, in range [0...n-1]
    Utility.randperm = function (n) {
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
     * Convert an RGB to Hex color value
     * @param {number} R
     * @param {number} G
     * @param {number} B
     * @returns {string}
     */
    Utility.rgbToHex = function (R, G, B) {
        return '0x' + Utility.toHex(R) + Utility.toHex(G) + Utility.toHex(B);
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
     * Do stuff
     * @returns {number}
     */
    Utility.S4 = function () {
        return (((1 + Math.random()) * 0x10000) || 0).toString(16).substring(1);
    };

    /**
     * Convert to a hex color
     * @param {string} n
     * @returns {*}
     */
    Utility.toHex = function (n) {
        n = parseInt(n, 10);
        if (isNaN(n)) {
            return '00';
        }
        n = Math.max(0, Math.min(n, 255));

        return '0123456789ABCDEF'.charAt((n - n % 16) / 16) + '0123456789ABCDEF'.charAt(n % 16);
    };

    // sample from list lst according to probabilities in list probs
    // the two lists are of same size, and probs adds up to 1
    Utility.weightedSample = function (lst, probs) {
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
     * A helper function returns array of zeros of length n
     * and uses typed arrays if available
     * @param {number} n
     * @returns {Float64Array}
     */
    Utility.zeros = function (n) {
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

    global.Utility = Utility;

}(this));