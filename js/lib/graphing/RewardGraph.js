var RewardGraph = RewardGraph || {},
    Utility = Utility || {};

(function (global) {
    "use strict";

    /**
     * Options for the RewardGraph
     * @typedef {Object} rewardOpts
     * @property {number} canvas - The canvas element for the graph
     * @property {number} stepHorizon - The step horizon
     * @property {number} width - The width
     * @property {number} height - The height
     * @property {number} maxy - The width
     * @property {number} miny - The height
     */

    /**
     * RewardGraph
     * @name RewardGraph
     * @constructor
     *
     * @param {rewardOpts} opts
     * @return {RewardGraph}
     */
    var RewardGraph = function (opts) {
        this.canvas = Utility.getOpt(opts, 'canvas', document.getElementById("rewardGraph"));
        this.ctx = this.canvas.getContext("2d");

        this.stepHorizon = Utility.getOpt(opts, 'stepHorizon', 1000);
        this.width = Utility.getOpt(opts, 'width', this.canvas.width);
        this.height = Utility.getOpt(opts, 'height', this.canvas.height);

        if (typeof opts.maxy !== 'undefined') {
            this.maxyForced = opts.maxy;
        }
        if (typeof opts.miny !== 'undefined') {
            this.minyForced = opts.miny;
        }

        this.maxy = -9999;
        this.miny = 9999;

        this.styles = ['black', 'red', 'green', 'blue', 'navy', 'magenta', 'cyan', 'purple', 'aqua', 'olive', 'lime'];
        this.hexStyles = [0x000000, 0xFF0000, 0x00FF00, 0x0000FF, 0x000080, 0xFF00FF, 0x00FFFF, 0x800080, 0x00FFFF, 0x808000, 0x00FF00];

        this.pts = [];

        return this;
    };

    RewardGraph.prototype = {
        /**
         * Set the legend and colors up
         * @param legend
         */
        setLegend: function (legend) {
            this.legend = legend;
            this.numLines = this.legend.length;
            this.pts = new Array(this.numLines);
            for (let i = 0; i < this.numLines; i++) {
                this.pts[i] = [];
            }
        },
        /**
         * Add a point to the graph
         * @param {number} step
         * @param {number} yl
         * @return {undefined}
         */
        addPoint: function (step, idx, yl) {
            // in ms
            let time = new Date().getTime(),
                n = yl.length,
                point = {
                    step: step,
                    time: time,
                    yl: yl
                };

            for (let k = 0; k < n; k++) {
                let y = yl[k];
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
                this.pts[idx] = [];
            }

            if (step > this.stepHorizon) {
                this.stepHorizon *= 2;
            }
        },
        /**
         * Draw it
         * @return {undefined}
         */
        drawPoints: function () {
            let pad = 25,
                H = this.height,
                W = this.width,
                ng = 10,
                ctx = this.ctx,
                agentN = [],
                f2t = function (x) {
                    var dd = 1.0 * Math.pow(10, 2);
                    return '' + Math.floor(x * dd) / dd;
                },
                t = function (x, y, s) {
                    let tx = x / s.stepHorizon * (W - pad * 2) + pad,
                        ty = H - ((y - s.miny) / (s.maxy - s.miny) * (H - pad * 2) + pad);

                    return {
                        tx: tx,
                        ty: ty
                    };
                };

            ctx.clearRect(0, 0, W, H);
            ctx.font = "10px Georgia";

            // Draw guidelines and values
            ctx.strokeStyle = "#999";
            ctx.beginPath();

            for (let gl = 0; gl <= ng; gl++) {
                let xpos = gl / ng * (W - 2 * pad) + pad;
                ctx.moveTo(xpos, pad);
                ctx.lineTo(xpos, H - pad);
                ctx.fillText(f2t(gl / ng * this.stepHorizon / 1000) + 'k', xpos, H - pad + 14);
            }

            for (let v = 0; v <= ng; v++) {
                let ypos = v / ng * (H - 2 * pad) + pad;
                ctx.moveTo(pad, ypos);
                ctx.lineTo(W - pad, ypos);
                ctx.fillText(f2t((ng - v) / ng * (this.maxy - this.miny) + this.miny), 0, ypos);
            }
            ctx.stroke();

            for (let z = 0; z < this.numLines; z++) {
                agentN[z] = this.pts[z].length;
                if (agentN[z] < 2) {
                    return;
                }
            }

            // Draw legend
            for (let l = 0; l < this.numLines; l++) {
                ctx.fillStyle = this.legend[l].color;
                ctx.fillText(this.legend[l].name, W - pad - 100, pad + 20 + l * 16);
            }

            // Draw the actual curve
            for (let l = 0; l < this.numLines; l++) {
                ctx.strokeStyle = this.legend[l].color;
                ctx.beginPath();
                for (let k = 0; k < agentN[l]; k++) {
                    // Draw line from i-1 to i
                    let p = this.pts[l][k],
                        pt = t(p.step, p.yl[0], this);
                    if (k === 0) {
                        ctx.moveTo(pt.tx, pt.ty);
                    } else {
                        ctx.lineTo(pt.tx, pt.ty);
                    }
                }
                ctx.stroke();
            }
            ctx.fillStyle = "black";
        }
    };

    global.RewardGraph = RewardGraph;

}(this));
