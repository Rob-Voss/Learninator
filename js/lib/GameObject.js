class GameObject {

  /**
   * @constructor
   * @param  {Object} game
   */
  constructor(game) {
    var self = this;
    this.game = game;
    this.bodies = [];
    this.constraints = [];
    this.containers = [];
    this.children = [];
  }

  /**
   * Adds the supplied p2 body to the game's world and to
   * this GameObject's bodies collection
   * Also creates a corresponding PIXI Container object for rendering.
   * @param  {p2.Body} body
   * @return {GameObject} gameObject
   */
  addBody(body) {
    this.bodies.push(body);
    this.game.world.addBody(body);

    var container = new PIXI.Container();
    this.containers.push(container);
    this.game.pixiAdapter.container.addChild(container);

    return this;
  }

  /**
   * Removes the supplied p2 body from the game's world and
   * from this GameObject's bodies collection
   * @param  {p2.Body} body
   */
  removeBody(body) {
    var index = this.bodies.indexOf(body);

    this.bodies.splice(index, 1);
    this.game.world.removeBody(body);

    this.containers.splice(index, 1);
    this.game.pixiAdapter.container.removeChildAt(index);
  }

  /**
   * Adds the supplied p2 shape to the supplied p2 body
   * @param  {p2.Body} body
   * @param  {p2.Shape} shape
   * @param  {Object} options
   * @return {GameObject} gameObject
   */
  addShape(body, shape, options) {
    var offset = options.offset || [0, 0],
        angle = options.angle || 0;
    shape.collisionGroup = (options.collisionOptions && options.collisionOptions.collisionGroup) || 1;
    shape.collisionMask = (options.collisionOptions && options.collisionOptions.collisionMask) || 1;

    body.addShape(shape, offset, angle);
    let container = this.containers[this.bodies.indexOf(body)];
    this.game.pixiAdapter.addShape(container, shape, options);

    return this;
  }

  /**
   * Adds the supplied p2 constraint to the game's world and to
   * this GameObject's constraints collection
   * @param  {p2.Constraint} constraint
   * @return {GameObject} gameObject
   */
  addConstraint(constraint) {
    this.constraints.push(constraint);
    this.game.world.addConstraint(constraint);

    return this;
  }

  /**
   * Removes the supplied p2 constraint from the game's world
   * and from this GameObject's constraints collection
   * @param  {p2.Constraint} constraint
   */
  removeConstraint(constraint) {
    this.game.world.removeConstraint(constraint);
  }

  /**
   * Adds the supplied GameObject as a child of this GameObject
   * @param {GameObject} child
   */
  addChild(child) {
    child.parent = this;
    this.children.push(child);
  }

  /**
   * Updates the PIXI container transforms for this GameObject
   * and all children
   */
  updateTransforms() {
    var ppu = this.game.pixiAdapter.pixelsPerLengthUnit,
        bodies = this.bodies,
        containers = this.containers;
    for (let i = 0; i < bodies.length; i++) {
      let body = bodies[i],
          container = containers[i];
      container.position.x = body.position[0] * ppu;
      container.position.y = -body.position[1] * ppu;
      container.rotation = -body.angle;
    }

    // Update children
    let children = this.children;
    for (let i = 0; i < children.length; i++) {
      children[i].updateTransforms();
    }
  }

  /**
   * Removes this GameObject and all of its children from the game
   */
  remove() {
    var game = this.game,
        world = game.world,
        container = game.pixiAdapter.container;

    for (let i = 0; i < this.children.length; i++) {
      this.children[i].remove();
    }

    for (let i = 0; i < this.constraints.length; i++) {
      world.removeConstraint(this.constraints[i]);
    }

    for (let i = 0; i < this.bodies.length; i++) {
      world.removeBody(this.bodies[i]);
      container.removeChild(this.containers[i]);
    }

    if (this.parent) {
      let index = this.parent.children.indexOf(this);
      this.parent.children.splice(index, 1);
      this.parent = undefined;
    } else {
      let index = game.gameObjects.indexOf(this);
      game.gameObjects.splice(index, 1);
    }
  }
}