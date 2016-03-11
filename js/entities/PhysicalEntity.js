(function (global) {
    "use strict";

    const entityTypes = ['Wall', 'Nom', 'Gnar', 'Agent', 'Agent Worker', 'Entity Agent'],
        styles = ['black', 'red', 'green', 'blue', 'navy', 'magenta', 'cyan', 'purple', 'aqua', 'olive', 'lime'],
        hexStyles = [0x000000, 0xFF0000, 0x00FF00, 0x0000FF, 0x000080, 0xFF00FF, 0x00FFFF, 0x800080, 0x00FFFF, 0x808000, 0x00FF00],
        rgbStyles = ['#000000', '#C44D58', '#C7F464', '#4ECDC4'];

    class PhysicalEntity {

        /**
         * Initialize the PhysicalEntity
         * @name PhysicalEntity
         * @constructor
         *
         * @param {number|string} type - A type id (wall,nom,gnar,agent)
         * @param {Matter.Body} body - The Matter.js body
         * @returns {PhysicalEntity}
         */
        constructor(type, body) {
            let typeOf = typeof type;
            this.id = Utility.guid();
            this.age = 0;
            this.body = body;
            this.collisions = [];
            this.type = (typeOf === 'string') ? entityTypes.indexOf(type) : type || 1;
            this.typeName = entityTypes[this.type];
            this.color = hexStyles[this.type];
            this.name = (this.name === undefined) ? entityTypes[this.type] : this.name;

            this.body.render.lineWidth = 0.5;
            this.body.render.strokeStyle = rgbStyles[this.type];
            this.body.render.fillStyle = rgbStyles[this.type];
            this.body.color = rgbStyles[this.type];

            return this;
        }

        /**
         * Creates a body sprite
         * @method createPIXIBodySprite
         * @param {RenderPixi} render
         * @param {body} body
         * @return {PIXI.Sprite} sprite
         */
        createPIXIBodySprite(render, body) {
            var bodyRender = body.render,
                texturePath = bodyRender.sprite.texture,
                texture = this.getTexture(render, texturePath),
                sprite = new PIXI.Sprite(texture);

            sprite.anchor.x = body.render.sprite.xOffset;
            sprite.anchor.y = body.render.sprite.yOffset;

            return sprite;
        }

        /**
         * Creates a body primitive
         * @method createPIXIBodyPrimitive
         * @param {RenderPixi} render
         * @param {body} body
         * @return {PIXI.Graphics} graphics
         */
        createPIXIBodyPrimitive(render, body) {
            var bodyRender = body.render,
                options = render.options,
                primitive = new PIXI.Graphics(),
                fillStyle = Common.colorToNumber(bodyRender.fillStyle),
                strokeStyle = Common.colorToNumber(bodyRender.strokeStyle),
                strokeStyleIndicator = Common.colorToNumber(bodyRender.strokeStyle),
                strokeStyleWireframe = Common.colorToNumber('#bbb'),
                strokeStyleWireframeIndicator = Common.colorToNumber('#CD5C5C'),
                part;

            primitive.clear();

            // handle compound parts
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

                // angle indicator
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
        }

        /**
         * Gets the requested texture (a PIXI.Texture) via its path
         * @method getPIXITexture
         * @param {RenderPixi} render
         * @param {string} imagePath
         * @return {PIXI.Texture} texture
         */
        getPIXITexture(render, imagePath) {
            var texture = render.textures[imagePath];

            if (!texture) {
                texture = render.textures[imagePath] = PIXI.Texture.fromImage(imagePath);
            }

            return texture;
        }
    }

    global.PhysicalEntity = PhysicalEntity;

}(this));
