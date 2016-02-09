var Brain = Brain || {},
    AgentEvolve = AgentEvolve || {},
    Utility = Utility || {},
    World = World || {};

(function (global) {
    "use strict";

    class Brain {
        /**
         *
         */
        constructor(opts) {
            this.size = opts.size || 20;
            this.density = opts.density || 3;
            this.mutrate = opts.mutationRate || 0.1;
            this.mutrate2 = opts.mutationRate2 || 0.3;

            // 1D array of neuron activations
            this.act = new Array(this.size);
            for (let i = 0; i < this.size; i++) {
                this.act[i] = 0;
            }

            // 2D array of synapse weights and indexes of neurons they connect to
            this.w = new Array(this.size);
            this.ix = new Array(this.size);
            for (let i = 0; i < this.size; i++) {
                this.w[i] = new Array(this.density);
                this.ix[i] = new Array(this.density);
                for (let j = 0; j < this.density; j++) {
                    this.w[i][j] = Utility.randf(-1.2, 1.2);
                    this.ix[i][j] = Utility.randi(0, this.size);
                }
            }
        }

        /**
         * Brain takes inputs and sets its outputs
         * @param s1
         * @param s2
         * @returns {{out0: number, out1: *}}
         */
        tick(s1, s2) {
            this.act[0] = s1; // Set inputs
            this.act[1] = s2;
            this.act[3] = 1; // Some bias neurons are always on
            this.act[4] = 1;
            this.act[5] = 1;
            this.act[6] = 1;

            for (let i = 7; i < this.size; i++) {
                let a = 0;
                for (let j = 0; j < this.density; j++) {
                    a += this.w[i][j] * this.act[this.ix[i][j]]
                }
                this.act[i] = 1.0 / (1.0 + Math.exp(-a));  // Pass through sigmoid
            }

            // Assume last 2 neurons are the outputs
            return {
                out0: this.act[this.size - 1] - 0.5,
                out1: this.act[this.size - 2]
            };
        }

        /**
         * Used during reproduction copy over the brain with some mutation.
         * @param brain
         */
        mutateFrom(brain) {
            // lossy copy of brain structure
            for (var i = 0; i < this.size; i++) {
                for (var j = 0; j < this.density; j++) {
                    var m = brain.w[i][j];
                    if (Utility.randf(0, 1) < this.mutrate) {
                        m += Utility.randn(0, this.mutrate2);
                    }
                    this.w[i][j] = m;

                    m = brain.ix[i][j];
                    if (Utility.randf(0, 1) < this.mutrate) {
                        m = Utility.randi(0, this.size);
                    }
                    this.ix[i][j] = m;
                }
            }
        }
    }

    class AgentEvolve {
        /**
         *
         * @param pos
         * @constructor
         */
        constructor(pos) {
            this.pos = pos;
            this.dir = Utility.randf(0, 2 * Math.PI);
            this.id = 'merps';
            this.s1 = 0;  // Food sense eye 1
            this.s2 = 0;  // Food sense eye 2
            this.radius = 15;

            this.eyeDistance = 0.6; // Separate of eyes in radians
            this.eyeLength = 30; // How many pixels away from body eyes are
            this.eyeSensitivity = 0.0005; // How sensitive is the eye? decrease for more sensitivity...
            this.eyeMultiplier = 0.5; // Linear multiplier on strength of eye.

            this.brain = new Brain({
                mutationRate: 0.1, // How common are mutations?
                mutationRate2: 0.3, // How severe are they when they do occur?
                size: 20, // How many neurons does each brain have. Must be bigger than about 10
                density: 3 // How dense are the brains? (number of synapses per neuron)
            });
            this.speed = 4.0;
            this.boost = 0.0; // Boost, on top of speed
            this.health = 1.0;
            this.rep = 0.0; // Replication counter
            this.age = 0; // Mutation counter
            this.mutation = 0.0; // Mutation counter
            this.selected = false;


        }
    }

    global.AgentEvolve = AgentEvolve;
    global.Brain = Brain;

}(this));
