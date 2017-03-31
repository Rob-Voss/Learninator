/**
 * @class MapGen
 */
class MapGen {

  /**
   * @constructor
   * @returns {MapGen}
   */
  constructor() {
    return this;
  }

  /**
   *
   * @param value
   * @param times
   * @returns {*|{}|Object|Array|{border, color, width, height, dim, alpha, lineWidth, angularWidth, span, valueArray, dimArray}}
   */
  static repeat(value, times) {
    return Array.apply(null, new Array(times)).map(() => value);
  }

  /**
   *
   * @param {number} begin
   * @param {number} end
   * @returns {Array}
   */
  static range(begin, end) {
    let result = [];
    for (let i = begin; i < end; ++i) {
      result.push(i);
    }

    return result;
  }

  /**
   *
   * @param {Array} field
   * @param {number} width
   * @param {number} height
   */
  static print(field, width, height) {
    for (let y in MapGen.range(0, height)) {
      let s = '';
      for (let x in MapGen.range(0, width)) {
        if (field[y][x] === undefined) {
          console.log(s);
        } else {
          s += field[y][x];
        }
      }
    }
  }
}
MapGen.legend = {
    wall: '#',
    empty: '.',
    exposed: ',',
    unexposed: '?'
};

// var MapGen = new MapGen();

/**
 * @class MapExport
 */
class MapExport {

  /**
   * @constructor
   */
  constructor() {
    return this;
  }

  /**
   *
   * @param map
   * @param width
   * @param height
   * @param tileSize
   */
  static tiledJson(map, width, height, tileSize) {

    /**
     *
     * @param map
     * @returns {*}
     */
    let mapToTiledData = function (map) {
      let newRows = [];
      for (let r = 0; r < map.length; ++r) {
        let row = map[r],
          newRow = [];
        for (let c = 0; c < row.length; ++c) {
          if (row[c] === MapGen.legend.empty) {
            newRow.push(0);
          } else {
            newRow.push(1);
          }
        }
        newRows.push(newRow);
      }

      return [].concat.apply([], newRows);
    };

    let version = 1,
      tiled = {
        height: height,
        layers: [
          {
            data: mapToTiledData(map),
            height: height,
            name: "Tile Layer 1",
            opacity: 1,
            type: "tilelayer",
            visible: true,
            width: width,
            x: 0,
            y: 0
          }
        ],
        nextobjectid: 1,
        orientation: "orthogonal",
        properties: {},
        renderorder: "right-down",
        tileheight: tileSize,
        tilesets: [
          {
            firstgid: 1,
            image: "pathToImage.tif",
            imageheight: 0,
            imagewidth: 0,
            margin: 0,
            name: "Change Me",
            properties: {},
            spacing: 0,
            tileheight: tileSize,
            tilewidth: tileSize
          }
        ],
        tilewidth: tileSize,
        version: 1,
        width: width
      };

    return JSON.stringify(tiled, null, 2);
  }
}

// var MapExport = new MapExport();

/**
 * @class Caves
 */
class Caves {

  /**
   * @constructor
   * @returns {Caves}
   */
  constructor() {
    return this;
  }

  /**
   *
   * @param {number} width
   * @param {number} height
   * @param firstPassFillRate
   * @param {number} iterations
   * @returns {*|Array}
   */
  static create(width, height, firstPassFillRate, iterations) {
    let map = Caves.randomMap(width, height, firstPassFillRate);
    for (let i = 0; i < iterations; ++i) {
      map = Caves.fourFive(map, width, height);
    }
    MapGen.print(map, width, height);

    return map;
  }

  /**
   *
   * @param {number} width
   * @param {number} fillRate
   * @returns {Array}
   */
  static randomRow(width, fillRate) {
    let empty = MapGen.repeat(0, width);

    return empty.map(() => {
      return (Math.random() < fillRate) ? MapGen.legend.wall : MapGen.legend.empty
    });
  }

  /**
   *
   * @param {number} width
   * @param {number} height
   * @param {number} fillRate
   * @returns {Array}
   */
  static randomMap(width, height, fillRate) {
    let empty = MapGen.repeat(0, height);

    return empty.map(() => Caves.randomRow(width, fillRate));
  }

  /**
   * It is an old and fairly well documented trick to use cellular automata to generate cave-like structures.
   * The basic idea is to fill the first map randomly, then repeatedly create new maps using the 4-5 rule:
   * a tile becomes a wall if it was a wall and 4 or more of its eight neighbors were walls, or if it was
   * not a wall and 5 or more neighbors were. Put more succinctly, a tile is a wall if the 3x3 region
   * centered on it contained at least 5 walls. Each iteration makes each tile more like its neighbors,
   * and the amount of overall "noise" is gradually reduced:
   *
   * @param field
   * @param {number} width
   * @param {number} height
   * @returns {Array}
   */
  static fourFive(field, width, height) {
    let newField = [],
      /**
       *
       * @param {*} value
       * @returns {boolean}
       */
      isWall = function (value) {
        return (value === undefined || value === MapGen.legend.wall);
      },
      /**
       *
       * @param {number} y
       * @param {number} x
       * @returns {*}
       */
      threeByThree = function (y, x) {
        let rowNums = [y - 1, y, y + 1];
        return [].concat.apply([], rowNums.map(function (rowNum) {
          if (field[rowNum] === undefined) {
            return MapGen.repeat(MapGen.legend.wall, 3);
          } else {
            return [field[rowNum][x - 1], field[rowNum][x], field[rowNum][x + 1]];
          }
        }));
      };

    for (let y = 0; y < height; ++y) {
      newField.push([]);
      for (let x = 0; x < width; ++x) {
        let threeSquared = threeByThree(y, x),
          walls = threeSquared.filter((element) => isWall(element));
        newField[y][x] = (walls.length >= 5) ? MapGen.legend.wall : MapGen.legend.empty;
      }
    }

    return newField;
  }
}

/**
 * @class GrowingTree
 */
class GrowingTree {

  /**
   * @constructor
   * @returns {GrowingTree}
   */
  constructor() {
    return this;
  }

  /**
   *
   * @param width
   * @param height
   * @param branchrate
   * @returns {Array}
   */
  static create(width, height, branchrate) {
    // TODO: parameter checking
    let map = {
      field: [],
      frontier: []
    };

    map = GrowingTree.init(map, width, height);
    while (map.frontier.length > 0) {
      let pos = Math.random();
      pos = Math.pow(pos, Math.pow(Math.E, -branchrate));
      let choice = map.frontier[Math.floor(pos * map.frontier.length)];
      if (GrowingTree.check(map.field, choice[0], choice[1], width, height, true)) {
        map = GrowingTree.carve(map.field, map.frontier, choice[0], choice[1], width, height);
      } else {
        GrowingTree.harden(map.field, choice[0], choice[1]);
      }
      map.frontier = map.frontier.filter((element) => (element !== choice));
    }

    for (let y in MapGen.range(0, height)) {
      for (let x in MapGen.range(0, width)) {
        if (map.field[y][x] === MapGen.legend.unexposed) {
          map.field[y][x] = MapGen.legend.wall;
        }
      }
    }

    return map.field;
  }

  /**
   *
   * @param field
   * @param frontier
   * @param y
   * @param x
   * @param width
   * @param height
   * @returns {{field: *, frontier: (string|Array.<T>|*)}}
   */
  static carve(field, frontier, y, x, width, height) {
    let extra = [];

    function knuthShuffle(array) {
      let currentIndex = array.length, temporaryValue, randomIndex;
      // While there remain elements to shuffle...
      while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }

    field[y][x] = MapGen.legend.empty;
    if (x > 0) {
      if (field[y][x - 1] === MapGen.legend.unexposed) {
        field[y][x - 1] = MapGen.legend.exposed;
        extra.push([y, x - 1]);
      }
    }
    if (x < width - 1) {
      if (field[y][x + 1] === MapGen.legend.unexposed) {
        field[y][x + 1] = MapGen.legend.exposed;
        extra.push([y, x + 1]);
      }
    }
    if (y > 0) {
      if (field[y - 1][x] === MapGen.legend.unexposed) {
        field[y - 1][x] = MapGen.legend.exposed;
        extra.push([y - 1, x]);
      }
    }
    if (y < height - 1) {
      if (field[y + 1][x] === MapGen.legend.unexposed) {
        field[y + 1][x] = MapGen.legend.exposed;
        extra.push([y + 1, x]);
      }
    }
    let shuffledExtra = knuthShuffle(extra);
    frontier = frontier.concat(shuffledExtra);

    return {
      field: field,
      frontier: frontier
    };
  }

  /**
   *
   * @param field
   * @param y
   * @param x
   * @param width
   * @param height
   * @param noDiagonals
   * @returns {boolean}
   */
  static check(field, y, x, width, height, noDiagonals) {
    let edgeState = 0;

    if (x > 0) {
      if (field[y][x - 1] === MapGen.legend.empty) {
        edgeState += 1;
      }
    }
    if (x < width - 1) {
      if (field[y][x + 1] === MapGen.legend.empty) {
        edgeState += 2;
      }
    }
    if (y > 0) {
      if (field[y - 1][x] === MapGen.legend.empty) {
        edgeState += 4;
      }
    }
    if (y < height - 1) {
      if (field[y + 1][x] === MapGen.legend.empty) {
        edgeState += 8;
      }
    }

    if (noDiagonals) {
      if (edgeState === 1) {
        if (x < width - 1) {
          if (y > 0) {
            if (field[y - 1][x + 1] === MapGen.legend.empty) {
              return false;
            }
          }
          if (y < height - 1) {
            if (field[y + 1][x + 1] === MapGen.legend.empty) {
              return false;
            }
          }
        }
        return true;
      } else if (edgeState === 2) {
        if (x > 0) {
          if (y > 0) {
            if (field[y - 1][x - 1] === MapGen.legend.empty) {
              return false;
            }
          }
          if (y < height - 1) {
            if (field[y + 1][x - 1] === MapGen.legend.empty) {
              return false;
            }
          }
        }
        return true;
      } else if (edgeState === 4) {
        if (y < height - 1) {
          if (x > 0) {
            if (field[y + 1][x - 1] === MapGen.legend.empty) {
              return false;
            }
          }
          if (x < width - 1) {
            if (field[y + 1][x + 1] === MapGen.legend.empty) {
              return false;
            }
          }
        }
        return true;
      } else if (edgeState === 8) {
        if (y > 0) {
          if (x > 0) {
            if (field[y - 1][x - 1] === MapGen.legend.empty) {
              return false;
            }
          }
          if (x < width - 1) {
            if (field[y - 1][x + 1] === MapGen.legend.empty) {
              return false;
            }
          }
        }

        return true;
      }

      return false;
    } else {
      // diagonal walls are permitted
      // not implemented
    }
  }

  /**
   *
   * @param field
   * @param y
   * @param x
   */
  static harden(field, y, x) {
    field[y][x] = MapGen.legend.wall;
  }

  /**
   *
   * @param map
   * @param width
   * @param height
   * @returns {*|{field: *, frontier: (string|Array.<T>|*)}}
   */
  static init(map, width, height) {
    for (let h in MapGen.range(0, height)) {
      let row = [];
      for (let i in MapGen.range(0, width)) {
        row.push(MapGen.legend.unexposed);
      }
      map.field.push(row);
    }

    let initX = Math.ceil(Math.random() * width) - 1,
      initY = Math.ceil(Math.random() * height) - 1;

    console.log('Chose init point x ' + initX + ' y ' + initY);
    console.log(map.frontier);

    return GrowingTree.carve(map.field, map.frontier, initY, initX, width, height);
  }
}

let Demo = {
  tileSize: 16,
  tileValues: {
    empty: 0,
    wall: 1
  },
  activeMap: null
};

/**
 *
 * @param context
 * @param tileValue
 */
Demo.setupContext = function (context, tileValue) {
  if (tileValue === Demo.tileValues.empty) {
    context.fillStyle = '#000000';
  } else if (tileValue === Demo.tileValues.wall) {
    context.fillStyle = '#ff0000';
  }
};

/**
 *
 */
Demo.zoom = function () {
  Demo.draw(Demo.activeMap, Demo.valueAsNumber('zoom'));
};

/**
 *
 * @param map
 * @param width
 * @param height
 * @param zoom
 */
Demo.draw = function (map, width, height, zoom) {
  console.log('draw() started.');
  let tileSize = Demo.tileSize * zoom,
    canvas = document.getElementById("canvas"),
    context = canvas.getContext("2d");

  canvas.width = width * Demo.tileSize * zoom;
  canvas.height = height * Demo.tileSize * zoom;

  context.fillStyle = "#eeeeee";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#334466";
  context.strokeStyle = "#334466";
  context.font = "12px Arial";
  console.log('draw() clear canvas.');
  console.log('z ' + zoom);
  context.clearRect(0, 0, canvas.width, canvas.height);

  let cellY = 0;
  for (let r = 0; r < map.length; ++r) {
    let row = map[r];
    for (let c = 0; c < row.length; ++c) {
      let node = row[c],
        cx = c * Demo.tileSize * zoom,
        cy = cellY;

      if (node === '.') {
        Demo.setupContext(context, Demo.tileValues.empty);
      } else if (node === '#') {
        Demo.setupContext(context, Demo.tileValues.wall);
      }

      context.fillRect(cx, cy, Demo.tileSize * zoom, Demo.tileSize * zoom);

    }
    cellY += Demo.tileSize * zoom;
  }

  console.log(map);
  console.log('draw() finished.');
};

/**
 *
 * @param elementId
 * @returns {Number}
 */
Demo.valueAsNumber = function (elementId) {
  return parseFloat(document.getElementById(elementId).value);
};

/**
 *
 */
Demo.createAndDraw = function () {
  let width = Demo.valueAsNumber('width'),
    height = Demo.valueAsNumber('height'),
    branchrate = Demo.valueAsNumber('branchrate'),
    zoom = Demo.valueAsNumber('zoom');

  Demo.activeMap = GrowingTree.create(width, height, branchrate);
  Demo.draw(Demo.activeMap, width, height, zoom);
};

/**
 *
 */
Demo.createAndDrawCavern = function () {
  let width = Demo.valueAsNumber('width'),
    height = Demo.valueAsNumber('height'),
    fillRate = Demo.valueAsNumber('fillrate'),
    iterations = Demo.valueAsNumber('iterations'),
    zoom = Demo.valueAsNumber('zoom');

  Demo.activeMap = Caves.create(width, height, fillRate, iterations);
  Demo.draw(Demo.activeMap, width, height, zoom);
};
