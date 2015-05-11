// GA addon for convnet.js

(function (global) {
	"use strict";
	// convenience
	var Vol = convnetjs.Vol;
	// used utilities, make explicit local references
	var randf = convnetjs.randf;
	var randn = convnetjs.randn;
	var randi = convnetjs.randi;
	var zeros = convnetjs.zeros;
	var Net = convnetjs.Net;
	var maxmin = convnetjs.maxmin;
	var randperm = convnetjs.randperm;
	var weightedSample = convnetjs.weightedSample;
	var getopt = convnetjs.getopt;
	var arrUnique = convnetjs.arrUnique;

	function assert(condition, message) {
		if (!condition) {
			message = message || "Assertion failed";
			if (typeof Error !== "undefined") {
				throw new Error(message);
			}
			throw message; // Fallback
		}
	}

	// returns a random cauchy random variable with gamma (controls magnitude sort of like stdev in randn)
	// http://en.wikipedia.org/wiki/Cauchy_distribution
	var randc = function (m, gamma) {
		return m + gamma * 0.01 * randn(0.0, 1.0) / randn(0.0, 1.0);
	};

	// chromosome implementation using an array of floats
	var Chromosome = function (floatArray) {
		this.fitness = 0; // default value
		this.nTrial = 0; // number of trials subjected to so far.
		this.gene = floatArray;
	};

	Chromosome.prototype = {
		/**
		 * adds a normal random variable of stdev width, zero mean to each gene.
		 * @param {type} burst_magnitude_
		 * @returns {undefined}
		 */
		burst_mutate: function (burst_magnitude_) {
			var burst_magnitude = burst_magnitude_ || 0.1;
			var i, N;
			N = this.gene.length;
			for (i = 0; i < N; i++) {
				this.gene[i] += randn(0.0, burst_magnitude);
			}
		},
		/**
		 * resets each gene to a random value with zero mean and stdev
		 * @param {type} burst_magnitude_
		 * @returns {undefined}
		 */
		randomize: function (burst_magnitude_) {
			var burst_magnitude = burst_magnitude_ || 0.1;
			var i, N;
			N = this.gene.length;
			for (i = 0; i < N; i++) {
				this.gene[i] = randn(0.0, burst_magnitude);
			}
		},
		/**
		 * adds random gaussian (0,stdev) to each gene with prob mutation_rate
		 * @param {type} mutation_rate_
		 * @param {type} burst_magnitude_
		 * @returns {undefined}
		 */
		mutate: function (mutation_rate_, burst_magnitude_) {
			var mutation_rate = mutation_rate_ || 0.1;
			var burst_magnitude = burst_magnitude_ || 0.1;
			var i, N;
			N = this.gene.length;
			for (i = 0; i < N; i++) {
				if (randf(0, 1) < mutation_rate) {
					this.gene[i] += randn(0.0, burst_magnitude);
				}
			}
		},
		/**
		 * performs one-point crossover with partner to produce 2 kids assumes all
		 * chromosomes are initialised with same array size. pls make sure of this before calling
		 * @param {type} partner
		 * @param {type} kid1
		 * @param {type} kid2
		 * @returns {undefined}
		 */
		crossover: function (partner, kid1, kid2) {
			var i, N;
			N = this.gene.length;
			var l = randi(0, N); // crossover point
			for (i = 0; i < N; i++) {
				if (i < l) {
					kid1.gene[i] = this.gene[i];
					kid2.gene[i] = partner.gene[i];
				} else {
					kid1.gene[i] = partner.gene[i];
					kid2.gene[i] = this.gene[i];
				}
			}
		},
		/**
		 * copies c's gene into itself
		 * @param {type} c
		 * @returns {undefined}
		 */
		copyFrom: function (c) {
			var i, N;
			this.copyFromGene(c.gene);
		},
		/**
		 * gene into itself
		 * @param {type} gene
		 * @returns {undefined}
		 */
		copyFromGene: function (gene) {
			var i, N;
			N = this.gene.length;
			for (i = 0; i < N; i++) {
				this.gene[i] = gene[i];
			}
		},
		/**
		 * returns an exact copy of itself (into new memory, doesn't return reference)
		 * @returns {ga_L3.Chromosome}
		 */
		clone: function () {
			var newGene = zeros(this.gene.length);
			var i;
			for (i = 0; i < this.gene.length; i++) {
				newGene[i] = Math.round(10000 * this.gene[i]) / 10000;
			}
			var c = new Chromosome(newGene);
			c.fitness = this.fitness;
			return c;
		}
	};

	// counts the number of weights and biases in the network
	function getNetworkSize(net) {
		var layer = null;
		var filter = null;
		var bias = null;
		var w = null;
		var count = 0;
		var i, j, k;
		for (i = 0; i < net.layers.length; i++) {
			layer = net.layers[i];
			filter = layer.filters;
			if (filter) {
				for (j = 0; j < filter.length; j++) {
					w = filter[j].w;
					count += w.length;
				}
			}
			bias = layer.biases;
			if (bias) {
				w = bias.w;
				count += w.length;
			}
		}
		return count;
	}

	// pushes the gene (floatArray) to fill up weights and biases in net
	function pushGeneToNetwork(net, gene) {
		var count = 0;
		var layer = null;
		var filter = null;
		var bias = null;
		var w = null;
		var i, j, k;
		for (i = 0; i < net.layers.length; i++) {
			layer = net.layers[i];
			filter = layer.filters;
			if (filter) {
				for (j = 0; j < filter.length; j++) {
					w = filter[j].w;
					for (k = 0; k < w.length; k++) {
						w[k] = gene[count++];
					}
				}
			}
			bias = layer.biases;
			if (bias) {
				w = bias.w;
				for (k = 0; k < w.length; k++) {
					w[k] = gene[count++];
				}
			}
		}
	}

	// gets all the weight/biases from network in a floatArray
	function getGeneFromNetwork(net) {
		var gene = [];
		var layer = null;
		var filter = null;
		var bias = null;
		var w = null;
		var i, j, k;
		for (i = 0; i < net.layers.length; i++) {
			layer = net.layers[i];
			filter = layer.filters;
			if (filter) {
				for (j = 0; j < filter.length; j++) {
					w = filter[j].w;
					for (k = 0; k < w.length; k++) {
						gene.push(w[k]);
					}
				}
			}
			bias = layer.biases;
			if (bias) {
				w = bias.w;
				for (k = 0; k < w.length; k++) {
					gene.push(w[k]);
				}
			}
		}
		return gene;
	}

	// returns a FloatArray copy of real numbered array x.
	function copyFloatArray(x) {
		var N = x.length;
		var y = zeros(N);
		for (var i = 0; i < N; i++) {
			y[i] = x[i];
		}
		return y;
	}

	// copies a FloatArray copy of real numbered array x into y
	function copyFloatArrayIntoArray(x, y) {
		var N = x.length;
		for (var i = 0; i < N; i++) {
			y[i] = x[i];
		}
	}

	// implementation of basic conventional neuroevolution algorithm (CNE)
	//
	// options:
	// population_size : positive integer
	// mutation_rate : [0, 1], when mutation happens, chance of each gene getting mutated
	// elite_percentage : [0, 0.3], only this group mates and produces offsprings
	// mutation_size : positive floating point.  stdev of gausian noise added for mutations
	// target_fitness : after fitness achieved is greater than this float value, learning stops
	// burst_generations : positive integer.  if best fitness doesn't improve after this number of generations
	//                    then mutate everything!
	// best_trial : default 1.  save best of best_trial's results for each chromosome.
	//
	// initGene:  init float array to initialize the chromosomes.  can be result obtained from pretrained sessions.
	var GATrainer = function (net, options_, initGene) {

		this.net = net;

		var options = options_ || {};
		this.population_size = typeof options.population_size !== 'undefined' ? options.population_size : 100;
		this.population_size = Math.floor(this.population_size / 2) * 2; // make sure even number
		this.mutation_rate = typeof options.mutation_rate !== 'undefined' ? options.mutation_rate : 0.01;
		this.elite_percentage = typeof options.elite_percentage !== 'undefined' ? options.elite_percentage : 0.2;
		this.mutation_size = typeof options.mutation_size !== 'undefined' ? options.mutation_size : 0.05;
		this.target_fitness = typeof options.target_fitness !== 'undefined' ? options.target_fitness : 10000000000000000;
		this.burst_generations = typeof options.burst_generations !== 'undefined' ? options.burst_generations : 10;
		this.best_trial = typeof options.best_trial !== 'undefined' ? options.best_trial : 1;
		this.chromosome_size = getNetworkSize(this.net);

		var initChromosome = null;
		if (initGene) {
			initChromosome = new Chromosome(initGene);
		}
		// population
		this.chromosomes = [];
		for (var i = 0; i < this.population_size; i++) {
			var chromosome = new Chromosome(zeros(this.chromosome_size));
			// if initial gene supplied, burst mutate param.
			if (initChromosome) {
				chromosome.copyFrom(initChromosome);
				pushGeneToNetwork(this.net, initChromosome.gene);
				// don't mutate the first guy.
				if (i > 0) {
					chromosome.burst_mutate(this.mutation_size);
				}
			} else {
				chromosome.randomize(1.0);
			}
			this.chromosomes.push(chromosome);
		}

		this.bestFitness = -10000000000000000;
		this.bestFitnessCount = 0;

	};

	GATrainer.prototype = {
		/**
		 * has to pass in fitness function.  returns best fitness
		 * @param {type} fitFunc
		 * @returns {Number}
		 */
		train: function (fitFunc) {
			var bestFitFunc = function (nTrial, net) {
				var bestFitness = -10000000000000000;
				var fitness;
				for (var i = 0; i < nTrial; i++) {
					fitness = fitFunc(net);
					if (fitness > bestFitness) {
						bestFitness = fitness;
					}
				}
				return bestFitness;
			};

			var i, N;
			var fitness;
			var c = this.chromosomes;
			N = this.population_size;

			var bestFitness = -10000000000000000;

			// process first net (the best one)
			pushGeneToNetwork(this.net, c[0].gene);
			fitness = bestFitFunc(this.best_trial, this.net);
			c[0].fitness = fitness;
			bestFitness = fitness;
			if (bestFitness > this.target_fitness) {
				return bestFitness;
			}

			for (i = 1; i < N; i++) {
				pushGeneToNetwork(this.net, c[i].gene);
				fitness = bestFitFunc(this.best_trial, this.net);
				c[i].fitness = fitness;
				if (fitness > bestFitness) {
					bestFitness = fitness;
				}
			}

			// sort the chromosomes by fitness
			c = c.sort(function (a, b) {
				if (a.fitness > b.fitness) {
					return -1;
				}
				if (a.fitness < b.fitness) {
					return 1;
				}
				return 0;
			});

			var Nelite = Math.floor(Math.floor(this.elite_percentage * N) / 2) * 2; // even number
			for (i = Nelite; i < N; i += 2) {
				var p1 = randi(0, Nelite);
				var p2 = randi(0, Nelite);
				c[p1].crossover(c[p2], c[i], c[i + 1]);
			}

			// keep best guy the same.  don't mutate the best one, so start from 1, not 0.
			for (i = 1; i < N; i++) {
				c[i].mutate(this.mutation_rate, this.mutation_size);
			}

			// push best one to network.
			pushGeneToNetwork(this.net, c[0].gene);
			// didn't beat the record this time
			if (bestFitness < this.bestFitness) {
				this.bestFitnessCount++;
				// stagnation, do burst mutate!
				if (this.bestFitnessCount > this.burst_generations) {
					for (i = 1; i < N; i++) {
						c[i].copyFrom(c[0]);
						c[i].burst_mutate(this.mutation_size);
					}
					//c[0].burst_mutate(this.mutation_size); // don't mutate best solution.
				}

			} else {
				this.bestFitnessCount = 0; // reset count for burst
				this.bestFitness = bestFitness; // record the best fitness score
			}

			return bestFitness;
		}
	};

	/**
	 *  variant of ESP network implemented population of N sub neural nets, each to
	 *  be co-evolved by ESPTrainer fully recurrent.  outputs of each sub nn is
	 *  also the input of all other sub nn's and itself.
	 *  inputs should be order of ~ -10 to +10, and expect output to be similar magnitude.
	 *  user can grab outputs of the the N sub networks and use them to accomplish some task for training
	 * @param {type} Nsp Number of sub populations (ie, 4)
	 * @param {type} Ninput Number of real inputs to the system (ie, 2).  so actual number of input is Niput + Nsp
	 * @param {type} Nhidden Number of hidden neurons in each sub population (ie, 16)
	 * @param {type} genes (optional) array of Nsp genes (floatArrays) to initialise the network (pretrained)
	 * @returns {ga_L3.ESPNet}
	 */
	var ESPNet = function (Nsp, Ninput, Nhidden, genes) {
		this.net = []; // an array of convnet.js feed forward nn's
		this.Ninput = Ninput;
		this.Nsp = Nsp;
		this.Nhidden = Nhidden;
		this.input = new convnetjs.Vol(1, 1, Nsp + Ninput); // hold most up to date input vector
		this.output = zeros(Nsp);

		// define the architecture of each sub nn:
		var layer_defs = [];
		layer_defs.push({
			type: 'input',
			out_sx: 1,
			out_sy: 1,
			out_depth: (Ninput + Nsp)
		});
		layer_defs.push({
			type: 'fc',
			num_neurons: Nhidden,
			activation: 'sigmoid'
		});
		layer_defs.push({
			type: 'regression',
			num_neurons: 1 // one output for each sub nn, gets fed back into inputs.
		});

		var network;
		for (var i = 0; i < Nsp; i++) {
			network = new convnetjs.Net();
			network.makeLayers(layer_defs);
			this.net.push(network);
		}

		// if pretrained network is supplied:
		if (genes) {
			this.pushGenes(genes);
		}
	};

	ESPNet.prototype = {
		/**
		 * feeds output back to last bit of input vector
		 * @returns {undefined}
		 */
		feedback: function () {
			var i;
			var Ninput = this.Ninput;
			var Nsp = this.Nsp;
			for (i = 0; i < Nsp; i++) {
				this.input.w[i + Ninput] = this.output[i];
			}
		},
		/**
		 * input is a vector of length this.Ninput of real numbers this function also
		 * grabs the previous most recent output and put it into the internal input vector
		 * @param {type} input
		 * @returns {undefined}
		 */
		setInput: function (input) {
			var i;
			var Ninput = this.Ninput;
			var Nsp = this.Nsp;
			for (i = 0; i < Ninput; i++) {
				this.input.w[i] = input[i];
			}
			this.feedback();
		},
		/**
		 * returns array of output of each Nsp neurons after a forward pass.
		 * @returns {Number.w|d.w|e.w|a.w|Array.w|b@call;bind.w}
		 */
		forward: function () {
			var i, j;
			var Ninput = this.Ninput;
			var Nsp = this.Nsp;
			var y = zeros(Nsp);
			var a; // temp variable to old output of forward pass
			for (i = Nsp - 1; i >= 0; i--) {
				// for the base network, forward with output of other support networks
				if (i === 0) {
					this.feedback();
				}
				a = this.net[i].forward(this.input); // forward pass sub nn # i
				y[i] = a.w[0]; // each sub nn only has one output.
				this.output[i] = y[i]; // set internal output to track output
			}
			return y;
		},
		/**
		 * return total number of weights and biases in a single sub nn.
		 * @returns {Number}
		 */
		getNetworkSize: function () {
			return getNetworkSize(this.net[0]); // each network has identical architecture.
		},
		/**
		 * return an array of Nsp genes (floatArrays of length getNetworkSize())
		 * @returns {Array|@exp;Array}
		 */
		getGenes: function () {
			var i;
			var Nsp = this.Nsp;
			var result = [];
			for (i = 0; i < Nsp; i++) {
				result.push(getGeneFromNetwork(this.net[i]));
			}
			return result;
		},
		/**
		 * genes is an array of Nsp genes (floatArrays)
		 * @param {type} genes
		 * @returns {undefined}
		 */
		pushGenes: function (genes) {
			var i;
			var Nsp = this.Nsp;
			for (i = 0; i < Nsp; i++) {
				pushGeneToNetwork(this.net[i], genes[i]);
			}
		}
	};

	// implementation of variation of Enforced Sub Population neuroevolution algorithm
	//
	// options:
	// population_size : population size of each subnetwork inside espnet
	// mutation_rate : [0, 1], when mutation happens, chance of each gene getting mutated
	// elite_percentage : [0, 0.3], only this group mates and produces offsprings
	// mutation_size : positive floating point.  stdev of gausian noise added for mutations
	// target_fitness : after fitness achieved is greater than this float value, learning stops
	// num_passes : number of times each neuron within a sub population is tested
	//          on average, each neuron will be tested num_passes * esp.Nsp times.
	// burst_generations : positive integer.  if best fitness doesn't improve after this number of generations
	//                    then start killing neurons that don't contribute to the bottom line! (reinit them with randoms)
	// best_mode : if true, this will assign each neuron to the best fitness trial it has experienced.
	//             if false, this will use the average of all trials experienced.
	// initGenes:  init Nsp array of floatarray to initialize the chromosomes.  can be result obtained from pretrained sessions.
	var ESPTrainer = function (espnet, options_, initGenes) {

		this.espnet = espnet;
		this.Nsp = espnet.Nsp;
		var Nsp = this.Nsp;

		var options = options_ || {};
		this.population_size = typeof options.population_size !== 'undefined' ? options.population_size : 50;
		this.population_size = Math.floor(this.population_size / 2) * 2; // make sure even number
		this.mutation_rate = typeof options.mutation_rate !== 'undefined' ? options.mutation_rate : 0.2;
		this.elite_percentage = typeof options.elite_percentage !== 'undefined' ? options.elite_percentage : 0.2;
		this.mutation_size = typeof options.mutation_size !== 'undefined' ? options.mutation_size : 0.02;
		this.target_fitness = typeof options.target_fitness !== 'undefined' ? options.target_fitness : 10000000000000000;
		this.num_passes = typeof options.num_passes !== 'undefined' ? options.num_passes : 2;
		this.burst_generations = typeof options.burst_generations !== 'undefined' ? options.burst_generations : 10;
		this.best_mode = typeof options.best_mode !== 'undefined' ? options.best_mode : false;
		this.chromosome_size = this.espnet.getNetworkSize();

		this.initialize(initGenes);
	};

	ESPTrainer.prototype = {
		initialize: function (initGenes) {
			var i, j;
			var y;
			var Nsp = this.Nsp;
			this.sp = []; // sub populations
			this.bestGenes = []; // array of Nsp number of genes, records the best combination of genes for the bestFitness achieved so far.
			var chromosomes, chromosome;
			for (i = 0; i < Nsp; i++) {
				chromosomes = []; // empty list of chromosomes
				for (j = 0; j < this.population_size; j++) {
					chromosome = new Chromosome(zeros(this.chromosome_size));
					if (initGenes) {
						chromosome.copyFromGene(initGenes[i]);
						if (j > 0) { // don't mutate first guy (pretrained)
							chromosome.burst_mutate(this.mutation_size);
						}
					} else { // push random genes to this.bestGenes since it has not been initalized.
						chromosome.randomize(1.0); // create random gene array if no pretrained one is supplied.
					}
					chromosomes.push(chromosome);
				}
				y = copyFloatArray(chromosomes[0].gene); // y should either be random init gene, or pretrained.
				this.bestGenes.push(y);
				this.sp.push(chromosomes); // push array of chromosomes into each population
			}

			assert(this.bestGenes.length === Nsp);
			this.espnet.pushGenes(this.bestGenes); // initial

			this.bestFitness = -10000000000000000;
			this.bestFitnessCount = 0;
		},
		/**
		 * has to pass in fitness function.  returns best fitness
		 * @param {type} fitFunc
		 * @returns {Number}
		 */
		train: function (fitFunc) {

			var i, j, k, m, N, Nsp;
			var fitness;
			var c = this.sp; // array of arrays that holds every single chromosomes (Nsp x N);
			N = this.population_size; // number of chromosomes in each sub population
			Nsp = this.Nsp; // number of sub populations

			var bestFitness = -10000000000000000;
			var bestSet, bestGenes;
			var cSet;
			var genes;

			// helper function to return best fitness run nTrial times
			var bestFitFunc = function (nTrial, net) {
				var bestFitness = -10000000000000000;
				var fitness;
				for (var i = 0; i < nTrial; i++) {
					fitness = fitFunc(net);
					if (fitness > bestFitness) {
						bestFitness = fitness;
					}
				}
				return bestFitness;
			};

			// helper function to create a new array filled with genes from an array of chromosomes
			// returns an array of Nsp floatArrays
			function getGenesFromChromosomes(s) {
				var g = [];
				for (var i = 0; i < s.length; i++) {
					g.push(copyFloatArray(s[i].gene));
				}
				return g;
			}

			// makes a copy of an array of gene, helper function
			function makeCopyOfGenes(s) {
				var g = [];
				for (var i = 0; i < s.length; i++) {
					g.push(copyFloatArray(s[i]));
				}
				return g;
			}

			// helper function, randomize all of nth sub population of entire chromosome set c
			function randomizeSubPopulation(n, c) {
				for (var i = 0; i < N; i++) {
					c[n][i].randomize(1.0);
				}
			}

			// helper function used to sort the list of chromosomes according to their fitness
			function compareChromosomes(a, b) {
				if ((a.fitness / a.nTrial) > (b.fitness / b.nTrial)) {
					return -1;
				}
				if ((a.fitness / a.nTrial) < (b.fitness / b.nTrial)) {
					return 1;
				}
				return 0;
			}

			// iterate over each gene in each sub population to initialise the nTrial to zero (will be incremented later)
			for (i = 0; i < Nsp; i++) { // loop over every sub population
				for (j = 0; j < N; j++) {
					if (this.best_mode) { // best mode turned on, no averaging, but just recording best score.
						c[i][j].nTrial = 1;
						c[i][j].fitness = -10000000000000000;
					} else {
						c[i][j].nTrial = 0;
						c[i][j].fitness = 0;
					}
				}
			}

			// see if the global best gene has met target.  if so, can end it now.
			assert(this.bestGenes.length === Nsp);
			this.espnet.pushGenes(this.bestGenes); // put the random set of networks into the espnet
			fitness = fitFunc(this.espnet); // try out this set, and get the fitness
			if (fitness > this.target_fitness) {
				return fitness;
			}
			bestGenes = makeCopyOfGenes(this.bestGenes);
			bestFitness = fitness;
			//this.bestFitness = fitness;

			// for each chromosome in a sub population, choose random chromosomes from all othet sub  populations to
			// build a espnet.  perform fitFunc on that esp net to get the fitness of that combination.  add the fitness
			// to this chromosome, and all participating chromosomes.  increment the nTrial of all participating
			// chromosomes by one, so afterwards they can be sorted by average fitness
			// repeat this process this.num_passes times
			for (k = 0; k < this.num_passes; k++) {
				for (i = 0; i < Nsp; i++) {
					for (j = 0; j < N; j++) {
						// build an array of chromosomes randomly
						cSet = [];
						for (m = 0; m < Nsp; m++) {
							if (m === i) { // push current iterated neuron
								cSet.push(c[m][j]);
							} else { // push random neuron in sub population m
								cSet.push(c[m][randi(0, N)]);
							}
						}
						genes = getGenesFromChromosomes(cSet);
						assert(genes.length === Nsp);
						this.espnet.pushGenes(genes); // put the random set of networks into the espnet

						fitness = fitFunc(this.espnet); // try out this set, and get the fitness

						for (m = 0; m < Nsp; m++) { // tally the scores into each participating neuron
							if (this.best_mode) {
								if (fitness > cSet[m].fitness) { // record best fitness this neuron participated in.
									cSet[m].fitness = fitness;
								}
							} else {
								cSet[m].nTrial += 1; // increase participation count for each participating neuron
								cSet[m].fitness += fitness;
							}
						}
						if (fitness > bestFitness) {
							bestFitness = fitness;
							bestSet = cSet;
							bestGenes = genes;
						}
					}
				}
			}

			// sort the chromosomes by average fitness
			for (i = 0; i < Nsp; i++) {
				c[i] = c[i].sort(compareChromosomes);
			}

			var Nelite = Math.floor(Math.floor(this.elite_percentage * N) / 2) * 2; // even number
			for (i = 0; i < Nsp; i++) {
				for (j = Nelite; j < N; j += 2) {
					var p1 = randi(0, Nelite);
					var p2 = randi(0, Nelite);
					c[i][p1].crossover(c[i][p2], c[i][j], c[i][j + 1]);
				}
			}

			// mutate the population size after 2*Nelite (keep one set of crossovers unmutiliated!)
			for (i = 0; i < Nsp; i++) {
				for (j = 2 * Nelite; j < N; j++) {
					c[i][j].mutate(this.mutation_rate, this.mutation_size);
				}
			}

			// put global and local bestgenes in the last element of each gene
			for (i = 0; i < Nsp; i++) {
				c[i][N - 1].copyFromGene(this.bestGenes[i]);
				c[i][N - 2].copyFromGene(bestGenes[i]);
			}

			if (bestFitness < this.bestFitness) { // didn't beat the record this time
				this.bestFitnessCount++;
				if (this.bestFitnessCount > this.burst_generations) { // stagnation, do burst mutate!
					// add code here when progress stagnates later.
					console.log('stagnating. burst mutate based on best solution.');
					var bestGenesCopy = makeCopyOfGenes(this.bestGenes);
					var bestFitnessCopy = this.bestFitness;
					this.initialize(bestGenesCopy);

					this.bestGenes = bestGenesCopy;
					this.bestFitness = this.bestFitnessCopy;

				}

			} else {
				this.bestFitnessCount = 0; // reset count for burst
				this.bestFitness = bestFitness; // record the best fitness score
				this.bestGenes = bestGenes; // record the set of genes that generated the best fitness
			}

			// push best one (found so far from all of history, not just this time) to network.
			assert(this.bestGenes.length === Nsp);
			this.espnet.pushGenes(this.bestGenes);

			return bestFitness;
		}
	};

	convnetjs.ESPNet = ESPNet;
	convnetjs.ESPTrainer = ESPTrainer;
	convnetjs.GATrainer = GATrainer;
})(convnetjs);

