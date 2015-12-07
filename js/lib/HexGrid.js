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
            var currentRing, i, ref, hexes;
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
            var hexes = [],
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
            var hexes = [];
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
            var hexes = [];
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
            var hexes = [];
            for (let q = 0; q <= size; q++) {
                for (let r = size - q; r <= size; r++) {
                    hexes.push(new Hex(q, r, -q - r, this.getCenterXY(q, r), this.tileSize, this.pointyTiles));
                }
            }
            this.cells = hexes;

            return hexes;
        }
    };

    global.HexGrid = HexGrid;

})(this);
