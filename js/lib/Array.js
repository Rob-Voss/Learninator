var Array = Array || {};

(function (global) {
    "use strict";

    // Array Remove - By John Resig (MIT Licensed)
    Array.prototype.remove = function (from, to) {
        var rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;

        return this.push.apply(this, rest);
    };

    /**
     * Returns min, max and indeces of an array
     * @param {Array} arr
     * @returns {Object}
     */
    Array.prototype.maxmin = function (arr) {
        if (arr.length === 0) {
            return {};
        }

        var maxv = arr[0],
            minv = arr[0],
            maxi = 0,
            mini = 0;

        for (var i = 1; i < arr.length; i++) {
            if (arr[i] > maxv) {
                maxv = arr[i];
                maxi = i;
            }
            if (arr[i] < minv) {
                minv = arr[i];
                mini = i;
            }
        }

        return {
            maxi: maxi,
            maxv: maxv,
            mini: mini,
            minv: minv,
            dv: maxv - minv
        };
    };

    /**
     *
     * @param predicate
     * @returns {*}
     */
    Array.prototype.find = function (predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };

    /**
     *
     * @param predicate
     * @returns {number}
     */
    Array.prototype.findIndex = function (predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.findIndex called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return i;
            }
        }
        return -1;
    };

    global.Array = Array;

}(this));