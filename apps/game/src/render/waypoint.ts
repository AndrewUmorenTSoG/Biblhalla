// Story-mode guidance: a gentle pointer to the next unfinished task. On screen it is a
// small bobbing chevron over the marker; off screen it is an arrow pinned to the edge,
// pointing the way, with the task name and distance.

export interface ScreenPoint { x: number; y: number }
export interface Pointer { onScreen: boolean; x: number; y: number; angle: number }

/** Where to draw the pointer for a target at `p`, inside a `w`×`h` view with `margin`. */
export function edgePointer(p: ScreenPoint, w = 1280, h = 720, margin = 44, top = 96): Pointer {
  const inside = p.x >= margin && p.x <= w - margin && p.y >= top && p.y <= h - margin;
  if (inside) return { onScreen: true, x: p.x, y: p.y, angle: Math.PI / 2 };
  const cx = w / 2, cy = (top + h) / 2;
  const dx = p.x - cx, dy = p.y - cy;
  const angle = Math.atan2(dy, dx);
  // Scale the direction until it touches the inset view rectangle.
  const sx = dx === 0 ? Infinity : ((dx > 0 ? w - margin : margin) - cx) / dx;
  const sy = dy === 0 ? Infinity : ((dy > 0 ? h - margin : top) - cy) / dy;
  const s = Math.min(sx, sy);
  return { onScreen: false, x: cx + dx * s, y: cy + dy * s, angle };
}

/** The task the player should do next, if any (first unfinished marker in order). */
export function nextTask<M extends { done: boolean }>(markers: M[]): M | null {
  return markers.find(m => !m.done) ?? null;
}

/** Draw the pointer. `distance` is in world units; `label` names the task. */
export function drawPointer(c: CanvasRenderingContext2D, ptr: Pointer, label: string, distance: number, tick: number, reduced: boolean): void {
  c.save();
  c.fillStyle = '#ffe3a1';
  c.strokeStyle = '#2a2318';
  c.lineWidth = 2.5;
  if (ptr.onScreen) {
    const bob = reduced ? 0 : Math.sin(tick * 0.12) * 4;
    c.translate(ptr.x, ptr.y - 64 + bob);
    c.beginPath(); c.moveTo(-11, -8); c.lineTo(11, -8); c.lineTo(0, 6); c.closePath(); c.fill(); c.stroke();
    c.restore();
    return;
  }
  c.translate(ptr.x, ptr.y);
  c.save();
  c.rotate(ptr.angle);
  c.beginPath(); c.moveTo(18, 0); c.lineTo(-8, -13); c.lineTo(-3, 0); c.lineTo(-8, 13); c.closePath(); c.fill(); c.stroke();
  c.restore();
  const text = `${label} · ${Math.round(distance)}m`;
  c.font = 'bold 14px system-ui';
  const tw = c.measureText(text).width;
  const lx = Math.max(-ptr.x + 8 + tw / 2, Math.min(1280 - ptr.x - 8 - tw / 2, -Math.cos(ptr.angle) * 40));
  const ly = -Math.sin(ptr.angle) * 30 + 5;
  c.fillStyle = 'rgba(20,30,34,.82)';
  c.fillRect(lx - tw / 2 - 7, ly - 15, tw + 14, 22);
  c.fillStyle = '#ffe3a1';
  c.textAlign = 'center';
  c.fillText(text, lx, ly);
  c.restore();
}
