// Scripted encounter bosses. A boss cycles authored moves per phase: a visible,
// locked tell, an active hazard zone, then a real recovery (the punish window).
// Hazards use the shared capsule, respect dodge invulnerability and hit once.

import type { SimContext } from './context.ts';
import type { BossMove, Fighter, SimState } from './types.ts';
import { Q, clamp, roundMul } from './fixed.ts';
import { event } from './state.ts';
import { capsuleRect, launchForceQ } from './combat.ts';
import type { Box } from './combat.ts';
import { invincible } from './physics.ts';

/** Quiet ticks between moves; difficulty changes pacing, never tells, damage or guard. */
export const BOSS_GAP_TICKS: Record<string, number> = { easy: 60, hard: 36, extreme: 24 };
export const MIN_TELL_TICKS = 24;
const HAZARD_GROWTH_Q = 8;

export function bossPhase(f: Fighter): number {
  if (f.guard === null || f.maxGuard === null) return 1;
  return f.guard < f.maxGuard * 0.3 ? 3 : f.guard < f.maxGuard * 0.65 ? 2 : 1;
}

/** World box for the current move, from the main stage surface and the locked lane. */
export function hazardBox(s: SimState, move: BossMove, lockX: number, progress: number, bossX: number): Box {
  const [mx, my, mw, mh] = s.map.main.rectUnits;
  const floor = (my + mh) * Q;
  const h = move.height * Q, w = move.width * Q;
  switch (move.kind) {
    case 'sweep': return [mx * Q, floor, mw * Q, h];
    case 'charge': {
      const x = bossX + Math.trunc(((lockX - bossX) * progress) / Math.max(1, move.active));
      return [x - w / 2, floor, w, h];
    }
    case 'lane':
    case 'slam':
      return [lockX - w / 2, floor, w, h];
  }
}

function hitTarget(ctx: SimContext, s: SimState, boss: Fighter, target: Fighter, move: BossMove): void {
  const { P } = ctx;
  target.damage = clamp(target.damage + move.damageTenths, 0, 9990);
  const raw = launchForceQ({ baseForceQ: move.forceQ, growthQPerDamage: HAZARD_GROWTH_Q }, target.damage);
  const force = clamp(roundMul(raw, 1000 + P.guardForcePermillePerStat * (target.stats.guard - P.statBaseline)), 0, P.knockbackCapQ);
  const dir = P.directionLookup[String(move.angle)] || P.directionLookup['45'];
  const away = target.x >= boss.x ? 1 : -1;
  target.kx = roundMul(force, dir[0], 1024) * away;
  target.vy = roundMul(force, dir[1], 1024);
  target.vx = 0;
  target.stun = Math.max(target.stun, 20);
  target.hitstop = Math.max(target.hitstop, 5);
  target.action = null; target.buffer = null; target.ground = null;
  for (const it of s.items) if (it.claim === target.id) it.claim = null;
  event(s, 'hit', { fighter: target.id, attacker: boss.id, x: target.x, y: target.y + 40 * Q, damage: move.damageTenths, hazard: move.name });
}

/** Advance the scripted boss one tick. Called after fighters move, before combat. */
export function updateBoss(ctx: SimContext, s: SimState): void {
  const script = s.bossScript, run = s.bossRun;
  const boss = s.fighters.find(f => f.guard !== null && f.stocks > 0);
  if (!script || !run || !boss || boss.respawn) { s.bossHazard = null; return; }
  const player = s.fighters.find(f => f.human && f.stocks && !f.respawn);
  if (player) boss.facing = player.x < boss.x ? -1 : 1;

  const phase = bossPhase(boss);
  if (phase !== run.phase) {
    // A phase change ends the current move cleanly: no contact survives a phase exit.
    run.phase = phase; run.index = 0; run.stage = 'gap'; run.ticks = BOSS_GAP_TICKS[s.difficulty] ?? 36;
    s.bossHazard = null;
    event(s, 'bossPhase', { fighter: boss.id, phase });
  }
  const moves = script.phases[Math.min(phase, script.phases.length) - 1];
  const move = moves[run.index % moves.length];

  if (--run.ticks > 0) {
    if (run.stage === 'active') {
      const progress = move.active - run.ticks;
      const box = hazardBox(s, move, run.lockX, progress, run.originX);
      s.bossHazard = { name: move.name, kind: move.kind, stage: 'active', box, ticks: run.ticks };
      if (move.kind === 'charge') boss.x = box[0] + box[2] / 2;
      for (const f of s.fighters) {
        if (f.id === boss.id || !f.stocks || f.respawn || f.team === boss.team || run.hit.includes(f.id) || invincible(ctx, f)) continue;
        // A feint has no contact at all.
        if (move.damageTenths > 0 && capsuleRect(ctx, f, box)) { run.hit.push(f.id); hitTarget(ctx, s, boss, f, move); }
      }
    } else if (s.bossHazard) {
      s.bossHazard.ticks = run.ticks;
    }
    return;
  }
  // Stage transitions: gap -> tell -> active -> recovery -> gap (next move).
  if (run.stage === 'gap') {
    run.stage = 'tell'; run.ticks = Math.max(MIN_TELL_TICKS, move.tell);
    // The lane locks when the tell starts and never follows the player afterwards.
    run.lockX = clamp(player ? player.x : boss.x, s.map.main.rectUnits[0] * Q, (s.map.main.rectUnits[0] + s.map.main.rectUnits[2]) * Q);
    run.originX = boss.x;
    run.instance = ++s.entityId; run.hit = [];
    s.bossHazard = { name: move.name, kind: move.kind, stage: 'tell', box: hazardBox(s, move, run.lockX, 0, boss.x), ticks: run.ticks };
    event(s, 'bossTell', { fighter: boss.id, phase, move: move.name, caption: move.caption });
  } else if (run.stage === 'tell') {
    run.stage = 'active'; run.ticks = move.active + 1;
  } else if (run.stage === 'active') {
    run.stage = 'recovery'; run.ticks = move.recovery;
    s.bossHazard = null;
    event(s, 'bossOpening', { fighter: boss.id, ticks: move.recovery });
  } else {
    run.stage = 'gap'; run.ticks = BOSS_GAP_TICKS[s.difficulty] ?? 36; run.index++;
  }
}
