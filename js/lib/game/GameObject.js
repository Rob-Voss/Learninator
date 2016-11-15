/**
 * @class GameObject
 * @property {Array} bodies
 * @property {Array} constraints
 * @property {Array} containers
 * @property {Array} children
 * @property {GameObject|null} parent
 */
class GameObject {

  /**
   * GameObject
   *
   * @constructor
   * @param {Game} game
   * @param {Body} body
   * @param {Shape} shape
   * @param {Object} options
   */
  constructor(game, body, shape, options) {
    this.bodies = [];
    this.constraints = [];
    this.containers = [];
    this.children = [];
    this.parent = null;

    this.addBody(game, body).addShape(game, shape, options);
  }

  /**
   *
   * Adds the supplied body to the game's world and to
   * this GameObject's bodies collection
   * Also creates a corresponding PIXI Container object for rendering.
   * @param {Game} game
   * @param {Body} body
   * @return {GameObject} gameObject
   */
  addBody(game, body) {
    this.body = body;
    this.bodies.push(body);
    this.container = new PIXI.Container();
    this.containers.push(this.container);
    game.world.addBody(this.body);
    game.pixiAdapter.container.addChild(this.container);

    return this;
  }

  /**
   * Adds the supplied GameObject as a child of this GameObject
   * @param {GameObject} child
   * @return {GameObject} gameObject
   */
  addChild(child) {
    child.parent = this;
    this.children.push(child);

    return this;
  }

  /**
   * Adds the supplied p2 constraint to the game's world and to
   * this GameObject's constraints collection
   * @param {Game} game
   * @param {Constraint} constraint
   * @return {GameObject} gameObject
   */
  addConstraint(game, constraint) {
    this.constraints.push(constraint);
    game.world.addConstraint(constraint);

    return this;
  }

  /**
   * Adds the supplied p2 shape to the supplied p2 body
   * @param {Game} game
   * @param {Shape|Heightfield} shape
   * @param {Object} options
   * @return {GameObject} gameObject
   */
  addShape(game, shape, options) {
    this.shape = shape;
    let offset = options.offset || [0, 0],
      angle = options.angle || 0;
    this.shape.collisionGroup = (options.collision && options.collision.collisionGroup) || 1;
    this.shape.collisionMask = (options.collision && options.collision.collisionMask) || 1;

    this.body.addShape(this.shape, offset, angle);
    let container = this.containers[this.bodies.indexOf(this.body)];
    game.pixiAdapter.addShape(container, shape, options);

    return this;
  }

  /**
   * Removes this GameObject and all of its children from the game
   * @param {Game} game
   */
  static deleteObject(game) {
    var world = game.world,
      container = game.pixiAdapter.container;

    for (let i = 0; i < this.children.length; i++) {
      this.children[i].remove();
    }

    for (let i = 0; i < this.constraints.length; i++) {
      GameObject.removeConstraint(game, this.constraints[i]);
    }

    for (let i = 0; i < this.bodies.length; i++) {
      world.removeBody(this.bodies[i]);
      container.removeChild(this.containers[i]);
    }

    if (this.parent) {
      this.parent.children.splice(this.parent.children.indexOf(this), 1);
      this.parent = undefined;
    } else {
      game.gameObjects.splice(game.gameObjects.indexOf(this), 1);
    }
  }

  /**
   * Removes the supplied p2 body from the game's world and
   * from this GameObject's bodies collection
   * @param {Game} game
   * @param {Body} body
   * @return {GameObject} gameObject
   */
  removeBody(game, body) {
    var index = this.bodies.indexOf(body);
    this.bodies.splice(index, 1);
    this.containers.splice(index, 1);

    game.world.removeBody(body);
    game.pixiAdapter.container.removeChildAt(index);

    return this;
  }

  /**
   * Removes the supplied p2 constraint from the game's world
   * and from this GameObject's constraints collection
   * @param {Game} game
   * @param {Constraint} constraint
   */
  static removeConstraint(game, constraint) {
    game.world.removeConstraint(constraint);
  }

  /**
   * Updates the PIXI container transforms for this GameObject
   * and all children
   * @param {Game} game
   * @return {GameObject} gameObject
   */
  updateTransforms(game) {
    let ppu = game.pixiAdapter.pixelsPerLengthUnit,
      bodies = this.bodies,
      containers = this.containers;
    for (let i = 0; i < bodies.length; i++) {
      let body = bodies[i],
        container = containers[i];
      container.position.x = body.position[0] * ppu;
      container.position.y = -body.position[1] * ppu;
      container.rotation = -body.angle;
    }

    // Update any children
    let children = this.children;
    for (let i = 0; i < children.length; i++) {
      children[i].updateTransforms(game);
    }

    return this;
  }
}
