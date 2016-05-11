(function (global) {
    "use strict";

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
        this.width = Utility.getOpt(opts, 'width', 600);
        this.height = Utility.getOpt(opts, 'height', 600);
        this.size = Utility.getOpt(opts, 'size', 5);
        this.tileSize = Utility.getOpt(opts, 'tileSize', 20);
        this.tileSpacing = Utility.getOpt(opts, 'tileSpacing', 0);
        this.pointyTiles = Utility.getOpt(opts, 'pointyTiles', false);
        this.fill = Utility.getOpt(opts, 'fill', false);
        this.cells = cells || this.shapeRectangle(this.size, this.size, Hex);
        this.layout = layout || new Layout(Layout.layoutPointy, new Point(this.tileSize, this.tileSize), new Point(this.width / 2, this.height / 2));
        this.xCount = this.width / this.tileSize;
        this.yCount = this.height / this.tileSize;
        this.map = new Map();
        this.walls = [];

        this.cellsContainer = new PIXI.Container();
        let hs;
        this.cells.forEach((cell) => {
            var hex = new Hex(cell.q, cell.r, -cell.q - cell.r, this.getCenterXY(cell.q, cell.r), this.tileSize, this.pointyTiles);
                // hs = new HexShape(hex, this.layout, this.tileSize, this.fill);
            this.cellsContainer.addChild(hex.shape);

            hex.walls.forEach((wall) => {
                this.walls.push(wall);
            });
        });

        this.mapCells();

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
        axialToCube: function (axial) {
            return {
                x: axial.q,
                y: axial.r,
                z: -axial.q - axial.r
            };
        },
        /**
         * Convert from Cube coords to axial
         * @param {Cube} cube
         * @returns {Hex}
         */
        cubeToAxial: function (cube) {
            return {
                q: cube.x,
                r: cube.y,
                s: -cube.x - cube.y
            };
        },
        /**
         * Get the center x,y coords for a Hex
         * @param {Hex} hex
         * @returns {Point}
         */
        getCenterXY: function (q, r) {
            var x, y;
            if (this.pointyTiles) {
                x = (this.tileSize + this.tileSpacing) * Math.sqrt(3) * (q + r / 2);
                y = -((this.tileSize + this.tileSpacing) * 3 / 2 * r);
            } else {
                x = (this.tileSize + this.tileSpacing) * 3 / 2 * q;
                y = -((this.tileSize + this.tileSpacing) * Math.sqrt(3) * (r + q / 2));
            }

            return {
                x: x + this.width / 2,
                y: y + this.height / 2
            };
        },
        /**
         * Return the location of the entity within a grid
         * @param {Entity} entity
         * @returns {Object}
         */
        getGrid: function () {
            return this.cellsContainer;
        },
        /**
         * Return the location of the entity within a grid
         * @param {Entity} entity
         * @returns {Object}
         */
        getGridLocation: function (entity) {
            let hex = this.pixelToHex(entity.position),
                cube = this.roundCube(this.axialToCube(hex)),
                hexR = this.cubeToAxial(cube),
                cell = this.getCellAt(hexR.q, hexR.r);

            return cell;
        },
        /**
         *
         * @param hex
         * @returns {*|Vec|Point}
         */
        hexToPixel: function (hex) {
            return this.layout.hexToPixel(hex);
        },
        /**
         * Add the cells to a hash map
         */
        mapCells: function () {
            let column, row, hex, self = this;
            this.cells.forEach(function (cell) {
                // check q
                column = self.map.get(cell.q);
                if (!column) {
                    self.map.set(cell.q, new Map());
                    column = self.map.get(cell.q);
                }
                // check r
                row = column.get(cell.r);
                if (!row) {
                    column.set(cell.r, new Map());
                    row = column.get(cell.r);
                }
                // check s
                hex = row.get(cell.s);
                if (!hex) {
                    row.set(cell.s, cell);
                    hex = row.get(cell.s);
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
            var i, len, neighbor, neighbors, result;
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
        pixelToAxial: function (x, y) {
            var cube, decimalQR, roundedCube;
            decimalQR = this.pixelToDecimalQR(x, y);
            cube = this.axialToCube(decimalQR);
            roundedCube = this.roundCube(cube);

            return this.cubeToAxial(roundedCube);
        },
        pixelToDecimalQR: function (x, y, scale) {
            var q, r;
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

            return {
                q: q,
                r: r,
                s: -q - r
            };
        },
        /**
         * Get something
         * @param {Object} coords
         * @returns {Vec}
         */
        roundCube: function (coordinates) {
            var dx, dy, dz, rx, ry, rz;
            rx = Math.round(coordinates.x);
            ry = Math.round(coordinates.y);
            rz = Math.round(coordinates.z);
            dx = Math.abs(rx - coordinates.x);
            dy = Math.abs(ry - coordinates.y);
            dz = Math.abs(rz - coordinates.z);
            if (dx > dy && dx > dz) {
                rx = -ry - rz;
            } else if (dy > dz) {
                ry = -rx - rz;
            } else {
                rz = -rx - ry;
            }

            return {
                x: rx,
                y: ry,
                z: rz
            };
        },
        /**
         * Create a Hexagon of Hexes
         * @param {number} size
         * @returns {Array}
         */
        shapeHexagon: function (q, r, radius, solid) {
            var currentRing, i, ref, result;
            result = [];
            if (solid) {
                result.push({
                    q: q,
                    r: r,
                    s: -q - r
                });
            }

            for (currentRing = i = 1, ref = radius; 1 <= ref ? i <= ref : i >= ref; currentRing = 1 <= ref ? ++i : --i) {
                result = result.concat(this.shapeRing(q, r, currentRing));
            }

            return result;
        },
        /**
         * Create a rectangle of Hexes
         * @param {number} w
         * @param {number} h
         * @param {Function} constructor
         * @returns {Array}
         */
        shapeRectangle: function (w, h, constructor) {
            var hexes = [],
                i1 = -Math.floor(w / 2),
                i2 = i1 + w,
                j1 = -Math.floor(h / 2),
                j2 = j1 + h;
            for (let j = j1; j < j2; j++) {
                let jOffset = -Math.floor(j / 2);
                for (let i = i1 + jOffset; i < i2 + jOffset; i++) {
                    hexes.push(new constructor(i, j, -i - j));
                }
            }
            return hexes;
        },
        /**
         * Create a ring of Hexes
         * @param {number} q
         * @param {number} r
         * @param {number} radius
         * @returns {Array}
         */
        shapeRing: function (q, r, radius) {
            var i, j, len, moveDirection, moveDirectionIndex, moveDirections, ref, result;
            result = [];
            moveDirections = [[1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1], [1, 0], [1, -1]];
            for (moveDirectionIndex = i = 0, len = moveDirections.length; i < len; moveDirectionIndex = ++i) {
                moveDirection = moveDirections[moveDirectionIndex];
                for (j = 0, ref = radius - 1; 0 <= ref ? j <= ref : j >= ref; 0 <= ref ? j++ : j--) {
                    q += moveDirection[0];
                    r += moveDirection[1];
                    if (moveDirectionIndex !== 0) {
                        result.push({
                            q: q,
                            r: r,
                            s: -q - r
                        });
                    }
                }
            }

            return result;
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
            var hexes = [];
            for (let q = q1; q <= q2; q++) {
                for (let r = r1; r <= r2; r++) {
                    hexes.push(new constructor(q, r, -q - r));
                }
            }
            return hexes;
        },
        /**
         * Create a triangle of Hexes
         * @param {number} size
         * @returns {Array}
         */
        shapeTriangle1: function (size) {
            var hexes = [];
            for (let q = 0; q <= size; q++) {
                for (let r = 0; r <= size - q; r++) {
                    hexes.push(new Hex(q, r, -q - r));
                }
            }
            return hexes;
        },
        /**
         * Create a triangle of Hexes
         * @param {number} size
         * @returns {Array}
         */
        shapeTriangle2: function (size) {
            var hexes = [];
            for (let q = 0; q <= size; q++) {
                for (let r = size - q; r <= size; r++) {
                    hexes.push(new Hex(q, r, -q - r));
                }
            }
            return hexes;
        }
    };
    global.HexGrid = HexGrid;

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
    global.OffsetCoord = OffsetCoord;

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
    global.Orientation = Orientation;

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
         * @returns {Vec}
         */
        hexToPixel: function (hex) {
            let m = this.orientation,
                size = this.size,
                offset = this.origin,
                x = ((m.f0 * hex.q + m.f1 * hex.r) * size.x) + offset.x,
                y = ((m.f2 * hex.q + m.f3 * hex.r) * size.y) + offset.y;

            return new Vec(x, y);
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
         * @param {Point} p
         * @returns {Array}
         */
        polygonCorners: function (p) {
            let corners = [];
            for (let i = 0; i < 6; i++) {
                let offset = this.hexCornerOffset(i);
                corners.push(new Point(p.x + offset.x, p.y + offset.y));
            }

            return corners;
        }
    };
    Layout.layoutPointy = new Orientation(Math.sqrt(3.0), Math.sqrt(3.0) / 2.0, 0.0, 3.0 / 2.0, Math.sqrt(3.0) / 3.0, -1.0 / 3.0, 0.0, 2.0 / 3.0, 0.5);
    Layout.layoutFlat = new Orientation(3.0 / 2.0, 0.0, Math.sqrt(3.0) / 2.0, Math.sqrt(3.0), 2.0 / 3.0, 0.0, -1.0 / 3.0, Math.sqrt(3.0) / 3.0, 0.0);
    global.Layout = Layout;

})(this);
