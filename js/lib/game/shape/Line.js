/**
 *
 */
class Line extends PIXI.Graphics {
  /**
   *
   * @param points
   * @param lineSize
   * @param lineColor
   */
  constructor(points, lineSize, lineColor) {
    super();

    let style = this.lineWidth = lineSize || 5,
      color = this.lineColor = lineColor || "0x000000";

    this.points = points;
    this.lineStyle(style, color);
    this.moveTo(points[0], points[1]);
    this.lineTo(points[2], points[3]);
  }

  /**
   *
   * @param p
   */
  updatePoints(p) {
    let points = this.points = p.map((val, index) => val || this.points[index]),
      s = this.lineWidth, c = this.lineColor;

    this.clear();
    this.lineStyle(s, c);
    this.moveTo(points[0], points[1]);
    this.lineTo(points[2], points[3]);
  }
}
