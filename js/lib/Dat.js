function datGUI (world) {
    var wGUI = new dat.GUI(),
        wFolder = wGUI.addFolder('World'),
        aFolder = wFolder.addFolder('Agents'),
        cFolder = wFolder.addFolder('Cheats'),
        coFolder = wFolder.addFolder('Collision');

    wFolder.add(world, 'pause').name('Pause');
    wFolder.add(world, 'useGraph').name('Use Graph');
    wFolder.add(world, 'useFlot').name('Use Flot');
    wFolder.add(world, 'numItems').name('# Entities');
    coFolder.add(world, 'cdType').name('CD Type');
    coFolder.add(world, 'maxChildren').name('Max Child');
    coFolder.add(world, 'maxDepth').name('Max Depth');

    cFolder.add(world.cheats, 'population').name('Show Pop #s');
    cFolder.add(world.cheats, 'walls').name('Show Walls #s');
    cFolder.add(world.cheats, 'grid').name('Show Grid');
    cFolder.add(world.cheats, 'quad').name('Show Quad');

    for (var a = 0; a < world.agents.length; a++) {
        var folder = aFolder.addFolder(world.agents[a].name + ' ' + a),
            pFolder = folder.addFolder('Pos Info');

        folder.add(world.agents[a], 'collision').listen().name('Collision');
        folder.add(world.agents[a], 'interactive').name('Interactive Agent');
        folder.add(world.agents[a].cheats, 'gridLocation').listen().name('Show GridPos');
        folder.add(world.agents[a].cheats, 'position').listen().name('Show Pos');
        folder.add(world.agents[a].cheats, 'name').listen().name('Show Name');
        folder.add(world.agents[a].cheats, 'id').listen().name('Show ID');
        pFolder.add(world.agents[a], 'direction').listen().name('Direction');
        pFolder.add(world.agents[a].position, 'x').listen().name('Pos X');
        pFolder.add(world.agents[a].position, 'y').listen().name('Pos Y');
        pFolder.add(world.agents[a].position, 'vx').listen().name('Vel X');
        pFolder.add(world.agents[a].position, 'vy').listen().name('Vel Y');
        pFolder.add(world.agents[a].gridLocation, 'x').listen().name('Grid X');
        pFolder.add(world.agents[a].gridLocation, 'y').listen().name('Grid Y');
    }
};
