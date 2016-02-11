(function (global) {
    "use strict";

    class Std {
        constructor() {
            this.name = true;
        }

        string(s) {
            return js_Boot.string_rec(s, "");
        }
    }

    class Block {
        constructor() {
            this.name = true;
        }
    }

    class EndPoint extends Point {
        constructor(x, y) {
            super(x, y);
            this.visualize = false;
            this.angle = 0.0;
            this.segment = null;
            this.begin = false;
            this.name = true;
            this.super = Point;
        }
    }

    class Segment {
        constructor() {
            this.name = true;
        }
    }

    class Visibility {
        constructor() {
            this.segments = new de_polygonal_ds_DLL();
            this.endpoints = new de_polygonal_ds_DLL();
            this.open = new de_polygonal_ds_DLL();
            this.center = new Point(0.0, 0.0);
            this.output = new Array();
            this.demo_intersectionsDetected = [];
            this.segments.toArray();
            this.name = true;
        }

        _endpoint_compare(a, b) {
            if (a.angle > b.angle) {
                return 1;
            }
            if (a.angle < b.angle) {
                return -1;
            }
            if (!a.begin && b.begin) {
                return 1;
            }
            if (a.begin && !b.begin) {
                return -1;
            }
            return 0;
        }

        leftOf(s, p) {
            var cross = (s.p2.x - s.p1.x) * (p.y - s.p1.y) - (s.p2.y - s.p1.y) * (p.x - s.p1.x);
            return cross < 0;
        }

        interpolate(p, q, f) {
            return new Point(p.x * (1 - f) + q.x * f, p.y * (1 - f) + q.y * f);
        }

        loadEdgeOfMap(size, margin) {
            this.addSegment(margin, margin, margin, size - margin);
            this.addSegment(margin, size - margin, size - margin, size - margin);
            this.addSegment(size - margin, size - margin, size - margin, margin);
            this.addSegment(size - margin, margin, margin, margin);
        }

        loadMap(size, margin, blocks, walls) {
            this.segments.clear();
            this.endpoints.clear();
            this.loadEdgeOfMap(size, margin);
            var _g = 0;
            while (_g < blocks.length) {
                var block = blocks[_g];
                ++_g;
                var x = block.x;
                var y = block.y;
                var r = block.r;
                this.addSegment(x - r, y - r, x - r, y + r);
                this.addSegment(x - r, y + r, x + r, y + r);
                this.addSegment(x + r, y + r, x + r, y - r);
                this.addSegment(x + r, y - r, x - r, y - r);
            }
            var _g1 = 0;
            while (_g1 < walls.length) {
                var wall = walls[_g1];
                ++_g1;
                this.addSegment(wall.p1.x, wall.p1.y, wall.p2.x, wall.p2.y);
            }
        }

        addSegment(x1, y1, x2, y2) {
            var segment = null;
            var p1 = new EndPoint(0.0, 0.0);
            p1.segment = segment;
            p1.visualize = true;
            var p2 = new EndPoint(0.0, 0.0);
            p2.segment = segment;
            p2.visualize = false;
            segment = new Segment();
            p1.x = x1;
            p1.y = y1;
            p2.x = x2;
            p2.y = y2;
            p1.segment = segment;
            p2.segment = segment;
            segment.p1 = p1;
            segment.p2 = p2;
            segment.d = 0.0;
            this.segments.append(segment);
            this.endpoints.append(p1);
            this.endpoints.append(p2);
        }

        setLightLocation(x, y) {
            this.center.x = x;
            this.center.y = y;
            var $it0 = this.segments.iterator();
            while ($it0.hasNext()) {
                var segment = $it0.next();
                var dx = 0.5 * (segment.p1.x + segment.p2.x) - x;
                var dy = 0.5 * (segment.p1.y + segment.p2.y) - y;
                segment.d = dx * dx + dy * dy;
                segment.p1.angle = Math.atan2(segment.p1.y - y, segment.p1.x - x);
                segment.p2.angle = Math.atan2(segment.p2.y - y, segment.p2.x - x);
                var dAngle = segment.p2.angle - segment.p1.angle;
                if (dAngle <= -Math.PI) {
                    dAngle += 2 * Math.PI;
                }
                if (dAngle > Math.PI) {
                    dAngle -= 2 * Math.PI;
                }
                segment.p1.begin = dAngle > 0.0;
                segment.p2.begin = !segment.p1.begin;
            }
        }

        _segment_in_front_of(a, b, relativeTo) {
            var A1 = Visibility.leftOf(a, Visibility.interpolate(b.p1, b.p2, 0.01));
            var A2 = Visibility.leftOf(a, Visibility.interpolate(b.p2, b.p1, 0.01));
            var A3 = Visibility.leftOf(a, relativeTo);
            var B1 = Visibility.leftOf(b, Visibility.interpolate(a.p1, a.p2, 0.01));
            var B2 = Visibility.leftOf(b, Visibility.interpolate(a.p2, a.p1, 0.01));
            var B3 = Visibility.leftOf(b, relativeTo);
            if (B1 === B2 && B2 !== B3) {
                return true;
            }
            if (A1 === A2 && A2 === A3) {
                return true;
            }
            if (A1 === A2 && A2 !== A3) {
                return false;
            }
            if (B1 === B2 && B2 === B3) {
                return false;
            }
            this.demo_intersectionsDetected.push([a.p1, a.p2, b.p1, b.p2]);
            return false;
        }

        sweep(maxAngle) {
            if (maxAngle === null) {
                maxAngle = 999.0;
            }
            this.output = [];
            this.demo_intersectionsDetected = [];
            this.endpoints.sort(Visibility._endpoint_compare, true);
            this.open.clear();
            var beginAngle = 0.0;
            var _g = 0;
            while (_g < 2) {
                var pass = _g++;
                var $it0 = this.endpoints.iterator();
                while ($it0.hasNext()) {
                    var p = $it0.next();
                    if (pass === 1 && p.angle > maxAngle) {
                        break;
                    }
                    var current_old;
                    if (this.open._size === 0) {
                        current_old = null;
                    } else {
                        current_old = this.open.head.val;
                    }
                    if (p.begin) {
                        var node = this.open.head;
                        while (node !== null && this._segment_in_front_of(p.segment, node.val, this.center)) {
                            node = node.next;
                        }
                        if (node === null) {
                            this.open.append(p.segment);
                        } else {
                            this.open.insertBefore(node, p.segment);
                        }
                    } else {
                        this.open.remove(p.segment);
                    }
                    var current_new;
                    if (this.open._size === 0) {
                        current_new = null;
                    } else {
                        current_new = this.open.head.val;
                    }
                    if (current_old !== current_new) {
                        if (pass === 1) {
                            this.addTriangle(beginAngle, p.angle, current_old);
                        }
                        beginAngle = p.angle;
                    }
                }
            }
        }

        lineIntersection(p1, p2, p3, p4) {
            var s = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
            return new Point(p1.x + s * (p2.x - p1.x), p1.y + s * (p2.y - p1.y));
        }

        addTriangle(angle1, angle2, segment) {
            var p1 = this.center;
            var p2 = new Point(this.center.x + Math.cos(angle1), this.center.y + Math.sin(angle1));
            var p3 = new Point(0.0, 0.0);
            var p4 = new Point(0.0, 0.0);
            if (segment !== null) {
                p3.x = segment.p1.x;
                p3.y = segment.p1.y;
                p4.x = segment.p2.x;
                p4.y = segment.p2.y;
            } else {
                p3.x = this.center.x + Math.cos(angle1) * 500;
                p3.y = this.center.y + Math.sin(angle1) * 500;
                p4.x = this.center.x + Math.cos(angle2) * 500;
                p4.y = this.center.y + Math.sin(angle2) * 500;
            }
            var pBegin = this.lineIntersection(p3, p4, p1, p2);
            p2.x = this.center.x + Math.cos(angle2);
            p2.y = this.center.y + Math.sin(angle2);
            var pEnd = this.lineIntersection(p3, p4, p1, p2);
            this.output.push(pBegin);
            this.output.push(pEnd);
        }
    }

    class de_polygonal_ds_ArrayUtil {
        constructor() {
            this.name = true;
        }

        alloc(x) {
            var a;
            a = new Array(x);
            return a;
        }
    }

    class de_polygonal_ds_Hashable {
        constructor() {
            this.name = true;
        }
    }

    class de_polygonal_ds_Collection {
        constructor() {
            this.name = true;
            this.interfaces = [de_polygonal_ds_Hashable];
        }
    }

    class de_polygonal_ds_Comparable {
        constructor() {
            this.name = true;
        }
    }

    class de_polygonal_ds_Itr {
        constructor() {
            this.name = true;
        }
    }

    class de_polygonal_ds_DLL {
        constructor(reservedSize, maxSize) {
            if (maxSize === null) {
                maxSize = -1;
            }
            if (reservedSize === null) {
                reservedSize = 0;
            }
            this.maxSize = -1;
            this._reservedSize = reservedSize;
            this._size = 0;
            this._poolSize = 0;
            this._circular = false;
            this._iterator = null;
            if (reservedSize > 0) {
                this._headPool = this._tailPool = new de_polygonal_ds_DLLNode(null, this);
            }
            this.head = this.tail = null;
            this.key = de_polygonal_ds_HashKey._counter++;
            this.reuseIterator = false;
            de_polygonal_ds_DLL.name = true;
            de_polygonal_ds_DLL.interfaces = [de_polygonal_ds_Collection];
        }

        append(x) {
            var node = this._getNode(x);
            if (this.tail !== null) {
                this.tail.next = node;
                node.prev = this.tail;
            } else {
                this.head = node;
            }
            this.tail = node;
            if (this._circular) {
                this.tail.next = this.head;
                this.head.prev = this.tail;
            }
            this._size++;
            return node;
        }

        insertBefore(node, x) {
            var t = this._getNode(x);
            node._insertBefore(t);
            if (node === this.head) {
                this.head = t;
                if (this._circular) {
                    this.head.prev = this.tail;
                }
            }
            this._size++;
            return t;
        }

        unlink(node) {
            var hook = node.next;
            if (node === this.head) {
                this.head = this.head.next;
                if (this._circular) {
                    if (this.head === this.tail) {
                        this.head = null;
                    } else {
                        this.tail.next = this.head;
                    }
                }
                if (this.head === null) {
                    this.tail = null;
                }
            } else if (node === this.tail) {
                this.tail = this.tail.prev;
                if (this._circular) {
                    this.head.prev = this.tail;
                }
                if (this.tail === null) {
                    this.head = null;
                }
            }
            node._unlink();
            this._putNode(node);
            this._size--;
            return hook;
        }

        sort(compare, useInsertionSort) {
            if (useInsertionSort === null) {
                useInsertionSort = false;
            }
            if (this._size > 1) {
                if (this._circular) {
                    this.tail.next = null;
                    this.head.prev = null;
                }
                if (compare === null) {
                    if (useInsertionSort) {
                        this.head = this._insertionSortComparable(this.head);
                    } else {
                        this.head = this._mergeSortComparable(this.head);
                    }
                } else {
                    if (useInsertionSort) {
                        this.head = this._insertionSort(this.head, compare);
                    } else {
                        this.head = this._mergeSort(this.head, compare);
                    }
                }
                if (this._circular) {
                    this.tail.next = this.head;
                    this.head.prev = this.tail;
                }
            }
        }

        remove(x) {
            var s = this._size;
            if (s === 0) {
                return false;
            }
            var node = this.head;
            while (node !== null) {
                if (node.val === x) {
                    node = this.unlink(node);
                } else {
                    node = node.next;
                }
            }
            return this._size < s;
        }

        clear(purge) {
            if (purge === null) {
                purge = false;
            }
            if (purge || this._reservedSize > 0) {
                var node = this.head;
                var _g1 = 0;
                var _g = this._size;
                while (_g1 < _g) {
                    var i = _g1++;
                    var next = node.next;
                    node.prev = null;
                    node.next = null;
                    this._putNode(node);
                    node = next;
                }
            }
            this.head = this.tail = null;
            this._size = 0;
        }

        iterator() {
            if (this.reuseIterator) {
                if (this._iterator === null) {
                    if (this._circular) {
                        return new de_polygonal_ds_CircularDLLIterator(this);
                    } else {
                        return new de_polygonal_ds_DLLIterator(this);
                    }
                } else {
                    this._iterator.reset();
                }
                return this._iterator;
            } else if (this._circular) {
                return new de_polygonal_ds_CircularDLLIterator(this);
            } else {
                return new de_polygonal_ds_DLLIterator(this);
            }
        }

        toArray() {
            var a = de_polygonal_ds_ArrayUtil.alloc(this._size);
            var node = this.head;
            var _g1 = 0;
            var _g = this._size;
            while (_g1 < _g) {
                var i = _g1++;
                a[i] = node.val;
                node = node.next;
            }
            return a;
        }

        _mergeSortComparable(node) {
            var h = node;
            var p;
            var q;
            var e;
            var tail = null;
            var insize = 1;
            var nmerges;
            var psize;
            var qsize;
            var i;
            while (true) {
                p = h;
                h = tail = null;
                nmerges = 0;
                while (p !== null) {
                    nmerges++;
                    psize = 0;
                    q = p;
                    var _g = 0;
                    while (_g < insize) {
                        var i1 = _g++;
                        psize++;
                        q = q.next;
                        if (q == null) {
                            break;
                        }
                    }
                    qsize = insize;
                    while (psize > 0 || qsize > 0 && q !== null) {
                        if (psize == 0) {
                            e = q;
                            q = q.next;
                            qsize--;
                        } else if (qsize === 0 || q === null) {
                            e = p;
                            p = p.next;
                            psize--;
                        } else if ((js_Boot.cast(p.val, de_polygonal_ds_Comparable)).compare(q.val) >= 0) {
                            e = p;
                            p = p.next;
                            psize--;
                        } else {
                            e = q;
                            q = q.next;
                            qsize--;
                        }
                        if (tail !== null) {
                            tail.next = e;
                        } else {
                            h = e;
                        }
                        e.prev = tail;
                        tail = e;
                    }
                    p = q;
                }
                tail.next = null;
                if (nmerges <= 1) {
                    break;
                }
                insize <<= 1;
            }
            h.prev = null;
            this.tail = tail;
            return h;
        }

        _mergeSort(node, cmp) {
            var h = node;
            var p;
            var q;
            var e;
            var tail = null;
            var insize = 1;
            var nmerges;
            var psize;
            var qsize;
            var i;
            while (true) {
                p = h;
                h = tail = null;
                nmerges = 0;
                while (p !== null) {
                    nmerges++;
                    psize = 0;
                    q = p;
                    var _g = 0;
                    while (_g < insize) {
                        var i1 = _g++;
                        psize++;
                        q = q.next;
                        if (q === null) {
                            break;
                        }
                    }
                    qsize = insize;
                    while (psize > 0 || qsize > 0 && q !== null) {
                        if (psize == 0) {
                            e = q;
                            q = q.next;
                            qsize--;
                        } else if (qsize === 0 || q === null) {
                            e = p;
                            p = p.next;
                            psize--;
                        } else if (cmp(q.val, p.val) >= 0) {
                            e = p;
                            p = p.next;
                            psize--;
                        } else {
                            e = q;
                            q = q.next;
                            qsize--;
                        }
                        if (tail !== null) {
                            tail.next = e;
                        } else {
                            h = e;
                        }
                        e.prev = tail;
                        tail = e;
                    }
                    p = q;
                }
                tail.next = null;
                if (nmerges <= 1) {
                    break;
                }
                insize <<= 1;
            }
            h.prev = null;
            this.tail = tail;
            return h;
        }

        _insertionSortComparable(node) {
            var h = node;
            var n = h.next;
            while (n !== null) {
                var m = n.next;
                var p = n.prev;
                var v = n.val;
                if ((js_Boot.cast(p.val, de_polygonal_ds_Comparable)).compare(v) < 0) {
                    var i = p;
                    while (i.prev !== null) {
                        if ((js_Boot.cast(i.prev.val, de_polygonal_ds_Comparable)).compare(v) < 0) {
                            i = i.prev;
                        } else {
                            break;
                        }
                    }
                    if (m !== null) {
                        p.next = m;
                        m.prev = p;
                    } else {
                        p.next = null;
                        this.tail = p;
                    }
                    if (i === h) {
                        n.prev = null;
                        n.next = i;
                        i.prev = n;
                        h = n;
                    } else {
                        n.prev = i.prev;
                        i.prev.next = n;
                        n.next = i;
                        i.prev = n;
                    }
                }
                n = m;
            }
            return h;
        }

        _insertionSort(node, cmp) {
            var h = node;
            var n = h.next;
            while (n !== null) {
                var m = n.next;
                var p = n.prev;
                var v = n.val;
                if (cmp(v, p.val) < 0) {
                    var i = p;
                    while (i.prev !== null) {
                        if (cmp(v, i.prev.val) < 0) {
                            i = i.prev;
                        } else {
                            break;
                        }
                    }
                    if (m !== null) {
                        p.next = m;
                        m.prev = p;
                    } else {
                        p.next = null;
                        this.tail = p;
                    }
                    if (i === h) {
                        n.prev = null;
                        n.next = i;
                        i.prev = n;
                        h = n;
                    } else {
                        n.prev = i.prev;
                        i.prev.next = n;
                        n.next = i;
                        i.prev = n;
                    }
                }
                n = m;
            }
            return h;
        }

        _getNode(x) {
            if (this._reservedSize === 0 || this._poolSize === 0) {
                return new de_polygonal_ds_DLLNode(x, this);
            } else {
                var n = this._headPool;
                this._headPool = this._headPool.next;
                this._poolSize--;
                n.next = null;
                n.val = x;
                return n;
            }
        }

        _putNode(x) {
            var val = x.val;
            if (this._reservedSize > 0 && this._poolSize < this._reservedSize) {
                this._tailPool = this._tailPool.next = x;
                x.val = null;
                this._poolSize++;
            } else {
                x._list = null;
            }
            return val;
        }
    }

    class de_polygonal_ds_DLLIterator {
        constructor(f) {
            this._f = f;
            {
                this._walker = this._f.head;
                this._hook = null;
                this;
            }
            this.name = true;
            this.interfaces = [de_polygonal_ds_Itr];
        }

        reset() {
            this._walker = this._f.head;
            this._hook = null;
            return this;
        }

        hasNext() {
            return this._walker !== null;
        }

        next() {
            var x = this._walker.val;
            this._hook = this._walker;
            this._walker = this._walker.next;
            return x;
        }
    }

    class de_polygonal_ds_CircularDLLIterator {
        constructor(f) {
            this._f = f;
            {
                this._walker = this._f.head;
                this._s = this._f._size;
                this._i = 0;
                this._hook = null;
                this;
            }
            this.name = true;
            this.interfaces = [de_polygonal_ds_Itr];
        }

        reset() {
            this._walker = this._f.head;
            this._s = this._f._size;
            this._i = 0;
            this._hook = null;
            return this;
        }

        hasNext() {
            return this._i < this._s;
        }

        next() {
            var x = this._walker.val;
            this._hook = this._walker;
            this._walker = this._walker.next;
            this._i++;
            return x;
        }
    }

    class de_polygonal_ds_DLLNode {
        constructor(x, list) {
            this.val = x;
            this._list = list;
            this.name = true;
        }

        _unlink() {
            var t = this.next;
            if (this.prev != null) {
                this.prev.next = this.next;
            }
            if (this.next != null) {
                this.next.prev = this.prev;
            }
            this.next = this.prev = null;
            return t;
        }

        _insertAfter(node) {
            node.next = this.next;
            node.prev = this;
            if (this.next != null) {
                this.next.prev = node;
            }
            this.next = node;
        }

        _insertBefore(node) {
            node.next = this;
            node.prev = this.prev;
            if (this.prev != null) {
                this.prev.next = node;
            }
            this.prev = node;
        }
    }

    class de_polygonal_ds_HashKey {
        constructor() {
            this.name = true;
        }
    }

    class js_Boot {
        constructor() {
            this.name = true;
        }

        getClass(o) {
            if ((o instanceof Array) && o.enum === null) {
                return Array;
            } else {
                return o.class;
            }
        }

        string_rec(o, s) {
            if (o == null) {
                return "null";
            }
            if (s.length >= 5) {
                return "<...>";
            }
            var t = typeof(o);
            if (t === "function" && (o.name || o.ename)) {
                t = "object";
            }
            switch (t) {
                case "object":
                    if (o instanceof Array) {
                        if (o.enum) {
                            if (o.length === 2) {
                                return o[0];
                            }
                            var str = o[0] + "(";
                            s += "\t";
                            var _g1 = 2;
                            var _g = o.length;
                            while (_g1 < _g) {
                                var i = _g1++;
                                if (i !== 2) {
                                    str += "," + js_Boot.string_rec(o[i], s);
                                } else {
                                    str += js_Boot.string_rec(o[i], s);
                                }
                            }
                            return str + ")";
                        }
                        var l = o.length;
                        var i1;
                        var str1 = "[";
                        s += "\t";
                        var _g2 = 0;
                        while (_g2 < l) {
                            var i2 = _g2++;
                            str1 += (i2 > 0 ? "," : "") + js_Boot.string_rec(o[i2], s);
                        }
                        str1 += "]";
                        return str1;
                    }
                    var tostr;
                    try {
                        tostr = o.toString;
                    } catch (e) {
                        return "???";
                    }
                    if (tostr !== null && tostr !== Object.toString) {
                        var s2 = o.toString();
                        if (s2 != "[object Object]") {
                            return s2;
                        }
                    }
                    var k = null;
                    var str2 = "{\n";
                    s += "\t";
                    var hasp = o.hasOwnProperty !== null;
                    for (var k in o) {
                        if (hasp && !o.hasOwnProperty(k)) {
                            continue;
                        }
                        if (k === "prototype" || k === "class" || k === "super" || k === "interfaces" || k === "properties") {
                            continue;
                        }
                        if (str2.length != 2) str2 += ", \n";
                        str2 += s + k + " : " + js_Boot.string_rec(o[k], s);
                    }
                    s = s.substring(1);
                    str2 += "\n" + s + "}";
                    return str2;
                case "function":
                    return "<function>";
                case "string":
                    return o;
                default:
                    return String(o);
            }
        }

        interfLoop(cc, cl) {
            if (cc === null) {
                return false;
            }
            if (cc === cl) {
                return true;
            }
            var intf = cc.interfaces;
            if (intf !== null) {
                var _g1 = 0;
                var _g = intf.length;
                while (_g1 < _g) {
                    var i = _g1++;
                    var i1 = intf[i];
                    if (i1 === cl || js_Boot.interfLoop(i1, cl)) {
                        return true;
                    }
                }
            }
            return js_Boot.interfLoop(cc.super, cl);
        }

        instanceof(o, cl) {
            if (cl === null) {
                return false;
            }
            switch (cl) {
                case Int:
                    return (o | 0) === o;
                case Float:
                    return typeof(o) === "number";
                case Bool:
                    return typeof(o) === "boolean";
                case String:
                    return typeof(o) === "string";
                case Array:
                    return (o instanceof Array) && o.enum === null;
                case Dynamic:
                    return true;
                default:
                    if (o !== null) {
                        if (typeof(cl) === "function") {
                            if (o instanceof cl) {
                                return true;
                            }
                            if (js_Boot.interfLoop(js_Boot.getClass(o), cl)) {
                                return true;
                            }
                        }
                    } else {
                        return false;
                    }
                    if (cl === Class && o.name !== null) {
                        return true;
                    }
                    if (cl === Enum && o.ename !== null) {
                        return true;
                    }
                    return o.enum === cl;
            }
        }

        cast(o, t) {
            if (js_Boot.instanceof(o, t)) {
                return o;
            } else {
                throw "Cannot cast " + Std.string(o) + " to " + Std.string(t);
            }
        }
    }

    Math.NaN = Number.NaN;
    Math.NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;
    Math.POSITIVE_INFINITY = Number.POSITIVE_INFINITY;
    Math.isFinite = function (i) {
        return isFinite(i);
    };
    Math.isNaN = function (i1) {
        return isNaN(i1);
    };
    String.prototype.class = String;
    String.name = true;
    Array.name = true;
    var Int = {name: ["Int"]};
    var Dynamic = {name: ["Dynamic"]};
    var Float = Number;
    Float.name = ["Float"];
    var Bool = Boolean;
    Bool.ename = ["Bool"];
    var Class = {name: ["Class"]};
    var Enum = {};
    de_polygonal_ds_HashKey._counter = 0;


}(this));

