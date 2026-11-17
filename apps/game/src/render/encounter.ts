import { Q, type SimState } from '../../../../packages/sim/src/index.ts';

function label(c: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  c.save();
  c.translate(x, y);
  c.scale(1, -1);
  c.font = 'bold 14px system-ui';
  c.textAlign = 'center';
  c.lineWidth = 4;
  c.strokeStyle = 'rgba(255,248,230,.9)';
  c.strokeText(text, 0, 0);
  c.fillStyle = '#1d2f35';
  c.fillText(text, 0, 0);
  c.restore();
}

export function drawEncounter(c: CanvasRenderingContext2D, world: SimState): void {
  const cue = world.cue;
  if (cue) {
    const x = cue.x / Q,
      y = cue.y / Q;
    c.strokeStyle = '#b5832f';
    c.lineWidth = 3;
    c.setLineDash([8, 6]);
    c.beginPath();
    c.ellipse(x, y + 37, 26, 40, 0, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    label(c, `${cue.role.replace(/_/g, ' ')} arriving`, x, y + 92);
  }
}
