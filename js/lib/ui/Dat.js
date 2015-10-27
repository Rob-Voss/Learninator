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
        cFolder = wFolder.addFolder('Cheats'),
        coFolder = wFolder.addFolder('Collision');

    wFolder.add(world, 'pause').listen().name('Pause');
    wFolder.add(world, 'numEntities').listen().name('# Entities');
    coFolder.add(world.collision, 'type', ['quad', 'brute', 'grid']).listen().name('Collision Type').onFinishChange(function () {
        //
    });
    coFolder.add(world.collision, 'maxChildren').name('Max Childs');
    coFolder.add(world.collision, 'maxDepth').name('Max Depth');

    // Set up the cheats
    cFolder.add(world.cheats, 'population').listen().name('Show Pop #s');
    cFolder.add(world.cheats, 'walls').listen().name('Show Walls #s');
    cFolder.add(world.cheats, 'grid').listen().name('Show Grid');
    cFolder.add(world.cheats, 'quad').listen().name('Show Quad');

    for (var a = 0; a < world.agents.length; a++) {
        if (world.agents[a].type !== 5) {
            var folder = aFolder.addFolder(world.agents[a].name + ' ' + a),
                acFolder = folder.addFolder('Cheats');
            // Set up the cheats
            acFolder.add(world.agents[a].cheats, 'gridLocation').listen().name('Show GridPos');
            acFolder.add(world.agents[a].cheats, 'position').listen().name('Show Pos');
            acFolder.add(world.agents[a].cheats, 'name').listen().name('Show Name');
            acFolder.add(world.agents[a].cheats, 'id').listen().name('Show ID');

            folder.add(world.agents[a], 'collision').listen().name('Collision');
            folder.add(world.agents[a], 'interactive').listen().name('Interactive Agent');

            folder.add(world.agents[a], 'load').listen().name('Load').onFinishChange(function () {
                var title = this.object.name + ' - ' + this.object.id.substring(0, 10);
                document.getElementById("agentBrainModalLabel").innerHTML = title;
                document.getElementById("brainModalContent").innerHTML = '';
                $('#agentBrainModal').modal('show');
            });

            folder.add(world.agents[a], 'save').listen().name('Save').onFinishChange(function () {
                var title = this.object.name + ' - ' + this.object.id.substring(0, 10);
                document.getElementById("agentBrainModalLabel").innerHTML = title;
                document.getElementById("brainModalContent").innerHTML = this.object.brainState;
                $('#agentBrainModal').modal('show');
            });

            folder.add(world.agents[a], 'reset').listen().name('Reset').onFinishChange(function () {
                //alert(world.agents[a].brainState);
            });
        }
    }

    wGUI.remember(world);
    wFolder.open();
}
