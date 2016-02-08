(function ($, window, document, undefined) {

    var pluginName = 'circleMenu',
        defaults = {
            depth: 0,
            itemDiameter: 30,
            circleRadius: 80,
            angle: {
                start: 0,
                end: 90
            },
            speed: 500,
            delay: 1000,
            stepOut: 20,
            stepIn: -20,
            trigger: 'hover',
            transitionFunction: 'ease'
        };

    function vendorPrefixes(items, prop, value) {
        ['-webkit-', '-moz-', '-o-', '-ms-', ''].forEach(function (prefix) {
            items.css(prefix + prop, value);
        });
    }

    function CircleMenu(element, options) {
        this._timeouts = [];
        this.element = $(element);
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        this.hook();
    }

    CircleMenu.prototype.init = function () {
        var self = this,
            directions = {
                'bottom-left': [180, 90],
                'bottom': [135, 45],
                'right': [-45, 45],
                'left': [225, 135],
                'top': [225, 315],
                'bottom-half': [180, 0],
                'right-half': [-90, 90],
                'left-half': [270, 90],
                'top-half': [180, 360],
                'top-left': [270, 180],
                'top-right': [270, 360],
                'full': [-90, 270 - Math.floor(360 / (self.element.children('li').length - 1))],
                'bottom-right': [0, 90]
            },
            dir;

        self._state = 'closed';
        self.element.addClass(pluginName + '-closed');

        if (typeof self.options.direction === 'string') {
            dir = directions[self.options.direction.toLowerCase()];
            if (dir) {
                self.options.angle.start = dir[0];
                self.options.angle.end = dir[1];
            }
        }

        self.menuItems = self.element.children('li:not(:first-child)');
        self.initCss();
        self.itemCount = self.menuItems.length;
        self._step = (self.options.angle.end - self.options.angle.start) / (self.itemCount - 1);
        self.menuItems.each(function (index) {
            var item = $(this),
                angle = (self.options.angle.start + (self._step * index)) * (Math.PI / 180),
                x = Math.round(self.options.circleRadius * Math.cos(angle)),
                y = Math.round(self.options.circleRadius * Math.sin(angle));

            item.data('plugin_' + pluginName + '-pos-x', x);
            item.data('plugin_' + pluginName + '-pos-y', y);
            item.on('click', function () {
                self.select(index + 2);
            });
        });

        // Initialize event hooks from options
        ['open', 'close', 'init', 'select'].forEach(function (evt) {
            var fn;

            if (self.options[evt]) {
                fn = self.options[evt];
                self.element.on(pluginName + '-' + evt, function () {
                    return fn.apply(self, arguments);
                });
                delete self.options[evt];
            }
        });

        self.submenus = self.menuItems.children('ul');
        self.submenus.circleMenu($.extend({}, self.options, {depth: self.options.depth + 1}));

        self.trigger('init');
    };
    CircleMenu.prototype.trigger = function () {
        var args = [], i, len;

        for (i = 0, len = arguments.length; i < len; i++) {
            args.push(arguments[i]);
        }
        this.element.trigger(pluginName + '-' + args.shift(), args);
    };
    CircleMenu.prototype.hook = function () {
        var self = this;

        if (self.options.trigger === 'hover') {
            self.element.on('mouseenter', function (evt) {
                self.open();
            }).on('mouseleave', function (evt) {
                self.close();
            });
        } else if (self.options.trigger === 'click') {
            self.element.children('li:first-child').on('click', function (evt) {
                evt.preventDefault();
                if (self._state === 'closed' || self._state === 'closing') {
                    self.open();
                } else {
                    self.close(true);
                }
                return false;
            });
        } else if (self.options.trigger === 'none') {
            // Do nothing
        }
    };
    CircleMenu.prototype.open = function () {
        var self = this,
            element = this.element,
            start = 0,
            set;

        self.clearTimeouts();
        if (self._state === 'open') {
            return self;
        }
        element.addClass(pluginName + '-open');
        element.removeClass(pluginName + '-closed');
        if (self.options.stepOut >= 0) {
            set = self.menuItems;
        } else {
            set = $(self.menuItems.get().reverse());
        }
        set.each(function (index) {
            var item = $(this);

            self._timeouts.push(setTimeout(function () {
                item.css({
                    left: item.data('plugin_' + pluginName + '-pos-x') + 'px',
                    top: item.data('plugin_' + pluginName + '-pos-y') + 'px'
                });
                vendorPrefixes(item, 'transform', 'scale(1)');
            }, start + Math.abs(self.options.stepOut) * index));
        });
        self._timeouts.push(setTimeout(function () {
            if (self._state === 'opening') {
                self.trigger('open');
            }
            self._state = 'open';
        }, start + Math.abs(self.options.stepOut) * set.length));
        self._state = 'opening';
        return self;
    };
    CircleMenu.prototype.close = function (immediate) {
        var self = this,
            element = this.element,
            animate = function animate() {
                var start = 0, set;

                self.submenus.circleMenu('close');
                self.clearTimeouts();
                if (self._state === 'closed') {
                    return self;
                }
                if (self.options.stepIn >= 0) {
                    set = self.menuItems;
                } else {
                    set = $(self.menuItems.get().reverse());
                }
                set.each(function (index) {
                    var item = $(this);

                    self._timeouts.push(setTimeout(function () {
                        item.css({top: 0, left: 0});
                        vendorPrefixes(item, 'transform', 'scale(.5)');
                    }, start + Math.abs(self.options.stepIn) * index));
                });
                self._timeouts.push(setTimeout(function () {
                    if (self._state === 'closing') {
                        self.trigger('close');
                    }
                    self._state = 'closed';
                }, start + Math.abs(self.options.stepIn) * set.length));
                element.removeClass(pluginName + '-open');
                element.addClass(pluginName + '-closed');
                self._state = 'closing';
                return self;
            };
        if (immediate) {
            animate();
        } else {
            self._timeouts.push(setTimeout(animate, self.options.delay));
        }
        return this;
    };
    CircleMenu.prototype.select = function (index) {
        var self = this, selected, setOther;

        if (self._state === 'open' || self._state === 'opening') {
            self.clearTimeouts();
            setOther = self.element.children('li:not(:nth-child(' + index + '),:first-child)');
            selected = self.element.children('li:nth-child(' + index + ')');
            self.trigger('select', selected);
            vendorPrefixes(selected.add(setOther), 'transition', 'all 500ms ease-out');
            vendorPrefixes(selected, 'transform', 'scale(2)');
            vendorPrefixes(setOther, 'transform', 'scale(0)');
            selected.css('opacity', '0');
            setOther.css('opacity', '0');
            self.element.removeClass(pluginName + '-open');
            setTimeout(function () {
                self.initCss();
            }, 500);
        }
    };
    CircleMenu.prototype.clearTimeouts = function () {
        var timeout;

        while (timeout = this._timeouts.shift()) {
            clearTimeout(timeout);
        }
    };
    CircleMenu.prototype.initCss = function () {
        var self = this, items;

        self._state = 'closed';
        self.element.removeClass(pluginName + '-open');
        self.element.css({
            'list-style': 'none',
            'margin': 0,
            'padding': 0,
            'width': self.options.itemDiameter + 'px'
        });
        items = self.element.children('li');
        items.attr('style', '');
        items.css({
            'display': 'block',
            'width': self.options.itemDiameter + 'px',
            'height': self.options.itemDiameter + 'px',
            'text-align': 'center',
            'line-height': self.options.itemDiameter + 'px',
            'position': 'absolute',
            'z-index': 1,
            'opacity': ''
        });
        self.element.children('li:first-child').css({'z-index': 1000 - self.options.depth});
        self.menuItems.css({
            top: 0,
            left: 0
        });
        vendorPrefixes(items, 'border-radius', self.options.itemDiameter + 'px');
        vendorPrefixes(self.menuItems, 'transform', 'scale(.5)');
        setTimeout(function () {
            vendorPrefixes(items, 'transition', 'all ' + self.options.speed + 'ms ' + self.options.transitionFunction);
        }, 0);
    };

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            var obj = $.data(this, 'plugin_' + pluginName),
                commands = {
                    'init': function () {
                        obj.init();
                    },
                    'open': function () {
                        obj.open();
                    },
                    'close': function () {
                        obj.close(true);
                    }
                };
            if (typeof options === 'string' && obj && commands[options]) {
                commands[options]();
            }
            if (!obj) {
                $.data(this, 'plugin_' + pluginName, new CircleMenu(this, options));
            }
        });
    };
})(jQuery, window, document);