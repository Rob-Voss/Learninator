(function (global) {
    "use strict";

    /**
     *
     * @constructor
     */
    var HexGrid = function (width, height, tileSize, tileSpacing, pointyTiles) {
        this.width = width || 600;
        this.height = height || 600;
        this.tileSize = tileSize || 20;
        this.tileSpacing = tileSpacing || 0;
        this.pointyTiles = pointyTiles || false;
    };

    HexGrid.prototype = {
        ring: function (q, r, radius) {
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
                            r: r
                        });
                    }
                }
            }

            return result;
        },
        hexagon: function (q, r, radius, solid) {
            var currentRing, i, ref, result;
            result = [];
            if (solid) {
                result.push({
                    q: q,
                    r: r
                });
            }

            for (currentRing = i = 1, ref = radius; 1 <= ref ? i <= ref : i >= ref; currentRing = 1 <= ref ? ++i : --i) {
                result = result.concat(this.ring(q, r, currentRing));
            }

            return result;
        },
        triangularShape: function (size) {
            var k, i, _g3, _g2,
                hexes = [],
                _g1 = 0,
                _g = size + 1;
            while (_g1 < _g) {
                k = _g1++;
                _g3 = 0;
                _g2 = k + 1;
                while (_g3 < _g2) {
                    i = _g3++;
                    hexes.push(new Cube(i, -k, k - i));
                }
            }
            return hexes;
        },
        trapezoidalShape: function (minQ, maxQ, minR, maxR, toCube) {
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
                    hexes.push(toCube(new Hex(q, r)));
                }
            }
            return hexes;
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
        axialDistance: function (q1, r1, q2, r2) {
            return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(q1 + r1 - q2 - r2)) / 2;
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
                r: r
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
        cubeToAxial: function (cube) {
            return {
                q: cube.x,
                r: cube.y
            };
        },
        axialToCube: function (axial) {
            return {
                x: axial.q,
                y: axial.r,
                z: -axial.q - axial.r
            };
        }
    };

    global.HexGrid = HexGrid;

})(this);
