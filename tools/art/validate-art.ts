// Validate runtime fighter art against the engine contract (docs/ART_INTEGRATION.md).
// Structural errors fail; animation coverage gaps are reported, and fail with --strict.
//
// Usage: node tools/art/validate-art.ts [--strict]

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadContent, sha256 } from '../lib/content.ts';
import { readPng } from './image.ts';

export const LOOP_CLIPS = ['idle', 'run', 'jump', 'dodge', 'hitstun'];

export interface ArtReport { errors: string[]; coverage: Record<string, { missing: string[]; covered: number; total: number }> }

export function validateArt(metaPath = join(ROOT, 'assets', 'runtime', 'fighters', 'fighters.json')): ArtReport {
  const content = loadContent();
  const errors: string[] = [];
  const coverage: ArtReport['coverage'] = {};
  if (!existsSync(metaPath)) return { errors: [`missing ${metaPath}`], coverage };
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  const moves = new Map(content.attacks.attacks.map(m => [m.id, m]));

  for (const def of content.fighters.fighters) {
    const entry = meta[def.id];
    if (!entry) { errors.push(`${def.id}: no art entry`); continue; }
    const file = join(ROOT, entry.image);
    if (!existsSync(file)) { errors.push(`${def.id}: missing ${entry.image}`); continue; }
    const bytes = readFileSync(file);
    if (sha256(bytes) !== entry.sha256) errors.push(`${def.id}: sha256 does not match ${entry.image}`);
    const img = readPng(file);
    if (!entry.frames?.idle) errors.push(`${def.id}: needs an idle frame`);
    for (const [name, f] of Object.entries(entry.frames ?? {}) as [string, any][]) {
      if (f.x < 0 || f.y < 0 || f.w <= 0 || f.h <= 0 || f.x + f.w > img.width || f.y + f.h > img.height) { errors.push(`${def.id}.${name}: outside atlas bounds`); continue; }
      let transparent = 0, opaque = 0;
      for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) {
        const a = img.data[(y * img.width + x) * 4 + 3];
        if (a === 0) transparent++; else if (a > 200) opaque++;
      }
      if (!opaque) errors.push(`${def.id}.${name}: frame is empty`);
      if (!transparent) errors.push(`${def.id}.${name}: frame has no transparency (opaque concept panel?)`);
    }
    // Every attack this fighter can perform: both weapons' shared kits, signatures, unarmed.
    const attackIds = content.attacks.attacks
      .filter(m => (m.ownerType === 'weapon' && (def.weaponPair.includes(m.ownerId) || m.ownerId === 'unarmed')) || m.ownerId === def.id)
      .map(m => m.id);
    const wanted = [...LOOP_CLIPS, ...attackIds];
    const clips = entry.clips ?? {};
    for (const [name, clip] of Object.entries(clips) as [string, any][]) {
      if (!Array.isArray(clip.frames) || !Array.isArray(clip.ticks) || clip.frames.length !== clip.ticks.length || !clip.frames.length) { errors.push(`${def.id} clip ${name}: frames and ticks must be equal-length, non-empty lists`); continue; }
      for (const fr of clip.frames) if (!entry.frames?.[fr]) errors.push(`${def.id} clip ${name}: unknown frame ${fr}`);
      if (clip.ticks.some((t: unknown) => !Number.isInteger(t) || (t as number) <= 0)) errors.push(`${def.id} clip ${name}: ticks must be positive integers`);
      const m = moves.get(name);
      const total = clip.ticks.reduce((a: number, b: number) => a + b, 0);
      if (m && total !== m.totalTicks) errors.push(`${def.id} clip ${name}: ${total} ticks, attack lasts ${m.totalTicks}`);
      if (!m && !LOOP_CLIPS.includes(name)) errors.push(`${def.id} clip ${name}: not an attack id or loop clip`);
    }
    const missing = wanted.filter(n => !clips[n]);
    coverage[def.id] = { missing, covered: wanted.length - missing.length, total: wanted.length };
  }
  return { errors, coverage };
}

if (import.meta.main) {
  const { errors, coverage } = validateArt();
  for (const [id, c] of Object.entries(coverage)) console.log(`${id.padEnd(9)} clips ${c.covered}/${c.total}`);
  for (const e of errors) console.error('ERROR ' + e);
  const gaps = Object.values(coverage).some(c => c.missing.length);
  if (errors.length || (process.argv.includes('--strict') && gaps)) process.exit(1);
  console.log(errors.length ? '' : gaps ? 'Structure valid; animation coverage incomplete (concept stand-ins).' : 'All fighters fully covered.');
}
