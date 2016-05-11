(function (global) {
    "use strict";

    /**
     * Simple Point
     * @name Point
     * @constructor
     *
     * @param {number} x
     * @param {number} y
     * @returns {Point}
     */
    var Point = function (x, y) {
        this.x = x;
        this.y = y;

        return this;
    };
    global.Point = Point;

    /**
     * A Cube
     * @name Cube
     * @constructor
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {Layout} layout
     * @returns {Cube}
     */
    var Cube = function (x, y, z, layout) {
        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    };

    Cube.prototype = {
        /**
         * Check if this Cube is equal to another
         * @param {Cube} other
         * @returns {boolean}
         */
        equals: function (other) {
            return this.x === other.x && this.y === other.y && this.z === other.z;
        },
        /**
         * Get an array of coords
         * @returns {*[]}
         */
        toArray: function () {
            return [this.x, this.y, this.z];
        },
        /**
         * Get an a string of coords
         * @returns {string}
         */
        toString: function () {
            return this.v().join(",");
        },
        /**
         * Rotate the Cube to the left
         * @returns {Cube}
         */
        rotateLeft: function () {
            return new Cube(-this.y, -this.z, -this.x);
        },
        /**
         * Rotate the Cube to the right
         * @returns {Cube}
         */
        rotateRight: function () {
            return new Cube(-this.z, -this.x, -this.y);
        }
    };
    global.Cube = Cube;

    /**
     * A Hex
     * @name Hex
     * @constructor
     *
     * @param {number} q
     * @param {number} r
     * @param {number} s
     * @param {Vec|Point} position
     * @param {number} size
     * @param {boolean} pointy
     * @returns {Hex}
     */
    var Hex = function (q, r, s, position, size, pointy) {
        this.q = q || 0;
        this.r = r || 0;
        this.s = s || -q - r;
        this.position = position || new Point(0, 0);
        this.size = size || 10;
        this.pointy = pointy || false;
        this.visited = false;
        this.parent = null;
        this.heuristic = 0;
        this.reward = 0;
        this.corners = [];
        this.population = new Map();
        this.corners = [];
        this.walls = [];
        for (let i = 0; i < 6; i++) {
            var angleAdd = (this.pointy) ? 30 : 0,
                angleDeg = 60 * i + angleAdd,
                angleRad = Math.PI / 180 * angleDeg;
            this.corners.push(new Point(this.position.x + this.size * Math.cos(angleRad),
                this.position.y + this.size * Math.sin(angleRad)));
        }
        for (let c = 0; c < this.corners.length; c++) {
            let x1 = this.corners[c].x,
                y1 = this.corners[c].y,
                x2, y2;
            if (c !== this.corners.length - 1) {
                x2 = this.corners[c + 1].x;
                y2 = this.corners[c + 1].y;
            } else {
                x2 = this.corners[0].x;
                y2 = this.corners[0].y;
            }
            let v1 = new Vec(x1, y1),
                v2 = new Vec(x2, y2);
            this.walls.push(new Wall(v1, v2));
        }

        this.color = this.colorForHex();
        this.shape = new PIXI.Graphics();
        this.shape.clear();
        this.shape.lineStyle(1, 0x000000, 1);
        this.shape.beginFill(this.color);
        for (let i = 0; i < this.corners.length; i++) {
            if (i === 0) {
                this.shape.moveTo(this.corners[i].x, this.corners[i].y);
            } else {
                this.shape.lineTo(this.corners[i].x, this.corners[i].y);
            }
        }
        this.shape.endFill();
        this.shape.interactive = true;
        this.shape
            .on('mousedown', (event) => {
                this.data = event.data;
                this.color = 0x00FF00;
            })
            .on('mouseup', (event) => {
                this.color = this.colorForHex(this.q, this.r, this.s);
            })
            .on('mouseover', (event) => {
                this.color = 0xFF0000;
            })
            .on('mouseout', (event) => {
                this.color = this.colorForHex(this.q, this.r, this.s);
            });
        this.bounds = this.shape.getBounds();

        return this;
    };

    Hex.prototype = {
        /**
         * Add a Hex to another one
         * @param {Hex} a
         * @param {Hex} b
         * @returns {Hex}
         */
        add: function (a, b) {
            return new Hex(a.q - b.q, a.r - b.r, a.s + b.s);
        },
        /**
         * Return a color for this Hex based on it's coords
         * x = green, y = purple, z = blue
         * @returns {number}
         */
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
        /**
         * Get the diagonal coords for this Hex
         * @param {number} direction
         * @returns {*}
         */
        diagonals: function (direction) {
            return hexDiagonals[direction];
        },
        /**
         * Get the neighbor
         * @param {number} direction
         * @returns {*|Hex}
         */
        diagonalNeighbor: function (hex, direction) {
            return this.add(hex, this.diagonals[direction]);
        },
        /**
         * Get the direction
         * @param {number} direction
         * @returns {*}
         */
        direction: function (direction) {
            return hexDirections[direction];
        },
        /**
         * Distance from another Hex
         * @param {Hex} a
         * @param {Hex} b
         * @returns {Hex}
         */
        distance: function (a, b) {
            return this.len(this.subtract(a, b));
        },
        draw: function () {
            this.shape.clear();
            this.shape.lineStyle(1, 0xFF0000, 0.9);
            this.shape.beginFill(this.color, 0.09);
            for (let i = 0; i <= this.corners.length; i++) {
                if (i === 0) {
                    this.shape.moveTo(this.corners[i].x, this.corners[i].y);
                } else if (i === 6) {
                    this.shape.lineTo(this.corners[0].x, this.corners[0].y);
                } else {
                    this.shape.lineTo(this.corners[i].x, this.corners[i].y);
                }
            }
            this.shape.endFill();

            if (this.cheatOverlay !== undefined) {
                this.shape.removeChild(this.cheatOverlay);
            }
            this.cheatOverlay = new PIXI.Container();

            let txtOpts = {font: "10px Arial", fill: "#000000", align: "center"},
                posText = new PIXI.Text(this.hex.toString() + "\n" + this.position.toString(), txtOpts);
            posText.position.set(this.position.x - this.size / 2, this.position.y - 7);
            this.cheatOverlay.addChild(posText);

            this.shape.addChild(this.cheatOverlay);

            return this;
        },
        /**
         * Get the length of the Hex
         * @returns {number}
         */
        len: function (hex) {
            return Math.trunc((Math.abs(hex.q) + Math.abs(hex.r) + Math.abs(hex.s)) / 2);
        },
        /**
         * Perform a linear interpolation on the Hex
         * @param {Hex} a
         * @param {Hex} b
         * @param {number} t
         * @returns {Hex}
         */
        lerp: function (a, b, t) {
            return new Hex(a.q + (b.q - a.q) * t, a.r + (b.r - a.r) * t);
        },
        /**
         * Return the coords to draw a line from one Hex to another
         * @param {Hex} a
         * @param {Hex} b
         * @returns {Array}
         */
        lineDraw: function (a, b) {
            var N = this.distance(a, b),
                results = [],
                step = 1.0 / Math.max(N, 1);
            for (let i = 0; i <= N; i++) {
                results.push(this.round(this.lerp(a, b, step * i)));
            }

            return results;
        },
        /**
         * Get the neighbor
         * @param {Hex} hex
         * @param {number} direction
         * @returns {*|Hex}
         */
        neighbor: function (hex, direction) {
            return this.add(hex, this.direction(direction));
        },
        /**
         * Round the Hex
         * @param {Hex} hex
         * @returns {Hex}
         */
        round: function (hex) {
            let q = Math.trunc(Math.round(hex.q)),
                r = Math.trunc(Math.round(hex.r)),
                s = Math.trunc(Math.round(hex.s)),
                qDiff = Math.abs(q - hex.q),
                rDiff = Math.abs(r - hex.r),
                sDiff = Math.abs(s - hex.s);
            if (qDiff > rDiff && qDiff > sDiff) {
                q = -r - s;
            } else if (rDiff > sDiff) {
                r = -q - s;
            } else {
                s = -q - r;
            }

            return new Hex(q, r, s);
        },
        /**
         * Scale the Hex according to the scalar
         * @param {Hex} hex
         * @param {number} k
         * @returns {Hex}
         */
        scale: function (hex, k) {
            return new Hex(hex.q * k, hex.r * k, hex.s * k);
        },
        /**
         * Subtract a Hex
         * @param {Hex} a
         * @param {Hex} b
         * @returns {Hex}
         */
        subtract: function (a, b) {
            return new Hex(a.q - b.q, a.r - b.r, a.s - b.s);
        },
        /**
         * Get an array of coords
         * @returns {*[]}
         */
        toArray: function () {
            return [this.q, this.r, this.s];
        },
        /**
         * Convert coords to string
         * @returns {string}
         */
        toString: function () {
            return this.q + ":" + this.r + ":" + this.s;
        }
    };
    global.Hex = Hex;

    var hexDirections = [new Hex(1, 0, -1), new Hex(1, -1, 0), new Hex(0, -1, 1), new Hex(-1, 0, 1), new Hex(-1, 1, 0), new Hex(0, 1, -1)],
        hexDiagonals = [new Hex(2, -1, -1), new Hex(1, -2, 1), new Hex(-1, -1, 2), new Hex(-2, 1, 1), new Hex(-1, 2, -1), new Hex(1, 1, -2)];
    global.Hex.hexDirections = hexDirections;
    global.Hex.hexDiagonals = hexDiagonals;


})(this);
