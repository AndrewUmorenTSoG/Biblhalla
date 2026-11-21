// Open, tapered streamlines make air readable without hiding the turning fighter.
export function isEstherWhirlwind(move: string) {
  return move === 'esther_blades_slight' || move === 'esther_blades_ssig';
}

export function drawWhirlwind(
  c: CanvasRenderingContext2D,
  age: number,
  duration: number,
  reduced: boolean,
  layer: 'front' | 'back' | 'all' = 'all',
  heavy = false,
) {
  if (age < -4 || age >= duration + 10) return;
  const grow = Math.max(0, Math.min(1, (age + 4) / 7));
  const fade = Math.max(0, 1 - Math.max(0, age - duration) / 10);
  const radius = (heavy ? 100 : 90) * (0.65 + grow * 0.35);
  const height = heavy ? 103 : 95;
  const clock = reduced ? 6 : age;
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (let strand = 0; strand < (reduced ? 4 : 9); strand++) {
    const phase = clock * 0.31 + strand * 2.399;
    const segments = reduced ? 18 : 30;
    let previous: { x: number; y: number; front: boolean } | null = null;
    for (let j = 0; j <= segments; j++) {
      const u = j / segments;
      // Each trail rises and curls at a different rate instead of forming a
      // stack of closed ellipses. It tapers to nothing at both ends.
      const angle = phase + u * (2.7 + strand * 0.14);
      const width = radius * (0.76 + 0.16 * Math.sin(u * 4.4 + strand));
      const x = 10 + Math.cos(angle) * width;
      const y = -8 - u * (height - 10) + Math.sin(angle) * (8 + u * 5);
      const front = Math.sin(angle) >= 0;
      if (previous && (layer === 'all' || front === (layer === 'front'))) {
        const taper = Math.sin(Math.PI * u);
        c.globalAlpha = grow * fade * taper * (front ? 0.58 : 0.26);
        c.strokeStyle = strand % 3 === 0 ? '#bce7ec' : '#effaff';
        c.lineWidth = (strand % 3 === 0 ? 3.2 : 1.25) * taper + 0.25;
        c.beginPath();
        c.moveTo(previous.x, previous.y);
        c.lineTo(x, y);
        c.stroke();
      }
      previous = { x, y, front };
    }
  }
  // Sparse airborne flecks move with the flow; no opaque tornado/cone sprite.
  if (!reduced)
    for (let i = 0; i < 14; i++) {
      const angle = clock * 0.24 + i * 2.399;
      const front = Math.sin(angle) >= 0;
      if (layer !== 'all' && front !== (layer === 'front')) continue;
      const lift = ((Math.max(0, clock) * 1.8 + i * 11) % 90) / 90;
      c.globalAlpha = grow * fade * Math.sin(lift * Math.PI) * 0.55;
      c.fillStyle = i % 4 === 0 ? '#b9b194' : '#e0f3f5';
      c.beginPath();
      c.arc(10 + Math.cos(angle) * radius * 0.85, -4 - lift * height, i % 4 === 0 ? 1.4 : 0.8, 0, Math.PI * 2);
      c.fill();
    }
  c.restore();
}
