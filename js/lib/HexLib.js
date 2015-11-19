(function (global) {
    "use strict";

    var HexLib = function (stage, layout) {
        this.stage = stage;
        this.layout = layout;

        return this;
    };

    HexLib.prototype = {
        colorForHex: function (hex) {
            // Match the color style used in the main article
            if (hex.q === 0 && hex.r === 0 && hex.s === 0) {
                return "hsl(0, 50%, 0%)";
            } else if (hex.q === 0) {
                return "hsl(90, 70%, 35%)";
            } else if (hex.r === 0) {
                return "hsl(200, 100%, 35%)";
            } else if (hex.s === 0) {
                return "hsl(300, 40%, 50%)";
            } else {
                return "hsl(0, 0%, 50%)";
            }
        },
        drawHexLabel: function (hex) {
            var center = this.layout.hexToPixel(hex);
            this.ctx.fillStyle = this.colorForHex(hex);
            this.ctx.font = "12px sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText((hex.q == 0 && hex.r == 0 && hex.s == 0) ? "q,r,s" : (hex.q + "," + hex.r + "," + hex.s), center.x, center.y);
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
        shapeParallelogram: function (q1, r1, q2, r2, constructor) {
            var hexes = [];
            for (let q = q1; q <= q2; q++) {
                for (let r = r1; r <= r2; r++) {
                    hexes.push(constructor(q, r, -q - r));
                }
            }
            return hexes;
        },
        shapeTriangle1: function (size) {
            var hexes = [];
            for (let q = 0; q <= size; q++) {
                for (let r = 0; r <= size - q; r++) {
                    let hex = new Hex(q, r, -q - r),
                        corners = this.layout.polygonCorners(hex),
                        center = this.layout.hexToPixel(hex);
                    hexes.push(new Hex(q, r, -q - r, corners, center));
                }
            }
            return hexes;
        },
        shapeTriangle2: function (size) {
            var hexes = [];
            for (let q = 0; q <= size; q++) {
                for (let r = size - q; r <= size; r++) {
                    let hex = new Hex(q, r, -q - r),
                        corners = this.layout.polygonCorners(hex),
                        center = this.layout.hexToPixel(hex);
                    hexes.push(new Hex(q, r, -q - r, corners, center));
                }
            }
            return hexes;
        },
        shapeHexagon: function (size) {
            var hexes = [];
            for (let q = -size; q <= size; q++) {
                var r1 = Math.max(-size, -q - size),
                    r2 = Math.min(size, -q + size);
                for (let r = r1; r <= r2; r++) {
                    let hex = new Hex(q, r, -q - r),
                        corners = this.layout.polygonCorners(hex),
                        center = this.layout.hexToPixel(hex);
                    hexes.push(new Hex(q, r, -q - r, corners, center));
                }
            }
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
                    let hex = new constructor(i, j, -i - j),
                        corners = this.layout.polygonCorners(hex),
                        center = this.layout.hexToPixel(hex);
                    hexes.push(new constructor(i, j, -i - j, corners, center));
                }
            }
            return hexes;
        },
        drawGrid: function (withLabels, hexes) {
            var _this = this;

            if (hexes === undefined) {
                hexes = this.shapeHexagon(10);
            }

            hexes.forEach(function (hex) {
                _this.stage.addChild(hex.shape);
                if (withLabels) {
                    //_this.drawHexLabel(hex);
                }
            });
        }
    };

    var OffsetCoord = function (col, row) {
        this.col = col;
        this.row = row;
        this.EVEN = 1;
        this.ODD = -1;

        return this;
    };

    OffsetCoord.prototype = {
        qOffsetFromCube: function (offset, h) {
            var col = h.q,
                row = h.r + Math.trunc((h.q + offset * (h.q & 1)) / 2);

            return new OffsetCoord(col, row);
        },
        qOffsetToCube: function (offset, h) {
            var q = h.col,
                r = h.row - Math.trunc((h.col + offset * (h.col & 1)) / 2),
                s = -q - r;

            return new Hex(q, r, s);
        },
        rOffsetFromCube: function (offset, h) {
            var col = h.q + Math.trunc((h.r + offset * (h.r & 1)) / 2),
                row = h.r;

            return new OffsetCoord(col, row);
        },
        rOffsetToCube: function (offset, h) {
            var q = h.col - Math.trunc((h.row + offset * (h.row & 1)) / 2),
                r = h.row,
                s = -q - r;

            return new Hex(q, r, s);
        }
    };

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

    var Layout = function (orientation, size, origin) {
        this.orientation = orientation;
        this.size = size;
        this.origin = origin;

        return this;
    };

    Layout.prototype = {
        hexToPixel: function (h) {
            var x = (this.orientation.f0 * h.q + this.orientation.f1 * h.r) * this.size.x,
                y = (this.orientation.f2 * h.q + this.orientation.f3 * h.r) * this.size.y;

            return new Point(x + this.origin.x, y + this.origin.y);
        },
        pixelToHex: function (p) {
            var pt = new Point((p.x - this.origin.x) / this.size.x, (p.y - this.origin.y) / this.size.y),
                q = this.orientation.b0 * pt.x + this.orientation.b1 * pt.y,
                r = this.orientation.b2 * pt.x + this.orientation.b3 * pt.y;

            return new Hex(q, r, -q - r);
        },
        hexCornerOffset: function (corner) {
            var angle = 2.0 * Math.PI * (corner + this.orientation.startAngle) / 6;

            return new Point(this.size.x * Math.cos(angle), this.size.y * Math.sin(angle));
        },
        polygonCorners: function (h) {
            var corners = [],
                center = this.hexToPixel(h);
            for (let i = 0; i < 6; i++) {
                var offset = this.hexCornerOffset(i);
                corners.push(new Point(center.x + offset.x, center.y + offset.y));
            }

            return corners;
        }
    };

    var hexDirections = [new Hex(1, 0, -1), new Hex(1, -1, 0), new Hex(0, -1, 1), new Hex(-1, 0, 1), new Hex(-1, 1, 0), new Hex(0, 1, -1)],
        hexDiagonals = [new Hex(2, -1, -1), new Hex(1, -2, 1), new Hex(-1, -1, 2), new Hex(-2, 1, 1), new Hex(-1, 2, -1), new Hex(1, 1, -2)];
    Hex.hexDirections = hexDirections;
    Hex.hexDiagonals = hexDiagonals;

    var layoutPointy = new Orientation(Math.sqrt(3.0), Math.sqrt(3.0) / 2.0, 0.0, 3.0 / 2.0, Math.sqrt(3.0) / 3.0, -1.0 / 3.0, 0.0, 2.0 / 3.0, 0.5),
        layoutFlat = new Orientation(3.0 / 2.0, 0.0, Math.sqrt(3.0) / 2.0, Math.sqrt(3.0), 2.0 / 3.0, 0.0, -1.0 / 3.0, Math.sqrt(3.0) / 3.0, 0.0);
    Layout.layoutPointy = layoutPointy;
    Layout.layoutFlat = layoutFlat;

    global.HexLib = HexLib;
    global.Layout = Layout;
    global.OffsetCoord = OffsetCoord;
    global.Orientation = Orientation;

})(this);
