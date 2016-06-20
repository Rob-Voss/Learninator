
var image_test = function() {
    //constructor
    this.wheelBodies = [];
}

image_test.prototype.setNiceViewCenter = function() {
    //called once when the user changes to this test from another test
    PTM = 18.43;
    setViewCenterWorld( new b2Vec2( -0.665, 3.318), true );
}

image_test.prototype.setup = function() {
    //set up the Box2D scene here - the world is already created

    var tmp = this;
    
    jQuery.get("image_test-min.json", function(jso) {
        if ( loadSceneFromRUBE(jso) )
            console.log("RUBE scene loaded successfully.");
        else
            console.log("Failed to load RUBE scene");

        tmp.wheelBodies = getNamedBodies(world, "truckwheel");
            
        doAfterLoading();
    });
    
}

image_test.prototype.step = function() {
    //this function will be called at the beginning of every time step
    this.updateMotorSpeed();
}

image_test.prototype.updateMotorSpeed = function() {
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

image_test.prototype.onKeyDown = function(canvas, evt) {
    if ( evt.keyCode == 74 ) {//j
        this.moveFlags |= MOVE_LEFT;
        this.updateMotorSpeed();
    }
    else if ( evt.keyCode == 75 ) {//k
        this.moveFlags |= MOVE_RIGHT;
        this.updateMotorSpeed();
    }
}

image_test.prototype.onKeyUp = function(canvas, evt) {    
    if ( evt.keyCode == 74 ) {//j
        this.moveFlags &= ~MOVE_LEFT;
        this.updateMotorSpeed();
    }
    else if ( evt.keyCode == 75 ) {//k
        this.moveFlags &= ~MOVE_RIGHT;
        this.updateMotorSpeed();
    }
}

image_test.prototype.getComments = function(canvas, evt) {
    return "Testing loading and rendering of image coordinates. Try turning off the 'Shapes' checkbox below to hide the fixture lines.";
}
