(function (global) {
    "use strict";

    class Rectangle {

        constructor(arg0, arg1, arg2, arg3) {
            var type = typeof arg0,
                read = 0;
            if (type === 'number') {
                this.x = arg0;
                this.y = arg1;
                this.width = arg2;
                this.height = arg3;
                read = 4;
            } else if (type === 'undefined' || arg0 === null) {
                this.x = this.y = this.width = this.height = 0;
                read = arg0 === null ? 1 : 0;
            } else if (arguments.length === 1) {
                if (Array.isArray(arg0)) {
                    this.x = arg0[0];
                    this.y = arg0[1];
                    this.width = arg0[2];
                    this.height = arg0[3];
                    read = 1;
                } else if (arg0.x !== undefined || arg0.width !== undefined) {
                    this.x = arg0.x || 0;
                    this.y = arg0.y || 0;
                    this.width = arg0.width || 0;
                    this.height = arg0.height || 0;
                    read = 1;
                } else if (arg0.from === undefined && arg0.to === undefined) {
                    this.x = this.y = this.width = this.height = 0;
                    this._set(arg0);
                    read = 1;
                }
            }
            if (!read) {
                var point = Point.readNamed(arguments, 'from'),
                    next = Base.peek(arguments);
                this.x = point.x;
                this.y = point.y;
                if (next && next.x !== undefined || Base.hasNamed(arguments, 'to')) {
                    var to = Point.readNamed(arguments, 'to');
                    this.width = to.x - point.x;
                    this.height = to.y - point.y;
                    if (this.width < 0) {
                        this.x = to.x;
                        this.width = -this.width;
                    }
                    if (this.height < 0) {
                        this.y = to.y;
                        this.height = -this.height;
                    }
                } else {
                    var size = Size.read(arguments);
                    this.width = size.width;
                    this.height = size.height;
                }
                read = arguments.__index;
            }
            //function() {
            //    return Base.each([
            //            ['Top', 'Left'], ['Top', 'Right'],
            //            ['Bottom', 'Left'], ['Bottom', 'Right'],
            //            ['Left', 'Center'], ['Top', 'Center'],
            //            ['Right', 'Center'], ['Bottom', 'Center']
            //        ],
            //        function(parts, index) {
            //            var part = parts.join('');
            //            var xFirst = /^[RL]/.test(part);
            //            if (index >= 4)
            //                parts[1] += xFirst ? 'Y' : 'X';
            //            var x = parts[xFirst ? 0 : 1],
            //                y = parts[xFirst ? 1 : 0],
            //                getX = 'get' + x,
            //                getY = 'get' + y,
            //                setX = 'set' + x,
            //                setY = 'set' + y,
            //                get = 'get' + part,
            //                set = 'set' + part;
            //            this[get] = function(_dontLink) {
            //                var ctor = _dontLink ? Point : LinkedPoint;
            //                return new ctor(this[getX](), this[getY](), this, set);
            //            };
            //            this[set] = function() {
            //                var point = Point.read(arguments);
            //                this[setX](point.x);
            //                this[setY](point.y);
            //            };
            //        }, {});
            //});
            if (this.__read) {
                this.__read = read;
            }
        }

        set(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            return this;
        }

        clone() {
            return new Rect(this.x, this.y, this.width, this.height);
        }

        equals(rect) {
            var rt = Base.isPlainValue(rect)
                ? Rectangle.read(arguments)
                : rect;
            return rt === this
                || rt && this.x === rt.x && this.y === rt.y
                && this.width === rt.width && this.height === rt.height
                || false;
        }

        toString() {
            var f = Formatter.instance;
            return '{ x: ' + f.number(this.x)
                + ', y: ' + f.number(this.y)
                + ', width: ' + f.number(this.width)
                + ', height: ' + f.number(this.height)
                + ' }';
        }

        serialize(options) {
            var f = options.formatter;
            return [f.number(this.x),
                f.number(this.y),
                f.number(this.width),
                f.number(this.height)];
        }

        getPoint(_dontLink) {
            var ctor = _dontLink ? Point : LinkedPoint;
            return new ctor(this.x, this.y, this, 'setPoint');
        }

        setPoint() {
            var point = Point.read(arguments);
            this.x = point.x;
            this.y = point.y;
        }

        getSize(_dontLink) {
            var ctor = _dontLink ? Size : LinkedSize;
            return new ctor(this.width, this.height, this, 'setSize');
        }

        setSize() {
            var size = Size.read(arguments);
            if (this._fixX)
                this.x += (this.width - size.width) * this._fixX;
            if (this._fixY)
                this.y += (this.height - size.height) * this._fixY;
            this.width = size.width;
            this.height = size.height;
            this._fixW = 1;
            this._fixH = 1;
        }

        getLeft() {
            return this.x;
        }

        setLeft(left) {
            if (!this._fixW)
                this.width -= left - this.x;
            this.x = left;
            this._fixX = 0;
        }

        getTop() {
            return this.y;
        }

        setTop(top) {
            if (!this._fixH)
                this.height -= top - this.y;
            this.y = top;
            this._fixY = 0;
        }

        getRight() {
            return this.x + this.width;
        }

        setRight(right) {
            if (this._fixX !== undefined && this._fixX !== 1)
                this._fixW = 0;
            if (this._fixW)
                this.x = right - this.width;
            else
                this.width = right - this.x;
            this._fixX = 1;
        }

        getBottom() {
            return this.y + this.height;
        }

        setBottom(bottom) {
            if (this._fixY !== undefined && this._fixY !== 1)
                this._fixH = 0;
            if (this._fixH)
                this.y = bottom - this.height;
            else
                this.height = bottom - this.y;
            this._fixY = 1;
        }

        getCenterX() {
            return this.x + this.width * 0.5;
        }

        setCenterX(x) {
            this.x = x - this.width * 0.5;
            this._fixX = 0.5;
        }

        getCenterY() {
            return this.y + this.height * 0.5;
        }

        setCenterY(y) {
            this.y = y - this.height * 0.5;
            this._fixY = 0.5;
        }

        getCenter(_dontLink) {
            var ctor = _dontLink ? Point : LinkedPoint;
            return new ctor(this.getCenterX(), this.getCenterY(), this, 'setCenter');
        }

        setCenter() {
            var point = Point.read(arguments);
            this.setCenterX(point.x);
            this.setCenterY(point.y);
            return this;
        }

        getArea() {
            return this.width * this.height;
        }

        isEmpty() {
            return this.width === 0 || this.height === 0;
        }

        contains(arg) {
            return arg && arg.width !== undefined
            || (Array.isArray(arg) ? arg : arguments).length == 4
                ? this._containsRectangle(Rectangle.read(arguments))
                : this._containsPoint(Point.read(arguments));
        }

        containsPoint(point) {
            var x = point.x,
                y = point.y;
            return x >= this.x && y >= this.y
                && x <= this.x + this.width
                && y <= this.y + this.height;
        }

        containsRectangle(rect) {
            var x = rect.x,
                y = rect.y;
            return x >= this.x && y >= this.y
                && x + rect.width <= this.x + this.width
                && y + rect.height <= this.y + this.height;
        }

        intersects() {
            var rect = Rectangle.read(arguments);
            return rect.x + rect.width > this.x
                && rect.y + rect.height > this.y
                && rect.x < this.x + this.width
                && rect.y < this.y + this.height;
        }

        touches() {
            var rect = Rectangle.read(arguments);
            return rect.x + rect.width >= this.x
                && rect.y + rect.height >= this.y
                && rect.x <= this.x + this.width
                && rect.y <= this.y + this.height;
        }

        intersect() {
            var rect = Rectangle.read(arguments),
                x1 = Math.max(this.x, rect.x),
                y1 = Math.max(this.y, rect.y),
                x2 = Math.min(this.x + this.width, rect.x + rect.width),
                y2 = Math.min(this.y + this.height, rect.y + rect.height);
            return new Rectangle(x1, y1, x2 - x1, y2 - y1);
        }

        unite() {
            var rect = Rectangle.read(arguments),
                x1 = Math.min(this.x, rect.x),
                y1 = Math.min(this.y, rect.y),
                x2 = Math.max(this.x + this.width, rect.x + rect.width),
                y2 = Math.max(this.y + this.height, rect.y + rect.height);
            return new Rectangle(x1, y1, x2 - x1, y2 - y1);
        }

        include() {
            var point = Point.read(arguments);
            var x1 = Math.min(this.x, point.x),
                y1 = Math.min(this.y, point.y),
                x2 = Math.max(this.x + this.width, point.x),
                y2 = Math.max(this.y + this.height, point.y);
            return new Rectangle(x1, y1, x2 - x1, y2 - y1);
        }

        expand() {
            var amount = Size.read(arguments),
                hor = amount.width,
                ver = amount.height;
            return new Rectangle(this.x - hor / 2, this.y - ver / 2,
                this.width + hor, this.height + ver);
        }

        scale(hor, ver) {
            return this.expand(this.width * hor - this.width,
                this.height * (ver === undefined ? hor : ver) - this.height);
        }
    }

    global.Rectangle = Rectangle;

}(this));
