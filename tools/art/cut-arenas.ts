// Extract the far backdrop band (sky, distant land, skyline) from each arena
// concept painting. The painted platforms are deliberately excluded: platforms are
// drawn from maps.json collision so visuals and collision always agree.
//
// Usage: node tools/art/cut-arenas.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadContent, sha256 } from '../lib/content.ts';
import { crop, readPng, resize, writePng } from './image.ts';
import type { Image } from './image.ts';

const OUT = join(ROOT, 'assets', 'runtime', 'arenas');
/** Per-arena fraction of the painting that lies above its highest painted platform. */
const SKY_BAND: Record<string, number> = {
  elah_training_terrace: 0.34, wilderness_waystation: 0.39, jericho_outskirts: 0.29,
  deborahs_palm_court: 0.38, susa_garden_balcony: 0.38, jerusalem_builders_court: 0.36,
};
const OUTPUT_WIDTH = 1600;

function average(img: Image, x0: number, y0: number, w: number, h: number): [number, number, number] {
  let r = 0, g = 0, b = 0;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const i = (y * img.width + x) * 4;
    r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2];
  }
  const n = w * h;
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

const hex = (c: number[]) => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');

if (import.meta.main) {
  const content = loadContent();
  mkdirSync(OUT, { recursive: true });
  const meta: Record<string, unknown> = {};
  for (const map of content.maps.maps) {
    const sourcePath = join(ROOT, 'production-pack', map.artReference);
    const art = readPng(sourcePath);
    const bandH = Math.round(art.height * (SKY_BAND[map.id] ?? 0.28));
    const band = crop(art, 0, 0, art.width, bandH);
    const out = resize(band, OUTPUT_WIDTH, Math.round((bandH * OUTPUT_WIDTH) / art.width));
    const png = writePng(join(OUT, `${map.id}.png`), out);
    meta[map.id] = {
      image: `assets/runtime/arenas/${map.id}.png`, sha256: sha256(png), readiness: 'concept_backdrop',
      source: `production-pack/${map.artReference}`, sourceSha256: sha256(readFileSync(sourcePath)),
      tool: 'tools/art/cut-arenas.ts', cutOn: new Date().toISOString().slice(0, 10), approval: 'pending',
      // Palette sampled from the painting: horizon haze and the main slab's stone face.
      horizon: hex(average(art, 0, bandH - 6, art.width, 6)),
      stone: hex(average(art, Math.round(art.width * 0.4), Math.round(art.height * 0.6), Math.round(art.width * 0.2), Math.round(art.height * 0.04))),
    };
    console.log(`${map.id}: ${out.width}x${out.height}, ${png.length} bytes`);
  }
  writeFileSync(join(OUT, 'arenas.json'), JSON.stringify(meta, null, 2) + '\n');
}
