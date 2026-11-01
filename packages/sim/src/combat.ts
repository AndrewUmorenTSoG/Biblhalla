// Hit detection and resolution. Contacts are collected from pre-hit state, then
// applied per target in stable id order, so simultaneous hits trade.

import type { Attack, Rect } from '../../content/src/index.ts';
import type { SimContext } from './context.ts';
import type { Action, Fighter, SimState } from './types.ts';
import { Q, clamp, roundMul } from './fixed.ts';
import { event } from './state.ts';
import { invincible, outside, platforms } from './physics.ts';

export type Box = [number, number, number, number];
type HitSpec = Pick<Attack, 'damageTenths' | 'hitstunTicks' | 'hitstopTicks' | 'baseForceQ' | 'growthQPerDamage' | 'launchAngle' | 'chargeMaxTicks' | 'chargeMaxDamagePermille'>;
interface HitRecord { target: number; owner: number; instance: number; m: HitSpec; facing: number; charge: number; melee: boolean }

/** Attack rect [leftX, bottomY, w, h] in units -> world box, mirrored by facing. */
export function rectFor(f: Fighter, rect: Rect, facing = f.facing): Box {
  const [x, y, w, h] = rect;
  return [f.x + (facing > 0 ? x : -x - w) * Q, f.y + y * Q, w * Q, h * Q];
}

/** Shared capsule hurtbox vs axis-aligned box. Fighter art never changes this shape. */
export function capsuleRect(ctx: SimContext, f: Fighter, b: Box): boolean {
  const [x, y, w, h] = b;
  const [width, height] = ctx.P.hurtboxUnits;
  const r = (width / 2) * Q * f.scale;
  const bottom = f.y + r, top = f.y + (height - width / 2) * Q * f.scale;
  const px = clamp(f.x, x, x + w);
  const sy = clamp((y + y + h) / 2, bottom, top);
  const py = clamp(sy, y, y + h);
  const dx = px - f.x, dy = py - sy;
  return dx * dx + dy * dy <= r * r;
}

export function overlap(a: Box, b: Box): boolean {
  return a[0] <= b[0] + b[2] && a[0] + a[2] >= b[0] && a[1] <= b[1] + b[3] && a[1] + a[3] >= b[1];
}

/** Liang-Barsky segment vs box. */
export function segmentBox(x: number, y: number, nx: number, ny: number, b: Box): boolean {
  let t0 = 0, t1 = 1;
  const dx = nx - x, dy = ny - y;
  for (const [v, q] of [[-dx, x - b[0]], [dx, b[0] + b[2] - x], [-dy, y - b[1]], [dy, b[1] + b[3] - y]]) {
    if (v === 0) {
      if (q < 0) return false;
    } else {
      const t = q / v;
      if (v < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
      if (t0 > t1) return false;
    }
  }
  return true;
}

/** One live projectile per owner per cap class; extra spawns fizzle. */
export function startProjectile(ctx: SimContext, s: SimState, f: Fighter, m: Attack, a: Action): void {
  const p = m.projectile;
  if (!p) return;
  if (s.projectiles.some(t => t.owner === f.id && t.capClass === p.capClass)) { event(s, 'fizzle', { fighter: f.id }); return; }
  const dir = ctx.P.directionLookup[String(p.travelAngle)] || ctx.P.directionLookup['0'];
  s.projectiles.push({
    id: ++s.entityId, owner: f.id, team: f.team, move: m.id, instance: a.instance, facing: a.facing,
    x: f.x + p.originUnits[0] * Q * a.facing, y: f.y + p.originUnits[1] * Q,
    vx: roundMul(p.speedQ, dir[0], 1024) * a.facing, vy: roundMul(p.speedQ, dir[1], 1024),
    gravity: p.gravityQ, life: p.lifetimeTicks, size: [p.collisionUnits[0], p.collisionUnits[1]],
    capClass: p.capClass, charge: a.charge, weapon: null,
  });
  event(s, 'projectile', { fighter: f.id });
}

/** rawKQ = baseForceQ + floor(growthQPerDamage * D10 / 10), D10 = damage after this tick's hits. */
export function launchForceQ(m: Pick<Attack, 'baseForceQ' | 'growthQPerDamage'>, damageTenths: number): number {
  return m.baseForceQ + Math.floor((m.growthQPerDamage * damageTenths) / 10);
}

/**
 * Campaign shield guards carry a frontal training shield: while idle and facing the
 * hit, damage and launch are halved. It never covers the back, never applies during
 * their own attacks or hitstun, and never makes them invulnerable.
 */
export function shieldBlocks(target: Fighter, hitFacing: number): boolean {
  return target.role === 'shield_guard' && !target.action && !target.stun && hitFacing === -target.facing;
}

function throwSpec(ctx: SimContext): HitSpec {
  return { ...ctx.R.throw, hitstopTicks: 3, launchAngle: 22, chargeMaxTicks: 0, chargeMaxDamagePermille: 1000 };
}

export function combat(ctx: SimContext, s: SimState): void {
  const { P, R, moves } = ctx;
  const hits: HitRecord[] = [];
  const zones: { f: Fighter; a: Action; m: Attack; box: Box }[] = [];
  const hittable = (target: Fighter, ownerId: number, team: number) =>
    target.id !== ownerId && target.stocks > 0 && !target.respawn && !invincible(ctx, target) && (s.friendlyFire || target.team !== team);

  for (const f of s.fighters) {
    const a = f.action;
    if (!f.stocks || f.respawn || f.hitstop || a?.kind !== 'attack') continue;
    const m = moves[a.move!];
    const localTick = a.tick - 1;
    for (const ph of m.collisionPhases) {
      if (localTick >= ph.firstTick && localTick < ph.lastTickExclusive) zones.push({ f, a, m, box: rectFor(f, ph.rectUnits, a.facing) });
    }
  }
  for (const { f, a, m, box } of zones) {
    for (const target of s.fighters) {
      if (!hittable(target, f.id, f.team) || a.hit.includes(target.id)) continue;
      if (capsuleRect(ctx, target, box)) {
        a.hit.push(target.id);
        a.confirmed = true;
        hits.push({ target: target.id, owner: f.id, instance: a.instance, m, facing: a.facing, charge: a.charge, melee: true });
      }
    }
  }

  const removed = new Set<number>();
  for (const p of s.projectiles) {
    const nx = p.x + p.vx, ny = p.y + p.vy;
    const hw = (p.size[0] * Q) / 2, hh = (p.size[1] * Q) / 2;
    // Active enemy melee deflects projectiles.
    for (const z of zones) {
      if (z.f.team !== p.team && segmentBox(p.x, p.y, nx, ny, [z.box[0] - hw, z.box[1] - hh, z.box[2] + 2 * hw, z.box[3] + 2 * hh])) {
        removed.add(p.id);
        event(s, 'deflect', { x: p.x, y: p.y });
        break;
      }
    }
    if (removed.has(p.id)) continue;
    for (const pl of platforms(s)) {
      const [x, y, w, h] = pl.rectUnits;
      const hitSolid = pl.kind === 'solid' && segmentBox(p.x, p.y, nx, ny, [x * Q - hw, y * Q - hh, w * Q + 2 * hw, h * Q + 2 * hh]);
      const hitTop = pl.kind === 'oneWay' && p.vy <= 0 && p.y >= (y + h) * Q && ny <= (y + h) * Q && nx > x * Q && nx < (x + w) * Q;
      if (hitSolid || hitTop) {
        removed.add(p.id);
        // A thrown weapon lands as a recoverable item of the same family.
        if (p.weapon) s.items.push({ id: ++s.entityId, x: p.x, y: p.y, vy: 512, life: R.drop.lifetimeTicks, neutral: false, weapon: p.weapon, claim: null });
        break;
      }
    }
    if (removed.has(p.id)) continue;
    for (const target of s.fighters) {
      if (!hittable(target, p.owner, p.team)) continue;
      // Swept finite-step capsule contact; authored projectile speed is bounded.
      const samples = Math.max(1, Math.ceil(Math.max(Math.abs(p.vx), Math.abs(p.vy)) / (8 * Q)));
      let contact = false;
      for (let n = 0; n <= samples && !contact; n++) {
        const cx = Math.trunc(p.x + ((nx - p.x) * n) / samples), cy = Math.trunc(p.y + ((ny - p.y) * n) / samples);
        contact = capsuleRect(ctx, target, [cx - hw, cy - hh, hw * 2, hh * 2]);
      }
      if (contact) {
        const m = p.move === 'throw' ? throwSpec(ctx) : moves[p.move];
        hits.push({ target: target.id, owner: p.owner, instance: p.instance, m, facing: p.facing, charge: p.charge, melee: false });
        removed.add(p.id);
        // A thrown weapon's one hit spends it; it drops as a non-damaging item of the same family.
        if (p.weapon) s.items.push({ id: ++s.entityId, x: p.x, y: p.y, vy: 512, life: R.drop.lifetimeTicks, neutral: false, weapon: p.weapon, claim: null });
        break;
      }
    }
    p.x = nx; p.y = ny; p.vy -= p.gravity; p.life--;
    if (p.life <= 0 || outside(s, p.x, p.y)) removed.add(p.id);
  }
  s.projectiles = s.projectiles.filter(p => !removed.has(p.id));

  hits.sort((a, b) => a.target - b.target || a.owner - b.owner || a.instance - b.instance);
  for (const target of s.fighters) {
    const group = hits.filter(h => h.target === target.id);
    if (!group.length) continue;
    let damage = 0, stun = 0, stop = 0;
    for (const h of group) {
      const owner = s.fighters.find(f => f.id === h.owner);
      // Charge scales damage linearly up to the authored permille; never size, time or angle.
      const chargeScale = h.m.chargeMaxTicks ? 1000 + Math.floor(((h.m.chargeMaxDamagePermille - 1000) * h.charge) / h.m.chargeMaxTicks) : 1000;
      const power = 1000 + P.powerDamagePermillePerStat * ((owner?.stats.power ?? P.statBaseline) - P.statBaseline);
      const raw = roundMul(roundMul(h.m.damageTenths, power), chargeScale);
      const blocked = shieldBlocks(target, h.facing);
      const amount = blocked ? Math.floor(raw / 2) : raw;
      if (blocked) event(s, 'shieldBlock', { fighter: target.id, attacker: h.owner });
      damage += amount;
      stun = Math.max(stun, h.m.hitstunTicks);
      stop = Math.max(stop, h.m.hitstopTicks);
      if (owner) {
        owner.damageDealt += amount;
        owner.hits++;
        // Hitstop freezes melee participants only; a distant thrower keeps moving.
        if (h.melee) {
          owner.hitstop = Math.max(owner.hitstop, h.m.hitstopTicks);
          owner.chase = P.chase.tokenTicks;
        }
      }
      event(s, 'hit', { fighter: target.id, attacker: h.owner, x: target.x, y: target.y + 40 * Q, damage: amount });
    }
    target.damage = clamp(target.damage + damage, 0, 9990);
    if (target.guard !== null) target.guard = Math.max(0, target.guard - damage);
    // Strongest pre-scaling launch wins; equal magnitudes go to the lower attack instance.
    let best = group[0], bestRaw = -1;
    for (const h of group) {
      const raw = launchForceQ(h.m, target.damage);
      if (raw > bestRaw || (raw === bestRaw && h.instance < best.instance)) { best = h; bestRaw = raw; }
    }
    const guardScale = 1000 + P.guardForcePermillePerStat * (target.stats.guard - P.statBaseline);
    const force = clamp(roundMul(shieldBlocks(target, best.facing) ? Math.floor(bestRaw / 2) : bestRaw, guardScale), 0, P.knockbackCapQ);
    const dir = P.directionLookup[String(best.m.launchAngle)] || P.directionLookup['22'];
    target.kx = roundMul(force, dir[0], 1024) * best.facing;
    target.vy = roundMul(force, dir[1], 1024);
    target.vx = 0;
    target.stun = stun;
    target.hitstop = Math.max(target.hitstop, stop);
    target.action = null;
    target.buffer = null;
    target.ground = null;
    for (const it of s.items) if (it.claim === target.id) it.claim = null;
  }
}
