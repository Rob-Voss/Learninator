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

    /**
     * Create a Hexagon of Hexes
     * @param {number} size
     * @param {Layout} layout
     * @returns {Array}
     */
    function shapeHexagon(size, layout) {
        let cells = [];
        for (let q = -size; q <= size; q++) {
            let r1 = Math.max(-size, -q - size),
                r2 = Math.min(size, -q + size);
            for (let r = r1; r <= r2; r++) {
                cells.push(new Hex(q, r, -q - r));
            }
        }

        return cells;
    }

    /**
     * Create a parallelogram of Hexes
     * @param {number} q1
     * @param {number} r1
     * @param {number} q2
     * @param {number} r2
     * @param {Function} constructor
     * @returns {Array}
     */
    function shapeParallelogram(q1, r1, q2, r2, constructor) {
        let cells = [];
        for (let q = q1; q <= q2; q++) {
            for (let r = r1; r <= r2; r++) {
                let cell = new constructor(q, r, -q - r);
                cells.push(cell);
            }
        }

        return cells;
    }

    /**
     * Create a rectangle of Hexes
     * @param {number} w
     * @param {number} h
     * @param {Function} constructor
     * @returns {Array}
     */
    function shapeRectangle(w, h, constructor) {
        let cells = [],
            i1 = -Math.floor(w / 2),
            i2 = i1 + w,
            j1 = -Math.floor(h / 2),
            j2 = j1 + h;
        for (let j = j1; j < j2; j++) {
            let jOffset = -Math.floor(j / 2);
            for (let i = i1 + jOffset; i < i2 + jOffset; i++) {
                let cell = new constructor(i, j, -i - j);
                cells.push(cell);
            }
        }

        return cells;
    }

    /**
     * Create a ring of Hexes
     * @param {number} q
     * @param {number} r
     * @param {number} radius
     * @returns {Array}
     */
    function shapeRing(q, r, radius) {
        let i, j, len, moveDirection, moveDirectionIndex, moveDirections, ref, cells = [];
        moveDirections = [[1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1], [1, 0], [1, -1]];
        for (moveDirectionIndex = i = 0, len = moveDirections.length; i < len; moveDirectionIndex = ++i) {
            moveDirection = moveDirections[moveDirectionIndex];
            for (j = 0, ref = radius - 1; 0 <= ref ? j <= ref : j >= ref; 0 <= ref ? j++ : j--) {
                q += moveDirection[0];
                r += moveDirection[1];
                if (moveDirectionIndex !== 0) {
                    let cell = new Hex(q, r, -q - r);
                    cells.push(cell);
                }
            }
        }

        return cells;
    }

    /**
     * Create a triangle of Hexes
     * @param {number} size
     * @returns {Array}
     */
    function shapeTriangle1(size) {
        let cells = [];
        for (let q = 0; q <= size; q++) {
            for (let r = 0; r <= size - q; r++) {
                let cell = new Hex(q, r, -q - r);
                cells.push(cell);
            }
        }

        return cells;
    }

    /**
     * Create a triangle of Hexes
     * @param {number} size
     * @returns {Array}
     */
    function shapeTriangle2(size) {
        let cells = [];
        for (let q = 0; q <= size; q++) {
            for (let r = size - q; r <= size; r++) {
                let cell = new Hex(q, r, -q - r);
                cells.push(cell);
            }
        }

        return cells;
    }

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
     * A library for creating Hexagonal grids
     * @name HexGrid
     * @constructor
     *
     * @param {Object} opts
     * @param {Array} cells
     * @param {Layout} layout
     * @returns {HexGrid}
     */
    var HexGrid = function (opts, cells, layout) {
        let self = this;
        this.width = Utility.getOpt(opts, 'width', 600);
        this.height = Utility.getOpt(opts, 'height', 600);
        this.tileSize = Utility.getOpt(opts, 'tileSize', 20);
        this.tileSpacing = Utility.getOpt(opts, 'tileSpacing', 0);
        this.fill = Utility.getOpt(opts, 'fill', false);
        this.xCount = this.width / this.tileSize;
        this.yCount = this.height / this.tileSize;
        this.layout = layout || new Layout(Layout.layoutPointy, new Point(this.xCount, this.yCount), new Point(this.width / 2, this.height / 2));
        this.cells = cells || shapeHexagon(5, this.layout);
        this.map = new HashTable({});
        this.walls = [];

        this.cellsContainer = new PIXI.Container();
        this.cells.forEach(function (cell) {
            cell.population = [];
            cell.corners = self.layout.polygonCorners(cell);
            HexShape.call(cell, self.layout, self.tileSize, self.fill);
            self.cellsContainer.addChild(cell.shape);
        });

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
            return this.layout.hexToPixel(new Hex(q, r, -q - r));
        },
        /**
         * Return the location of the entity within a grid
         * @param {Entity} entity
         * @returns {Object}
         */
        getGridLocation: function (entity) {
            let hex = this.pixelToHex(entity.pos.x, entity.pos.y),
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
         * @returns {Hex}
         */
        pixelToHex: function (x, y) {
            return this.layout.pixelToHex(new Point(x, y));
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
     * @param {boolean} orientation
     * @param {Point} size
     * @param {Point} origin
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

    global.HexGrid = HexGrid;
    global.HexGrid.shapeParallelogram = shapeParallelogram;
    global.HexGrid.shapeRectangle = shapeRectangle;
    global.HexGrid.shapeRing = shapeRing;
    global.HexGrid.shapeHexagon = shapeHexagon;
    global.HexGrid.shapeTriangle1 = shapeTriangle1;
    global.HexGrid.shapeTriangle2 = shapeTriangle2;

    global.Layout = Layout;
    global.Layout.layoutPointy = layoutPointy;
    global.Layout.layoutFlat = layoutFlat;

    global.OffsetCoord = OffsetCoord;
    global.Orientation = Orientation;

})(this);
