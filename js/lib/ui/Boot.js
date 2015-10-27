/**
 *
 * @param world
 * @name datGUI
 * @constructor
 */
function bootGUI (world) {
    var agentButtons = '',
        agentActions = document.getElementById("agentActions");
    for (var i = 0; i < world.agents.length; i++) {
        var agentId = world.agents[i].id.substring(0, 10),
            dropDownStart = '<button data-toggle="dropdown" class="btn btn-default dropdown-toggle"><span class="caret"></span></button><ul class="dropdown-menu">',
            dropDownEnd = '</ul></div>',
            divider = '<li class="divider"></li>';

        agentButtons += '<div class="btn-group">';
        agentButtons += '<button class="btn btn-default"> Agent ' + agentId + '</button>';
        agentButtons += dropDownStart +
            '<li><a href="#" onclick="world.agents[' + i + '].load(\'zoo/wateragent.json\');">Load Pre-Trained</a></li>' +
            '<li><a href="#" onclick="world.agents[' + i + '].reset();">Reset</a></li>' +
            divider +
            '<li><a href="#" onclick="">Something else here</a></li>' +
            dropDownEnd;
    }
    agentActions.innerHTML = agentButtons;

    var cheatInput = '<form>',
        worldCheats = document.getElementById('cheatsPanelWorldContent');
    for (var property in world.cheats) {
        if (world.cheats.hasOwnProperty(property)) {
            var type = typeof world.cheats[property],
                value = world.cheats[property];
            switch (type) {
                case 'boolean':
                    cheatInput += '<div class="checkbox"><label><input type="checkbox" onclick="">' + property + '</label></div>';
                    break;
                case 'number':
                    cheatInput += '<input value="' + value + '" type="number" class="form-control" placeholder="' + property + '">';
                    break;
            }
        }
    }
    worldCheats.innerHTML = cheatInput + '</form>';
}
