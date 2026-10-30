// Wave encounters: finite authored rosters entering through named gates, each
// arrival announced by a 90-tick marker, with a 120-tick break between waves.

import type { MapDef, WaveGate } from '../../content/src/index.ts';
import type { SimContext } from './context.ts';
import type { SimState, WaveCue } from './types.ts';
import { Q } from './fixed.ts';
import { createFighter, event, scheduleWave } from './state.ts';

/** Wave enemy roles are drawn as roster fighters in invented training gear. */
export const ENEMY_HERO: Record<string, string> = {
  road_guard: 'joshua', archer: 'jonathan', shield_guard: 'saul', brute: 'samson',
  captain: 'caleb', spear_guard: 'caleb', runner: 'esther',
};

export const ARRIVAL_CUE_TICKS = 90;
export const WAVE_BREAK_TICKS = 120;
/** Never place an arrival this close to a player. */
export const SAFE_ARRIVAL_UNITS = 140;
const GATE_INSET_UNITS = 60;
const FEET_CLEARANCE_UNITS = 2;

/** Gate -> feet position in units, from collision geometry only. */
export function gatePoint(map: MapDef, gate: WaveGate): [number, number] {
  const [mx, my, mw, mh] = map.main.rectUnits;
  const floor = my + mh + FEET_CLEARANCE_UNITS;
  const shelves = map.platforms.filter(p => p.kind === 'oneWay').map(p => {
    const [x, y, w, h] = p.rectUnits;
    return { cx: x + w / 2, top: y + h + FEET_CLEARANCE_UNITS };
  }).sort((a, b) => a.cx - b.cx);
  const shelf = (pick: typeof shelves[number] | undefined, fallback: [number, number]): [number, number] => pick ? [pick.cx, pick.top] : fallback;
  switch (gate) {
    case 'left_floor': return [mx + GATE_INSET_UNITS, floor];
    case 'right_floor': return [mx + mw - GATE_INSET_UNITS, floor];
    case 'center': return [mx + mw / 2, floor];
    case 'left_shelf': return shelf(shelves[0], [mx + GATE_INSET_UNITS, floor]);
    case 'right_shelf': return shelf(shelves[shelves.length - 1], [mx + mw - GATE_INSET_UNITS, floor]);
    case 'high_shelf': {
      const top = [...shelves].sort((a, b) => b.top - a.top || a.cx - b.cx)[0];
      return shelf(top, [mx + mw - GATE_INSET_UNITS, floor]);
    }
  }
}

/** Pick the arrival point: the authored gate, or the safest alternative if a player stands on it. */
function arrivalPoint(s: SimState, role: string, index: number): [number, number] {
  const entry = s.waveEntries?.[s.wave - 1];
  const gates: WaveGate[] = entry?.gates?.length ? entry.gates : ['left_floor', 'right_floor'];
  const preferred: WaveGate = role === 'archer' && entry?.archerGate ? entry.archerGate : gates[index % gates.length];
  const humans = s.fighters.filter(f => f.human && f.stocks && !f.respawn);
  const clearance = ([x, y]: [number, number]) => Math.min(Infinity, ...humans.map(h => Math.abs(h.x - x * Q) + Math.abs(h.y - y * Q))) / Q;
  const first = gatePoint(s.map, preferred);
  if (clearance(first) >= SAFE_ARRIVAL_UNITS) return first;
  const options = [...gates, 'left_floor', 'right_floor', 'center'].map(g => gatePoint(s.map, g as WaveGate));
  return options.reduce((best, p) => (clearance(p) > clearance(best) ? p : best), first);
}

function announce(s: SimState): void {
  const role = s.wavePending[0];
  const [x, y] = arrivalPoint(s, role, s.waveArrivals);
  s.cue = { x: x * Q, y: y * Q, role, ticks: ARRIVAL_CUE_TICKS } satisfies WaveCue;
  event(s, 'arrivalCue', { x: s.cue.x, y: s.cue.y, role });
}

export function arrivals(ctx: SimContext, s: SimState): void {
  if (s.waveWait > 0) {
    s.waveWait--;
    if (s.cue) s.cue.ticks = s.waveWait;
    return;
  }
  const live = s.fighters.filter(f => !f.human && f.stocks > 0).length;
  const cap = s.difficulty === 'easy' ? 2 : 3;
  if (s.wavePending.length) {
    if (live >= cap) return;
    // Every arrival is announced at its gate first.
    if (!s.cue) { announce(s); s.waveWait = ARRIVAL_CUE_TICKS; return; }
    const role = s.wavePending.shift()!;
    const f = createFighter(ctx, s, { hero: ENEMY_HERO[role] || 'joshua', team: 1, stocks: 1, name: role.replace(/_/g, ' ') }, 1);
    f.x = s.cue.x; f.y = s.cue.y;
    const player = s.fighters.find(h => h.human && h.stocks);
    f.facing = player && player.x < f.x ? -1 : 1;
    f.weapon = ctx.defs[f.hero].weaponPair[0];
    f.invulnerable = 30;
    s.fighters.push(f);
    s.totalEnemies++;
    s.waveArrivals++;
    s.cue = null;
    event(s, 'arrival', { fighter: f.id, x: f.x, y: f.y });
    return;
  }
  if (s.fighters.some(f => !f.human && f.stocks > 0)) return;
  // Wave cleared: remove spent opponents, rest, then start the next wave (or finish).
  s.fighters = s.fighters.filter(f => f.human);
  if (!s.waveResting) { s.waveResting = true; s.waveWait = WAVE_BREAK_TICKS; return; }
  s.waveResting = false;
  s.waveArrivals = 0;
  scheduleWave(s);
}
