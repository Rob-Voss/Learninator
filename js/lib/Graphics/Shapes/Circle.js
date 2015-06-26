var Circle = Circle || {};
var Utility = Utility || {};

(function (global) {
    "use strict";

    /**
     * The Circle object is an area defined by its pos, as indicated by its
     * center point (x, y) and by its radius.
     *
     * @class Circle
     * @constructor
     * @param center {Vec} The point of the center of the circle
     * @param radius {Number} The radius of the circle
     * @param scale {Number} The scale of the circle
     */
    var Circle = function (v, radius, scale) {
        /**
         * The center of the circle
         *
         * @property pos
         * @type Vec
         */
        this.pos = v || new Vec(1, 1);

        /**
         * The unscaled radius of the circle
         *
         * @property _radius
         * @type Number
         * @default 0
         * @private
         */
        this._radius = radius || 0;

        /**
         * The radius of the circle
         *
         * @property radius
         * @type Number
         * @default 0
         */
        this.radius = radius || 0;

        /**
         * The scale of the circle
         *
         * @property scale
         * @type Vec
         * @default new Vec(1, 1)
         */
        this.scale = scale || new Vec(1, 1);

        this.reCalc();
    };

    Circle.prototype = {
        /**
         * Creates a clone of this Circle instance
         *
         * @method clone
         * @return {Circle} a copy of the circle
         */
        clone: function () {
            return new Circle(this.pos, this.radius, this.scale);
        },
        /**
         * Copies the values from another circle to this one
         *
         * @method copy
         * @param circle {Circle} The circle to copy vlaues from
         * @return {Circle} Returns itself.
         * @chainable
         */
        copy: function (circle) {
            this.pos = circle.pos;
            this.radius = circle.radius;
            this.scale = circle.scale;

            return this;
        },
        /**
         * Checks if the x, and y coords passed to this function are contained within this circle,
         * or on the edge of the circle
         *
         * @method contains
         * @param v {Vec} The Vector coords of the point to test
         * @return {Boolean} if the x/y coords are within this polygon
         */
        contains: function (v) {
            if (this.radius <= 0)
                return false;

            var dx = (v.x - this.pos.x),
                dy = (v.y - this.pos.y),
                r2 = this.radius * this.radius;

            dx *= dx;
            dy *= dy;

            return (dx + dy <= r2);
        },
        /**
         * Checks if this circle overlaps another
         *
         * @method overlaps
         * @param circle {Circle} The circle to check if this overlaps
         * @return {Boolean} if the circle overlaps
         */
        overlaps: function (circle) {
            var differenceV = this.pos.clone().sub(circle.pos),
                totalRadius = this.radius + circle.radius,
                totalRadiusSq = totalRadius * totalRadius,
                distanceSq = differenceV.lengthSq();

            //if distanceSq is greater than totalRadiusSq then they do not intersect,
            //so we return the inverse of that value.
            /*jshint -W018*/
            return !(distanceSq > totalRadiusSq);
        },
        /**
         * Checks if this circle's values are equal to anothers
         *
         * @method equals
         * @param circle {Circle} The circle to check against
         * @return {Boolean} True if they are equal
         */
        equals: function (circle) {
            return this.pos.equals(circle.pos) &&
                this.radius === circle.radius;
        },
        /**
         * Recalculates the scaled radius
         *
         * @method reCalc
         * @return {Circle} Returns itself.
         * @chainable
         */
        reCalc: function () {
            this.radius = this._radius * this.scale.x;

            return this;
        },
        /**
         * The circumference of the circle
         *
         * @property circumference
         * @type Number
         * @readOnly
         */
        circumfrence: function () {
            return 2 * (Math.PI * this.radius);
        },

        /**
         * The area of the circle
         *
         * @property area
         * @type Number
         * @readOnly
         */
        area: function () {
            return Math.PI * this.radius * this.radius;
        }
    };

    global.Circle = Circle;

}(this));
