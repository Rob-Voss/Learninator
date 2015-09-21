(function (global) {
    "use strict";

    /**
     * World object contains many agents and walls and food and stuff
     *
     * @returns {WaterWorld}
     * @constructor
     */
    var WaterWorld = function () {
        this.canvas = document.getElementById("world");
        this.xCount = 1;
        this.yCount = 1;
        this.closed = true;
        this.numItems = 40;
        this.cheats = false;

        // flot stuff
        this.nflot = 1000;
        this.smoothRewardHistory = [];
        this.smoothReward = [];
        this.flott = [];

        var agentOpts = {
            brainType: 'RLDQN',
            numEyes: 30,
            numTypes: 5,
            width: 20,
            height: 20,
            radius: 10,
            collision: true,
            interactive: false,
            useSprite: false,
            cheats: true
        };

        var agentWOpts = {
            brainType: 'RLDQN',
            numEyes: 30,
            numTypes: 5,
            width: 20,
            height: 20,
            radius: 10,
            collision: true,
            interactive: false,
            useSprite: false,
            cheats: true,
            worker: true
        };

        var entityOpts = {
            width: 20,
            height: 20,
            radius: 10,
            collision: true,
            interactive: false,
            useSprite: false,
            movingEntities: true,
            cheats: false
        };

        var vec1 = new Vec(Utility.randi(2, this.canvas.width - 2), Utility.randi(2, this.canvas.height - 2)),
            vec2 = new Vec(Utility.randi(2, this.canvas.width - 2), Utility.randi(2, this.canvas.height - 2));

        this.agents = [
            new AgentRLDQN(vec1, this, agentOpts),
            new AgentRLDQN(vec2, this, agentWOpts)
        ];

        //this.agents[0].load('zoo/wateragent.json');
        this.agents[1].load('zoo/wateragent.json');

        this.walls = [
            new Wall(new Vec(0, 0), new Vec(0 + this.canvas.width, 0)),
            new Wall(new Vec(0 + this.canvas.width, 0), new Vec(0 + this.canvas.width, 0 + this.canvas.height)),
            new Wall(new Vec(0 + this.canvas.width, 0 + this.canvas.height), new Vec(0, 0 + this.canvas.height)),
            new Wall(new Vec(0, 0 + this.canvas.height), new Vec(0, 0))
        ];

        this.initFlot = function () {
            for (let a = 0; a < this.agents.length; a++) {
                this.smoothReward[a] = null;
                this.smoothRewardHistory[a] = null;
            }
            this.container = document.getElementById('flotreward');
            this.series = [];
            for (let a = 0, ac = this.agents.length; a < ac; a++) {
                this.flott[a] = 0;
                this.smoothRewardHistory[a] = [];
                this.series[a] = {
                    data: this.getFlotRewards(a),
                    lines: {fill: true},
                    color: a,
                    label: this.agents[a].name
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
                        left: 10,
                    }
                },
                xaxis: {
                    min: 0,
                    max: this.nflot
                },
                yaxis: {
                    min: -0.10,
                    max: 0.10
                }
            });
        };

        /**
         *
         * @param {Number} an
         * @returns {Array}
         */
        this.getFlotRewards = function (an) {
            // zip rewards into flot data
            var res = [];
            if (this.smoothRewardHistory[an] === null) {
                this.smoothRewardHistory[an] = [];
            }

            for (var i = 0, hl = this.smoothRewardHistory[an].length; i < hl; i++) {
                res.push([i, this.smoothRewardHistory[an][i]]);
            }

            return res;
        };

        this.graphRewards = function () {
            for (var a = 0, ac = this.agents.length; a < ac; a++) {
                var agent = this.agents[a],
                    rew = agent.lastReward;

                if (this.smoothReward[a] === null) {
                    this.smoothReward[a] = rew;
                }
                this.smoothReward[a] = this.smoothReward[a] * 0.999 + rew * 0.001;
                this.flott[a] += 1;
                if (this.flott[a] === 50) {
                    for (var i = 0, hl = this.smoothRewardHistory[a].length; i <= hl; i++) {
                        // record smooth reward
                        if (hl >= this.nflot) {
                            this.smoothRewardHistory[a] = this.smoothRewardHistory[a].slice(1);
                        }
                        this.smoothRewardHistory[a].push(this.smoothReward[a]);
                        this.flott[a] = 0;
                    }
                }
            }

            for (var an = 0, al = this.agents.length; an < al; an++) {
                if (typeof this.series[an] !== 'undefined') {
                    this.series[an].data = this.getFlotRewards(an);
                }
            }

            this.plot.setData(this.series);
            this.plot.draw();
        };

        World.call(this, this, entityOpts);

        this.initFlot();

        return this;
    };

    WaterWorld.prototype = Object.create(World.prototype);
    WaterWorld.prototype.constructor = World;

    global.WaterWorld = WaterWorld;

}(this));
