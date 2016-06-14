
var MOVE_LEFT =     0x01;
var MOVE_RIGHT =    0x02;

var vehicles_walker = function() {
    //constructor
    this.walkerJoints = [];
    this.chassisBody = null;
    this.moveFlags = 0;
}

vehicles_walker.prototype.setNiceViewCenter = function() {
    //called once when the user changes to this test from another test
    PTM = 38;
    setViewCenterWorld( new b2Vec2(199.917, 0.0105774), true );
}



vehicles_walker.prototype.setup = function() {

    var tmp = this;

    jQuery.get("walker-min.json", function(jso) {
        if ( loadSceneFromRUBE(jso) )
            console.log("RUBE scene loaded successfully.");
        else
            console.log("Failed to load RUBE scene");

        tmp.walkerJoints = getNamedJoints(world, "walkerjoint");

        bodies = getNamedBodies(world, "walkerchassis");
        if ( bodies.length > 0 ) 
            tmp.chassisBody = bodies[0];
        doAfterLoading();
    });

}

vehicles_walker.prototype.step = function() {
    //this function will be called at the beginning of every time step
    this.updateMotorSpeed();

    //move camera to follow
    if ( this.chassisBody ) {
        var pos = this.chassisBody.GetPosition();
        var vel = this.chassisBody.GetLinearVelocity();
        var futurePos = new b2Vec2( pos.x + 0.05 * vel.x, pos.y + 0.05 * vel.y );
        setViewCenterWorld( futurePos );
    }
}

vehicles_walker.prototype.updateMotorSpeed = function() {
    if ( this.walkerJoints.length < 1 )
        return;
    var maxSpeed = 5;
    var desiredSpeed = 0;
    if ( (this.moveFlags & MOVE_LEFT) == MOVE_LEFT )
        desiredSpeed = -maxSpeed;
    else if ( (this.moveFlags & MOVE_RIGHT) == MOVE_RIGHT )
        desiredSpeed = maxSpeed;
    for (i = 0; i < this.walkerJoints.length; i++)
        this.walkerJoints[i].SetMotorSpeed(desiredSpeed);
}

vehicles_walker.prototype.onKeyDown = function(canvas, evt) {
    if ( evt.keyCode == 74 ) {//j
        this.moveFlags |= MOVE_LEFT;
        this.updateMotorSpeed();
    }
    else if ( evt.keyCode == 75 ) {//k
        this.moveFlags |= MOVE_RIGHT;
        this.updateMotorSpeed();
    }
}

vehicles_walker.prototype.onKeyUp = function(canvas, evt) {    
    if ( evt.keyCode == 74 ) {//j
        this.moveFlags &= ~MOVE_LEFT;
        this.updateMotorSpeed();
    }
    else if ( evt.keyCode == 75 ) {//k
        this.moveFlags &= ~MOVE_RIGHT;
        this.updateMotorSpeed();
    }
}

vehicles_walker.prototype.getComments = function(canvas, evt) {
    return 'This walker is copied from the animated gif at <a target="_new" href="http://en.wikipedia.org/wiki/Klann_linkage">http://en.wikipedia.org/wiki/Klann_linkage</a>. It has huge problems with friction, which is what the little \'toes\' are supposed to help with.';
}
