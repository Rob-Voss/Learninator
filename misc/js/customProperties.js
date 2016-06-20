
var customProperties = function() {
    //constructor
    this.wobblyBodies = [];
    this.timePassed = 0;
}

customProperties.prototype.setNiceViewCenter = function() {
    //called once when the user changes to this test from another test
    PTM = 11;
    setViewCenterWorld( new b2Vec2(-0.726, 17.932), true );
}

customProperties.prototype.setup = function() {
    //set up the Box2D scene here - the world is already created
    
    var tmp = this;
    
    jQuery.get("customProperties-min.json", function(jso) {
        if ( loadSceneFromRUBE(jso) )
            console.log("RUBE scene loaded successfully.");
        else
            console.log("Failed to load RUBE scene");
            
        //get an array of all bodies with the custom string property 'category' matching 'wobbly'
        tmp.wobblyBodies = getBodiesByCustomProperty(world, "string", "category", "wobbly");
        
        //record the initial position of those bodies
        for (var i = 0; i < tmp.wobblyBodies.length; i++) {
            var wb = tmp.wobblyBodies[i];
            wb.basePos = new b2Vec2();
            wb.basePos.SetV( wb.GetPosition() );
        }
            
        doAfterLoading();
    });
}

customProperties.prototype.step = function() {
    //this function will be called at the beginning of every time step
    
    this.timePassed += 1 / 60.0;
    
    //use the custom property values to move the bodies around
    for (var i = 0; i < this.wobblyBodies.length; i++) {
        var wb = this.wobblyBodies[i];
        var horzRange = getCustomProperty(wb, "float", "horzRange");//this could be kinda slow... should really get and store these once during initalization
        var vertRange = getCustomProperty(wb, "float", "vertRange");
        var speed = getCustomProperty(wb, "float", "speed");        
        
        var offset = new b2Vec2( Math.sin(this.timePassed*speed) * horzRange, Math.cos(this.timePassed*speed) * vertRange );
        
        var newPos = new b2Vec2();
        newPos.SetV( wb.basePos );
        newPos.Add( offset );
        wb.SetPosition( newPos );
    }
}

customProperties.prototype.getComments = function(canvas, evt) {
    return "The movement of these bodies is defined in user-added custom properties.";
}