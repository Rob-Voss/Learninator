var wGUI = new dat.GUI(),
    wFolder = wGUI.addFolder('World'),
    aFolder = wFolder.addFolder('Agents'),
    cFolder = wFolder.addFolder('Cheats');

wFolder.add(world, 'pause').name('Pause');
wFolder.add(world, 'interactive').name('Interactive Entities');
wFolder.add(world, 'movingEntities').name('Moving Entities');
wFolder.add(world, 'numItems').name('# Entities');

cFolder.add(world.cheats, 'population').name('Population #s');
cFolder.add(world.cheats, 'walls').name('Walls #s');
cFolder.add(world.cheats, 'grid').name('Grid');

for (var a = 0; a < world.agents.length; a++) {
    var agent = world.agents[a],
        folder = aFolder.addFolder('Agent ' + a),
        acFolder = folder.addFolder('Cheats'),
        pFolder = folder.addFolder('Position');

    folder.add(agent, 'collision').listen().name('Collision');
    folder.add(agent, 'epsilon').step(0.001).min(0.000).max(1.000).listen().name('Epsilon');
    acFolder.add(agent.cheats, 'gridLocation').listen().name('GridLocation');
    acFolder.add(agent.cheats, 'position').listen().name('Position');
    acFolder.add(agent.cheats, 'name').listen().name('Name');
    pFolder.add(agent, 'direction').listen().name('Direction');
    pFolder.add(agent.position, 'x').listen().name('Pos X');
    pFolder.add(agent.position, 'y').listen().name('Pos Y');
    pFolder.add(agent.position, 'vx').listen().name('Vel X');
    pFolder.add(agent.position, 'vy').listen().name('Vel Y');
    pFolder.add(agent.gridLocation, 'x').listen().name('Grid X');
    pFolder.add(agent.gridLocation, 'y').listen().name('Grid Y');
}