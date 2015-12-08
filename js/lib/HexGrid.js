var Hex = Hex || {},
    Cube = Cube || {},
    HexGrid = HexGrid || {},
    Layout = Layout || {},
    Orientation = Orientation || {},
    OffsetCoord = OffsetCoord || {};

(function (global) {
    "use strict";

    /**
     * A library for creating Hexagonal grids
     * @name HexGrid
     * @constructor
     *
     * @param {Object} opts
     * @returns {HexGrid}
     */
    var HexGrid = function (opts) {
        this.width = Utility.getOpt(opts, 'width', 600);
        this.height = Utility.getOpt(opts, 'height', 600);
        this.tileSize = Utility.getOpt(opts, 'tileSize', 20);
        this.tileSpacing = Utility.getOpt(opts, 'tileSpacing', 0);
        this.pointyTiles = Utility.getOpt(opts, 'pointyTiles', false);
        this.cells = [];

        return this;
    };

    HexGrid.prototype = {
        /**
         * Convert from axial coords to Cube
         * @param {Hex} hex
         * @returns {Cube}
         */
        axialToCube: function (hex) {
            let cube = new Cube(hex.q, hex.r, -hex.q - hex.r);

            return cube;
        },
        /**
         * Distance between two axial coords
         * @param {number} q1
         * @param {number} r1
         * @param {number} q2
         * @param {number} r2
         * @returns {number}
         */
        axialDistance: function (q1, r1, q2, r2) {
            return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(q1 + r1 - q2 - r2)) / 2;
        },
        /**
         * Convert from Cube coords to axial
         * @param {Cube} cube
         * @returns {Hex}
         */
        cubeToAxial: function (cube) {
            let hex = new Hex(cube.x, cube.y, -cube.x - cube.y);

            return hex;
        },
        /**
         * Return a PIXI container with the grid
         * @param {boolean} withLabels
         * @returns {PIXI.Container|*}
         */
        getGrid: function (withLabels) {
            let _this = this;

            this.cellsContainer = new PIXI.Container();
            this.cells.forEach(function (hex) {
                _this.cellsContainer.addChild(hex.shape);
            });

            return this.cellsContainer;
        },
        /**
         * Get the center x,y coords for a Hex
         * @param {number} q
         * @param {number} r
         * @returns {Point}
         */
        getCenterXY: function (q, r) {
            let x, y, point;
            if (this.pointyTiles) {
                x = (this.tileSize + this.tileSpacing) * Math.sqrt(3) * (q + r / 2);
                y = -((this.tileSize + this.tileSpacing) * 3 / 2 * r);
            } else {
                x = (this.tileSize + this.tileSpacing) * 3 / 2 * q;
                y = -((this.tileSize + this.tileSpacing) * Math.sqrt(3) * (r + q / 2));
            }
            point = new Point(x + this.width / 2, y + this.height / 2);

            return point;
        },
        /**
         * Return a Hex's neighbors
         * @param {number} q
         * @param {number} r
         * @returns {Array}
         */
        neighbors: function (q, r) {
            let i, len, neighbor, neighbors, result;
            result = [];
            neighbors = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
            for (i = 0, len = neighbors.length; i < len; i++) {
                neighbor = neighbors[i];
                result.push({
                    q: q + neighbor[0],
                    r: neighbor[1]
                });
            }

            return result;
        },
        /**
         * Convert from pixel coords to axial
         * @param {number} x
         * @param {number} y
         * @returns {Hex}
         */
        pixelToAxial: function (x, y) {
            let cube, decimalQR, roundedCube;
            decimalQR = this.pixelToDecimalQR(x, y);
            cube = this.axialToCube(decimalQR);
            roundedCube = this.roundCube(cube);

            return this.cubeToAxial(roundedCube);
        },
        /**
         *
         * @param x
         * @param y
         * @param scale
         * @returns {{q: *, r: *, s: number}}
         */
        pixelToDecimalQR: function (x, y, scale) {
            let q, r, hex;
            if (typeof scale !== "number") {
                scale = 1;
            }
            if (this.pointyTiles) {
                q = (1 / 3 * Math.sqrt(3) * x - 1 / 3 * -y) / (this.tileSize + this.tileSpacing);
                r = 2 / 3 * -y / (this.tileSize + this.tileSpacing);
            } else {
                q = 2 / 3 * x / (this.tileSize + this.tileSpacing);
                r = (1 / 3 * Math.sqrt(3) * -y - 1 / 3 * x) / (this.tileSize + this.tileSpacing);
            }
            q /= scale;
            r /= scale;
            hex = new Hex(q, r, -q - r);

            return hex;
        },
        /**
         * Get something
         * @param {Object} coords
         * @returns {Vec}
         */
        roundCube: function (coords) {
            let dx, dy, dz, rx, ry, rz, vec;
            rx = Math.round(coords.x);
            ry = Math.round(coords.y);
            rz = Math.round(coords.z);
            dx = Math.abs(rx - coords.x);
            dy = Math.abs(ry - coords.y);
            dz = Math.abs(rz - coords.z);
            if (dx > dy && dx > dz) {
                rx = -ry - rz;
            } else if (dy > dz) {
                ry = -rx - rz;
            } else {
                rz = -rx - ry;
            }
            vec = new Vec(rx, ry, rz);

            return vec;
        },
        /**
         * Create a ring of Hexes
         * @param {number} q
         * @param {number} r
         * @param {number} radius
         * @returns {Array}
         */
        shapeRing: function (q, r, radius) {
            let i, j, len, moveDirection, moveDirectionIndex, moveDirections, ref, hexes;
            hexes = [];
            moveDirections = [[1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1], [1, 0], [1, -1]];
            for (moveDirectionIndex = i = 0, len = moveDirections.length; i < len; moveDirectionIndex = ++i) {
                moveDirection = moveDirections[moveDirectionIndex];
                for (j = 0, ref = radius - 1; 0 <= ref ? j <= ref : j >= ref; 0 <= ref ? j++ : j--) {
                    q += moveDirection[0];
                    r += moveDirection[1];
                    if (moveDirectionIndex !== 0) {
                        hexes.push(new Hex(q, r, -q - r, this.getCenterXY(q, r), this.tileSize, this.pointyTiles));
                    }
                }
            }
            this.cells = hexes;

            return hexes;
        },
        /**
         * Create a Hexagon of Hexes
         * @param {number} q
         * @param {number} r
         * @param {number} radius
         * @param {boolean} solid
         * @returns {Array}
         */
        shapeHexagon: function (q, r, radius, solid) {
            let currentRing, i, ref, hexes;
            hexes = [];
            if (solid) {
                hexes.push(new Hex(q, r, -q - r, this.getCenterXY(q, r), this.tileSize, this.pointyTiles));
            }

            for (currentRing = i = 1, ref = radius; 1 <= ref ? i <= ref : i >= ref; currentRing = 1 <= ref ? ++i : --i) {
                hexes = hexes.concat(this.ring(q, r, currentRing));
            }
            this.cells = hexes;

            return hexes;
        },
        /**
         * Create a rectangle of Hexes
         * @param {number} w
         * @param {number} h
         * @param {Function} constructor
         * @returns {Array}
         */
        shapeRectangle: function (w, h, constructor) {
            let hexes = [],
                i1 = -Math.floor(w / 2),
                i2 = i1 + w,
                j1 = -Math.floor(h / 2),
                j2 = j1 + h;
            for (let j = j1; j < j2; j++) {
                let jOffset = -Math.floor(j / 2);
                for (let i = i1 + jOffset; i < i2 + jOffset; i++) {
                    hexes.push(new constructor(i, j, -i - j, this.getCenterXY(i, j), this.tileSize, this.pointyTiles));
                }
            }
            this.cells = hexes;

            return hexes;
        },
        /**
         * Create a parallelogram of Hexes
         * @param {number} q1
         * @param {number} r1
         * @param {number} q2
         * @param {number} r2
         * @param {Function} constructor
         * @returns {Array}
         */
        shapeParallelogram: function (q1, r1, q2, r2, constructor) {
            let hexes = [];
            for (let q = q1; q <= q2; q++) {
                for (let r = r1; r <= r2; r++) {
                    hexes.push(new constructor(q, r, -q - r, this.getCenterXY(q, r), this.tileSize, this.pointyTiles));
                }
            }
            this.cells = hexes;

            return hexes;
        },
        /**
         * Create a triangle of Hexes
         * @param {number} size
         * @returns {Array}
         */
        shapeTriangle1: function (size) {
            let hexes = [];
            for (let q = 0; q <= size; q++) {
                for (let r = 0; r <= size - q; r++) {
                    hexes.push(new Hex(q, r, -q - r, this.getCenterXY(q, r), this.tileSize, this.pointyTiles));
                }
            }
            this.cells = hexes;

            return hexes;
        },
        /**
         * Create a triangle of Hexes
         * @param {number} size
         * @returns {Array}
         */
        shapeTriangle2: function (size) {
            let hexes = [];
            for (let q = 0; q <= size; q++) {
                for (let r = size - q; r <= size; r++) {
                    hexes.push(new Hex(q, r, -q - r, this.getCenterXY(q, r), this.tileSize, this.pointyTiles));
                }
            }
            this.cells = hexes;

            return hexes;
        }
    };

    /**
     *
     * @param col
     * @param row
     * @returns {OffsetCoord}
     * @constructor
     */
    var OffsetCoord = function (col, row) {
        this.col = col;
        this.row = row;
        this.EVEN = 1;
        this.ODD = -1;

        return this;
    };

    OffsetCoord.prototype = {
        /**
         *
         * @param offset
         * @param h
         * @returns {OffsetCoord}
         */
        qOffsetFromCube: function (offset, h) {
            var col = h.q,
                row = h.r + Math.trunc((h.q + offset * (h.q & 1)) / 2);

            return new OffsetCoord(col, row);
        },
        /**
         *
         * @param offset
         * @param h
         */
        qOffsetToCube: function (offset, h) {
            var q = h.col,
                r = h.row - Math.trunc((h.col + offset * (h.col & 1)) / 2),
                s = -q - r;

            return new Hex(q, r, s);
        },
        /**
         *
         * @param offset
         * @param h
         * @returns {OffsetCoord}
         */
        rOffsetFromCube: function (offset, h) {
            var col = h.q + Math.trunc((h.r + offset * (h.r & 1)) / 2),
                row = h.r;

            return new OffsetCoord(col, row);
        },
        /**
         *
         * @param offset
         * @param h
         */
        rOffsetToCube: function (offset, h) {
            var q = h.col - Math.trunc((h.row + offset * (h.row & 1)) / 2),
                r = h.row,
                s = -q - r;

            return new Hex(q, r, s);
        }
    };

    /**
     *
     * @param f0
     * @param f1
     * @param f2
     * @param f3
     * @param b0
     * @param b1
     * @param b2
     * @param b3
     * @param angle
     * @returns {Orientation}
     * @constructor
     */
    var Orientation = function (f0, f1, f2, f3, b0, b1, b2, b3, angle) {
        this.startAngle = angle;
        this.f0 = f0;
        this.f1 = f1;
        this.f2 = f2;
        this.f3 = f3;
        this.b0 = b0;
        this.b1 = b1;
        this.b2 = b2;
        this.b3 = b3;

        return this;
    };

    /**
     *
     * @param orientation
     * @param size
     * @param origin
     * @returns {Layout}
     * @constructor
     */
    var Layout = function (orientation, size, origin) {
        this.orientation = orientation;
        this.size = size;
        this.origin = origin;

        return this;
    };

    Layout.prototype = {
        /**
         *
         * @param h
         * @returns {i.Point|PIXI.Point|b.Point|*|Point}
         */
        hexToPixel: function (h) {
            let x = (this.orientation.f0 * h.q + this.orientation.f1 * h.r) * this.size.x,
                y = (this.orientation.f2 * h.q + this.orientation.f3 * h.r) * this.size.y;

            return new Point(x + this.origin.x, y + this.origin.y);
        },
        /**
         *
         * @param p
         */
        pixelToHex: function (p) {
            let pt = new Point((p.x - this.origin.x) / this.size.x, (p.y - this.origin.y) / this.size.y),
                q = this.orientation.b0 * pt.x + this.orientation.b1 * pt.y,
                r = this.orientation.b2 * pt.x + this.orientation.b3 * pt.y;

            return new Hex(q, r, -q - r);
        },
        /**
         *
         * @param corner
         * @returns {i.Point|PIXI.Point|b.Point|*|Point}
         */
        hexCornerOffset: function (corner) {
            let angle = 2.0 * Math.PI * (corner + this.orientation.startAngle) / 6;

            return new Point(this.size.x * Math.cos(angle), this.size.y * Math.sin(angle));
        },
        /**
         *
         * @param h
         * @returns {Array}
         */
        polygonCorners: function (h) {
            let corners = [],
                center = this.hexToPixel(h);
            for (let i = 0; i < 6; i++) {
                let offset = this.hexCornerOffset(i);
                corners.push(new Point(center.x + offset.x, center.y + offset.y));
            }

            return corners;
        }
    };

    var layoutPointy = new Orientation(Math.sqrt(3.0), Math.sqrt(3.0) / 2.0, 0.0, 3.0 / 2.0, Math.sqrt(3.0) / 3.0, -1.0 / 3.0, 0.0, 2.0 / 3.0, 0.5),
        layoutFlat = new Orientation(3.0 / 2.0, 0.0, Math.sqrt(3.0) / 2.0, Math.sqrt(3.0), 2.0 / 3.0, 0.0, -1.0 / 3.0, Math.sqrt(3.0) / 3.0, 0.0);
    Layout.layoutPointy = layoutPointy;
    Layout.layoutFlat = layoutFlat;

    /**
     * A Cube
     * @name Cube
     * @constructor
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Cube}
     */
    var Cube = function (x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    };

    Cube.prototype = {
        /**
         * Convert coords to string
         * @returns {string}
         */
        toString: function () {
            return this.v().join(",");
        },
        /**
         * Get an array of coords
         * @returns {*[]}
         */
        v: function () {
            return [this.x, this.y, this.z];
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
        },
        /**
         * Check if this Cube is equal to another
         * @param {Cube} other
         * @returns {boolean}
         */
        equals: function (other) {
            return this.x === other.x && this.y === other.y && this.z === other.z;
        }
    };

    /**
     * A Hex
     * @name Hex
     * @constructor
     *
     * @param {number} q
     * @param {number} r
     * @param {number} s
     * @param {Point} position
     * @param {number} size
     * @param {boolean} pointy
     * @returns {Hex}
     */
    var Hex = function (q, r, s, position, size, pointy) {
        var _this = this;
        this.q = q || 0;
        this.r = r || 0;
        this.s = s || -q - r;
        this.pos = position || new Point(0, 0);
        this.size = size || 10;
        this.pointy = pointy || false;
        this.corners = [];
        this.hitCoords = [];
        for (let i = 0; i < 6; i++) {
            var angleAdd = (this.pointy) ? 30 : 0,
                angleDeg = 60 * i + angleAdd,
                angleRad = Math.PI / 180 * angleDeg;
            this.corners.push(new Point(this.pos.x + this.size * Math.cos(angleRad),
                this.pos.y + this.size * Math.sin(angleRad)));
            this.hitCoords.push(this.pos.x + this.size * Math.cos(angleRad),
                this.pos.y + this.size * Math.sin(angleRad));
        }

        this.color = this.colorForHex();
        this.shape = new PIXI.Graphics();
        this.shape.lineStyle(1, 0x000000, 1);
        this.shape.alpha = 0.5;
        this.shape.interactive = true;
        this.shape.beginFill(this.color);
        this.shape.drawPolygon(this.corners);
        this.shape.endFill();
        this.shape.hitArea = new PIXI.Polygon(this.hitCoords);

        this.shape.mouseover = function (mouseData) {
            console.log(_this.toString());
        };

        this.shape.click = function (mouseData) {
            console.log(_this.toString());
        };
        return this;
    };

    Hex.prototype = {
        /**
         * Add a Hex to this one
         * @param {Hex} hex
         * @returns {Hex}
         */
        add: function (hex) {
            return new Hex(this.q + hex.q, this.r + hex.r, this.s + hex.s);
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
        diagonalNeighbor: function (direction) {
            return this.add(this.diagonals[direction]);
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
         * @param {Hex} hex
         * @returns {*}
         */
        distance: function (hex) {
            return this.length(this.subtract(hex));
        },
        /**
         * Get the length of the Hex
         * @returns {number}
         */
        length: function () {
            return Math.trunc((Math.abs(this.q) + Math.abs(this.r) + Math.abs(this.s)) / 2);
        },
        /**
         * Perform a linear interpolation on the Hex
         * @param {Hex} hex
         * @param {number} t
         * @returns {Hex}
         */
        lerp: function (hex, t) {
            this.q += (hex.q - this.q) * t;
            this.r += (hex.r - this.r) * t;
            this.s += (hex.s - this.s) * t;

            return this;
        },
        /**
         * Return the coords to draw a line from one Hex to another
         * @param {Hex} hex
         * @returns {Array}
         */
        lineDraw: function (hex) {
            var N = this.distance(hex),
                results = [],
                step = 1.0 / Math.max(N, 1);

            for (let i = 0; i <= N; i++) {
                results.push(this.round(this.lerp(hex, step * i)));
            }

            return results;
        },
        /**
         * Get the neighbor
         * @param {number} direction
         * @returns {*|Hex}
         */
        neighbor: function (direction) {
            return this.add(this.direction(direction));
        },
        /**
         * Round the Hex
         * @returns {Hex}
         */
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
        /**
         * Scale the Hex according to the scalar
         * @param {number} s
         * @returns {Hex}
         */
        scale: function (s) {
            this.q *= s;
            this.r *= s;
            this.s *= s;

            return this;
        },
        /**
         * Subtract a Hex
         * @param {Hex} hex
         * @returns {Hex}
         */
        subtract: function (hex) {
            return new Hex(this.q - hex.q, this.r - hex.r, this.s - hex.s);
        },
        /**
         * Convert the Hex coords to a string
         * @returns {string}
         */
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

    global.HexGrid = HexGrid;
    global.Layout = Layout;
    global.OffsetCoord = OffsetCoord;
    global.Orientation = Orientation;

})(this);
