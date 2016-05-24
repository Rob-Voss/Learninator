(function (global) {
    "use strict";

    var Grid = global.Grid || {},
        Hex = global.Hex || {},
        HexShape = global.HexShape || {},
        Point = global.Point || {},
        Wall = global.Wall || {},
        Vec = global.Vec || {};

    class HexGrid extends Grid {

        /**
         * A library for creating Hexagonal grids
         * @name HexGrid
         * @constructor
         *
         * @param {object} opts
         * @param {array} cells
         * @param {Layout} layout
         * @returns {HexGrid}
         */
        constructor(opts, cells, layout) {
            let o = layout || (opts.pointy ? Layout.layoutPointy : Layout.layoutFlat),
                lay = new Layout(o, new Point(opts.cellSize, opts.cellSize), new Point(opts.width / 2, opts.height / 2)),
                cs = cells || HexGrid.shapeHexagon(opts.size, lay, opts.cellSize, opts.fill, opts.cheats);
            super(opts, cs);

            this.layout = lay;
            this.directions = Hex.hexDirections;
            this.mapCells();
            this.cellsContainer = new PIXI.Container();
            this.cells.forEach((cell) => {
                for (let dir = 0; dir < this.directions.length; dir++) {
                    let neighb = cell.neighbor(cell, dir),
                        v1, v2,
                        ad = (!this.pointy) ? 1 : 0;

                    switch (dir) {
                        case 0:
                            v1 = cell.corners[2 + ad];
                            v2 = cell.corners[3 + ad];
                            break;
                        case 1:
                            v1 = cell.corners[1 + ad];
                            v2 = cell.corners[2 + ad];
                            break;
                        case 2:
                            v1 = cell.corners[0 + ad];
                            v2 = cell.corners[1 + ad];
                            break;
                        case 3:
                            v1 = cell.corners[0 + ad];
                            v2 = cell.corners[(!this.pointy) ? 0 : 5];
                            break;
                        case 4:
                            v1 = cell.corners[4 + ad];
                            v2 = cell.corners[(!this.pointy) ? 0 : 5];
                            break;
                        case 5:
                            v1 = cell.corners[3 + ad];
                            v2 = cell.corners[4 + ad];
                            break;
                    }

                    cell.neighbors[dir] = this.getCellAt(neighb.q, neighb.r);
                    cell.walls[dir] = new Wall(v1, v2, this.cheats, dir);
                    this.walls.push(cell.walls[dir]);
                }
                this.cellsContainer.addChild(cell.shape);
            });

            return this;
        }

        /**
         * Returns true if there is an edge between c1 and c2
         * @param {Cell} h1
         * @param {Cell} h2
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
        }

        /**
         * Convert from axial coords to Cube
         * @param {Hex} hex
         * @returns {object}
         */
        axialToCube(hex) {
            return {
                x: hex.q,
                y: hex.r,
                z: -hex.q - hex.r
            };
        }

        /**
         * Returns true if there is an edge between c1 and c2
         * @param {Cell} c1
         * @param {Cell} c2
         * @returns {boolean}
         */
        areConnected(c1, c2) {
            if (!c1 || !c2) {
                return false;
            }

            if (Math.abs(c1.x - c2.x) > 1 || Math.abs(c1.y - c2.y) > 1) {
                return false;
            }

            var removedEdge = _.detect(this.removedEdges, function (edge) {
                return _.include(edge, c1) && _.include(edge, c2);
            });

            return removedEdge === undefined;
        }

        /**
         * Returns all neighbors of this Cell that are separated by an edge
         * @param {Cell} c
         * @returns {Array}
         */
        connectedNeighbors(c) {
            var con;
            return _.select(this.neighbors(c), (c0) => {
                con = this.areConnected(c, c0);

                return con;
            });
        }

        /**
         * Convert from Cube coords to axial
         * @param {Cube} cube
         * @returns {object}
         */
        cubeToAxial(cube) {
            return {
                q: cube.x,
                r: cube.y,
                s: -cube.x - cube.y
            };
        }

        /**
         * Returns all neighbors of this Cell that are NOT separated by an edge
         * This means there is a maze path between both cells.
         * @param {Cell} cell
         * @returns {Array}
         */
        disconnectedNeighbors(cell) {
            var disc;
            return _.reject(this.neighbors(cell), (c0) => {
                disc = this.areConnected(cell, c0);

                return disc;
            });
        }

        /**
         * Get the cell at the axial coords
         * @param {number} q
         * @param {number} r
         * @returns {Hex|boolean}
         */
        getCellAt(q, r) {
            let column = this.map.get(q),
                row = column ? column.get(r) : false,
                cell = row ? row.get(-q - r) : false;

            return cell;
        }

        /**
         * Distance between two axial coords
         * @param {Cell} h1
         * @param {Cell} h2
         * @returns {number}
         */
        getCellDistance(h1, h2) {
            return (Math.abs(h1.q - h2.q) + Math.abs(h1.r - h2.r) + Math.abs(h1.q + h1.r - h2.q - h2.r)) / 2;
        }

        /**
         * Get the center x,y coords for a Hex
         * @param {Cell} hex
         * @returns {Point}
         */
        getCenterXY(hex) {
            return this.layout.hexToPixel(hex);
        }

        /**
         * Return the location of the entity within a grid
         * @param {Entity} entity
         * @returns {Cell|boolean}
         */
        getGridLocation(entity) {
            let center = new Point(
                    entity.bounds.x + entity.bounds.width / 2,
                    entity.bounds.y + entity.bounds.height / 2
                ),
                hex = this.layout.pixelToHex(center),
                cube = this.roundCube(this.axialToCube(hex)),
                hexR = this.cubeToAxial(cube),
                cell = this.getCellAt(hexR.q, hexR.r);

            return cell;
        }

        /**
         * Add the cells to a hash map
         */
        mapCells() {
            let column, row, hex;
            this.cells.forEach((cell) => {
                // check q
                column = this.map.get(cell.q);
                if (!column) {
                    this.map.set(cell.q, new Map());
                    column = this.map.get(cell.q);
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
        }

        /**
         * Return a Hex's neighbors
         * @param {Cell} hex
         * @returns {Array}
         */
        neighbors(hex) {
            var i, len, neighbors, result;
            result = [];
            neighbors = Hex.hexDirections;
            for (i = 0, len = neighbors.length; i < len; i++) {
                let neighbor = neighbors[i],
                    q = hex.q + neighbor.q,
                    r = neighbor.r,
                    cell = this.getCellAt(q, r),
                    neigh = hex.direction(i);
                result.push((cell) ? cell : neigh);
            }

            return result;
        }

        /**
         *
         * @param x
         * @param y
         * @returns {*|{q, r, s}|Hex}
         */
        pixelToAxial(x, y) {
            var cube, decimalQR, roundedCube;
            decimalQR = this.pixelToDecimalQR(x, y);
            cube = this.axialToCube(decimalQR);
            roundedCube = this.roundCube(cube);

            return this.cubeToAxial(roundedCube);
        }

        /**
         *
         * @param x
         * @param y
         * @param scale
         * @returns {{q: *, r: *, s: number}}
         */
        pixelToDecimalQR(x, y, scale) {
            var q, r;
            if (typeof scale !== "number") {
                scale = 1;
            }
            if (this.pointy) {
                q = (1 / 3 * Math.sqrt(3) * x - 1 / 3 * -y) / (this.cellSize + this.cellSpacing);
                r = 2 / 3 * -y / (this.cellSize + this.cellSpacing);
            } else {
                q = 2 / 3 * x / (this.cellSize + this.cellSpacing);
                r = (1 / 3 * Math.sqrt(3) * -y - 1 / 3 * x) / (this.cellSize + this.cellSpacing);
            }
            q /= scale;
            r /= scale;

            return {
                q: q,
                r: r,
                s: -q - r
            };
        }

        /**
         * Get something
         * @param {object} coords
         * @returns {object}
         */
        roundCube(coords) {
            var dx, dy, dz, rx, ry, rz;
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

            return {
                x: rx,
                y: ry,
                z: rz
            };
        }

        permuteQRS(q, r, s) {
            return new Hex(q, r, s);
        }

        permuteSRQ(q, r, s) {
            return new Hex(s, r, q);
        }

        permuteSQR(q, r, s) {
            return new Hex(s, q, r);
        }

        permuteRQS(q, r, s) {
            return new Hex(r, q, s);
        }

        permuteRSQ(q, r, s) {
            return new Hex(r, s, q);
        }

        permuteQSR(q, r, s) {
            return new Hex(q, s, r);
        }

        /**
         * Create a Hexagon of Hexes
         * @param {number} size
         * @param {Layout} layout
         * @param {number} cellSize
         * @param {boolean} fill
         * @param {object} cheats
         * @returns {Array}
         */
        static shapeHexagon(size, layout, cellSize, fill, cheats) {
            var hexes = [];
            for (let q = -size; q <= size; q++) {
                var r1 = Math.max(-size, -q - size),
                    r2 = Math.min(size, -q + size);
                for (let r = r1; r <= r2; r++) {
                    let cell = new Hex(q, r, -q - r),
                        hex = new HexShape(cell, layout, cellSize, fill, cheats);
                    hexes.push(hex);
                }
            }
            return hexes;
        }

        /**
         * Create a parallelogram of Hexes
         * @param {number} q1
         * @param {number} r1
         * @param {number} q2
         * @param {number} r2
         * @param {Function} constructor
         * @param {Layout} layout
         * @returns {Array}
         */
        static shapeParallelogram(q1, r1, q2, r2, constructor, layout) {
            var hexes = [];
            for (let q = q1; q <= q2; q++) {
                for (let r = r1; r <= r2; r++) {
                    let hex = new constructor(q, r, -q - r);
                    layout.polygonCorners(hex);
                    hexes.push(hex);
                }
            }
            return hexes;
        }

        /**
         * Create a rectangle of Hexes
         * @param {number} w
         * @param {number} h
         * @param {Function} constructor
         * @param {Layout} layout
         * @returns {Array}
         */
        static shapeRectangle(w, h, constructor, layout) {
            var hexes = [],
                i1 = -Math.floor(w / 2),
                i2 = i1 + w,
                j1 = -Math.floor(h / 2),
                j2 = j1 + h;
            for (let j = j1; j < j2; j++) {
                let jOffset = -Math.floor(j / 2);
                for (let i = i1 + jOffset; i < i2 + jOffset; i++) {
                    let hex = new constructor(i, j, -i - j);
                    layout.polygonCorners(hex);
                    hexes.push(hex);
                }
            }
            return hexes;
        }

        /**
         * Create a ring of Hexes
         * @param {number} q
         * @param {number} r
         * @param {number} radius
         * @param {Layout} layout
         * @returns {Array}
         */
        static shapeRing(q, r, radius, layout) {
            var i, j, len, moveDirection, moveDirectionIndex, moveDirections, ref, result;
            result = [];
            moveDirections = [[1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1], [1, 0], [1, -1]];
            for (moveDirectionIndex = i = 0, len = moveDirections.length; i < len; moveDirectionIndex = ++i) {
                moveDirection = moveDirections[moveDirectionIndex];
                for (j = 0, ref = radius - 1; 0 <= ref ? j <= ref : j >= ref; 0 <= ref ? j++ : j--) {
                    q += moveDirection[0];
                    r += moveDirection[1];
                    if (moveDirectionIndex !== 0) {
                        let hex = new Hex(q, r, -q - r);
                        layout.polygonCorners(hex);
                        result.push(hex);
                    }
                }
            }

            return result;
        }

        /**
         *
         * @param minQ
         * @param maxQ
         * @param minR
         * @param maxR
         * @param toCube
         * @param {Layout} layout
         * @returns {Array}
         */
        static shapeTrapezoidal(minQ, maxQ, minR, maxR, toCube, layout) {
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
        }

        /**
         * Create a triangle of Hexes
         * @param {number} size
         * @param {Layout} layout
         * @returns {Array}
         */
        static shapeTriangle1(size, layout) {
            var hexes = [];
            for (let q = 0; q <= size; q++) {
                for (let r = 0; r <= size - q; r++) {
                    let hex = new Hex(q, r, -q - r);
                    layout.polygonCorners(hex);
                    hexes.push(hex);
                }
            }
            return hexes;
        }

        /**
         * Create a triangle of Hexes
         * @param {number} size
         * @param {Layout} layout
         * @returns {Array}
         */
        static shapeTriangle2(size, layout) {
            var hexes = [];
            for (let q = 0; q <= size; q++) {
                for (let r = size - q; r <= size; r++) {
                    let hex = new Hex(q, r, -q - r);
                    layout.polygonCorners(hex);
                    hexes.push(hex);
                }
            }
            return hexes;
        }

        /**
         * Returns all neighbors of this Cell that aren't separated by an edge
         * @param {Cell} hex
         * @returns {Array}
         */
        unvisitedNeighbors(hex) {
            var unv = [];
            hex.neighbors.forEach((cell) => {
                if (cell && !cell.visited) {
                    unv.push(cell);
                }
            });

            return unv;
        }
    }

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
         * @param {Point} p
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
         * @returns {Layout}
         */
        polygonCorners: function (hex) {
            for (let i = 0; i < 6; i++) {
                var offset = this.hexCornerOffset(i);
                hex.polyCorners.push(hex.center.x + offset.x, hex.center.y + offset.y);
                hex.corners.push(new Vec(hex.center.x + offset.x, hex.center.y + offset.y));
            }

            return this;
        }
    };

    Layout.layoutPointy = new Orientation(Math.sqrt(3.0), Math.sqrt(3.0) / 2.0, 0.0, 3.0 / 2.0, Math.sqrt(3.0) / 3.0, -1.0 / 3.0, 0.0, 2.0 / 3.0, 0.5);
    Layout.layoutFlat = new Orientation(3.0 / 2.0, 0.0, Math.sqrt(3.0) / 2.0, Math.sqrt(3.0), 2.0 / 3.0, 0.0, -1.0 / 3.0, Math.sqrt(3.0) / 3.0, 0.0);
    global.HexGrid = HexGrid;
    global.Layout = Layout;
    global.OffsetCoord = OffsetCoord;
    global.Orientation = Orientation;

})(this);
