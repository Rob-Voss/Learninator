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
        this.cheats = Utility.getOpt(opts, 'cheats', false);
        this.tileSize = Utility.getOpt(opts, 'tileSize', 20);
        this.tileSpacing = Utility.getOpt(opts, 'tileSpacing', 0);
        this.pointyTiles = Utility.getOpt(opts, 'pointyTiles', false);
        this.fill = Utility.getOpt(opts, 'fill', false);
        this.map = new Map();
        this.layout = layout || new Layout(Layout.layoutPointy, new Point(this.tileSize, this.tileSize), new Point(this.width / 2, this.height / 2));
        this.cells = cells || this.shapeHexagon(this.size);
        this.xCount = this.width / this.tileSize;
        this.yCount = this.height / this.tileSize;
        this.mapCells();

        this.removedEdges = [];
        this.path = [];
        this.walls = [];

        this.cellsContainer = new PIXI.Container();
        this.cells.forEach((cell) => {
            var hs = new HexShape(cell, this.layout, this.tileSize, this.fill, this.cheats);
            for (let c = 0; c < cell.corners.length; c++) {
                let neighb = cell.neighbor(cell, c);
                cell.neighbors[c] = this.getCellAt(neighb.q, neighb.r);
            }
            for (let c = 0; c < hs.corners.length; c++) {
                let x1 = hs.corners[c].x,
                    y1 = hs.corners[c].y,
                    x2, y2;
                if (c !== hs.corners.length - 1) {
                    x2 = hs.corners[c + 1].x;
                    y2 = hs.corners[c + 1].y;
                } else {
                    x2 = hs.corners[0].x;
                    y2 = hs.corners[0].y;
                }
                this.walls.push(new Wall(new Vec(x1, y1), new Vec(x2, y2), this.cheats.walls));
            }
            this.cellsContainer.addChild(hs.shape);
        });


        return this;
    };

    HexGrid.prototype = {
        /**
         * Returns true if there is an edge between c1 and c2
         * @param {Hex} h1
         * @param {Hex} h2
         * @returns {boolean}
         */
        areConnected(h1, h2) {
            if (!h1 || !h2) {
                return false;
            }

            var removedEdge = _.detect(this.removedEdges, function (edge) {
                return _.include(edge, h1) && _.include(edge, h2);
            });

            return removedEdge === undefined;
        },
        /**
         * Convert from axial coords to Cube
         * @param {Hex} hex
         * @returns {Cube}
         */
        axialToCube: function (hex) {
            return {
                x: axial.q,
                y: axial.r,
                z: -axial.q - axial.r
            };
        },
        /**
         * Returns all neighbors of this Cell that are separated by an edge
         * @param {Hex} h
         * @returns {Array}
         */
        connectedNeighbors: function (h) {
            var con;
            return _.select(this.neighbors(h), (h0) => {
                con = this.areConnected(h, h0);

                return con;
            });
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
         * Returns all neighbors of this Cell that are NOT separated by an edge
         * This means there is a maze path between both cells.
         * @param {Hex} hex
         * @returns {Array}
         */
        disconnectedNeighbors: function (hex) {
            var disc;
            return _.reject(this.neighbors(hex), (c0) => {
                disc = this.areConnected(hex, c0);

                return disc;
            });
        },
        /**
         * Get the cell at the axial coords
         * @param {number} q
         * @param {number} r
         * @returns {Hex|boolean}
         */
        getCellAt: function (q, r) {
            let column = this.map.get(q),
                row = column ? column.get(r) : false,
                cell = row ? row.get(-q - r) : false;

            return cell;
        },
        /**
         * Distance between two axial coords
         * @param {Hex} h1
         * @param {Hex} h2
         * @returns {number}
         */
        getCellDistance: function (h1, h2) {
            return (Math.abs(h1.q - h2.q) + Math.abs(h1.r - h2.r) + Math.abs(h1.q + h1.r - h2.q - h2.r)) / 2;
        },
        /**
         * Get the center x,y coords for a Hex
         * @param {Hex} hex
         * @returns {Point}
         */
        getCenterXY: function (hex) {
            return this.layout.hexToPixel(hex);
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
         * @param {Hex} hex
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
         * @param {Hex} hex
         * @returns {Array}
         */
        neighbors: function (hex) {
            var i, len, neighbors, result;
            result = [];
            neighbors = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
            for (i = 0, len = neighbors.length; i < len; i++) {
                let neighbor = neighbors[i],
                    q = hex.q + neighbor[0],
                    r = neighbor[1],
                    s = -q - r;
                result.push(this.getCellAt(q, r));
            }

            return result;
        },
        /**
         *
         * @param x
         * @param y
         * @returns {*|{q, r, s}|Hex}
         */
        pixelToAxial: function (x, y) {
            var cube, decimalQR, roundedCube;
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
         * Remove the edge from between two Cells
         * @param {Hex} h1
         * @param {Hex} h2
         */
        removeEdgeBetween: function (h1, h2) {
            this.removedEdges.push([h1, h2]);

            return this;
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
        permuteQRS: function (q, r, s) {
            return new Hex(q, r, s);
        },
        permuteSRQ: function (q, r, s) {
            return new Hex(s, r, q);
        },
        permuteSQR: function (q, r, s) {
            return new Hex(s, q, r);
        },
        permuteRQS: function (q, r, s) {
            return new Hex(r, q, s);
        },
        permuteRSQ: function (q, r, s) {
            return new Hex(r, s, q);
        },
        permuteQSR: function (q, r, s) {
            return new Hex(q, s, r);
        },
        /**
         * Create a Hexagon of Hexes
         * @param {number} size
         * @returns {Array}
         */
        shapeHexagon: function (size) {
            var hexes = [],
                neighbs = [];
            for (let q = -size; q <= size; q++) {
                var r1 = Math.max(-size, -q - size),
                    r2 = Math.min(size, -q + size);
                for (let r = r1; r <= r2; r++) {
                    let hex = new Hex(q, r, -q - r),
                        corners = this.layout.polygonCorners(hex);
                    hex.corners = corners[1];
                    hex.polyCorners = corners[0];
                    hexes.push(hex);
                }
            }
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
            var hexes = [];
            for (let q = q1; q <= q2; q++) {
                for (let r = r1; r <= r2; r++) {
                    let hex = new constructor(q, r, -q - r),
                        corners = this.layout.polygonCorners(hex);
                    hex.polyCorners = corners[0];
                    hex.corners = corners[1];
                    hexes.push(hex);
                }
            }
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
            var hexes = [],
                i1 = -Math.floor(w / 2),
                i2 = i1 + w,
                j1 = -Math.floor(h / 2),
                j2 = j1 + h;
            for (let j = j1; j < j2; j++) {
                let jOffset = -Math.floor(j / 2);
                for (let i = i1 + jOffset; i < i2 + jOffset; i++) {
                    let hex = new constructor(i, j, -i - j),
                        corners = this.layout.polygonCorners(hex);
                    hex.polyCorners = corners[0];
                    hex.corners = corners[1];
                    hexes.push(hex);
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
                        let hex = new Hex(q, r, -q - r),
                            corners = this.layout.polygonCorners(hex);
                        hex.polyCorners = corners[0];
                        hex.corners = corners[1];
                        result.push(hex);
                    }
                }
            }

            return result;
        },
        /**
         *
         * @param minQ
         * @param maxQ
         * @param minR
         * @param maxR
         * @param toCube
         * @returns {Array}
         */
        shapeTrapezoidal: function (minQ, maxQ, minR, maxR, toCube) {
            var q, r, _g3, _g2,
                hexes = [],
                _g1 = minQ,
                _g = maxQ + 1;
            while (_g1 < _g) {
                q = _g1++;
                _g3 = minR;
                _g2 = maxR + 1;
                while (_g3 < _g2) {
                    r = _g3++;
                    hexes.push(toCube(new Hex(q, r, -q - r)));
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
                    let hex = new Hex(q, r, -q - r),
                        corners = this.layout.polygonCorners(hex);
                    hex.polyCorners = corners[0];
                    hex.corners = corners[1];
                    hexes.push(hex);
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
                    let hex = new Hex(q, r, -q - r),
                        corners = this.layout.polygonCorners(hex);
                    hex.polyCorners = corners[0];
                    hex.corners = corners[1];
                    hexes.push(hex);
                }
            }
            return hexes;
        },
        /**
         * Returns all neighbors of this Cell that aren't separated by an edge
         * @param {Hex} hex
         * @returns {Array}
         */
        unvisitedNeighbors: function (hex) {
            var unv;
            return _.select(this.connectedNeighbors(hex), function (c0) {
                unv = !c0.visited;
                return unv;
            });
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
                row = hex.r + Math.trunc((hex.q + offset * (Math.abs(hex.q) % 2)) / 2);

            return new OffsetCoord(col, row);
        },
        /**
         *
         * @param offset
         * @param hex
         */
        qOffsetToCube: function (offset, hex) {
            var q = hex.col,
                r = hex.row - Math.trunc((hex.col + offset * (Math.abs(hex.col) % 2)) / 2);

            return new Hex(q, r, -q - r);
        },
        /**
         *
         * @param offset
         * @param hex
         * @returns {OffsetCoord}
         */
        rOffsetFromCube: function (offset, hex) {
            var col = hex.q + Math.trunc((hex.r + offset * (Math.abs(hex.r) % 2)) / 2),
                row = hex.r;

            return new OffsetCoord(col, row);
        },
        /**
         *
         * @param offset
         * @param hex
         */
        rOffsetToCube: function (offset, hex) {
            var q = hex.col - Math.trunc((hex.row + offset * (Math.abs(hex.row) % 2)) / 2),
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
        this.f0 = f0;
        this.f1 = f1;
        this.f2 = f2;
        this.f3 = f3;
        this.b0 = b0;
        this.b1 = b1;
        this.b2 = b2;
        this.b3 = b3;
        this.startAngle = angle;

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
         * @returns {Vec}
         */
        hexToPixel: function (hex) {
            let m = this.orientation,
                size = this.size,
                offset = this.origin,
                x = (m.f0 * hex.q + m.f1 * hex.r) * size.x,
                y = (m.f2 * hex.q + m.f3 * hex.r) * size.y;

            return new Vec(x + offset.x, y + offset.y);
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
                pt = new Point(
                    (p.x - offset.x) / size.x,
                    (p.y - offset.y) / size.y
                ),
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
            var corners = [],
                polyCorners = [];
            hex.center = this.hexToPixel(hex);
            for (let i = 0; i < 6; i++) {
                var offset = this.hexCornerOffset(i);
                polyCorners.push(hex.center.x + offset.x, hex.center.y + offset.y);
                corners.push(new Point(hex.center.x + offset.x, hex.center.y + offset.y));
            }

            return [polyCorners, corners];
        }
    };

    var layoutPointy = new Orientation(Math.sqrt(3.0), Math.sqrt(3.0) / 2.0, 0.0, 3.0 / 2.0, Math.sqrt(3.0) / 3.0, -1.0 / 3.0, 0.0, 2.0 / 3.0, 0.5),
        layoutFlat = new Orientation(3.0 / 2.0, 0.0, Math.sqrt(3.0) / 2.0, Math.sqrt(3.0), 2.0 / 3.0, 0.0, -1.0 / 3.0, Math.sqrt(3.0) / 3.0, 0.0);
    Layout.layoutPointy = layoutPointy;
    Layout.layoutFlat = layoutFlat;
    global.HexGrid = HexGrid;
    global.Layout = Layout;
    global.OffsetCoord = OffsetCoord;
    global.Orientation = Orientation;

})(this);
