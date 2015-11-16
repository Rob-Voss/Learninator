(function (global) {
    "use strict";

    PIXI.utils.textureCache = {};
    PIXI.utils.baseTextureCache = {};

    var Dialog = function () {
        var avatarGuiObj = {
            id: 'main',
            component: 'Window',
            skin: 'RoundWindow',
            draggable: true,
            position: {x: 10, y: 10},
            width: 400,
            height: 280,
            padding: 5,
            z: 1,
            header: {
                id: 'title',
                component: 'Header',
                skin: 'Header',
                text: 'Options',
                position: {x: 5, y: 5},
                width: 150,
                height: 30
            },
            layout: [1, null],
            children: [
                {
                    id: 'inputs',
                    component: 'Layout',
                    skin: 'Layout',
                    position: {x: 0, y: 0},
                    width: 390,
                    height: 280,
                    layout: [2, 3],
                    children: [
                        null,
                        {
                            id: 'text1',
                            text: '',
                            component: 'Input',
                            skin: 'Input',
                            position: {x: 5, y: 35},
                            width: 150,
                            height: 29
                        },
                        {
                            id: 'btnDone',
                            text: 'Done',
                            component: 'Button',
                            skin: 'Button',
                            position: {x: 0, y: 35},
                            width: 100,
                            height: 29
                        },
                        {
                            id: 'btnCancel',
                            component: 'Button',
                            skin: 'Button',
                            text: 'Cancel',
                            position: {x: 5, y: 15},
                            width: 100,
                            height: 29,
                            font: {
                                color: 'red'
                            }
                        },
                        {
                            id: 'btnSave',
                            component: 'Button',
                            skin: 'Button',
                            text: 'Save',
                            position: {x: 0, y: 15},
                            width: 100,
                            height: 29,
                            font: {
                                color: 'green'
                            }
                        }
                    ]
                }
            ]
        };

        function onAssetsLoaded() {
            var theme = 'grey';
            return EZGUI.Theme.load(['gui-themes/' + theme + '-theme/' + theme + '-theme.json'], function () {
                var guiContainer = EZGUI.create(avatarGuiObj, theme);

                EZGUI.components.btnSave.on('click', function (event) {
                    guiContainer.visible = false;
                });
                EZGUI.components.btnCancel.on('click', function (event) {
                    guiContainer.visible = false;
                });

                world.stage.addChild(guiContainer);

                return guiContainer;
            });
        }

        var _this = onAssetsLoaded();

        return _this;
    };

    global.Dialog = Dialog;

}(this));

