function Camera(canvas, resolution, focalLength, isMobile) {
	this.ctx = canvas.getContext('2d');
	this.width = canvas.width;
	this.height = canvas.height;
	this.resolution = resolution;
	this.spacing = this.width / resolution;
	this.focalLength = focalLength || 0.8;
	this.range = isMobile ? 8 : 14;
	this.lightRange = 5;
	this.scale = (this.width + this.height) / 1200;
}

Camera.prototype.render = function (player, map) {
	this.ctx.save();
	for (var column = 0; column < this.resolution; column++) {
		var x = column / this.resolution - 0.5;
		var angle = Math.atan2(x, this.focalLength);
		var ray = map.cast(player, player.direction + angle, this.range);
		this.drawColumn(column, ray, angle, map);
	}
	this.ctx.restore();
};

Camera.prototype.drawColumn = function (column, ray, angle, map) {
	var ctx = this.ctx;
	var texture = map.wallTexture;
	var left = Math.floor(column * this.spacing);
	var width = Math.ceil(this.spacing);
	var hit = -1;

	while (++hit < ray.length && ray[hit].height <= 0);

	for (var s = ray.length - 1; s >= 0; s--) {
		var step = ray[s];
		var rainDrops = 0;//Math.pow(Math.random(), 3) * s;
		var rain = (rainDrops > 0) && this.project(0.1, angle, step.distance);

		if (s === hit) {
			var textureX = Math.floor(texture.width * step.offset);
			var wall = this.project(step.height, angle, step.distance);

			ctx.globalAlpha = 1;
			ctx.drawImage(texture.image, textureX, 0, 1, texture.height, left, wall.top, width, wall.height);

			ctx.fillStyle = '#000000';
			ctx.globalAlpha = Math.max((step.distance + step.shading) / this.lightRange - map.light, 0);
			ctx.fillRect(left, wall.top, width, wall.height);
		}

		ctx.fillStyle = '#ffffff';
		ctx.globalAlpha = 0.15;
		while (--rainDrops > 0) {
			ctx.fillRect(left, Math.random() * rain.top, 1, rain.height);
		}
	}
};

Camera.prototype.project = function (height, angle, distance) {
	var z = distance * Math.cos(angle);
	var wallHeight = this.height * height / z;
	var bottom = this.height / 2 * (1 + 1 / z);
	return {
		top: bottom - wallHeight,
		height: wallHeight
	};
};

function Player(x, y, direction) {
	this.x = x;
	this.y = y;
	this.direction = direction;
	this.paces = 0;
}

Player.prototype.rotate = function (angle) {
	this.direction = (this.direction + angle + (Math.PI * 2)) % (Math.PI * 2);
};

Player.prototype.walk = function (distance, map, direction) {
	var dx = Math.cos(direction) * distance;
	var dy = Math.sin(direction) * distance;
	if (map.get(this.x + dx, this.y) <= 0)
		this.x += dx;
	if (map.get(this.x, this.y + dy) <= 0)
		this.y += dy;
	this.paces += distance;
};

Player.prototype.update = function (controls, map, seconds, agent) {
	if (controls.left)
		this.rotate(-Math.PI * seconds);
	if (controls.right)
		this.rotate(Math.PI * seconds);
	if (controls.forward)
		this.walk(3 * seconds, map, this.direction);
	if (controls.backward)
		this.walk(-3 * seconds, map, this.direction);
	if (controls.sideLeft)
		this.walk(3 * seconds, map, this.direction - Math.PI / 2);
	if (controls.sideRight)
		this.walk(-3 * seconds, map, this.direction - Math.PI / 2);
};
