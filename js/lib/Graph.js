var Graph = Graph || {};

(function (global) {
    "use strict";

    /**
     * Graph
     * @param {Object} opts
     * @returns {Graph_L3.Graph}
     */
    var Graph = function (opts) {
        this.canvas = opts.canvas;
        this.ctx = this.canvas.getContext("2d");

        this.stepHorizon = opts.stepHorizon || 1000;
        this.width = opts.width || this.canvas.width;
        this.height = opts.height || this.canvas.height;

        if (typeof opts.maxy !== 'undefined') {
            this.maxyForced = opts.maxy;
        }
        if (typeof opts.miny !== 'undefined') {
            this.minyForced = opts.miny;
        }

        this.maxy = -9999;
        this.miny = 9999;

        this.styles = ["red", "blue", "green", "black", "magenta", "cyan", "purple", "aqua", "olive", "lime", "navy"];
        this.hexStyles = [0xFF0000, 0x0000FF, 0x00FF00, 0x000000, 0xFF00FF, 0x00FFFF, 0x800080, 0x00FFFF, 0x808000, 0x00FF00, 0x000080];

        var _this = this;

        return _this;
    };

    Graph.prototype = {
        setLegend: function (legend) {
            this.legend = legend;
            this.numLines = this.legend.length;
            this.pts = new Array(this.numLines);
            for (var i = 0; i < this.numLines; i++) {
                this.pts[i] = [];
            }
        },
        /**
         * Add a point to the graph
         * @param {Number} step
         * @param {Number} yl
         * @returns {undefined}
         */
        addPoint: function (step, idx, yl) {
            // in ms
            var time = new Date().getTime(),
                n = yl.length,
                point = {
                    step: step,
                    time: time,
                    yl: yl
                };

            for (var k = 0; k < n; k++) {
                var y = yl[k];
                if (y > this.maxy * 0.99) {
                    this.maxy = y * 1.05;
                }
                if (y < this.miny * 1.01) {
                    this.miny = y * 0.95;
                }
            }

            if (typeof this.maxyForced !== 'undefined') {
                this.maxy = this.maxyForced;
            }
            if (typeof this.minyForced !== 'undefined') {
                this.miny = this.minyForced;
            }

            if (this.pts[idx] !== undefined) {
                this.pts[idx].push(point);
            } else {
                console.log('this.pts[' + idx + '] = undefined. this.pts=' + this.pts);
            }

            if (step > this.stepHorizon) {
                this.stepHorizon *= 2;
            }
        },
        /**
         * Draw it
         * @returns {undefined}
         */
        drawPoints: function () {
            var pad = 25;
            var H = this.height;
            var W = this.width;
            var ctx = this.ctx;

            ctx.clearRect(0, 0, W, H);
            ctx.font = "10px Georgia";

            var f2t = function (x) {
                var dd = 1.0 * Math.pow(10, 2);
                return '' + Math.floor(x * dd) / dd;
            };

            // Draw guidelines and values
            ctx.strokeStyle = "#999";
            ctx.beginPath();
            var ng = 10;
            for (var gl = 0; gl <= ng; gl++) {
                var xpos = gl / ng * (W - 2 * pad) + pad;
                ctx.moveTo(xpos, pad);
                ctx.lineTo(xpos, H - pad);
                ctx.fillText(f2t(gl / ng * this.stepHorizon / 1000) + 'k', xpos, H - pad + 14);
            }

            for (var v = 0; v <= ng; v++) {
                var ypos = v / ng * (H - 2 * pad) + pad;
                ctx.moveTo(pad, ypos);
                ctx.lineTo(W - pad, ypos);
                ctx.fillText(f2t((ng - v) / ng * (this.maxy - this.miny) + this.miny), 0, ypos);
            }
            ctx.stroke();
            var agentN = [];
            for (var z = 0; z < this.numLines; z++) {
                agentN[z] = this.pts[z].length;
                if (agentN[z] < 2)
                    return;
            }

            // Draw legend
            for (var l = 0; l < this.numLines; l++) {
                ctx.fillStyle = this.styles[l];
                ctx.fillText(this.legend[l].name, W - pad - 100, pad + 20 + l * 16);
            }
            ctx.fillStyle = "black";

            // Draw the actual curve
            var t = function (x, y, s) {
                var tx = x / s.step_horizon * (W - pad * 2) + pad;
                var ty = H - ((y - s.miny) / (s.maxy - s.miny) * (H - pad * 2) + pad);
                return {tx: tx, ty: ty};
            };

            for (var k = 0; k < this.numLines; k++) {
                ctx.strokeStyle = this.styles[k];
                ctx.beginPath();
                for (var i = 0; i < agentN[k]; i++) {
                    // Draw line from i-1 to i
                    var p = this.pts[k][i],
                        pt = t(p.step, p.yl[0], this);
                    if (i === 0) {
                        ctx.moveTo(pt.tx, pt.ty);
                    } else {
                        ctx.lineTo(pt.tx, pt.ty);
                    }
                }
                ctx.stroke();
            }
        }
    };

    global.Graph = Graph;

}(this));
