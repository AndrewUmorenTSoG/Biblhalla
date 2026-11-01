// Match state construction, pause, events and results.

import type { SimContext } from './context.ts';
import type { Fighter, FighterConfig, Input, InputFrame, MatchOptions, Mode, SimEvent, SimState } from './types.ts';
import { Q, hash, snapshot } from './fixed.ts';
import type { Difficulty } from '../../content/src/index.ts';

export const MODES: Mode[] = ['duel', 'waves', 'boss', 'training', 'local', 'teams', 'ffa', 'story'];
export const DEFAULT_SEED = 613891;
export const DEFAULT_WAVES = [['road_guard', 'road_guard'], ['archer', 'brute'], ['shield_guard', 'road_guard', 'archer']];
export const BOSS_GUARD = 1700;

/** Normalize any partial frame into a complete semantic input. */
export function input(i: InputFrame = {}): Input {
  return {
    x: Math.sign(i.x || 0), y: Math.sign(i.y || 0),
    jump: !!i.jump, jumpHeld: !!i.jumpHeld,
    light: !!i.light, heavy: !!i.heavy, heavyHeld: !!i.heavyHeld,
    dodge: !!i.dodge, item: !!i.item, interact: !!i.interact, interactHeld: !!(i.interactHeld || i.interact),
  };
}

export function event(s: SimState, type: string, data: Record<string, unknown> = {}): void {
  s.events.push({ id: ++s.eventId, tick: s.tick, type, ...data } as SimEvent);
}

export function createFighter(ctx: SimContext, s: SimState, cfg: FighterConfig, slot: number): Fighter {
  const hero = ctx.defs[cfg.hero] ? cfg.hero : 'david';
  const def = ctx.defs[hero];
  const pt = s.map.spawnFeetUnits[slot % s.map.spawnFeetUnits.length];
  return {
    id: ++s.entityId, hero, name: cfg.name || def.name, human: !!cfg.human,
    inputId: cfg.inputId || 'keyboard', team: cfg.team ?? slot,
    x: pt[0] * Q, y: pt[1] * Q, vx: 0, vy: 0, kx: 0, facing: slot % 2 ? -1 : 1, ground: null,
    stocks: cfg.stocks ?? s.stocksRule ?? ctx.R.stockDefault, damage: 0, weapon: 'unarmed', nextWeapon: 0,
    jumps: ctx.P.airJumps, recovery: ctx.P.recoveryUses, dodgeCD: 0, dashCD: 0,
    wallTicks: 0, wallRefresh: 1, wallUsed: 0, wallSide: 0, groundedTicks: 0,
    coyote: 0, drop: 0, invulnerable: 0, respawn: 0, stun: 0, hitstop: 0, chase: 0, jumpTick: -1,
    action: null, buffer: null, jumpCut: false,
    ai: { next: 0, intent: input(), history: [], tell: 0, tellDir: 1, phase: 1 },
    guard: cfg.guard ?? null, maxGuard: cfg.guard ?? null, scale: cfg.scale || 1,
    stats: { ...def.stats }, score: 0, damageDealt: 0, hits: 0, carry: false,
  };
}

export function scheduleWave(s: SimState): void {
  if (s.wave >= s.waves.length) { finish(s, true, 'All waves cleared'); return; }
  s.wave++;
  s.wavePending = [...s.waves[s.wave - 1]];
  s.waveWait = 0;
  event(s, 'wave', { wave: s.wave });
}

/** Whole-number rule value inside [lo, hi], or null when absent or invalid. */
function ruleInt(value: unknown, lo: number, hi: number): number | null {
  const n = Number(value);
  return value !== undefined && value !== '' && Number.isInteger(n) && n >= lo && n <= hi ? n : null;
}

export const RANDOM_HERO = 'random';

/**
 * "Random" fighter picks resolve from the match seed and seat, before loading, so a
 * replay or rematch with the same seed shows the same fighters. The simulation RNG
 * stream is not consumed.
 */
export function resolveHero(ctx: SimContext, hero: string | undefined, seed: number, slot: number): string | undefined {
  if (hero !== RANDOM_HERO) return hero;
  const roster = ctx.content.fighters.fighters.map(f => f.id);
  return roster[parseInt(hash(`${seed}:${slot}`), 16) % roster.length];
}

export function create(ctx: SimContext, options: MatchOptions = {}): SimState {
  const { content, R } = ctx;
  const map = content.maps.maps.find(m => m.id === options.arena) || content.maps.maps[0];
  const difficulty = (R.difficulty as Record<string, unknown>)[options.difficulty as string] ? options.difficulty as Difficulty : 'easy';
  const mode = MODES.includes(options.mode as Mode) ? options.mode as Mode : 'duel';
  const minutes = ruleInt(options.matchMinutes, 1, 10);
  const s: SimState = {
    version: 1, contentHash: content.hash || 'development', tick: 0,
    rng: (Number(options.seed) >>> 0) || DEFAULT_SEED, entityId: 0, eventId: 0,
    phase: 'countdown', countdown: 150, resumePhase: null, mode, difficulty,
    map: snapshot(map), fighters: [], projectiles: [], items: [], events: [],
    remaining: minutes ? minutes * 60 * 60 : R.matchTicks, result: null,
    stocksRule: ruleInt(options.stocks, 1, 9) ?? R.stockDefault,
    wave: 0, waveWait: 0, wavePending: [], waves: options.waves || DEFAULT_WAVES,
    waveEntries: options.waveEntries ? snapshot(options.waveEntries) : null, waveArrivals: 0, waveResting: false, cue: null,
    bossScript: options.bossScript ? snapshot(options.bossScript) : null,
    bossRun: options.bossScript ? { phase: 1, index: 0, stage: 'gap', ticks: 60, lockX: 0, originX: 0, instance: 0, hit: [] } : null,
    bossHazard: null,
    pickupTick: R.pickups.initialTick, pickupCycle: 0, pickupPriority: 0,
    friendlyFire: !!options.friendlyFire, trainingBot: options.trainingBot || 'idle',
    bossName: options.bossName || 'Training champion', suddenDeath: false, totalEnemies: 0,
    options: snapshot(options),
  };
  if (options.fighters) {
    s.fighters = options.fighters.map((f, i) => createFighter(ctx, s, { ...f, hero: resolveHero(ctx, f.hero, s.rng, i)! }, i));
  } else {
    const hero = resolveHero(ctx, options.hero, s.rng, 0) || 'david';
    s.fighters.push(createFighter(ctx, s, { hero, human: true, team: 0, inputId: options.inputId || 'keyboard' }, 0));
    if (mode === 'waves' || mode === 'story') scheduleWave(s);
    else {
      const boss = mode === 'boss';
      s.fighters.push(createFighter(ctx, s, {
        hero: resolveHero(ctx, options.opponent, s.rng, 1) || (hero === 'samson' ? 'david' : 'samson'), team: 1,
        stocks: boss ? 1 : s.stocksRule, guard: boss ? BOSS_GUARD : null, scale: boss ? 1.45 : 1,
        name: boss ? s.bossName : undefined,
      }, 1));
    }
  }
  return s;
}

/** Pause freezes the entire state and clears buffered input; resume is explicit. */
export function pause(s: SimState, on = true): void {
  if (on && s.phase !== 'paused' && s.phase !== 'result') {
    s.resumePhase = s.phase;
    s.phase = 'paused';
    for (const f of s.fighters) f.buffer = null;
  } else if (!on && s.phase === 'paused') {
    s.phase = s.resumePhase || 'playing';
    s.resumePhase = null;
  }
}

export function finish(s: SimState, won: boolean, reason: string, winners: number[] = []): void {
  if (s.phase === 'result') return;
  s.phase = 'result';
  s.result = { won, reason, winners, ticks: s.tick, difficulty: s.difficulty, mode: s.mode };
  event(s, 'result', { ...s.result });
}
