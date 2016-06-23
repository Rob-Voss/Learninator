(function(global) {
  'use strict';

  /**
   *
   * @param {object} opts
   * @constructor
   */
  let TileMap = function(opts) {
    PIXI.Container.call(this);

    this.interactive = true;

    this.tileSize = opts.tileMap.size;
    this.tilesWidth = opts.tileMap.width;
    this.tilesHeight = opts.tileMap.height;
    this.mapWidth = opts.render.width;
    this.mapHeight = opts.render.height;
    this.menu = opts.menu;

    this.zoom = 2;
    this.scale.x = this.scale.y = this.zoom;
    this.data = {};

    this.startLocation = new Vec(0, 0);

    // fill the map with tiles
    this.generateMap();

    // variables and functions for moving the map
    this.mouseOverGraphics = new PIXI.Graphics();
    this.mouseOverTileCoords = [0, 0];
    this.mouseOverPoint = [0, 0];

    this.selectedGraphics = new PIXI.Graphics();
    this.selectedTileCoords = [0, 0];
    this.mousePressPoint = [0, 0];

    this.addChild(this.selectedGraphics);
    this.addChild(this.mouseOverGraphics);

    this.mousedown = this.touchstart = function(event) {
      this.data = event.data;
      if (this.data.getLocalPosition(this.parent).x > this.menu.width) {
        this.dragging = true;
        this.mousePressPoint[0] = this.data.getLocalPosition(this.parent).x - this.position.x;
        this.mousePressPoint[1] = this.data.getLocalPosition(this.parent).y - this.position.y;

        this.selectTile(Math.floor(this.mousePressPoint[0] / (this.tileSize * this.zoom)),
            Math.floor(this.mousePressPoint[1] / (this.tileSize * this.zoom)));
      }
    };

    this.mouseup = this.mouseupoutside = this.touchend = this.touchendoutside = function(event) {
      this.data = event.data;
      this.dragging = false;
    };

    this.mousemove = this.touchmove = function(event) {
      this.data = event.data;
      if (this.dragging) {
        var position = this.data.getLocalPosition(this.parent);
        this.position.x = position.x - this.mousePressPoint[0];
        this.position.y = position.y - this.mousePressPoint[1];

        this.constrainTileMap();
      } else {
        this.mouseOverPoint[0] = this.data.getLocalPosition(this.parent).x - this.position.x;
        this.mouseOverPoint[1] = this.data.getLocalPosition(this.parent).y - this.position.y;

        this.mouseOverTileCoords = [
          Math.floor(this.mouseOverPoint[0] / (this.tileSize * this.zoom)),
          Math.floor(this.mouseOverPoint[1] / (this.tileSize * this.zoom))
        ];
        this.mouseOverGraphics.clear();
        this.mouseOverGraphics.lineStyle(1, 0xFFFFFF, 1);
        this.mouseOverGraphics.beginFill(0x000000, 0);
        this.mouseOverGraphics.drawRect(
            this.mouseOverTileCoords[0] * this.tileSize,
            this.mouseOverTileCoords[1] * this.tileSize,
            this.tileSize - 1,
            this.tileSize - 1
        );
        this.mouseOverGraphics.endFill();
      }
    };
  };

  TileMap.prototype = new PIXI.Container();
  TileMap.prototype.constructor = TileMap;

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param terrain
   */
  TileMap.prototype.addTile = function(x, y, terrain) {
    let tile = PIXI.Sprite.fromFrame(terrain);
    tile.position.x = x * this.tileSize;
    tile.position.y = y * this.tileSize;
    tile.tileX = x;
    tile.tileY = y;
    tile.terrain = terrain;
    this.addChildAt(tile, x * this.tilesHeight + y);
  };

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param terrain
   */
  TileMap.prototype.changeTile = function(x, y, terrain) {
    this.removeChild(this.getTile(x, y));
    this.addTile(x, y, terrain);
  };

  /**
   *
   * @param {number} x
   * @param {number} y
   * @return {DisplayObject}
   */
  TileMap.prototype.getTile = function(x, y) {
    return this.getChildAt(x * this.tilesHeight + y);
  };

  /**
   *
   */
  TileMap.prototype.generateMap = function() {
    for (let i = 0; i < this.tilesWidth; ++i) {
      for (let j = 0; j < this.tilesHeight; j++) {
        this.addTile(i, j, 0);
      }
    }

    // spawn some landmasses
    for (let j = 0; j < 25; j++) { // number of landmasses
      for (let i = 0; i < 12; i++) { // size seed of landmasses
        this.spawnLandmass(Math.floor(i / 2) + 1,
            Math.floor(Math.random() * this.tilesWidth),
            Math.floor(Math.random() * this.tilesHeight));
      }
    }

    // starting location
    let found = false;
    while (!found) {
      let x = Math.floor(Math.random() * this.tilesWidth),
          y = Math.floor(Math.random() * this.tilesHeight),
          tile = this.getTile(x, y);
      if (tile.terrain === 2) {
        this.changeTile(x, y, 5);
        this.startLocation.x = x;
        this.startLocation.y = y;
        found = true;
      }
    }
  };

  /**
   *
   * @param {number} size
   * @param {number} x
   * @param {number} y
   */
  TileMap.prototype.spawnLandmass = function(size, x, y) {
    x = Math.max(x, 0);
    x = Math.min(x, this.tilesWidth - 1);
    y = Math.max(y, 0);
    y = Math.min(y, this.tilesHeight - 1);

    if (this.getTile(x, y).terrain < size) {
      this.changeTile(x, y, Math.min(4, Math.max(1, Math.floor(size / (Math.random() + 0.9)))));
    }

    for (let i = 0; i < size; i++) {
      let horiz = Math.floor(Math.random() * 3) - 1,
          vert = Math.floor(Math.random() * 3) - 1;
      this.spawnLandmass(size - 1, x + horiz, y + vert);
    }
  };

  /**
   *
   * @param {number} size
   * @param {number} x
   * @param {number} y
   */
  TileMap.prototype.spawnWater = function(size, x, y) {
    x = Math.max(x, 0);
    x = Math.min(x, this.tilesWidth - 1);
    y = Math.max(y, 0);
    y = Math.min(y, this.tilesHeight - 1);

    if (this.getTile(x, y).terrain < size) {
      this.changeTile(x, y, Math.min(4, Math.max(1, Math.floor(size / (Math.random() + 0.9)))));
    }

    for (let i = 0; i < size; i++) {
      let horiz = Math.floor(Math.random() * 3) - 1,
          vert = Math.floor(Math.random() * 3) - 1;
      this.spawnWater(size - 1, x + horiz, y + vert);
    }
  };

  /**
   *
   * @param {number} x
   * @param {number} y
   */
  TileMap.prototype.selectTile = function(x, y) {
    this.selectedTileCoords = [x, y];
    this.menu.selectedTileText.text = 'Selected Tile: ' + this.selectedTileCoords;
    this.selectedGraphics.clear();
    this.selectedGraphics.lineStyle(2, 0xFFFF00, 1);
    this.selectedGraphics.beginFill(0x000000, 0);
    this.selectedGraphics.drawRect(this.selectedTileCoords[0] * this.tileSize,
        this.selectedTileCoords[1] * this.tileSize,
        this.tileSize,
        this.tileSize);
    this.selectedGraphics.endFill();
  };

  /**
   *
   */
  TileMap.prototype.zoomIn = function() {
    this.zoom = Math.min(this.zoom * 2, 8);
    this.scale.x = this.scale.y = this.zoom;

    this.centerOnSelectedTile();
    this.constrainTileMap();
  };

  /**
   *
   */
  TileMap.prototype.zoomOut = function() {
    this.mouseOverGraphics.clear();

    this.zoom = Math.max(this.zoom / 2, 1);
    this.scale.x = this.scale.y = this.zoom;

    this.centerOnSelectedTile();
    this.constrainTileMap();
  };

  /**
   *
   */
  TileMap.prototype.centerOnSelectedTile = function() {
    this.position.x = (this.mapWidth - this.menu.width) / 2 -
        this.selectedTileCoords[0] * this.zoom * this.tileSize -
        this.tileSize * this.zoom / 2 + this.menu.width;

    this.position.y = this.mapHeight / 2 -
        this.selectedTileCoords[1] * this.zoom * this.tileSize -
        this.tileSize * this.zoom / 2;
  };

  /**
   *
   */
  TileMap.prototype.constrainTileMap = function() {
    this.position.x = Math.max(this.position.x, -1 * this.tileSize * this.tilesWidth * this.zoom + this.mapWidth);
    this.position.x = Math.min(this.position.x, this.menu.width);
    this.position.y = Math.max(this.position.y, -1 * this.tileSize * this.tilesHeight * this.zoom + this.mapHeight);
    this.position.y = Math.min(this.position.y, 0);
  };

  let Menu = function(tilemap, opts) {
    PIXI.Container.call(this);
    this.tileMap = tilemap;
    this.menuWidth = opts.menu.width;
    this.interactive = true;

    this.background = new PIXI.Graphics();
    this.background.lineStyle(1, 0x000000, 1);
    this.background.beginFill(0xA08000, 1);
    this.background.drawRect(this.menuWidth - 4, 0, 4, opts.render.width);
    this.background.endFill();
    this.background.lineStyle(0, 0x000000, 1);
    this.background.beginFill(0x203040, 1);
    this.background.drawRect(0, 0, this.menuWidth - 4, opts.render.width);
    this.background.endFill();
    this.addChild(this.background);

    this.selectedTileText = new PIXI.Text(
        'Selected Tile: ' + 1,
        {
          font: '12px Arial',
          fill: '#FFFFFF',
          align: 'left'
        }
        );
    this.addChild(this.selectedTileText);

    this.addMenuButton('+', 0, 12, this.tileMap, this.tileMap.zoomIn);
    this.addMenuButton('-', 30, 12, this.tileMap, this.tileMap.zoomOut);
  };

  Menu.prototype = new PIXI.Container();
  Menu.prototype.constructor = Menu;

  Menu.prototype.addMenuButton = function(text, x, y, obj, callback) {
    var button = new PIXI.Text(text, {font: '40px Arial', fill: '#FFFFFF'});
    button.position.x = x;
    button.position.y = y;
    button.interactive = true;
    button.buttonMode = true;
    button.hitArea = new PIXI.Rectangle(0, 12, 30, 30);

    button.mousedown = button.touchstart = function(event) {
      this.data = event.data;
      button.style = {font: '40px Arial', fill: '#FF0000'};
    };

    button.mouseover = function(event) {
      this.data = event.data;
      button.style = {font: '40px Arial', fill: '#FFFF00'};
    };

    button.mouseup = button.touchend = function(event) {
      this.data = event.data;
      callback.call(obj);
      button.style = {font: '40px Arial', fill: '#FFFFFF'};
    };

    button.mouseupoutside = button.touchendoutside = function(event) {
      this.data = event.data;
      button.style = {font: '40px Arial', fill: '#FFFFFF'};
    };

    button.mouseout = function(event) {
      this.data = event.data;
      button.style = {font: '40px Arial', fill: '#FFFFFF'};
    };

    this.addChild(button);
  };
  global.Menu = Menu;
  global.TileMap = TileMap;

}(this));
