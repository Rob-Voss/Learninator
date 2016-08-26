/**
 *
 * @param object
 * @name datGUI
 * @constructor
 */
function datGUI (object) {
    var wGUI = new dat.GUI({resizable: true, autoPlace: true, name: 'Controls'}),
        sFolder = wGUI.addFolder('Settings');

    for (var go in object.settings) {
        if (object.settings.hasOwnProperty(go)) {
            let ty = typeof object.settings[go];
            if (ty !== 'object') {
                sFolder.add(object.settings, go).listen().name(go);
            } else {
               let folder = sFolder.addFolder(go.charAt(0).toUpperCase() + go.slice(1));
                for (var gp in object.settings[go]) {
                    if (object.settings[go].hasOwnProperty(gp)) {
                        let typ = typeof object.settings[go][gp];
                        if (typ !== 'object') {
                            folder.add(object.settings[go], gp).listen().name(gp);
                        }
                    }
                }
            }
        }
    }
    var fFolder = wGUI.addFolder('Functions');
    for (var fo in object.functions) {
        if (object.functions.hasOwnProperty(fo)) {
            fFolder.add(object.functions, fo).listen().name(fo);
        }
    }
    wGUI.remember(object);
}
