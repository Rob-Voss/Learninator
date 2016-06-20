
var MOVE_LEFT =     0x01;
var MOVE_RIGHT =    0x02;

var vehicles_truck = function() {
    //constructor
    this.wheelBodies = [];
    this.chassisBody = null;
    this.moveFlags = 0;
}

vehicles_truck.prototype.setNiceViewCenter = function() {
    //called once when the user changes to this test from another test
    PTM = 22;
    setViewCenterWorld( new b2Vec2(-4.8,2), true );
}



vehicles_truck.prototype.setup = function() {

    var tmp = this;

    jQuery.get("truck-min.json", function(jso) {
        if ( loadSceneFromRUBE(jso) )
            console.log("RUBE scene loaded successfully.");
        else
            console.log("Failed to load RUBE scene");

        tmp.wheelBodies = getNamedBodies(world, "truckwheel");

        bodies = getNamedBodies(world, "truckchassis");
        if ( bodies.length > 0 ) 
            tmp.chassisBody = bodies[0];
        doAfterLoading();
    });

}

vehicles_truck.prototype.step = function() {
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

vehicles_truck.prototype.updateMotorSpeed = function() {
    if ( this.wheelBodies.length < 1 )
        return;
    var maxSpeed = 20;
    var desiredSpeed = 0;
    if ( (this.moveFlags & MOVE_LEFT) == MOVE_LEFT )
        desiredSpeed = maxSpeed;
    else if ( (this.moveFlags & MOVE_RIGHT) == MOVE_RIGHT )
        desiredSpeed = -maxSpeed;
    for (i = 0; i < this.wheelBodies.length; i++)
        this.wheelBodies[i].SetAngularVelocity(desiredSpeed);
}

vehicles_truck.prototype.onKeyDown = function(canvas, evt) {
    if ( evt.keyCode == 74 ) {//j
        this.moveFlags |= MOVE_LEFT;
        this.updateMotorSpeed();
    }
    else if ( evt.keyCode == 75 ) {//k
        this.moveFlags |= MOVE_RIGHT;
        this.updateMotorSpeed();
    }
}

vehicles_truck.prototype.onKeyUp = function(canvas, evt) {    
    if ( evt.keyCode == 74 ) {//j
        this.moveFlags &= ~MOVE_LEFT;
        this.updateMotorSpeed();
    }
    else if ( evt.keyCode == 75 ) {//k
        this.moveFlags &= ~MOVE_RIGHT;
        this.updateMotorSpeed();
    }
}

vehicles_truck.prototype.getComments = function(canvas, evt) {
    return "The truck tires are made from a ring of small bodies connected to their neighbors with revolute joints to make a chain, "+
    "then connected to the central hub with wheel joints. "+
    "(All wheel joints are replaced with a line/distance joint combo because box2dweb does not yet support wheel joints.)";
}
