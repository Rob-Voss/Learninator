var Hex = Hex || {},
    Cube = Cube || {},
    HexGrid = HexGrid || {},
    Layout = Layout || {},
    Orientation = Orientation || {},
    OffsetCoord = OffsetCoord || {};
/**
 * Inspired by https://github.com/RobertBrewitz/axial-hexagonal-grid
 */
(function (global) {
    "use strict";

    var HashTable = function (obj) {
        this.length = 0;
        this.items = {};
        for (let p in obj) {
            if (obj.hasOwnProperty(p)) {
                this.items[p] = obj[p];
                this.length++;
            }
        }
        /**
         *
         * @param key
         * @param value
         * @returns {undefined}
         */
        this.setItem = function (key, value) {
            let previous = undefined;
            if (this.hasItem(key)) {
                previous = this.items[key];
            } else {
                this.length++;
            }
            this.items[key] = value;

            return previous;
        };

        /**
         *
         * @param key
         */
        this.getItem = function (key) {
            return this.hasItem(key);
        };

        /**
         *
         * @param key
         * @returns {boolean}
         */
        this.hasItem = function (key) {
            return this.items.hasOwnProperty(key) ? this.items[key] : false;
        };

        /**
         *
         * @param key
         * @returns {*}
         */
        this.removeItem = function (key) {
            if (this.hasItem(key)) {
                let previous = this.items[key];
                this.length--;
                delete this.items[key];
                return previous;
            } else {
                return undefined;
            }
        };

        /**
         *
         * @returns {Array}
         */
        this.keys = function () {
            let keys = [];
            for (let k in this.items) {
                if (this.hasItem(k)) {
                    keys.push(k);
                }
            }
            return keys;
        };

        /**
         *
         * @returns {Array}
         */
        this.values = function () {
            var values = [];
            for (var k in this.items) {
                if (this.hasItem(k)) {
                    values.push(this.items[k]);
                }
            }
            return values;
        };

        /**
         *
         * @param fn
         */
        this.each = function (fn) {
            for (let k in this.items) {
                if (this.hasItem(k)) {
                    fn(k, this.items[k]);
                }
            }
        };

        /**
         *
         */
        this.clear = function () {
            this.items = {};
            this.length = 0;
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
        var self = this;
        this.q = q || 0;
        this.r = r || 0;
        this.s = s || -q - r;
        this.pos = position || new Point(0, 0);
        this.size = size || 10;
        this.pointy = pointy || false;
        this.population = [];
        this.corners = [];
        this.walls = [];
        for (let i = 0; i < 6; i++) {
            var angleAdd = (this.pointy) ? 30 : 0,
                angleDeg = 60 * i + angleAdd,
                angleRad = Math.PI / 180 * angleDeg;
            this.corners.push(new Point(this.pos.x + this.size * Math.cos(angleRad),
                this.pos.y + this.size * Math.sin(angleRad)));
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
        this.shape.interactive = true;
        this.shape
            .on('mousedown', function (event) {
                this.data = event.data;
                self.color = 0x00FF00;
            })
            .on('mouseup', function (event) {
                self.color = self.colorForHex();
            })
            .on('mouseover', function (event) {
                self.color = 0xFF0000;
            })
            .on('mouseout', function (event) {
                self.color = self.colorForHex();
            });
        this.shape.entity = self;
        this.shape.alpha = 0.09;
        this.shape.color = this.color;

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
        /**
         *
         */
        draw: function () {
            this.shape.clear();
            this.shape.lineStyle(1, 0x000000);
            this.shape.beginFill(this.color);
            this.shape.moveTo(this.corners[0].x, this.corners[0].y);
            this.shape.lineTo(this.corners[1].x, this.corners[1].y);
            this.shape.lineTo(this.corners[2].x, this.corners[2].y);
            this.shape.lineTo(this.corners[3].x, this.corners[3].y);
            this.shape.lineTo(this.corners[4].x, this.corners[4].y);
            this.shape.lineTo(this.corners[5].x, this.corners[5].y);
            this.shape.lineTo(this.corners[0].x, this.corners[0].y);
            this.shape.endFill();

            if (this.cheatOverlay !== undefined) {
                this.shape.removeChild(this.cheatOverlay);
            }
            this.cheatOverlay = new PIXI.Container();

            let txtOpts = {font: "10px Arial", fill: "#000000", align: "center"},
                posText = new PIXI.Text(this.toString(), txtOpts);
            posText.position.set(this.pos.x, this.pos.y + 13);
            this.cheatOverlay.addChild(posText);

            this.shape.addChild(this.cheatOverlay);
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
                q_diff = Math.abs(q - hex.q),
                r_diff = Math.abs(r - hex.r),
                s_diff = Math.abs(s - hex.s);
            if (q_diff > r_diff && q_diff > s_diff) {
                q = -r - s;
            } else if (r_diff > s_diff) {
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
            return [this.q, this.r, this.s];
        }
    };

    var hexDirections = [new Hex(1, 0, -1), new Hex(1, -1, 0), new Hex(0, -1, 1), new Hex(-1, 0, 1), new Hex(-1, 1, 0), new Hex(0, 1, -1)],
        hexDiagonals = [new Hex(2, -1, -1), new Hex(1, -2, 1), new Hex(-1, -1, 2), new Hex(-2, 1, 1), new Hex(-1, 2, -1), new Hex(1, 1, -2)];
    Hex.hexDirections = hexDirections;
    Hex.hexDiagonals = hexDiagonals;

    /**
     * A Cube
     * @name Cube
     * @constructor
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {Point} position
     * @param {number} size
     * @param {boolean} pointy
     * @returns {Cube}
     */
    var Cube = function (x, y, z, position, size, pointy) {
        Hex.call(this, x, y, position, size, pointy);

        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    };

    Cube.prototype = Object.create(Hex.prototype);
    Cube.prototype.constructor = Hex;

    /**
     * Check if this Cube is equal to another
     * @param {Cube} other
     * @returns {boolean}
     */
    Cube.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    };

    /**
     * Rotate the Cube to the left
     * @returns {Cube}
     */
    Cube.prototype.rotateLeft = function () {
        return new Cube(-this.y, -this.z, -this.x);
    };

    /**
     * Rotate the Cube to the right
     * @returns {Cube}
     */
    Cube.prototype.rotateRight = function () {
        return new Cube(-this.z, -this.x, -this.y);
    };

    /**
     * Get an array of coords
     * @returns {*[]}
     */
    Cube.prototype.v = function () {
        return [this.x, this.y, this.z];
    };

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
        this.xCount = this.width / this.tileSize;
        this.yCount = this.height / this.tileSize;
        this.cells = [];
        this.walls = [];
        this.map = new HashTable({});

        return this;
    };

    HexGrid.prototype = {
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
         * Convert from axial coords to Cube
         * @param {Hex} hex
         * @returns {Cube}
         */
        axialToCube: function (hex) {
            return new Cube(hex.q, hex.r, -hex.q - hex.r);
        },
        /**
         * Convert from Cube coords to axial
         * @param {Cube} cube
         * @returns {Hex}
         */
        cubeToAxial: function (cube) {
            return new Hex(cube.x, cube.y, -cube.x - cube.y);
        },
        /**
         * Get the cell at the axial coords
         * @param {number} q
         * @param {number} r
         * @returns {Hex}
         */
        getCellAt: function (q, r) {
            let column = this.map.hasItem(q),
                row = column ? column.hasItem(r) : false,
                cell = row ? row.hasItem(-q - r) : false;

            return cell;
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
            point = new Point(x, y);

            return point;
        },
        /**
         * Return a PIXI container with the grid
         * @returns {PIXI.Container|*}
         */
        getGrid: function () {
            let self = this,
                c = new PIXI.Container();

            this.cells.forEach(function (cell) {
                cell.population = [];
                c.addChild(cell.shape);
                cell.walls.forEach(function (wall) {
                    self.walls.push(wall);
                });
            });

            return c;
        },
        /**
         * Return the location of the entity within a grid
         * @param {Entity} entity
         * @returns {Object}
         */
        getGridLocation: function (entity) {
            let hex = this.pixelToHex(entity.pos.x, entity.pos.y, 1, true),
                cell = this.getCellAt(hex.q, hex.r);
            if (cell) {
                entity.gridLocation = cell;
            } else {
                entity.gridLocation = hex;
            }

            return entity;
        },
        /**
         * Add the cells to a hash map
         */
        mapCells: function () {
            let column, row, hex, self = this;
            this.cells.forEach(function (cell) {
                let center = self.getCenterXY(cell.q, cell.r);
                cell.pos.x = center.x;
                cell.pos.y = center.y;

                // check q
                column = self.map.hasItem(cell.q);
                if (!column) {
                    self.map.setItem(cell.q, new HashTable({}));
                    column = self.map.getItem(cell.q);
                }
                // check r
                row = column.hasItem(cell.r);
                if (!row) {
                    column.setItem(cell.r, new HashTable({}));
                    row = column.getItem(cell.r);
                }
                // check s
                hex = row.hasItem(cell.s);
                if (!hex) {
                    row.setItem(cell.s, cell);
                    hex = row.getItem(cell.s);
                }
            });
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
         * @param {number} scale
         * @param {boolean} round
         * @returns {Hex}
         */
        pixelToHex: function (x, y, scale, round) {
            let q, r, s, hex;
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
            if (round) {
                q = Math.round(q);
                r = Math.round(r);
                s = Math.round(-q - r);
            }
            hex = new Hex(q, r, s, this.getCenterXY(q, r), this.tileSize, this.pointyTiles);

            return hex;
        },
        /**
         * Get something
         * @param {Object} coords
         * @returns {Vec}
         */
        roundCube: function (coords) {
            let dx, dy, dz, rx, ry, rz, cube;
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
            cube = new Cube(rx, ry, rz);

            return cube;
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
            let currentRing, i, ref, hexes,
                self = this;
            if (solid) {
                let hex = new Hex(q, r, -q - r, this.getCenterXY(q, r), this.tileSize, this.pointyTiles);
                self.cells.push(hex);
            }
            for (currentRing = i = 1, ref = radius; 1 <= ref ? i <= ref : i >= ref; currentRing = 1 <= ref ? ++i : --i) {
                this.shapeRing(q, r, currentRing, false);
            }
            this.mapCells();

            return this.cells;
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
            let self = this;
            for (let q = q1; q <= q2; q++) {
                for (let r = r1; r <= r2; r++) {
                    let cell = new constructor(q, r, -q - r, this.getCenterXY(q, r), this.tileSize, this.pointyTiles);
                    this.cells.push(cell);
                }
            }
            this.mapCells();

            return this.cells;
        },
        /**
         * Create a rectangle of Hexes
         * @param {number} w
         * @param {number} h
         * @param {Function} constructor
         * @returns {Array}
         */
        shapeRectangle: function (w, h, constructor) {
            let self = this,
                i1 = -Math.floor(w / 2),
                i2 = i1 + w,
                j1 = -Math.floor(h / 2),
                j2 = j1 + h;
            for (let j = j1; j < j2; j++) {
                let jOffset = -Math.floor(j / 2);
                for (let i = i1 + jOffset; i < i2 + jOffset; i++) {
                    let cell = new constructor(i, j, -i - j, this.getCenterXY(i, j), this.tileSize, this.pointyTiles);
                    this.cells.push(cell);
                }
            }
            this.mapCells();

            return this.cells;
        },
        /**
         * Create a ring of Hexes
         * @param {number} q
         * @param {number} r
         * @param {number} radius
         * @param {boolean} map
         * @returns {Array}
         */
        shapeRing: function (q, r, radius, map) {
            let i, j, len, moveDirection, moveDirectionIndex, moveDirections, ref,
                self = this;
            moveDirections = [[1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1], [1, 0], [1, -1]];
            for (moveDirectionIndex = i = 0, len = moveDirections.length; i < len; moveDirectionIndex = ++i) {
                moveDirection = moveDirections[moveDirectionIndex];
                for (j = 0, ref = radius - 1; 0 <= ref ? j <= ref : j >= ref; 0 <= ref ? j++ : j--) {
                    q += moveDirection[0];
                    r += moveDirection[1];
                    if (moveDirectionIndex !== 0) {
                        let cell = new Hex(q, r, -q - r, this.getCenterXY(q, r), this.tileSize, this.pointyTiles);
                        this.cells.push(cell);
                    }
                }
            }
            if (map === true) {
                this.mapCells();
            }

            return this.cells;
        },
        /**
         * Create a triangle of Hexes
         * @param {number} size
         * @returns {Array}
         */
        shapeTriangle1: function (size) {
            let self = this;
            for (let q = 0; q <= size; q++) {
                for (let r = 0; r <= size - q; r++) {
                    let cell = new Hex(q, r, -q - r, this.getCenterXY(q, r), this.tileSize, this.pointyTiles);
                    this.cells.push(cell);
                }
            }
            this.mapCells();

            return this.cells;
        },
        /**
         * Create a triangle of Hexes
         * @param {number} size
         * @returns {Array}
         */
        shapeTriangle2: function (size) {
            let self = this;
            for (let q = 0; q <= size; q++) {
                for (let r = size - q; r <= size; r++) {
                    let cell = new Hex(q, r, -q - r, this.getCenterXY(q, r), this.tileSize, this.pointyTiles);
                    this.cells.push(cell);
                }
            }
            this.mapCells();

            return this.cells;
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
         * @param hex
         * @returns {OffsetCoord}
         */
        qOffsetFromCube: function (offset, hex) {
            var col = hex.q,
                row = hex.r + Math.trunc((hex.q + offset * (hex.q & 1)) / 2);

            return new OffsetCoord(col, row);
        },
        /**
         *
         * @param offset
         * @param hex
         */
        qOffsetToCube: function (offset, hex) {
            var q = hex.col,
                r = hex.row - Math.trunc((hex.col + offset * (hex.col & 1)) / 2);

            return new Hex(q, r, -q - r);
        },
        /**
         *
         * @param offset
         * @param hex
         * @returns {OffsetCoord}
         */
        rOffsetFromCube: function (offset, hex) {
            var col = hex.q + Math.trunc((hex.r + offset * (hex.r & 1)) / 2),
                row = hex.r;

            return new OffsetCoord(col, row);
        },
        /**
         *
         * @param offset
         * @param hex
         */
        rOffsetToCube: function (offset, hex) {
            var q = hex.col - Math.trunc((hex.row + offset * (hex.row & 1)) / 2),
                r = hex.row;

            return new Hex(q, r, -q - r);
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
         * @param {Hex} hex
         * @returns {Point}
         */
        hexToPixel: function (hex) {
            let m = this.orientation,
                size = this.size,
                offset = this.origin,
                x = (m.f0 * hex.q + m.f1 * hex.r) * size.x,
                y = (m.f2 * hex.q + m.f3 * hex.r) * size.y;

            return new Point(x + offset.x, y + offset.y);
        },
        /**
         *
         * @param {Vec} p
         * @returns {Hex}
         */
        pixelToHex: function (p) {
            let m = this.orientation,
                size = this.size,
                offset = this.origin,
                pt = new Point((p.x - offset.x) / size.x, (p.y - offset.y) / size.y),
                q = m.b0 * pt.x + m.b1 * pt.y,
                r = m.b2 * pt.x + m.b3 * pt.y;

            return new Hex(q, r, -q - r);
        },
        /**
         *
         * @param corner
         * @returns {Point}
         */
        hexCornerOffset: function (corner) {
            let m = this.orientation,
                size = this.size,
                angle = 2.0 * Math.PI * (corner + m.startAngle) / 6;

            return new Point(size.x * Math.cos(angle), size.y * Math.sin(angle));
        },
        /**
         *
         * @param {Hex} hex
         * @returns {Array}
         */
        polygonCorners: function (hex) {
            let corners = [],
                center = this.hexToPixel(hex);
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

    global.Cube = Cube;
    global.Hex = Hex;

    global.HexGrid = HexGrid;
    global.Layout = Layout;
    global.OffsetCoord = OffsetCoord;
    global.Orientation = Orientation;

})(this);
