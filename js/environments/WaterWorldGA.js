(function (global) {
    "use strict";

    const
        BACKSPACE = 8,
        CONTROL = 17,
        DELETE = 46,
        DOWN_ARROW = 40,
        ENTER = 13,
        ESCAPE = 27,
        LEFT_ARROW = 37,
        OPTION = 18,
        RETURN = 13,
        RIGHT_ARROW = 39,
        SHIFT = 16,
        TAB = 9,
        UP_ARROW = 38;

    var convnetjs = global.convnetjs || {},
        RL = global.RL,
        GATrainer = RL.GATrainer || {},
        Maze = global.Maze || {},
        Vec = global.Vec || {},
        World = global.World || {},

        renderOpts = {
            antialiasing: false,
            autoResize: false,
            resizable: false,
            transparent: false,
            resolution: window.devicePixelRatio,
            noWebGL: false,
            width: 600,
            height: 600
        },

        cheats = {
            id: false,
            name: false,
            angle: false,
            bounds: false,
            direction: false,
            gridLocation: false,
            position: false,
            walls: false
        },

        worldOpts = {
            collision: {
                type: 'brute'
            },
            cheats: cheats,
            numEntities: 1,
            entityOpts: {
                radius: 10,
                interactive: true,
                useSprite: false,
                moving: true,
                cheats: cheats,
            }
        },

        gridOptions = {
            width: renderOpts.width,
            height: renderOpts.height,
            cheats: cheats,
            buffer: 0,
            cellSize: 200,
            cellSpacing: 0,
            size: 1,
            pointy: false,
            fill: false
        },

        agentOpts = {
            brainType: 'RL.GATrainer',
            numActions: 4,
            numEyes: 30,
            numTypes: 5,
            numProprioception: 2,
            range: 120,
            proximity: 120,
            radius: 10,
            collision: true,
            interactive: false,
            useSprite: false,
            cheats: cheats
        },

        showArrowKeys = true,
        ref_w = 24,
        ref_h = ref_w,
        // ground height
        ref_u = 1.5,
        // wall width
        ref_wallwidth = 1.0,
        ref_wallheight = 3.5,
        factor = 1,
        playerSpeedX = 10,
        playerSpeedY = 10,
        maxBallSpeed = 15,
        gravity,
        timeStep = 1 / 30,
        theFrameRate = 60 * 1,
        nudge = 0.1,
        // 1 means no friction, less means friction
        friction = 1.0,
        windDrag = 1.0,
        initDelayFrames = 30 * 2 * 1,
        // assume each match is 7 seconds. (vs 30fps)
        trainingFrames = 30 * 20,
        theGravity = -9.8 * 2,
        trainingMode = false,
        // if this is true, then player 1 is controlled by keyboard
        human1 = false,
        human2 = false,
        humanHasControlled = false,
        trainer = null,
        generationCounter = 0,
        baseScoreFontSize = 64,
        trainingVersion = false,
        initGeneJSON1 = '{"fitness":1.5,"nTrial":0,"gene":{"0":5.8365,"1":1.4432,"2":3.1023,"3":0.2617,"4":-3.5896,"5":-1.0675,"6":-5.3384,"7":0.8505,"8":-3.1851,"9":-5.6325,"10":-3.2459,"11":0.7676,"12":1.321,"13":-1.4931,"14":-1.1353,"15":-0.2911,"16":1.164,"17":0.8755,"18":-1.1329,"19":0.3585,"20":-3.9182,"21":0.325,"22":-0.3397,"23":-0.2513,"24":0.5678,"25":1.9984,"26":0.7691,"27":2.6176,"28":1.791,"29":-0.9755,"30":1.8437,"31":0.4196,"32":0.5471,"33":-2.6769,"34":1.6382,"35":1.1442,"36":7.1792,"37":2.4046,"38":0.5512,"39":2.8792,"40":0.6744,"41":3.8023,"42":-2.704,"43":2.872,"44":-3.7659,"45":-1.7561,"46":-1.5691,"47":-5.0168,"48":-3.1482,"49":0.4531,"50":6.3125,"51":0.2956,"52":2.5486,"53":-0.3944,"54":-2.7155,"55":-5.5154,"56":-1.1787,"57":-3.8094,"58":-2.0738,"59":-4.0264,"60":3.3217,"61":11.0153,"62":2.8341,"63":-0.2914,"64":4.8417,"65":-0.9244,"66":-3.2621,"67":-0.2639,"68":-1.3825,"69":-1.1969,"70":0.7021,"71":-4.1637,"72":-1.5203,"73":-3.1297,"74":-1.7193,"75":-2.1526,"76":4.2902,"77":1.4272,"78":-0.6137,"79":1.1164,"80":-0.0067,"81":1.0377,"82":-0.2344,"83":-0.3008,"84":-2.3273,"85":2.4405,"86":-2.3012,"87":-1.9193,"88":-3.7453,"89":1.44,"90":-4.5812,"91":-1.9701,"92":2.3101,"93":-4.2018,"94":-3.0907,"95":1.7332,"96":-3.311,"97":-2.2417,"98":-1.9073,"99":5.5644,"100":2.5601,"101":3.2058,"102":0.7374,"103":-3.6406,"104":-0.6569,"105":2.5963,"106":3.074,"107":-4.7564,"108":1.0644,"109":-0.7439,"110":-0.2318,"111":1.1902,"112":-2.2391,"113":1.5935,"114":-4.6269,"115":-2.0589,"116":-2.2949,"117":-0.4391,"118":7.0848,"119":4.902,"120":-0.929,"121":3.1709,"122":0.163,"123":-1.6548,"124":-0.0521,"125":0.3726,"126":-1.3681,"127":-0.2623,"128":-1.4581,"129":0.3422,"130":1.1412,"131":-0.2376,"132":0.7743,"133":3.0866,"134":-3.6638,"135":-0.9372,"136":2.5364,"137":-1.3026,"138":-1.7666,"139":-0.1401}}',
        initGeneJSON2 = '{"fitness":1.2,"nTrial":0,"gene":{"0":6.5097,"1":2.3385,"2":0.1029,"3":0.5598,"4":-6.3998,"5":-1.2678,"6":-4.4426,"7":0.8709,"8":-4.4122,"9":-7.7086,"10":0.769,"11":2.1251,"12":0.8503,"13":-0.8715,"14":-0.9924,"15":0.0656,"16":1.0124,"17":0.1899,"18":-2.8846,"19":0.3021,"20":-6.7481,"21":0.3985,"22":-4.174,"23":1.1515,"24":-1.4622,"25":-0.5959,"26":0.5139,"27":2.9706,"28":2.043,"29":0.189,"30":1.3854,"31":-4.0551,"32":-2.7276,"33":-5.0728,"34":4.6398,"35":4.0611,"36":9.7766,"37":0.7044,"38":0.8835,"39":4.2447,"40":0.4375,"41":1.0766,"42":-1.8893,"43":-0.6249,"44":-3.2812,"45":-0.7335,"46":-3.1081,"47":-4.3488,"48":-2.7436,"49":0.7618,"50":8.131,"51":-0.967,"52":3.6646,"53":2.5841,"54":-2.7902,"55":-6.0235,"56":-3.595,"57":-1.7922,"58":-3.8774,"59":-2.701,"60":3.674,"61":13.4126,"62":3.4967,"63":-0.7306,"64":2.8581,"65":-1.6179,"66":-5.6636,"67":-0.8102,"68":-2.6126,"69":-1.5072,"70":1.3759,"71":-4.8595,"72":0.3855,"73":-3.3951,"74":-3.4629,"75":1.0211,"76":3.0887,"77":-1.372,"78":0.7817,"79":-1.4717,"80":1.3833,"81":1.4233,"82":-1.5142,"83":-1.7674,"84":-2.4652,"85":1.913,"86":-2.3676,"87":-1.0603,"88":-6.4953,"89":0.4749,"90":-5.6628,"91":-1.6198,"92":-0.4882,"93":-4.4501,"94":-5.0181,"95":1.9535,"96":-3.4906,"97":0.1522,"98":-0.4891,"99":6.3273,"100":2.2241,"101":2.1854,"102":6.0501,"103":-0.2328,"104":-0.542,"105":4.1188,"106":2.343,"107":-4.705,"108":1.4819,"109":-2.1852,"110":-0.2348,"111":-0.6274,"112":0.7755,"113":3.2003,"114":-6.7855,"115":-3.9196,"116":-3.1513,"117":-1.4553,"118":6.7805,"119":5.0117,"120":-0.4204,"121":2.3323,"122":-2.7064,"123":-1.9625,"124":-3.5944,"125":2.7761,"126":-1.4873,"127":-0.477,"128":-1.4658,"129":0.2057,"130":0.4323,"131":-0.8676,"132":-0.9874,"133":2.4903,"134":-3.1455,"135":-2.6227,"136":5.2044,"137":-0.6598,"138":1.6745,"139":1.5329}}',
        initGeneRaw = JSON.parse(initGeneJSON2),
        initGene = convnetjs.zeros(Object.keys(initGeneRaw.gene).length); // Float64 faster.
    for (let i = 0; i < initGene.length; i++) {
        initGene[i] = initGeneRaw.gene[i];
    }

// declare objects
    var game = {
        ball: null,
        deadball: null,
        ground: null,
        fence: null,
        fenceStub: null,
        agent1: null,
        agent2: null
    };

// deal with mobile device nuances
    var mobileMode = false;
    var md = null;

// conversion to pixels
    function toX(x) {
        return (x + ref_w / 2) * factor;
    }

    function toP(x) {
        return (x) * factor;
    }

    function toY(y) {
        return height - y * factor;
    }

    var delayScreen = {
        life: initDelayFrames,
        init: function (life) {
            this.life = life;
        },
        status: function () {
            if (this.life === 0) {
                return true;
            }
            this.life -= 1;
            return false;
        }
    };
// When the mouse is released
    var deviceReleased = function () {
        "use strict";
    };

// When the mouse is pressed we. . .
    var devicePressed = function (x, y) {
        "use strict";
    };

    var deviceDragged = function (x, y) {
        "use strict";
    };

    var mousePressed = function () {
        "use strict";
        devicePressed(mouseX, mouseY);
        return false;
    };

    var touchStarted = function () {
        "use strict";
        devicePressed(touchX, touchY);
        return false;
    };

// interaction with touchpad and mosue:

    var mouseDragged = function () {
        "use strict";
        deviceDragged(mouseX, mouseY);
        return false;
    };

    var touchMoved = function () {
        "use strict";
        return false;
    };

    var mouseReleased = function () {
        "use strict";
        return false;
    };

    var touchEnded = function () {
        "use strict";
        return false;
    };

    function keyboardControl() {
        // player 1:
        var a1_forward = 68, // 'd' key
            a1_backward = 65, // 'a' key
            a1_jump = 87, // 'w' key
            // player 2:
            a2_forward = LEFT_ARROW,
            a2_backward = RIGHT_ARROW,
            a2_jump = UP_ARROW;

        if (keyIsDown(a1_forward) || keyIsDown(a1_backward) || keyIsDown(a1_jump)) {
            human1 = true;
            humanHasControlled = true;
        }
        if (human1) {
            game.agent1.setAction(keyIsDown(a1_forward), keyIsDown(a1_backward), keyIsDown(a1_jump));
        }

        if (keyIsDown(a2_forward) || keyIsDown(a2_backward) || keyIsDown(a2_jump)) {
            human2 = true;
            humanHasControlled = true;
        }
        if (human2) {
            game.agent2.setAction(keyIsDown(a2_forward), keyIsDown(a2_backward), keyIsDown(a2_jump));
        }

    }

    function touchControl() {
        "use strict";
        var paddingY = height / 64;
        var paddingX = width / 64;
        var dx = 0;
        var dy = 0;
        var x = 0;
        var y = 0;
        var agentX = toX(game.agent2.loc.x);
        var agentY = toY(game.agent2.loc.y);
        var jumpY = toY(ref_wallheight * 2);
        var gestureEvent = false;

        if (touchIsDown) {
            x = touchX;
            y = touchY;
            dx = touchX - ptouchX;
            dy = touchY - ptouchY;
            gestureEvent = true;
        }

        if (mouseIsPressed) {
            x = mouseX;
            y = mouseY;
            dx = mouseX - pmouseX;
            dy = mouseY - pmouseY;
            gestureEvent = true;
        }

        if (gestureEvent) {
            human2 = true;
            humanHasControlled = true;
            game.agent2.setAction((x - agentX) < -paddingX, (x - agentX) > paddingX, dy < -paddingY);
        }

    }

// between end of this match to the next match.  guy wins jumps, guy who loses regrets...
    function betweenGameControl() {
        "use strict";
        var agent = [game.agent1, game.agent2];
        if (delayScreen.life > 0) {
            for (var i = 0; i < 2; i++) {
                if (agent[i].emotion === "happy") {
                    agent[i].action.jump = true;
                } else {
                    agent[i].action.jump = false;
                }
            }
        } else {
            agent[0].emotion = "happy";
            agent[1].emotion = "happy";
        }
    }

    class Trainer {

        /**
         *
         * @param brain
         * @param initialGene
         * @constructor
         */
        constructor(brain, initialGene) {
            this.net = new convnetjs.Net();
            this.net.makeLayers(brain.layerDefs);

            this.trainer = new RL.GATrainer(this.net, {
                populationSize: 50,
                mutationSize: 0.1,
                mutationRate: 0.05,
                numMatch: 4 * 2,
                elitePercentage: 0.20
            }, initialGene ? initialGene : initGene);

            return this;
        }

        /**
         * Returns a copy of the nth best chromosome
         * if one isn't provided it returns first one, which is the best one
         * @param n
         * @return {*}
         */
        getChromosome(n) {
            n = n || 0;
            return this.trainer.chromosomes[n].clone();
        }

        /**
         *
         */
        train() {
            this.trainer.matchTrain(this.matchFunction);
        }

        /**
         * This function is passed to trainer.
         * @param chromosome
         * @return {Number} - result -1=c1 beat 22, 1=c2 beat c1, 0=tie
         */
        matchFunction(chromosome1, chromosome2) { // this function is passed to trainer.
            var result = 0,
                oldInitDelayFrames = initDelayFrames;
            initDelayFrames = 1;
            trainingMode = true;
            initGame();
            // put chromosomes into brains before getting them to duel it out.
            this.agents[0].brain.populate(chromosome1);
            this.agents[1].brain.populate(chromosome2);
            result = update(trainingFrames); // the dual
            trainingMode = false;
            initDelayFrames = oldInitDelayFrames;
            return result; // -1 means chromosome1 beat chromosome2, 1 means vice versa, 0 means tie.
        }
    }

    class WaterWorldGA extends World {

        /**
         * World object contains many agents and walls and food and stuff
         * @name WaterWorldGA
         * @extends World
         * @constructor
         *
         * @return {WaterWorldGA}
         */
        constructor() {
            let grid = new Grid(gridOptions),
                maze = new Maze(grid.init()),
                agents = [
                    new AgentGA(new Vec(grid.startCell.center.x, grid.startCell.center.y), agentOpts),
                    new AgentGA(new Vec(grid.startCell.center.x, grid.startCell.center.y), agentOpts)
                ];

            worldOpts.grid = maze.grid;
            super(agents, maze.walls, worldOpts, renderOpts);

            this.entityLayer = [];
            for (let [id, entity] of this.population.entries()) {
                if (entity.type !== 3) {
                    this.entityLayer[0] = entity;
                }
            }
            this.agents[0].setTarget(this.agents[1]);
            this.agents[1].setTarget(this.agents[0]);

            this.trainer = new Trainer(this.agents[0].brain);
            // best one
            this.agents[0].brain.populate(this.trainer.getChromosome());
            // best one
            this.agents[1].brain.populate(this.trainer.getChromosome());

            return this;
        }

        tick() {
            this.update(1);
            let genStep = 50;
            for (let i = 0; i < genStep; i++) {
                this.trainer.train();
            }
            // best one
            this.agents[0].brain.populate(this.trainer.getChromosome(0));
            // second best one
            this.agents[1].brain.populate(this.trainer.getChromosome(1));
        }

        /**
         *
         * @param nStep
         * @return {number}
         */
        update(nStep) {
            let result = 0;
            for (let step = 0; step < nStep; step++) {
                // ai here
                // update internal states
                this.agents[0].getState(this.entityLayer[0]);
                this.agents[1].getState(this.entityLayer[0]);
                // push states to brain
                this.agents[0].brain.setCurrentInputState(this.agents[0], this.agents[1]);
                this.agents[1].brain.setCurrentInputState(this.agents[1], this.agents[0]);
                // make a decision
                this.agents[0].brain.forward();
                this.agents[1].brain.forward();
                // convert brain's output signals into game actions
                this.agents[0].setBrainAction();
                this.agents[1].setBrainAction();

                // get human keyboard control
                if (!trainingMode) {
                    // keyboardControl(); // may want to disable this for speed.
                    // touchControl(); // mobile device
                    // betweenGameControl();
                }

                // process actions
                this.agents[0].processAction();
                this.agents[1].processAction();
                this.agents[0].update(this);
                this.agents[1].update(this);

                if (delayScreen.status() === true) {
                    game.ball.applyAcceleration(gravity);
                    game.ball.limitSpeed(0, maxBallSpeed);
                    game.ball.move();
                }

                if (game.ball.isColliding(game.agent1)) {
                    game.ball.bounce(game.agent1);
                }
                if (game.ball.isColliding(game.agent2)) {
                    game.ball.bounce(game.agent2);
                }
                if (game.ball.isColliding(game.fenceStub)) {
                    game.ball.bounce(game.fenceStub);
                }

                result = game.ball.checkEdges();
                if (Math.abs(result) > 0) {
                    // make graphics for dead ball
                    if (!trainingMode) {
                        game.deadball = new Particle(game.ball.loc.copy());
                        game.deadball.r = 0.25;
                        game.deadball.life = initDelayFrames;
                    }
                    initGame();
                    if (!trainingMode) {
                        console.log('player ' + (result > 0 ? '1' : '2') + ' won.');
                        if (result > 0) {
                            game.agent1.score += 1;
                            game.agent1.scoreSize *= 4;
                            game.agent1.emotion = "happy";
                            game.agent2.emotion = "sad";
                        } else {
                            game.agent2.score += 1;
                            game.agent2.scoreSize *= 4;
                            game.agent2.emotion = "happy";
                            game.agent1.emotion = "sad";
                        }
                    }
                    return result;
                }

                // 0 means tie,
                // -1 means landed on left side,
                // 1 means landed on right side.
                return result;
            }
        }
    }
    global.WaterWorldGA = WaterWorldGA;

}(this));
