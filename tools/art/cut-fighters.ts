// Cut the nine-panel fighter concept sheets into transparent stand-in frames.
//
// Each sheet is a 3x3 grid on parchment (production-pack/08_Art_Prompts):
//   1 idle, 2 back turnaround, 3 light attack,
//   4-6 weapon A signatures (neutral, side, down), 7-9 weapon B signatures.
// Output frames are "concept_cut": cleaned concept poses, not final animation.
//
// Usage: node tools/art/cut-fighters.ts [fighterId ...]

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadContent, sha256 } from '../lib/content.ts';
import { blank, blit, crop, luminance, readPng, resize, writePng } from './image.ts';
import type { Image } from './image.ts';

const PACK = join(ROOT, 'production-pack');
const OUT = join(ROOT, 'assets', 'runtime', 'fighters');
const TARGET_IDLE_PX = 220;
const BG_THRESHOLD = 46;
const EDGE_SOFTNESS = 26;
const MIN_COMPONENT_SHARE = 0.03;
const ATLAS_WIDTH = 1024;

export interface FrameMeta { x: number; y: number; w: number; h: number; pivotX: number; pivotY: number; panel: number }

/** Columns/rows that are panel border lines: mostly mid-dark across the grid span. */
function borderLines(img: Image, vertical: boolean): number[] {
  const len = vertical ? img.width : img.height;
  const span = vertical ? img.height : img.width;
  const from = Math.floor(span * (vertical ? 0.06 : 0.02)), to = Math.floor(span * (vertical ? 0.96 : 0.98));
  const hits: number[] = [];
  for (let a = 0; a < len; a++) {
    let dark = 0;
    for (let b = from; b < to; b++) {
      const i = ((vertical ? b * img.width + a : a * img.width + b)) * 4;
      if (luminance(img.data[i], img.data[i + 1], img.data[i + 2]) < 205) dark++;
    }
    if (dark / (to - from) > 0.62) hits.push(a);
  }
  // Collapse runs of adjacent hits into single line centres.
  const lines: number[] = [];
  for (let k = 0; k < hits.length;) {
    let j = k;
    while (j + 1 < hits.length && hits[j + 1] - hits[j] <= 2) j++;
    lines.push(Math.round((hits[k] + hits[j]) / 2));
    k = j + 1;
  }
  return lines;
}

/**
 * Choose 2*n candidate lines forming n equal panels separated by narrow gutters.
 * Candidates also include long dark strokes inside figures, so search all subsets.
 */
function spans(lines: number[], n: number, size: number): [number, number][] {
  let best: number[] | null = null, bestScore = Infinity;
  const pick: number[] = [];
  const search = (from: number) => {
    if (pick.length === 2 * n) {
      const widths: number[] = [], gutters: number[] = [];
      for (let k = 0; k < n; k++) widths.push(pick[2 * k + 1] - pick[2 * k]);
      for (let k = 0; k + 1 < n; k++) gutters.push(pick[2 * k + 2] - pick[2 * k + 1]);
      if (widths.some(w => w < size * 0.22) || gutters.some(g => g < 1 || g > size * 0.04)) return;
      const mean = widths.reduce((a, b) => a + b, 0) / n;
      const score = widths.reduce((a, w) => a + (w - mean) ** 2, 0) - mean * 4;
      if (score < bestScore) { bestScore = score; best = [...pick]; }
      return;
    }
    for (let k = from; k < lines.length; k++) { pick.push(lines[k]); search(k + 1); pick.pop(); }
  };
  search(0);
  if (!best) throw new Error(`could not find ${n} panels among border lines ${lines.join(',')}`);
  const b: number[] = best;
  return Array.from({ length: n }, (_, k) => [b[2 * k], b[2 * k + 1]] as [number, number]);
}

function median(values: number[]): number {
  const v = [...values].sort((a, b) => a - b);
  return v[v.length >> 1];
}

/** Flood-fill parchment from the panel edge; soften the contour; drop specks and numbers. */
function cutout(panel: Image): Image {
  const { width: w, height: h, data } = panel;
  const ring: number[] = [];
  for (let x = 0; x < w; x++) ring.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) ring.push(y * w, y * w + w - 1);
  const bg = [0, 1, 2].map(c => median(ring.map(p => data[p * 4 + c])));
  const dist = new Float32Array(w * h);
  for (let p = 0; p < w * h; p++) {
    const dr = data[p * 4] - bg[0], dg = data[p * 4 + 1] - bg[1], db = data[p * 4 + 2] - bg[2];
    dist[p] = Math.sqrt(dr * dr + dg * dg + db * db);
  }
  const isBg = new Uint8Array(w * h);
  const queue: number[] = [];
  for (const p of ring) if (!isBg[p] && dist[p] < BG_THRESHOLD) { isBg[p] = 1; queue.push(p); }
  while (queue.length) {
    const p = queue.pop()!;
    const x = p % w, y = (p - x) / w;
    for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
      if (q >= 0 && !isBg[q] && dist[q] < BG_THRESHOLD) { isBg[q] = 1; queue.push(q); }
    }
  }
  // Keep only substantial connected foreground regions (drops panel numbers and dust specks).
  const label = new Int32Array(w * h).fill(-1);
  const sizes: number[] = [];
  for (let p = 0; p < w * h; p++) {
    if (isBg[p] || label[p] >= 0) continue;
    const id = sizes.length;
    let size = 0;
    const stack = [p];
    label[p] = id;
    while (stack.length) {
      const c = stack.pop()!;
      size++;
      const x = c % w, y = (c - x) / w;
      for (const q of [x > 0 ? c - 1 : -1, x < w - 1 ? c + 1 : -1, y > 0 ? c - w : -1, y < h - 1 ? c + w : -1]) {
        if (q >= 0 && !isBg[q] && label[q] < 0) { label[q] = id; stack.push(q); }
      }
    }
    sizes.push(size);
  }
  const largest = Math.max(0, ...sizes);
  const out = blank(w, h);
  for (let p = 0; p < w * h; p++) {
    if (isBg[p] || sizes[label[p]] < largest * MIN_COMPONENT_SHARE) continue;
    out.data.set(data.subarray(p * 4, p * 4 + 3), p * 4);
    const x = p % w, y = (p - x) / w;
    const touchesBg = (x > 0 && isBg[p - 1]) || (x < w - 1 && isBg[p + 1]) || (y > 0 && isBg[p - w]) || (y < h - 1 && isBg[p + w]);
    out.data[p * 4 + 3] = touchesBg ? Math.round(255 * Math.min(1, Math.max(0.15, (dist[p] - BG_THRESHOLD) / EDGE_SOFTNESS + 0.5))) : 255;
  }
  return out;
}

function opaqueBounds(img: Image): [number, number, number, number] | null {
  let x0 = img.width, y0 = img.height, x1 = -1, y1 = -1;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    if (img.data[(y * img.width + x) * 4 + 3] > 24) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  return x1 < 0 ? null : [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}

/** Feet pivot: centre of opaque pixels in the lowest rows, at the bottom edge. */
function feetPivot(img: Image): [number, number] {
  const rows = Math.max(3, Math.round(img.height * 0.04));
  let sum = 0, n = 0;
  for (let y = img.height - rows; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    if (img.data[(y * img.width + x) * 4 + 3] > 128) { sum += x; n++; }
  }
  return [n ? Math.round(sum / n) : img.width >> 1, img.height];
}

export function frameNames(weaponPair: [string, string]): string[] {
  const [a, b] = weaponPair;
  return ['idle', 'turnaround', 'light', `sig_${a}_n`, `sig_${a}_s`, `sig_${a}_d`, `sig_${b}_n`, `sig_${b}_s`, `sig_${b}_d`];
}

export function cutFighter(id: string): { atlas: Record<string, FrameMeta>; png: Buffer; source: string; sourceSha256: string } {
  const content = loadContent();
  const def = content.fighters.fighters.find(f => f.id === id);
  if (!def) throw new Error(`unknown fighter ${id}`);
  const sourcePath = join(PACK, def.conceptImage);
  const sheet = readPng(sourcePath);
  const cols = spans(borderLines(sheet, true), 3, sheet.width);
  const rows = spans(borderLines(sheet, false), 3, sheet.height);
  const names = frameNames(def.weaponPair);
  const cuts: { name: string; img: Image; panel: number }[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const inset = 5;
    const [x0, x1] = cols[c], [y0, y1] = rows[r];
    const panel = cutout(crop(sheet, x0 + inset, y0 + inset, x1 - x0 - 2 * inset, y1 - y0 - 2 * inset));
    const box = opaqueBounds(panel);
    if (!box) throw new Error(`${id} panel ${r * 3 + c + 1} is empty after background removal`);
    cuts.push({ name: names[r * 3 + c], img: crop(panel, ...box), panel: r * 3 + c + 1 });
  }
  const scale = TARGET_IDLE_PX / cuts[0].img.height;
  const frames = cuts.map(f => ({ ...f, img: resize(f.img, Math.max(1, Math.round(f.img.width * scale)), Math.max(1, Math.round(f.img.height * scale))) }));
  // Shelf-pack into one atlas.
  const atlas: Record<string, FrameMeta> = {};
  let x = 0, y = 0, shelf = 0;
  for (const f of frames) {
    if (x + f.img.width > ATLAS_WIDTH) { x = 0; y += shelf + 2; shelf = 0; }
    const [px, py] = feetPivot(f.img);
    atlas[f.name] = { x, y, w: f.img.width, h: f.img.height, pivotX: px, pivotY: py, panel: f.panel };
    x += f.img.width + 2;
    shelf = Math.max(shelf, f.img.height);
  }
  const out = blank(ATLAS_WIDTH, y + shelf);
  for (const f of frames) blit(out, f.img, atlas[f.name].x, atlas[f.name].y);
  mkdirSync(OUT, { recursive: true });
  const png = writePng(join(OUT, `${id}.png`), out);
  return { atlas, png, source: `production-pack/${def.conceptImage}`, sourceSha256: sha256(readFileSync(sourcePath)) };
}

if (import.meta.main) {
  const content = loadContent();
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : content.fighters.fighters.map(f => f.id);
  const metaPath = join(OUT, 'fighters.json');
  mkdirSync(OUT, { recursive: true });
  let meta: Record<string, unknown> = {};
  try { meta = JSON.parse(readFileSync(metaPath, 'utf8')); } catch { /* first run */ }
  for (const id of ids) {
    const r = cutFighter(id);
    meta[id] = {
      image: `assets/runtime/fighters/${id}.png`, sha256: sha256(r.png), readiness: 'concept_cut',
      source: r.source, sourceSha256: r.sourceSha256, tool: 'tools/art/cut-fighters.ts',
      cutOn: new Date().toISOString().slice(0, 10), approval: 'pending', frames: r.atlas,
    };
    console.log(`${id}: ${Object.keys(r.atlas).length} frames, ${r.png.length} bytes`);
  }
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
}
