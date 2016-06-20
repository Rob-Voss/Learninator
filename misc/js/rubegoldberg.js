
var rubegoldberg = function() {
    //constructor
}

rubegoldberg.prototype.setNiceViewCenter = function() {
    //called once when the user changes to this test from another test
    PTM = 17;
    setViewCenterWorld( new b2Vec2(11.213, 4.655), true );
}

rubegoldberg.prototype.setup = function() {
    //set up the Box2D scene here - the world is already created

    jQuery.get("rube-min.json", function(jso) {
        if ( loadSceneFromRUBE(jso) )
            console.log("RUBE scene loaded successfully.");
        else
            console.log("Failed to load RUBE scene");
            
        doAfterLoading();
    });
}

rubegoldberg.prototype.getComments = function(canvas, evt) {
    return "This scene was made early in the development of the R.U.B.E editor as a usability test and to check functionality of joints.";
}
