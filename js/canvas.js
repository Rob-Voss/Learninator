function start() {
	var s = new CanvasState(document.getElementById('canvas'));
	s.addShape(new Shape('rect', new Vec(40,40),50,50)); // The default is gray
	s.addShape(new Shape('rect', new Vec(60,140),40,60,10,'lightskyblue'));
	s.addShape(new Shape('tria', new Vec(100,10),40,60,0,'blue'));

	// Lets make some partially transparent
	s.addShape(new Shape('circ', new Vec(30,150),60,30,15,'rgba(127, 255, 212, .5)'));
	s.addShape(new Shape('bubb', new Vec(125,80),30,80,10,'rgba(245, 222, 179, .7)'));
}