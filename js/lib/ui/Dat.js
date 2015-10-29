/**
 *
 * @param world
 * @name datGUI
 * @constructor
 */
function datGUI (world) {
    var wGUI = new dat.GUI({resizable: true, autoPlace: true, name: 'World Controls'}),
        wFolder = wGUI.addFolder('World'),
        aFolder = wFolder.addFolder('Agents'),
        eFolder = wFolder.addFolder('Entities'),
        cFolder = wFolder.addFolder('World Cheats'),
        coFolder = wFolder.addFolder('Collision');
    wFolder.add(world, 'pause').listen().name('Pause');
    wFolder.add(world, 'simSpeed', [1, 2, 3]).listen().name('simSpeed');

    // Set up the cheats
    for (var wc in world.cheats) {
        if (world.cheats.hasOwnProperty(wc)) {
            cFolder.add(world.cheats, wc).listen().name(wc);
        }
    }

    // Collision detection options
    coFolder.add(world.collision, 'type', ['quad', 'brute', 'grid']).listen().name('Collision Type').onFinishChange(function () {
        world.setCollisionDetection(this.object);
    });
    coFolder.add(world.collision, 'maxChildren').name('Max Childs');
    coFolder.add(world.collision, 'maxDepth').name('Max Depth');

    // Entity options
    var ecFolder = eFolder.addFolder('Entity Cheats');
    eFolder.add(world, 'numEntities').listen().name('# Entities');
    for (var p in world.entityOpts) {
        if (world.entityOpts.hasOwnProperty(p)) {
            if (p !== 'cheats') {
                eFolder.add(world.entityOpts, p).listen().name(p);
            } else {
                for (var cp in world.entityOpts.cheats) {
                    if (world.entityOpts.cheats.hasOwnProperty(cp)) {
                        ecFolder.add(world.entityOpts.cheats, cp).listen().name(cp);
                    }
                }
            }
        }
    }

    // Agent options
    for (var a = 0; a < world.agents.length; a++) {
        var agent = world.agents[a],
            folder = aFolder.addFolder(agent.name + ' ' + a),
            acFolder = folder.addFolder('Agent Cheats');

        if (agent.type !== 5) {
            // Actions
            folder.add(agent, 'save').listen().name('Save').onFinishChange(function () {
                var title = this.object.name + ' - ' + this.object.id.substring(0, 10);
                document.getElementById("agentBrainModalLabel").innerHTML = title;
                document.getElementById("brainModalContent").innerHTML = this.object.brainState;
                $('#agentBrainModal').modal('show');
            });

            folder.add(agent, 'load').listen().name('Load').onFinishChange(function () {
                var title = this.object.name + ' - ' + this.object.id.substring(0, 10);
                document.getElementById("agentBrainModalLabel").innerHTML = title;
                document.getElementById("brainModalContent").innerHTML = '';
                $('#agentBrainModal').modal('show');
            });

            folder.add(agent, 'reset').listen().name('Reset').onFinishChange(function () {

            });

            // Options
            folder.add(agent, 'collision').listen().name('Collision');
            folder.add(agent, 'interactive').listen().name('Interactive Agent');

            // Set up the cheats
            for (var p in agent.cheats) {
                if (agent.cheats.hasOwnProperty(p)) {
                    acFolder.add(agent.cheats, p).listen().name(p);
                }
            }
        }
    }

    wGUI.remember(world);
    wFolder.open();
}
