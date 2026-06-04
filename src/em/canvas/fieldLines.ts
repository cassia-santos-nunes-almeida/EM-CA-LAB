import type { Charge } from '@em/types/index';

/** Trace a single electric field line from a starting point */
export function traceFieldLine(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  sign: number,
  width: number,
  height: number,
  charges: Charge[],
  color: string,
  maxSteps = 500,
  stepSize = 4
) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;

  let x = startX;
  let y = startY;
  ctx.moveTo(x, y);

  for (let step = 0; step < maxSteps; step++) {
    let ex = 0;
    let ey = 0;

    for (const charge of charges) {
      const dx = x - charge.x;
      const dy = y - charge.y;
      const r2 = dx * dx + dy * dy;
      const r = Math.sqrt(r2);
      if (r < 8) {
        ctx.stroke();
        ctx.globalAlpha = 1;
        return;
      }
      const force = charge.q / r2;
      ex += force * (dx / r);
      ey += force * (dy / r);
    }

    const mag = Math.sqrt(ex * ex + ey * ey);
    if (mag < 0.0001) break;

    x += (sign * ex * stepSize) / mag;
    y += (sign * ey * stepSize) / mag;

    if (x < 0 || x > width || y < 0 || y > height) break;

    ctx.lineTo(x, y);
  }

  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** Draw field lines emanating from all charges */
export function drawAllFieldLines(
  ctx: CanvasRenderingContext2D,
  charges: Charge[],
  width: number,
  height: number,
  colors: { positive: string; negative: string },
  linesPerCharge = 12
) {
  for (const charge of charges) {
    const sign = charge.q > 0 ? 1 : -1;
    const color = charge.q > 0 ? colors.positive : colors.negative;
    const numLines = Math.min(Math.abs(charge.q) * linesPerCharge, 24);

    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2;
      const startX = charge.x + Math.cos(angle) * 15;
      const startY = charge.y + Math.sin(angle) * 15;
      traceFieldLine(ctx, startX, startY, sign, width, height, charges, color);
    }
  }
}
