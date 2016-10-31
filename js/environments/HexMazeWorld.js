class HexMazeWorld extends GameWorld {

  /**
   * World object contains many agents and walls and food and stuff
   * @name MazeWorld
   * @extends GameWorld
   * @constructor
   *
   * @return {HexMazeWorld}
   */
  constructor(agents = [], walls = [], options = worldOpts) {
    super(agents, walls, options);

    this.selected = -1;
    this.Rarr = null;
    this.Aarr = null;
    this.sid = -1;
    this.action = null;
    this.state = 0;

    this.addWalls();
    this.addEntities();

    Agent.prototype.onMouseDown = (event) => {
      this.data = event.data;
      this.isDown = true;
      this.alpha = 1;

      return this;
    };

    Agent.prototype.tick = () => {
      if (this.sid === -1) {
        this.sid = setInterval(() => {
          for (let k = 0; k < this.stepsPerTick; k++) {
            this.updatePopulation();
            // ask agent for an action
            let agent = this.agents[0],
              state = this.state,
              a = agent.brain.act(state),
              // run it through environment dynamics
              obs = this.sampleNextState(state, a);
            // evolve environment to next state
            this.state = obs.ns;

            agent.nStepsCounter += 1;
            if (typeof obs.resetEpisode !== 'undefined') {
              agent.score += 1;
              agent.brain.resetEpisode();

              this.state = this.startState();

              // record the reward achieved
              if (agent.nStepsHistory.length >= agent.nflot) {
                agent.nStepsHistory = agent.nStepsHistory.slice(1);
              }
              agent.nStepsHistory.push(agent.nStepsCounter);
              agent.nStepsCounter = 0;
            }

            agent.gridLocation = this.grid.getCellAt(this.sToX(this.state), this.sToY(this.state));
            agent.position = agent.gridLocation.center;
            agent.draw();

            // Check them for collisions
            this.check(agent);

            // Loop through the eyes and check the walls and nearby entities
            for (let ae = 0, ne = agent.numEyes; ae < ne; ae++) {
              this.check(agent.eyes[ae]);
            }

            // Just testing if throwing items at it and +/- rewards for
            // them will distract the agent
            if (agent.collisions.length > 0) {
              for (let c = 0; c < agent.collisions.length; c++) {
                let col = agent.collisions[c];
                if (col.entity.type === 1) {
                  obs.r += 0.1;
                } else if (col.entity.type === 2) {
                  obs.r -= 0.1;
                }
                this.deleteEntity(col.entity.id);
              }
            }
            // allow opportunity for the agent to learn
            agent.brain.learn(obs.r);

            this.drawGrid();
          }
        }, 20);
      } else {
        clearInterval(this.sid);
        this.sid = -1;
      }
    };

    return this;
  }

  /**
   * Draw the Grid
   */
  drawGrid() {
    let agent = this.agents[0];

    for (let s = 0; s < this.grid.cells.length; s++) {
      let cell = this.grid.cells[s],
        rd = 255,
        g = 255,
        b = 255,
        vv = null,
        s = this.xyToS(cell.x, cell.y),
        sx = this.sToX(s),
        sy = this.sToY(s);

      // get value of state s under agent policy
      if (typeof agent.brain.V !== 'undefined') {
        vv = agent.brain.V[s];
      } else if (typeof agent.brain.Q !== 'undefined') {
        var poss = this.allowedActions(s);
        vv = -1;
        for (var i = 0, n = poss.length; i < n; i++) {
          var qsa = agent.brain.Q[poss[i] * this.grid.cells.length + s];
          if (i === 0 || qsa > vv) {
            vv = qsa;
          }
        }
      }

      var ms = 10000;
      if (vv > 0) {
        g = 255;
        rd = 255 - (vv * ms);
        b = 255 - (vv * ms);
      }
      if (vv < 0) {
        g = 255 + (vv * ms);
        rd = 255;
        b = 255 + (vv * ms);
      }

      cell.color = Utility.rgbToHex(rd, g, b);
      // Write the reward value text
      cell.reward = this.Rarr[s];
      // Write the value text
      cell.value = vv;
      cell.draw();

      // update policy arrows
      for (var z = 0; z < 6; z++) {
        var prob = agent.brain.P[z * this.grid.cells.length + s],
          nx = 0,
          ny = 0,
          actions = this.Aarr[s],
          avail = actions[z];
        if (avail === null || prob < 0.01) {
          // Hide the arrow
        } else {
          // Show the arrow
        }

        // The length of the arrow based on experience
        var ss = this.grid.cellSize / 2 * (prob * 0.9);

        switch (z) {
          case 0: // Left
            nx = -ss;
            ny = 0;
            break;
          case 1: // Down
            nx = 0;
            ny = ss;
            break;
          case 2: // Up
            nx = 0;
            ny = -ss;
            break;
          case 3: // Right
            nx = ss;
            ny = 0;
            break;
        }
        // Draw the arrow using below as guide
        // cell.graphics.lineStyle(2, 0x000000);
        // cell.graphics.beginFill(0x000000);
        // cell.graphics.moveTo(cell.center.x - ss, cell.center.y - ss);
        // cell.graphics.lineTo(cell.center.x + nx, cell.center.y + ny);
        // cell.graphics.endFill();
      }
    }
    this.renderer.render(this.stage);
  }

  /**
   * zip rewards into flot data
   * @param {number} an
   * @return {Array}
   */
  getFlotRewards(an = 0) {
    let res = [];
    for (let i = 0, n = this.agents[an].nStepsHistory.length; i < n; i++) {
      res.push([i, this.agents[an].nStepsHistory[i]]);
    }
    return res;
  }

  /**
   * Initialize the Flot class
   */
  initFlot() {
    this.container = document.getElementById('flotreward');
    // flot stuff
    this.nflot = 1000;
    this.smoothRewardHistory = [];
    this.smoothReward = [];
    this.flott = [];
    this.series = [];

    for (var a = 0; a < this.agents.length; a++) {
      this.smoothReward[a] = null;
      this.smoothRewardHistory[a] = null;
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
        min: 0,
        max: 1000
      }
    });

    setInterval(() => {
      for (var a = 0; a < this.agents.length; a++) {
        this.series[a].data = this.getFlotRewards(a);
      }
      this.plot.setData(this.series);
      this.plot.draw();
    }, 100);
  }
}

/**
 * Get the reward of being in s, taking action a, and ending up in ns
 * @param {number} s
 * @param {number} a
 * @param {number} ns
 * @return {number}
 */
HexMazeWorld.prototype.reward = function (s, a, ns) {
  return this.Rarr[s];
};

/**
 * Return the allowed actions based on the current state/cell
 * @param {number} s - State
 * @return {Array}
 */
HexMazeWorld.prototype.allowedActions = function (s) {
  let cell = this.grid.cells[s],
    as = [],
    actions = this.grid.disconnectedNeighbors(cell);

  for (let a = 0; a < actions.length; a++) {
    var c = actions[a];
    for (let n = 0; n < cell.neighbors.length; n++) {
      if (cell.neighbors[n]) {
        var dQ = cell.neighbors[n].q,
          dR = cell.neighbors[n].r,
          nQ = c.q,
          nR = c.r;
        if (c && (dQ === nQ && dR === nR)) {
          as.push(n);
        } else {
          console.log();
        }
      }
    }
  }

  return as;
};

/**
 * Return the number of actions
 * @return {number}
 */
HexMazeWorld.prototype.getMaxNumActions = function () {
  return this.grid.startCell.directions.length;
};

/**
 * Return the number of states
 * @return {number}
 */
HexMazeWorld.prototype.getNumStates = function () {
  return this.grid.cells.length;
};

/**
 *
 * @param {number} s
 * @param {number} a
 * @return {number}
 */
HexMazeWorld.prototype.nextStateDistribution = function (s, a) {
  let ns,
    c = this.grid.cells[s],
    neighbor = c.neighbors[a];

  if (s === this.grid.cells.length - 1) {
    ns = this.startState();
    while (neighbor === false || neighbor === undefined) {
      ns = this.randomState();
    }
  } else {
    if (neighbor === false || neighbor === undefined) {
      // Not a valid option so go back to s
      ns = s;
    } else {
      ns = this.xyToS(neighbor.q, neighbor.r);
    }
  }

  return ns;
};

/**
 * Return a rand state
 * @return {number}
 */
HexMazeWorld.prototype.randomState = function () {
  return Math.floor(Math.random() * this.grid.cells.length);
};

/**
 * Set up the grid world and the actions avail
 */
HexMazeWorld.prototype.reset = function () {
  let lastState = 0;
  // Specify some rewards
  this.Rarr = Utility.Maths.zeros(this.grid.cells.length);
  this.Aarr = new Array(this.grid.cells.length);

  for (let state = 0; state < this.grid.cells.length; state++) {
    let actionsAvail = this.allowedActions(state);
    this.Aarr[state] = actionsAvail;
    this.Rarr[state] = (state === this.grid.cells.length - 1) ? 1 : 0;

    if ((lastState !== 0 && state !== this.grid.cells.length - 1) &&
      (actionsAvail.length === 1 && state !== 0)) {
      this.Rarr[state] = -1;
    }
    lastState = state;
  }

  return this;
};

/**
 * Convert the state to a q
 * @param {number} s
 * @return {number} q
 */
HexMazeWorld.prototype.sToX = function (s) {
  return this.grid.cells[s].q;
};

/**
 * Convert the state to a r
 * @param {number} s
 * @return {number} r
 */
HexMazeWorld.prototype.sToY = function (s) {
  return this.grid.cells[s].r;
};

/**
 * Convert an x, y to the state
 * @param {number} q
 * @param {number} r
 * @return {number}
 */
HexMazeWorld.prototype.xyToS = function (q, r) {
  let cell = this.grid.getCellAt(q, r),
    id = Utility.Arrays.arrContains(this.grid.cells, cell);

  return id;
};

/**
 * Observe the raw reward of being in s, taking a, and ending up in ns
 * @param {number} s
 * @param {number} a
 * @return {{ns: (*|Number), r: (*|Number)}}
 */
HexMazeWorld.prototype.sampleNextState = function (s, a) {
  let ns = this.nextStateDistribution(s, a),
    r = this.reward(s, a, ns);

  // every step takes a bit of negative reward
  r -= 0.01;
  let out = {
    ns: ns,
    r: r
  };
  if (s === (this.grid.cells.length - 1)) {
    // episode is over
    out.resetEpisode = true;
  }

  return out;
};

/**
 * Return the starting state
 * @return {number}
 */
HexMazeWorld.prototype.startState = function () {
  return 0;
};
