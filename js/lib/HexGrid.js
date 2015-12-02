(function (global) {
    "use strict";

    /**
     *
     * @constructor
     */
    var HexGrid = function (opts) {
        this.width = Utility.getOpt(opts, 'width', 600);
        this.height = Utility.getOpt(opts, 'height', 600);
        this.tileSize = Utility.getOpt(opts, 'tileSize', 20);
        this.tileSpacing = Utility.getOpt(opts, 'tileSpacing', 0);
        this.pointyTiles = Utility.getOpt(opts, 'pointyTiles', false);
        this.cells = [];
    };

    HexGrid.prototype = {
        axialToCube: function (axial) {
            return {
                x: axial.q,
                y: axial.r,
                z: -axial.q - axial.r
            };
        },
        axialDistance: function (q1, r1, q2, r2) {
            return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(q1 + r1 - q2 - r2)) / 2;
        },
        cubeToAxial: function (cube) {
            return {
                q: cube.x,
                r: cube.y,
                s: -cube.x - cube.y
            };
        },
        drawGrid: function (withLabels) {
            var _this = this;

            this.cellsContainer = new PIXI.Container();
            this.cells.forEach(function (hex) {
                hex.draw(withLabels);
                _this.cellsContainer.addChild(hex.shape);
            });

            return this.cellsContainer;
        },
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
        shapeRing: function (q, r, radius) {
            var i, j, len, moveDirection, moveDirectionIndex, moveDirections, ref, hexes;
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
