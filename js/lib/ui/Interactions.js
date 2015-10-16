var Interactions = Interactions || {};

(function (global) {
    "use strict";

    /**
     * Holder for interactions with the world
     * @returns {Interactions}
     */
    var Interactions = function () {
        if (document.defaultView && document.defaultView.getComputedStyle) {
            this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['paddingLeft'], 10) || 0;
            this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['paddingTop'], 10) || 0;
            this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['borderLeftWidth'], 10) || 0;
            this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(this.canvas, null)['borderTopWidth'], 10) || 0;
        }

        var html = document.body.parentNode;
        this.htmlTop = html.offsetTop;
        this.htmlLeft = html.offsetLeft;

        this.mouse = {
            pos: new Vec(0, 0),
            gridLocation: new Vec(0, 0)
        };

        // Keep track of when we are dragging
        this.dragging = false;

        // See mousedown and mousemove events for explanation
        this.dragoff = new Vec(0, 0);

        // Currently selected object. In the future an array for multiple selection
        this.selection = null;

        // **** Options! ****
        this.selectionColor = '#CC0000';
        this.selectionWidth = 1;

        /**
         * Event handler
         * @param {MouseEvent} event
         * @returns {undefined}
         */
        function eventHandler(event) {
            event.preventDefault();
            getMouse(event);

            switch (event.type) {
            case 'contextmenu':
                mouseClick(event);
                break;
            case 'click':
                mouseClick(event);
                break;
            case 'mouseup':
                mouseUp(event);
                break;
            case 'mousedown':
                mouseDown(event);
                break;
            case 'mousemove':
                mouseMove(event);
                break;
            case 'dblclick':
                doubleClick(event);
                break;
            case 'drag':
                mouseDrag(event);
                break;
            case 'drop':
                mouseDrop(event);
                break;

            }
        }

        // This fixes a problem where double clicking causes text to get selected on the canvas
        this.canvas.addEventListener('selectstart', function (event) {
            event.preventDefault();
            return false;
        }, false);

        // Event Handlers
        this.canvas.addEventListener('contextmenu', eventHandler, false);
        this.canvas.addEventListener('click', eventHandler, false);
        this.canvas.addEventListener('dblclick', eventHandler, false);
        this.canvas.addEventListener('mouseup', eventHandler, false);
        this.canvas.addEventListener('mousedown', eventHandler, false);
        this.canvas.addEventListener('mousemove', mouseMove, false);

        var _this = this;

        /**
         * Creates an object with x and y defined, set to the mouse position relative
         * to the state's canvas.
         * @param {MouseEvent} event
         * @returns {undefined}
         */
        function getMouse(event) {
            var element = _this.canvas,
                offset = new Vec(0, 0);

            // Compute the total offset
            if (element.offsetParent !== undefined) {
                do {
                    offset.x += element.offsetLeft;
                    offset.y += element.offsetTop;
                } while ((element = element.offsetParent));
            }

            // Add padding and border style widths to offset
            // Also add the <html> offsets in case there's a position:fixed bar
            offset.x += _this.stylePaddingLeft + _this.styleBorderLeft + _this.htmlLeft;
            offset.y += _this.stylePaddingTop + _this.styleBorderTop + _this.htmlTop;

            // We return a Vec with x and y defined
            _this.mouse.pos = new Vec(event.pageX - offset.x, event.pageY - offset.y);
            Utility.getGridLocation(_this.mouse, _this.grid, _this.vW, _this.vH);
            _this.mouse.offset = new Vec(offset.x, offset.y);
            _this.mouse.button = event.button;
        }

        /**
         * Mouse Down
         * @param {MouseEvent} event
         * @returns {undefined}
         */
        function mouseDown(event) {
            var x = _this.mouse.gridLocation.x,
                y = _this.mouse.gridLocation.y;
            var population = _this.grid[x][y].population;
            for (var i = 0; i < population.length; i++) {
                var id = _this.grid[x][y].population[i],
                    entity = _this.entities.find(Utility.getId, id);
                if (entity && entity.contains !== undefined && entity.contains(event, _this.mouse)) {
                    _this.selection = entity;
                    if (_this.mouse.button === 0) {
                        var offX = _this.mouse.pos.x - _this.selection.pos.x,
                            offY = _this.mouse.pos.y - _this.selection.pos.y;

                        _this.dragoff = new Vec(offX, offY);
                        _this.dragging = true;
                        if (_this.selection.mouseClick !== undefined) {
                            return _this.selection.mouseClick(event, _this.mouse);
                        }
                    } else {
                        _this.dragging = false;
                        if (_this.selection.contextMenu !== undefined) {
                            return _this.selection.rightClick(event, _this.mouse);
                        }
                    }
                }
            }

            for (var z = 0; z < _this.agents.length; z++) {
                var agent = _this.agents[z];
                if (agent.contains !== undefined && agent.contains(event, _this.mouse)) {
                    _this.selection = agent;
                    if (_this.mouse.button === 0) {
                        var offX = _this.mouse.pos.x - _this.selection.pos.x,
                            offY = _this.mouse.pos.y - _this.selection.pos.y;

                        _this.dragoff = new Vec(offX, offY);
                        _this.dragging = true;
                        if (_this.selection.mouseClick !== undefined) {
                            return _this.selection.mouseClick(event, _this.mouse);
                        }
                    } else {
                        _this.dragging = false;
                        if (_this.selection.contextMenu !== undefined) {
                            return _this.selection.rightClick(event, _this.mouse);
                        }
                    }
                }
            }
            if (_this.selection) {
                _this.selection = null;
                _this.dragging = false;
            }
        }

        /**
         * Mouse move
         * @param {MouseEvent} event
         * @returns {undefined}
         */
        function mouseMove(event) {
            if (_this.selection) {
                if (_this.dragoff.x !== 0 && _this.dragoff.y !== 0) {
                    var offX = _this.mouse.pos.x - _this.dragoff.x,
                        offY = _this.mouse.pos.y - _this.dragoff.y;

                    _this.selection.pos = new Vec(offX, offY);
                    _this.selection.sprite.position.x = offX;
                    _this.selection.sprite.position.y = offY;
                    _this.dragging = true;
                    _this.redraw = false;
                    if (_this.selection.mouseDrag !== undefined) {
                        return _this.selection.mouseDrag(event, _this.mouse);
                    }
                }
                _this.dragging = false;
                _this.redraw = true;
                if (_this.selection.mouseMove !== undefined) {
                    return _this.selection.mouseMove(event, _this.mouse);
                }
            }

            return;
        }

        /**
         * Mouse release
         * @param {MouseEvent} event
         * @returns {undefined}
         */
        function mouseUp(event) {
            if (_this.selection && _this.dragging) {
                // Set the selection new position
                var offX = _this.mouse.pos.x - _this.dragoff.x,
                    offY = _this.mouse.pos.y - _this.dragoff.y;

                _this.selection.pos = new Vec(offX, offY);
                _this.selection.sprite.position.x = offX;
                _this.selection.sprite.position.y = offY;
                _this.dragging = false;
                _this.redraw = false;
                if (_this.selection.mouseDrop !== undefined) {
                    _this.selection.mouseDrop(event, _this.mouse);
                }
                _this.selection = null;
                return;
            }
            if (_this.selection && _this.selection.mouseUp !== undefined) {
                _this.selection.mouseUp(event, _this.mouse);
            }
            _this.selection = null;

            return;
        }

        /**
         * Mouse Click
         * @param {MouseEvent} event
         * @returns {undefined}
         */
        function mouseClick(event) {
            return;
        }
    };

    global.Interactions = Interactions;

}(this));
