
var clocktest = function() {
    //constructor
}

clocktest.prototype.setNiceViewCenter = function() {
    //called once when the user changes to this test from another test
    PTM = 12.34;
    setViewCenterWorld( new b2Vec2( 19.978, -5.239), true );
}

clocktest.prototype.setup = function() {
    //set up the Box2D scene here - the world is already created
    
    jQuery.get("clock-min.json", function(jso) {
        if ( loadSceneFromRUBE(jso) )
            console.log("RUBE scene loaded successfully.");
        else
            console.log("Failed to load RUBE scene");
            
        doAfterLoading();
    });
}

clocktest.prototype.getComments = function(canvas, evt) {
    return "Created in R.U.B.E editor. Try dragging the minute hand to the current time.<br>Very useful info at http://www.abbeyclock.com/escapement.html";
}
