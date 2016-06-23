var MOVE_LEFT = 0x01;
var MOVE_RIGHT = 0x02;

var walker = function () {
    //constructor
    this.walkerJoints = [];
    this.chassisBody = null;
    this.moveFlags = 0;

    // return this;
};

walker.prototype.setup = function (world) {
    var tmp = this;
    jQuery.get("js/walker.json", (jso) => {
        if (loadSceneFromRUBE(jso)) {
            console.log("RUBE scene loaded successfully.");
        } else {
            console.log("Failed to load RUBE scene");
        }
        tmp.walkerJoints = getNamedJoints(world, "walkerjoint");

        bodies = getNamedBodies(world, "walkerchassis");
        if (bodies.length > 0) {
            tmp.chassisBody = bodies[0];
        }
        return tmp;//doAfterLoading();
    });

};

walker.prototype.step = function () {
    //this function will be called at the beginning of every time step
    this.updateMotorSpeed();

    //move camera to follow
    if (this.chassisBody) {
        var pos = this.chassisBody.GetPosition();
        var vel = this.chassisBody.GetLinearVelocity();
        var futurePos = new b2Vec2(pos.x + 0.05 * vel.x, pos.y + 0.05 * vel.y);
        setViewCenterWorld(futurePos);
    }
};

walker.prototype.updateMotorSpeed = function () {
    if (this.walkerJoints.length < 1) {
        return;
    }
    var maxSpeed = 5;
    var desiredSpeed = 0;
    if ((this.moveFlags & MOVE_LEFT) == MOVE_LEFT) {
        desiredSpeed = -maxSpeed;
    } else if ((this.moveFlags & MOVE_RIGHT) == MOVE_RIGHT) {
        desiredSpeed = maxSpeed;
        for (i = 0; i < this.walkerJoints.length; i++) {
            this.walkerJoints[i].SetMotorSpeed(desiredSpeed);
        }
    }
};

walker.prototype.onKeyDown = function (canvas, evt) {
    if (evt.keyCode === 74) {//j
        this.moveFlags |= MOVE_LEFT;
        this.updateMotorSpeed();
    }
    else if (evt.keyCode === 75) {//k
        this.moveFlags |= MOVE_RIGHT;
        this.updateMotorSpeed();
    }
};

walker.prototype.onKeyUp = function (canvas, evt) {
    if (evt.keyCode === 74) {//j
        this.moveFlags &= ~MOVE_LEFT;
        this.updateMotorSpeed();
    }
    else if (evt.keyCode === 75) {//k
        this.moveFlags &= ~MOVE_RIGHT;
        this.updateMotorSpeed();
    }
};
