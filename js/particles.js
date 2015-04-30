$(function () {
	var points = [], numPoints = 100, i, canvas, context, width, height, gravity = 0.1, emitter;

	canvas = $("#canvas")[0];
	width = canvas.width;
	height = canvas.height;
	context = canvas.getContext("2d");

	emitter = {x: width / 2, y: height};

	function initPoint(p) {
		p.x = emitter.x;
		p.y = emitter.y;
		p.vx = Math.random() * 4 - 2;
		p.vy = Math.random() * -5 - 3;
		p.radius = Math.random() * 5 + 1;
	}

	function update() {
		var i, point, len = points.length;
		for (i = 0; i < len; i += 1) {
			point = points[i];
			point.vy += gravity;
			point.x += point.vx;
			point.y += point.vy;
			if (point.x > width ||
					point.x < 0 ||
					point.y > height ||
					point.y < 0) {
				initPoint(point);
			}
		}
	}

	function draw() {
		var i, point, len = points.length;
		context.clearRect(0, 0, width, height);
		for (i = 0; i < len; i += 1) {
			point = points[i];
			context.beginPath();
			context.arc(point.x, point.y, point.radius, 0, Math.PI * 2, false);
			context.fill();
		}
	}

	function addPoint() {
		var point;
		if (points.length < numPoints) {
			point = {};
			initPoint(point);
			points.push(point);
		}
	}

	setInterval(function () {
		addPoint();
		update();
		draw();
	}, 1000 / 24);
});
