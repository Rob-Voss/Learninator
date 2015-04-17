var stage = new Studio.Stage('stage');
stage.color = 'rgba(200,100,100,1)';
stage.enableTouchEvents();

var colorBlock = function (attr) {
	this.height = size;
	this.width = this.height;
	this.anchorX = this.anchorY = .5;
	this.color = 'rgb(' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 100) + ',' + parseInt(Math.random() * 255) + ')';
	if (attr) {
		this.apply(attr);
	}
	stage.addButton(this);
	this.draggable = true;
	this.hover = function () {
		if (this.alpha != 1) {
			return;
		}
		this.alpha = .9;

		stage.addTween(this, 'linear', {scaleX: 3, scaleY: 3, rotation: 0}, 500, function () {
			stage.addTween(this, 'linear', {scaleY: 1, scaleX: 1, rotation: 360}, 300, function () {
				this.alpha = 1;
				this.rotation = 0;
				this.color = 'rgb(' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 100) + ')';
				changers.remove(this);
				holder.add(this);
				this.update();
				holder.updateElement(this);
			})
		})
		holder.clearCachedElement(this);

		holder.remove(this);
		console.log(stage.canvas.toDataURL("image/png;"));
		changers.add(this);
	}
}

colorBlock.prototype = new Studio.Rect();

var holder = new Studio.DisplayList({height: 512, width: 512}); // we need to auto take the stage height width dont you think?

var changers = new Studio.DisplayList({height: 512, width: 512});

holder.cacheAsBitmap(stage.ctx);
stage.addChild(holder);
stage.addChild(changers)

var size = 16;
var max = 512 / size;

for (var i = 0; i != max; i++) {
	for (var j = 0; j != max; j++) {
		holder.add(new colorBlock({x: i * size + 8, y: j * size + 8}));
	}
}

Studio.start();