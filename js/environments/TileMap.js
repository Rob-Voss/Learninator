(function (global) {
    "use strict";

    var TileMap = function (width, height) {
        PIXI.Container.call(this);

        this.interactive = true;

        this.tilesWidth = width;
        this.tilesHeight = height;

        this.tileSize = 16;
        this.zoom = 2;
        this.scale.x = this.scale.y = this.zoom;
        this.data = {};

        this.startLocation = {x: 0, y: 0};

        // fill the map with tiles
        this.generateMap();

        // variables and functions for moving the map
        this.mouseOverTileCoords = [0, 0];
        this.selectedTileCoords = [0, 0];
        this.mousePressPoint = [0, 0];
        this.selectedGraphics = new PIXI.Graphics();
        this.mouseOverGraphics = new PIXI.Graphics();

        this.addChild(this.selectedGraphics);
        this.addChild(this.mouseOverGraphics);

        this.mousedown = this.touchstart = function (event) {
            this.data = event.data;
            if (this.data.getLocalPosition(this.parent).x > menuBarWidth) {
                this.dragging = true;
                this.mousePressPoint[0] = this.data.getLocalPosition(this.parent).x - this.position.x;
                this.mousePressPoint[1] = this.data.getLocalPosition(this.parent).y - this.position.y;

                this.selectTile(Math.floor(this.mousePressPoint[0] / (this.tileSize * this.zoom)),
                    Math.floor(this.mousePressPoint[1] / (this.tileSize * this.zoom)));
            }
        };

        this.mouseup = this.mouseupoutside = this.touchend = this.touchendoutside = function (data) {
            this.dragging = false;
        };

        this.mousemove = this.touchmove = function (event) {
            this.data = event.data;
            if (this.dragging) {
                var position = this.data.getLocalPosition(this.parent);
                this.position.x = position.x - this.mousePressPoint[0];
                this.position.y = position.y - this.mousePressPoint[1];

                this.constrainTilemap();
            } else {
                var mouseOverPoint = [0, 0];
                mouseOverPoint[0] = this.data.getLocalPosition(this.parent).x - this.position.x;
                mouseOverPoint[1] = this.data.getLocalPosition(this.parent).y - this.position.y;

                var mouseoverTileCoords = [Math.floor(mouseOverPoint[0] / (this.tileSize * this.zoom)),
                    Math.floor(mouseOverPoint[1] / (this.tileSize * this.zoom))];
                this.mouseOverGraphics.clear();
                this.mouseOverGraphics.lineStyle(1, 0xFFFFFF, 1);
                this.mouseOverGraphics.beginFill(0x000000, 0);
                this.mouseOverGraphics.drawRect(mouseoverTileCoords[0] * this.tileSize,
                    mouseoverTileCoords[1] * this.tileSize,
                    this.tileSize - 1,
                    this.tileSize - 1);
                this.mouseOverGraphics.endFill();
            }
        };
    };

    TileMap.prototype = new PIXI.Container();
    TileMap.prototype.constructor = TileMap;

    TileMap.prototype.addTile = function (x, y, terrain) {
        var tile = PIXI.Sprite.fromFrame(terrain);
        tile.position.x = x * this.tileSize;
        tile.position.y = y * this.tileSize;
        tile.tileX = x;
        tile.tileY = y;
        tile.terrain = terrain;
        this.addChildAt(tile, x * this.tilesHeight + y);
    };

    TileMap.prototype.changeTile = function (x, y, terrain) {
        this.removeChild(this.getTile(x, y));
        this.addTile(x, y, terrain);
    };

    TileMap.prototype.getTile = function (x, y) {
        return this.getChildAt(x * this.tilesHeight + y);
    };

    TileMap.prototype.generateMap = function () {
        // fill with ocean
        for (var i = 0; i < this.tilesWidth; ++i) {
            var currentRow = [];
            for (var j = 0; j < this.tilesHeight; j++) {
                this.addTile(i, j, 0);
            }
        }

        // spawn some landmasses
        for (var j = 0; j < 25; j++) { // number of landmasses
            for (var i = 0; i < 12; i++) { // size seed of landmasses
                this.spawnLandmass(Math.floor(i / 2) + 1,
                    Math.floor(Math.random() * this.tilesWidth),
                    Math.floor(Math.random() * this.tilesHeight));
            }
        }

        // starting location
        var found = false;
        while (!found) {
            var x = Math.floor(Math.random() * this.tilesWidth);
            var y = Math.floor(Math.random() * this.tilesHeight);
            var tile = this.getTile(x, y);
            if (tile.terrain == 2) {
                this.changeTile(x, y, 5);
                this.startLocation.x = x;
                this.startLocation.y = y;
                found = true;
            }
        }
    };

    TileMap.prototype.spawnLandmass = function (size, x, y) {
        x = Math.max(x, 0);
        x = Math.min(x, this.tilesWidth - 1);
        y = Math.max(y, 0);
        y = Math.min(y, this.tilesHeight - 1);

        if (this.getTile(x, y).terrain < size) {
            this.changeTile(x, y, Math.min(4, Math.max(1, Math.floor(size /
                (Math.random() + 0.9)))));
        }

        for (var i = 0; i < size; i++) {
            var horiz = Math.floor(Math.random() * 3) - 1;
            var vert = Math.floor(Math.random() * 3) - 1;
            this.spawnLandmass(size - 1, x + horiz, y + vert);
        }
    };

    TileMap.prototype.selectTile = function (x, y) {
        this.selectedTileCoords = [x, y];
        menu.selectedTileText.text = "Selected Tile: " + this.selectedTileCoords;
        this.selectedGraphics.clear();
        this.selectedGraphics.lineStyle(2, 0xFFFF00, 1);
        this.selectedGraphics.beginFill(0x000000, 0);
        this.selectedGraphics.drawRect(this.selectedTileCoords[0] * this.tileSize,
            this.selectedTileCoords[1] * this.tileSize,
            this.tileSize,
            this.tileSize);
        this.selectedGraphics.endFill();
    };

    TileMap.prototype.zoomIn = function () {
        this.zoom = Math.min(this.zoom * 2, 8);
        this.scale.x = this.scale.y = this.zoom;

        this.centerOnSelectedTile();
        this.constrainTilemap();
    };

    TileMap.prototype.zoomOut = function () {
        this.mouseOverGraphics.clear();

        this.zoom = Math.max(this.zoom / 2, 1);
        this.scale.x = this.scale.y = this.zoom;

        this.centerOnSelectedTile();
        this.constrainTilemap();
    };

    TileMap.prototype.centerOnSelectedTile = function () {
        this.position.x = (renderWidth - menuBarWidth) / 2 -
            this.selectedTileCoords[0] * this.zoom * this.tileSize -
            this.tileSize * this.zoom / 2 + menuBarWidth;
        this.position.y = renderHeight / 2 -
            this.selectedTileCoords[1] * this.zoom * this.tileSize -
            this.tileSize * this.zoom / 2;
    };

    TileMap.prototype.constrainTilemap = function () {
        this.position.x = Math.max(this.position.x, -1 * this.tileSize * this.tilesWidth * this.zoom + renderWidth);
        this.position.x = Math.min(this.position.x, menuBarWidth);
        this.position.y = Math.max(this.position.y, -1 * this.tileSize * this.tilesHeight * this.zoom + renderHeight);
        this.position.y = Math.min(this.position.y, 0);
    };

    global.Tilemap = TileMap;

}(this));
