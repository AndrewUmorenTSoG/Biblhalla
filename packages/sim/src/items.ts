// Weapon pickups, drops and throws. A weapon exists in exactly one place at a
// time: held, on the ground, or in flight.

import type { SimContext } from './context.ts';
import type { Action, Fighter, SimState } from './types.ts';
import { Q, nextRandom, roundMul } from './fixed.ts';
import { event } from './state.ts';
import { outside, platforms } from './physics.ts';

const ITEM_GRAVITY_Q = 77;
const ITEM_FALL_CAP_Q = 2048;

/** Complete a pickup, drop or throw at its release tick. */
export function releaseItem(ctx: SimContext, s: SimState, f: Fighter, a: Action): void {
  const { P, R, defs } = ctx;
  if (a.kind === 'pickup') {
    const it = s.items.find(v => v.id === a.itemId && v.claim === f.id);
    if (!it) return;
    // Neutral crates alternate the fighter's pair A, B, A...; dropped weapons keep their exact family.
    f.weapon = it.neutral ? defs[f.hero].weaponPair[f.nextWeapon % 2] : it.weapon!;
    if (it.neutral) { f.nextWeapon++; s.pickupPriority++; }
    // The grammar just changed; inputs buffered for the old weapon are dropped.
    f.buffer = null;
    s.items = s.items.filter(v => v.id !== it.id);
    event(s, 'pickup', { fighter: f.id, weapon: f.weapon });
    return;
  }
  if (a.kind === 'drop') {
    s.items.push({ id: ++s.entityId, x: f.x + 24 * Q * a.facing, y: f.y + 25 * Q, vy: 0, life: R.drop.lifetimeTicks, neutral: false, weapon: f.weapon, claim: null });
    f.weapon = 'unarmed';
    return;
  }
  const angle = a.dy ? (a.dx ? (a.dy > 0 ? 45 : -45) : (a.dy > 0 ? 90 : -90)) : 0;
  const dir = P.directionLookup[String(angle)];
  const facing = a.dx || a.facing;
  s.projectiles.push({
    id: ++s.entityId, owner: f.id, team: f.team, move: 'throw', instance: a.instance, facing,
    x: f.x + (ctx.defs[f.hero].releaseOrigins?.[f.weapon]?.[0]??34) * Q * a.facing, y: f.y + (ctx.defs[f.hero].releaseOrigins?.[f.weapon]?.[1]??54) * Q,
    vx: roundMul(R.throw.speedQ, dir[0], 1024) * facing, vy: roundMul(R.throw.speedQ, dir[1], 1024),
    gravity: R.throw.gravityQ, life: R.throw.lifetimeTicks, size: [18, 18], capClass: 'throw', charge: 0, weapon: f.weapon,
  });
  f.weapon = 'unarmed';
  event(s, 'throw', { fighter: f.id });
}

export function updateItems(ctx: SimContext, s: SimState): void {
  const { R } = ctx;
  if (s.tick >= s.pickupTick) {
    if (s.items.filter(it => it.neutral).length < R.pickups.maxNeutral) {
      const pts = s.map.pickupSpawnUnits;
      const pt = pts[s.pickupCycle++ % pts.length];
      s.items.push({ id: ++s.entityId, x: pt[0] * Q, y: pt[1] * Q, vy: 0, life: R.pickups.lifetimeTicks, neutral: true, weapon: null, claim: null });
      event(s, 'crate');
    }
    s.pickupTick = s.tick + R.pickups.intervalTicks + (nextRandom(s) % (R.pickups.jitterTicks * 2 + 1)) - R.pickups.jitterTicks;
  }
  for (const it of s.items) {
    if (it.claim) {
      const f = s.fighters.find(v => v.id === it.claim);
      if (!f || f.action?.kind !== 'pickup') it.claim = null;
    }
    const old = it.y;
    it.vy = Math.max(it.vy - ITEM_GRAVITY_Q, -ITEM_FALL_CAP_Q);
    it.y += it.vy;
    for (const pl of platforms(s)) {
      const [x, , w] = pl.rectUnits;
      const top = (pl.rectUnits[1] + pl.rectUnits[3]) * Q;
      if (old >= top && it.y <= top && it.x > x * Q && it.x < (x + w) * Q) { it.y = top; it.vy = 0; }
    }
    it.life--;
  }
  s.items = s.items.filter(it => it.life > 0 && !outside(s, it.x, it.y));
}
