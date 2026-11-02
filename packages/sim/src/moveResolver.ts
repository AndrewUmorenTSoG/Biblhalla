// Input legality: turns a semantic input into at most one new action.

import type { Attack } from '../../content/src/index.ts';
import type { SimContext } from './context.ts';
import type { Action, ActionKind, Fighter, Input, Item, SimState } from './types.ts';
import { Q, clamp } from './fixed.ts';
import { event } from './state.ts';
import { dodgeTicks } from './physics.ts';

const SIGNATURE = { neutral: 'nsig', side: 'ssig', down: 'dsig' } as const;
const GROUND_LIGHT = { neutral: 'nlight', side: 'slight', down: 'dlight' } as const;
const AIR_LIGHT = { neutral: 'nair', side: 'sair', down: 'dair' } as const;

/** Attack grammar: weapon/direction/context -> canonical attack record. */
export function selectMove(ctx: SimContext, f: Fighter, i: Input, grounded = !!f.ground): Attack | undefined {
  const dir = i.y < 0 ? 'down' : i.x ? 'side' : 'neutral';
  const { moves } = ctx;
  if (i.heavy) {
    if (!grounded) return moves[f.weapon + (dir === 'down' ? '_ground_pound' : '_recovery')];
    if (f.weapon === 'unarmed') return moves['unarmed_' + SIGNATURE[dir]];
    return moves[`${f.hero}_${f.weapon}_${SIGNATURE[dir]}`] || moves['unarmed_' + SIGNATURE[dir]];
  }
  const suffix=(grounded ? GROUND_LIGHT : AIR_LIGHT)[dir];
  return moves[`${f.hero}_${f.weapon}_${suffix}`] || moves[f.weapon + '_' + suffix];
}

export function beginAction(s: SimState, f: Fighter, kind: ActionKind, duration: number, extra: Partial<Action> = {}): void {
  f.action = { kind, tick: 0, duration, instance: ++s.entityId, facing: f.facing, hit: [], charge: 0, ...extra };
  f.buffer = null;
}

export function startAttack(ctx: SimContext, s: SimState, f: Fighter, i: Input, airCancel = false, override?: Attack): boolean {
  if (f.carry) return false;
  const m = override ?? selectMove(ctx, f, i, airCancel || !!f.ground);
  if (!m) return false;
  // Recovery is spent when the action starts, never on hit.
  const cost = m.resourceCostOnActionStart.recovery || 0;
  if (cost && f.recovery < cost) return false;
  f.recovery -= cost;
  if (i.x) f.facing = i.x;
  beginAction(s, f, 'attack', m.totalTicks, { move: m.id, cancelled: airCancel });
  f.invulnerable = 0;
  if (airCancel) f.vy = 0;
  event(s, 'attack', { fighter: f.id, move: m.id });
  return true;
}

/** Closest pickup this fighter may claim: neutral crates or its own weapon families. */
export function eligibleItem(ctx: SimContext, s: SimState, f: Fighter): Item | undefined {
  const { R, defs } = ctx;
  return s.items
    .filter(it => !it.claim && (it.neutral || defs[f.hero].weaponPair.includes(it.weapon!))
      && Math.abs(it.x - f.x) <= R.pickups.radiusUnits * Q && Math.abs(it.y - f.y) <= R.pickups.maxVerticalUnits * Q)
    .sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x) || a.id - b.id)[0];
}

function jump(s: SimState, f: Fighter, fromWall = false): void {
  f.ground = null; if (!fromWall) f.coyote = 0; f.action = null; f.buffer = null; f.jumpCut = true; f.jumpTick = s.tick;
  event(s, 'jump', { fighter: f.id });
}

/**
 * Remember this tick's press for up to `inputBufferTicks`. Dodge + direction while a chase
 * is earned is kept as a chase, so pressing it in the hit pause or the last active frames
 * still chases at the first legal recovery tick.
 */
export function bufferPress(ctx: SimContext, f: Fighter, i: Input): void {
  const ticks = ctx.P.inputBufferTicks;
  if (i.jump || i.heavy || i.light) f.buffer = { type: i.jump ? 'jump' : i.heavy ? 'heavy' : 'light', ticks, x: i.x, y: i.y };
  else if (i.dodge && (i.x || i.y) && f.chase > 0 && f.action?.kind === 'attack' && f.action.confirmed) f.buffer = { type: 'chase', ticks, x: i.x, y: i.y };
}

export function resolveAction(ctx: SimContext, s: SimState, f: Fighter, i: Input): void {
  const { P, R, moves } = ctx;
  bufferPress(ctx, f, i);
  const a = f.action;

  // A fresh/buffered Light after an airborne hit links at recovery, at most
  // twice. Whiffs, grounded attacks and heavy recovery cannot chain for free.
  if(a?.kind==='attack'&&!f.ground&&a.confirmed&&(a.comboDepth??0)<2&&f.buffer?.type==='light'){
    const current=moves[a.move!],next=moves[f.weapon+'_air_combo'];
    if(current.input.button==='light'&&a.tick>=current.startup+current.active&&next){
      const depth=(a.comboDepth??0)+1;
      if(startAttack(ctx,s,f,{...i,light:true,heavy:false},false,next)){
        f.action!.comboDepth=depth;f.vy=Math.max(f.vy,3*Q);f.chase=0;
        event(s,'airCombo',{fighter:f.id,depth});return;
      }
    }
  }

  // Neutral air dodge may cancel into a buffered attack inside the authored window.
  if (a?.kind === 'dodge' && a.airborne && !a.dx && !a.dy && !a.cancelled
    && a.tick >= P.airCancel.firstActionTick && a.tick <= P.airCancel.lastActionTickInclusive) {
    const b = f.buffer;
    if (b && (b.type === 'heavy' || b.type === 'light')) {
      if (startAttack(ctx, s, f, { ...i, x: b.x, y: b.y, heavy: b.type === 'heavy', light: b.type === 'light' }, true)) return;
    }
  }
  // Chase cancel out of a confirmed melee hit's recovery.
  const chaseIn = i.dodge && (i.x || i.y) ? { x: i.x, y: i.y } : f.buffer?.type === 'chase' ? f.buffer : null;
  if (a?.kind === 'attack' && chaseIn && chaseIn.x && f.chase > 0) {
    const m = moves[a.move!];
    if (m.chaseCancelOnConfirmedHit && a.confirmed && a.tick >= m.startup + m.active) {
      beginAction(s, f, 'chase', P.chase.durationTicks, { dx: chaseIn.x * P.chase.speedQ, dy: chaseIn.y * P.chase.speedQ });
      f.chase = 0;
      return;
    }
  }
  if (a && !(a.kind === 'dash' && i.jump)) return;
  if (f.stun || (f.carry && i.light)) return;

  const onOneWay = s.map.platforms.some(pl => pl.id === f.ground && pl.kind === 'oneWay');
  if (i.jump && i.y < 0 && f.ground && onOneWay) {
    f.drop = P.dropThroughTicks; f.y -= Q; f.ground = null; f.buffer = null;
    return;
  }
  if (i.dodge) {
    if (f.chase > 0 && (i.x || i.y)) {
      beginAction(s, f, 'chase', P.chase.durationTicks, { dx: i.x * P.chase.speedQ, dy: i.y * P.chase.speedQ });
      f.chase = 0;
      return;
    }
    if (f.ground && i.x && f.dashCD === 0) {
      f.facing = i.x; f.dashCD = P.dash.repeatLockTicks;
      beginAction(s, f, 'dash', P.dash.durationTicks, { dx: i.x * P.dash.speedQ });
      return;
    }
    if (f.dodgeCD === 0) {
      const air = !f.ground;
      f.dodgeCD = air ? P.dodge.air.cooldown : P.dodge.ground.cooldown;
      beginAction(s, f, 'dodge', dodgeTicks(ctx, air), { airborne: air, dx: air ? i.x * P.dodge.air.speedQ : 0, dy: air ? i.y * P.dodge.air.speedQ : 0 });
      return;
    }
  }
  if (i.item && !f.carry) {
    if (f.weapon === 'unarmed') {
      const it = eligibleItem(ctx, s, f);
      if (it) { it.claim = f.id; beginAction(s, f, 'pickup', R.pickups.acquireTicks, { itemId: it.id }); return; }
    } else {
      const drop = i.y < 0;
      beginAction(s, f, drop ? 'drop' : 'throw', drop ? R.drop.startup + R.drop.release + R.drop.recovery : R.throw.startup + R.throw.release + R.throw.recovery,
        { weapon: f.weapon, dx: i.x, dy: i.y });
      // Throwing ends respawn protection; a harmless drop does not.
      if (!drop) f.invulnerable = 0;
      return;
    }
  }
  const b = f.buffer;
  if (b?.type === 'jump') {
    if (f.wallSide && f.jumps > 0) {
      f.jumps--; f.vx = -f.wallSide * P.wall.jumpAwayQ; f.vy = P.wall.jumpUpQ; f.facing = -f.wallSide;
      jump(s, f, true);
      return;
    }
    if (f.ground || f.coyote > 0 || f.jumps > 0) {
      const fromGround = !!f.ground || f.coyote > 0;
      if (fromGround) f.jumps = P.airJumps; else f.jumps--;
      f.vy = fromGround ? P.groundJumpQ : P.airJumpQ;
      f.vx = clamp(f.vx, -P.dash.dashJumpCapQ, P.dash.dashJumpCapQ);
      jump(s, f);
      return;
    }
  }
  if (b && (b.type === 'heavy' || b.type === 'light')) {
    startAttack(ctx, s, f, { ...i, x: b.x, y: b.y, heavy: b.type === 'heavy', light: b.type === 'light' });
  }
}
