var Hex = Hex || {},
    HexShape = HexShape || {};

/**
 * Inspired by https://github.com/RobertBrewitz/axial-hexagonal-grid
 */
(function (global) {
    "use strict";

    /**
     * Return a color for this Hex based on it's coords
     * x = green, y = purple, z = blue
     * @returns {number}
     */
    function colorForHex(q, r, s) {
        if (q === 0 && r === 0 && s === 0) {
            return 0x000000;
        } else if (q === 0) {
            return 0x59981b;
        } else if (r === 0) {
            return 0x0077b3;
        } else if (s === 0) {
            return 0xb34db2;
        } else {
            return 0xC0C0C0;
        }
    }

    /**
     *
     * @param {Layout} layout
     * @param {number} size
     * @param {boolean} fill
     * @returns {HexShape}
     * @constructor
     */
    var HexShape = function (layout, size, fill) {
        let self = this;
        this.fill = fill || false;
        this.layout = layout || false;
        this.size = size || 20;
        this.color = colorForHex(self.q, self.r, self.s);

        if (this.layout) {
            this.pos = this.layout.hexToPixel(self);
            this.shape = new PIXI.Graphics();
            this.shape.interactive = true;
            this.shape
                .on('mousedown', function (event) {
                    this.data = event.data;
                    self.color = 0x00FF00;
                })
                .on('mouseup', function (event) {
                    self.color = colorForHex(self.q, self.r, self.s);
                })
                .on('mouseover', function (event) {
                    self.color = 0xFF0000;
                })
                .on('mouseout', function (event) {
                    self.color = colorForHex(self.q, self.r, self.s);
                });
            this.shape.entity = self;
        }

        this.draw = function () {
            this.shape.clear();
            this.shape.lineStyle(1, 0x000000);
            if (this.fill) {
                this.shape.beginFill(this.color);
            }
            for (let i = 0; i <= this.corners.length; i++) {
                if (i == 0) {
                    this.shape.moveTo(this.corners[i].x, this.corners[i].y);
                } else if (i == 6) {
                    this.shape.lineTo(this.corners[0].x, this.corners[0].y);
                } else {
                    this.shape.lineTo(this.corners[i].x, this.corners[i].y);
                }
            }
            if (this.fill) {
                this.shape.endFill();
            }

            if (this.cheatOverlay !== undefined) {
                this.shape.removeChild(this.cheatOverlay);
            }
            let txtOpts = {font: "10px Arial", fill: "#000000", align: "center"},
                posText = new PIXI.Text(this.toString(), txtOpts);
            posText.position.set(this.pos.x - this.size/2, this.pos.y-7);

            this.cheatOverlay = new PIXI.Container();
            this.cheatOverlay.addChild(posText);

            this.shape.addChild(this.cheatOverlay);
        };

        return this;
    };

    /**
     *
     * @param {Layout} layout
     * @param {number} size
     * @param {boolean} fill
     * @returns {HexShape}
     * @constructor
     */
    var HexShape = function (layout, size, fill) {
        let self = this;
        this.layout = layout || false;
        this.size = size || 20;
        this.fill = fill || false;
        this.color = colorForHex(self.q, self.r, self.s);

        if (this.layout) {
            this.pos = this.layout.hexToPixel(self);
        }
        this.shape = new PIXI.Graphics();
        this.shape.interactive = true;
        this.shape
            .on('mousedown', function (event) {
                this.data = event.data;
                self.color = 0x00FF00;
            })
            .on('mouseup', function (event) {
                self.color = colorForHex(self.q, self.r, self.s);
            })
            .on('mouseover', function (event) {
                self.color = 0xFF0000;
            })
            .on('mouseout', function (event) {
                self.color = colorForHex(self.q, self.r, self.s);
            });
        this.shape.entity = self;

        this.draw = function () {
            this.shape.clear();
            this.shape.lineStyle(1, 0x000000);
            if (this.fill) {
                this.shape.beginFill(this.color);
            }
            for (let i = 0; i <= this.corners.length; i++) {
                if (i == 0) {
                    this.shape.moveTo(this.corners[i].x, this.corners[i].y);
                } else if (i == 6) {
                    this.shape.lineTo(this.corners[0].x, this.corners[0].y);
                } else {
                    this.shape.lineTo(this.corners[i].x, this.corners[i].y);
                }
            }
            if (this.fill) {
                this.shape.endFill();
            }

            if (this.cheatOverlay !== undefined) {
                this.shape.removeChild(this.cheatOverlay);
            }
            let txtOpts = {font: "10px Arial", fill: "#000000", align: "center"},
                posText = new PIXI.Text(this.toString(), txtOpts);
            posText.position.set(this.pos.x - this.size / 2, this.pos.y - 7);

            this.cheatOverlay = new PIXI.Container();
            this.cheatOverlay.addChild(posText);

            this.shape.addChild(this.cheatOverlay);
        };

        return this;
    };


    /**
     * A Hex
     * @name Hex
     * @constructor
     *
     * @param {number} q
     * @param {number} r
     * @param {number} s
     * @returns {Hex}
     */
    var Hex = function (q, r, s) {
        this.q = q || 0;
        this.r = r || 0;
        this.s = s || -q - r;
        this.corners = [];
        this.population = [];
        this.walls = [];

        return this;
    };

    /**
     * Add a Hex to another one
     * @param {Hex} a
     * @param {Hex} b
     * @returns {Hex}
     */
    Hex.prototype.add = function (a, b) {
        return new Hex(a.q - b.q, a.r - b.r, a.s + b.s);
    };

    /**
     * Get the diagonal coords for this Hex
     * @param {number} direction
     * @returns {*}
     */
    Hex.prototype.diagonals = function (direction) {
        return hexDiagonals[direction];
    };

    /**
     * Get the neighbor
     * @param {number} direction
     * @returns {*|Hex}
     */
    Hex.prototype.diagonalNeighbor = function (hex, direction) {
        return this.add(hex, this.diagonals[direction]);
    };

    /**
     * Get the direction
     * @param {number} direction
     * @returns {*}
     */
    Hex.prototype.direction = function (direction) {
        return hexDirections[direction];
    };

    /**
     * Distance from another Hex
     * @param {Hex} a
     * @param {Hex} b
     * @returns {Hex}
     */
    Hex.prototype.distance = function (a, b) {
        return this.len(this.subtract(a, b));
    };

    /**
     * Get the length of the Hex
     * @returns {number}
     */
    Hex.prototype.len = function (hex) {
        return Math.trunc((Math.abs(hex.q) + Math.abs(hex.r) + Math.abs(hex.s)) / 2);
    };

    /**
     * Perform a linear interpolation on the Hex
     * @param {Hex} a
     * @param {Hex} b
     * @param {number} t
     * @returns {Hex}
     */
    Hex.prototype.lerp = function (a, b, t) {
        return new Hex(a.q + (b.q - a.q) * t, a.r + (b.r - a.r) * t);
    };

    /**
     * Return the coords to draw a line from one Hex to another
     * @param {Hex} a
     * @param {Hex} b
     * @returns {Array}
     */
    Hex.prototype.lineDraw = function (a, b) {
        var N = this.distance(a, b),
            results = [],
            step = 1.0 / Math.max(N, 1);
        for (let i = 0; i <= N; i++) {
            results.push(this.round(this.lerp(a, b, step * i)));
        }

        return results;
    };

    /**
     * Get the neighbor
     * @param {Hex} hex
     * @param {number} direction
     * @returns {*|Hex}
     */
    Hex.prototype.neighbor = function (hex, direction) {
        return this.add(hex, this.direction(direction));
    };

    /**
     * Round the Hex
     * @param {Hex} hex
     * @returns {Hex}
     */
    Hex.prototype.round = function (hex) {
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
    };

    /**
     * Scale the Hex according to the scalar
     * @param {Hex} hex
     * @param {number} k
     * @returns {Hex}
     */
    Hex.prototype.scale = function (hex, k) {
        return new Hex(hex.q * k, hex.r * k, hex.s * k);
    };

    /**
     * Subtract a Hex
     * @param {Hex} a
     * @param {Hex} b
     * @returns {Hex}
     */
    Hex.prototype.subtract = function (a, b) {
        return new Hex(a.q - b.q, a.r - b.r, a.s - b.s);
    };

    /**
     * Convert coords to string
     * @returns {string}
     */
    Hex.prototype.toString = function () {
        return this.v().join(",");
    };

    /**
     * Get an array of coords
     * @returns {*[]}
     */
    Hex.prototype.v = function () {
        return [this.q, this.r, this.s];
    };

    var hexDirections = [new Hex(1, 0, -1), new Hex(1, -1, 0), new Hex(0, -1, 1), new Hex(-1, 0, 1), new Hex(-1, 1, 0), new Hex(0, 1, -1)],
        hexDiagonals = [new Hex(2, -1, -1), new Hex(1, -2, 1), new Hex(-1, -1, 2), new Hex(-2, 1, 1), new Hex(-1, 2, -1), new Hex(1, 1, -2)];
    Hex.hexDirections = hexDirections;
    Hex.hexDiagonals = hexDiagonals;

    global.Hex = Hex;
    global.HexShape = HexShape;

})(this);
