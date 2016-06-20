
var MOVE_LEFT =     0x01;
var MOVE_RIGHT =    0x02;

var vehicles_bike = function() {
    //constructor
    this.rearwheelBody = null;
    this.chassisBody = null;
    this.moveFlags = 0;
}

vehicles_bike.prototype.setNiceViewCenter = function() {
    //called once when the user changes to this test from another test
    PTM = 32;
    setViewCenterWorld( new b2Vec2(15.375,0), true );
}



vehicles_bike.prototype.setup = function() {

    var tmp = this;
        
    jQuery.get("bike-min.json", function(jso) {
        if ( loadSceneFromRUBE(jso) )
            console.log("RUBE scene loaded successfully.");
        else
            console.log("Failed to load RUBE scene");

        var bodies = getNamedBodies(world, "bikerearwheel");
        if ( bodies.length > 0 ) 
            tmp.rearwheelBody = bodies[0];

        bodies = getNamedBodies(world, "bikechassis");
        if ( bodies.length > 0 ) 
            tmp.chassisBody = bodies[0];
            
        doAfterLoading();
    });

}

vehicles_bike.prototype.step = function() {
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

vehicles_bike.prototype.updateMotorSpeed = function() {
    if ( !this.rearwheelBody )
        return;
    var maxSpeed = 40;
    var desiredSpeed = 0;
    if ( (this.moveFlags & MOVE_LEFT) == MOVE_LEFT )
        desiredSpeed = maxSpeed;
    else if ( (this.moveFlags & MOVE_RIGHT) == MOVE_RIGHT )
        desiredSpeed = -maxSpeed;
    this.rearwheelBody.SetAngularVelocity(desiredSpeed);
}

vehicles_bike.prototype.onKeyDown = function(canvas, evt) {
    if ( evt.keyCode == 74 ) {//j
        this.moveFlags |= MOVE_LEFT;
        this.updateMotorSpeed();
    }
    else if ( evt.keyCode == 75 ) {//k
        this.moveFlags |= MOVE_RIGHT;
        this.updateMotorSpeed();
    }
}

vehicles_bike.prototype.onKeyUp = function(canvas, evt) {    
    if ( evt.keyCode == 74 ) {//j
        this.moveFlags &= ~MOVE_LEFT;
        this.updateMotorSpeed();
    }
    else if ( evt.keyCode == 75 ) {//k
        this.moveFlags &= ~MOVE_RIGHT;
        this.updateMotorSpeed();
    }
}

vehicles_bike.prototype.getComments = function(canvas, evt) {
    return "The rear swing-arm uses a revolute and distance joint. The front wheel would be a wheel joint, but is replaced with a "+
    "line/distance joint combo because box2dweb does not yet support wheel joints.";
}

