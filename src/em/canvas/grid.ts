/** Draw a background grid on canvas */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing = 40,
  color = '#e2e8f0'
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;

  for (let x = spacing; x < width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = spacing; y < height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

/** Draw axis lines with labels and arrows */
export function drawAxisSystem(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  y: number,
  xLabel: string,
  yLabel: string,
  colors: { axis: string; text: string }
) {
  ctx.strokeStyle = colors.axis;
  ctx.lineWidth = 2;

  // Horizontal axis
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();

  // X arrow
  ctx.fillStyle = colors.axis;
  ctx.beginPath();
  ctx.moveTo(endX, y);
  ctx.lineTo(endX - 8, y - 4);
  ctx.lineTo(endX - 8, y + 4);
  ctx.fill();

  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'left';
  if (xLabel) ctx.fillText(xLabel, endX + 10, y + 4);

  if (yLabel) {
    // Vertical axis
    const axisH = 110;
    ctx.strokeStyle = colors.axis;
    ctx.beginPath();
    ctx.moveTo(startX, y + axisH);
    ctx.lineTo(startX, y - axisH);
    ctx.stroke();

    // Y arrow
    ctx.beginPath();
    ctx.moveTo(startX, y - axisH);
    ctx.lineTo(startX - 4, y - axisH + 8);
    ctx.lineTo(startX + 4, y - axisH + 8);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillText(yLabel, startX, y - axisH - 10);
  }
}
