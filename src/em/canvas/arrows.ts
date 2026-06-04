/** Draw an arrowhead at (tipX, tipY) pointing in direction (angle) */
export function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  angle: number,
  size: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(
    tipX - size * Math.cos(angle - Math.PI / 6),
    tipY - size * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    tipX - size * Math.cos(angle + Math.PI / 6),
    tipY - size * Math.sin(angle + Math.PI / 6)
  );
  ctx.fill();
}

/** Draw a vector arrow from (x1,y1) to (x2,y2) */
export function drawVector(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth = 2,
  headSize = 8
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  drawArrowhead(ctx, x2, y2, angle, headSize, color);
}

/** Draw an arrow at a position with velocity components */
export function drawFieldArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  vx: number,
  vy: number,
  color: string,
  scale = 1,
  label?: string
) {
  const mag = Math.sqrt(vx * vx + vy * vy);
  if (mag < 0.01) return;

  const nx = (vx / mag) * Math.min(mag * scale, 40);
  const ny = (vy / mag) * Math.min(mag * scale, 40);

  drawVector(ctx, x, y, x + nx, y + ny, color, 2, 6);

  if (label) {
    ctx.fillStyle = color;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + nx * 0.5, y + ny * 0.5 - 8);
  }
}
