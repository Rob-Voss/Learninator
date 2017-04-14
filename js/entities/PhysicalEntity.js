
/**
 *
 */
class PhysicalEntity {

  /**
   * Initialize the PhysicalEntity
   * @name PhysicalEntity
   * @class PhysicalEntity
   * @constructor
   *
   * @property {Matter.Body} body
   *
   * @param {number|string} type - A type id (wall,nom,gnar,agent)
   * @param {Matter.Body} body - The Matter.js body
   * @return {PhysicalEntity}
   */
  constructor(type, body) {
    this.id = Utility.Strings.guid();
    this.type = (typeof type === 'string') ? entityTypes.indexOf(type) : type || 1;
    this.name = entityTypes[this.type];
    this.color = hexColorStyles[this.type];
    this.typeName = entityTypes[this.type];
    this.body = body;
    this.body.label = this.name;
    this.position = this.body.position;
    this.radius = (this.type === 2) ? 10 : this.body.circleRadius;
    this.age = 0;
    this.counter = 0;
    this.speed = 1;
    this.force = {
      x: Common.random(-0.0095, 0.0095),
      y: Common.random(-0.0095, 0.0095)
    };
    Body.applyForce(this.body, this.body.position, this.force);
    this.position = this.body.position;

    return this;
  }

  /**
   * Do work son
   *
   * @return {PhysicalEntity}
   */
  tick() {
    this.age += 1;
    this.counter += 1;
    if (this.counter >= 60) {
      this.force = {
        x: Common.random(-0.0095, 0.0095),
        y: Common.random(-0.0095, 0.0095)
      };
      this.counter = 0;
    }
    Body.applyForce(this.body, this.body.position, this.force);
    this.position = this.body.position;

    return this;
  }
}