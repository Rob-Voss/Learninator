/**
 *
 * @param object
 * @name datGUI
 * @constructor
 */
function datGUI (object) {
    var wGUI = new dat.GUI({resizable: true, autoPlace: true, name: 'Controls'}),
        sFolder = wGUI.addFolder('Settings'),
        settings = object.settings || object.options;

    for (let go in settings) {
        if (settings.hasOwnProperty(go)) {
            let ty = typeof settings[go];
            if (ty === 'number') {
                sFolder.add(settings, go).listen().name(go).onFinishChange(function(){
                    // object.draw();
                }).step(0.1);
            } else if (ty !== 'object') {
                sFolder.add(settings, go).listen().name(go).onFinishChange(function(){
                    // object.draw();
                });
            } else {
               let folder = sFolder.addFolder(go.charAt(0).toUpperCase() + go.slice(1));
                for (var gp in settings[go]) {
                    if (settings[go].hasOwnProperty(gp)) {
                        let typ = typeof settings[go][gp];
                        if (typ !== 'object') {
                            folder.add(settings[go], gp).listen().name(gp).onFinishChange(function(){
                                // object.draw();
                            });
                        }
                    }
                }
            }
        }
    }
    var fFolder = wGUI.addFolder('Functions');
    for (let fo in object.functions) {
        if (object.functions.hasOwnProperty(fo)) {
            let ty = typeof object.functions[fo];
            if (ty === 'function') {
                fFolder.add(object.functions, fo).listen().name(fo);
            } else {
                let folder = fFolder.addFolder(fo.charAt(0).toUpperCase() + fo.slice(1));
                for (var gp in object.functions[fo]) {
                    if (object.functions[fo].hasOwnProperty(gp)) {
                        let typ = typeof object.functions[fo][gp];
                        if (typ === 'function') {
                            folder.add(object.functions[fo], gp).listen().name(gp);
                        }
                    }
                }
            }
        }
    }
    wGUI.remember(object);
}
