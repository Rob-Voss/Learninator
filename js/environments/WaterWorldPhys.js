(function (global) {
    "use strict";

    class WaterWorldPhys extends MatterWorld {

        /**
         * World object contains many agents and walls and food and stuff
         * @name WaterWorld
         * @extends World
         * @constructor
         *
         * @returns {WaterWorldPhys}
         */
        constructor() {
            let renderOpts = {
                    antialiasing: true,
                    autoResize: false,
                    resizable: false,
                    transparent: false,
                    resolution: 1,///window.devicePixelRatio,
                    noWebGL: true,
                    width: 800,
                    height: 800
                },
                worldOpts = {
                    simSpeed: 1,
                    numEntities: 20
                };

            super([], worldOpts, renderOpts);
            // this.agents[0].load('zoo/wateragent.json');
            // this.agents[1].load('zoo/wateragent.json');

            return this;
        }
    }

    global.WaterWorldPhys = WaterWorldPhys;

}(this));
