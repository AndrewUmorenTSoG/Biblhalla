// Matchup grid (15_Balance): every unordered fighter pair (66) plus mirrors (12),
// both player slots, Hard bots, seeded. Bots are a proxy for balance, not a verdict;
// human playtests decide. Usage: node tools/matchups.ts [--seeds 4] [--out docs/MATCHUP_REPORT.md]

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadContent } from './lib/content.ts';
import { createEngine } from '../packages/sim/src/index.ts';
import { MatchRecorder } from '../packages/sim/src/stats.ts';
import type { FighterStats } from '../packages/sim/src/stats.ts';

export interface HeroTotals { hero: string; games: number; wins: number; draws: number; hits: number; whiffs: number; selfKos: number; damage: number; ticks: number }

export function runMatchups(seeds: number, arena?: string): { totals: HeroTotals[]; pairs: number } {
  const content = loadContent();
  const S = createEngine(content);
  const ids = content.fighters.fighters.map(f => f.id);
  const totals = new Map<string, HeroTotals>(ids.map(h => [h, { hero: h, games: 0, wins: 0, draws: 0, hits: 0, whiffs: 0, selfKos: 0, damage: 0, ticks: 0 }]));
  let pairs = 0;
  for (let i = 0; i < ids.length; i++) for (let j = i; j < ids.length; j++) {
    pairs++;
    for (let seed = 0; seed < seeds; seed++) for (const [a, b] of [[ids[i], ids[j]], [ids[j], ids[i]]]) {
      const s = S.create({ mode: 'local', difficulty: 'hard', seed: 9000 + seed + i * 31 + j, arena: arena ?? content.maps.maps[(i + j + seed) % 6].id,
        fighters: [{ hero: a, human: false, team: 0 }, { hero: b, human: false, team: 1 }] });
      const rec = new MatchRecorder(s);
      while (s.phase !== 'result' && s.tick < S.R.matchTicks + S.R.suddenDeath.durationTicks) { S.step(s); rec.observe(s); }
      for (const f of s.fighters) {
        const t = totals.get(f.hero)!, st: FighterStats | undefined = rec.stats.fighters[f.id];
        t.games++; t.ticks += s.tick;
        if (!s.result?.winners.length) t.draws++; else if (s.result.winners.includes(f.id)) t.wins++;
        if (st) { t.hits += st.hits; t.whiffs += st.whiffs; t.selfKos += st.selfKos; t.damage += st.damageDealt; }
      }
    }
  }
  return { totals: [...totals.values()].sort((x, y) => y.wins / y.games - x.wins / x.games), pairs };
}

export function formatMatchups(r: { totals: HeroTotals[]; pairs: number }, seeds: number): string {
  const rows = r.totals.map(t => `| ${t.hero} | ${t.games} | ${(100 * t.wins / t.games).toFixed(1)} | ${(100 * t.draws / t.games).toFixed(1)} | ${t.hits + t.whiffs ? (100 * t.hits / (t.hits + t.whiffs)).toFixed(1) : '0'} | ${(t.damage / 10 / t.games).toFixed(0)} | ${(t.selfKos / t.games).toFixed(2)} |`);
  return [`# Matchup report`, ``, `${r.pairs} pairings (66 unordered + 12 mirrors), both slots, ${seeds} seeds each, Hard bots on rotating arenas (\`node tools/matchups.ts --seeds ${seeds}\`). Bot results are a balance proxy only; human playtests decide.`, ``,
    `| Fighter | Games | Win % | Draw % | Hit rate % | Damage dealt / game | Self-KOs / game |`, `| --- | --- | --- | --- | --- | --- | --- |`, ...rows, ``].join('\n');
}

if (import.meta.main) {
  const arg = (n: string) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
  const seeds = Number(arg('--seeds') ?? 2);
  const report = formatMatchups(runMatchups(seeds), seeds);
  console.log(report);
  const out = arg('--out');
  if (out) writeFileSync(join(ROOT, out), report);
}
