"use strict";

/**
 *
 * @param params
 */
function generateCoastLine(params) {
  var mesh = Mesh.generateGoodMesh(params.numPts, params.extent);
  var landscape = add(
    Mesh.slope(mesh, randomVector(4)),
    Mesh.cone(mesh, runIf(-1, -1)),
    Mesh.mountains(mesh, 50, 0.8)
  );

  for (let i = 0; i < 10; i++) {
    landscape = Mesh.relax(landscape);
  }

  landscape = Mesh.peaky(landscape);
  landscape = Mesh.doErosion(landscape, runIf(0, 0.1), 5);
  landscape = Mesh.setSeaLevel(landscape, runIf(0.2, 0.6));
  landscape = Mesh.fillSinks(landscape, 1e-5);
  landscape = Mesh.cleanCoast(landscape, 3);

  return landscape;
}

/**
 *
 * @param params
 */
function generateIslands(params) {
  var mesh = Mesh.generateGoodMesh(params.numPts, params.extent);

  var landscape = add(
    Mesh.slope(mesh, randomVector(1)),
    Mesh.mountains(mesh, 150),
    Mesh.slope(mesh, randomVector(4)),
    Mesh.cone(mesh, runIf(-0.5, 0.5))
  );

  for (let i = 0; i < 20; i++) {
    landscape = Mesh.relax(landscape);
  }

  landscape = Mesh.peaky(landscape);
  landscape = Mesh.doErosion(landscape, runIf(0, 0.2), 5);
  landscape = Mesh.setSeaLevel(landscape, params.seaLevel || 0.5);
  landscape = Mesh.fillSinks(landscape, 1e-9);
  landscape = Mesh.cleanCoast(landscape, 3);

  return landscape;
}

function generateBlob(params) {

}

var rNorm = (function () {
    var z2 = null;

    function rnorm() {
      if (z2 != null) {
        var tmp = z2;
        z2 = null;
        return tmp;
      }
      var x1 = 0,
        x2 = 0,
        w = 2.0;
      while (w >= 1) {
        x1 = runIf(-1, 1);
        x2 = runIf(-1, 1);
        w = x1 * x1 + x2 * x2;
      }
      w = Math.sqrt(-2 * Math.log(w) / w);
      z2 = x2 * w;

      return x1 * w;
    }

    return rnorm;
  })();

  /**
   * Default font sizes for the map
   * @typedef {Object} fontSizeObject
   * @property {number} region
   * @property {number} city
   * @property {number} town
   */
const defaultFontSizes = {
    region: 40,
    city: 25,
    town: 20
  },

  /**
   * Extent Object
   * @typedef {Object} extentObject
   * @property {number} width
   * @property {number} height
   */
  defaultExtent = {
    width: 1,
    height: 1
  },

  /**
   * Default options for the map generator
   * @typedef {Object} defaultParams
   * @property {extentObject} extent
   * @property {function} generator
   * @property {number} width
   * @property {number} height
   * @property {number} numPts
   * @property {number} numCities
   * @property {number} numTerritories
   * @property {fontSizeObject} fontSizes
   */
  defaultParams = {
    extent: defaultExtent,
    generator: generateCoastLine,
    numPts: 16384,
    numCities: 15,
    numTerritories: 5,
    fontSizes: defaultFontSizes
  },

  /**
   * Mesh Object
   * @typedef {meshObject}
   * @property {array} adj
   * @property {array} edges
   * @property {extentObject} extent
   * @property {function} map
   * @property {number} pts
   * @property {array} tris
   * @property {d3.voronoi} vor
   * @property {array} vxs
   */
  meshObject = {
    adj: [],
    edges: [],
    extent: {},
    map: {},
    pts: 0,
    tris: [],
    vor: {},
    vxs: []
  };

function randomVector(scale) {
  return [scale * rNorm(), scale * rNorm()];
}

function runIf(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

function add() {
  var n = arguments[0].length;
  var newVals = Mesh.zero(arguments[0].mesh);
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < arguments.length; j++) {
      newVals[i] += arguments[j][i];
    }
  }

  return newVals;
}


/**
 *
 */
class Mesh {

  /**
   *
   * @param {array} pts
   * @returns {*[]}
   */
  static centroid(pts) {
    var x = 0, y = 0;
    for (let i = 0; i < pts.length; i++) {
      x += pts[i][0];
      y += pts[i][1];
    }

    return [x / pts.length, y / pts.length];
  }

  /**
   *
   * @param {object} landscape
   * @param {number} iterations
   * @returns {*}
   */
  static cleanCoast(landscape, iterations) {
    for (let it = 0; it < iterations; it++) {
      var changed = 0,
        newH = Mesh.zero(landscape.mesh);
      for (let i = 0; i < landscape.length; i++) {
        newH[i] = landscape[i];
        let neighbors = Mesh.neighbors(landscape.mesh, i),
          count = 0,
          best = -999999;
        if (landscape[i] <= 0 || neighbors.length != 3) {
          continue;
        }

        for (let j = 0; j < neighbors.length; j++) {
          if (landscape[neighbors[j]] > 0) {
            count++;
          } else if (landscape[neighbors[j]] > best) {
            best = landscape[neighbors[j]];
          }
        }
        if (count > 1) {
          continue;
        }
        newH[i] = best / 2;
        changed++;
      }
      landscape = newH;
      newH = Mesh.zero(landscape.mesh);
      for (let i = 0; i < landscape.length; i++) {
        newH[i] = landscape[i];
        let nbs = Mesh.neighbors(landscape.mesh, i),
          count = 0,
          best = 999999;
        if (landscape[i] > 0 || nbs.length != 3) {
          continue;
        }

        for (let j = 0; j < nbs.length; j++) {
          if (landscape[nbs[j]] <= 0) {
            count++;
          } else if (landscape[nbs[j]] < best) {
            best = landscape[nbs[j]];
          }
        }
        if (count > 1) {
          continue;
        }
        newH[i] = best / 2;
        changed++;
      }
      landscape = newH;
    }

    return landscape;
  }

  /**
   *
   * @param {meshObject} mesh
   * @param {number} slope
   */
  static cone(mesh, slope) {
    return mesh.map(function (x) {
      return Math.pow(x[0] * x[0] + x[1] * x[1], 0.5) * slope;
    });
  }

  /**
   *
   * @param {object} landscape
   * @param {number} level
   * @returns {array}
   */
  static contour(landscape, level) {
    level = level || 0;
    var edges = [];
    for (let i = 0; i < landscape.mesh.edges.length; i++) {
      var e = landscape.mesh.edges[i];
      if (e[3] == undefined) {
        continue;
      }
      if (Mesh.isNearEdge(landscape.mesh, e[0]) || Mesh.isNearEdge(landscape.mesh, e[1])) {
        continue;
      }
      if ((landscape[e[0]] > level && landscape[e[1]] <= level) ||
        (landscape[e[1]] > level && landscape[e[0]] <= level)) {
        edges.push([e[2], e[3]]);
      }
    }

    return Mesh.mergeSegments(edges);
  }

  /**
   *
   * @param {meshObject} mesh
   * @param {number} i
   * @param {number} j
   * @returns {number}
   */
  static distance(mesh, i, j) {
    var p = mesh.vxs[i],
      q = mesh.vxs[j];

    return Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]));
  }

  /**
   *
   * @param {object} landscape
   * @param {number} amount
   * @param {number} n
   * @returns {object} landscape
   */
  static doErosion(landscape, amount, n) {
    n = n || 1;
    landscape = Mesh.fillSinks(landscape);
    for (let i = 0; i < n; i++) {
      landscape = Mesh.erode(landscape, amount);
      landscape = Mesh.fillSinks(landscape);
    }

    return landscape;
  }

  /**
   *
   * @param {object} landscape
   * @returns {array} downs
   */
  static downhill(landscape) {
    if (landscape.downhill) {
      return landscape.downhill;
    }

    function downFrom(i) {
      if (Mesh.isEdge(landscape.mesh, i)) {
        return -2;
      }
      var best = -1,
        besth = landscape[i],
        nbs = Mesh.neighbors(landscape.mesh, i);
      for (let j = 0; j < nbs.length; j++) {
        if (landscape[nbs[j]] < besth) {
          besth = landscape[nbs[j]];
          best = nbs[j];
        }
      }

      return best;
    }

    var downs = [];
    for (let i = 0; i < landscape.length; i++) {
      downs[i] = downFrom(i);
    }
    landscape.downhill = downs;

    return downs;
  }

  /**
   *
   * @param {object} landscape
   * @param {number} p
   */
  static dropEdge(landscape, p) {
    p = p || 4;
    var newH = Mesh.zero(landscape.mesh);
    for (let i = 0; i < landscape.length; i++) {
      var v = landscape.mesh.vxs[i],
        x = 2.4 * v[0] / landscape.mesh.extent.width,
        y = 2.4 * v[1] / landscape.mesh.extent.height;
      newH[i] = landscape[i] - Math.exp(10 * (Math.pow(Math.pow(x, p) + Math.pow(y, p), 1 / p) - 1));
    }

    return newH;
  }

  /**
   *
   * @param {object} landscape
   * @param {number} amount
   * @returns {meshObject} newH
   */
  static erode(landscape, amount) {
    var er = Mesh.erosionRate(landscape),
      newH = Mesh.zero(landscape.mesh),
      maxR = d3.max(er);
    for (let i = 0; i < landscape.length; i++) {
      newH[i] = landscape[i] - amount * (er[i] / maxR);
    }

    return newH;
  }

  /**
   *
   * @param {object} landscape
   * @returns {meshObject} newH
   */
  static erosionRate(landscape) {
    var flux = Mesh.getFlux(landscape),
      slope = Mesh.getSlope(landscape),
      newH = Mesh.zero(landscape.mesh);
    for (let i = 0; i < landscape.length; i++) {
      var river = Math.sqrt(flux[i]) * slope[i],
        creep = slope[i] * slope[i],
        total = 1000 * river + creep;
      total = total > 200 ? 200 : total;
      newH[i] = total;
    }

    return newH;
  }

  /**
   *
   * @param {object} landscape
   * @param {number} epsilon
   * @returns {meshObject} newH
   */
  static fillSinks(landscape, epsilon) {
    epsilon = epsilon || 1e-5;
    var infinity = 999999,
      newH = Mesh.zero(landscape.mesh);
    for (let i = 0; i < landscape.length; i++) {
      if (Mesh.isNearEdge(landscape.mesh, i)) {
        newH[i] = landscape[i];
      } else {
        newH[i] = infinity;
      }
    }

    while (true) {
      var changed = false;
      for (let i = 0; i < landscape.length; i++) {
        if (newH[i] == landscape[i]) {
          continue;
        }
        var nbs = Mesh.neighbors(landscape.mesh, i);
        for (let j = 0; j < nbs.length; j++) {
          if (landscape[i] >= newH[nbs[j]] + epsilon) {
            newH[i] = landscape[i];
            changed = true;
            break;
          }
          var oh = newH[nbs[j]] + epsilon;
          if ((newH[i] > oh) && (oh > landscape[i])) {
            newH[i] = oh;
            changed = true;
          }
        }
      }
      if (!changed) {
        return newH;
      }
    }
  }

  /**
   *
   * @param {object} landscape
   */
  static findSinks(landscape) {
    var dh = Mesh.downhill(landscape),
      sinks = [];
    for (let i = 0; i < dh.length; i++) {
      var node = i;
      while (true) {
        if (Mesh.isEdge(landscape.mesh, node)) {
          sinks[i] = -2;
          break;
        }
        if (dh[node] == -1) {
          sinks[i] = node;
          break;
        }
        node = dh[node];
      }
    }
  }

  /**
   *
   * @param {number} n
   * @param {extentObject} extent
   * @returns {meshObject}
   */
  static generateGoodMesh(n, extent) {
    n = n || 1;
    extent = extent || defaultExtent;
    var pts = Mesh.generateGoodPoints(n, extent);

    return Mesh.makeMesh(pts, extent);
  }

  /**
   *
   * @param {number} n
   * @param {extentObject} extent
   * @returns {Array}
   */
  static generateGoodPoints(n, extent) {
    n = n || 1;
    extent = extent || defaultExtent;
    var pts = Mesh.generatePoints(n, extent);
    pts = pts.sort(function (a, b) {
      return a[0] - b[0];
    });

    return Mesh.improvePoints(pts, 1, extent);
  }

  /**
   *
   * @param {number} n
   * @param {extentObject} extent
   * @returns {Array} pts
   */
  static generatePoints(n, extent) {
    n = n || 1;
    extent = extent || defaultExtent;
    var pts = [];
    for (let i = 0; i < n; i++) {
      pts.push([
        (Math.random() - 0.5) * extent.width,
        (Math.random() - 0.5) * extent.height
      ]);
    }

    return pts;
  }

  /**
   *
   * @param {object} landscape
   * @returns {meshObject} flux
   */
  static getFlux(landscape) {
    var dh = Mesh.downhill(landscape),
      idxs = [],
      flux = Mesh.zero(landscape.mesh);

    for (let i = 0; i < landscape.length; i++) {
      idxs[i] = i;
      flux[i] = 1 / landscape.length;
    }

    idxs.sort(function (a, b) {
      return landscape[b] - landscape[a];
    });

    for (let i = 0; i < landscape.length; i++) {
      var j = idxs[i];
      if (dh[j] >= 0) {
        flux[dh[j]] += flux[j];
      }
    }

    return flux;
  }

  /**
   *
   * @param {object} landscape
   * @returns {meshObject} slope
   */
  static getSlope(landscape) {
    var dh = Mesh.downhill(landscape),
      slope = Mesh.zero(landscape.mesh);
    for (let i = 0; i < landscape.length; i++) {
      var s = Mesh.triSlope(landscape, i);
      slope[i] = Math.sqrt(s[0] * s[0] + s[1] * s[1]);
      continue;
      if (dh[i] < 0) {
        slope[i] = 0;
      } else {
        slope[i] = (landscape[i] - landscape[dh[i]]) / Mesh.distance(landscape.mesh, i, dh[i]);
      }
    }
    return slope;
  }

  /**
   * Lloyd relaxation to improve the point set
   * @param {Array} pts
   * @param {number} n
   * @param {extentObject} extent
   * @returns {Array} pts
   */
  static improvePoints(pts, n, extent) {
    n = n || 1;
    extent = extent || defaultExtent;
    for (let i = 0; i < n; i++) {
      pts = Mesh.voronoi(pts, extent).polygons(pts).map(Mesh.centroid);
    }

    return pts;
  }

  /**
   * Check if it is an edge
   * @param {meshObject} mesh
   * @param {number} i
   * @returns {boolean}
   */
  static isEdge(mesh, i) {
    return (mesh.adj[i].length < 3);
  }

  /**
   * Check if it is near an edge
   * @param {meshObject} mesh
   * @param {number} i
   * @returns {boolean}
   */
  static isNearEdge(mesh, i) {
    var x = mesh.vxs[i][0],
      y = mesh.vxs[i][1],
      w = mesh.extent.width,
      h = mesh.extent.height;

    return x < -0.45 * w || x > 0.45 * w || y < -0.45 * h || y > 0.45 * h;
  }

  /**
   *
   * @param {Array} pts
   * @param {extentObject} extent
   * @returns {meshObject} mesh
   */
  static makeMesh(pts, extent) {
    var vor = Mesh.voronoi(pts, extent),
      vxs = [],
      vxids = {},
      adj = [],
      edges = [],
      tris = [];
    for (let i = 0; i < vor.edges.length; i++) {
      var e = vor.edges[i];
      if (e == undefined) {
        continue;
      }
      var e0 = vxids[e[0]],
        e1 = vxids[e[1]];
      if (e0 == undefined) {
        e0 = vxs.length;
        vxids[e[0]] = e0;
        vxs.push(e[0]);
      }
      if (e1 == undefined) {
        e1 = vxs.length;
        vxids[e[1]] = e1;
        vxs.push(e[1]);
      }
      adj[e0] = adj[e0] || [];
      adj[e0].push(e1);
      adj[e1] = adj[e1] || [];
      adj[e1].push(e0);
      edges.push([e0, e1, e.left, e.right]);
      tris[e0] = tris[e0] || [];
      if (!tris[e0].includes(e.left)) {
        tris[e0].push(e.left);
      }
      if (e.right && !tris[e0].includes(e.right)) {
        tris[e0].push(e.right);
      }
      tris[e1] = tris[e1] || [];
      if (!tris[e1].includes(e.left)) {
        tris[e1].push(e.left);
      }
      if (e.right && !tris[e1].includes(e.right)) {
        tris[e1].push(e.right);
      }
    }

    /**
     * @type {meshObject} mesh
     */
    var mesh = {
      pts: pts,
      vor: vor,
      vxs: vxs,
      adj: adj,
      tris: tris,
      edges: edges,
      extent: extent
    };

    mesh.map = function (f) {
      var mapped = vxs.map(f);
      mapped.mesh = mesh;

      return mapped;
    };

    return mesh;
  }

  /**
   *
   * @param {object} landscape
   * @param {function} f
   * @returns {object} newH
   */
  static map(landscape, f) {
    var newH = landscape.map(f);
    newH.mesh = landscape.mesh;

    return newH;
  }

  /**
   *
   * @param {Array} segs
   * @returns {Array} paths
   */
  static mergeSegments(segs) {
    var adj = {};
    for (let i = 0; i < segs.length; i++) {
      var seg = segs[i],
        a0 = adj[seg[0]] || [],
        a1 = adj[seg[1]] || [];
      a0.push(seg[1]);
      a1.push(seg[0]);
      adj[seg[0]] = a0;
      adj[seg[1]] = a1;
    }
    var done = [],
      paths = [],
      path = null;
    while (true) {
      if (path === null) {
        for (let i = 0; i < segs.length; i++) {
          if (done[i]) continue;
          done[i] = true;
          path = [segs[i][0], segs[i][1]];
          break;
        }
        if (path === null) {
          break;
        }
      }
      var changed = false;
      for (let i = 0; i < segs.length; i++) {
        if (done[i]) {
          continue;
        }
        if (adj[path[0]].length === 2 && segs[i][0] === path[0]) {
          path.unshift(segs[i][1]);
        } else if (adj[path[0]].length === 2 && segs[i][1] === path[0]) {
          path.unshift(segs[i][0]);
        } else if (adj[path[path.length - 1]].length === 2 && segs[i][0] === path[path.length - 1]) {
          path.push(segs[i][1]);
        } else if (adj[path[path.length - 1]].length === 2 && segs[i][1] === path[path.length - 1]) {
          path.push(segs[i][0]);
        } else {
          continue;
        }
        done[i] = true;
        changed = true;
        break;
      }
      if (!changed) {
        paths.push(path);
        path = null;
      }
    }

    return paths;
  }

  /**
   *
   * @param {meshObject} mesh
   * @param {number} n
   * @param {number} r
   * @returns {meshObject} newVals
   */
  static mountains(mesh, n, r) {
    r = r || 0.05;
    let mounts = [],
        newVals = Mesh.zero(mesh);
    for (let i = 0; i < n; i++) {
      let x = mesh.extent.width * (Math.random() - 0.5),
          y = mesh.extent.height * (Math.random() - 0.5);
      mounts.push([x, y]);
    }

    for (let i = 0; i < mesh.vxs.length; i++) {
      let p = mesh.vxs[i];
      for (let j = 0; j < n; j++) {
        let m = mounts[j],
          val = Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2);
        newVals[i] += val;
      }
    }

    return newVals;
  }

  /**
   *
   * @param {meshObject} mesh
   * @param {number} i
   * @returns {Array} nbs
   */
  static neighbors(mesh, i) {
    var onbs = mesh.adj[i],
      nbs = [];
    for (let i = 0; i < onbs.length; i++) {
      nbs.push(onbs[i]);
    }

    return nbs;
  }

  /**
   *
   * @param {object} landscape
   * @returns {*}
   */
  static normalize(landscape) {
    var lo = d3.min(landscape),
      hi = d3.max(landscape);

    return Mesh.map(landscape, function (x) {
      return (x - lo) / (hi - lo);
    });
  }

  /**
   *
   * @param {object} landscape
   * @returns {*}
   */
  static peaky(landscape) {
    return Mesh.map(Mesh.normalize(landscape), Math.sqrt);
  }

  /**
   *
   * @param {object} landscape
   * @param {number} q
   * @returns {number}
   */
  static quantile(landscape, q) {
    var sortedH = [];
    for (let i = 0; i < landscape.length; i++) {
      sortedH[i] = landscape[i];
    }
    sortedH.sort(d3.ascending);

    return d3.quantile(sortedH, q);
  }

  /**
   *
   * @param {object} landscape
   * @returns {meshObject} newH
   */
  static relax(landscape) {
    var newH = Mesh.zero(landscape.mesh);
    for (let i = 0; i < landscape.length; i++) {
      var nbs = Mesh.neighbors(landscape.mesh, i);
      if (nbs.length < 3) {
        newH[i] = 0;
        continue;
      }
      newH[i] = d3.mean(nbs.map(function (j) {
        return landscape[j];
      }));
    }

    return newH;
  }

  /**
   *
   * @param {Array} path
   * @returns {Array} newPath
   */
  static relaxPath(path) {
    var newPath = [path[0]];
    for (let i = 1; i < path.length - 1; i++) {
      var newPt = [
        0.25 * path[i - 1][0] + 0.5 * path[i][0] + 0.25 * path[i + 1][0],
        0.25 * path[i - 1][1] + 0.5 * path[i][1] + 0.25 * path[i + 1][1]
      ];
      newPath.push(newPt);
    }
    newPath.push(path[path.length - 1]);

    return newPath;
  }

  /**
   *
   * @param {object} landscape
   * @param {number} q
   * @returns {meshObject} newH
   */
  static setSeaLevel(landscape, q) {
    var newH = Mesh.zero(landscape.mesh),
      delta = Mesh.quantile(landscape, q);
    for (let i = 0; i < landscape.length; i++) {
      let landVal = landscape[i];
      newH[i] = landVal - delta;
    }

    return newH;
  }

  /**
   *
   * @param {meshObject} mesh
   * @param {Array} direction
   */
  static slope(mesh, direction) {
    return mesh.map(function (x) {
      return x[0] * direction[0] + x[1] * direction[1];
    });
  }

  /**
   *
   * @param {object} landscape
   * @param {number} i
   * @returns {*[]}
   */
  static triSlope(landscape, i) {
    var nbs = Mesh.neighbors(landscape.mesh, i);
    if (nbs.length != 3) {
      return [0, 0];
    }
    var p0 = landscape.mesh.vxs[nbs[0]],
      p1 = landscape.mesh.vxs[nbs[1]],
      p2 = landscape.mesh.vxs[nbs[2]],

      x1 = p1[0] - p0[0],
      x2 = p2[0] - p0[0],
      y1 = p1[1] - p0[1],
      y2 = p2[1] - p0[1],

      det = x1 * y2 - x2 * y1,
      h1 = landscape[nbs[1]] - landscape[nbs[0]],
      h2 = landscape[nbs[2]] - landscape[nbs[0]];

    return [
      (y2 * h1 - y1 * h2) / det,
      (-x2 * h1 + x1 * h2) / det
    ];
  }

  /**
   *
   * @param {Array} pts
   * @param {extentObject} extent
   * @returns {d3.voronoi} v
   */
  static voronoi(pts, extent) {
    var w = extent.width / 2,
      h = extent.height / 2,
      v = d3.voronoi().extent([[-w, -h], [w, h]])(pts);

    return v;
  }

  /**
   *
   * @param {meshObject} mesh
   * @returns {meshObject} z
   */
  static zero(mesh) {
    var z = [];
    for (let i = 0; i < mesh.vxs.length; i++) {
      z[i] = 0;
    }
    z.mesh = mesh;

    return z;
  }

}

/**
 *
 */
class Map {

  /**
   *
   * @param {defaultParams} params
   * @param {ID3Selection} svg
   * @returns {Map}
   */
  constructor(params, svg) {
    /** @type {defaultParams} params */
    this.settings = params || defaultParams;
    this.svg = svg;

    this.borders = [];
    this.cities = [];
    this.coasts = [];
    this.rivers = [];
    this.territories = [];

    this.viewBorders = true;
    this.viewCities = true;
    this.viewCoasts = true;
    this.viewHeight = false;
    this.viewLabels = true;
    this.viewRivers = true;
    this.viewScores = false;
    this.viewSlopes = true;
    this.viewPoints = false;

    this.functions = {
      addCity: () => {
        this.addCity();
        this.drawMap();
      },
      addCone: () => {
        this.landscape = add(this.landscape, Mesh.cone(this.landscape.mesh, -0.5));
        this.drawMap();
      },
      addInvertedCone: () => {
        this.landscape = add(this.landscape, Mesh.cone(this.landscape.mesh, 0.5));
        this.drawMap();
      },
      addMountains: () => {
        this.landscape = add(this.landscape, Mesh.mountains(this.landscape.mesh, 5));
        this.drawMap();
      },
      addRandomSlope: () => {
        this.landscape = add(this.landscape, Mesh.slope(this.landscape.mesh, randomVector(4)));
        this.drawMap();
      },
      toggleBorders: () => {
        this.viewBorders = !this.viewBorders;
        this.drawMap();
      },
      toggleCities: () => {
        this.viewCities = !this.viewCities;
        this.drawMap();
      },
      toggleCoasts: () => {
        this.viewCoasts = !this.viewCoasts;
        this.drawMap();
      },
      toggleLabels: () => {
        this.viewLabels = !this.viewLabels;
        this.drawMap();
      },
      togglePoints: () => {
        this.viewPoints = !this.viewPoints;
        this.drawMap();
      },
      toggleRivers: () => {
        this.viewRivers = !this.viewRivers;
        this.drawMap();
      },
      toggleScores: () => {
        this.viewScores = !this.viewScores;
        this.drawMap();
      },
      toggleSlopes: () => {
        this.viewSlopes = !this.viewSlopes;
        this.drawMap();
      },
      resetMap: () => {
        this.doMap();
      }
    };

    this.svg.attr('float', 'left').attr('background-color', 'white');

    return this;
  }

  /**
   *
   */
  addCity() {
    this.cities = this.cities || [];
    var score = this.cityScore(),
      newCity = d3.scan(score, d3.descending);
    this.cities.push(newCity);
  }

  /**
   *
   * @returns {object} score
   */
  cityScore() {
    var score = Mesh.map(Mesh.getFlux(this.landscape), Math.sqrt);
    for (let i = 0; i < this.landscape.length; i++) {
      if (this.landscape[i] <= 0 || Mesh.isNearEdge(this.landscape.mesh, i)) {
        score[i] = -999999;
        continue;
      }
      score[i] += 0.01 / (1e-9 + Math.abs(this.landscape.mesh.vxs[i][0]) - this.landscape.mesh.extent.width / 2);
      score[i] += 0.01 / (1e-9 + Math.abs(this.landscape.mesh.vxs[i][1]) - this.landscape.mesh.extent.height / 2);
      for (let j = 0; j < this.cities.length; j++) {
        score[i] -= 0.02 / (Mesh.distance(this.landscape.mesh, this.cities[j], i) + 1e-9);
      }
    }

    return score;
  }

  /**
   *
   */
  doMap() {
    this.svg.selectAll().remove();
    this.borders = [];
    this.cities = [];
    this.coasts = [];
    this.rivers = [];
    this.territories = [];
    this.landscape = this.settings.generator(this.settings);
    this.generateTerritories();
    this.generateBorders();
    this.generateRivers(0.01);
    this.generateCoasts();
    this.generateCities();
    this.generateLabels();

    this.drawMap();

    return this;
  }

  /**
   *
   * @returns {Map}
   */
  drawMap() {
    let mesh = this.landscape.mesh;

    this.drawPaths('border', this.viewBorders ? this.borders : []);
    this.drawCircles('city', this.viewCities ? this.cities : []);
    this.drawPaths('coast', this.viewCoasts ? this.coasts : []);
    this.drawPaths('river', this.viewRivers ? this.rivers : []);
    this.drawSlopes(this.viewSlopes ? this.landscape : {mesh: Mesh.zero(mesh)});
    this.drawPoints(this.viewPoints ? this.landscape.mesh.pts : []);

    if (this.viewHeight) {
      this.drawVoronoi(this.landscape, 0, 1);
    } else {
      this.svg.selectAll('path.field').remove();
    }

    if (!this.viewLabels) {
      this.svg.selectAll('text.city').remove();
      this.svg.selectAll('text.region').remove();
    }

    if (this.viewScores) {
      this.drawScores();
    }

    this.svg.selectAll('path, line')
      .style('fill', 'none')
      .style('stroke', 'black')
      .style('stroke-linecap', 'round');

    this.svg.selectAll('path.field')
      .style('stroke', 'none')
      .style('fill-opacity', 1.0);

    this.svg.selectAll('path.border')
      .style('stroke-width', 5)
      .style('stroke-dasharray', '4,4')
      .style('stroke-linecap', 'butt');

    this.svg.selectAll('circle.city')
      .style('fill', 'white')
      .style('stroke-width', 2)
      .style('stroke-linecap', 'round')
      .style('stroke', 'green');

    this.svg.selectAll('path.coast')
      .style('stroke-width', 3);

    this.svg.selectAll('path.river')
      .style('stroke-width', 2);

    this.svg.selectAll('line.slope')
      .style('stroke-width', 1);

    this.svg.selectAll('text')
      .style('font-family', '"Palatino Linotype", "Book Antiqua", "Palatino", "serif"')
      .style('color', 'black')
      .style('stroke', 'white')
      .style('stroke-linejoin', 'round')
      .style('paint-order', 'stroke');

    this.svg.selectAll('text.city')
      .style('stroke-width', 2);

    this.svg.selectAll('text.region')
      .style('font-variant', 'small-caps')
      .style('text-anchor', 'middle')
      .style('stroke-width', 5);

    return this;
  }

  /**
   *
   * @returns {Map}
   */
  drawCircles(cls, pts) {
    this.svg.selectAll('circle.' + cls).remove();
    var circles = this.svg.selectAll('circle.' + cls).data(pts);
    circles.enter().append('circle').classed(cls, true);
    circles.exit().remove();

    this.svg.selectAll('circle.' + cls)
      .attr('cx', (d) => {
        return 1000 * this.landscape.mesh.vxs[d][0];
      })
      .attr('cy', (d) => {
        return 1000 * this.landscape.mesh.vxs[d][1];
      })
      .attr('r', (d, i) => {
        return i >= this.settings.numTerritories ? 4 : 10;
      })
      .raise();

    return this;
  }

  /**
   *
   * @param {string} cls
   * @param {Array} paths
   * @returns {Map}
   */
  drawPaths(cls, pts) {
    this.svg.selectAll('path.' + cls).remove();
    var svgPaths = this.svg.selectAll('path.' + cls).data(pts);
    svgPaths.enter().append('path').classed(cls, true);
    svgPaths.exit().remove();

    this.svg.selectAll('path.' + cls).attr('d', this.makeD3Path);

    return this;
  }

  /**
   *
   * @returns {Map}
   */
  drawPoints(pts) {
    this.svg.selectAll('circle').remove();
    var circle = this.svg.selectAll('circle').data(pts);
    circle.enter().append('circle');
    circle.exit().remove();
    d3.selectAll('circle')
      .attr('cx', function (d) {
        return 1000 * d[0];
      })
      .attr('cy', function (d) {
        return 1000 * d[1];
      })
      .attr('r', 100 / Math.sqrt(pts.length));

    return this;
  }

  /**
   *
   */
  drawScores() {
    var score = this.cityScore();
    this.drawVoronoi(score, d3.max(score) - 0.5, d3.max(score) + 0.5);
  }

  /**
   *
   * @returns {Map}
   */
  drawSlopes(landscape) {
    this.svg.selectAll('line.slope').remove();
    var strokes = [],
      r = 0.25 / Math.sqrt(landscape.length);
    for (let i = 0; i < landscape.length; i++) {
      if (landscape[i] <= 0 || Mesh.isNearEdge(landscape.mesh, i)) {
        continue;
      }
      var nbs = Mesh.neighbors(landscape.mesh, i),
        s = 0,
        s2 = 0;
      nbs.push(i);
      for (let j = 0; j < nbs.length; j++) {
        var slopes = Mesh.triSlope(landscape, nbs[j]);
        s += slopes[0] / 10;
        s2 += slopes[1];
      }
      s /= nbs.length;
      s2 /= nbs.length;
      if (Math.abs(s) < runIf(0.1, 0.4)) {
        continue;
      }
      var l = r * runIf(1, 2) * (1 - 0.2 * Math.pow(Math.atan(s), 2)) * Math.exp(s2 / 100),
        x = landscape.mesh.vxs[i][0],
        y = landscape.mesh.vxs[i][1];
      if (Math.abs(l * s) > 2 * r) {
        var n = Math.floor(Math.abs(l * s / r));
        l /= n;
        if (n > 4) {
          n = 4;
        }
        for (let j = 0; j < n; j++) {
          var u = rNorm() * r,
            v = rNorm() * r;
          strokes.push([[x + u - l, y + v + l * s], [x + u + l, y + v - l * s]]);
        }
      } else {
        strokes.push([[x - l, y + l * s], [x + l, y - l * s]]);
      }
    }

    var lines = this.svg.selectAll('line.slope').data(strokes);
    lines.enter().append('line').classed('slope', true);
    lines.exit().remove();

    this.svg.selectAll('line.slope')
      .attr('x1', function (d) {
        return 1000 * d[0][0];
      })
      .attr('y1', function (d) {
        return 1000 * d[0][1];
      })
      .attr('x2', function (d) {
        return 1000 * d[1][0];
      })
      .attr('y2', function (d) {
        return 1000 * d[1][1];
      });

    return this;
  }

  /**
   *
   * @param {object} landscape
   * @param {number} lo
   * @param {number} hi
   */
  drawVoronoi(landscape, lo, hi) {
    this.svg.selectAll('path.field').remove();
    if (hi == undefined) {
      hi = d3.max(landscape) + 1e-9;
    }
    if (lo == undefined) {
      lo = d3.min(landscape) - 1e-9;
    }
    var mappedVals = landscape.map(function (x) {
        return x > hi ? 1 : x < lo ? 0 : (x - lo) / (hi - lo);
      }),
      tris = this.svg.selectAll('path.field').data(landscape.mesh.tris);

    tris.enter().append('path').classed('field', true);
    tris.exit().remove();

    this.svg.selectAll('path.field')
      .attr('d', this.makeD3Path)
      .style('fill', function (d, i) {
        return d3.interpolateViridis(mappedVals[i]);
      });
  }

  /**
   *
   * @returns {Map}
   */
  generateBorders() {
    var edges = [];
    for (let i = 0; i < this.territories.mesh.edges.length; i++) {
      var e = this.territories.mesh.edges[i];
      if (e[3] == undefined) {
        continue;
      }
      if (Mesh.isNearEdge(this.territories.mesh, e[0]) || Mesh.isNearEdge(this.territories.mesh, e[1])) {
        continue;
      }
      if (this.landscape[e[0]] < 0 || this.landscape[e[1]] < 0) {
        continue;
      }
      if (this.territories[e[0]] != this.territories[e[1]]) {
        edges.push([e[2], e[3]]);
      }
    }

    this.borders = Mesh.mergeSegments(edges).map(Mesh.relaxPath);

    return this;
  }

  /**
   *
   * @returns {Map}
   */
  generateCities() {
    var n = this.settings.numCities;
    for (let i = 0; i < n; i++) {
      var score = this.cityScore(),
        newCity = d3.scan(score, d3.descending);
      this.cities.push(newCity);
    }

    return this;
  }

  /**
   *
   * @returns {Map}
   */
  generateCoasts() {
    this.coasts = Mesh.contour(this.landscape, 0);

    return this;
  }

  /**
   *
   * @returns {Map}
   */
  generateLabels() {
    this.svg.selectAll('text.city').remove();
    this.svg.selectAll('text.region').remove();
    var numTer = this.settings.numTerritories,
      avoids = [this.rivers, this.coasts, this.borders],
      lang = makeRandomLanguage(),
      cityLabels = [];

    var penalty = (label) => {
      let pen = 0;
      if (label.x0 < -0.45 * this.landscape.mesh.extent.width) {
        pen += 100;
      }
      if (label.x1 > 0.45 * this.landscape.mesh.extent.width) {
        pen += 100;
      }
      if (label.y0 < -0.45 * this.landscape.mesh.extent.height) {
        pen += 100;
      }
      if (label.y1 > 0.45 * this.landscape.mesh.extent.height) {
        pen += 100;
      }

      for (let i = 0; i < cityLabels.length; i++) {
        let oLabel = cityLabels[i];
        if (label.x0 < oLabel.x1 && label.x1 > oLabel.x0 &&
          label.y0 < oLabel.y1 && label.y1 > oLabel.y0) {
          pen += 100;
        }
      }

      for (let i = 0; i < this.cities.length; i++) {
        let c = this.landscape.mesh.vxs[this.cities[i]];
        if (label.x0 < c[0] && label.x1 > c[0] && label.y0 < c[1] && label.y1 > c[1]) {
          pen += 100;
        }
      }

      for (let i = 0; i < avoids.length; i++) {
        let avoid = avoids[i];
        for (let j = 0; j < avoid.length; j++) {
          let avpath = avoid[j];
          for (let k = 0; k < avpath.length; k++) {
            let pt = avpath[k];
            if (pt[0] > label.x0 && pt[0] < label.x1 && pt[1] > label.y0 && pt[1] < label.y1) {
              pen++;
            }
          }
        }
      }

      return pen;
    };

    // City labels
    for (let i = 0; i < this.cities.length; i++) {
      let x = this.landscape.mesh.vxs[this.cities[i]][0],
        y = this.landscape.mesh.vxs[this.cities[i]][1],
        text = makeName(lang, 'city'),
        size = i < numTer ? this.settings.fontSizes.city : this.settings.fontSizes.town,
        sx = 0.65 * size / 1000 * text.length,
        sy = size / 1000,
        possLabels = [
          {
            x: x + 0.8 * sy,
            y: y + 0.3 * sy,
            align: 'start',
            x0: x + 0.7 * sy,
            y0: y - 0.6 * sy,
            x1: x + 0.7 * sy + sx,
            y1: y + 0.6 * sy
          },
          {
            x: x - 0.8 * sy,
            y: y + 0.3 * sy,
            align: 'end',
            x0: x - 0.9 * sy - sx,
            y0: y - 0.7 * sy,
            x1: x - 0.9 * sy,
            y1: y + 0.7 * sy
          },
          {
            x: x,
            y: y - 0.8 * sy,
            align: 'middle',
            x0: x - sx / 2,
            y0: y - 1.9 * sy,
            x1: x + sx / 2,
            y1: y - 0.7 * sy
          },
          {
            x: x,
            y: y + 1.2 * sy,
            align: 'middle',
            x0: x - sx / 2,
            y0: y + 0.1 * sy,
            x1: x + sx / 2,
            y1: y + 1.3 * sy
          }
        ],
        label = possLabels[d3.scan(possLabels, function (a, b) {
          return penalty(a) - penalty(b);
        })];
      label.text = text;
      label.size = size;
      cityLabels.push(label);
    }

    var cityTexts = this.svg.selectAll('text.city').data(cityLabels);
    cityTexts.enter().append('text').classed('city', true);
    cityTexts.exit().remove();

    this.svg.selectAll('text.city')
      .attr('x', function (d) {
        return 1000 * d.x;
      })
      .attr('y', function (d) {
        return 1000 * d.y;
      })
      .style('font-size', function (d) {
        return d.size;
      })
      .style('text-anchor', function (d) {
        return d.align;
      })
      .text(function (d) {
        return d.text;
      })
      .raise();

    // Region labels
    var regionLabels = [];
    for (let i = 0; i < numTer; i++) {
      let city = this.cities[i],
        text = makeName(lang, 'region'),
        sy = this.settings.fontSizes.region / 1000,
        sx = 0.6 * text.length * sy,
        lc = this.getTerritoryCenter(this.territories, city, true),
        oc = this.getTerritoryCenter(this.territories, city, false),
        best = 0,
        bestScore = -999999;
      for (let j = 0; j < this.landscape.length; j++) {
        let score = 0,
          v = this.landscape.mesh.vxs[j];
        score -= 3000 * Math.sqrt((v[0] - lc[0]) * (v[0] - lc[0]) + (v[1] - lc[1]) * (v[1] - lc[1]));
        score -= 1000 * Math.sqrt((v[0] - oc[0]) * (v[0] - oc[0]) + (v[1] - oc[1]) * (v[1] - oc[1]));
        if (this.territories[j] != city) {
          score -= 3000;
        }
        for (let k = 0; k < this.cities.length; k++) {
          let u = this.landscape.mesh.vxs[this.cities[k]];
          if (Math.abs(v[0] - u[0]) < sx && Math.abs(v[1] - sy / 2 - u[1]) < sy) {
            score -= k < numTer ? 4000 : 500;
          }
          if (v[0] - sx / 2 < cityLabels[k].x1 &&
            v[0] + sx / 2 > cityLabels[k].x0 &&
            v[1] - sy < cityLabels[k].y1 &&
            v[1] > cityLabels[k].y0) {
            score -= 5000;
          }
        }
        for (let k = 0; k < regionLabels.length; k++) {
          let label = regionLabels[k];
          if (v[0] - sx / 2 < label.x + label.width / 2 &&
            v[0] + sx / 2 > label.x - label.width / 2 &&
            v[1] - sy < label.y &&
            v[1] > label.y - label.size) {
            score -= 20000;
          }
        }
        if (this.landscape[j] <= 0) {
          score -= 500;
        }
        if (v[0] + sx / 2 > 0.5 * this.landscape.mesh.extent.width) {
          score -= 50000;
        }
        if (v[0] - sx / 2 < -0.5 * this.landscape.mesh.extent.width) {
          score -= 50000;
        }
        if (v[1] > 0.5 * this.landscape.mesh.extent.height) {
          score -= 50000;
        }
        if (v[1] - sy < -0.5 * this.landscape.mesh.extent.height) {
          score -= 50000;
        }
        if (score > bestScore) {
          bestScore = score;
          best = j;
        }
      }
      regionLabels.push({
        text: text,
        x: this.landscape.mesh.vxs[best][0],
        y: this.landscape.mesh.vxs[best][1],
        size: sy,
        width: sx
      });
    }

    var regionTexts = this.svg.selectAll('text.region').data(regionLabels);
    regionTexts.enter().append('text').classed('region', true);
    regionTexts.exit().remove();

    this.svg.selectAll('text.region')
      .attr('x', function (d) {
        return 1000 * d.x;
      })
      .attr('y', function (d) {
        return 1000 * d.y;
      })
      .style('font-size', function (d) {
        return 1000 * d.size;
      })
      .text(function (d) {
        return d.text;
      })
      .raise();

    return this;
  }

  /**
   *
   * @param {number} limit
   * @returns {Map}
   */
  generateRivers(limit) {
    var dh = Mesh.downhill(this.landscape),
      flux = Mesh.getFlux(this.landscape),
      links = [],
      above = 0;

    for (let i = 0; i < this.landscape.length; i++) {
      if (this.landscape[i] > 0) {
        above++;
      }
    }

    limit *= above / this.landscape.length;
    for (let i = 0; i < dh.length; i++) {
      if (Mesh.isNearEdge(this.landscape.mesh, i)) {
        continue;
      }
      if (flux[i] > limit && this.landscape[i] > 0 && dh[i] >= 0) {
        let up = this.landscape.mesh.vxs[i],
          down = this.landscape.mesh.vxs[dh[i]];
        if (this.landscape[dh[i]] > 0) {
          links.push([up, down]);
        } else {
          links.push([up, [(up[0] + down[0]) / 2, (up[1] + down[1]) / 2]]);
        }
      }
    }

    this.rivers = Mesh.mergeSegments(links).map(Mesh.relaxPath);

    return this;
  }

  /**
   *
   * @returns {Map}
   */
  generateTerritories() {
    var n = this.settings.numTerritories;
    if (n > this.cities.length) {
      n = this.cities.length;
    }
    let flux = Mesh.getFlux(this.landscape),
      queue = new PriorityQueue({
        comparator: function (a, b) {
          return a.score - b.score;
        }
      });

    var weight = (u, v) => {
      var horiz = Mesh.distance(this.landscape.mesh, u, v),
        vert = this.landscape[v] - this.landscape[u];
      if (vert > 0) {
        vert /= 10;
      }
      let diff = 1 + 0.25 * Math.pow(vert / horiz, 2);
      diff += 100 * Math.sqrt(flux[u]);
      if (this.landscape[u] <= 0) {
        diff = 100;
      }
      if ((this.landscape[u] > 0) != (this.landscape[v] > 0)) {
        return 1000;
      }

      return horiz * diff;
    };

    for (let i = 0; i < n; i++) {
      this.territories[this.cities[i]] = this.cities[i];
      let nbs = Mesh.neighbors(this.landscape.mesh, this.cities[i]);
      for (let j = 0; j < nbs.length; j++) {
        queue.queue({
          score: weight(this.cities[i], nbs[j]),
          city: this.cities[i],
          vx: nbs[j]
        });
      }
    }

    while (queue.length) {
      let u = queue.dequeue();
      if (this.territories[u.vx] != undefined) {
        continue;
      }
      this.territories[u.vx] = u.city;
      var nbs = Mesh.neighbors(this.landscape.mesh, u.vx);
      for (let i = 0; i < nbs.length; i++) {
        let v = nbs[i],
          newDist = weight(u.vx, v);

        if (this.territories[v] != undefined) {
          continue;
        }
        queue.queue({
          score: u.score + newDist,
          city: u.city,
          vx: v
        });
      }
    }
    this.territories.mesh = this.landscape.mesh;

    return this;
  }

  /**
   *
   * @param {Array} path
   * @return {string}
   */
  makeD3Path(path) {
    var p = d3.path();
    p.moveTo(1000 * path[0][0], 1000 * path[0][1]);
    for (let i = 1; i < path.length; i++) {
      p.lineTo(1000 * path[i][0], 1000 * path[i][1]);
    }

    return p.toString();
  }

  /**
   *
   * @param {object} terr
   * @param {object} city
   * @param {boolean} landOnly
   * @returns {*[]}
   */
  getTerritoryCenter(terr, city, landOnly) {
    var x = 0, y = 0, n = 0;
    for (let i = 0; i < terr.length; i++) {
      if (terr[i] != city) {
        continue;
      }
      if (landOnly && this.landscape[i] <= 0) {
        continue;
      }
      x += terr.mesh.vxs[i][0];
      y += terr.mesh.vxs[i][1];
      n++;
    }

    return [x / n, y / n];
  }

}
