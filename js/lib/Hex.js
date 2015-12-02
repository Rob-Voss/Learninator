(function (global) {
    "use strict";

    var Cube = function (x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    };

    Cube.prototype = {
        toString: function () {
            return this.v().join(",");
        },
        v: function () {
            return [this.x, this.y, this.z];
        },
        rotateLeft: function () {
            return new Cube(-this.y, -this.z, -this.x);
        },
        rotateRight: function () {
            return new Cube(-this.z, -this.x, -this.y);
        },
        equals: function (other) {
            return this.x === other.x && this.y === other.y && this.z === other.z;
        }
    };

    var Hex = function (q, r, s, position, size, pointy) {
        var _this = this;
        this.q = q || 0;
        this.r = r || 0;
        this.s = s || -q - r;
        this.position = position || new Point(0, 0);
        this.size = size || 10;
        this.pointy = pointy || false;
        this.corners = [];
        for (let i = 0; i < 6; i++) {
            var angleAdd = (this.pointy) ? 30 : 0,
                angleDeg = 60 * i + angleAdd,
                angleRad = Math.PI / 180 * angleDeg;
            this.corners.push(new Point(this.position.x + this.size * Math.cos(angleRad),
                this.position.y + this.size * Math.sin(angleRad)));
        }

        //this.color = this.colorForHex();
        this.shape = new PIXI.Graphics();
        this.shape.lineStyle(1, 0x000000, 1);
        this.shape.alpha = 1;
        this.shape.interactive = true;
        //this.shape.beginFill(this.color);
        this.shape.drawPolygon(this.corners);
        //this.shape.endFill();
        this.shape.hitArea = new PIXI.Polygon(this.corners);

        this.shape.mouseover = function (mouseData) {
            console.log(_this.toString());
        };

        this.shape.click = function (mouseData) {
            console.log(_this.toString());
        };
        return this;
    };

    Hex.prototype = {
        add: function (b) {
            return new Hex(this.q + b.q, this.r + b.r, this.s + b.s);
        },
        colorForHex: function () {
            if (this.q === 0 && this.r === 0 && this.s === 0) {
                return 0x000000;
            } else if (this.q === 0) {
                return 0x59981b;
            } else if (this.r === 0) {
                return 0x0077b3;
            } else if (this.s === 0) {
                return 0xb34db2;
            } else {
                return 0xC0C0C0;
            }
        },
        diagonals: function (direction) {
            return hexDiagonals[direction];
        },
        diagonalNeighbor: function (direction) {
            return this.add(this.diagonals[direction]);
        },
        direction: function (direction) {
            return hexDirections[direction];
        },
        distance: function (b) {
            return this.length(this.subtract(b));
        },
        draw: function (withLabels) {

        },
        length: function () {
            return Math.trunc((Math.abs(this.q) + Math.abs(this.r) + Math.abs(this.s)) / 2);
        },
        lerp: function (b, t) {
            this.q += (b.q - this.q) * t;
            this.r += (b.r - this.r) * t;
            this.s += (b.s - this.s) * t;

            return this;
        },
        lineDraw: function (b) {
            var N = this.distance(b),
                results = [],
                step = 1.0 / Math.max(N, 1);

            for (let i = 0; i <= N; i++) {
                results.push(this.round(this.lerp(b, step * i)));
            }

            return results;
        },
        neighbor: function (direction) {
            return this.add(this.direction(direction));
        },
        round: function () {
            var q = Math.trunc(Math.round(this.q)),
                r = Math.trunc(Math.round(this.r)),
                s = Math.trunc(Math.round(this.s)),
                q_diff = Math.abs(q - this.q),
                r_diff = Math.abs(r - this.r),
                s_diff = Math.abs(s - this.s);

            if (q_diff > r_diff && q_diff > s_diff) {
                q = -r - s;
            } else if (r_diff > s_diff) {
                r = -q - s;
            } else {
                s = -q - r;
            }
            this.q = q;
            this.r = r;
            this.s = s;

            return this;
        },
        scale: function (k) {
            this.q *= k;
            this.r *= k;
            this.s *= k;

            return this;
        },
        subtract: function (b) {
            return new Hex(this.q - b.q, this.r - b.r, this.s - b.s);
        },
        toString: function () {
            return this.q + ":" + this.r + ":" + this.s;
        }
    };

    var hexDirections = [new Hex(1, 0, -1), new Hex(1, -1, 0), new Hex(0, -1, 1), new Hex(-1, 0, 1), new Hex(-1, 1, 0), new Hex(0, 1, -1)],
        hexDiagonals = [new Hex(2, -1, -1), new Hex(1, -2, 1), new Hex(-1, -1, 2), new Hex(-2, 1, 1), new Hex(-1, 2, -1), new Hex(1, 1, -2)];
    Hex.hexDirections = hexDirections;
    Hex.hexDiagonals = hexDiagonals;

    global.Cube = Cube;
    global.Hex = Hex;

})(this);
