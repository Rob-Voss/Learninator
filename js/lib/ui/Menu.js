var Menu = Menu || {};

(function (global) {
    "use strict";

    /**
     * @name Menu
     * @constructor
     */
    function Menu() {
        PIXI.Container.call(this);
        this.interactive = true;

        this.background = new PIXI.Graphics();
        this.background.lineStyle(1, 0x000000, 1);
        this.background.beginFill(0xA08000, 1);
        this.background.drawRect(50 - 4, 0, 4, 800);
        this.background.endFill();
        this.background.lineStyle(0, 0x000000, 1);
        this.background.beginFill(0x203040, 1);
        this.background.drawRect(0, 0, 50 - 4, 800);
        this.background.endFill();
        this.addChild(this.background);

        this.selectedTileText = new PIXI.Text("Selected Tile: " + 1, {
            font: "12px Arial",
            fill: "#FFFFFF",
            align: "left"
        });

        this.addChild(this.selectedTileText);

        function zoomIn() {
            // Merps
        }

        function zoomOut() {
            // Derps
        }


        this.addMenuButton("+", 0, 12, zoomIn);
        this.addMenuButton("-", 30, 12, zoomOut);
    }

    Menu.prototype = new PIXI.Container();
    Menu.prototype.constructor = Menu;

    Menu.prototype.addMenuButton = function (text, x, y, obj, callback) {
        var button = new PIXI.Text(text, {font: "40px Arial", fill: "#FFFFFF"});
        button.position.x = x;
        button.position.y = y;
        button.interactive = true;
        button.buttonMode = true;
        button.hitArea = new PIXI.Rectangle(0, 12, 30, 30);

        button.mousedown = button.touchstart = function (event) {
            this.data = event.data;
            button.style = {font: "40px Arial", fill: "#FF0000"};
        };

        button.mouseover = function (event) {
            this.data = event.data;
            button.style = {font: "40px Arial", fill: "#FFFF00"};
        };

        button.mouseup = button.touchend = function (event) {
            this.data = event.data;
            callback.call(obj);
            button.style = {font: "40px Arial", fill: "#FFFFFF"};
        };

        button.mouseupoutside = button.touchendoutside = function (event) {
            this.data = event.data;
            button.style = {font: "40px Arial", fill: "#FFFFFF"};
        };

        button.mouseout = function (event) {
            this.data = event.data;
            button.style = {font: "40px Arial", fill: "#FFFFFF"};
        };

        this.addChild(button);
    };

    global.Menu = Menu;

}(this));
