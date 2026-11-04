// Player shape markers (17_Performance_and_Accessibility): each local player is told
// apart by a shape as well as a colour and number, so colour vision never matters.

export type PlayerShape = 'circle' | 'triangle' | 'square' | 'diamond';
export const PLAYER_SHAPES: PlayerShape[] = ['circle', 'triangle', 'square', 'diamond'];
export const PLAYER_GLYPHS: Record<PlayerShape, string> = { circle: '●', triangle: '▲', square: '■', diamond: '◆' };
/** High-contrast fills that also differ in lightness, not just hue. */
export const PLAYER_COLORS = ['#fbe58a', '#4aa3e8', '#c8452c', '#9be07a'];

/** Shape for a player slot (fighter id 1-4 are the human-capable slots). */
export function playerShape(id: number): PlayerShape { return PLAYER_SHAPES[((id - 1) % 4 + 4) % 4]; }
export function playerGlyph(id: number): string { return PLAYER_GLYPHS[playerShape(id)]; }

/** Draw a player's shape centred at x, y. */
export function drawPlayerMark(c: CanvasRenderingContext2D, id: number, x: number, y: number, r = 7): void {
  const shape = playerShape(id);
  c.save();
  c.fillStyle = PLAYER_COLORS[(id - 1) % 4];
  c.strokeStyle = '#1b2a30';
  c.lineWidth = 2;
  c.beginPath();
  if (shape === 'circle') c.arc(x, y, r, 0, Math.PI * 2);
  else if (shape === 'triangle') { c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); c.closePath(); }
  else if (shape === 'square') c.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7);
  else { c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); }
  c.fill();
  c.stroke();
  c.restore();
}
