
var MOVE_LEFT =     0x01;
var MOVE_RIGHT =    0x02;

var vehicles_car2 = function() {
    //constructor
    this.wheelBodies = [];
    this.chassisBody = null;
    this.moveFlags = 0;
}

vehicles_car2.prototype.setNiceViewCenter = function() {
    //called once when the user changes to this test from another test
    PTM = 32;
    setViewCenterWorld( new b2Vec2(12,0), true );
}



vehicles_car2.prototype.setup = function() {

    var tmp = this;

    jQuery.get("car2-min.json", function(jso) {
        if ( loadSceneFromRUBE(jso) )
            console.log("RUBE scene loaded successfully.");
        else
            console.log("Failed to load RUBE scene");

        tmp.wheelBodies = getNamedBodies(world, "carwheel");

        bodies = getNamedBodies(world, "carchassis");
        if ( bodies.length > 0 ) 
            tmp.chassisBody = bodies[0];
            
        doAfterLoading();
    });

}

vehicles_car2.prototype.step = function() {
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

vehicles_car2.prototype.updateMotorSpeed = function() {
    if ( this.wheelBodies.length < 1 )
        return;
    var maxSpeed = 16;
    var desiredSpeed = 0;
    if ( (this.moveFlags & MOVE_LEFT) == MOVE_LEFT )
        desiredSpeed = maxSpeed;
    else if ( (this.moveFlags & MOVE_RIGHT) == MOVE_RIGHT )
        desiredSpeed = -maxSpeed;
    for (i = 0; i < this.wheelBodies.length; i++)
        this.wheelBodies[i].SetAngularVelocity(desiredSpeed);
}

vehicles_car2.prototype.onKeyDown = function(canvas, evt) {
    if ( evt.keyCode == 74 ) {//j
        this.moveFlags |= MOVE_LEFT;
        this.updateMotorSpeed();
    }
    else if ( evt.keyCode == 75 ) {//k
        this.moveFlags |= MOVE_RIGHT;
        this.updateMotorSpeed();
    }
}

vehicles_car2.prototype.onKeyUp = function(canvas, evt) {    
    if ( evt.keyCode == 74 ) {//j
        this.moveFlags &= ~MOVE_LEFT;
        this.updateMotorSpeed();
    }
    else if ( evt.keyCode == 75 ) {//k
        this.moveFlags &= ~MOVE_RIGHT;
        this.updateMotorSpeed();
    }
}

vehicles_car2.prototype.getComments = function(canvas, evt) {
    return "Larger wheels with studs on the surface help to get over the rock pit.";
}
