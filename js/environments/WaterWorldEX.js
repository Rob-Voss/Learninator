var WaterWorldEX = WaterWorldEX || {},
    Vec = Vec || {},
    World = World || {};

(function (global) {
    "use strict";

    /**
     * World object contains many agents and walls and food and stuff
     * @name WaterWorldEX
     * @extends World
     * @constructor
     *
     * @returns {WaterWorldEX}
     */
    function WaterWorldEX() {
        this.width = 600;
        this.height = 600;
        this.cheats = {
            quad: false,
            grid: false,
            walls: false
        };

        this.numEntityAgents = 2;
        this.entityAgentOpts = {
            brainType: 'RLDQN',
            env: Utility.stringify({
                getNumStates: function () {
                    return 8 * 5;
                },
                getMaxNumActions: function () {
                    return 4;
                },
                startState: function () {
                    return 0;
                }
            }),
            numActions: 4,
            numStates: 8 * 5,
            numEyes: 8,
            numTypes: 5,
            range: 85,
            proximity: 85,
            radius: 20,
            collision: true,
            interactive: false,
            useSprite: false,
            movingEntities: true,
            cheats: {
                gridLocation: false,
                position: false,
                name: false,
                id: true
            }
        };

        this.numEntities = 40;
        this.entityOpts = {
            radius: 10,
            collision: true,
            interactive: false,
            useSprite: false,
            movingEntities: true,
            cheats: {
                gridLocation: false,
                position: false,
                id: false,
                name: false
            }
        };

        this.agents = [
            new AgentRLDQN(new Vec(Utility.randi(3, this.width - 2), Utility.randi(3, this.height - 2)),
                {
                    brainType: 'RLDQN',
                    env: Utility.stringify({
                        getNumStates: function () {
                            return 30 * 5;
                        },
                        getMaxNumActions: function () {
                            return 4;
                        },
                        startState: function () {
                            return 0;
                        }
                    }),
                    numActions: 4,
                    numStates: 30 * 5,
                    numEyes: 30,
                    numTypes: 5,
                    range: 120,
                    proximity: 120,
                    radius: 10,
                    worker: false,
                    collision: true,
                    interactive: false,
                    useSprite: false,
                    cheats: {
                        gridLocation: false,
                        position: false,
                        name: false,
                        id: true
                    }
                }),
            new AgentRLDQN(new Vec(Utility.randi(3, this.width - 2), Utility.randi(3, this.height - 2)),
                {
                    brainType: 'RLDQN',
                    env: Utility.stringify({
                        getNumStates: function () {
                            return 30 * 5;
                        },
                        getMaxNumActions: function () {
                            return 4;
                        },
                        startState: function () {
                            return 0;
                        }
                    }),
                    numActions: 4,
                    numStates: 30 * 5,
                    numEyes: 30,
                    numTypes: 5,
                    range: 120,
                    proximity: 120,
                    radius: 10,
                    worker: false,
                    collision: true,
                    interactive: false,
                    useSprite: false,
                    cheats: {
                        gridLocation: false,
                        position: false,
                        name: false,
                        id: true
                    }
                })
        ];
        this.numAgents = this.agents.length;

        World.call(this);

        this.agents[0].load('zoo/wateragent.json');
        this.agents[1].load('zoo/wateragent.json');
        this.entityAgents[0].load('zoo/puckagent.json');
        this.entityAgents[1].load('zoo/puckagent.json');

        return this;
    }

    WaterWorldEX.prototype = Object.create(World.prototype);
    WaterWorldEX.prototype.constructor = World;

    global.WaterWorldEX = WaterWorldEX;

}(this));
