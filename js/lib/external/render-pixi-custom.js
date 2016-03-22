function ThresholdFilter() {
    PIXI.filters.AbstractFilter.call(this, null, ['precision mediump float;', 'varying vec2 vTextureCoord;', 'uniform sampler2D uSampler;', 'uniform float threshold;', 'void main(void)', '{', '    vec4 color = texture2D(uSampler, vTextureCoord);', '    vec3 blue = vec3(51.0/255.0, 153.0/255.0, 255.0/255.0);', '    if (color.a < threshold) {', '       gl_FragColor = vec4(vec3(0.0), 1.0);', '    } else {', '       gl_FragColor = vec4(blue, 1.0);', '    }', '}',].join('\n'), {
        threshold: {
            type: '1f',
            value: 0.5
        }
    });
}
ThresholdFilter.prototype = Object.create(PIXI.filters.AbstractFilter.prototype);
ThresholdFilter.prototype.constructor = ThresholdFilter;
Object.defineProperties(ThresholdFilter.prototype, {
    threshold: {
        get: function () {
            return this.uniforms.threshold.value;
        }, set: function (value) {
            this.uniforms.threshold.value = value;
        }
    }
});
var b = new PIXI.filters.BlurFilter();
b.blurX = 80;
b.blurY = 80;
b.blur = 80;
b.passes = 10;
var t = new ThresholdFilter();
t.threshold = 0.05;
var stats;
var RenderCustom = {};
var Common = Matter.Common;
var Composite = Matter.Composite;
var Bounds = Matter.Bounds;
var filtersMask = 0;
RenderCustom.create = function (options) {
    var defaults = {
        controller: RenderCustom,
        element: null,
        canvas: null,
        options: {
            width: 800,
            height: 600,
            background: '#fafafa',
            wireframeBackground: '#222',
            hasBounds: false,
            enabled: true,
            wireframes: true,
            showSleeping: true,
            showDebug: false,
            showBroadphase: false,
            showBounds: false,
            showVelocity: false,
            showCollisions: false,
            showAxes: false,
            showPositions: false,
            showAngleIndicator: false,
            showIds: false,
            showShadows: false
        }
    };
    var render = Common.extend(defaults, options), transparent = !render.options.wireframes && render.options.background === 'transparent';
    render.context = new PIXI.WebGLRenderer(render.options.width * 3, render.options.height, {
        view: render.canvas,
        transparent: transparent,
        antialias: true,
        backgroundColor: options.background
    });
    render.canvas = render.context.view;
    render.stage = new PIXI.Container();
    render.container = new PIXI.Container();
    render.bounds = render.bounds || {min: {x: 0, y: 0}, max: {x: render.options.width, y: render.options.height}};
    render.textures = {};
    render.sprites = {};
    render.primitives = {};
    render.spriteContainer = new PIXI.Container();
    if (Common.isElement(render.element)) {
        render.element.appendChild(render.canvas);
    } else {
        Common.log('No "render.element" passed, "render.canvas" was not inserted into document.', 'warn');
    }
    render.canvas.oncontextmenu = function () {
        return false;
    };
    render.canvas.onselectstart = function () {
        return false;
    };
    filtersMask = 0;
    render.texture = new PIXI.RenderTexture(render.context, render.options.width, render.options.height);
    render.texture.render(render.container);
    render.texture2 = new PIXI.RenderTexture(render.context, render.options.width, render.options.height);
    render.texture2.render(render.container);
    render.texture3 = new PIXI.RenderTexture(render.context, render.options.width, render.options.height);
    render.texture3.render(render.container);
    render.sprite = new PIXI.Sprite(render.texture);
    render.sprite2 = new PIXI.Sprite(render.texture2);
    render.sprite3 = new PIXI.Sprite(render.texture3);
    render.sprite.x = 0;
    render.sprite.y = 0;
    render.sprite2.x = render.options.width;
    render.sprite2.y = 0;
    render.sprite3.x = render.options.width * 2;
    render.sprite3.y = 0;
    render.stage.addChild(render.sprite3);
    render.stage.addChild(render.sprite2);
    render.stage.addChild(render.sprite);
    var pass1 = new PIXI.Text('Pass 1:\nHigh Constrast Render', {
        font: 'bold 12px Arial',
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 2
    });
    pass1.x = 10;
    pass1.y = 10;
    render.stage.addChild(pass1);
    var pass2 = new PIXI.Text('Pass 2:\nGaussian Blur', {
        font: 'bold 12px Arial',
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 2
    });
    pass2.x = 10 + render.options.width;
    pass2.y = 10;
    render.stage.addChild(pass2);
    var pass3 = new PIXI.Text('Pass 3:\nThreshold Filter', {
        font: 'bold 12px Arial',
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 2
    });
    pass3.x = 10 + render.options.width * 2;
    pass3.y = 10;
    render.stage.addChild(pass3);
    return render;
};
RenderCustom.clear = function (render) {
    var container = render.container, spriteContainer = render.spriteContainer;
    while (container.children[0]) {
        container.removeChild(container.children[0]);
    }
    while (spriteContainer.children[0]) {
        spriteContainer.removeChild(spriteContainer.children[0]);
    }
    var bgSprite = render.sprites['bg-0'];
    render.textures = {};
    render.sprites = {};
    render.primitives = {};
    render.sprites['bg-0'] = bgSprite;
    if (bgSprite)
        container.addChildAt(bgSprite, 0);
    render.container.addChild(render.spriteContainer);
    render.currentBackground = null;
    container.scale.set(1, 1);
    container.position.set(0, 0);
};
RenderCustom.setBackground = function (render, background) {
    if (render.currentBackground !== background) {
        var isColor = background.indexOf && background.indexOf('#') !== -1, bgSprite = render.sprites['bg-0'];
        if (isColor) {
            var color = Common.colorToNumber(background);
            render.context.backgroundColor = color;
            if (bgSprite)
                render.container.removeChild(bgSprite);
        } else {
            if (!bgSprite) {
                var texture = _getTexture(render, background);
                bgSprite = render.sprites['bg-0'] = new PIXI.Sprite(texture);
                bgSprite.position.x = 0;
                bgSprite.position.y = 0;
                render.container.addChildAt(bgSprite, 0);
            }
        }
        render.currentBackground = background;
    }
};
RenderCustom.world = function (engine) {
    var render = engine.render, world = engine.world, context = render.context, container = render.container, options = render.options, bodies = Composite.allBodies(world), allConstraints = Composite.allConstraints(world), constraints = [], i;
    for (i = 0; i < bodies.length; i++)
        RenderCustom.body(engine, bodies[i]);
    render.texture.clear();
    render.texture2.clear();
    render.texture3.clear();
    render.container.filters = null;
    render.texture.render(render.container);
    render.container.filters = [b];
    render.texture2.render(render.container);
    render.container.filters = [b, t];
    render.texture3.render(render.container);
    render.context.render(render.stage);
};
RenderCustom.constraint = function (engine, constraint) {
    var render = engine.render, bodyA = constraint.bodyA, bodyB = constraint.bodyB, pointA = constraint.pointA, pointB = constraint.pointB, container = render.container, constraintRender = constraint.render, primitiveId = 'c-' + constraint.id, primitive = render.primitives[primitiveId];
    if (!primitive)
        primitive = render.primitives[primitiveId] = new PIXI.Graphics();
    if (!constraintRender.visible || !constraint.pointA || !constraint.pointB) {
        primitive.clear();
        return;
    }
    if (Common.indexOf(container.children, primitive) === -1)
        container.addChild(primitive);
    primitive.clear();
    primitive.beginFill(0, 0);
    primitive.lineStyle(constraintRender.lineWidth, Common.colorToNumber(constraintRender.strokeStyle), 1);
    if (bodyA) {
        primitive.moveTo(bodyA.position.x + pointA.x, bodyA.position.y + pointA.y);
    } else {
        primitive.moveTo(pointA.x, pointA.y);
    }
    if (bodyB) {
        primitive.lineTo(bodyB.position.x + pointB.x, bodyB.position.y + pointB.y);
    } else {
        primitive.lineTo(pointB.x, pointB.y);
    }
    primitive.endFill();
};
RenderCustom.body = function (engine, body) {
    var render = engine.render, bodyRender = body.render;
    if (!bodyRender.visible)
        return;
    if (bodyRender.sprite && bodyRender.sprite.texture) {
        var spriteId = 'b-' + body.id, sprite = render.sprites[spriteId], spriteContainer = render.spriteContainer;
        if (!sprite)
            sprite = render.sprites[spriteId] = _createBodySprite(render, body);
        if (Common.indexOf(spriteContainer.children, sprite) === -1)
            spriteContainer.addChild(sprite);
        sprite.position.x = body.position.x;
        sprite.position.y = body.position.y;
        sprite.rotation = body.angle;
        sprite.scale.x = bodyRender.sprite.xScale || 1;
        sprite.scale.y = bodyRender.sprite.yScale || 1;
    } else {
        var primitiveId = 'b-' + body.id, primitive = render.primitives[primitiveId], container = render.container;
        if (!primitive) {
            primitive = render.primitives[primitiveId] = _createBodyPrimitive(render, body);
            primitive.initialAngle = body.angle;
            container.addChild(primitive);
        }
        primitive.position.x = body.position.x;
        primitive.position.y = body.position.y;
        primitive.rotation = body.angle - primitive.initialAngle;
    }
};
var _createBodySprite = function (render, body) {
    var bodyRender = body.render, texturePath = bodyRender.sprite.texture, texture = _getTexture(render, texturePath), sprite = new PIXI.Sprite(texture);
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    return sprite;
};
var _createBodyPrimitive = function (render, body) {
    var bodyRender = body.render, options = render.options, primitive = new PIXI.Graphics(), fillStyle = Common.colorToNumber(bodyRender.fillStyle), strokeStyle = Common.colorToNumber(bodyRender.strokeStyle), strokeStyleIndicator = Common.colorToNumber(bodyRender.strokeStyle), strokeStyleWireframe = Common.colorToNumber('#bbb'), strokeStyleWireframeIndicator = Common.colorToNumber('#CD5C5C'), part;
    primitive.clear();
    for (var k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
        part = body.parts[k];
        if (!options.wireframes) {
            primitive.beginFill(fillStyle, 1);
            primitive.lineStyle(bodyRender.lineWidth, strokeStyle, 1);
        } else {
            primitive.beginFill(0, 0);
            primitive.lineStyle(1, strokeStyleWireframe, 1);
        }
        primitive.moveTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);
        for (var j = 1; j < part.vertices.length; j++) {
            primitive.lineTo(part.vertices[j].x - body.position.x, part.vertices[j].y - body.position.y);
        }
        primitive.lineTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);
        primitive.endFill();
        if (options.showAngleIndicator || options.showAxes) {
            primitive.beginFill(0, 0);
            if (options.wireframes) {
                primitive.lineStyle(1, strokeStyleWireframeIndicator, 1);
            } else {
                primitive.lineStyle(1, strokeStyleIndicator);
            }
            primitive.moveTo(part.position.x - body.position.x, part.position.y - body.position.y);
            primitive.lineTo(((part.vertices[0].x + part.vertices[part.vertices.length - 1].x) / 2 - body.position.x),
                ((part.vertices[0].y + part.vertices[part.vertices.length - 1].y) / 2 - body.position.y));
            primitive.endFill();
        }
    }
    return primitive;
};
var _getTexture = function (render, imagePath) {
    var texture = render.textures[imagePath];
    if (!texture)
        texture = render.textures[imagePath] = PIXI.Texture.fromImage(imagePath);
    return texture;
};