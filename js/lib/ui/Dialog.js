(function (global) {
    "use strict";

    var Dialog = function () {
        var avatarGuiObj = {
            id: 'main',
            component: 'Window',
            skin: 'GreenMetalWindow',
            draggable: true,
            position: {x: 10, y: 10},
            width: 400,
            height: 280,
            padding: 3,
            z: 1,
            header: {
                id: 'title',
                component: 'Header',
                skin: 'BlueHeader',
                text: 'Options',
                position: {x: 10, y: 10},
                width: 375,
                height: 30
            },
            layout: [2, 2],
            children: [
                {
                    id: 'inputs',
                    component: 'Layout',
                    skin: 'Layout',
                    position: {x: 30, y: 10},
                    width: 330,
                    height: 170,
                    layout: [2, 2],
                    children: [
                        {
                            id: 'horizontalList',
                            component: 'List',
                            skin: 'List',
                            position: {x: 5, y: 5},
                            width: 300,
                            height: 70,
                            layout: [4, null],
                            children: [
                                {component: 'hListItem', skin: 'hListItem', position: 'center', width: 60, height: 56},
                                {component: 'hListItem', skin: 'hListItem', position: 'center', width: 49, height: 45},
                                {component: 'hListItem', skin: 'hListItem', position: 'center', width: 49, height: 45},
                                {component: 'hListItem', skin: 'hListItem', position: 'center', width: 49, height: 45},
                                {component: 'hListItem', skin: 'hListItem', position: 'center', width: 49, height: 45},
                                {component: 'hListItem', skin: 'hListItem', position: 'center', width: 49, height: 45}
                            ]
                        },
                        null,
                        {
                            id: 'text1',
                            text: '',
                            component: 'Input',
                            skin: 'Input',
                            position: {x: 5, y: 15},
                            width: 150,
                            height: 29
                        },
                        {
                            id: 'btnDone',
                            text: 'Done',
                            component: 'Button',
                            skin: 'Button',
                            position: {x: 20, y: 15},
                            width: 100,
                            height: 29
                        }
                    ]
                },
                null,
                {
                    id: 'btnCancel',
                    component: 'Button',
                    skin: 'BlueButton',
                    text: 'Cancel',
                    position: {x: 30, y: 60},
                    width: 100,
                    height: 29,
                    font: {
                        size: '22px',
                        color: 'red'
                    }
                },
                {
                    id: 'btnSave',
                    component: 'Button',
                    skin: 'BlueButton',
                    text: 'Save',
                    position: {x: 60, y: 60},
                    width: 100,
                    height: 29,
                    font: {
                        size: '22px',
                        color: 'green'
                    }
                }
            ]
        };

        function onAssetsLoaded() {
            var theme = 'UI';
            return EZGUI.Theme.load(['js/lib/ui/assets/' + theme + '-theme/' + theme + '-theme.json'], function () {
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

