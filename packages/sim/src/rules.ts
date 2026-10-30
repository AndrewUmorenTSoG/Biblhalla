// Stocks, ring-outs, waves and match results.

import type { SimContext } from './context.ts';
import type { Fighter, SimState } from './types.ts';
import { createFighter, event, finish, scheduleWave } from './state.ts';

/** Wave enemy roles are drawn as roster fighters in invented training gear. */
export const ENEMY_HERO: Record<string, string> = {
  road_guard: 'joshua', archer: 'jonathan', shield_guard: 'saul', brute: 'samson',
  captain: 'caleb', spear_guard: 'caleb', runner: 'esther',
};

const NEXT_WAVE = '__next';

/** Finite wave arrivals with a live-enemy cap that depends on difficulty. */
export function arrivals(ctx: SimContext, s: SimState): void {
  if (s.waveWait > 0) { s.waveWait--; return; }
  if (s.wavePending[0] === NEXT_WAVE) { s.wavePending = []; scheduleWave(s); return; }
  const live = s.fighters.filter(f => !f.human && f.stocks > 0).length;
  const cap = s.difficulty === 'easy' ? 2 : 3;
  if (s.wavePending.length && live < cap) {
    const role = s.wavePending.shift()!;
    const f = createFighter(ctx, s, { hero: ENEMY_HERO[role] || 'joshua', team: 1, stocks: 1, name: role.replace(/_/g, ' ') }, 1 + (s.totalEnemies % 3));
    f.weapon = ctx.defs[f.hero].weaponPair[0];
    f.invulnerable = 30;
    s.fighters.push(f);
    s.totalEnemies++;
    s.waveWait = 40;
    event(s, 'arrival', { fighter: f.id });
  }
  if (!s.wavePending.length && !s.fighters.some(f => !f.human && f.stocks > 0)) {
    s.fighters = s.fighters.filter(f => f.human);
    if (s.waveWait === 0) { s.waveWait = 120; s.wavePending = [NEXT_WAVE]; }
  }
  if (s.wavePending[0] === NEXT_WAVE) { s.wavePending = []; scheduleWave(s); s.waveWait = 120; }
}

export function knockOut(ctx: SimContext, s: SimState, f: Fighter): void {
  if (!f.stocks || f.respawn) return;
  f.stocks--;
  f.action = null; f.buffer = null; f.stun = f.hitstop = 0; f.vx = f.vy = f.kx = 0;
  f.weapon = 'unarmed'; f.carry = false;
  f.respawn = f.stocks ? ctx.R.respawnDelayTicks : 0;
  for (const it of s.items) if (it.claim === f.id) it.claim = null;
  event(s, 'ko', { fighter: f.id, x: f.x, y: f.y });
  if (s.mode === 'training') { f.stocks = 3; f.respawn = 60; }
}

const teamsOf = (fs: Fighter[]) => [...new Set(fs.map(f => f.team))];
const VERSUS_MODES = ['duel', 'boss', 'local', 'ffa', 'teams'];

/**
 * Tied contenders replay one stock at 150 damage for 60 seconds. Anyone not in the
 * tie is eliminated. Fighters already out of the arena return through the normal
 * respawn delay.
 */
function startSuddenDeath(ctx: SimContext, s: SimState, contenders: Fighter[]): void {
  const { R } = ctx;
  const ids = new Set(contenders.map(f => f.id));
  s.suddenDeath = true;
  s.remaining = R.suddenDeath.durationTicks;
  for (const f of s.fighters) {
    if (!ids.has(f.id)) { f.stocks = 0; f.respawn = 0; continue; }
    const wasOut = f.stocks === 0;
    f.stocks = R.suddenDeath.stocks;
    f.damage = R.suddenDeath.damageTenths;
    if (wasOut) f.respawn = R.respawnDelayTicks;
  }
  event(s, 'suddenDeath', { fighters: [...ids] });
}

/** Group standings: per team in 2v2 (summed stocks, then summed damage), else per fighter. */
function standings(s: SimState, living: Fighter[]): { members: Fighter[]; stocks: number; damage: number }[] {
  const groups = new Map<number, Fighter[]>();
  for (const f of living) {
    const key = s.mode === 'teams' ? f.team : f.id;
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  return [...groups.values()]
    .map(members => ({ members, stocks: members.reduce((n, f) => n + f.stocks, 0), damage: members.reduce((n, f) => n + f.damage, 0) }))
    .sort((a, b) => b.stocks - a.stocks || a.damage - b.damage || a.members[0].id - b.members[0].id);
}

/**
 * `finalKOs` are fighters who lost their last stock this tick. When they were the
 * last contenders standing, the simultaneous KO is a tie, never an id-order win.
 */
export function checkResult(ctx: SimContext, s: SimState, finalKOs: Fighter[] = []): void {
  if (s.mode === 'training') return;
  const humans = s.fighters.filter(f => f.human);
  const living = s.fighters.filter(f => f.stocks);

  if (VERSUS_MODES.includes(s.mode) && living.length === 0 && teamsOf(finalKOs).length > 1) {
    if (s.suddenDeath) finish(s, false, 'Simultaneous final ring-out — draw');
    else startSuddenDeath(ctx, s, finalKOs);
    return;
  }
  if (!humans.some(f => f.stocks)) {
    if (s.mode === 'local' || s.mode === 'teams' || s.mode === 'ffa') {
      if (teamsOf(living).length <= 1) finish(s, false, 'Match complete', living.map(f => f.id));
    } else {
      finish(s, false, 'All three lives used');
    }
    return;
  }
  if (s.mode === 'waves' || s.mode === 'story') return;
  const boss = s.fighters.find(f => f.guard !== null);
  if (boss && boss.guard === 0) { finish(s, true, 'Champion guard broken', humans.map(f => f.id)); return; }
  if (teamsOf(living).length <= 1) {
    const ids = living.map(f => f.id);
    finish(s, ids.includes(humans[0].id), 'Ring-out victory', ids);
    return;
  }
  if (s.remaining <= 0) {
    const ranked = standings(s, living);
    const tied = ranked.length > 1 && ranked[0].stocks === ranked[1].stocks && ranked[0].damage === ranked[1].damage;
    if (tied && !s.suddenDeath) {
      const top = ranked.filter(g => g.stocks === ranked[0].stocks && g.damage === ranked[0].damage);
      startSuddenDeath(ctx, s, top.flatMap(g => g.members));
      return;
    }
    const winners = tied ? [] : ranked[0].members;
    finish(s, winners.some(f => f.human), tied ? 'Time limit — draw' : 'Time limit — lives, then damage decide', winners.map(f => f.id));
  }
}
