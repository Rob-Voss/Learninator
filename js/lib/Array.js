var Array = Array || {};

(function (global) {
    "use strict";

    /**
     * Array Remove - By John Resig (MIT Licensed)
     * @param {number} from
     * @param {number} to
     * @returns {number}
     */
    Array.prototype.remove = function (from, to) {
        let rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;

        return this.push.apply(this, rest);
    };

    /**
     * Returns min, max and indices of an array
     * @param {Array} arr
     * @returns {Object}
     */
    Array.prototype.maxmin = function (arr) {
        if (arr.length === 0) {
            return {};
        }

        let maxV = arr[0],
            minV = arr[0],
            maxI = 0,
            minI = 0;

        for (let i = 1; i < arr.length; i++) {
            if (arr[i] > maxV) {
                maxV = arr[i];
                maxI = i;
            }
            if (arr[i] < minV) {
                minV = arr[i];
                minI = i;
            }
        }

        let maxMin = {
            maxi: maxI,
            maxv: maxV,
            mini: minI,
            minv: minV,
            dv: maxV - minV
        };

        return maxMin;
    };

    /**
     * Find an element
     * @param {Function} predicate
     * @returns {*}
     */
    Array.prototype.find = function (predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        let list = Object(this),
            length = list.length >>> 0,
            thisArg = arguments[1],
            value;

        for (let i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };

    /**
     * Find the index of an element
     * @param {Function} predicate
     * @returns {number}
     */
    Array.prototype.findIndex = function (predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.findIndex called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        let list = Object(this),
            length = list.length >>> 0,
            thisArg = arguments[1],
            value;

        for (let i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return i;
            }
        }
        return -1;
    };

    global.Array = Array;

}(this));