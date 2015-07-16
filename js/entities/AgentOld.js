/**
 * A single agent
 * @returns {Agent}
 */
var AgentOld = function () {
    Agent.call(this, new Vec(50, 50), [], {});

    // Remember the Agent's old position
    this.oldPos = this.position;

    // The Agent's size
    this.radius = 5;

    // The direction the Agent is facing
    this.angle = 0;

    // The number of item types the Agent's eys can see (wall, green, red thing proximity)
    this.numTypes = 3;

    // The number of Agent's eyes
    this.numEyes = 9;

    // The number of Agent's eyes, each one sees the number of knownTypes
    this.numInputs = this.numEyes * this.numTypes;

    // The number of possible angles the Agent can turn
    this.numActions = 5;

    // Amount of temporal memory. 0 = agent lives in-the-moment :)
    this.temporalWindow = 1;

    // Size of the network
    this.networkSize = this.numInputs * this.temporalWindow + this.numActions * this.temporalWindow + this.numInputs;

    // The Agent's eyes
    this.eyes = [];
    for (var k = 0; k < this.numEyes; k++) {
        this.eyes.push(new Eye((k - this.numTypes) * 0.25));
    }

    // The Agent's actions
    this.actions = [];
    this.actions.push([1, 1]);
    this.actions.push([0.8, 1]);
    this.actions.push([1, 0.8]);
    this.actions.push([0.5, 0]);
    this.actions.push([0, 0.5]);

    this.rewardBonus = 0.0;
    this.digestionSignal = 0.0;

    // Agent outputs on the world
    this.rot1 = 0.0; // Rotation speed of 1st wheel
    this.rot2 = 0.0; // Rotation speed of 2nd wheel

    this.previousActionix = -1;

    /**
     * The value function network computes a value of taking any of the possible actions
     * given an input state.
     *
     * Here we specify one explicitly the hard way but we could also use
     * opt.hidden_layer_sizes = [20,20] instead to just insert simple relu hidden layers.
     * @type {Array}
     */
    var layerDefsTD = [];
    layerDefsTD.push({type: 'input', outSx: 1, outSy: 1, outDepth: this.networkSize});
    layerDefsTD.push({type: 'fc', numNeurons: 50, activation: 'relu'});
    layerDefsTD.push({type: 'fc', numNeurons: 50, activation: 'relu'});
    layerDefsTD.push({type: 'regression', numNeurons: this.numActions});

    /**
     * Options for the Brain
     * @type {Object}
     */
    this.brainOpts = {
        numStates: this.numStates,
        numActions: this.numActions,
        temporalWindow: this.temporalWindow,
        experienceSize: 30000,
        startLearnThreshold: 1000,
        gamma: 0.7,
        learningStepsTotal: 200000,
        learningStepsBurnin: 3000,
        epsilonMin: 0.05,
        epsilonTestTime: 0.05,
        layerDefs: layerDefsTD,
        /**
         * The options for the Temporal Difference learner that trains the above net
         * by backpropping the temporal difference learning rule.
         * @type {Object}
         */
        tdTrainerOpts: {
            learningRate: 0.001,
            momentum: 0.0,
            batchSize: 64,
            l2Decay: 0.01
        }
    };

    this.brain = new Brain(this.brainOpts); // woohoo

    /**
     * In forward pass the agent simply behaves in the environment
     */
    this.act = function () {
        // Create input to brain
        var inputArray = new Array(this.numEyes * this.numTypes);
        for (var i = 0; i < this.numEyes; i++) {
            var e = this.eyes[i];
            inputArray[i * 3] = 1.0;
            inputArray[i * 3 + 1] = 1.0;
            inputArray[i * 3 + 2] = 1.0;
            if (e.sensedType !== -1) {
                // sensedType is 0 for wall, 1 for food and 2 for poison.
                // lets do a 1-of-k encoding into the input array
                inputArray[i * 3 + e.sensedType] = e.sensedProximity / e.maxRange; // normalize to [0,1]
            }
        }

        // Get action from brain
        this.actionIndex = this.brain.forward(inputArray);
        var action = this.actions[this.actionIndex];

        // Demultiplex into behavior variables
        this.rot1 = action[0] * 1;
        this.rot2 = action[1] * 1;
    };

    /**
     * In backward pass agent learns.
     * @returns {undefined}
     */
    this.learn = function () {
        // Compute the reward
        var proximityReward = 0.0;
        for (var i = 0; i < this.numEyes; i++) {
            var e = this.eyes[i];
            // Agents dont like to see walls, especially up close
            proximityReward += e.sensedType === 0 ? e.sensedProximity / e.maxRange : 1.0;
        }

        // Calculate the proximity reward
        var rewardPerEye = 0.0;
        rewardPerEye = proximityReward / this.numEyes;
        proximityReward = Math.min(1.0, rewardPerEye * 2);

        // Agents like to go straight forward
        var forwardReward = 0.0;
        if (this.actionIndex === 0 && proximityReward > 0.75)
            forwardReward = 0.1 * proximityReward;

        // agents like to eat good things
        var digestionReward = this.digestionSignal;
        this.digestionSignal = 0.0;

        var reward = proximityReward + forwardReward + digestionReward;

        // pass to brain for learning
        this.brain.backward(reward);
    };

    /**
     * Agent's chance to move in the world
     * @param smallWorld
     */
    this.move = function (smallWorld) {
        this.oldPos = this.position.clone();
        var oldAngle = this.angle;
        this.oldAngle = oldAngle;

        // Steer the agent according to outputs of wheel velocities
        var v = new Vec(0, this.radius / 2.0);
        v = v.rotate(this.angle + Math.PI / 2);
        var w1pos = this.position.add(v), // Positions of wheel 1
            w2pos = this.position.sub(v); // Positions of wheel 2
        var vv = this.position.sub(w2pos);
        vv = vv.rotate(-this.rot1);
        var vv2 = this.position.sub(w1pos);
        vv2 = vv2.rotate(this.rot2);
        var newPos = w2pos.add(vv),
            newPos2 = w1pos.add(vv2);

        newPos.scale(0.5);
        newPos2.scale(0.5);

        this.position = newPos.add(newPos2);

        this.angle -= this.rot1;
        if (this.angle < 0) {
            this.angle += 2 * Math.PI;
        }

        this.angle += this.rot2;
        if (this.angle > 2 * Math.PI) {
            this.angle -= 2 * Math.PI;
        }

        //this.position.advance();
        if (this.collision) {
            // The agent is trying to move from pos to oPos so we need to check walls
            var result = Utility.collisionCheck(this.oldPos, this.position, smallWorld.walls);
            if (result) {
                // The agent derped! Wall collision! Reset their position
                this.position = this.oldPos.clone();
            }
        }

        // Handle boundary conditions.. bounce agent
        if (this.position.x < 0) {
            this.position.x = 0;
        }
        if (this.position.x > smallWorld.width) {
            this.position.x = smallWorld.width;
        }
        if (this.position.y < 0) {
            this.position.y = 0;
        }
        if (this.position.y > smallWorld.height) {
            this.position.y = smallWorld.height;
        }

        this.position.round();
        this.direction = Utility.getDirection(this.angle);
        this.sprite.position.set(this.position.x, this.position.y);
        this.sprite.rotation = -this.angle;
    };

};

/**
 * Agent prototype
 * @type {Agent}
 */
Agent.prototype = {
};
