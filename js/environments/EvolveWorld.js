(function (global) {
  "use strict";

  /**
   * World object contains many agents and walls and food and stuff
   * @name EvolveWorld
   * @constructor
   *
   * @return {EvolveWorld}
   */
  class EvolveWorld {

    /**
     *
     * @returns {EvolveWorld}
     */
    constructor() {
      this.width = 800;
      this.height = 800;
      this.canvas = document.getElementById('game-container');
      this.canvas.addEventListener('click', this.eventClick, false);
      this.ctx = this.canvas.getContext('2d');
      this.counter = 0;
      this.food = [];
      this.foodLoss = 0.002; // Food loss per iteration
      this.foodGain = 0.5; // How much food and replication is gained when agent eats?
      this.foodFrequency = 10; // How often do we add food?
      this.foodLimit = 30; // How much food can there be total?
      this.replicationThreshold = 3; // What is the replication threshold? in amount of food
      this.boostCost = 0.001;  // How much does use of boost cost in health
      this.agents = [
        new AgentEvolve(new Vec(Utility.Maths.randf(0, this.width), Utility.Maths.randf(0, this.height)))
      ];
      document.addEventListener('keyup', this.eventKeyUp, true);
      document.addEventListener('keydown', this.eventKeyDown, true);

      let animate = () => {
        this.tick();
        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);

      return this;
    }

    /**
     *
     */
    draw() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      // Draw food
      this.ctx.fillStyle = 'rgb(100,230,100)';
      for (let i = 0; i < this.food.length; i++) {
        let f = this.food[i];
        this.drawCircle(f.position.x, f.position.y, 10);
      }

      // Draw all agents
      for (let i = 0; i < this.agents.length; i++) {
        let a = this.agents[i],
          // Draw its eyes, first compute their position
          a1 = -a.eyeDistance + Math.PI / 2,
          a2 = a.eyeDistance + Math.PI / 2,
          x1 = Math.cos(a1) * a.eyeLength,
          y1 = Math.sin(a1) * a.eyeLength,
          x2 = Math.cos(a2) * a.eyeLength,
          y2 = Math.sin(a2) * a.eyeLength;

        this.ctx.save();
        this.ctx.translate(a.position.x, a.position.y);
        this.ctx.rotate(a.dir - Math.PI / 2);

        // Draw the lines to eyes
        this.ctx.fillStyle = 'rgb(0,0,0)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(x1, y1);
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(x2, y2);
        this.ctx.closePath();
        this.ctx.stroke();

        // Draw the eyes, colored by how much food they sense
        let s1 = Math.round(a.s1 * 255.0);
        this.ctx.fillStyle = 'rgb(' + s1 + ',0,0)';
        this.drawCircle(x1, y1, 5);
        let s2 = Math.round(a.s2 * 255.0);
        if (s2 > 255) {
          s2 = 255;
        }
        this.ctx.fillStyle = 'rgb(' + s2 + ',0,0)';
        this.drawCircle(x2, y2, 5);

        // Draw agent body and outline
        if (!a.selected) {
          this.ctx.fillStyle = 'rgb(' + Math.round(255.0 * a.health) + ',' + Math.round(255.0 * a.health) + ',0)';
        } else {
          this.ctx.fillStyle = 'rgb(0,' + Math.round(255.0 * a.health) + ',' + Math.round(255.0 * a.health) + ')';
        }
        this.drawCircle(0, 0, a.radius);
        this.ctx.fillStyle = 'rgb(0,0,0)';
        this.ctx.fillText("M:" + a.mutation, -5, 0);
        this.ctx.fillText("R:" + a.rep, -5, 8);
        this.ctx.fillText("A:" + a.age, -5, 16);
        this.ctx.restore();

        // Draw brain of this agent, if it is selected
        if (a.selected) {
          // Draw all the connections first
          this.ctx.beginPath();
          let SS = 100;
          for (let m = 0; m < a.brain.size; m++) {
            let r1 = 2 * Math.PI * m / a.brain.size;
            for (let n = 0; n < a.brain.density; n++) {
              //this.w[i][j]*this.act[this.ix[i][j]]
              let act = Math.round(a.brain.w[i][n] * 120 + 120),
                r2 = 2 * Math.PI * a.brain.ix[m][n] / a.brain.size;
              //this.ctx.strokeStyle = 'rgb(' + act + ',' + act + ',' + act + ')';
              this.ctx.moveTo(SS * Math.cos(r1) + this.width - SS * 1.5, SS * Math.sin(r1) + this.height - SS * 1.5);
              this.ctx.lineTo(SS * Math.cos(r2) + this.width - SS * 1.5, SS * Math.sin(r2) + this.height - SS * 1.5);
            }
          }
          this.ctx.stroke();

          for (let m = 0; m < a.brain.size; m++) {
            //var act= 1.0/(1.0 + Math.exp(-a));  //pass through sigmoid
            let act = Math.round(a.brain.act[m] * 255),
              r1 = 2 * Math.PI * m / a.brain.size;
            this.ctx.fillStyle = 'rgb(' + act + ',' + act + ',' + act + ')';
            this.drawCircle(SS * Math.cos(r1) + this.width - SS * 1.5, SS * Math.sin(r1) + this.height - SS * 1.5, 10);
          }
        }
      }

      //draw score
      this.ctx.fillStyle = 'rgb(0,0,0)';
      this.ctx.fillText("Alive: " + this.agents.length, 10, 20);
    }

    /**
     *
     * @param x
     * @param y
     * @param w
     * @param h
     * @param radius
     */
    drawBubble(x, y, w, h, radius) {
      let r = x + w,
        b = y + h;
      this.ctx.beginPath();
      this.ctx.strokeStyle = "black";
      this.ctx.lineWidth = "2";
      this.ctx.moveTo(x + radius, y);
      this.ctx.lineTo(x + radius / 2, y - 10);
      this.ctx.lineTo(x + radius * 2, y);
      this.ctx.lineTo(r - radius, y);
      this.ctx.quadraticCurveTo(r, y, r, y + radius);
      this.ctx.lineTo(r, y + h - radius);
      this.ctx.quadraticCurveTo(r, b, r - radius, b);
      this.ctx.lineTo(x + radius, b);
      this.ctx.quadraticCurveTo(x, b, x, b - radius);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
      this.ctx.stroke();
    }

    /**
     *
     * @param x
     * @param y
     * @param w
     * @param h
     */
    drawRect(x, y, w, h) {
      this.ctx.beginPath();
      this.ctx.rect(x, y, w, h);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    /**
     *
     * @param x
     * @param y
     * @param r
     */
    drawCircle(x, y, r) {
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, Math.PI * 2, true);
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.fill();
    }

    /**
     *
     * @param e
     * @returns {EvolveWorld}
     */
    eventKeyUp(e) {
      let keycode = ('which' in e) ? e.which : e.keyCode;
      this.keyUp(keycode);

      return this;
    }

    /**
     *
     * @param e
     * @returns {EvolveWorld}
     */
    eventKeyDown(e) {
      let keycode = ('which' in e) ? e.which : e.keyCode;
      this.keyDown(keycode);

      return this;
    }

    /**
     *
     * @param e
     * @returns {EvolveWorld}
     */
    eventClick(e) {
      //get position of cursor relative to top left of canvas
      let x, y;
      if (e.pageX || e.pageY) {
        x = e.pageX;
        y = e.pageY;
      } else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      }
      x -= this.canvas.offsetLeft;
      y -= this.canvas.offsetTop;

      //call user-defined callback
      this.mouseClick(x, y);

      return this;
    }

    /**
     *
     * @param key
     * @returns {EvolveWorld}
     */
    keyUp(key) {
      return this;
    }

    /**
     *
     * @param key
     * @returns {EvolveWorld}
     */
    keyDown(key) {
      return this;
    }

    /**
     *
     * @param x
     * @param y
     * @returns {*}
     */
    mouseClick(x, y) {
      // Select an agent with mouse click
      for (let i = 0; i < self.agents.length; i++) {
        let a = self.agents[i],
          d = Math.sqrt(Math.pow(a.position.x - x, 2) + Math.pow(a.position.y - y, 2));
        if (d < 3 * a.radius) {
          // That's a hit! Let's select this one and deselect all others
          let newSet = !a.selected, j;
          for (let j = 0; j < self.agents.length; j++) {
            self.agents[j].selected = false;
          }
          a.selected = newSet;

          return;
        }
      }

      return this;
    }

    /**
     *
     */
    tick() {
      this.counter += 1;
      let killIdx = -1;
      for (let i = 0; i < this.agents.length; i++) {
        let a = this.agents[i],
          // Move agent
          vel = new Vec((a.boost + a.speed) * Math.cos(a.dir), (a.boost + a.speed) * Math.sin(a.dir));
        a.position.plusEq(vel);

        // Enforce boundary conditions: wrap around if necessary
        if (a.position.x < 0) {
          a.position.x = this.width;
        }

        if (a.position.x > this.width) {
          a.position.x = 0;
        }

        if (a.position.y < 0) {
          a.position.y = this.height;
        }

        if (a.position.y > this.height) {
          a.position.y = 0;
        }

        // Agent gets more hungry
        a.health -= this.foodLoss;
        a.health -= this.boostCost * a.boost; // Boost costs health
        if (a.health < 0) {
          killIdx = i;
        }
        a.age += 1;
      }
      if (killIdx != -1) {
        this.agents.splice(killIdx, 1);
      }

      // Agent collision detection and resolution
      for (let i = 0; i < this.agents.length; i++) {
        let a = this.agents[i];
        for (let j = 0; i < this.agents.length; i++) {
          let a2 = this.agents[j];
          if (i == j) {
            continue;
          }
          let d = Math.sqrt(Math.pow(a.position.x - a2.position.x, 2) + Math.pow(a.position.y - a2.position.y, 2)),
            overlap = a2.radius * 2 - d;
          if (overlap > 0 && d > 1) {
            // One agent pushes on another proportional to his boost.
            // Higher boost wins
            let aggression = a2.boost / (a.boost + a2.boost);
            if (a.boost < 0.01 && a2.boost < 0.01) {
              aggression = 0.5;
            }
            let ff2 = (overlap * aggression) / d,
              ff1 = (overlap * (1 - aggression)) / d;
            a2.position.x += (a2.position.x - a.position.x) * ff2;
            a2.position.y += (a2.position.y - a.position.y) * ff2;
            a.position.x -= (a2.position.x - a.position.x) * ff1;
            a.position.y -= (a2.position.x - a.position.x) * ff1;
          }
        }
      }

      // Check if any agent ate food and while we're at it, compute input to sense
      killIdx = -1;
      for (let i = 0; i < this.agents.length; i++) {
        let a = this.agents[i];
        a.s1 = 0;
        a.s2 = 0;

        for (let j = 0; j < this.food.length; j++) {
          var f = this.food[j],
            d2 = Math.sqrt(Math.pow(a.position.x - f.position.x, 2) + Math.pow(a.position.y - f.position.y, 2));
          if (d2 < a.radius) {
            a.rep += this.foodGain;
            a.health += this.foodGain;
            if (a.health > 1) {
              a.health = 1;
            }
            killIdx = j;
          }

          if (d2 < a.radius * 10) { // For efficiency, don't even bother if it's too far
            // Compute position of both eyes in world coordinates
            var x1 = a.position.x + a.eyeLength * Math.cos(a.dir - a.eyeDistance),
              y1 = a.position.y + a.eyeLength * Math.sin(a.dir - a.eyeDistance),
              x2 = a.position.x + a.eyeLength * Math.cos(a.dir + a.eyeDistance),
              y2 = a.position.y + a.eyeLength * Math.sin(a.dir + a.eyeDistance);

            a.s1 += a.eyeMultiplier * Math.exp(-a.eyeSensitivity * (Math.pow(x1 - f.position.x, 2) + Math.pow(y1 - f.position.y, 2)));
            a.s2 += a.eyeMultiplier * Math.exp(-a.eyeSensitivity * (Math.pow(x2 - f.position.x, 2) + Math.pow(y2 - f.position.y, 2)));
          }
        }
      }
      if (killIdx != -1) {
        this.food.splice(killIdx, 1);
      }

      // Feed forward the brain from senses to output
      for (let i = 0; i < this.agents.length; i++) {
        let a = this.agents[i],
          res = a.brain.tick(a.s1, a.s2),
          // Apply output neuron 0: controls turning.
          // Also cap it to a max of 0.3 rotation
          des = res.out0;
        if (des > 0.8) {
          des = 0.8;
        }
        if (des < -0.8) {
          des = -0.8;
        }
        a.dir += des;

        // Wrap direction around to keep it in range of [0, 2pi]
        if (a.dir > 2 * Math.PI) {
          a.dir = a.dir - 2 * Math.PI;
        }
        if (a.dir < 0) {
          a.dir = 2 * Math.PI + a.dir;
        }

        // Apply output neuron 1: controls boost
        des = res.out1;
        if (des > 0) {
          a.boost = des;
        } else {
          a.boost = 0;
        }
      }

      // Spawn more food, maybe
      if (this.counter % this.foodFrequency == 0 && this.food.length < this.foodLimit) {
        let f = {
          position: new Vec(Utility.Maths.randf(0, this.width), Utility.Maths.randf(0, this.height))
        };
        this.food.push(f);
      }

      // Handle births
      let bi = -1;
      for (let i = 0; i < this.agents.length; i++) {
        let a = this.agents[i];
        if (a.rep > this.replicationThreshold) {
          // This agent reproduces!
          bi = i;
        }
      }

      if (bi != -1) {
        // Grab the Agent about to evolve and then create a new Agent
        let a = this.agents[bi],
          anew = new AgentEvolve(new Vec(Utility.Maths.randf(0, this.width), Utility.Maths.randf(0, this.height)));
        // Reset the replication count
        a.rep = 0;
        // New random spot to spawn
        anew.position = new Vec(a.position.x + Utility.Maths.randf(-30, 30), a.position.y + Utility.Maths.randf(-30, 30));
        // Mutate from the last brain
        anew.brain.mutateFrom(a.brain);
        anew.mutation += 1 + a.mutation;

        this.agents.push(anew);
      }

      // Spawn more agents if there are too few agents left
      if (this.agents.length < 10) {
        let anew = new AgentEvolve(new Vec(Utility.Maths.randf(0, this.width), Utility.Maths.randf(0, this.height)));
        this.agents.push(anew);
      }

      this.draw();
    }
  }
  global.EvolveWorld = EvolveWorld;

}(this));
