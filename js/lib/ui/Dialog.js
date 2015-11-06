(function (global) {
    "use strict";

    var Dialog = function () {
        var guiObj = {
            id: 'main',
            component: 'Window',
            draggable: true,
            position: {x: 10, y: 10},
            width: 400,
            height: 240,
            padding: 5,
            z: 500,
            header: {
                id: 'title',
                skin: 'Header',
                text: 'Options',
                position: {
                    x: 0,
                    y: 0
                },
                height: 30
            },
            layout: [1, 3],
            children: [
                {
                    id: 'horizontalList',
                    component: 'List',
                    position: {x: 0, y: 5},
                    width: 390,
                    height: 70,
                    layout: [6, null],
                    children: [
                        {component: 'Button', position: 'center', width: 60, height: 60},
                        null,
                        {component: 'Button', position: 'center', width: 60, height: 60},
                        {component: 'Button', position: 'center', width: 60, height: 60},
                        {component: 'Button', position: 'center', width: 60, height: 60},
                        {component: 'Button', position: 'center', width: 60, height: 60},
                        {component: 'Button', position: 'center', width: 60, height: 60},
                        {component: 'Button', position: 'center', width: 60, height: 60},
                        {component: 'Button', position: 'center', width: 60, height: 60}
                    ]
                },
                {
                    id: 'textInput',
                    component: 'Layout',
                    position: {x: 0, y: 10},
                    width: 390,
                    height: 50,
                    padding: 5,
                    layout: [2, 1],
                    children: [
                        {
                            id: 'text1',
                            text: '',
                            component: 'Input',
                            position: {x: 0, y: 0},
                            width: 200,
                            height: 40
                        },
                        {
                            id: 'btnDone',
                            text: 'Done',
                            component: 'Button',
                            position: 'right center',
                            width: 55,
                            height: 40
                        }
                    ]
                },
                {
                    id: 'dialogActions',
                    component: 'Layout',
                    position: {x: 0, y: 5},
                    width: 390,
                    height: 60,
                    layout: [2, 1],
                    children: [
                        {
                            id: 'btnCancel',
                            skin: 'Button',
                            component: 'Button',
                            text: 'Cancel',
                            position: 'center left',
                            width: 100,
                            height: 50,
                            font: {
                                size: '22px',
                                family: 'Skranji',
                                color: 'red'
                            }
                        },
                        {
                            id: 'btnSave',
                            skin: 'Button',
                            component: 'Button',
                            text: 'Save',
                            position: 'center right',
                            width: 100,
                            height: 50,
                            font: {
                                size: '22px',
                                family: 'Skranji',
                                color: 'green'
                            }
                        }
                    ]
                }
            ]
        };

        function onAssetsLoaded() {
            return EZGUI.Theme.load(['../assets/UI/UI-theme.json'], function () {
                var guiContainer = EZGUI.create(guiObj, 'UI');

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

