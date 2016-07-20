(function(global) {
  'use strict';

  /**
   * Collision detection options
   * @typedef {Object} collisionOpts
   * @property {String} type - The collision type 'quad','grid','brute'
   * @property {number} maxChildren - The max number of children: 'quad' only
   * @property {number} maxDepth - The max depth of the nodes: 'quad' only
   */

  /**
   * Collision Detector wrapper
   * @constructor
   *
   * @param {collisionOpts} opts
   */
  /*export default*/
  let CollisionDetector = function(opts) {
    this.cdType = opts.type;
    if (this.cdType === 'grid') {
      GridCD.apply(this);
    } else if (this.cdType === 'quad') {
      QuadCD.apply(this);
    } else if (this.cdType === 'brute') {
      BruteCD.apply(this);
    }

    /**
     * Set up the CD function
     * @param {Entity} tar
     */
    this.check = function(tar) {
      let self = this, region, cObj = false;
      tar.collisions = [];

      /**
       * Collision check
       * @param {Entity} ent
       */
      function checkIt(ent) {
        if (ent[1] === tar) {
          return;
        }

        if (tar.v1 !== undefined && ent.radius !== undefined) {
          // Eye and Entity
          cObj = self.linePointIntersect(tar.v1, tar.v2, ent.position, ent.radius);
        } else if (tar.v1 !== undefined && ent.v1 !== undefined) {
          // Eye and Wall
          cObj = self.lineIntersect(tar.v1, tar.v2, ent.v1, ent.v2);
        } else if (tar.radius !== undefined && ent.radius !== undefined) {
          // Entities
          cObj = self.circleCircleCollide(ent, tar);
        } else if (tar.radius !== undefined && ent.v1 !== undefined) {
          // Wall
          cObj = self.linePointIntersect(ent.v1, ent.v2, tar.position, tar.radius);
        }

        if (cObj) {
          cObj.entity = ent;
          if (tar.v1 !== undefined && cObj.vecI) {
            cObj.distance = tar.v1.distanceTo(cObj.vecI);
          }
          if (tar.radius !== undefined && ent.v1 !== undefined) {
            cObj.vx = 0;
            cObj.vy = 0;
          } else {
            cObj.vx = (cObj.vecI) ? cObj.vecI.vx : 0;
            cObj.vy = (cObj.vecI) ? cObj.vecI.vy : 0;
          }
          tar.collisions.push(cObj);
        }
      }

      switch (this.cdType) {
        case 'quad':
          region = this.tree.retrieve(tar, checkIt);
          break;
        case 'grid':
          if (tar.gridLocation) {
            if (tar.gridLocation.population !== undefined) {
              for (let [id, ent] of tar.gridLocation.population.entries()) {
                checkIt(ent);
              }
            }
          }
          break;
        case 'brute':
          for (let [id, entity] of this.population.entries()) {
            checkIt(entity);
          }
          break;
      }
      if (tar.collisions.length > 0) {
        return true;
      }
    };

    /**
     * Check for collision of circular entities, and calculate collision point
     * as well as velocity changes that should occur to them
     * @param {Entity} ent
     * @param {Entity} tar
     * @return {{vecI: Vec, distance: number, target: {vx: number, vy: number}, entity: {vx: number, vy: number}}}
     */
    this.circleCircleCollide = function(ent, tar) {
      let collisionObj,
          entP = ent.position,
          tarP = tar.position,
          size = ent.radius + tar.radius,
          collPtX = ((entP.x * tar.radius) + (tarP.x * ent.radius)) / size,
          collPtY = ((entP.y * tar.radius) + (tarP.y * ent.radius)) / size,
          xDist = tar.position.x - ent.position.x,
          yDist = tar.position.y - ent.position.y,
          distFrom = tar.position.distanceTo(ent.position),
          radiusDist = tar.radius + ent.radius,
          distSquared = xDist * xDist + yDist * yDist;

      // Check the squared distances instead of the the distances,
      // same result, but avoids a square root.
      if (distFrom <= radiusDist) {
        let xVelocity = ent.position.vx - tar.position.vx,
            yVelocity = ent.position.vy - tar.position.vy,
            dotProduct = xDist * xVelocity + yDist * yVelocity;

        // Neat vector maths, used for checking if the
        // objects are moving towards one another.
        if (dotProduct > 0) {
          let collisionScale = dotProduct / distSquared,
              xCollision = xDist * collisionScale,
              yCollision = yDist * collisionScale,
              eS = (ent.type === 5 ? ent.radius * 2 : ent.radius),
              tS = (tar.type === 5 ? tar.radius * 2 : tar.radius),
              // The Collision vector is the speed difference
              // projected on the Dist vector, thus it is the
              // component of the speed difference needed for the collision.
              combinedMass = tS + eS,
              collisionWeightA = 2 * ent.radius / combinedMass,
              collisionWeightB = 2 * tar.radius / combinedMass,
              vecI = new Vec(collPtX, collPtY);
          collisionObj = {
            vecI: vecI,
            distance: tar.position.distanceTo(vecI),
            target: {
              vx: tar.position.vx + collisionWeightA * xCollision,
              vy: tar.position.vy + collisionWeightA * yCollision
            },
            entity: {
              vx: ent.position.vx - collisionWeightB * xCollision,
              vy: ent.position.vy - collisionWeightB * yCollision
            }
          };

          return collisionObj;
        }
      }
    };

    /**
     * Line intersection helper function:
     * line segment (v1,v2) intersect segment (v3,v4)
     * @param {Vec} p1 From position
     * @param {Vec} p2 To position
     * @param {Vec} l1 Wall or Line start
     * @param {Vec} l2 Wall or Line end
     * @return {{vecI: Vec, ua: number, ub: number}|boolean}
     */
    this.lineIntersect = function(p1, p2, l1, l2) {
      let d = (l2.y - l1.y) * (p2.x - p1.x) - (l2.x - l1.x) * (p2.y - p1.y);
      if (d === 0.0) {
        return false;
      } // parallel lines
      let ua = ((l2.x - l1.x) * (p1.y - l1.y) - (l2.y - l1.y) * (p1.x - l1.x)) / d,
          ub = ((p2.x - p1.x) * (p1.y - l1.y) - (p2.y - p1.y) * (p1.x - l1.x)) / d;
      if (ua > 0.0 && ua < 1.0 && ub > 0.0 && ub < 1.0) {
        let vecI = new Vec(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
        return {
          ua: ua,
          ub: ub,
          vecI: vecI
        };
      }
      return false;
    };

    /**
     * Find the position of intersect between a line and a point
     * @param {Vec} v1 From position
     * @param {Vec} v2 To position
     * @param {Vec} v0 Target position
     * @param {Number} rad Target radius
     * @return {{vecI: Vec, vecX: number, distance: number}|boolean}
     */
    this.linePointIntersect = function(v1, v2, v0, rad) {
      let v = new Vec(v2.y - v1.y, -(v2.x - v1.x)), // perpendicular vector
          d = Math.abs((v2.x - v1.x) * (v1.y - v0.y) - (v1.x - v0.x) * (v2.y - v1.y));
      d /= v.length();
      if (d >= rad) {
        return false;
      } else {
        v.normalize();
        v.scale(d);
        let vecX,
            vecI = v0.addVecTo(v);
        if (Math.abs(v2.x - v1.x) > Math.abs(v2.y - v1.y)) {
          vecX = (vecI.x - v1.x) / (v2.x - v1.x);
        } else {
          vecX = (vecI.y - v1.y) / (v2.y - v1.y);
        }
        if (vecX > 0.0 && vecX < 1.0) {
          return {
            vecX: vecX,
            vecI: vecI,
            distance: v0.distanceTo(vecI)
          };
        }
      }
    };
  };

  /**
   * QuadTree CD
   * @constructor
   */
  let QuadCD = function() {
    this.nodes = [];
    // init the quadtree
    let args = {
      x: 0,
      y: 0,
      height: this.height,
      width: this.width,
      maxChildren: this.maxChildren,
      maxDepth: this.maxDepth
    };
    this.tree = new QuadTree(args);
    this.tree.insert(this.nodes);

    /**
     * Draw the regions from a node
     * @param {Node} aN
     */
    this.drawRegions = function(aN) {
      let nodes = aN.getNodes(),
          rect = new PIXI.Graphics();
      if (nodes) {
        for (let i = 0; i < nodes.length; i++) {
          this.drawRegions(nodes[i]);
        }
      }

      rect.clear();
      rect.lineStyle(0.5, 0xFF0000, 0.3);
      rect.drawRect(aN.corners[0].x, aN.corners[0].y, aN.width, aN.height);
      rect.endFill();

      if (aN.items !== undefined) {
        let txtOpts = {font: '14px Arial', fill: '#00FF00', align: 'center'},
            popText = new PIXI.Text(aN.items.length, txtOpts);
        popText.position.set(aN.x + aN.width / 2, aN.y + aN.height / 2);
        rect.addChild(popText);
      }

      this.collisionOverlay.addChild(rect);
    };

    /**
     * Update the population
     */
    this.updatePopulation = function() {
      this.tree.clear();
      this.nodes = [];

      for (let [id, entity] of this.population.entries()) {
        this.nodes.push(entity);
      }

      this.tree.insert(this.nodes);

      if (this.cheats.quad) {
        if (this.collisionOverlay !== undefined) {
          this.stage.removeChild(this.collisionOverlay);
        }
        this.collisionOverlay = new PIXI.Container();

        this.drawRegions(this.tree.root);
        this.stage.addChild(this.collisionOverlay);
      } else {
        if (this.collisionOverlay !== undefined) {
          this.stage.removeChild(this.collisionOverlay);
        }
        this.collisionOverlay = new PIXI.Container();
        this.stage.addChild(this.collisionOverlay);
      }
    };
  };

  /**
   * Grid CD
   * @constructor
   */
  let GridCD = function() {
    this.path = this.grid.path;
    this.cellWidth = this.grid.cellSize;
    this.cellHeight = this.grid.cellSize;

    /**
     * Draw the regions of the grid
     */
    this.drawRegions = function() {
      // Draw the grid
      if (this.cheats.grid) {
        // Clear the collision detection holder
        if (this.collisionOverlay !== undefined) {
          this.stage.removeChild(this.collisionOverlay);
        }
        this.collisionOverlay = new PIXI.Container();

        // If we are using grid based collision set up an overlay
        this.grid.cells.forEach((cell) => {
          cell.draw();
          this.collisionOverlay.addChild(cell.shape);
        });

        this.stage.addChild(this.collisionOverlay);
      } else {
        // Clear the collision detection holder
        if (this.collisionOverlay !== undefined) {
          this.stage.removeChild(this.collisionOverlay);
          this.collisionOverlay = new PIXI.Container();
        }
      }
    };

    /**
     * Update populations counts and grids
     */
    this.updatePopulation = function() {
      // Reset the cell's population's
      this.grid.cells.forEach((cell) => {
        cell.population = new Map();
      });

      for (let [id, entity] of this.population.entries()) {
        let cell = this.grid.getGridLocation(entity);
        if (cell) {
          entity.gridLocation = cell;
          if (!entity.gridLocation.population.has(entity.id)) {
            entity.gridLocation.population.set(entity.id, entity);
          }
          if (entity.gridLocation.population === undefined) {
            console.log();
          }
        }
      }

      this.drawRegions();
    };
  };

  /**
   * Brute Force CD
   * @constructor
   */
  let BruteCD = function() {
    /**
     *
     */
    this.drawRegions = function() {
      // Draw the grid
      if (this.cheats.brute) {
        // Clear the collision detection holder
        if (this.collisionOverlay !== undefined) {
          this.stage.removeChild(this.collisionOverlay);
        }
        this.collisionOverlay = new PIXI.Container();

        let txtOpts = {font: '10px Arial', fill: '#000000', align: 'center'},
            popText = new PIXI.Text(this.population.size, txtOpts);
        popText.position.set(this.width / 2, this.height / 2);
        this.collisionOverlay.addChild(popText);

        this.stage.addChild(this.collisionOverlay);
      } else {
        // Clear the collision detection holder
        if (this.collisionOverlay !== undefined) {
          this.stage.removeChild(this.collisionOverlay);
          this.collisionOverlay = new PIXI.Container();
        }
      }

    };

    /**
     * Update the population
     */
    this.updatePopulation = function() {
      this.drawRegions();
    };
  };

  class AABB {
    /**
     * Borrowed/Modified from matter.js
     * Creates a new axis-aligned bounding box for the given vertices.
     * @constructor
     *
     * @param {Point} min
     * @param {Point} max
     * @param {Array} vertices
     * @return {AABB} A new AABB object
     */
    constructor(min = new Point(0, 0), max = new Point(0, 0), vertices) {
      this.min = min;
      this.max = max;
      if (vertices) {
        this.update(vertices);
      }

      return this;
    }

    /**
     * Updates AABB using the given vertices and extends the AABB given a velocity.
     * @method update
     *
     * @param {Array} vecs
     */
    update(vecs) {
      this.min.x = Number.MAX_VALUE;
      this.max.x = Number.MIN_VALUE;
      this.min.y = Number.MAX_VALUE;
      this.max.y = Number.MIN_VALUE;

      vecs.forEach((vec) => {
        if (vec.x > this.max.x) {
          this.max.x = vec.x;
        } else if (vec.x < this.min.x) {
          this.min.x = vec.x;
        }

        if (vec.y > this.max.y) {
          this.max.y = vec.y;
        } else if (vec.y < this.min.y) {
          this.min.y = vec.y;
        }

        // Velocity
        if (vec.vx > 0) {
          this.max.x += vec.vx;
        } else {
          this.min.x += vec.vx;
        }

        if (vec.vy > 0) {
          this.max.y += vec.vy;
        } else {
          this.min.y += vec.vy;
        }
      });

      return this;
    }

    /**
     * Returns true if the AABB contains the given point.
     * @method contains
     *
     * @param {Vec} vec
     * @return {boolean} True if the bounds contain the point, otherwise false
     */
    contains(vec) {
      return vec.x >= this.min.x && vec.x <= this.max.x &&
          vec.y >= this.min.y && vec.y <= this.max.y;
    }

    /**
     * Returns true if the two AABB intersect.
     * @method overlaps
     *
     * @param {AABB} bounds
     * @return {boolean} True if the bounds overlap, otherwise false
     */
    overlaps(bounds) {
      return (bounds.min.x <= this.max.x && bounds.max.x >= this.min.x &&
      bounds.max.y >= this.min.y && bounds.min.y <= this.max.y);
    }

    /**
     * Translates the bounds by the given vector.
     * @method translate
     *
     * @param {Vec} vec
     */
    translate(vec) {
      this.min.x += vec.x;
      this.max.x += vec.x;
      this.min.y += vec.y;
      this.max.y += vec.y;
    }

    /**
     * Shifts the bounds to the given position.
     * @method shift
     *
     * @param {Vec} vec
     */
    shift(vec) {
      let deltaX = this.max.x - this.min.x,
          deltaY = this.max.y - this.min.y;

      this.min.x = vec.x;
      this.max.x = vec.x + deltaX;
      this.min.y = vec.y;
      this.max.y = vec.y + deltaY;
    }
  }

// Checks for Node.js - http://stackoverflow.com/a/27931000/1541408
  if (typeof process !== 'undefined') {
    module.exports = {
      AABB: AABB,
      BruteCD: BruteCD,
      CollisionDetector: CollisionDetector,
      GridCD: GridCD,
      QuadCD: QuadCD
    };
  } else {
    global.AABB = AABB;
    global.BruteCD = BruteCD;
    global.CollisionDetector = CollisionDetector;
    global.GridCD = GridCD;
    global.QuadCD = QuadCD;
  }

}(this));
