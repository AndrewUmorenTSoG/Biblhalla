// Seeded bot-vs-bot balance harness. Logs match length, KOs and self-KO rate per
// difficulty and arena. Usage: node tools/bot-harness.ts [--matches 200]

import { loadContent } from './lib/content.ts';
import { createEngine } from '../packages/sim/src/index.ts';

const SELF_KO_WINDOW_TICKS = 180;

const content = loadContent();
const S = createEngine(content);
const arg = process.argv.indexOf('--matches');
const matches = arg > 0 ? Number(process.argv[arg + 1]) : 20;
const roster = content.fighters.fighters.map(f => f.id);

console.log(`difficulty  arena                       matches  avgSeconds  KOs  selfKO%  timeouts`);
for (const difficulty of ['easy', 'hard', 'extreme']) {
  for (const map of content.maps.maps) {
    let ticks = 0, kos = 0, selfKos = 0, timeouts = 0;
    for (let n = 0; n < matches; n++) {
      const seed = 1000 + n;
      const s = S.create({
        mode: 'local', arena: map.id, difficulty, seed,
        fighters: [
          { hero: roster[n % roster.length], human: false, team: 0 },
          { hero: roster[(n * 5 + 3) % roster.length], human: false, team: 1 },
        ],
      });
      const lastHit = new Map<number, number>();
      while (s.phase !== 'result' && s.tick < S.R.matchTicks + S.R.suddenDeath.durationTicks) {
        S.step(s);
        for (const e of s.events) {
          if (e.type === 'hit') lastHit.set(e.fighter as number, s.tick);
          if (e.type === 'ko') {
            kos++;
            if (s.tick - (lastHit.get(e.fighter as number) ?? -1e9) > SELF_KO_WINDOW_TICKS) selfKos++;
          }
        }
      }
      ticks += s.tick;
      if (s.result?.reason.startsWith('Time limit')) timeouts++;
    }
    const row = [
      difficulty.padEnd(10), map.id.padEnd(27), String(matches).padStart(7),
      (ticks / matches / 60).toFixed(1).padStart(11), String(kos).padStart(4),
      (kos ? (100 * selfKos) / kos : 0).toFixed(1).padStart(8), String(timeouts).padStart(9),
    ];
    console.log(row.join('  '));
  }
}
