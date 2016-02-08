(function (global) {
    "use strict";

    /**
     * @name Menu
     * @constructor
     */

    var Menu = function (opts) {
        PIXI.Container.call(this);
        this.interactive = true;

        this.menuX = Utility.getOpt(opts.menu, 'x', 0);
        this.menuY = Utility.getOpt(opts.menu, 'y', 0);
        this.menuWidth = Utility.getOpt(opts.menu, 'width', 20);
        this.menuHeight = Utility.getOpt(opts.menu, 'height', 20);
        this.renderWidth = Utility.getOpt(opts.render, 'width', 100);
        this.renderHeight = Utility.getOpt(opts.render, 'height', 100);

        this.background = new PIXI.Graphics();
        this.background.lineStyle(1, 0x000000, 1);
        this.background.beginFill(0xA08000, 1);
        this.background.drawRect(this.menuX + 4, this.menuY + 4, this.menuWidth, this.menuHeight);
        this.background.endFill();
        this.background.lineStyle(0, 0x000000, 1);
        this.background.beginFill(0x203040, 1);
        this.background.drawRect(this.menuX + 6, this.menuY + 6, this.menuWidth - 4, this.menuHeight - 4);
        this.background.endFill();
        this.addChild(this.background);

        this.selectedTileText = new PIXI.Text("Selected Agent: ", {font: "10px Arial", fill: "#FFFFFF", align: "left"});
        this.selectedTileText.x = this.menuX + 8;
        this.selectedTileText.y = this.menuY + 8;
        this.addChild(this.selectedTileText);

        function zoomIn() {
        }

        function zoomOut() {
        }

        this.addMenuButton("+", this.menuX + 8, this.menuY + 10, zoomIn);
        this.addMenuButton("-", this.menuX + 8, this.menuY + 20, zoomOut);
    };

    Menu.prototype = new PIXI.Container();
    Menu.prototype.constructor = Menu;

    Menu.prototype.addMenuButton = function (text, x, y, obj, callback) {
        var button = new PIXI.Text(text, {font: "20px Arial", fill: "#FFFFFF"});
        button.pos.x = x;
        button.pos.y = y;
        button.interactive = true;
        button.buttonMode = true;
        button.hitArea = new PIXI.Rectangle(x, y, button.width, button.height);

        button.mousedown = button.touchstart = function (event) {
            this.data = event.data;
            button.style = {fill: "#FF0000"};
        };

        button.mouseover = function (event) {
            this.data = event.data;
            button.style = {fill: "#FFFF00"};
        };

        button.mouseup = button.touchend = function (event) {
            this.data = event.data;
            callback.call(obj);
            button.style = {fill: "#FFFFFF"};
        };

        button.mouseupoutside = button.touchendoutside = function (event) {
            this.data = event.data;
            button.style = {fill: "#FFFFFF"};
        };

        button.mouseout = function (event) {
            this.data = event.data;
            button.style = {fill: "#FFFFFF"};
        };

        this.addChild(button);
    };

    global.Menu = Menu;

}(this));
