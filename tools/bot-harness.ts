// Seeded bot-vs-bot balance harness (14_AI acceptance): per difficulty and arena it
// logs match length, KOs, self-KO rate, recovery success, repeated-move ratio and
// resource-legality violations. Usage:
//   node tools/bot-harness.ts [--matches 200] [--out docs/BOT_REPORT.md]

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadContent } from './lib/content.ts';
import { createEngine } from '../packages/sim/src/index.ts';

const SELF_KO_WINDOW_TICKS = 180;

export interface HarnessRow {
  difficulty: string; arena: string; matches: number; avgSeconds: number; kos: number;
  selfKoPct: number; recoveryPct: number; repeatPct: number; violations: number; timeouts: number;
}

export function runHarness(matches: number): HarnessRow[] {
  const content = loadContent();
  const S = createEngine(content);
  const roster = content.fighters.fighters.map(f => f.id);
  const rows: HarnessRow[] = [];
  for (const difficulty of ['easy', 'hard', 'extreme']) {
    for (const map of content.maps.maps) {
      let ticks = 0, kos = 0, selfKos = 0, timeouts = 0, offstage = 0, recovered = 0, attacks = 0, repeats = 0, violations = 0;
      const [mx, my, mw, mh] = map.main.rectUnits;
      for (let n = 0; n < matches; n++) {
        const s = S.create({
          mode: 'local', arena: map.id, difficulty, seed: 1000 + n,
          fighters: [
            { hero: roster[n % roster.length], human: false, team: 0 },
            { hero: roster[(n * 5 + 3) % roster.length], human: false, team: 1 },
          ],
        });
        const lastHit = new Map<number, number>();
        const lastMove = new Map<number, string>();
        const wasOff = new Map<number, boolean>();
        while (s.phase !== 'result' && s.tick < S.R.matchTicks + S.R.suddenDeath.durationTicks) {
          S.step(s);
          for (const e of s.events) {
            if (e.type === 'hit') lastHit.set(e.fighter as number, s.tick);
            if (e.type === 'ko') {
              kos++;
              if (s.tick - (lastHit.get(e.fighter as number) ?? -1e9) > SELF_KO_WINDOW_TICKS) selfKos++;
            }
            if (e.type === 'attack') {
              attacks++;
              if (lastMove.get(e.fighter as number) === e.move) repeats++;
              lastMove.set(e.fighter as number, e.move as string);
            }
          }
          for (const f of s.fighters) {
            if (f.jumps < 0 || f.jumps > S.P.airJumps || f.recovery < 0 || f.recovery > S.P.recoveryUses || f.wallTicks > S.P.wall.maxCumulativeTicks) violations++;
            // Recovery success: an offstage journey that ends standing on the stage again.
            const off = !f.respawn && f.stocks > 0 && (f.x < mx * 256 || f.x > (mx + mw) * 256 || f.y < (my + mh) * 256 - 10 * 256);
            if (f.respawn || !f.stocks) { wasOff.set(f.id, false); continue; }
            if (off && !wasOff.get(f.id)) { offstage++; wasOff.set(f.id, true); }
            else if (!off && wasOff.get(f.id) && f.ground) { recovered++; wasOff.set(f.id, false); }
          }
        }
        ticks += s.tick;
        if (s.result?.reason.startsWith('Time limit')) timeouts++;
      }
      rows.push({
        difficulty, arena: map.id, matches, avgSeconds: ticks / matches / 60, kos,
        selfKoPct: kos ? (100 * selfKos) / kos : 0, recoveryPct: offstage ? (100 * recovered) / offstage : 100,
        repeatPct: attacks ? (100 * repeats) / attacks : 0, violations, timeouts,
      });
    }
  }
  return rows;
}

export function formatReport(rows: HarnessRow[]): string {
  const head = '| Difficulty | Arena | Matches | Avg s | KOs | Self-KO % | Recovery % | Repeated move % | Legality violations | Timeouts |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |';
  const body = rows.map(r => `| ${r.difficulty} | ${r.arena} | ${r.matches} | ${r.avgSeconds.toFixed(1)} | ${r.kos} | ${r.selfKoPct.toFixed(1)} | ${r.recoveryPct.toFixed(1)} | ${r.repeatPct.toFixed(1)} | ${r.violations} | ${r.timeouts} |`).join('\n');
  return `${head}\n${body}`;
}

if (import.meta.main) {
  const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
  const matches = Number(arg('--matches') ?? 20);
  const rows = runHarness(matches);
  const table = formatReport(rows);
  console.log(table);
  const out = arg('--out');
  if (out) {
    writeFileSync(join(ROOT, out), `# Bot harness report\n\nSeeded bot-vs-bot local matches, ${matches} per difficulty and arena (\`node tools/bot-harness.ts --matches ${matches}\`). Self-KO: a ring-out with no hit taken in the previous 3 seconds. Recovery: offstage journeys that ended standing on stage. Repeated move: an attack identical to the same fighter's previous attack. Legality: any resource (jumps, recovery, wall fatigue) outside its bounds.\n\n${table}\n`);
    console.log(`Wrote ${out}`);
  }
}
