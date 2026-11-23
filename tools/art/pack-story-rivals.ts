// Register the generated 6x6 drawings without distorting or repainting them.
// Sources stay in ignored animation-production; only the runtime pages ship.
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
for (const skin of ['kedar', 'tiras']) {
  const source = PNG.sync.read(readFileSync(`assets/animation-production/rivals/${skin}-source.png`));
  if (source.width % 6 || source.height % 6) throw new Error('Expected a six by six source sheet');
  const cw = source.width / 6, ch = source.height / 6;
  const output = new PNG({ width: 512 * 6, height: 256 * 6 });
  output.data.fill(0);
  for (let frame = 0; frame < 36; frame++) {
    const sx = frame % 6 * cw, sy = Math.floor(frame / 6) * ch;
    // Exclude isolated export specks and neighbouring-cell fragments before registration.
    const keep = new Uint8Array(cw * ch), seen = new Uint8Array(cw * ch);
    for (let start = 0; start < seen.length; start++) {
      const alpha = (n: number) => source.data[((sy + Math.floor(n / cw)) * source.width + sx + n % cw) * 4 + 3];
      if (seen[start] || alpha(start) <= 12) continue;
      const component = [start]; seen[start] = 1;
      let solid = 0;
      for (let i = 0; i < component.length; i++) {
        const n = component[i], x = n % cw, y = Math.floor(n / cw);
        if (alpha(n) > 128) solid++;
        for (const [nx, ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
          if (nx < 0 || nx >= cw || ny < 0 || ny >= ch) continue;
          const next = ny*cw+nx;
          if (!seen[next] && alpha(next) > 12) {seen[next]=1;component.push(next);}
        }
      }
      if (solid >= 100) for (const n of component) keep[n] = 1;
    }
    let bottom = 0, opaque = 0;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      if (keep[y*cw+x] && source.data[((sy + y) * source.width + sx + x) * 4 + 3] > 128) { bottom = y; opaque++; }
    }
    if (opaque < 1000) throw new Error(`${skin}/${frame}: empty or incomplete cel`);
    let sum = 0, weight = 0;
    for (let y = Math.max(0, bottom - 10); y <= bottom; y++) for (let x = 0; x < cw; x++) {
      const alpha = source.data[((sy + y) * source.width + sx + x) * 4 + 3];
      if (keep[y*cw+x] && alpha > 128) { sum += x * alpha; weight += alpha; }
    }
    const footX = Math.round(sum / weight);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const from = ((sy + y) * source.width + sx + x) * 4;
      // Strip near-transparent export noise; retain the drawn antialiased edge.
      if (!keep[y*cw+x]) continue;
      const dx = 256 + x - footX, dy = 246 + y - bottom;
      if (dx < 0 || dx >= 512 || dy < 0 || dy >= 256) {
        if (source.data[from + 3] > 128) throw new Error(`${skin}/${frame}: cel exceeds registration bounds`);
        continue;
      }
      const to = ((Math.floor(frame / 6) * 256 + dy) * output.width + frame % 6 * 512 + dx) * 4;
      source.data.copy(output.data, to, from, from + 4);
    }
  }
  writeFileSync(`assets/runtime/story/${skin}.png`, PNG.sync.write(output));
  console.log(`${skin}: 36 registered painted cels, ${output.width}x${output.height}`);
}
