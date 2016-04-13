var FlotGraph = FlotGraph || {},
    Utility = Utility || {};

(function (global) {
    "use strict";

    /**
     *
     * @constructor
     */
    var FlotGraph = function (agents) {
        var self = this;
        this.container = document.getElementById('flotreward');
        // flot reward graph stuff
        this.nflot = 1000;
        this.smoothRewardHistory = [];
        this.smoothReward = [];
        this.flott = [];
        this.series = [];
        this.agents = agents || [];

        for (let a = 0; a < this.agents.length; a++) {
            this.smoothReward[a] = null;
            this.smoothRewardHistory[a] = null;
        }

        for (let a = 0, ac = this.agents.length; a < ac; a++) {
            this.flott[a] = 0;
            this.smoothRewardHistory[a] = [];
            this.series[a] = {
                data: this.getFlotRewards(a),
                lines: {
                    fill: true
                },
                color: a,
                label: this.agents[a].id.substring(0, 10)
            };
        }

        this.plot = $.plot(this.container, this.series, {
            grid: {
                borderWidth: 1,
                minBorderMargin: 20,
                labelMargin: 10,
                backgroundColor: {
                    colors: ["#FFF", "#e4f4f4"]
                },
                margin: {
                    top: 10,
                    bottom: 10,
                    left: 10
                }
            },
            xaxis: {
                min: 0,
                max: this.nflot
            },
            yaxis: {
                min: -0.1,
                max: 0.1
            }
        });

        setInterval(function () {
            for (let a = 0, ac = self.agents.length; a < ac; a++) {
                self.series[a].data = self.getFlotRewards(a);
            }
            self.plot.setData(self.series);
            self.plot.draw();
        }, 100);

        return this;
    };

    FlotGraph.prototype = {
        /**
         * Graph the agent rewards
         */
        graphRewards: function () {
            for (let a = 0, ac = this.agents.length; a < ac; a++) {
                let agent = this.agents[a],
                    rew = agent.lastReward;
                if (this.display !== undefined) {
                    this.display.updateItem(a, '[' + agent.id.substring(0, 4) + '] Avg: ' + agent.avgReward + ' Epsi: ' + agent.epsilon);
                }
                if (this.smoothReward[a] === null) {
                    this.smoothReward[a] = rew;
                }
                this.smoothReward[a] = this.smoothReward[a] * 0.999 + rew * 0.001;
                this.flott[a] += 1;
                if (this.flott[a] === 50) {
                    for (let i = 0, hl = this.smoothRewardHistory[a].length; i <= hl; i++) {
                        // record smooth reward
                        if (hl >= this.nflot) {
                            this.smoothRewardHistory[a] = this.smoothRewardHistory[a].slice(1);
                        }
                        this.smoothRewardHistory[a].push(this.smoothReward[a]);
                        this.flott[a] = 0;
                    }
                }
                if (typeof this.series[a] !== 'undefined') {
                    this.series[a].data = this.getFlotRewards(a);
                }
            }

            this.plot.setData(this.series);
            this.plot.draw();
        },
        /**
         * zip rewards into flot data
         * @param {number} a
         * @returns {Array}
         */
        getFlotRewards: function (a) {
            var res = [];
            if (this.smoothRewardHistory[a] === null) {
                this.smoothRewardHistory[a] = [];
            }

            for (let i = 0, hl = this.smoothRewardHistory[a].length; i < hl; i++) {
                res.push([i, this.smoothRewardHistory[a][i]]);
            }

            return res;
        }
    };

    global.FlotGraph = FlotGraph;

}(this));
