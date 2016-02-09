export default class Wall extends Vec {
    /**
     * Wall is made up of two Vectors
     * @name Wall
     * @constructor
     *
     * @param {Vec} v1
     * @param {Vec} v2
     * @param {boolean} cheats
     * @returns {Wall}
     */
    constructor(v1, v2, cheats) {
        super();

        this.id = Utility.guid();
        this.type = 0;
        this.v1 = v1;
        this.v2 = v2;
        this.pos = new Point((v1.x + v2.x) / 2, (v1.y + v2.y) / 2);
        this.len = this.v1.distanceTo(this.v2);
        // See more at: http://wikicode.wikidot.com/get-angle-of-line-between-two-points#toc1
        this.angle = Math.atan2(v2.sub(v1).y, v2.sub(v1).x) * 180 / Math.PI;

        this.shape = new PIXI.Graphics();
        if (cheats) {
            let wallText = new PIXI.Text(this.id.substring(0, 10), {
                font: "10px Arial",
                fill: "#640000",
                align: "center"
            });
            wallText.position.set(this.v1.x + 10, this.v1.y - 10);
            this.shape.addChild(wallText);
        }
        this.shape.clear();
        this.shape.lineStyle(1, 0x000000);
        this.shape.moveTo(this.v1.x, this.v1.y);
        this.shape.lineTo(this.v2.x, this.v2.y);
        this.shape.endFill();

        return this;
    }
}