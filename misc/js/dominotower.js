
var dominotower = function() {
    //constructor
}

dominotower.prototype.setNiceViewCenter = function() {
    //called once when the user changes to this test from another test
    PTM = 11.5;
    setViewCenterWorld( new b2Vec2(0, 17), true );
}

dominotower.prototype.setup = function() {
    //set up the Box2D scene here - the world is already created
    
    jQuery.get("dominotower-min.json", function(jso) {
        if ( loadSceneFromRUBE(jso) )
            console.log("RUBE scene loaded successfully.");
        else
            console.log("Failed to load RUBE scene");
            
        doAfterLoading();
    });
    
}

dominotower.prototype.getComments = function(canvas, evt) {
    return "This scene was exported to JSON from the JBox2D testbed using the Java version of b2dJson, then imported into box2web.";
}
