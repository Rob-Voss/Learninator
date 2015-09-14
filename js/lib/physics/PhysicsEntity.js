(function (global) {
    "use strict";

    // The physics entity will take on a shapes, collision
    // and type based on its parameters. These entities are
    // built as functional objects so that they can be
    // instantiated by using the 'new' keyword.

    /**
     *
     * @param collisionName represents the type of collision
     * @param type represents the collision detector's handling
     */
    var PhysicsEntity = function (collisionName, type, width, height, position) {
        var Collision = {
            // Elastic collisions refer to the simple cast where
            // two entities collide and a transfer of energy is
            // performed to calculate the resulting speed
            // We will follow Box2D's example of using
            // restitution to represent 'bounciness'
            elastic: function (restitution) {
                this.restitution = restitution || 0.2;
            },
            displace: function () {
                // While not supported in this engine
                // the displacement collisions could include
                // friction to slow down entities as they slide
                // across the colliding entity
            }
        };

        // Setup the defaults if no parameters are given
        // Type represents the collision detector's handling
        this.type = type || PhysicsEntity.DYNAMIC;

        // Collision represents the type of collision
        // another object will receive upon colliding
        this.collision = collisionName || PhysicsEntity.ELASTIC;

        // Take in a width and height
        this.width = width || 20;
        this.height = height || 20;

        // Store a half size for quicker calculations
        this.halfWidth = this.width * 0.5;
        this.halfHeight = this.height * 0.5;

        var collision = Collision[this.collision];
        collision.call(this);

        // Setup the positional data in 2D

        // Position
        this.position = position || new Vec();

        // Update the bounds of the object to recalculate
        // the half sizes and any other pieces
        this.updateBounds();
    };

    // Update bounds includes the rect's boundary updates
    PhysicsEntity.prototype.updateBounds = function () {
        this.halfWidth = this.width * 0.5;
        this.halfHeight = this.height * 0.5;
    };

    // Getters for the mid point of the rect
    PhysicsEntity.prototype.getMidX = function () {
        return this.halfWidth + this.position.x;
    };

    PhysicsEntity.prototype.getMidY = function () {
        return this.halfHeight + this.position.y;
    };

    // Getters for the top, left, right, and bottom of the rectangle
    PhysicsEntity.prototype.getTop = function () {
        return this.position.y;
    };

    PhysicsEntity.prototype.getLeft = function () {
        return this.position.x;
    };

    PhysicsEntity.prototype.getRight = function () {
        return this.position.x + this.width;
    };

    PhysicsEntity.prototype.getBottom = function () {
        return this.position.y + this.height;
    };


// Constants

// Engine Constants

// These constants represent the 3 different types of
// entities acting in this engine
// These types are derived from Box2D's engine that
// model the behaviors of its own entities/bodies

// Kinematic entities are not affected by gravity, and
// will not allow the solver to solve these elements
// These entities will be our platforms in the stage
    PhysicsEntity.KINEMATIC = 'kinematic';

// Dynamic entities will be completely changing and are
// affected by all aspects of the physics system
    PhysicsEntity.DYNAMIC = 'dynamic';

// Solver Constants

// These constants represent the different methods our
// solver will take to resolve collisions

// The displace resolution will only move an entity
// outside of the space of the other and zero the
// velocity in that direction
    PhysicsEntity.DISPLACE = 'displace';

// The elastic resolution will displace and also bounce
// the colliding entity off by reducing the velocity by
// its restituion coefficient
    PhysicsEntity.ELASTIC = 'elastic';

    global.PhysicsEntity = PhysicsEntity;

}(this));