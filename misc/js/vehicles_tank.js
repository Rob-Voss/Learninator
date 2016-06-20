
var MOVE_LEFT =     0x01;
var MOVE_RIGHT =    0x02;

var vehicles_tank = function() {
    //constructor
    this.wheelBodies = [];
    this.chassisBody = null;
    this.moveFlags = 0;
}

vehicles_tank.prototype.setNiceViewCenter = function() {
    //called once when the user changes to this test from another test
    PTM = 32;
    setViewCenterWorld( new b2Vec2(199.917, 0.0105774), true );
}



vehicles_tank.prototype.setup = function() {

    var tmp = this;

    jQuery.get("tank-min.json", function(jso) {
        if ( loadSceneFromRUBE(jso) )
            console.log("RUBE scene loaded successfully.");
        else
            console.log("Failed to load RUBE scene");

        tmp.wheelBodies = getNamedBodies(world, "tankwheel");

        bodies = getNamedBodies(world, "tankchassis");
        if ( bodies.length > 0 ) 
            tmp.chassisBody = bodies[0];
            
        doAfterLoading();
    });

}

vehicles_tank.prototype.step = function() {
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

vehicles_tank.prototype.updateMotorSpeed = function() {
    if ( this.wheelBodies.length < 1 )
        return;
    var maxSpeed = 10;
    var desiredSpeed = 0;
    if ( (this.moveFlags & MOVE_LEFT) == MOVE_LEFT )
        desiredSpeed = maxSpeed;
    else if ( (this.moveFlags & MOVE_RIGHT) == MOVE_RIGHT )
        desiredSpeed = -maxSpeed;
    for (i = 0; i < this.wheelBodies.length; i++)
        this.wheelBodies[i].SetAngularVelocity(desiredSpeed);
}

vehicles_tank.prototype.onKeyDown = function(canvas, evt) {
    if ( evt.keyCode == 74 ) {//j
        this.moveFlags |= MOVE_LEFT;
        this.updateMotorSpeed();
    }
    else if ( evt.keyCode == 75 ) {//k
        this.moveFlags |= MOVE_RIGHT;
        this.updateMotorSpeed();
    }
}

vehicles_tank.prototype.onKeyUp = function(canvas, evt) {    
    if ( evt.keyCode == 74 ) {//j
        this.moveFlags &= ~MOVE_LEFT;
        this.updateMotorSpeed();
    }
    else if ( evt.keyCode == 75 ) {//k
        this.moveFlags &= ~MOVE_RIGHT;
        this.updateMotorSpeed();
    }
}

vehicles_tank.prototype.getComments = function(canvas, evt) {
    return "This tank moves by just rotating the wheels inside the tracks, rather than actually pulling the tracks around like a real tank does.";
}
