(function (exports) {

    // The top-level functions that run the simulation
    // -----------------------------------------------

    // **start()** creates the lines and circles and starts the simulation.
    function start() {

        // In index.html, there is a canvas tag that the game will be drawn in.
        // Grab that canvas out of the DOM.  From it, get the drawing
        // context, an object that contains functions that allow drawing to the canvas.
        var screen = document.getElementById('circles-bouncing-off-lines').getContext('2d'),

        // `world` holds the current state of the world.
            world = {
                circles: [],

                // Set up the five lines.
                lines: [
                    makeLine({x: 100, y: 100}),
                    makeLine({x: 200, y: 100}),
                    makeLine({x: 150, y: 150}),
                    makeLine({x: 100, y: 200}),
                    makeLine({x: 220, y: 200}),
                ],

                dimensions: {
                    x: screen.canvas.width,
                    y: screen.canvas.height
                },

                // `timeLastCircleMade` is used in the periodic creation of new circles.
                timeLastCircleMade: 0
            };

        // **tick()** is the main simulation tick function.  It loops forever, running 60ish times a second.
        function tick() {

            // Update state of circles and lines.
            update(world);

            // Draw circles and lines.
            draw(world, screen);

            // Queue up the next call to tick with the browser.
            requestAnimationFrame(tick);
        }

        // Run the first game tick.  All future calls will be scheduled by
        // `tick()` itself.
        tick();
    }

    // Export `start()` so it can be run by index.html
    exports.start = start;

    // **update()** updates the state of the lines and circles.
    function update(world) {

        // Move and bounce the circles.
        updateCircles(world);

        // Create new circle if one hasn't been created for a while.
        createNewCircleIfDue(world);

        // Rotate the lines.
        updateLines(world);
    }

    // **updateCircles()** moves and bounces the circles.
    function updateCircles(world) {
        for (var i = world.circles.length - 1; i >= 0; i--) {
            var circle = world.circles[i];

            // Run through all lines.
            for (var j = 0; j < world.lines.length; j++) {
                var line = world.lines[j];

                // If `line` is intersecting `circle`, bounce circle off line.
                if (trig.isLineIntersectingCircle(circle, line)) {
                    physics.bounceCircle(circle, line);
                }
            }

            // Apply gravity to the velocity of `circle`.
            physics.applyGravity(circle);

            // Move `circle` according to its velocity.
            physics.moveCircle(circle);

            // Remove circles that are off screen.
            if (!isCircleInWorld(circle, world.dimensions)) {
                world.circles.splice(i, 1);
            }
        }
    }

    // **createNewCircleIfDue()** creates a new circle every so often.
    function createNewCircleIfDue(world) {
        var now = new Date().getTime();
        if (now - world.timeLastCircleMade > 400) {
            world.circles.push(makeCircle({x: world.dimensions.x / 2, y: -5}));

            // Update last circle creation time.
            world.timeLastCircleMade = now;
        }
    }

    // **updateLines()** rotates the lines.
    function updateLines(world) {
        for (var i = 0; i < world.lines.length; i++) {
            world.lines[i].angle += world.lines[i].rotateSpeed;
        }
    }

    // **draw()** draws the all the circles and lines in the simulation.
    function draw(world, screen) {
        // Clear away the drawing from the previous tick.
        screen.clearRect(0, 0, world.dimensions.x, world.dimensions.y);

        var bodies = world.circles.concat(world.lines);
        for (var i = 0; i < bodies.length; i++) {
            bodies[i].draw(screen);
        }
    }

    // **makeCircle()** creates a circle that has the passed `center`.
    function makeCircle(center) {
        return {
            center: center,
            velocity: {x: 0, y: 0},
            radius: 5,

            // The circle has its own built-in `draw()` function.  This allows
            // the main `draw()` to just polymorphicly call `draw()` on circles and lines.
            draw: function (screen) {
                screen.beginPath();
                screen.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2, true);
                screen.closePath();
                screen.fillStyle = "black";
                screen.fill();
            }
        };
    }

    // **makeLine()** creates a line that has the passed `center`.
    function makeLine(center) {
        return {
            center: center,
            len: 70,

            // Angle of the line in degrees.
            angle: 0,

            rotateSpeed: 0.5,

            // The line has its own built-in `draw()` function.  This allows
            // the main `draw()` to just polymorphicly call `draw()` on circles and lines.
            draw: function (screen) {
                var end1 = trig.lineEndPoints(this)[0];
                var end2 = trig.lineEndPoints(this)[1];

                screen.beginPath();
                screen.lineWidth = 1.5;
                screen.moveTo(end1.x, end1.y);
                screen.lineTo(end2.x, end2.y);
                screen.closePath();

                screen.strokeStyle = "black";
                screen.stroke();
            }
        };
    }

    // **isCircleInWorld()** returns true if `circle` is on screen.
    function isCircleInWorld(circle, worldDimensions) {
        return circle.center.x > -circle.radius &&
            circle.center.x < worldDimensions.x + circle.radius &&
            circle.center.y > -circle.radius &&
            circle.center.y < worldDimensions.y + circle.radius;
    }

    // Start
    // -----

    // When the DOM is ready, start the simulation.
    window.addEventListener('load', start);
})(this);
