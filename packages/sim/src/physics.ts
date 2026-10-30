// Movement integration and stage collision. Hurtbox and stage geometry come only
// from content data, never from art.

import type { Platform } from '../../content/src/index.ts';
import type { SimContext } from './context.ts';
import type { Fighter, Input, SimState } from './types.ts';
import { Q, approach } from './fixed.ts';
import { event } from './state.ts';
import { resolveAction } from './moveResolver.ts';
import { startProjectile } from './combat.ts';
import { releaseItem } from './items.ts';

const AIR_BRAKE_Q = 48;

/** Stage pieces in stable id order so contact results never depend on authoring order. */
export function platforms(s: SimState): Platform[] {
  return [s.map.main, ...s.map.platforms].sort((a, b) => a.id.localeCompare(b.id));
}

export function outside(s: SimState, x: number, y: number): boolean {
  const b = s.map.blastBoundsUnits;
  return x < b.minX * Q || x > b.maxX * Q || y < b.minY * Q || y > b.maxY * Q;
}

/** Total ticks of a dodge: startup + invulnerable + recovery from physics data. */
export function dodgeTicks(ctx: SimContext, airborne: boolean): number {
  const d = airborne ? ctx.P.dodge.air : ctx.P.dodge.ground;
  return d.startup + d.invulnerable + d.recovery;
}

/**
 * Dodge invulnerability window, or respawn protection. Attacks never grant it.
 * `a.tick` has already advanced past the local tick that just ran, as with hit zones.
 */
export function invincible(ctx: SimContext, f: Fighter): boolean {
  if (f.invulnerable) return true;
  const a = f.action;
  if (a?.kind !== 'dodge') return false;
  const d = a.airborne ? ctx.P.dodge.air : ctx.P.dodge.ground;
  const local = a.tick - 1;
  return local >= d.startup && local < d.startup + d.invulnerable;
}

/** Blast zones test the fighter's centre point, 37 units above the feet. */
export const BLAST_CENTER_UNITS = 37;
export function fighterOutside(s: SimState, f: Fighter): boolean {
  return outside(s, f.x, f.y + BLAST_CENTER_UNITS * Q);
}

/** Swept move against solid walls/floors/undersides and one-way tops. */
export function moveFighter(ctx: SimContext, s: SimState, f: Fighter, dx: number, dy: number): void {
  const { P, moves } = ctx;
  const oldX = f.x, oldY = f.y;
  let nx = oldX + dx, ny = oldY + dy;
  f.wallSide = 0;
  const halfWidth = (P.hurtboxUnits[0] / 2) * Q, height = P.hurtboxUnits[1] * Q;
  let contact: string | null = null;
  for (const pl of platforms(s)) {
    const [ux, uy, uw, uh] = pl.rectUnits;
    const left = ux * Q, right = (ux + uw) * Q, bottom = uy * Q, top = (uy + uh) * Q;
    const besideSolid = pl.kind === 'solid' && oldY < top && oldY + height > bottom;
    if (besideSolid) {
      if (dx > 0 && oldX + halfWidth <= left && nx + halfWidth > left) { nx = left - halfWidth; f.vx = 0; f.kx = 0; f.wallSide = 1; }
      if (dx < 0 && oldX - halfWidth >= right && nx - halfWidth < right) { nx = right + halfWidth; f.vx = 0; f.kx = 0; f.wallSide = -1; }
    }
    if (pl.kind === 'solid' && dy > 0 && oldY + height <= bottom && ny + height > bottom && nx + halfWidth > left && nx - halfWidth < right) {
      ny = bottom - height; f.vy = 0;
    }
    if (dy <= 0 && oldY >= top && ny <= top && nx + halfWidth > left && nx - halfWidth < right && !(pl.kind === 'oneWay' && f.drop > 0)) {
      if (!contact || top > ny) { ny = top; f.vy = 0; contact = pl.id; }
    }
    if (besideSolid) {
      if (Math.abs(nx + halfWidth - left) <= Q) f.wallSide = 1;
      if (Math.abs(nx - halfWidth - right) <= Q) f.wallSide = -1;
    }
  }
  if (f.ground && !contact) f.coyote = P.coyoteTicks;
  f.x = Math.trunc(nx);
  f.y = Math.trunc(ny);
  f.ground = contact;
  if (contact) {
    f.groundedTicks++;
    if (f.groundedTicks >= P.groundResetContactTicks) {
      f.jumps = P.airJumps; f.recovery = P.recoveryUses; f.wallTicks = 0; f.wallRefresh = 1; f.wallUsed = 0;
      f.dodgeCD = Math.min(f.dodgeCD, P.dodge.landingCooldownClamp);
    }
  } else {
    f.groundedTicks = 0;
    // One wall refresh per airborne journey.
    if (f.wallSide && f.wallRefresh) { f.wallRefresh = 0; f.jumps = P.airJumps; f.recovery = P.recoveryUses; }
  }
  if (contact && f.action?.kind === 'attack') {
    const m = moves[f.action.move!];
    if (m.landingRule === 'endActiveThenRecoveryPlus8' && !f.action.landed && f.action.tick >= m.startup) {
      f.action.tick = m.startup + m.active;
      f.action.duration = m.totalTicks + 8;
      f.action.landed = true;
    }
  }
}

const MIN_SPAWN_SEPARATION_UNITS = 180;

/**
 * Safe respawn point: the authored spawn farthest from living enemies, preferring
 * points at least 180 units clear; ties go to the lower spawn index.
 */
export function chooseSpawn(s: SimState, f: Fighter): [number, number] {
  const points = s.map.spawnFeetUnits;
  const enemies = s.fighters.filter(e => e.id !== f.id && e.team !== f.team && e.stocks && !e.respawn);
  if (!enemies.length) return points[(f.id - 1) % points.length];
  const clearance = ([x, y]: [number, number]) =>
    Math.min(...enemies.map(e => Math.abs(e.x - x * Q) + Math.abs(e.y - y * Q)));
  let best = 0;
  for (let i = 1; i < points.length; i++) if (clearance(points[i]) > clearance(points[best])) best = i;
  return points[best];
}

function respawn(ctx: SimContext, s: SimState, f: Fighter): void {
  const { P, R } = ctx;
  const pt = chooseSpawn(s, f);
  f.x = pt[0] * Q; f.y = pt[1] * Q; f.vx = f.vy = f.kx = 0;
  f.damage = s.suddenDeath ? R.suddenDeath.damageTenths : 0;
  f.invulnerable = R.respawnInvulnerabilityTicks; f.jumps = P.airJumps; f.recovery = P.recoveryUses;
  f.dodgeCD = 0; f.wallTicks = 0; f.wallRefresh = 1; f.ground = null;
  event(s, 'respawn', { fighter: f.id });
}

export function updateFighter(ctx: SimContext, s: SimState, f: Fighter, i: Input): void {
  const { P, R, moves } = ctx;
  if (f.dodgeCD > 0) f.dodgeCD--;
  if (f.dashCD > 0) f.dashCD--;
  if (f.invulnerable > 0) f.invulnerable--;
  if (f.coyote > 0) f.coyote--;
  if (f.drop > 0) f.drop--;
  if (f.chase > 0) f.chase--;
  if (f.buffer && --f.buffer.ticks < 0) f.buffer = null;
  if (!f.stocks) return;
  if (f.respawn) {
    if (--f.respawn === 0) respawn(ctx, s, f);
    return;
  }
  // Entity-local hitstop: this fighter freezes, cooldowns above keep running.
  if (f.hitstop) { f.hitstop--; return; }
  if (f.stun) f.stun--; else resolveAction(ctx, s, f, i);

  const a = f.action;
  let dx = 0, freezeY = false, jumpLaunch = f.jumpTick === s.tick;
  if (!a && !f.stun) {
    const cap = P.runMaxQ + P.runSpeedPerStatQ * (f.stats.speed - P.statBaseline);
    const accel = i.x ? (f.ground ? P.groundAccelerationQ : P.airAccelerationQ) : f.ground ? P.groundBrakeQ : AIR_BRAKE_Q;
    f.vx = approach(f.vx, i.x * cap, accel);
    if (i.x) f.facing = i.x;
  } else if (a?.kind === 'dash' || a?.kind === 'chase') {
    f.vx = a.dx || 0;
    if (a.kind === 'chase' && a.dy) f.vy = a.dy;
  } else {
    f.vx = approach(f.vx, 0, f.ground ? P.groundBrakeQ : AIR_BRAKE_Q);
  }
  if (a?.kind === 'dodge' && a.airborne && a.tick >= P.dodge.air.startup && a.tick < P.dodge.air.startup + P.dodge.air.invulnerable) { f.vx = a.dx || 0; f.vy = a.dy || 0; freezeY = true; }
  if (a?.kind === 'attack') {
    const m = moves[a.move!];
    if (a.cancelled && a.tick < m.startup + m.active) freezeY = true;
    for (const ev of m.motionEvents) {
      if (ev.kind === 'setVelocity' && ev.atTick === a.tick) { f.vx = ev.vxQ * a.facing; f.vy = ev.vyQ; f.jumpCut = false; jumpLaunch = true; }
      if (ev.kind === 'translate' && a.tick >= ev.fromTick && a.tick < ev.toTickExclusive) { dx += ev.dxQ * a.facing; f.vy += ev.dyQ; }
    }
    if (m.projectile?.spawnTick === a.tick) startProjectile(ctx, s, f, m, a);
  }
  if (a?.kind === 'throw' && a.tick === R.throw.startup) { a.dx = i.x; a.dy = i.y; }
  if (a && ((a.kind === 'throw' && a.tick === R.throw.startup) || (a.kind === 'drop' && a.tick === R.drop.startup) || (a.kind === 'pickup' && a.tick === a.duration - 1))) {
    releaseItem(ctx, s, f, a);
  }
  if (f.jumpCut && !i.jumpHeld && f.vy > 0 && !jumpLaunch) { f.vy = Math.min(f.vy, P.jumpCutCapQ); f.jumpCut = false; }
  if (!freezeY && !jumpLaunch) {
    const fastFall = i.y < 0 && f.vy < 0;
    f.vy = Math.max(fastFall ? -P.fastFallCapQ : -P.fallCapQ, f.vy - P.gravityQ * (fastFall ? P.fastFallGravityMultiplier : 1));
  }
  if (f.wallSide && i.x === f.wallSide && f.vy < 0 && f.wallTicks < P.wall.maxCumulativeTicks) {
    f.wallTicks++;
    f.vy = Math.max(f.vy, -P.wall.slideFallCapQ);
  }
  // Launch velocity holds through hitstun, then decays toward zero.
  if (!f.stun) f.kx = approach(f.kx, 0, P.knockbackDecayXQ);
  moveFighter(ctx, s, f, f.vx + f.kx + dx, freezeY && a?.cancelled ? 0 : f.vy);
  if (a) {
    const m = a.move ? moves[a.move] : null;
    // Charging holds the last startup tick; it never extends active frames or adds protection.
    if (m?.chargeable && a.tick === m.startup - 1 && i.heavyHeld && a.charge < m.chargeMaxTicks) a.charge++;
    else a.tick++;
    if (a.tick >= a.duration) f.action = null;
  }
}
