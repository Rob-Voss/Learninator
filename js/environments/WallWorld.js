
var randf = function (lo, hi) {
    return Math.random() * (hi - lo) + lo;
};
var randi = function (lo, hi) {
    return Math.floor(randf(lo, hi));
};

// A 2D vector utility
var Vec = function (x, y) {
    this.x = x;
    this.y = y;
};
Vec.prototype = {

    // utilities
    dist_from: function (v) {
        return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));
    },
    length: function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    },

    // new vector returning operations
    add: function (v) {
        return new Vec(this.x + v.x, this.y + v.y);
    },
    sub: function (v) {
        return new Vec(this.x - v.x, this.y - v.y);
    },
    rotate: function (a) {  // CLOCKWISE
        return new Vec(this.x * Math.cos(a) + this.y * Math.sin(a),
            -this.x * Math.sin(a) + this.y * Math.cos(a));
    },

    // in place operations
    scale: function (s) {
        this.x *= s;
        this.y *= s;
    },
    normalize: function () {
        var d = this.length();
        this.scale(1.0 / d);
    }
};

// line intersection helper function: does line segment (p1,p2) intersect segment (p3,p4) ?
var line_intersect = function (p1, p2, p3, p4) {
    var denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (denom === 0.0) {
        return false;
    } // parallel lines
    var ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    var ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
    if (ua > 0.0 && ua < 1.0 && ub > 0.0 && ub < 1.0) {
        var up = new Vec(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
        return {ua: ua, ub: ub, up: up}; // up is intersection point
    }
    return false;
};

var line_point_intersect = function (p1, p2, p0, rad) {
    var v = new Vec(p2.y - p1.y, -(p2.x - p1.x)); // perpendicular vector
    var d = Math.abs((p2.x - p1.x) * (p1.y - p0.y) - (p1.x - p0.x) * (p2.y - p1.y));
    d = d / v.length();
    if (d > rad) {
        return false;
    }

    v.normalize();
    v.scale(d);
    var ua;
    var up = p0.add(v);
    if (Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y)) {
        ua = (up.x - p1.x) / (p2.x - p1.x);
    } else {
        ua = (up.y - p1.y) / (p2.y - p1.y);
    }
    if (ua > 0.0 && ua < 1.0) {
        return {ua: ua, up: up};
    }
    return false;
};

// Wall is made up of two points
var Wall = function (p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
};

// World object contains many agents and walls and food and stuff
var util_add_box = function (lst, x, y, w, h) {
    lst.push(new Wall(new Vec(x, y), new Vec(x + w, y)));
    lst.push(new Wall(new Vec(x + w, y), new Vec(x + w, y + h)));
    lst.push(new Wall(new Vec(x + w, y + h), new Vec(x, y + h)));
    lst.push(new Wall(new Vec(x, y + h), new Vec(x, y)));
};

// item is circle thing on the floor that agent can interact with (see or eat, etc)
var Item = function (x, y, type) {
    this.p = new Vec(x, y); // position
    this.v = new Vec(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5);
    this.type = type;
    this.rad = 10; // default radius
    this.age = 0;
    this.cleanup_ = false;
};

var World = function (w, h) {
    this.agents = [];
    this.W = w || canvas.width;
    this.H = h || canvas.height;

    this.clock = 0;

    // set up walls in the world
    this.walls = [];
    var pad = 0;
    util_add_box(this.walls, pad, pad, this.W - pad * 2, this.H - pad * 2);
    /*
     util_add_box(this.walls, 100, 100, 200, 300); // inner walls
     this.walls.pop();
     util_add_box(this.walls, 400, 100, 200, 300);
     this.walls.pop();
     */

    // set up food and poison
    this.items = [];
    /*
     for(var k=0;k<50;k++) {
     var x = randf(20, this.W-20);
     var y = randf(20, this.H-20);
     var t = randi(1, 3); // food or poison (1 and 2)
     var it = new Item(x, y, t);
     this.items.push(it);
     }
     */
};

World.prototype = {
    // helper function to get closest colliding walls/items
    stuff_collide_: function (p1, p2, check_walls, check_items) {
        var minres = false;
        var i, n, res;

        // collide with walls
        if (check_walls) {
            for (i = 0, n = this.walls.length; i < n; i++) {
                var wall = this.walls[i];
                res = line_intersect(p1, p2, wall.p1, wall.p2);
                if (res) {
                    res.type = 0; // 0 is wall
                    if (!minres) {
                        minres = res;
                    }
                    else {
                        // check if its closer
                        if (res.ua < minres.ua) {
                            // if yes replace it
                            minres = res;
                        }
                    }
                }
            }
        }

        // collide with items
        if (check_items) {
            for (i = 0, n = this.items.length; i < n; i++) {
                var it = this.items[i];
                res = line_point_intersect(p1, p2, it.p, it.rad);
                if (res) {
                    res.type = it.type; // store type of item
                    res.vx = it.v.x; // velocty information
                    res.vy = it.v.y;
                    if (!minres) {
                        minres = res;
                    }
                    else {
                        if (res.ua < minres.ua) {
                            minres = res;
                        }
                    }
                }
            }
        }

        return minres;
    },
    tick: function () {
        var a, i, j, n, m, it;
        // tick the environment
        this.clock++;

        // fix input to all agents based on environment
        // process eyes
        this.collpoints = [];
        for (i = 0, n = this.agents.length; i < n; i++) {
            a = this.agents[i];
            for (var ei = 0, ne = a.sensors.eyes.length; ei < ne; ei++) {
                var e = a.sensors.eyes[ei];
                // we have a line from p to p->eyep
                var eyep = new Vec(a.p.x + e.max_range * Math.sin(a.angle + e.angle),
                    a.p.y + e.max_range * Math.cos(a.angle + e.angle));
                var res = this.stuff_collide_(a.p, eyep, true, true);
                if (res) {
                    // eye collided with wall
                    e.sensed_proximity = res.up.dist_from(a.p);
                    e.sensed_type = res.type;
                    /*
                     if('vx' in res) {
                     e.vx = res.vx;
                     e.vy = res.vy;
                     } else {
                     e.vx = 0;
                     e.vy = 0;
                     }
                     */
                } else {
                    e.sensed_proximity = e.max_range;
                    e.sensed_type = -1;
                    /*
                     e.vx = 0;
                     e.vy = 0;
                     */
                }
            }

            // Reset nostril sensors
            resetSensors(a.sensors.nostrils);

            // x/y reversed compared to Gazebo.
            // Find nearest nostril and apply goal
            //`tan(rad) = Opposite / Adjacent = (y2-y1)/(x2-x1)`
            var srad = Math.atan2(a.goal.p.x - a.p.x, a.goal.p.y - a.p.y);
            //`Hypotenuse = (y2-y1)/sin(rad)`
            var sdis = Math.abs((a.goal.p.x - a.p.x) / Math.sin(srad));

            var robot_r = a.angle;
            if (robot_r > Math.PI) {
                robot_r -= 2 * Math.PI;
            } else if (robot_r < -Math.PI) {
                robot_r += 2 * Math.PI;
            }

            // Minus robot pose from goal direction.
            srad -= robot_r;
            if (srad > Math.PI) {
                srad -= 2 * Math.PI;
            } else if (srad < -Math.PI) {
                srad += 2 * Math.PI;
            }
            //console.log(robot_r.toFixed(3), srad.toFixed(3), sdis.toFixed(0));

            var nostril = findByAngle(a.sensors.nostrils, srad);
            if (nostril && sdis < nostril.max_range) {
                // eye collided with wall
                nostril.sensed_proximity = sdis;
                nostril.sensed_type = a.goal.type;
            }

            // Record for rewarding later.
            a.goal_rel.dis = sdis;
            a.goal_rel.rad = srad;
        }

        // let the agents behave in the world based on their input
        for (i = 0, n = this.agents.length; i < n; i++) {
            this.agents[i].forward();
        }

        // apply outputs of agents on evironment
        for (i = 0, n = this.agents.length; i < n; i++) {
            a = this.agents[i];
            a.op = a.p; // back up old position
            a.oangle = a.angle; // and angle

            // steer the agent according to outputs of wheel velocities
            var rot1 = a.actions[a.action][0] * 1;
            var rot2 = a.actions[a.action][1] * 1;
            var v = new Vec(0, a.rad / 2.0);
            v = v.rotate(a.angle + Math.PI / 2);
            var w1p = a.p.add(v); // positions of wheel 1 and 2
            var w2p = a.p.sub(v);
            var vv = a.p.sub(w2p);
            vv = vv.rotate(-rot1);
            var vv2 = a.p.sub(w1p);
            vv2 = vv2.rotate(rot2);
            var np = w2p.add(vv);
            np.scale(0.5);
            var np2 = w1p.add(vv2);
            np2.scale(0.5);
            a.p = np.add(np2);

            a.angle -= rot1;
            if (a.angle < 0)a.angle += 2 * Math.PI;
            a.angle += rot2;
            if (a.angle > 2 * Math.PI)a.angle -= 2 * Math.PI;

            // agent is trying to move from p to op. Check walls
            if (this.stuff_collide_(a.op, a.p, true, false)) {
                // wall collision! reset position
                a.p = a.op;
            }

            // handle boundary conditions
            if (a.p.x < 0)a.p.x = 0;
            if (a.p.x > this.W)a.p.x = this.W;
            if (a.p.y < 0)a.p.y = 0;
            if (a.p.y > this.H)a.p.y = this.H;

            // handle boundary conditions.. bounce agent
            /*
             if(a.p.x<1) { a.p.x=1; a.v.x=0; a.v.y=0;}
             if(a.p.x>this.W-1) { a.p.x=this.W-1; a.v.x=0; a.v.y=0;}
             if(a.p.y<1) { a.p.y=1; a.v.x=0; a.v.y=0;}
             if(a.p.y>this.H-1) { a.p.y=this.H-1; a.v.x=0; a.v.y=0;}
             */

            a.digestion_signal = 0; // important - reset this!
        }

        /*
         // tick all items
         var update_items = false;
         for(i=0,n=this.items.length;i<n;i++) {
         it = this.items[i];
         it.age += 1;

         // see if some agent gets lunch
         for(j=0,m=this.agents.length;j<m;j++) {
         a = this.agents[j];
         var d = a.p.dist_from(it.p);
         if(d < it.rad + a.rad) {

         // wait lets just make sure that this isn't through a wall
         //var rescheck = this.stuff_collide_(a.p, it.p, true, false);
         var rescheck = false;
         if(!rescheck) {
         // ding! nom nom nom
         if(it.type === 1) a.digestion_signal += 1.0; // mmm delicious apple
         if(it.type === 2) a.digestion_signal += -1.0; // ewww poison
         it.cleanup_ = true;
         update_items = true;
         break; // break out of loop, item was consumed
         }
         }
         }

         // move the items
         it.p.x += it.v.x;
         it.p.y += it.v.y;
         if(it.p.x < 1) { it.p.x = 1; it.v.x *= -1; }
         if(it.p.x > this.W-1) { it.p.x = this.W-1; it.v.x *= -1; }
         if(it.p.y < 1) { it.p.y = 1; it.v.y *= -1; }
         if(it.p.y > this.H-1) { it.p.y = this.H-1; it.v.y *= -1; }

         if(it.age > 5000 && this.clock % 100 === 0 && randf(0,1)<0.1) {
         it.cleanup_ = true; // replace this one, has been around too long
         update_items = true;
         }

         }
         if(update_items) {
         var nt = [];
         for(i=0,n=this.items.length;i<n;i++) {
         it = this.items[i];
         if(!it.cleanup_) nt.push(it);
         }
         this.items = nt; // swap
         }
         if(this.items.length < 50 && this.clock % 10 === 0 && randf(0,1)<0.25) {
         var newitx = randf(20, this.W-20);
         var newity = randf(20, this.H-20);
         var newitt = randi(1, 3); // food or poison (1 and 2)
         var newit = new Item(newitx, newity, newitt);
         this.items.push(newit);
         }
         */

        // tick all goals
        // see if some agent gets lunch
        for (j = 0, m = this.agents.length; j < m; j++) {
            var update_goal = false;
            a = this.agents[j];
            it = a.goal;
            it.age += 1;

            d = a.p.dist_from(it.p);
            if (d < it.rad + a.rad) {

                // wait lets just make sure that this isn't through a wall
                if (!this.stuff_collide_(a.p, it.p, true, false)) {
                    // ding! nom nom nom
                    if (it.type === 0) a.digestion_signal += 1.0; // mmm delicious goal
                    it.cleanup_ = true;
                    update_goal = true;
                    //break; // break out of loop, item was consumed
                }
            }

            if (!update_goal && it.age > 5000 && this.clock % 100 === 0 && randf(0, 1) < 0.1) {
                it.cleanup_ = true; // replace this one, has been around too long
                update_goal = true;
            }

            if (update_goal) {
                // TODO: Only move a little if reached?
                var goalx = randf(20, this.W - 20);
                var goaly = randf(20, this.H - 20);
                var goal = new Item(goalx, goaly, 0);
                goal.rad = 10;
                a.goal = goal;
            }
        }

        // agents are given the opportunity to learn based on feedback of their action on environment
        for (i = 0, n = this.agents.length; i < n; i++) {
            this.agents[i].backward();
        }
    }
};

/**
 * Lookup a sensor array by name.
 * @function
 * @param {array} arr
 * @param {string} name
 * @return {mixed}
 */
var findByName = function (arr, name) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].name === name) {
            return arr[i];
        }
    }
    return;
};

/**
 * Lookup a sensor array by view direction.
 * @function
 * @param {array} arr
 * @param {float} rad
 * @return {mixed}
 */
var findByAngle = function (arr, rad) {
    for (var i = 0; i < arr.length; i++) {
        // FIXME: `=` missing exact gap between, grabbing it from one side, half it?
        if (rad > arr[i].angle - (arr[i].fov / 2) && rad <= arr[i].angle + (arr[i].fov / 2)) {
            return arr[i];
        }
    }
    return;
};

/**
 * Reset given sensors to defaults.
 * @function
 * @param {array} arr
 */
var resetSensors = function (arr) {
    for (var i = 0; i < arr.length; i++) {
        arr[i].sensed_proximity = arr[i].max_range;
        arr[i].sensed_type = -1;
        arr[i].updated = true;
    }
};

/**
 * Initialise sensor positions.
 * @method initSensors
 * @return {object}
 */
var initSensors = function (sensors) {
    var res = {};
    for (var j in sensors) {
        if (sensors.hasOwnProperty(j)) {
            var fov = sensors[j].fov;
            var types = sensors[j].types;
            var range = sensors[j].range;
            for (var i = 0; i < sensors[j].names.length; i++) {
                var rad = (i - ((sensors[j].names.length - 1) / 2)) * fov;
                if (typeof(res[j]) === 'undefined') res[j] = [];
                res[j].push({
                    name: sensors[j].names[i],
                    angle: rad,
                    fov: fov,
                    max_range: range,
                    max_type: sensors[j].types
                });
            }
        }
    }
    console.log(res);
    return res;
};

/**
 * Sensor has a maximum range and senses a number of types.
 * @class
 * @constructor {object} input
 */
var Sensor = function (input) {
    console.log('Creating sensor', input.name);
    this.name = (input && input.name) ? input.name : '';
    this.angle = (input && input.angle) ? input.angle : 0;
    this.fov = (input && input.fov) ? input.fov : (15 * Math.PI / 180); // Default 15deg.
    this.max_range = (input && input.max_range) ? input.max_range : 4;
    this.max_type = (input && input.max_type) ? input.max_type : 1;
    this.sensed_proximity = this.max_range;
    this.sensed_type = -1; // what does the eye see?

    // Watch for updates, syncing framerate to sensors.
    this.updated = false;
};

// A single agent
var Agent = function (id, config) {
    if (!id || !config) throw new Exception('Agent config invalid.');

    this.id = id;
    this.smooth_reward = null;
    this.smooth_reward_history = [];
    this.flott = 0;

    // positional information
    this.p = new Vec(50, 50);
    this.v = new Vec(0, 0);
    this.op = this.p; // old position
    this.angle = 0; // direction facing

    // Initialise sensors from config passed in.
    var num_inputs = 0;
    this.sensors = {};
    var sensors = initSensors(config.sensors);
    for (var j in sensors) {
        if (sensors.hasOwnProperty(j)) {
            for (i = 0; i < sensors[j].length; i++) {
                if (typeof(sensors[j][i].angle) !== 'undefined' && typeof(sensors[j][i].fov) !== 'undefined') {
                    if (typeof(this.sensors[j]) === 'undefined') this.sensors[j] = [];
                    this.sensors[j].push(new Sensor(sensors[j][i]));
                    num_inputs += sensors[j][i].max_type;
                }
            }
        }
    }
    console.log('num_inputs', num_inputs);
    this.num_states = num_inputs;

    this.actions = (config.actions) ? config.actions : [
        // Default actions.
        [1.0, 0.0],
        [1.0, -3.0],
        [1.0, 3.0],
        [0.0, -4.0],
        [0.0, 4.0]
    ];

    // Remember goals relative to agent.
    this.goal = null;
    this.goal_rel = {
        dis: 0,
        rad: 0
    };

    // properties
    this.rad = 10;
    this.colour = config.colour || 'rgb(0,0,255)';
    this.brain = null; // set from outside

    this.reward_bonus = 0.0;
    this.digestion_signal = 0.0;

    // outputs on world
    this.action = 0;

    this.prevactionix = -1;
};
Agent.prototype = {
    getNumStates: function () {
        return this.num_states;
    },
    getMaxNumActions: function () {
        return this.actions.length;
    },
    forward: function () {
        // in forward pass the agent simply behaves in the environment
        // create input to brain
        var i, j;
        var idx = 0;
        var num_inputs = 0;
        for (j in this.sensors) {
            if (this.sensors.hasOwnProperty(j)) {
                num_inputs += this.sensors[j].length;
                // FIXME: Add `max_type` of each sensor to `num_inputs`.
            }
        }
        var input_array = new Array(num_inputs * 1);

        var idx_last = 0;
        for (j in this.sensors) {
            if (this.sensors.hasOwnProperty(j)) {
                for (i = 0; i < this.sensors[j].length; i++) {
                    var s = this.sensors[j][i];
                    idx = (i * s.max_type) + idx_last;
                    for (k = 0; k < s.max_type; k++) {
                        input_array[idx + k] = 1.0;
                    }
                    if (s.sensed_type !== -1) {
                        input_array[idx + s.sensed_type] = s.sensed_proximity / s.max_range; // normalize to [0,1]
                    }
                }
                // Offset the next sensor group by this much.
                // FIXME: Count using each sensor's `max_type`.
                idx_last += this.sensors[j].length * this.sensors[j][0].max_type;
            }
        }

        this.action = this.brain.act(input_array);
        //var action = this.actions[actionix];
        // demultiplex into behavior variables
        //this.action = action;
    },
    backward: function () {
        var reward = this.digestion_signal;

        if (this.digestion_signal > 0) console.log(this.id, 'nom nom nom');

        // var proximity_reward = 0.0;
        // var num_eyes = this.eyes.length;
        // for(var i=0;i<num_eyes;i++) {
        //   var e = this.eyes[i];
        //   // agents dont like to see walls, especially up close
        //   proximity_reward += e.sensed_type === 0 ? e.sensed_proximity/e.max_range : 1.0;
        // }
        // proximity_reward = proximity_reward/num_eyes;
        // reward += proximity_reward;

        //var forward_reward = 0.0;
        //if(this.actionix === 0) forward_reward = 1;

        this.last_reward = reward; // for vis
        this.brain.learn(reward);
    }
};
