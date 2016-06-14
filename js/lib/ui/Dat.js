/**
 *
 * @param world
 * @name datGUI
 * @constructor
 */
function datGUI (world) {
    var wGUI = new dat.GUI({resizable: true, autoPlace: true, name: 'World Controls'}),
        cFolder = wGUI.addFolder('World Options');
    // cFolder.add(world, 'pause').listen().name('Pause');

    for (var go in world.settings) {
        if (world.settings.hasOwnProperty(go)) {
            let ty = typeof world.settings[go];
            if (ty !== 'object') {
                if (go === 'cheats') {
                    cFolder.add(world.settings, go).listen().name(go);
                }
            } else {
               let folder = cFolder.addFolder(go.charAt(0).toUpperCase() + go.slice(1));
                for (var gp in world.settings[go]) {
                    if (world.settings[go].hasOwnProperty(gp)) {
                        let typ = typeof world.settings[go][gp];
                        if (typ !== 'object') {
                            folder.add(world.settings[go], gp).listen().name(gp);
                        }
                    }
                }
            }
        }
    }


    // Agent options
    // for (var a = 0; a < world.agents.length; a++) {
    //     var agent = world.agents[a],
    //         folder = aFolder.addFolder(agent.name + ' ' + a),
    //         acFolder = folder.addFolder('Agent Cheats');
    //
    //     if (agent.type !== 5) {
    //         // Actions
    //         folder.add(agent, 'save').listen().name('Save').onFinishChange(function () {
    //             var title = this.object.name + ' - ' + this.object.id.substring(0, 10);
    //             document.getElementById("agentBrainModalLabel").innerHTML = title;
    //             document.getElementById("brainModalContent").innerHTML = this.object.brainState;
    //             $('#agentBrainModal').modal('show');
    //         });
    //
    //         folder.add(agent, 'load').listen().name('Load').onFinishChange(function () {
    //             var title = this.object.name + ' - ' + this.object.id.substring(0, 10);
    //             document.getElementById("agentBrainModalLabel").innerHTML = title;
    //             document.getElementById("brainModalContent").innerHTML = '';
    //             $('#agentBrainModal').modal('show');
    //         });
    //
    //         folder.add(agent, 'reset').listen().name('Reset').onFinishChange(function () {
    //
    //         });
    //
    //         // Options
    //         folder.add(agent, 'collision').listen().name('Collision');
    //         folder.add(agent, 'interactive').listen().name('Interactive Agent');
    //
    //         // Set up the cheats
    //         for (var p in agent.cheats) {
    //             if (agent.cheats.hasOwnProperty(p)) {
    //                 acFolder.add(agent.cheats, p).listen().name(p);
    //             }
    //         }
    //     }
    // }

    wGUI.remember(world);
    //wFolder.open();
}
