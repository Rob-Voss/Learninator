// Random number utilities
let retV = false,
  vVal = 0.0,

  /**
   *
   * @name Utility
   * @type {object}
   * @property {function} assert
   * @property {function} getDirection:
   * @property {function} getElementPosition
   * @property {function} getOpt
   * @property {function} loadJSON
   * @property {function} rgbToHex
   * @property {function} hexToRgb
   * @property {object} Arrays
   * @property {function} Arrays.arrContains
   * @property {function} Arrays.arrUnique
   * @property {function} Arrays.findObject
   * @property {object} Maths
   * @property {number} Maths.ONED
   * @property {function} Maths.clamp
   * @property {function} Maths.degree
   * @property {function} Maths.gaussRandom
   * @property {function} Maths.map
   * @property {function} Maths.maxMin
   * @property {function} Maths.randf
   * @property {function} Maths.randi
   * @property {function} Maths.randn
   * @property {function} Maths.randperm
   * @property {function} Maths.radian
   * @property {function} Maths.range
   * @property {function} Maths.weightedSample
   * @property {function} Maths.zeros
   * @property {object} Strings
   * @property {function} Strings.flt2str
   * @property {function} Strings.parse
   * @property {function} Strings.stringify
   * @property {function} Strings.guid
   * @property {function} Strings.S4
   */
  Utility = {

    /**
     * Utility fun
     * @param {*} condition
     * @param {string} message
     */
    assert(condition, message) {
      // from http://stackoverflow.com/questions/15313418/javascript-assert
      if (!condition) {
        message = message || 'Assertion failed';
        if (Error !== undefined) {
          throw new Error(message);
        }
        throw message; // Fallback
      }
    },

    /**
     * Calculate the direction.
     * @param {number} angle
     * @return {string}
     */
    getDirection(angle) {
      if (angle < 0) {
        angle += 360;
      }
      let directions = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'],
        octant = Math.round(8 * angle / (2 * Math.PI) + 8) % 8;

      return directions[octant];
    },

    /**
     *
     * @param {HTMLElement} element
     * @return {{x: number, y: number}}
     */
    getElementPosition: function (element) {
      let elem = element,
        tagname = "",
        x = 0,
        y = 0;
      while ((typeof (elem) === "object") && (typeof (elem.tagName) !== "undefined")) {
        y += elem.offsetTop;
        x += elem.offsetLeft;
        tagname = elem.tagName.toUpperCase();
        if (tagname === "BODY") {
          elem = 0;
        }
        if (typeof (elem) === "object") {
          if (typeof (elem.offsetParent) === "object") {
            elem = elem.offsetParent;
          }
        }
      }
      return {x: x, y: y};
    },

    /**
     * Syntactic sugar function for getting default parameter values
     * @param {Object} opt
     * @param {string} fieldName
     * @param {*} defaultV
     * @return {*}
     */
    getOpt(opt, fieldName, defaultV) {
      if (opt === undefined) {
        return defaultV;
      }
      return (typeof opt[fieldName] !== 'undefined') ? opt[fieldName] : defaultV;
    },

    /**
     *
     * @param {number|string} hex
     * @return {*}
     */
    hexToRgb(hex) {
      if (!isNaN(hex)) {
        hex = "#" + hex.toString(16);
      }
      let ret = {r: 0, g: 0, b: 0},
        shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
      });
      let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        ret.r = parseInt(result[1], 16);
        ret.g = parseInt(result[2], 16);
        ret.b = parseInt(result[3], 16);

        return ret;
      } else {
        return null;
      }
    },

    /**
     * Load JSON
     * @param {string} file
     * @param {function} callback
     */
    loadJSON(file, callback) {
      let xObj = new XMLHttpRequest();
      xObj.overrideMimeType('application/json');
      xObj.open('GET', file, true);
      xObj.onreadystatechange = function () {
        if (xObj.readyState === 4 && xObj.status === 200) {
          callback(xObj.responseText);
        }
      };
      xObj.send(null);
    },

    /**
     * Usage:  Load different file types with one callback
     * Promise.all([
     * load.js('lib/highlighter.js'),
     * load.js('lib/main.js'),
     * load.css('lib/highlighter.css'),
     * load.img('images/logo.png')
     * ]).then(function() {
     *    console.log('Everything has loaded!');
     * }).catch(function() {
     *    console.log('Oh no, epic failure!');
     * });
     * @type {{css, js, img}}
     */
    Loader() {

      /**
       * Function which returns a function:
       * https://davidwalsh.name/javascript-functions
       */
      function _load(tag) {
        return function (url) {
          // This promise will be used by Promise.all
          // to determine success or failure
          return new Promise(function (resolve, reject) {
            var element = document.createElement(tag),
              parent = 'body',
              attr = 'src';

            // Important success and error for the promise
            element.onload = function () {
              resolve(url);
            };
            element.onerror = function () {
              reject(url);
            };

            // Need to set different attributes depending on tag type
            switch (tag) {
              case 'script':
                element.async = true;
                break;
              case 'link':
                element.type = 'text/css';
                element.rel = 'stylesheet';
                attr = 'href';
                parent = 'head';
            }

            // Inject into document to kick off loading
            element[attr] = url;
            document[parent].appendChild(element);
          });
        };
      }

      return {
        css: _load('link'),
        js: _load('script'),
        img: _load('img')
      };
    },

    /**
     *
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @return {number}
     */
    rgbToHex(r, g, b) {
      return parseInt("0x" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1));
    },

    /**
     *
     */
    Arrays: {

      /**
       *
       * @param {Array} arr
       * @return {Array}
       */
      arrUnique: function (arr) {
        let h = {}, output = [];
        for (let i = 0, n = arr.length; i < n; i++) {
          if (!h[arr[i]]) {
            h[arr[i]] = true;
            output.push(arr[i]);
          }
        }

        return output;
      },

      /**
       *
       * @param {Array} arr
       * @param {object} elt
       * @return {number|boolean}
       */
      arrContains: function (arr, elt) {
        for (let i = 0, n = arr.length; i < n; i++) {
          if (arr[i] === elt) {
            return i;
          }
        }

        return false;
      },

      /**
       * Find an object in the array via id attribute
       * @param {Array} ar
       * @param {string} id
       * @return {object}
       */
      findObject: function (ar, id) {
        ar.map(function (el) {
          return el.id;
        }).indexOf(id);
      }
    },

    /**
     *
     */
    Maths: {

      /**
       * Gaussian random number
       * @return {number}
       */
      gaussRandom: function () {
        if (retV) {
          retV = false;
          return vVal;
        }

        let u = 2 * Math.random() - 1,
          v = 2 * Math.random() - 1,
          r = u * u + v * v,
          c = Math.sqrt(-2 * Math.log(r) / r);
        if (r === 0 || r > 1) {
          return this.gaussRandom();
        }

        vVal = v * c; // cache this
        retV = true;

        return u * c;
      },

      /**
       * Return max and min of a given non-empty array.
       * @param {Array} w
       * @returns {*}
       */
      maxMin: function (w) {
        if (w.length === 0) {
          return {};
        } // ... ;s
        let maxv = w[0],
          minv = w[0],
          maxi = 0,
          mini = 0,
          n = w.length;
        for (let i = 1; i < n; i++) {
          if (w[i] > maxv) {
            maxv = w[i];
            maxi = i;
          }
          if (w[i] < minv) {
            minv = w[i];
            mini = i;
          }
        }
        return {
          maxi: maxi,
          maxv: maxv,
          mini: mini,
          minv: minv,
          dv: maxv - minv
        };
      },

      /**
       * Return a random Float within the range of a-b
       * @param {number} lo
       * @param {number} hi
       * @return {number}
       */
      randf: function (lo, hi) {
        return Math.random() * (hi - lo) + lo;
      },

      /**
       * Return a random Integer within the range of a-b
       * @param {number} lo
       * @param {number} hi
       * @return {number}
       */
      randi: function (lo, hi) {
        return Math.floor(this.randf(lo, hi));
      },

      /**
       * Return a random Number
       * @param {float} mu
       * @param {float} std
       * @return {number}
       */
      randn: function (mu, std) {
        return mu + this.gaussRandom() * std;
      },

      /**
       * create random permutation of numbers, in range [0...n-1]
       * @param {number} n
       * @return {Array}
       */
      randperm: function (n) {
        let i = n,
          j = 0,
          temp,
          array = [];
        for (let q = 0; q < n; q++) {
          array[q] = q;
        }
        while (i--) {
          j = Math.floor(Math.random() * (i + 1));
          temp = array[i];
          array[i] = array[j];
          array[j] = temp;
        }
        return array;
      },

      /**
       * A helper function returns array of zeros of length n
       * and uses typed arrays if available
       * @param {number} n
       * @return {Float64Array|Array}
       */
      zeros: function (n) {
        if (typeof n === 'undefined' || isNaN(n)) {
          return [];
        }
        if (typeof ArrayBuffer === 'undefined') {
          // lacking browser support
          let arr = new Array(n);
          for (let i = 0; i < n; i++) {
            arr[i] = 0;
          }
          return arr;
        } else {
          return new Float64Array(n);
        }
      },

      /**
       *
       * @param {number} min
       * @param {number} max
       * @param {boolean} round
       * @return {*}
       */
      range: function (min, max, round) {
        if (typeof round === "undefined") {
          round = true;
        }
        if (round) {
          return Math.floor(Math.random() * (max - min + 1)) + min;
        } else {
          return Math.random() * (max - min) + min;
        }
      },

      /**
       *
       * @param {number} value
       * @return {number}
       */
      degree: function (value) {
        return value / this.ONED;
      },

      /**
       *
       * @param {number} value
       * @return {number}
       */
      radian: function (value) {
        return value * this.ONED;
      },

      /**
       *
       * @param {number} val
       * @param {number} min
       * @param {number} max
       * @return {number}
       */
      clamp: function (val, min, max) {
        return Math.max(min, Math.min(max, val));
      },

      /**
       *
       * @param {number} value
       * @param {number} low
       * @param {number} high
       * @param {number} low2
       * @param {number} high2
       * @return {*}
       */
      map: function (value, low, high, low2, high2) {
        let percent = (value - low) / (high - low);
        return low2 + percent * (high2 - low2);
      },

      /**
       * sample from list lst according to probabilities in list probs
       * the two lists are of same size, and probs adds up to 1
       * @param {Array} lst
       * @param {Array} probs
       * @return {*}
       */
      weightedSample: function (lst, probs) {
        let p = Utility.Maths.randf(0, 1.0),
          cumprob = 0.0;
        for (let k = 0, n = lst.length; k < n; k++) {
          cumprob += probs[k];
          if (p < cumprob) {
            return lst[k];
          }
        }
      },

      ONED: Math.PI / 180
    },

    /**
     *
     */
    Strings: {

      /**
       * Returns string representation of float
       * but truncated to length of d digits
       * @param {number} x Float
       * @param {number} d Decimals
       * @return {String}
       */
      flt2str: function (x, d) {
        d = (d === undefined) ? 5 : d;
        let dd = Math.pow(10, d);

        return '' + Math.floor(x * dd) / dd;
      }
      ,

      /**
       * Parse an object that has been stringified, and rebuild it's functions
       * @param {String} str
       */
      parse: function (str) {
        return JSON.parse(str, function (key, value) {
          if (typeof value !== 'string') {
            return value;
          }
          return (value.substring(0, 8) === 'function') ? eval('(' + value + ')') : value;
        });
      }
      ,

      /**
       * Stringify an object including it's functions if it has any
       * @param {Object} obj
       */
      stringify: function (obj) {
        return JSON.stringify(obj, function (key, value) {
          return (typeof value === 'function') ? value.toString() : value;
        });
      }
      ,

      /**
       * Generate a UUID
       * @return {String}
       */
      guid: function () {
        let i1 = this.S4() + this.S4(),
          i2 = this.S4() + '-4' + this.S4().substr(0, 3),
          i3 = this.S4(),
          i4 = this.S4() + this.S4() + this.S4();

        return (i1 + '-' + i2 + '-' + i3 + '-' + i4).toLowerCase();
      }
      ,

      /**
       * Do stuff
       * @return {string}
       */
      S4: function () {
        return (((1 + Math.random()) * 0x10000) || 0).toString(16).substring(1);
      }
    }
  };
