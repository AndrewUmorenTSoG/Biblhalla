// Extract authored scene facts from the 84 level briefs in
// production-pack/11_Story_Campaign/Levels: companion lines and wave entry gates.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LevelScript, WaveGate } from '../../packages/content/src/index.ts';

const QUOTED = /“([^”]+)”/;

/** Wave arrival text -> gate ids, e.g. "left floor gate and right shelf". */
export function parseGates(text: string): { gates: WaveGate[]; archerGate: WaveGate | null } {
  const t = text.toLowerCase();
  const gates: WaveGate[] = [];
  const add = (g: WaveGate) => { if (!gates.includes(g)) gates.push(g); };
  if (/both side gates|left\/right floor gates/.test(t)) { add('left_floor'); add('right_floor'); }
  if (/left floor gate/.test(t)) add('left_floor');
  if (/right floor gate/.test(t)) add('right_floor');
  if (/right shelf/.test(t)) add('right_shelf');
  if (/left shelf/.test(t)) add('left_shelf');
  if (/center ramp|centre ramp/.test(t)) add('center');
  const archerGate: WaveGate | null = /archer on the high shelf/.test(t) ? 'high_shelf' : null;
  return { gates: gates.length ? gates : ['left_floor', 'right_floor'], archerGate };
}

export function parseBrief(markdown: string, id: string): LevelScript {
  const line = (label: string) => {
    const at = markdown.indexOf(label);
    if (at < 0) throw new Error(`${id}: brief has no "${label}"`);
    const m = QUOTED.exec(markdown.slice(at));
    if (!m) throw new Error(`${id}: "${label}" has no quoted line`);
    const speaker = /(Ken|Dru):\s*“/.exec(markdown.slice(at))?.[1] ?? 'Ken';
    return { speaker, text: m[1] };
  };
  const waves = [...markdown.matchAll(/^\d+\. Wave \d+: \*\*([^*]+)\*\*\. Enter (?:through|from) ([^;]+);/gm)]
    .map(m => ({ roster: m[1].trim(), ...parseGates(m[2]) }));
  return { id, opening: line('Opening fictional companion line'), closing: line('Closing fictional companion line'), waveEntries: waves };
}

export function loadLevelScripts(dir: string): LevelScript[] {
  return readdirSync(dir)
    .filter(f => /^\d{3}_.*\.md$/.test(f))
    .sort()
    .map(f => parseBrief(readFileSync(join(dir, f), 'utf8'), 'L' + f.slice(0, 3)));
}
