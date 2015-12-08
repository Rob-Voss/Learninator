var Phys = Phys || {};

(function (global) {
    "use strict";

// CLASSES
    var Manifold = function () {
        this.a = null; // AABB
        this.b = null; // AABB
        this.penetration = 0;
        this.normal = null; // Vector2D
    };

    var rv = new Vec(),
        _impulse = new Vec(),
        //trac = 0,
        normal = new Vec(),
        manifold = new Manifold();

    Phys.AABB = function (x, y, settings) {
        // internal
        var self = this;

        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;

        this.min = new Vec();
        this.max = new Vec();

        this.mass = 100; // 0 is immobile
        this.invmass = 0;
        this.restitution = 1; // bounciness
        this.velocity = new Vec(Math.random() * 70 - 35, Math.random() * 70 - 35);

        // this.scratchVec = new Vec();
        this.update = function () {
            self.x += self.velocity.x * Phys.elapsed;
            self.y += self.velocity.y * Phys.elapsed;

            if (self.x < 0) {
                self.x = 0;
                self.velocity.x = -self.velocity.x;
            } else if (self.x + self.width > Phys.worldWidth) {
                self.x = Phys.worldWidth - self.width;
                self.velocity.x = -self.velocity.x;
            }
            if (self.y < 0) {
                self.y = 0;
                self.velocity.y = -self.velocity.y;
            } else if (self.y + self.height > Phys.worldHeight) {
                self.y = Phys.worldHeight - self.height;
                self.velocity.y = -self.velocity.y;
            }

            self.min.reset(self.x, self.y);
            self.max.reset(self.x + self.width, self.y + self.height);
        };

        this.setMass = function (newMass) {
            this.mass = newMass;
            if (newMass <= 0) {
                this.invmass = 0;
            } else {
                this.invmass = 1 / newMass;
            }
        };

        this.draw = function () {
            Phys.ctx.fillStyle = 'rgba(0, 10, 150, 0.5)'; // DEBUG
            Phys.ctx.fillRect(self.x, self.y, self.width, self.height); // DEBUG
        };

        if (typeof _settings !== 'undefined') {
            for (var attr in _settings) {
                if (self.hasOwnProperty(attr)) self[attr] = _settings[attr];
            }
        }

        self.setMass(self.mass); // make sure invmass is set
        // console.log(_self);
    };

    Phys.AABBvsAABB = function (a, b) {
        if (a.max.x < b.min.x || a.min.x > b.max.x) return false;
        if (a.max.y < b.min.y || a.min.y > b.max.y) return false;
        // if (a.max.z < b.min.z || a.min.z > b.max.z) return false;
        return true;
    };

    Phys.overlapAABB = function (a, b) {
        // Vector from A to B
        normal.reset(b.x - a.x, b.y - a.y);

        // Calculate half extents along x axis for each object
        var a_extent = (a.max.x - a.min.x) / 2;
        var b_extent = (b.max.x - b.min.x) / 2;

        // Calculate overlap on x axis
        var x_overlap = a_extent + b_extent - Math.abs(normal.x);

        // SAT test on x axis
        if (x_overlap > 0) {
            a_extent = (a.max.y - a.min.y) / 2; // var
            b_extent = (b.max.y - b.min.y) / 2;

            // Calculate overlap on y axis
            var y_overlap = a_extent + b_extent - Math.abs(normal.y);

            // SAT test on y axis
            if (y_overlap > 0) {
                // Find out which axis is axis of least penetration
                if (x_overlap < y_overlap) {
                    // Point towards B knowing that dist points from A to B
                    if (normal.x < 0) {
                        manifold.normal = normal.reset(-1, 0);
                    } else {
                        manifold.normal = normal.reset(1, 0);
                    }
                    manifold.penetration = x_overlap;
                    return manifold;
                } else {
                    // Point toward B knowing that dist points from A to B
                    if (normal.y < 0) {
                        manifold.normal = normal.reset(0, -1);
                    } else {
                        manifold.normal = normal.reset(0, 1);
                    }
                    manifold.penetration = y_overlap;
                    return manifold;
                }
            }
        }
        return null;
    };

    Phys.resolveCollision = function (a, b, m) {
        // Calculate relative velocity
        rv.reset(b.velocity.x - a.velocity.x, b.velocity.y - a.velocity.y);

        // Calculate relative velocity in terms of the normal direction
        var velAlongNormal = rv.dotProduct(m.normal);

        // Do not resolve if velocities are separating
        if (velAlongNormal > 0) {
            console.log('separating velocity');
            return;
        }

        // Calculate restitution
        var e = Math.min(a.restitution, b.restitution);

        // Calculate impulse scalar
        var j = -(1 + e) * velAlongNormal;
        j /= a.invmass + b.invmass;

        // Apply impulse
        _impulse.reset(m.normal.x * j, m.normal.y * j);

        a.velocity.x -= (a.invmass * _impulse.x);
        a.velocity.y -= (a.invmass * _impulse.y);

        b.velocity.x += (b.invmass * _impulse.x);
        b.velocity.y += (b.invmass * _impulse.y);

        var percent = 0.8; // usually 20% to 80%
        var slop = 0.01; // usually 0.01 to 0.1
        var c = Math.max(m.penetration - slop, 0) / (a.invmass + b.invmass) * percent * m.normal;
        a.pos -= a.invmass * c;
        b.pos += b.invmass * c;
    };

    global.Phys = Phys;

}(this));
