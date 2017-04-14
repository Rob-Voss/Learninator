class WaterWorldEX extends GameWorld {

  /**
   * World object contains many agents and walls and food and stuff
   * @name WaterWorldEX
   * @extends GameWorld
   * @constructor
   *
   * @return {WaterWorldEX}
   */
  constructor(agents = [], walls = [], worldOpts = worldOpts) {
    super(agents, walls, worldOpts);

    this.init();

    return this;
  }

  /**
   * Initialize the world
   */
  init() {
    let animate = () => {
      if (!this.pause) {
        this.deltaTime = GameWorld.time() - this.lastTime;
        this.lastTime = GameWorld.time();
        for (let k = 0; k < this.stepsPerTick; k++) {
          this.tick(this.deltaTime);
        }
      }
      this.renderer.render(this.stage);
      requestAnimationFrame(animate);
    };

    // Walls
    this.addWalls();
    // Add the entities
    this.addEntities();
    // Population of Agents that are considered 'smart' entities for the environment
    this.addEntityAgents();
    // Population of Agents for the environment
    this.addAgents();

    this.entityAgents[0].enemy = this.agents[0];
    this.entityAgents[0].target = this.agents[1];

    this.entityAgents[1].enemy = this.agents[1];
    this.entityAgents[1].target = this.agents[0];

    this.deltaTime = 0;
    this.lastTime = GameWorld.time();
    animate();
  }

}
