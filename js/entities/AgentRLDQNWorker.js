(function (global) {
    "use strict";

    /**
     * Initialize the AgentRLDQN
     * @param {Vec} position
     * @param {Object} env
     * @param {Object} opts
     * @returns {AgentRLDQN}
     */
    var AgentRLDQNWorker = function (position, env, opts) {
        this.worker = true;
        AgentRLDQN.call(this, position, env, opts);

        this.name = "Agent RLDQN Worker";

        var _this = this,
            jEnv = JSON.stringify(this),
            jOpts = JSON.stringify(this.brainOpts);

        this.brain = new Worker('js/lib/external/rl.js');
        this.brain.onmessage = function (e) {
            var data = e.data;
            switch (data.cmd) {
            case 'init':
                if (data.msg === 'complete') {
                    console.log('init');
                }
                break;
            case 'act':
                if (data.msg === 'complete') {
                    console.log('act');
                }
                break;
            case 'learn':
                if (data.msg === 'complete') {
                    console.log('learn');
                }
                break;
            default:
                console.log('Unknown command: ' + data.cmd + ' message:' + data.msg);
                break;
            }
        };

        this.brain.postMessage({cmd: 'init', input: {env: jEnv, opts: jOpts}});

        return this;
    };

    AgentRLDQNWorker.prototype = Object.create(AgentRLDQN.prototype);
    AgentRLDQNWorker.prototype.constructor = AgentRLDQN;

    global.AgentRLDQNWorker = AgentRLDQNWorker;

}(this));
