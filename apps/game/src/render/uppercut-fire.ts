/** One rising ribbon, authored in sprite-local coordinates; never a second swing. */
export function drawUppercutTrail(
  c: CanvasRenderingContext2D,
  tick: number,
  start: { x: number; y: number },
  tip: { x: number; y: number },
  reduced: boolean,
) {
  if (reduced || tick < 14 || tick >= 29) return;
  const fade = Math.min(1, (tick - 13) / 3) * Math.min(1, (29 - tick) / 8);
  c.save();
  c.globalAlpha *= fade;
  const gradient = c.createLinearGradient(start.x, start.y, tip.x, tip.y);
  gradient.addColorStop(0, 'rgba(164,41,17,0)');
  gradient.addColorStop(0.38, '#db4922');
  gradient.addColorStop(0.78, '#ff983d');
  gradient.addColorStop(1, '#ffe6a0');
  // Taper the wake into three distinct tongues; the brightest edge meets the fist.
  for (let i = 0; i < 3; i++) {
    const offset = (i - 1) * 4;
    const bend = Math.sin(tick * 0.42 + i) * 2;
    c.fillStyle = i === 1 ? '#ffd381' : gradient;
    c.beginPath();
    c.moveTo(start.x - 13 + offset, start.y + 10 + i * 3);
    c.bezierCurveTo(start.x - 20 + bend, start.y - 5, tip.x - 15 + offset, tip.y + 27, tip.x + offset, tip.y);
    c.quadraticCurveTo(tip.x + 8 + offset, tip.y + 22, start.x - 13 + offset, start.y + 10 + i * 3);
    c.fill();
  }
  for (let i = 0; i < 6; i++) {
    const t = ((tick - 14) * 0.055 + i * 0.16) % 1;
    c.globalAlpha = fade * (1 - t) * 0.8;
    c.fillStyle = i % 2 ? '#ffe8af' : '#fa8834';
    const x = start.x + (tip.x - start.x) * t - 12 + Math.sin(i * 2.1) * 6;
    const y = start.y + (tip.y - start.y) * t;
    c.fillRect(x, y, 1.3, 3);
  }
  c.restore();
}
