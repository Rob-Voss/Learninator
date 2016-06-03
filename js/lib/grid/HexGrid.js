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
         * @param {Array} cells
         * @param {Layout} layout
         * @returns {HexGrid}
         */
        constructor(opts, cells, layout) {
            let orientation = (opts.pointy ? Layout.layoutPointy : Layout.layoutFlat),
                size = new Point(opts.width / opts.cellSize, opts.height / opts.cellSize),
                origin = new Point(opts.width / 2, opts.height / 2),
                lay = layout || new Layout(orientation, size, origin),
                cs = cells || HexGrid.shapeHexagon(opts.size, opts.cellSize, lay, opts.fill, opts.cheats);
            super(opts, cs, lay);

            return this;
        }

        init() {
            this.mapCells();
            this.cellsContainer = new PIXI.Container();
            this.cells.forEach((cell) => {
                cell.neighbors = [];
                cell.walls = [];
                for (let dir = 0; dir < cell.directions.length; dir++) {
                    let neighb = cell.neighbor(cell, dir),
                        v1, v2,
                        ad = (!this.pointy) ? 1 : 0;

                    switch (dir) {
                        case 0:
                            v1 = cell.corners[(!this.pointy) ? 0 : 5];
                            v2 = cell.corners[0 + ad];
                            break;
                        case 1:
                            v1 = cell.corners[(!this.pointy) ? 0 : 5];
                            v2 = cell.corners[4 + ad];
                            break;
                        case 2:
                            v1 = cell.corners[4 + ad];
                            v2 = cell.corners[3 + ad];
                            break;
                        case 3:
                            v1 = cell.corners[3 + ad];
                            v2 = cell.corners[2 + ad];
                            break;
                        case 4:
                            v1 = cell.corners[2 + ad];
                            v2 = cell.corners[1 + ad];
                            break;
                        case 5:
                            v1 = cell.corners[1 + ad];
                            v2 = cell.corners[0 + ad];
                            break;
                    }

                    cell.neighbors[dir] = this.getCellAt(neighb.q, neighb.r);
                    cell.walls[dir] = new Wall(v1, v2, this.cheats, dir);
                }
                this.cellsContainer.addChild(cell.shape);
            });
            this.startCell = this.getCellAt(this.cells[0].q, this.cells[0].r);

            return this;
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
         * Returns true if there is an edge between c1 and c2
         * @param {Hex|HexShape} h1
         * @param {Hex|HexShape} h2
         * @returns {boolean}
         */
        areConnected(h1, h2) {
            if (!h1 || !h2) {
                return true;
            }

            var removedEdge = _.detect(this.removedEdges, function (edge) {
                return _.include(edge, h1) && _.include(edge, h2);
            });

            return removedEdge === undefined;
        }

        /**
         * Returns all neighbors of this Cell that are NOT separated by an edge
         * This means there is a maze path between both cells.
         * @param {Hex|HexShape} cell
         * @returns {Array}
         */
        disconnectedNeighbors(cell) {
            var disc;
            return _.reject(cell.neighbors, (c0) => {
                disc = this.areConnected(cell, c0);

                return disc;
            });
        }

        /**
         * Returns all neighbors of this Cell that aren't separated by an edge
         * @param {Hex|HexShape} hex
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
         * @param {Hex|HexShape} h1
         * @param {Hex|HexShape} h2
         * @returns {number}
         */
        getCellDistance(h1, h2) {
            return (Math.abs(h1.q - h2.q) + Math.abs(h1.r - h2.r) + Math.abs(h1.q + h1.r - h2.q - h2.r)) / 2;
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
         * @param {Hex} hex
         * @param {boolean} all
         * @returns {Array}
         */
        neighbors(hex, all = false) {
            var i, len, neighbors, result;
            result = [];
            neighbors = Hex.hexDirections;
            for (i = 0, len = neighbors.length; i < len; i++) {
                let n = neighbors[i],
                    q = hex.q + n.q,
                    r = n.r,
                    cell = this.getCellAt(q, r),
                    neighbor = hex.direction(i);
                result.push((!all) ? cell : neighbor);
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
         * @param {number} cellSize
         * @param {Layout} layout
         * @param {boolean} fill
         * @param {object} cheats
         * @returns {Array}
         */
        static shapeHexagon(size, cellSize, layout, fill, cheats) {
            var hexes = [];
            for (let q = -size; q <= size; q++) {
                var r1 = Math.max(-size, -q - size),
                    r2 = Math.min(size, -q + size);
                for (let r = r1; r <= r2; r++) {
                    let cell = new Hex(q, r, -q - r),
                        hex = new HexShape(cell, cellSize, layout, fill, cheats);
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
         * @param {number} cellSize
         * @param {Layout} layout
         * @param {boolean} fill
         * @param {object} cheats
         * @returns {Array}
         */
        static shapeParallelogram(q1, r1, q2, r2, cellSize, layout, fill, cheats) {
            var hexes = [];
            for (let q = q1; q <= q2; q++) {
                for (let r = r1; r <= r2; r++) {
                    let cell = new Hex(q, r, -q - r),
                        hex = new HexShape(cell, cellSize, layout, fill, cheats);
                    hexes.push(hex);
                }
            }
            return hexes;
        }

        /**
         * Create a rectangle of Hexes
         * @param {number} w - width
         * @param {number} h - height
         * @param {number} cellSize
         * @param {Layout} layout
         * @param {boolean} fill
         * @param {object} cheats
         * @returns {Array}
         */
        static shapeRectangle(w, h, cellSize, layout, fill, cheats, pointy = false) {
            var hexes = [],
                r1 = -Math.floor(w / 2),
                r2 = r1 + w,
                q1 = -Math.floor(h / 2),
                q2 = q1 + h;
            if (!pointy) {
                for (let q = q1; q < q2; q++) {
                    let qOffset = -Math.floor(q / 2);
                    for (let r = r1 + qOffset; r < r2 + qOffset; r++) {
                        let cell = new Hex(q, r, -q - r),
                            hex = new HexShape(cell, cellSize, layout, fill, cheats);
                        hexes.push(hex);
                    }
                }
            } else {
                for (let r = r1; r < r2; r++) {
                    let rOffset = -Math.floor(r / 2);
                    for (let q = q1 + rOffset; q < q2 + rOffset; q++) {
                        let cell = new Hex(q, r, -q - r),
                            hex = new HexShape(cell, cellSize, layout, fill, cheats);
                        hexes.push(hex);
                    }
                }
            }

            return hexes;
        }

        /**
         * Create a ring of Hexes
         * @param {number} q
         * @param {number} r
         * @param {number} radius
         * @param {number} cellSize
         * @param {Layout} layout
         * @param {boolean} fill
         * @param {object} cheats
         * @returns {Array}
         */
        static shapeRing(q, r, radius, cellSize, layout, fill, cheats) {
            var i, j, len, moveDirection, moveDirectionIndex, moveDirections, ref, hexes = [];
            moveDirections = [[1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1], [1, 0], [1, -1]];
            for (moveDirectionIndex = i = 0, len = moveDirections.length; i < len; moveDirectionIndex = ++i) {
                moveDirection = moveDirections[moveDirectionIndex];
                for (j = 0, ref = radius - 1; 0 <= ref ? j <= ref : j >= ref; 0 <= ref ? j++ : j--) {
                    q += moveDirection[0];
                    r += moveDirection[1];
                    if (moveDirectionIndex !== 0) {
                        let cell = new Hex(q, r, -q - r),
                            hex = new HexShape(cell, cellSize, layout, fill, cheats);
                        hexes.push(hex);
                    }
                }
            }

            return hexes;
        }

        /**
         *
         * @param minQ
         * @param maxQ
         * @param minR
         * @param maxR
         * @param toCube
         * @param {number} cellSize
         * @param {Layout} layout
         * @param {boolean} fill
         * @param {object} cheats
         * @returns {Array}
         */
        static shapeTrapezoidal(minQ, maxQ, minR, maxR, toCube, cellSize, layout, fill, cheats) {
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
                    let cell = new Hex(q, r, -q - r),
                        hex = new HexShape(cell, cellSize, layout, fill, cheats);
                    hexes.push(hex);
                }
            }
            return hexes;
        }

        /**
         * Create a triangle of Hexes
         * @param {number} size
         * @param {number} cellSize
         * @param {Layout} layout
         * @param {boolean} fill
         * @param {object} cheats
         * @returns {Array}
         */
        static shapeTriangle1(size, cellSize, layout, fill, cheats) {
            var hexes = [];
            for (let q = 0; q <= size; q++) {
                for (let r = 0; r <= size - q; r++) {
                    let cell = new Hex(q, r, -q - r),
                        hex = new HexShape(cell, cellSize, layout, fill, cheats);
                    hexes.push(hex);
                }
            }
            return hexes;
        }

        /**
         * Create a triangle of Hexes
         * @param {number} size
         * @param {number} cellSize
         * @param {Layout} layout
         * @param {boolean} fill
         * @param {object} cheats
         * @returns {Array}
         */
        static shapeTriangle2(size, cellSize, layout, fill, cheats) {
            var hexes = [];
            for (let q = 0; q <= size; q++) {
                for (let r = size - q; r <= size; r++) {
                    let cell = new Hex(q, r, -q - r),
                        hex = new HexShape(cell, cellSize, layout, fill, cheats);
                    hexes.push(hex);
                }
            }
            return hexes;
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
         * @returns {Array}
         */
        polygonCorners: function (hex) {
            let corners = [];
            for (let i = 0; i < 6; i++) {
                var offset = this.hexCornerOffset(i);
                corners.push(new Vec(hex.center.x + offset.x, hex.center.y + offset.y));
            }

            return corners;
        }
    };

    Layout.layoutPointy = new Orientation(Math.sqrt(3.0), Math.sqrt(3.0) / 2.0, 0.0, 3.0 / 2.0, Math.sqrt(3.0) / 3.0, -1.0 / 3.0, 0.0, 2.0 / 3.0, 0.5);
    Layout.layoutFlat = new Orientation(3.0 / 2.0, 0.0, Math.sqrt(3.0) / 2.0, Math.sqrt(3.0), 2.0 / 3.0, 0.0, -1.0 / 3.0, Math.sqrt(3.0) / 3.0, 0.0);
    global.HexGrid = HexGrid;
    global.Layout = Layout;
    global.OffsetCoord = OffsetCoord;
    global.Orientation = Orientation;

})(this);
