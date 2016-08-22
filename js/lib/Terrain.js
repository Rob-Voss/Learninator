"use strict";

function runIf(lo, hi) {
  return lo + Math.random() * (hi - lo);
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

function randomVector(scale) {
  return [scale * rNorm(), scale * rNorm()];
}

var defaultExtent = {
  width: 1,
  height: 1
};

function generatePoints(n, extent) {
  extent = extent || defaultExtent;
  var pts = [];
  for (let i = 0; i < n; i++) {
    pts.push([(Math.random() - 0.5) * extent.width, (Math.random() - 0.5) * extent.height]);
  }

  return pts;
}

function centroid(pts) {
  var x = 0, y = 0;
  for (let i = 0; i < pts.length; i++) {
    x += pts[i][0];
    y += pts[i][1];
  }

  return [x / pts.length, y / pts.length];
}

function improvePoints(pts, n, extent) {
  n = n || 1;
  extent = extent || defaultExtent;
  for (var i = 0; i < n; i++) {
    pts = voronoi(pts, extent).polygons(pts).map(centroid);
  }
  return pts;
}

function generateGoodPoints(n, extent) {
  extent = extent || defaultExtent;
  var pts = generatePoints(n, extent);
  pts = pts.sort(function (a, b) {
    return a[0] - b[0];
  });

  return improvePoints(pts, 1, extent);
}

function voronoi(pts, extent) {
  extent = extent || defaultExtent;
  var w = extent.width / 2,
    h = extent.height / 2;

  return d3.voronoi().extent([[-w, -h], [w, h]])(pts);
}

function makeMesh(pts, extent) {
  extent = extent || defaultExtent;
  var vor = voronoi(pts, extent),
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

function generateGoodMesh(n, extent) {
  extent = extent || defaultExtent;
  var pts = generateGoodPoints(n, extent);

  return makeMesh(pts, extent);
}

function isEdge(mesh, i) {
  return (mesh.adj[i].length < 3);
}

function isNearEdge(mesh, i) {
  var x = mesh.vxs[i][0],
    y = mesh.vxs[i][1],
    w = mesh.extent.width,
    h = mesh.extent.height;

  return x < -0.45 * w || x > 0.45 * w || y < -0.45 * h || y > 0.45 * h;
}

function neighbours(mesh, i) {
  var onbs = mesh.adj[i],
    nbs = [];
  for (let i = 0; i < onbs.length; i++) {
    nbs.push(onbs[i]);
  }

  return nbs;
}

function distance(mesh, i, j) {
  var p = mesh.vxs[i],
    q = mesh.vxs[j];

  return Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]));
}

function quantile(h, q) {
  var sortedh = [];
  for (let i = 0; i < h.length; i++) {
    sortedh[i] = h[i];
  }
  sortedh.sort(d3.ascending);

  return d3.quantile(sortedh, q);
}

function zero(mesh) {
  var z = [];
  for (let i = 0; i < mesh.vxs.length; i++) {
    z[i] = 0;
  }
  z.mesh = mesh;

  return z;
}

function slope(mesh, direction) {
  return mesh.map(function (x) {
    return x[0] * direction[0] + x[1] * direction[1];
  });
}

function cone(mesh, slope) {
  return mesh.map(function (x) {
    return Math.pow(x[0] * x[0] + x[1] * x[1], 0.5) * slope;
  });
}

function map(h, f) {
  var newh = h.map(f);
  newh.mesh = h.mesh;

  return newh;
}

function normalize(h) {
  var lo = d3.min(h),
    hi = d3.max(h);

  return map(h, function (x) {
    return (x - lo) / (hi - lo);
  });
}

function peaky(h) {
  return map(normalize(h), Math.sqrt);
}

function add() {
  var n = arguments[0].length,
    newVals = zero(arguments[0].mesh);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < arguments.length; j++) {
      newVals[i] += arguments[j][i];
    }
  }

  return newVals;
}

function mountains(mesh, n, r) {
  r = r || 0.05;
  var mounts = [];
  for (let i = 0; i < n; i++) {
    mounts.push([mesh.extent.width * (Math.random() - 0.5), mesh.extent.height * (Math.random() - 0.5)]);
  }

  var newvals = zero(mesh);
  for (let i = 0; i < mesh.vxs.length; i++) {
    var p = mesh.vxs[i];
    for (let j = 0; j < n; j++) {
      var m = mounts[j];
      newvals[i] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2);
    }
  }

  return newvals;
}

function relax(h) {
  var newh = zero(h.mesh);
  for (let i = 0; i < h.length; i++) {
    var nbs = neighbours(h.mesh, i);
    if (nbs.length < 3) {
      newh[i] = 0;
      continue;
    }
    newh[i] = d3.mean(nbs.map(function (j) {
      return h[j];
    }));
  }

  return newh;
}

function downhill(h) {
  if (h.downhill) {
    return h.downhill;
  }

  function downFrom(i) {
    if (isEdge(h.mesh, i)) {
      return -2;
    }
    var best = -1,
      besth = h[i],
      nbs = neighbours(h.mesh, i);
    for (let j = 0; j < nbs.length; j++) {
      if (h[nbs[j]] < besth) {
        besth = h[nbs[j]];
        best = nbs[j];
      }
    }

    return best;
  }

  var downs = [];
  for (let i = 0; i < h.length; i++) {
    downs[i] = downFrom(i);
  }
  h.downhill = downs;

  return downs;
}

function findSinks(h) {
  var dh = downhill(h),
    sinks = [];
  for (let i = 0; i < dh.length; i++) {
    var node = i;
    while (true) {
      if (isEdge(h.mesh, node)) {
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

function fillSinks(h, epsilon) {
  epsilon = epsilon || 1e-5;
  var infinity = 999999,
    newh = zero(h.mesh);
  for (let i = 0; i < h.length; i++) {
    if (isNearEdge(h.mesh, i)) {
      newh[i] = h[i];
    } else {
      newh[i] = infinity;
    }
  }

  while (true) {
    var changed = false;
    for (let i = 0; i < h.length; i++) {
      if (newh[i] == h[i]) {
        continue;
      }
      var nbs = neighbours(h.mesh, i);
      for (let j = 0; j < nbs.length; j++) {
        if (h[i] >= newh[nbs[j]] + epsilon) {
          newh[i] = h[i];
          changed = true;
          break;
        }
        var oh = newh[nbs[j]] + epsilon;
        if ((newh[i] > oh) && (oh > h[i])) {
          newh[i] = oh;
          changed = true;
        }
      }
    }
    if (!changed) {
      return newh;
    }
  }
}

function getFlux(h) {
  var dh = downhill(h),
    idxs = [],
    flux = zero(h.mesh);

  for (let i = 0; i < h.length; i++) {
    idxs[i] = i;
    flux[i] = 1 / h.length;
  }

  idxs.sort(function (a, b) {
    return h[b] - h[a];
  });

  for (let i = 0; i < h.length; i++) {
    var j = idxs[i];
    if (dh[j] >= 0) {
      flux[dh[j]] += flux[j];
    }
  }

  return flux;
}

function getSlope(h) {
  var dh = downhill(h),
    slope = zero(h.mesh);
  for (let i = 0; i < h.length; i++) {
    var s = triSlope(h, i);
    slope[i] = Math.sqrt(s[0] * s[0] + s[1] * s[1]);
    continue;
    if (dh[i] < 0) {
      slope[i] = 0;
    } else {
      slope[i] = (h[i] - h[dh[i]]) / distance(h.mesh, i, dh[i]);
    }
  }
  return slope;
}

function erosionRate(h) {
  var flux = getFlux(h),
    slope = getSlope(h),
    newh = zero(h.mesh);
  for (let i = 0; i < h.length; i++) {
    var river = Math.sqrt(flux[i]) * slope[i],
      creep = slope[i] * slope[i],
      total = 1000 * river + creep;
    total = total > 200 ? 200 : total;
    newh[i] = total;
  }

  return newh;
}

function erode(h, amount) {
  var er = erosionRate(h),
    newh = zero(h.mesh),
    maxr = d3.max(er);
  for (let i = 0; i < h.length; i++) {
    newh[i] = h[i] - amount * (er[i] / maxr);
  }

  return newh;
}

function doErosion(h, amount, n) {
  n = n || 1;
  h = fillSinks(h);
  for (let i = 0; i < n; i++) {
    h = erode(h, amount);
    h = fillSinks(h);
  }

  return h;
}

function setSeaLevel(h, q) {
  var newh = zero(h.mesh),
    delta = quantile(h, q);
  for (let i = 0; i < h.length; i++) {
    newh[i] = h[i] - delta;
  }

  return newh;
}

function cleanCoast(h, iters) {
  for (let iter = 0; iter < iters; iter++) {
    var changed = 0,
      newh = zero(h.mesh);
    for (let i = 0; i < h.length; i++) {
      newh[i] = h[i];
      var nbs = neighbours(h.mesh, i);
      if (h[i] <= 0 || nbs.length != 3) {
        continue;
      }
      var count = 0,
        best = -999999;
      for (let j = 0; j < nbs.length; j++) {
        if (h[nbs[j]] > 0) {
          count++;
        } else if (h[nbs[j]] > best) {
          best = h[nbs[j]];
        }
      }
      if (count > 1) {
        continue;
      }
      newh[i] = best / 2;
      changed++;
    }
    h = newh;
    newh = zero(h.mesh);
    for (var i = 0; i < h.length; i++) {
      newh[i] = h[i];
      var nbs = neighbours(h.mesh, i);
      if (h[i] > 0 || nbs.length != 3) {
        continue;
      }
      var count = 0,
        best = 999999;
      for (let j = 0; j < nbs.length; j++) {
        if (h[nbs[j]] <= 0) {
          count++;
        } else if (h[nbs[j]] < best) {
          best = h[nbs[j]];
        }
      }
      if (count > 1) {
        continue;
      }
      newh[i] = best / 2;
      changed++;
    }
    h = newh;
  }

  return h;
}

function triSlope(h, i) {
  var nbs = neighbours(h.mesh, i);
  if (nbs.length != 3) {
    return [0, 0];
  }
  var p0 = h.mesh.vxs[nbs[0]],
    p1 = h.mesh.vxs[nbs[1]],
    p2 = h.mesh.vxs[nbs[2]],

    x1 = p1[0] - p0[0],
    x2 = p2[0] - p0[0],
    y1 = p1[1] - p0[1],
    y2 = p2[1] - p0[1],

    det = x1 * y2 - x2 * y1,
    h1 = h[nbs[1]] - h[nbs[0]],
    h2 = h[nbs[2]] - h[nbs[0]];

  return [
    (y2 * h1 - y1 * h2) / det,
    (-x2 * h1 + x1 * h2) / det
  ];
}

function cityScore(h, cities) {
  var score = map(getFlux(h), Math.sqrt);
  for (let i = 0; i < h.length; i++) {
    if (h[i] <= 0 || isNearEdge(h.mesh, i)) {
      score[i] = -999999;
      continue;
    }
    score[i] += 0.01 / (1e-9 + Math.abs(h.mesh.vxs[i][0]) - h.mesh.extent.width / 2);
    score[i] += 0.01 / (1e-9 + Math.abs(h.mesh.vxs[i][1]) - h.mesh.extent.height / 2);
    for (let j = 0; j < cities.length; j++) {
      score[i] -= 0.02 / (distance(h.mesh, cities[j], i) + 1e-9);
    }
  }

  return score;
}

function placeCity(render) {
  render.cities = render.cities || [];
  var score = cityScore(render.h, render.cities),
    newcity = d3.scan(score, d3.descending);
  render.cities.push(newcity);
}

function placeCities(render) {
  var params = render.params,
    h = render.h,
    n = params.ncities;
  for (let i = 0; i < n; i++) {
    placeCity(render);
  }
}

function contour(h, level) {
  level = level || 0;
  var edges = [];
  for (let i = 0; i < h.mesh.edges.length; i++) {
    var e = h.mesh.edges[i];
    if (e[3] == undefined) {
      continue;
    }
    if (isNearEdge(h.mesh, e[0]) || isNearEdge(h.mesh, e[1])) {
      continue;
    }
    if ((h[e[0]] > level && h[e[1]] <= level) ||
      (h[e[1]] > level && h[e[0]] <= level)) {
      edges.push([e[2], e[3]]);
    }
  }

  return mergeSegments(edges);
}

function getRivers(h, limit) {
  var dh = downhill(h),
    flux = getFlux(h),
    links = [],
    above = 0;
  for (let i = 0; i < h.length; i++) {
    if (h[i] > 0) {
      above++;
    }
  }
  limit *= above / h.length;
  for (let i = 0; i < dh.length; i++) {
    if (isNearEdge(h.mesh, i)) {
      continue;
    }
    if (flux[i] > limit && h[i] > 0 && dh[i] >= 0) {
      var up = h.mesh.vxs[i],
        down = h.mesh.vxs[dh[i]];
      if (h[dh[i]] > 0) {
        links.push([up, down]);
      } else {
        links.push([up, [(up[0] + down[0]) / 2, (up[1] + down[1]) / 2]]);
      }
    }
  }

  return mergeSegments(links).map(relaxPath);
}

function getTerritories(render) {
  var h = render.h,
    cities = render.cities,
    n = render.params.nterrs;
  if (n > render.cities.length) {
    n = render.cities.length;
  }
  var flux = getFlux(h),
    terr = [],
    queue = new PriorityQueue({
      comparator: function (a, b) {
        return a.score - b.score
      }
    });

  function weight(u, v) {
    var horiz = distance(h.mesh, u, v),
      vert = h[v] - h[u];
    if (vert > 0) {
      vert /= 10;
    }
    var diff = 1 + 0.25 * Math.pow(vert / horiz, 2);
    diff += 100 * Math.sqrt(flux[u]);
    if (h[u] <= 0) {
      diff = 100;
    }
    if ((h[u] > 0) != (h[v] > 0)) {
      return 1000;
    }

    return horiz * diff;
  }

  for (let i = 0; i < n; i++) {
    terr[cities[i]] = cities[i];
    var nbs = neighbours(h.mesh, cities[i]);
    for (let j = 0; j < nbs.length; j++) {
      queue.queue({
        score: weight(cities[i], nbs[j]),
        city: cities[i],
        vx: nbs[j]
      });
    }
  }
  while (queue.length) {
    var u = queue.dequeue();
    if (terr[u.vx] != undefined) {
      continue;
    }
    terr[u.vx] = u.city;
    var nbs = neighbours(h.mesh, u.vx);
    for (let i = 0; i < nbs.length; i++) {
      var v = nbs[i];
      if (terr[v] != undefined) {
        continue;
      }
      var newdist = weight(u.vx, v);
      queue.queue({
        score: u.score + newdist,
        city: u.city,
        vx: v
      });
    }
  }
  terr.mesh = h.mesh;

  return terr;
}

function getBorders(render) {
  var terr = render.terr,
    h = render.h,
    edges = [];
  for (let i = 0; i < terr.mesh.edges.length; i++) {
    var e = terr.mesh.edges[i];
    if (e[3] == undefined) {
      continue;
    }
    if (isNearEdge(terr.mesh, e[0]) || isNearEdge(terr.mesh, e[1])) {
      continue;
    }
    if (h[e[0]] < 0 || h[e[1]] < 0) {
      continue;
    }
    if (terr[e[0]] != terr[e[1]]) {
      edges.push([e[2], e[3]]);
    }
  }

  return mergeSegments(edges).map(relaxPath);
}

function mergeSegments(segs) {
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
    if (path == null) {
      for (let i = 0; i < segs.length; i++) {
        if (done[i]) continue;
        done[i] = true;
        path = [segs[i][0], segs[i][1]];
        break;
      }
      if (path == null) {
        break;
      }
    }
    var changed = false;
    for (let i = 0; i < segs.length; i++) {
      if (done[i]) {
        continue;
      }
      if (adj[path[0]].length == 2 && segs[i][0] == path[0]) {
        path.unshift(segs[i][1]);
      } else if (adj[path[0]].length == 2 && segs[i][1] == path[0]) {
        path.unshift(segs[i][0]);
      } else if (adj[path[path.length - 1]].length == 2 && segs[i][0] == path[path.length - 1]) {
        path.push(segs[i][1]);
      } else if (adj[path[path.length - 1]].length == 2 && segs[i][1] == path[path.length - 1]) {
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

function relaxPath(path) {
  var newpath = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    var newpt = [
      0.25 * path[i - 1][0] + 0.5 * path[i][0] + 0.25 * path[i + 1][0],
      0.25 * path[i - 1][1] + 0.5 * path[i][1] + 0.25 * path[i + 1][1]
    ];
    newpath.push(newpt);
  }
  newpath.push(path[path.length - 1]);

  return newpath;
}

function visualizePoints(svg, pts) {
  var circle = svg.selectAll('circle').data(pts);
  circle.enter()
    .append('circle');
  circle.exit().remove();
  d3.selectAll('circle')
    .attr('cx', function (d) {
      return 1000 * d[0];
    })
    .attr('cy', function (d) {
      return 1000 * d[1];
    })
    .attr('r', 100 / Math.sqrt(pts.length));
}

function makeD3Path(path) {
  var p = d3.path();
  p.moveTo(1000 * path[0][0], 1000 * path[0][1]);
  for (let i = 1; i < path.length; i++) {
    p.lineTo(1000 * path[i][0], 1000 * path[i][1]);
  }

  return p.toString();
}

function visualizeVoronoi(svg, field, lo, hi) {
  if (hi == undefined) {
    hi = d3.max(field) + 1e-9;
  }
  if (lo == undefined) {
    lo = d3.min(field) - 1e-9;
  }
  var mappedvals = field.map(function (x) {
    return x > hi ? 1 : x < lo ? 0 : (x - lo) / (hi - lo);
  });
  var tris = svg.selectAll('path.field').data(field.mesh.tris);
  tris.enter()
    .append('path')
    .classed('field', true);
  tris.exit()
    .remove();
  svg.selectAll('path.field')
    .attr('d', makeD3Path)
    .style('fill', function (d, i) {
      return d3.interpolateViridis(mappedvals[i]);
    });
}

function visualizeDownhill(h) {
  var links = getRivers(h, 0.01);
  drawPaths('river', links);
}

function drawPaths(svg, cls, paths) {
  var paths = svg.selectAll('path.' + cls).data(paths);
  paths.enter()
    .append('path')
    .classed(cls, true);
  paths.exit()
    .remove();
  svg.selectAll('path.' + cls)
    .attr('d', makeD3Path);
}

function visualizeSlopes(svg, render) {
  var h = render.h,
    strokes = [],
    r = 0.25 / Math.sqrt(h.length);
  for (var i = 0; i < h.length; i++) {
    if (h[i] <= 0 || isNearEdge(h.mesh, i)) {
      continue;
    }
    var nbs = neighbours(h.mesh, i);
    nbs.push(i);
    var s = 0,
      s2 = 0;
    for (let j = 0; j < nbs.length; j++) {
      var slopes = triSlope(h, nbs[j]);
      s += slopes[0] / 10;
      s2 += slopes[1];
    }
    s /= nbs.length;
    s2 /= nbs.length;
    if (Math.abs(s) < runIf(0.1, 0.4)) {
      continue;
    }
    var l = r * runIf(1, 2) * (1 - 0.2 * Math.pow(Math.atan(s), 2)) * Math.exp(s2 / 100),
      x = h.mesh.vxs[i][0],
      y = h.mesh.vxs[i][1];
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
  var lines = svg.selectAll('line.slope').data(strokes);
  lines.enter()
    .append('line')
    .classed('slope', true);
  lines.exit()
    .remove();
  svg.selectAll('line.slope')
    .attr('x1', function (d) {
      return 1000 * d[0][0]
    })
    .attr('y1', function (d) {
      return 1000 * d[0][1]
    })
    .attr('x2', function (d) {
      return 1000 * d[1][0]
    })
    .attr('y2', function (d) {
      return 1000 * d[1][1]
    })
}

function visualizeContour(h, level) {
  level = level || 0;
  var links = contour(h, level);
  drawPaths('coast', links);
}

function visualizeBorders(h, cities, n) {
  var links = getBorders(h, getTerritories(h, cities, n));
  drawPaths('border', links);
}

function visualizeCities(svg, render) {
  var cities = render.cities,
    h = render.h,
    n = render.params.nterrs,

    circs = svg.selectAll('circle.city').data(cities);
  circs.enter()
    .append('circle')
    .classed('city', true);
  circs.exit()
    .remove();
  svg.selectAll('circle.city')
    .attr('cx', function (d) {
      return 1000 * h.mesh.vxs[d][0];
    })
    .attr('cy', function (d) {
      return 1000 * h.mesh.vxs[d][1];
    })
    .attr('r', function (d, i) {
      return i >= n ? 4 : 10;
    })
    .style('fill', 'white')
    .style('stroke-width', 5)
    .style('stroke-linecap', 'round')
    .style('stroke', 'black')
    .raise();
}

function dropEdge(h, p) {
  p = p || 4;
  var newh = zero(h.mesh);
  for (let i = 0; i < h.length; i++) {
    var v = h.mesh.vxs[i],
      x = 2.4 * v[0] / h.mesh.extent.width,
      y = 2.4 * v[1] / h.mesh.extent.height;
    newh[i] = h[i] - Math.exp(10 * (Math.pow(Math.pow(x, p) + Math.pow(y, p), 1 / p) - 1));
  }

  return newh;
}

function generateCoast(params) {
  var mesh = generateGoodMesh(params.npts, params.extent),
    h = add(
      slope(mesh, randomVector(4)),
      cone(mesh, runIf(-1, -1)),
      mountains(mesh, 50)
    );
  for (let i = 0; i < 10; i++) {
    h = relax(h);
  }
  h = peaky(h);
  h = doErosion(h, runIf(0, 0.1), 5);
  h = setSeaLevel(h, runIf(0.2, 0.6));
  h = fillSinks(h);
  h = cleanCoast(h, 3);

  return h;
}

function terrCenter(h, terr, city, landOnly) {
  var x = 0, y = 0, n = 0;
  for (let i = 0; i < terr.length; i++) {
    if (terr[i] != city) {
      continue;
    }
    if (landOnly && h[i] <= 0) {
      continue;
    }
    x += terr.mesh.vxs[i][0];
    y += terr.mesh.vxs[i][1];
    n++;
  }

  return [x / n, y / n];
}

function drawLabels(svg, render) {
  var params = render.params,
    h = render.h,
    terr = render.terr,
    cities = render.cities,
    nterrs = render.params.nterrs,
    avoids = [render.rivers, render.coasts, render.borders],
    lang = makeRandomLanguage(),
    citylabels = [];

  function penalty(label) {
    var pen = 0;
    if (label.x0 < -0.45 * h.mesh.extent.width) pen += 100;
    if (label.x1 > 0.45 * h.mesh.extent.width) pen += 100;
    if (label.y0 < -0.45 * h.mesh.extent.height) pen += 100;
    if (label.y1 > 0.45 * h.mesh.extent.height) pen += 100;
    for (var i = 0; i < citylabels.length; i++) {
      var olabel = citylabels[i];
      if (label.x0 < olabel.x1 && label.x1 > olabel.x0 &&
        label.y0 < olabel.y1 && label.y1 > olabel.y0) {
        pen += 100;
      }
    }

    for (var i = 0; i < cities.length; i++) {
      var c = h.mesh.vxs[cities[i]];
      if (label.x0 < c[0] && label.x1 > c[0] && label.y0 < c[1] && label.y1 > c[1]) {
        pen += 100;
      }
    }
    for (var i = 0; i < avoids.length; i++) {
      var avoid = avoids[i];
      for (var j = 0; j < avoid.length; j++) {
        var avpath = avoid[j];
        for (var k = 0; k < avpath.length; k++) {
          var pt = avpath[k];
          if (pt[0] > label.x0 && pt[0] < label.x1 && pt[1] > label.y0 && pt[1] < label.y1) {
            pen++;
          }
        }
      }
    }
    return pen;
  }

  for (let i = 0; i < cities.length; i++) {
    var x = h.mesh.vxs[cities[i]][0],
      y = h.mesh.vxs[cities[i]][1],
      text = makeName(lang, 'city'),
      size = i < nterrs ? params.fontsizes.city : params.fontsizes.town,
      sx = 0.65 * size / 1000 * text.length,
      sy = size / 1000,
      posslabels = [
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
      label = posslabels[d3.scan(posslabels, function (a, b) {
        return penalty(a) - penalty(b)
      })];
    label.text = text;
    label.size = size;
    citylabels.push(label);
  }
  var texts = svg.selectAll('text.city').data(citylabels);
  texts.enter()
    .append('text')
    .classed('city', true);
  texts.exit()
    .remove();
  svg.selectAll('text.city')
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

  var reglabels = [];
  for (let i = 0; i < nterrs; i++) {
    var city = cities[i],
      text = makeName(lang, 'region'),
      sy = params.fontsizes.region / 1000,
      sx = 0.6 * text.length * sy,
      lc = terrCenter(h, terr, city, true),
      oc = terrCenter(h, terr, city, false),
      best = 0,
      bestscore = -999999;
    for (let j = 0; j < h.length; j++) {
      var score = 0,
        v = h.mesh.vxs[j];
      score -= 3000 * Math.sqrt((v[0] - lc[0]) * (v[0] - lc[0]) + (v[1] - lc[1]) * (v[1] - lc[1]));
      score -= 1000 * Math.sqrt((v[0] - oc[0]) * (v[0] - oc[0]) + (v[1] - oc[1]) * (v[1] - oc[1]));
      if (terr[j] != city) {
        score -= 3000;
      }
      for (let k = 0; k < cities.length; k++) {
        var u = h.mesh.vxs[cities[k]];
        if (Math.abs(v[0] - u[0]) < sx &&
          Math.abs(v[1] - sy / 2 - u[1]) < sy) {
          score -= k < nterrs ? 4000 : 500;
        }
        if (v[0] - sx / 2 < citylabels[k].x1 &&
          v[0] + sx / 2 > citylabels[k].x0 &&
          v[1] - sy < citylabels[k].y1 &&
          v[1] > citylabels[k].y0) {
          score -= 5000;
        }
      }
      for (let k = 0; k < reglabels.length; k++) {
        var label = reglabels[k];
        if (v[0] - sx / 2 < label.x + label.width / 2 &&
          v[0] + sx / 2 > label.x - label.width / 2 &&
          v[1] - sy < label.y &&
          v[1] > label.y - label.size) {
          score -= 20000;
        }
      }
      if (h[j] <= 0) {
        score -= 500;
      }
      if (v[0] + sx / 2 > 0.5 * h.mesh.extent.width) {
        score -= 50000;
      }
      if (v[0] - sx / 2 < -0.5 * h.mesh.extent.width) {
        score -= 50000;
      }
      if (v[1] > 0.5 * h.mesh.extent.height) {
        score -= 50000;
      }
      if (v[1] - sy < -0.5 * h.mesh.extent.height) {
        score -= 50000;
      }
      if (score > bestscore) {
        bestscore = score;
        best = j;
      }
    }
    reglabels.push({
      text: text,
      x: h.mesh.vxs[best][0],
      y: h.mesh.vxs[best][1],
      size: sy,
      width: sx
    });
  }
  texts = svg.selectAll('text.region').data(reglabels);
  texts.enter()
    .append('text')
    .classed('region', true);
  texts.exit()
    .remove();
  svg.selectAll('text.region')
    .attr('x', function (d) {
      return 1000 * d.x;
    })
    .attr('y', function (d) {
      return 1000 * d.y;
    })
    .style('font-size', function (d) {
      return 1000 * d.size;
    })
    .style('text-anchor', 'middle')
    .text(function (d) {
      return d.text;
    })
    .raise();
}

function drawMap(svg, render) {
  render.rivers = getRivers(render.h, 0.01);
  render.coasts = contour(render.h, 0);
  render.terr = getTerritories(render);
  render.borders = getBorders(render);
  drawPaths(svg, 'river', render.rivers);
  drawPaths(svg, 'coast', render.coasts);
  drawPaths(svg, 'border', render.borders);
  visualizeSlopes(svg, render);
  visualizeCities(svg, render);
  drawLabels(svg, render);
}

function doMap(svg, params) {
  var render = {
      params: params
    },
    width = svg.attr('width');
  svg.attr('height', width * params.extent.height / params.extent.width);
  svg.attr('viewBox', -1000 * params.extent.width / 2 + ' ' +
    -1000 * params.extent.height / 2 + ' ' +
    1000 * params.extent.width + ' ' +
    1000 * params.extent.height);
  svg.selectAll().remove();
  render.h = params.generator(params);
  placeCities(render);
  drawMap(svg, render);
}

var defaultParams = {
  extent: defaultExtent,
  generator: generateCoast,
  npts: 16384,
  ncities: 15,
  nterrs: 5,
  fontsizes: {
    region: 40,
    city: 25,
    town: 20
  }
};

var defaultExtent = {
  width: 1,
  height: 1
};

class Mesh {

  constructor(num, extent) {
    this.num = num;
    this.extent = extent || defaultExtent;
  }

  generatePoints() {
    var pts = [];
    for (let i = 0; i < this.num; i++) {
      pts.push([
        (Math.random() - 0.5) * this.extent.width,
        (Math.random() - 0.5) * this.extent.height
      ]);
    }
    return pts;
  }

  centroid() {
    var x = 0, y = 0;
    for (let i = 0; i < this.pts.length; i++) {
      x += this.pts[i][0];
      y += this.pts[i][1];
    }

    return [x / this.pts.length, y / this.pts.length];
  }

  improvePoints(n) {
    for (let i = 0; i < n; i++) {
      this.pts = voronoi().polygons().map(this.centroid);
    }

    return this.pts;
  }

  generateGoodPoints() {
    this.pts = this.generatePoints();
    this.pts = this.pts.sort(function (a, b) {
      return a[0] - b[0];
    });

    return this.improvePoints(1);
  }

  voronoi() {
    var w = this.extent.width / 2,
      h = this.extent.height / 2;
    return d3.voronoi().extent([[-w, -h], [w, h]])(this.pts);
  }

  makeMesh() {
    var vor = this.voronoi(),
      vxs = [],
      vxids = {},
      adj = [],
      edges = [],
      tris = [];
    for (let i = 0; i < vor.edges.length; i++) {
      var e = vor.edges[i];
      if (e === undefined) {
        continue;
      }
      var e0 = vxids[e[0]],
        e1 = vxids[e[1]];
      if (e0 === undefined) {
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

    this.mesh = {
      pts: pts,
      vor: vor,
      vxs: vxs,
      adj: adj,
      tris: tris,
      edges: edges,
      extent: this.extent
    };

    this.mesh.map = function (f) {
      var mapped = vxs.map(f);
      mapped.mesh = this.mesh;

      return mapped;
    };

    return this.mesh;
  }

  generateGoodMesh() {
    this.pts = this.generateGoodPoints();

    return this.makeMesh();
  }

  isEdge(i) {
    return (this.mesh.adj[i].length < 3);
  }

  isNearEdge(i) {
    var x = this.mesh.vxs[i][0],
      y = this.mesh.vxs[i][1],
      w = this.mesh.extent.width,
      h = this.mesh.extent.height;

    return x < -0.45 * w || x > 0.45 * w || y < -0.45 * h || y > 0.45 * h;
  }

  neighbours(i) {
    var onbs = this.mesh.adj[i],
      nbs = [];
    for (let i = 0; i < onbs.length; i++) {
      nbs.push(onbs[i]);
    }

    return nbs;
  }

  distance(i, j) {
    var p = this.mesh.vxs[i],
      q = this.mesh.vxs[j];

    return Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]));
  }

  zero() {
    var z = [];
    for (let i = 0; i < this.mesh.vxs.length; i++) {
      z[i] = 0;
    }
    z.mesh = this.mesh;

    return z;
  }

  slope(direction) {
    return this.mesh.map(function (x) {
      return x[0] * direction[0] + x[1] * direction[1];
    });
  }

  cone(slope) {
    return this.mesh.map(function (x) {
      return Math.pow(x[0] * x[0] + x[1] * x[1], 0.5) * slope;
    });
  }

  map(h, f) {
    var newh = h.map(f);
    newh.mesh = h.mesh;

    return newh;
  }

  normalize(h) {
    var lo = d3.min(h),
      hi = d3.max(h);
    return this.map(h, function (x) {
      return (x - lo) / (hi - lo)
    });
  }

  peaky(h) {
    return this.map(this.normalize(h), Math.sqrt);
  }

}

class Map {

  constructor(params, div) {
    this.div = div || d3.select("div#final");
    this.width = params.width || 600;
    this.height = params.height || 600;
    this.extent = params.extent || {width: 1, height: 1};
    this.generator = params.generator || generateCoast;
    this.numPts = params.npts || 16384;
    this.numCities = params.ncities || 15;
    this.numTerrains = params.nterrs || 5;
    this.fontSizes = params.fontsizes || {
        region: 40,
        city: 25,
        town: 20
      };

    this.params = params || {
        extent: this.extent,
        generator: this.generator,
        numPts: 16384,
        numCities: 15,
        numTerrains: 5,
        fontSizes: {
          region: 40,
          city: 25,
          town: 20
        }
      };

  }

  addSVG() {
    return this.div.insert("svg", ":first-child")
      .attr("height", this.height)
      .attr("width", this.width)
      .attr("viewBox", "-500 -500 1000 1000");
  }

  doMap(svg, params) {
    var render = {
      params: params
    };
    var width = svg.attr('width');
    svg.attr('height', width * params.extent.height / params.extent.width);
    svg.attr('viewBox', -1000 * params.extent.width / 2 + ' ' +
      -1000 * params.extent.height / 2 + ' ' +
      1000 * params.extent.width + ' ' +
      1000 * params.extent.height);
    svg.selectAll().remove();
    render.h = params.generator(params);
    placeCities(render);
    drawMap(svg, render);
  }

  generateCoast() {
    this.mesh = generateGoodMesh(this.numPts, this.extent);

    var h = add(
      this.mesh.slope(randomVector(4)),
      this.mesh.cone(runIf(-1, -1)),
      this.mesh.mountains(50)
    );
    for (var i = 0; i < 10; i++) {
      h = this.mesh.relax(h);
    }
    h = peaky(h);
    h = doErosion(h, runIf(0, 0.1), 5);
    h = setSeaLevel(h, runIf(0.2, 0.6));
    h = fillSinks(h);
    h = cleanCoast(h, 3);

    return h;
  }

  getRivers(h, limit) {
    var dh = downhill(h);
    var flux = getFlux(h);
    var links = [];
    var above = 0;
    for (var i = 0; i < h.length; i++) {
      if (h[i] > 0) above++;
    }
    limit *= above / h.length;
    for (var i = 0; i < dh.length; i++) {
      if (isNearEdge(h.mesh, i)) continue;
      if (flux[i] > limit && h[i] > 0 && dh[i] >= 0) {
        var up = h.mesh.vxs[i];
        var down = h.mesh.vxs[dh[i]];
        if (h[dh[i]] > 0) {
          links.push([up, down]);
        } else {
          links.push([up, [(up[0] + down[0]) / 2, (up[1] + down[1]) / 2]]);
        }
      }
    }
    return mergeSegments(links).map(relaxPath);
  }

  getTerritories(render) {
    var h = render.h;
    var cities = render.cities;
    var n = render.params.nterrs;
    if (n > render.cities.length) n = render.cities.length;
    var flux = getFlux(h);
    var terr = [];
    var queue = new PriorityQueue({
      comparator: function (a, b) {
        return a.score - b.score;
      }
    });

    function weight(u, v) {
      var horiz = distance(h.mesh, u, v);
      var vert = h[v] - h[u];
      if (vert > 0) vert /= 10;
      var diff = 1 + 0.25 * Math.pow(vert / horiz, 2);
      diff += 100 * Math.sqrt(flux[u]);
      if (h[u] <= 0) diff = 100;
      if ((h[u] > 0) != (h[v] > 0)) return 1000;
      return horiz * diff;
    }

    for (var i = 0; i < n; i++) {
      terr[cities[i]] = cities[i];
      var nbs = neighbours(h.mesh, cities[i]);
      for (var j = 0; j < nbs.length; j++) {
        queue.queue({
          score: weight(cities[i], nbs[j]),
          city: cities[i],
          vx: nbs[j]
        });
      }
    }
    while (queue.length) {
      var u = queue.dequeue();
      if (terr[u.vx] != undefined) continue;
      terr[u.vx] = u.city;
      var nbs = neighbours(h.mesh, u.vx);
      for (var i = 0; i < nbs.length; i++) {
        var v = nbs[i];
        if (terr[v] != undefined) continue;
        var newdist = weight(u.vx, v);
        queue.queue({
          score: u.score + newdist,
          city: u.city,
          vx: v
        });
      }
    }
    terr.mesh = h.mesh;
    return terr;
  }

  getBorders(render) {
    var terr = render.terr;
    var h = render.h;
    var edges = [];
    for (var i = 0; i < terr.mesh.edges.length; i++) {
      var e = terr.mesh.edges[i];
      if (e[3] == undefined) continue;
      if (isNearEdge(terr.mesh, e[0]) || isNearEdge(terr.mesh, e[1])) continue;
      if (h[e[0]] < 0 || h[e[1]] < 0) continue;
      if (terr[e[0]] != terr[e[1]]) {
        edges.push([e[2], e[3]]);
      }
    }
    return mergeSegments(edges).map(relaxPath);
  }

}


class Visualize {

  constructor(svg, render) {
    this.svg = svg;
    this.render = render;
  }

  drawLabels(svg, render) {
    var params = render.params;
    var h = render.h;
    var terr = render.terr;
    var cities = render.cities;
    var nterrs = render.params.nterrs;
    var avoids = [render.rivers, render.coasts, render.borders];
    var lang = makeRandomLanguage();
    var citylabels = [];

    function penalty(label) {
      var pen = 0;
      if (label.x0 < -0.45 * h.mesh.extent.width) pen += 100;
      if (label.x1 > 0.45 * h.mesh.extent.width) pen += 100;
      if (label.y0 < -0.45 * h.mesh.extent.height) pen += 100;
      if (label.y1 > 0.45 * h.mesh.extent.height) pen += 100;
      for (var i = 0; i < citylabels.length; i++) {
        var olabel = citylabels[i];
        if (label.x0 < olabel.x1 && label.x1 > olabel.x0 &&
          label.y0 < olabel.y1 && label.y1 > olabel.y0) {
          pen += 100;
        }
      }

      for (var i = 0; i < cities.length; i++) {
        var c = h.mesh.vxs[cities[i]];
        if (label.x0 < c[0] && label.x1 > c[0] && label.y0 < c[1] && label.y1 > c[1]) {
          pen += 100;
        }
      }
      for (var i = 0; i < avoids.length; i++) {
        var avoid = avoids[i];
        for (var j = 0; j < avoid.length; j++) {
          var avpath = avoid[j];
          for (var k = 0; k < avpath.length; k++) {
            var pt = avpath[k];
            if (pt[0] > label.x0 && pt[0] < label.x1 && pt[1] > label.y0 && pt[1] < label.y1) {
              pen++;
            }
          }
        }
      }
      return pen;
    }

    for (var i = 0; i < cities.length; i++) {
      var x = h.mesh.vxs[cities[i]][0];
      var y = h.mesh.vxs[cities[i]][1];
      var text = makeName(lang, 'city');
      var size = i < nterrs ? params.fontsizes.city : params.fontsizes.town;
      var sx = 0.65 * size / 1000 * text.length;
      var sy = size / 1000;
      var posslabels = [
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
      ];
      var label = posslabels[d3.scan(posslabels, function (a, b) {
        return penalty(a) - penalty(b)
      })];
      label.text = text;
      label.size = size;
      citylabels.push(label);
    }
    var texts = svg.selectAll('text.city').data(citylabels);
    texts.enter()
      .append('text')
      .classed('city', true);
    texts.exit()
      .remove();
    svg.selectAll('text.city')
      .attr('x', function (d) {
        return 1000 * d.x
      })
      .attr('y', function (d) {
        return 1000 * d.y
      })
      .style('font-size', function (d) {
        return d.size
      })
      .style('text-anchor', function (d) {
        return d.align
      })
      .text(function (d) {
        return d.text
      })
      .raise();

    var reglabels = [];
    for (var i = 0; i < nterrs; i++) {
      var city = cities[i];
      var text = makeName(lang, 'region');
      var sy = params.fontsizes.region / 1000;
      var sx = 0.6 * text.length * sy;
      var lc = terrCenter(h, terr, city, true);
      var oc = terrCenter(h, terr, city, false);
      var best = 0;
      var bestscore = -999999;
      for (var j = 0; j < h.length; j++) {
        var score = 0;
        var v = h.mesh.vxs[j];
        score -= 3000 * Math.sqrt((v[0] - lc[0]) * (v[0] - lc[0]) + (v[1] - lc[1]) * (v[1] - lc[1]));
        score -= 1000 * Math.sqrt((v[0] - oc[0]) * (v[0] - oc[0]) + (v[1] - oc[1]) * (v[1] - oc[1]));
        if (terr[j] != city) score -= 3000;
        for (var k = 0; k < cities.length; k++) {
          var u = h.mesh.vxs[cities[k]];
          if (Math.abs(v[0] - u[0]) < sx &&
            Math.abs(v[1] - sy / 2 - u[1]) < sy) {
            score -= k < nterrs ? 4000 : 500;
          }
          if (v[0] - sx / 2 < citylabels[k].x1 &&
            v[0] + sx / 2 > citylabels[k].x0 &&
            v[1] - sy < citylabels[k].y1 &&
            v[1] > citylabels[k].y0) {
            score -= 5000;
          }
        }
        for (var k = 0; k < reglabels.length; k++) {
          var label = reglabels[k];
          if (v[0] - sx / 2 < label.x + label.width / 2 &&
            v[0] + sx / 2 > label.x - label.width / 2 &&
            v[1] - sy < label.y &&
            v[1] > label.y - label.size) {
            score -= 20000;
          }
        }
        if (h[j] <= 0) score -= 500;
        if (v[0] + sx / 2 > 0.5 * h.mesh.extent.width) score -= 50000;
        if (v[0] - sx / 2 < -0.5 * h.mesh.extent.width) score -= 50000;
        if (v[1] > 0.5 * h.mesh.extent.height) score -= 50000;
        if (v[1] - sy < -0.5 * h.mesh.extent.height) score -= 50000;
        if (score > bestscore) {
          bestscore = score;
          best = j;
        }
      }
      reglabels.push({
        text: text,
        x: h.mesh.vxs[best][0],
        y: h.mesh.vxs[best][1],
        size: sy,
        width: sx
      });
    }
    texts = svg.selectAll('text.region').data(reglabels);
    texts.enter()
      .append('text')
      .classed('region', true);
    texts.exit()
      .remove();
    svg.selectAll('text.region')
      .attr('x', function (d) {
        return 1000 * d.x
      })
      .attr('y', function (d) {
        return 1000 * d.y
      })
      .style('font-size', function (d) {
        return 1000 * d.size
      })
      .style('text-anchor', 'middle')
      .text(function (d) {
        return d.text
      })
      .raise();

  }

  drawMap(svg, render) {
    render.rivers = this.map.getRivers(render.h, 0.01);
    render.coasts = contour(render.h, 0);
    render.terr = this.map.getTerritories(render);
    render.borders = this.map.getBorders(render);
    this.drawPaths(svg, 'river', render.rivers);
    this.drawPaths(svg, 'coast', render.coasts);
    this.drawPaths(svg, 'border', render.borders);
    this.drawSlopes(svg, render);
    this.drawCities(svg, render);
    this.drawLabels(svg, render);
  }

  drawPaths(svg, cls, paths) {
    var paths = svg.selectAll('path.' + cls).data(paths);
    paths.enter()
      .append('path')
      .classed(cls, true);
    paths.exit()
      .remove();
    svg.selectAll('path.' + cls)
      .attr('d', makeD3Path);
  }

  drawBorders(h, cities, n) {
    var links = getBorders(h, getTerritories(h, cities, n));
    this.drawPaths('border', links);
  }

  drawCities(svg, render) {
    var cities = render.cities;
    var h = render.h;
    var n = render.params.nterrs;

    var circs = svg.selectAll('circle.city').data(cities);
    circs.enter()
      .append('circle')
      .classed('city', true);
    circs.exit()
      .remove();
    svg.selectAll('circle.city')
      .attr('cx', function (d) {
        return 1000 * h.mesh.vxs[d][0]
      })
      .attr('cy', function (d) {
        return 1000 * h.mesh.vxs[d][1]
      })
      .attr('r', function (d, i) {
        return i >= n ? 4 : 10
      })
      .style('fill', 'white')
      .style('stroke-width', 5)
      .style('stroke-linecap', 'round')
      .style('stroke', 'black')
      .raise();
  }

  drawContour(h, level) {
    level = level || 0;
    var links = contour(h, level);
    drawPaths('coast', links);
  }

  drawDownhill(h) {
    var links = getRivers(h, 0.01);
    drawPaths('river', links);
  }

  drawPoints(svg, pts) {
    var circle = svg.selectAll('circle').data(pts);
    circle.enter()
      .append('circle');
    circle.exit().remove();
    d3.selectAll('circle')
      .attr('cx', function (d) {
        return 1000 * d[0]
      })
      .attr('cy', function (d) {
        return 1000 * d[1]
      })
      .attr('r', 100 / Math.sqrt(pts.length));
  }

  drawSlopes(svg, render) {
    var h = render.h;
    var strokes = [];
    var r = 0.25 / Math.sqrt(h.length);
    for (var i = 0; i < h.length; i++) {
      if (h[i] <= 0 || isNearEdge(h.mesh, i)) continue;
      var nbs = neighbours(h.mesh, i);
      nbs.push(i);
      var s = 0;
      var s2 = 0;
      for (var j = 0; j < nbs.length; j++) {
        var slopes = triSlope(h, nbs[j]);
        s += slopes[0] / 10;
        s2 += slopes[1];
      }
      s /= nbs.length;
      s2 /= nbs.length;
      if (Math.abs(s) < runIf(0.1, 0.4)) continue;
      var l = r * runIf(1, 2) * (1 - 0.2 * Math.pow(Math.atan(s), 2)) * Math.exp(s2 / 100);
      var x = h.mesh.vxs[i][0];
      var y = h.mesh.vxs[i][1];
      if (Math.abs(l * s) > 2 * r) {
        var n = Math.floor(Math.abs(l * s / r));
        l /= n;
        if (n > 4) n = 4;
        for (var j = 0; j < n; j++) {
          var u = rNorm() * r;
          var v = rNorm() * r;
          strokes.push([[x + u - l, y + v + l * s], [x + u + l, y + v - l * s]]);
        }
      } else {
        strokes.push([[x - l, y + l * s], [x + l, y - l * s]]);
      }
    }
    var lines = svg.selectAll('line.slope').data(strokes);
    lines.enter()
      .append('line')
      .classed('slope', true);
    lines.exit()
      .remove();
    svg.selectAll('line.slope')
      .attr('x1', function (d) {
        return 1000 * d[0][0]
      })
      .attr('y1', function (d) {
        return 1000 * d[0][1]
      })
      .attr('x2', function (d) {
        return 1000 * d[1][0]
      })
      .attr('y2', function (d) {
        return 1000 * d[1][1]
      });
  }

  drawVoronoi(svg, field, lo, hi) {
    if (hi == undefined) hi = d3.max(field) + 1e-9;
    if (lo == undefined) lo = d3.min(field) - 1e-9;
    var mappedvals = field.map(function (x) {
      return x > hi ? 1 : x < lo ? 0 : (x - lo) / (hi - lo)
    });
    var tris = svg.selectAll('path.field').data(field.mesh.tris);
    tris.enter()
      .append('path')
      .classed('field', true);

    tris.exit()
      .remove();

    svg.selectAll('path.field')
      .attr('d', makeD3Path)
      .style('fill', function (d, i) {
        return d3.interpolateViridis(mappedvals[i]);
      });
  }

}