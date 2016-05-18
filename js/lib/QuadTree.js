var QuadTree = QuadTree || {}; // global var for the quadtree

(function (global) {
    "use strict";

    /**
     * Usage:
     * To create a new empty Quadtree, do this:
     * var tree = new QuadTree(args)
     *
     * args = {
     *    // mandatory fields
     *    x : x coordinate
     *    y : y coordinate
     *    width : width
     *    height : height
     *
     *    // optional fields
     *    maxChildren : max children per node
     *    maxDepth : max depth of the tree
     *}
     *
     * API:
     * tree.insert() accepts arrays or single items every item must have a
     * .position.x, .position.y, .width, and .height property.
     * if they don't, the tree will break.
     *
     * tree.retrieve(selector, callback) calls the callback for all objects that are in
     * the same region or overlapping.
     *
     * tree.clear() removes all items from the quadtree.
     */

    /**
     * QuadTree Implementation in JavaScript
     * @author: silflow <https://github.com/silflow>
     * @name QuadTree
     * @constructor
     */
    var QuadTree = function (args) {
        var TOP_LEFT = 0,
            TOP_RIGHT = 1,
            BOTTOM_LEFT = 2,
            BOTTOM_RIGHT = 3,
            PARENT = 4;

        // Assign some default values
        args.maxChildren = args.maxChildren || 2;
        args.maxDepth = args.maxDepth || 8;

        /**
         * Node creator.
         * You should never create a node manually since the algorithm takes care of that for you.
         * @param {number} x
         * @param {number} y
         * @param {number} width
         * @param {number} height
         * @param {number} depth
         * @param {number} maxChildren
         * @param {number} maxDepth
         * @returns {{x: *, y: *, width: *, height: *, depth: *, retrieve: Function, insert: Function, findInsertNode: Function, findOverlappingNodes: Function, divide: Function, clear: Function, getNodes: Function}}
         */
        var node = function (x, y, width, height, depth, maxChildren, maxDepth) {
            var items = [], // holds all items
                nodes = []; // holds all child nodes

            // returns a fresh node object
            return {
                id: Utility.Strings.guid(),
                x: x, // top left point
                y: y, // top right point
                width: width, // width
                height: height, // height
                corners: [
                    new Point(x, y),
                    new Point(x + width, y),
                    new Point(x + width, y + height),
                    new Point(x, y + height)
                ],
                depth: depth, // depth level of the node
                items: items,

                /**
                 * Iterates all items that match the selector and invokes the supplied callback on them.
                 * @param {Array|Object} item
                 * @param {Function} callback
                 * @param {Node} instance
                 */
                retrieve: function (item, callback, instance) {
                    for (let i = 0, il = items.length; i < il; ++i) {
                        (instance) ? callback.call(instance, [items[i]]) : callback(items[i]);
                    }
                    // check if node has subnodes
                    if (nodes.length) {
                        // call retrieve on all matching subnodes
                        this.findOverlappingNodes(item, function (dir) {
                            nodes[dir].retrieve(item, callback, instance);
                        });
                    }
                },

                /**
                 * Adds a new Item to the node.
                 *
                 * If the node already has sub nodes, the item gets pushed down one level.
                 * If the item does not fit into the sub nodes, it gets saved in the
                 * "children"-array.
                 *
                 * If the maxChildren limit is exceeded after inserting the item,
                 * the node gets divided and all items inside the "children"-array get
                 * pushed down to the new sub nodes.
                 * @param {Array|Object} item
                 */
                insert: function (item) {
                    if (nodes.length) {
                        // Get the node in which the item fits best
                        let i = this.findInsertNode(item);
                        if (i === PARENT) {
                            // If the item does not fit, push it into the children array
                            items.push(item);
                        } else {
                            nodes[i].insert(item);
                        }
                    } else {
                        items.push(item);
                        // Divide the node if maxChildren is exceeded and maxDepth is not reached
                        if (items.length > maxChildren && this.depth < maxDepth) {
                            this.divide();
                        }
                    }
                },

                /**
                 * Find a node the item should be inserted in.
                 * @param {Entity} item
                 * @returns {number}
                 */
                findInsertNode: function (item) {
                    let wD = this.width / 2,
                        hD = this.height / 2;
                    if (item.bounds !== undefined) {
                        // Left
                        if (item.bounds.x < this.x + wD) {
                            if (item.bounds.y < this.y + hD) {
                                return TOP_LEFT;
                            }
                            if (item.bounds.y + item.bounds.height >= this.y + hD) {
                                return BOTTOM_LEFT;
                            }
                            return PARENT;
                        }
                        // Right
                        if (item.bounds.x + item.width >= this.x + wD) {
                            if (item.bounds.y < this.y + hD) {
                                return TOP_RIGHT;
                            }
                            if (item.bounds.y + item.bounds.height >= this.y + hD) {
                                return BOTTOM_RIGHT;
                            }
                            return PARENT;
                        }
                    }

                    return PARENT;
                },
                /**
                 * Finds the regions that the item overlaps with, see constants defined
                 * above. The callback is called for every region the item overlaps.
                 * @param {Entity} item
                 * @param {Function} callback
                 */
                findOverlappingNodes: function (item, callback) {
                    let wD = this.width / 2,
                        hD = this.height / 2;
                    if (item.bounds !== undefined) {
                        // Left
                        if (item.bounds.x < this.x + wD) {
                            if (item.bounds.y < this.y + hD) {
                                callback(TOP_LEFT);
                            }
                            if (item.bounds.y + item.bounds.height >= this.y + hD) {
                                callback(BOTTOM_LEFT);
                            }
                        }
                        // Right
                        if (item.bounds.x + item.bounds.width >= this.x + wD) {
                            if (item.bounds.y < this.y + hD) {
                                callback(TOP_RIGHT);
                            }
                            if (item.position.y + item.bounds.height >= this.y + hD) {
                                callback(BOTTOM_RIGHT);
                            }
                        }
                    }
                },

                /**
                 * Divides the current node into four sub nodes and adds them
                 * to the nodes array of the current node. Then reinserts all
                 * children.
                 */
                divide: function () {
                    let width, height, oldChildren,
                        childrenDepth = this.depth + 1;
                    // Set the dimensions of the new nodes
                    width = (this.width / 2);
                    height = (this.height / 2);
                    // Create top left node
                    nodes.push(node(this.x, this.y, width, height, childrenDepth, maxChildren, maxDepth));
                    // Create top right node
                    nodes.push(node(this.x + width, this.y, width, height, childrenDepth, maxChildren, maxDepth));
                    // Create bottom left node
                    nodes.push(node(this.x, this.y + height, width, height, childrenDepth, maxChildren, maxDepth));
                    // Create bottom right node
                    nodes.push(node(this.x + width, this.y + height, width, height, childrenDepth, maxChildren, maxDepth));

                    oldChildren = items;
                    items = [];
                    for (let i = 0; i < oldChildren.length; i++) {
                        this.insert(oldChildren[i]);
                    }
                },

                /**
                 * Clears the node and all its sub nodes.
                 */
                clear: function () {
                    var i;
                    for (i = 0; i < nodes.length; i++) {
                        nodes[i].clear();
                    }
                    items.length = 0;
                    nodes.length = 0;
                },

                /*
                 * Convenience method that is not used in the core algorithm.
                 * ---------------------------------------------------------
                 * This returns this nodes sub nodes. this is useful if we want to do stuff
                 * with the nodes, i.e. accessing the bounds of the nodes to draw them
                 * on a canvas for debugging etc...
                 */
                getNodes: function () {
                    return nodes.length ? nodes : false;
                }
            };
        };

        return {
            root: (function () {
                return node(args.x, args.y, args.width, args.height, 0, args.maxChildren, args.maxDepth);
            }()),
            /**
             * Insert an item into the node
             * @param {Array|Object} item
             */
            insert: function (item) {
                if (item instanceof Array) {
                    for (let i = 0, len = item.length; i < len; i++) {
                        this.root.insert(item[i]);
                    }
                } else {
                    this.root.insert(item);
                }
            },
            /**
             * Retrieve an item from the QuadTree
             * @param {Array|Object} selector
             * @param {Function} callback
             * @param {Node} instance
             * @returns {Node}
             */
            retrieve: function (selector, callback, instance) {
                return this.root.retrieve(selector, callback, instance);
            },
            /**
             * Clear the QuadTree
             */
            clear: function () {
                this.root.clear();
            }
        };
    };
    global.QuadTree = QuadTree;

}(this));
