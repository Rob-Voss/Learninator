(function (global) {
    "use strict";

    // Matter aliases
    var Bounds = Matter.Bounds,
        Common = Matter.Common,
        Composite = Matter.Composite,
        Events = Matter.Events,
        Grid = Matter.MouseConstraint,
        Vector = Matter.Vector,
        _requestAnimationFrame,
        _cancelAnimationFrame;

    if (typeof window !== 'undefined') {
        _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
            || window.mozRequestAnimationFrame || window.msRequestAnimationFrame
            || function (callback) {
                window.setTimeout(function () {
                    callback(Common.now());
                }, 1000 / 60);
            };

        _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
            || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
    }

    class Renderer {

        /**
         * Creates a new renderer.
         * The options parameter is an object that specifies any properties you wish to override
         * the defaults.
         * All properties have default values, and many are pre-calculated automatically based on
         * other properties.
         * See the properties section below for detailed information on what you can pass via the
         * `options` object.
         * @method create
         * @param {object} [options]
         * @return {Renderer} A new renderer
         */
        constructor(options) {
            this.controller = Renderer;
            this.engine = null;
            this.element = null;
            this.canvas = null;
            this.mouse = null;
            this.frameRequestId = null;
            this.options = {
                width: 600,
                height: 600,
                pixelRatio: 1,
                background: '#fafafa',
                wireframeBackground: '#222',
                hasBounds: !!options.bounds,
                enabled: true,
                wireframes: true,
                showSleeping: true,
                showDebug: false,
                showBroadphase: false,
                showBounds: false,
                showVelocity: false,
                showCollisions: false,
                showSeparations: false,
                showAxes: false,
                showPositions: false,
                showAngleIndicator: false,
                showIds: false,
                showShadows: false,
                showVertexNumbers: false,
                showConvexHulls: false,
                showInternalEdges: false,
                showMousePosition: false
            };
            Common.extend(this, options);

            if (this.canvas) {
                this.canvas.width = this.options.width || this.canvas.width;
                this.canvas.height = this.options.height || this.canvas.height;
            }

            this.canvas = this.canvas || _createCanvas(this.options.width, this.options.height);
            this.context = this.canvas.getContext('2d');
            this.textures = {};
            this.bounds = this.bounds || {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: this.canvas.width,
                        y: this.canvas.height
                    }
                };

            if (this.options.pixelRatio !== 1) {
                this.setPixelRatio(this.options.pixelRatio);
            }

            if (Common.isElement(this.element)) {
                this.element.appendChild(this.canvas);
            } else {
                Common.log('Renderer.create: options.element was undefined, render.canvas was created but not appended', 'warn');
            }

            return this;
        }

        /**
         * Description
         * @method bodies
         * @param {body[]} bodies
         */
        bodies(bodies) {
            let showInternalEdges = this.options.showInternalEdges || !this.options.wireframes;
            for (let i = 0; i < bodies.length; i++) {
                let body = bodies[i];
                if (!body.render.visible) {
                    continue;
                }
                // handle compound parts
                for (let k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                    let part = body.parts[k];

                    if (!part.render.visible) {
                        continue;
                    }
                    if (this.options.showSleeping && body.isSleeping) {
                        this.context.globalAlpha = 0.5 * part.render.opacity;
                    } else if (part.render.opacity !== 1) {
                        this.context.globalAlpha = part.render.opacity;
                    }

                    if (part.render.sprite && part.render.sprite.texture && !this.options.wireframes) {
                        // part sprite
                        let sprite = part.render.sprite,
                            texture = _getTexture(this, sprite.texture);

                        this.context.translate(part.position.x, part.position.y);
                        this.context.rotate(part.angle);

                        this.context.drawImage(
                            texture,
                            texture.width * -sprite.xOffset * sprite.xScale,
                            texture.height * -sprite.yOffset * sprite.yScale,
                            texture.width * sprite.xScale,
                            texture.height * sprite.yScale
                        );

                        // revert translation, hopefully faster than save / restore
                        this.context.rotate(-part.angle);
                        this.context.translate(-part.position.x, -part.position.y);
                    } else {
                        // part polygon
                        if (part.circleRadius) {
                            this.context.beginPath();
                            this.context.arc(part.position.x, part.position.y, part.circleRadius, 0, 2 * Math.PI);
                        } else {
                            this.context.beginPath();
                            this.context.moveTo(part.vertices[0].x, part.vertices[0].y);
                            for (let j = 1; j < part.vertices.length; j++) {
                                if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                                    this.context.lineTo(part.vertices[j].x, part.vertices[j].y);
                                } else {
                                    this.context.moveTo(part.vertices[j].x, part.vertices[j].y);
                                }

                                if (part.vertices[j].isInternal && !showInternalEdges) {
                                    this.context.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                                }
                            }
                            this.context.lineTo(part.vertices[0].x, part.vertices[0].y);
                            this.context.closePath();
                        }

                        if (!this.options.wireframes) {
                            this.context.fillStyle = part.render.fillStyle;
                            this.context.lineWidth = part.render.lineWidth;
                            this.context.strokeStyle = part.render.strokeStyle;
                            this.context.fill();
                        } else {
                            this.context.lineWidth = 1;
                            this.context.strokeStyle = '#bbb';
                        }
                        this.context.stroke();
                    }
                    this.context.globalAlpha = 1;
                }
            }
        }

        /**
         * Draws body angle indicators and axes
         * @method bodyAxes
         * @param {body[]} bodies
         */
        bodyAxes(bodies) {
            this.context.beginPath();
            for (let i = 0; i < bodies.length; i++) {
                let body = bodies[i],
                    parts = body.parts;

                if (!body.render.visible) {
                    continue;
                }
                if (this.options.showAxes) {
                    // render all axes
                    for (let j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                        let part = parts[j];
                        for (let k = 0; k < part.axes.length; k++) {
                            let axis = part.axes[k];
                            this.context.moveTo(part.position.x, part.position.y);
                            this.context.lineTo(part.position.x + axis.x * 20, part.position.y + axis.y * 20);
                        }
                    }
                } else {
                    for (let j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                        let part = parts[j];
                        for (let k = 0; k < part.axes.length; k++) {
                            // render a single axis indicator
                            this.context.moveTo(part.position.x, part.position.y);
                            this.context.lineTo((part.vertices[0].x + part.vertices[part.vertices.length - 1].x) / 2,
                                (part.vertices[0].y + part.vertices[part.vertices.length - 1].y) / 2);
                        }
                    }
                }
            }

            if (this.options.wireframes) {
                this.context.strokeStyle = 'indianred';
            } else {
                this.context.strokeStyle = 'rgba(0,0,0,0.8)';
                this.context.globalCompositeOperation = 'overlay';
            }

            this.context.lineWidth = 1;
            this.context.stroke();
            this.context.globalCompositeOperation = 'source-over';
        }

        /**
         * Draws body bounds
         * @method bodyBounds
         * @param {body[]} bodies
         */
        bodyBounds(bodies) {
            this.context.beginPath();
            for (let i = 0; i < bodies.length; i++) {
                let body = bodies[i];
                if (body.render.visible) {
                    let parts = bodies[i].parts;
                    for (let j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                        let part = parts[j];
                        this.context.rect(part.bounds.min.x, part.bounds.min.y, part.bounds.max.x - part.bounds.min.x, part.bounds.max.y - part.bounds.min.y);
                    }
                }
            }

            if (this.options.wireframes) {
                this.context.strokeStyle = 'rgba(255,255,255,0.08)';
            } else {
                this.context.strokeStyle = 'rgba(0,0,0,0.1)';
            }

            this.context.lineWidth = 1;
            this.context.stroke();
        }

        /**
         * Optimised method for drawing body convex hull wireframes in one pass
         * @method bodyConvexHulls
         * @param {body[]} bodies
         */
        bodyConvexHulls(bodies) {
            this.context.beginPath();
            // render convex hulls
            for (let i = 0; i < bodies.length; i++) {
                let body = bodies[i];
                if (!body.render.visible || body.parts.length === 1) {
                    continue;
                }
                this.context.moveTo(body.vertices[0].x, body.vertices[0].y);
                for (let j = 1; j < body.vertices.length; j++) {
                    this.context.lineTo(body.vertices[j].x, body.vertices[j].y);
                }
                this.context.lineTo(body.vertices[0].x, body.vertices[0].y);
            }
            this.context.lineWidth = 1;
            this.context.strokeStyle = 'rgba(255,255,255,0.2)';
            this.context.stroke();
        }

        /**
         * Draws body ids
         * @method bodyIds
         * @param {body[]} bodies
         */
        bodyIds(bodies) {
            for (let i = 0; i < bodies.length; i++) {
                if (!bodies[i].render.visible) {
                    continue;
                }
                let parts = bodies[i].parts;
                for (let j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                    let part = parts[j];
                    this.context.font = "12px Arial";
                    this.context.fillStyle = 'rgba(255,255,255,0.5)';
                    this.context.fillText(part.id, part.position.x + 10, part.position.y - 10);
                }
            }
        }

        /**
         * Draws body positions
         * @method bodyPositions
         * @param {body[]} bodies
         */
        bodyPositions(bodies) {
            this.context.beginPath();
            // render current positions
            for (let i = 0; i < bodies.length; i++) {
                let body = bodies[i];
                if (!body.render.visible) {
                    continue;
                }
                // handle compound parts
                for (let k = 0; k < body.parts.length; k++) {
                    let part = body.parts[k];
                    this.context.arc(part.position.x, part.position.y, 3, 0, 2 * Math.PI, false);
                    this.context.closePath();
                }
            }

            if (this.options.wireframes) {
                this.context.fillStyle = 'indianred';
            } else {
                this.context.fillStyle = 'rgba(0,0,0,0.5)';
            }
            this.context.fill();
            this.context.beginPath();
            // render previous positions
            for (let i = 0; i < bodies.length; i++) {
                let body = bodies[i];
                if (body.render.visible) {
                    this.context.arc(body.positionPrev.x, body.positionPrev.y, 2, 0, 2 * Math.PI, false);
                    this.context.closePath();
                }
            }
            this.context.fillStyle = 'rgba(255,165,0,0.8)';
            this.context.fill();
        }

        /**
         * Description
         * @method bodyShadows
         * @param {body[]} bodies
         */
        bodyShadows(bodies) {
            for (let i = 0; i < bodies.length; i++) {
                let body = bodies[i];
                if (!body.render.visible) {
                    continue;
                }
                if (body.circleRadius) {
                    this.context.beginPath();
                    this.context.arc(body.position.x, body.position.y, body.circleRadius, 0, 2 * Math.PI);
                    this.context.closePath();
                } else {
                    this.context.beginPath();
                    this.context.moveTo(body.vertices[0].x, body.vertices[0].y);
                    for (let j = 1; j < body.vertices.length; j++) {
                        this.context.lineTo(body.vertices[j].x, body.vertices[j].y);
                    }
                    this.context.closePath();
                }

                let distanceX = body.position.x - this.options.width * 0.5,
                    distanceY = body.position.y - this.options.height * 0.2,
                    distance = Math.abs(distanceX) + Math.abs(distanceY);

                this.context.shadowColor = 'rgba(0,0,0,0.15)';
                this.context.shadowOffsetX = 0.05 * distanceX;
                this.context.shadowOffsetY = 0.05 * distanceY;
                this.context.shadowBlur = 1 + 12 * Math.min(1, distance / 1000);

                this.context.fill();

                this.context.shadowColor = null;
                this.context.shadowOffsetX = null;
                this.context.shadowOffsetY = null;
                this.context.shadowBlur = null;
            }
        }

        /**
         * Draws body velocity
         * @method bodyVelocity
         * @param {body[]} bodies
         */
        bodyVelocity(bodies) {
            this.context.beginPath();
            for (let i = 0; i < bodies.length; i++) {
                let body = bodies[i];
                if (!body.render.visible) {
                    continue;
                }
                this.context.moveTo(body.position.x, body.position.y);
                this.context.lineTo(body.position.x + (body.position.x - body.positionPrev.x) * 2, body.position.y + (body.position.y - body.positionPrev.y) * 2);
            }
            this.context.lineWidth = 3;
            this.context.strokeStyle = 'cornflowerblue';
            this.context.stroke();
        }

        /**
         * Optimised method for drawing body wireframes in one pass
         * @method bodyWireframes
         * @param {body[]} bodies
         */
        bodyWireframes(bodies) {
            this.context.beginPath();
            // render all bodies
            for (let i = 0; i < bodies.length; i++) {
                let body = bodies[i];
                if (!body.render.visible) {
                    continue;
                }
                // handle compound parts
                for (let k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                    let part = body.parts[k];
                    this.context.moveTo(part.vertices[0].x, part.vertices[0].y);
                    for (let j = 1; j < part.vertices.length; j++) {
                        if (!part.vertices[j - 1].isInternal || this.options.showInternalEdges) {
                            this.context.lineTo(part.vertices[j].x, part.vertices[j].y);
                        } else {
                            this.context.moveTo(part.vertices[j].x, part.vertices[j].y);
                        }

                        if (part.vertices[j].isInternal && !this.options.showInternalEdges) {
                            this.context.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                        }
                    }
                    this.context.lineTo(part.vertices[0].x, part.vertices[0].y);
                }
            }

            this.context.lineWidth = 1;
            this.context.strokeStyle = '#bbb';
            this.context.stroke();
        }

        /**
         * Description
         * @method collisions
         */
        collisions() {
            this.context.beginPath();
            // Render the collision positions
            for (let i = 0; i < this.engine.pairs.list.length; i++) {
                if (!this.engine.pairs.list[i].isActive) {
                    continue;
                }
                let pair = this.engine.pairs.list[i],
                    collision = pair.collision;
                for (let j = 0; j < pair.activeContacts.length; j++) {
                    let contact = pair.activeContacts[j],
                        vertex = contact.vertex;
                    this.context.rect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
                }
            }

            if (this.options.wireframes) {
                this.context.fillStyle = 'rgba(255,255,255,0.7)';
            } else {
                this.context.fillStyle = 'orange';
            }
            this.context.fill();
            this.context.beginPath();

            // render collision normals
            for (let i = 0; i < this.engine.pairs.list.length; i++) {
                if (!this.engine.pairs.list[i].isActive) {
                    continue;
                }
                let pair = this.engine.pairs.list[i],
                    collision = pair.collision;
                if (pair.activeContacts.length > 0) {
                    let normalPosX = pair.activeContacts[0].vertex.x,
                        normalPosY = pair.activeContacts[0].vertex.y;

                    if (pair.activeContacts.length === 2) {
                        normalPosX = (pair.activeContacts[0].vertex.x + pair.activeContacts[1].vertex.x) / 2;
                        normalPosY = (pair.activeContacts[0].vertex.y + pair.activeContacts[1].vertex.y) / 2;
                    }

                    if (collision.bodyB === collision.supports[0].body || collision.bodyA.isStatic === true) {
                        this.context.moveTo(normalPosX - collision.normal.x * 8, normalPosY - collision.normal.y * 8);
                    } else {
                        this.context.moveTo(normalPosX + collision.normal.x * 8, normalPosY + collision.normal.y * 8);
                    }

                    this.context.lineTo(normalPosX, normalPosY);
                }
            }

            if (this.options.wireframes) {
                this.context.strokeStyle = 'rgba(255,165,0,0.7)';
            } else {
                this.context.strokeStyle = 'orange';
            }

            this.context.lineWidth = 1;
            this.context.stroke();
        }

        /**
         * Description
         * @method constraints
         * @param {constraint[]} constraints
         */
        constraints(constraints) {
            for (let i = 0; i < constraints.length; i++) {
                if (!constraints[i].render.visible || !constraints[i].pointA || !constraints[i].pointB) {
                    continue;
                }
                let constraint = constraints[i],
                    bodyA = constraint.bodyA,
                    bodyB = constraint.bodyB;

                if (bodyA) {
                    this.context.beginPath();
                    this.context.moveTo(bodyA.position.x + constraint.pointA.x, bodyA.position.y + constraint.pointA.y);
                } else {
                    this.context.beginPath();
                    this.context.moveTo(constraint.pointA.x, constraint.pointA.y);
                }

                if (bodyB) {
                    this.context.lineTo(bodyB.position.x + constraint.pointB.x, bodyB.position.y + constraint.pointB.y);
                } else {
                    this.context.lineTo(constraint.pointB.x, constraint.pointB.y);
                }

                this.context.lineWidth = constraint.render.lineWidth;
                this.context.strokeStyle = constraint.render.strokeStyle;
                this.context.stroke();
            }
        }

        /**
         * Description
         * @method debug
         */
        debug() {
            let bodies = Composite.allBodies(this.engine.world),
                space = "    ";

            if (this.engine.timing.timestamp - (this.debugTimestamp || 0) >= 500) {
                let text = "";

                if (this.engine.metrics.timing) {
                    text += "fps: " + Math.round(this.engine.metrics.timing.fps) + space;
                }

                // @if DEBUG
                if (this.engine.metrics.extended) {
                    if (this.engine.metrics.timing) {
                        text += "delta: " + this.engine.metrics.timing.delta.toFixed(3) + space;
                        text += "correction: " + this.engine.metrics.timing.correction.toFixed(3) + space;
                    }

                    text += "bodies: " + bodies.length + space;

                    if (this.engine.broadphase.controller === Grid) {
                        text += "buckets: " + this.engine.metrics.buckets + space;
                    }
                    text += "\n";

                    text += "collisions: " + this.engine.metrics.collisions + space;
                    text += "pairs: " + this.engine.pairs.list.length + space;
                    text += "broad: " + this.engine.metrics.broadEff + space;
                    text += "mid: " + this.engine.metrics.midEff + space;
                    text += "narrow: " + this.engine.metrics.narrowEff + space;
                }

                this.debugString = text;
                this.debugTimestamp = this.engine.timing.timestamp;
            }

            if (this.debugString) {
                let split = this.debugString.split('\n');
                this.context.font = "12px Arial";
                if (this.options.wireframes) {
                    this.context.fillStyle = 'rgba(255,255,255,0.5)';
                } else {
                    this.context.fillStyle = 'rgba(0,0,0,0.5)';
                }
                for (let i = 0; i < split.length; i++) {
                    this.context.fillText(split[i], 50, 50 + i * 18);
                }
            }
        }

        /**
         * Description
         * @method grid
         * @param {Matter.Grid} grid
         */
        grid(grid) {
            if (this.options.wireframes) {
                this.context.strokeStyle = 'rgba(255,180,0,0.1)';
            } else {
                this.context.strokeStyle = 'rgba(255,180,0,0.5)';
            }

            this.context.beginPath();
            let bucketKeys = Common.keys(grid.buckets);
            for (let i = 0; i < bucketKeys.length; i++) {
                if (grid.buckets[bucketKeys[i]].length < 2) {
                    continue;
                }
                let bucketId = bucketKeys[i],
                    region = bucketId.split(',');
                this.context.rect(0.5 + parseInt(region[0], 10) * grid.bucketWidth,
                    0.5 + parseInt(region[1], 10) * grid.bucketHeight,
                    grid.bucketWidth,
                    grid.bucketHeight);
            }

            this.context.lineWidth = 1;
            this.context.stroke();
        }

        /**
         * Description
         * @method inspector
         * @param {inspector} inspector
         * @param {RenderingContext} context
         */
        inspector(inspector, context) {
            let engine = inspector.engine,
                selected = inspector.selected,
                render = inspector.render,
                options = render.options,
                bounds;

            if (options.hasBounds) {
                let boundsWidth = render.bounds.max.x - render.bounds.min.x,
                    boundsHeight = render.bounds.max.y - render.bounds.min.y,
                    boundsScaleX = boundsWidth / render.options.width,
                    boundsScaleY = boundsHeight / render.options.height;

                context.scale(1 / boundsScaleX, 1 / boundsScaleY);
                context.translate(-render.bounds.min.x, -render.bounds.min.y);
            }

            for (let i = 0; i < selected.length; i++) {
                let item = selected[i].data;

                context.translate(0.5, 0.5);
                context.lineWidth = 1;
                context.strokeStyle = 'rgba(255,165,0,0.9)';
                context.setLineDash([1, 2]);

                switch (item.type) {
                    case 'body':
                        // render body selections
                        bounds = item.bounds;
                        context.beginPath();
                        context.rect(Math.floor(bounds.min.x - 3), Math.floor(bounds.min.y - 3),
                            Math.floor(bounds.max.x - bounds.min.x + 6), Math.floor(bounds.max.y - bounds.min.y + 6));
                        context.closePath();
                        context.stroke();
                        break;
                    case 'constraint':
                        // render constraint selections
                        var point = item.pointA;
                        if (item.bodyA)
                            point = item.pointB;
                        context.beginPath();
                        context.arc(point.x, point.y, 10, 0, 2 * Math.PI);
                        context.closePath();
                        context.stroke();
                        break;
                }
                context.setLineDash([]);
                context.translate(-0.5, -0.5);
            }

            // render selection region
            if (inspector.selectStart !== null) {
                context.translate(0.5, 0.5);
                context.lineWidth = 1;
                context.strokeStyle = 'rgba(255,165,0,0.6)';
                context.fillStyle = 'rgba(255,165,0,0.1)';
                bounds = inspector.selectBounds;
                context.beginPath();
                context.rect(Math.floor(bounds.min.x), Math.floor(bounds.min.y),
                    Math.floor(bounds.max.x - bounds.min.x), Math.floor(bounds.max.y - bounds.min.y));
                context.closePath();
                context.stroke();
                context.fill();
                context.translate(-0.5, -0.5);
            }

            if (options.hasBounds) {
                context.setTransform(1, 0, 0, 1, 0, 0);
            }
        }

        /**
         * Renders mouse position.
         * @method mousePosition
         */
        mousePosition() {
            this.context.fillStyle = 'rgba(255,255,255,0.8)';
            this.context.fillText(this.mouse.position.x + '  ' + this.mouse.position.y, this.mouse.position.x + 5, this.mouse.position.y - 5);
        }

        /**
         * Continuously updates the render canvas on the `requestAnimationFrame` event.
         * @method run
         */
        run() {
            var _this = this;
            (function loop(time) {
                _this.frameRequestId = _requestAnimationFrame(loop);
                _this.world();
            })();
        }

        /**
         * Helper function to display separations
         * @method separations
         */
        separations() {
            this.context.beginPath();
            // Render the separations
            for (let i = 0; i < this.engine.pairs.list.length; i++) {
                if (!this.engine.pairs.list[i].isActive) {
                    continue;
                }
                let pair = this.engine.pairs.list[i],
                    collision = pair.collision,
                    bodyA = collision.bodyA,
                    bodyB = collision.bodyB,
                    k = 1;

                if (!bodyB.isStatic && !bodyA.isStatic) {
                    k = 0.5;
                }
                if (bodyB.isStatic) {
                    k = 0;
                }

                this.context.moveTo(bodyB.position.x, bodyB.position.y);
                this.context.lineTo(bodyB.position.x - collision.penetration.x * k, bodyB.position.y - collision.penetration.y * k);

                k = 1;

                if (!bodyB.isStatic && !bodyA.isStatic) {
                    k = 0.5;
                }
                if (bodyA.isStatic) {
                    k = 0;
                }

                this.context.moveTo(bodyA.position.x, bodyA.position.y);
                this.context.lineTo(bodyA.position.x + collision.penetration.x * k, bodyA.position.y + collision.penetration.y * k);
            }

            if (this.options.wireframes) {
                this.context.strokeStyle = 'rgba(255,165,0,0.5)';
            } else {
                this.context.strokeStyle = 'orange';
            }
            this.context.stroke();
        }

        /**
         * Sets the pixel ratio of the renderer and updates the canvas.
         * To automatically detect the correct ratio, pass the string `'auto'` for `pixelRatio`.
         * @method setPixelRatio
         * @param {number|string} pixelRatio
         */
        setPixelRatio(pixelRatio) {
            if (pixelRatio === 'auto') {
                pixelRatio = _getPixelRatio(this.canvas);
            }

            this.options.pixelRatio = pixelRatio;
            this.canvas.setAttribute('data-pixel-ratio', pixelRatio);
            this.canvas.width = this.options.width * pixelRatio;
            this.canvas.height = this.options.height * pixelRatio;
            this.canvas.style.width = this.options.width + 'px';
            this.canvas.style.height = this.options.height + 'px';
            this.context.scale(pixelRatio, pixelRatio);
        }

        /**
         * Ends execution of `Render.run` on the given `render`, by canceling the animation frame request event loop.
         * @method stop
         */
        stop() {
            _cancelAnimationFrame(this.frameRequestId);
        }

        /**
         * Renders body vertex numbers.
         * @method vertexNumbers
         * @param {body[]} bodies
         */
        vertexNumbers(bodies) {
            for (let i = 0; i < bodies.length; i++) {
                let parts = bodies[i].parts;
                for (let k = parts.length > 1 ? 1 : 0; k < parts.length; k++) {
                    let part = parts[k];
                    for (let j = 0; j < part.vertices.length; j++) {
                        this.context.fillStyle = 'rgba(255,255,255,0.2)';
                        this.context.fillText(i + '_' + j, part.position.x + (part.vertices[j].x - part.position.x) * 0.8, part.position.y + (part.vertices[j].y - part.position.y) * 0.8);
                    }
                }
            }
        }

        /**
         * Renders the given `engine`'s `Matter.World` object.
         * This is the entry point for all rendering and should be called every time the scene changes.
         * @method world
         */
        world() {
            let allBodies = Composite.allBodies(this.engine.world),
                allConstraints = Composite.allConstraints(this.engine.world),
                background = this.options.wireframes ? this.options.wireframeBackground : this.options.background,
                bodies = [],
                constraints = [],
                event = {
                    timestamp: this.engine.timing.timestamp
                };
            Events.trigger(this, 'beforeRender', event);

            // apply background if it has changed
            if (this.currentBackground !== background) {
                _applyBackground(this, background);
            }
            // clear the canvas with a transparent fill, to allow the canvas background to show
            this.context.globalCompositeOperation = 'source-in';
            this.context.fillStyle = "transparent";
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.globalCompositeOperation = 'source-over';

            // handle bounds
            if (this.options.hasBounds) {
                let boundsWidth = this.bounds.max.x - this.bounds.min.x,
                    boundsHeight = this.bounds.max.y - this.bounds.min.y,
                    boundsScaleX = boundsWidth / this.options.width,
                    boundsScaleY = boundsHeight / this.options.height;

                // filter out bodies that are not in view
                for (let i = 0; i < allBodies.length; i++) {
                    let body = allBodies[i];
                    if (Bounds.overlaps(body.bounds, this.bounds)) {
                        bodies.push(body);
                    }
                }

                // filter out constraints that are not in view
                for (let i = 0; i < allConstraints.length; i++) {
                    let constraint = allConstraints[i],
                        bodyA = constraint.bodyA,
                        bodyB = constraint.bodyB,
                        pointAWorld = constraint.pointA,
                        pointBWorld = constraint.pointB;

                    if (bodyA) {
                        pointAWorld = Vector.add(bodyA.position, constraint.pointA);
                    }
                    if (bodyB) {
                        pointBWorld = Vector.add(bodyB.position, constraint.pointB);
                    }

                    if (!pointAWorld || !pointBWorld) {
                        continue;
                    }
                    if (Bounds.contains(this.bounds, pointAWorld) || Bounds.contains(this.bounds, pointBWorld)) {
                        constraints.push(constraint);
                    }
                }

                // transform the view
                this.context.scale(1 / boundsScaleX, 1 / boundsScaleY);
                this.context.translate(-this.bounds.min.x, -this.bounds.min.y);
            } else {
                constraints = allConstraints;
                bodies = allBodies;
            }

            if (!this.options.wireframes || (this.engine.enableSleeping && this.options.showSleeping)) {
                // fully featured rendering of bodies
                this.bodies(bodies);
            } else {
                if (this.options.showConvexHulls) {
                    this.bodyConvexHulls(bodies);
                }
                // optimised method for wireframes only
                this.bodyWireframes(bodies);
            }

            if (this.options.showBounds) {
                this.bodyBounds(bodies);
            }
            if (this.options.showAxes || this.options.showAngleIndicator) {
                this.bodyAxes(bodies);
            }
            if (this.options.showPositions) {
                this.bodyPositions(bodies);
            }
            if (this.options.showShadows) {
                this.bodyShadows(bodies);
            }
            if (this.options.showVelocity) {
                this.bodyVelocity(bodies);
            }
            if (this.options.showIds) {
                this.bodyIds(bodies);
            }
            if (this.options.showSeparations) {
                this.separations();
            }
            if (this.options.showCollisions) {
                this.collisions();
            }
            if (this.options.showVertexNumbers) {
                this.vertexNumbers(bodies);
            }
            if (this.options.showMousePosition) {
                this.mousePosition();
            }
            this.constraints(constraints);

            if (this.options.showBroadphase && this.engine.broadphase.controller === Grid) {
                this.grid();
            }
            if (this.options.showDebug) {
                this.debug();
            }
            if (this.options.hasBounds) {
                // revert view transforms
                this.context.setTransform(this.options.pixelRatio, 0, 0, this.options.pixelRatio, 0, 0);
            }

            Events.trigger(this, 'afterRender', event);
        }


    }

    /**
     * Description
     * @method _createCanvas
     * @private
     * @param {Number} width
     * @param {Number} height
     * @return {HTMLElement} canvas
     */
    var _createCanvas = function (width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.oncontextmenu = function () {
            return false;
        };
        canvas.onselectstart = function () {
            return false;
        };

        return canvas;
    };

    /**
     * Gets the pixel ratio of the canvas.
     * @method _getPixelRatio
     * @private
     * @param {HTMLElement} canvas
     * @return {Number} pixel ratio
     */
    var _getPixelRatio = function (canvas) {
        var context = canvas.getContext('2d'),
            devicePixelRatio = window.devicePixelRatio || 1,
            backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio
                || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio
                || context.backingStorePixelRatio || 1;

        return devicePixelRatio / backingStorePixelRatio;
    };

    /**
     * Gets the requested texture (an Image) via its path
     * @method _getTexture
     * @private
     * @param {Renderer} render
     * @param {String} imagePath
     * @return {Image} texture
     */
    var _getTexture = function (render, imagePath) {
        let image = render.textures[imagePath];
        if (!image) {
            image = render.textures[imagePath] = new Image();
            image.src = imagePath;
        }
        return image;
    };

    /**
     * Creates a body sprite
     * @method _createBodySprite
     * @private
     * @param {RenderPixi} render
     * @param {Matter.Body} body
     * @return {PIXI.Sprite} sprite
     */
    var _createBodySprite = function (render, body) {
        var bodyRender = body.render,
            texturePath = bodyRender.sprite.texture,
            texture = _getTexture(render, texturePath),
            sprite = new PIXI.Sprite(texture);

        sprite.anchor.x = body.render.sprite.xOffset;
        sprite.anchor.y = body.render.sprite.yOffset;

        return sprite;
    };

    /**
     * Creates a body primitive
     * @method _createBodyPrimitive
     * @private
     * @param {RenderPixi} render
     * @param {Matter.Body} body
     * @return {PIXI.Graphics} graphics
     */
    var _createBodyPrimitive = function (render, body) {
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

        if (body.label === 'Agent') {
            for (let i = 0; i < body.entity.numEyes; i++) {
                primitive.addChild(body.entity.eyes[i].shape);
            }
        }

        return primitive;
    };

    /**
     * Gets the requested texture (a PIXI.Texture) via its path
     * @method _getTexture
     * @private
     * @param {RenderPixi} render
     * @param {string} imagePath
     * @return {PIXI.Texture} texture
     */
    var _getPixiTexture = function (render, imagePath) {
        var texture = render.textures[imagePath];

        if (!texture) {
            texture = render.textures[imagePath] = PIXI.Texture.fromImage(imagePath);
        }
        return texture;
    };

    /**
     * Applies the background to the canvas using CSS.
     * @method applyBackground
     * @private
     * @param {Renderer} render
     * @param {String} background
     */
    var _applyBackground = function (render, background) {
        var cssBackground = background;

        if (/(jpg|gif|png)$/.test(background)) {
            cssBackground = 'url(' + background + ')';
        }
        render.canvas.style.background = cssBackground;
        render.canvas.style.backgroundSize = "contain";
        render.currentBackground = background;
    };

    /*
     *
     *  Events Documentation
     *
     */

    /**
     * Fired before rendering
     *
     * @event beforeRender
     * @param {Event} event An event object
     * @param {number} event.timestamp The engine.timing.timestamp of the event
     * @param {object} event.source The source object of the event
     * @param {string} event.name The name of the event
     */

    /**
     * Fired after rendering
     *
     * @event afterRender
     * @param {Event} event An event object
     * @param {number} event.timestamp The engine.timing.timestamp of the event
     * @param {object} event.source The source object of the event
     * @param {string} event.name The name of the event
     */

    /*
     *
     *  Properties Documentation
     *
     */

    /**
     * A back-reference to the `Matter.Render` module.
     *
     * @property controller
     * @type render
     */

    /**
     * A reference to the `Matter.Engine` instance to be used.
     *
     * @property engine
     * @type engine
     */

    /**
     * A reference to the element where the canvas is to be inserted (if `render.canvas` has not been specified)
     *
     * @property element
     * @type HTMLElement
     * @default null
     */

    /**
     * The canvas element to render to. If not specified, one will be created if `render.element` has been specified.
     *
     * @property canvas
     * @type HTMLCanvasElement
     * @default null
     */

    /**
     * The configuration options of the renderer.
     *
     * @property options
     * @type {}
     */

    /**
     * The target width in pixels of the `render.canvas` to be created.
     *
     * @property options.width
     * @type number
     * @default 800
     */

    /**
     * The target height in pixels of the `render.canvas` to be created.
     *
     * @property options.height
     * @type number
     * @default 600
     */

    /**
     * A flag that specifies if `render.bounds` should be used when rendering.
     *
     * @property options.hasBounds
     * @type boolean
     * @default false
     */

    /**
     * A `Bounds` object that specifies the drawing view region.
     * Rendering will be automatically transformed and scaled to fit within the canvas size (`render.options.width` and `render.options.height`).
     * This allows for creating views that can pan or zoom around the scene.
     * You must also set `render.options.hasBounds` to `true` to enable bounded rendering.
     *
     * @property bounds
     * @type bounds
     */

    /**
     * The 2d rendering context from the `render.canvas` element.
     *
     * @property context
     * @type CanvasRenderingContext2D
     */

    /**
     * The sprite texture cache.
     *
     * @property textures
     * @type {}
     */

    global.Renderer = Renderer;

}(this));
