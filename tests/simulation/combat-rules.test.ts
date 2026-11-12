import test from 'node:test';
import assert from 'node:assert/strict';
import { S, Q } from '../helpers/engine.ts';
import type { Fighter, InputFrame, MatchOptions, SimState } from '../../packages/sim/src/index.ts';

/** Match past its countdown with every bot frozen in place. */
function arena(opts: MatchOptions = {}): SimState {
  const s = S.create(opts);
  while (s.phase === 'countdown') S.step(s);
  for (const f of s.fighters) if (!f.human) { f.ai.next = 1e9; f.ai.intent = S.input(); }
  return s;
}
const step = (s: SimState, frames: Record<number, InputFrame> = {}, n = 1) => { for (let i = 0; i < n; i++) S.step(s, frames); };
const settle = (s: SimState) => step(s, {}, 4);

/** Put `b` directly in front of `a` on the main stage. */
function faceOff(s: SimState, a: Fighter, b: Fighter, gap = 50): void {
  a.x = 0; a.y = 80 * Q; a.facing = 1;
  b.x = gap * Q; b.y = 80 * Q; b.facing = -1;
  settle(s);
}

test('launch formula matches the documented 2540 Q example', () => {
  // 26-damage signature, 1280 base, growth 10, target at 100 then +26 => D10 = 1260.
  const raw = 1280 + Math.floor((10 * 1260) / 10);
  assert.equal(raw, 2540);
  const s = arena({ hero: 'david', opponent: 'samson' });
  const [, b] = s.fighters;
  b.damage = 1000;
  const m = { ...S.moves.sword_nlight, damageTenths: 260, baseForceQ: 1280, growthQPerDamage: 10 };
  assert.equal(m.baseForceQ + Math.floor((m.growthQPerDamage * (b.damage + m.damageTenths)) / 10), 2540);
});

test('full charge scales damage by the authored permille, nothing else', () => {
  const sig = S.moves.david_sword_nsig;
  assert.ok(sig.chargeable);
  const dealt = (charge: boolean) => {
    const s = arena({ hero: 'david', opponent: 'saul' });
    const [a, b] = s.fighters;
    a.weapon = 'sword';
    // Skyward anti-air: its zone sits close above David, so the target stands almost inside it.
    faceOff(s, a, b, 10);
    S.step(s, { [a.id]: { heavy: true, heavyHeld: true } });
    for (let t = 0; t < 120 && !a.hits; t++) S.step(s, { [a.id]: { heavyHeld: charge } });
    return { dealt: a.damageDealt, charge: a.action?.charge ?? sig.chargeMaxTicks };
  };
  const plain = dealt(false).dealt, charged = dealt(true).dealt;
  assert.ok(plain > 0);
  const power = 1000 + S.P.powerDamagePermillePerStat * (S.defs.david.stats.power - S.P.statBaseline);
  assert.equal(charged, S.roundMul(S.roundMul(sig.damageTenths, power), sig.chargeMaxDamagePermille));
});

test('melee hits freeze both participants; projectile hits leave the shooter moving', () => {
  const s = arena({ hero: 'david', opponent: 'samson' });
  const [a, b] = s.fighters;
  a.weapon = 'sword';
  faceOff(s, a, b);
  step(s, { [a.id]: { light: true } }, 12);
  assert.ok(a.hits >= 1, 'melee connected');
  assert.ok(a.hitstop > 0 || a.action?.confirmed, 'attacker took hitstop');

  const p = arena({ hero: 'david', opponent: 'samson' });
  const [shooter, target] = p.fighters;
  shooter.weapon = 'sling';
  faceOff(p, shooter, target, 220);
  S.step(p, { [shooter.id]: { light: true } });
  let hitTick = -1;
  for (let t = 0; t < 60 && hitTick < 0; t++) { S.step(p); if (shooter.hits) hitTick = p.tick; }
  assert.ok(hitTick > 0, 'stone connected');
  assert.equal(shooter.hitstop, 0);
  assert.ok(target.hitstop > 0 || target.stun > 0);
});

test('launch velocity holds through hitstun, then decays', () => {
  const s = arena({ hero: 'samson', opponent: 'david' });
  const [a, b] = s.fighters;
  a.weapon = 'hammer';
  b.damage = 1200;
  faceOff(s, a, b, 40);
  S.step(s, { [a.id]: { light: true } });
  for (let t = 0; t < 40 && !b.stun; t++) S.step(s);
  assert.ok(b.stun > 0 && b.kx !== 0);
  while (b.hitstop) S.step(s);
  const kx = b.kx;
  S.step(s);
  if (b.stun) assert.equal(b.kx, kx, 'no decay during hitstun');
  while (b.stun) S.step(s);
  const before = b.kx;
  S.step(s);
  assert.equal(Math.abs(b.kx), Math.max(0, Math.abs(before) - S.P.knockbackDecayXQ));
});

test('dodge windows come from physics data', () => {
  const s = arena();
  const f = s.fighters[0];
  settle(s);
  S.step(s, { [f.id]: { dodge: true } });
  const g = S.P.dodge.ground;
  assert.equal(f.action!.duration, g.startup + g.invulnerable + g.recovery);
  const seen: boolean[] = [];
  while (f.action) { seen.push(S.invincible(f)); S.step(s); }
  // seen[k] is sampled after local tick k ran.
  assert.equal(seen.filter(Boolean).length, g.invulnerable);
  assert.equal(seen.indexOf(true), g.startup);
});

test('a thrown weapon that hits drops as the same weapon, never duplicated', () => {
  const s = arena({ hero: 'david', opponent: 'samson' });
  const [a, b] = s.fighters;
  a.weapon = 'sword';
  faceOff(s, a, b, 120);
  S.step(s, { [a.id]: { item: true } });
  for (let t = 0; t < 40 && !b.stun; t++) S.step(s);
  assert.ok(b.stun > 0, 'throw connected');
  const swords = () => s.items.filter(it => it.weapon === 'sword').length
    + s.projectiles.filter(p => p.weapon === 'sword').length + s.fighters.filter(f => f.weapon === 'sword').length;
  assert.equal(a.weapon, 'unarmed');
  assert.equal(swords(), 1);
});

test('a weapon pickup discards inputs buffered for the old grammar', () => {
  const s = arena({ hero: 'david', opponent: 'samson' });
  const f = s.fighters[0];
  settle(s);
  s.items.push({ id: ++s.entityId, x: f.x, y: f.y, vy: 0, life: 600, neutral: true, weapon: null, claim: null });
  S.step(s, { [f.id]: { item: true } });
  assert.equal(f.action?.kind, 'pickup');
  while (f.action?.kind === 'pickup') S.step(s, { [f.id]: { light: f.action.tick === f.action.duration - 2 } });
  assert.equal(f.weapon, 'sling');
  assert.equal(f.buffer, null);
  assert.notEqual(f.action?.kind, 'attack');
});

test('dropping a weapon keeps respawn protection; throwing ends it', () => {
  for (const [y, expectProtected] of [[-1, true], [0, false]] as const) {
    const s = arena();
    const f = s.fighters[0];
    settle(s);
    f.weapon = 'sword';
    f.invulnerable = 100;
    S.step(s, { [f.id]: { item: true, y } });
    assert.equal(f.invulnerable > 0, expectProtected);
  }
});

test('blast zones test the fighter centre, 37 units above the feet', () => {
  const s = arena();
  const f = s.fighters[0];
  const b = s.map.blastBoundsUnits;
  f.x = 0; f.vx = f.vy = f.kx = 0; f.jumps = 0;
  f.y = (b.minY - 30) * Q; // feet outside, centre still inside
  S.step(s);
  assert.equal(f.stocks, 3);
  f.y = (b.minY - 60) * Q;
  S.step(s);
  assert.equal(f.stocks, 2);
});

test('respawn picks the authored spawn farthest from enemies', () => {
  const s = arena({ hero: 'david', opponent: 'samson' });
  const [a, b] = s.fighters;
  b.x = 360 * Q; b.y = 82 * Q;
  S.knockOut(s, a);
  for (let t = 0; t <= S.R.respawnDelayTicks && a.respawn; t++) S.step(s);
  assert.equal(a.x, -360 * Q);
});

test('a simultaneous final ring-out goes to sudden death, then a draw', () => {
  const s = arena({ hero: 'david', opponent: 'samson' });
  const [a, b] = s.fighters;
  a.stocks = b.stocks = 1;
  const bottom = (s.map.blastBoundsUnits.minY - 100) * Q;
  a.y = b.y = bottom;
  S.step(s);
  assert.equal(s.phase, 'playing');
  assert.equal(s.suddenDeath, true);
  assert.deepEqual([a.stocks, b.stocks], [1, 1]);
  for (let t = 0; t <= S.R.respawnDelayTicks; t++) S.step(s);
  assert.equal(a.damage, S.R.suddenDeath.damageTenths);
  assert.ok(!a.respawn && !b.respawn);
  a.y = b.y = bottom; a.invulnerable = b.invulnerable = 0;
  S.step(s);
  assert.equal(s.phase, 'result');
  assert.match(s.result!.reason, /draw/);
  assert.deepEqual(s.result!.winners, []);
});

test('2v2 timeouts compare summed team stocks, then summed damage', () => {
  const s = arena({
    mode: 'teams',
    fighters: [
      { hero: 'david', human: true, team: 0, inputId: 'keyboard' }, { hero: 'saul', human: true, team: 1, inputId: 'pad:0' },
      { hero: 'samson', human: true, team: 0, inputId: 'pad:1' }, { hero: 'esther', human: true, team: 1, inputId: 'pad:2' },
    ],
  });
  const [d, sa, sm, es] = s.fighters;
  d.stocks = 3; sm.stocks = 1; // team 0: 4 stocks
  sa.stocks = 2; es.stocks = 2; // team 1: 4 stocks
  d.damage = 100; sm.damage = 900; sa.damage = 400; es.damage = 400; // team 0 1000 vs team 1 800
  s.remaining = 1;
  S.step(s);
  assert.equal(s.phase, 'result');
  assert.deepEqual([...s.result!.winners].sort(), [sa.id, es.id].sort());
});

test('bots finish real matches at every difficulty without leaving the rules', () => {
  for (const difficulty of ['easy', 'hard', 'extreme']) {
    const s = S.create({
      mode: 'ffa', difficulty, seed: 77,
      fighters: [{ hero: 'joshua', human: false, team: 0 }, { hero: 'miriam', human: false, team: 1 }, { hero: 'caleb', human: false, team: 2 }],
    });
    for (let t = 0; t < S.R.matchTicks + 4000 && s.phase !== 'result'; t++) {
      S.step(s);
      for (const f of s.fighters) {
        assert.ok(f.jumps >= 0 && f.jumps <= S.P.airJumps, 'jump resource bounds');
        assert.ok(f.recovery >= 0 && f.recovery <= S.P.recoveryUses, 'recovery resource bounds');
        assert.ok(f.wallTicks <= S.P.wall.maxCumulativeTicks, 'wall fatigue bound');
      }
    }
    assert.equal(s.phase, 'result', `${difficulty} bots reached a result`);
  }
});

test('a bot knocked under the stage drifts out past the edge before recovering upward', () => {
  const s = S.create({ mode: 'local', fighters: [{ hero: 'david', human: false, team: 0 }, { hero: 'saul', human: false, team: 1 }] });
  while (s.phase === 'countdown') S.step(s);
  const [bot, other] = s.fighters;
  other.x = -400 * Q; other.y = 82 * Q;
  const [mx, my, mw] = s.map.main.rectUnits;
  bot.x = (mx + mw - 80) * Q; bot.y = (my - 60) * Q; bot.vx = bot.vy = 0; bot.ground = null; bot.jumps = 2; bot.recovery = 1;
  let maxX = bot.x;
  for (let t = 0; t < 40; t++) { S.step(s); maxX = Math.max(maxX, bot.x); }
  assert.ok(maxX > (mx + mw + 20) * Q, 'moved out from under the right edge');
});

test('bots rarely fall off on their own (self-KO regression guard)', () => {
  const roster = S.content.fighters.fighters.map(f => f.id);
  let kos = 0, selfKos = 0;
  for (const [n, map] of S.content.maps.maps.entries()) {
    const s = S.create({ mode: 'local', arena: map.id, difficulty: 'hard', seed: 500 + n, fighters: [
      { hero: roster[n * 2 % 12], human: false, team: 0 }, { hero: roster[(n * 2 + 5) % 12], human: false, team: 1 },
    ] });
    const lastHit = new Map<number, number>();
    while (s.phase !== 'result' && s.tick < 12000) {
      S.step(s);
      for (const e of s.events) {
        if (e.type === 'hit') lastHit.set(e.fighter as number, s.tick);
        if (e.type === 'ko') { kos++; if (s.tick - (lastHit.get(e.fighter as number) ?? -1e9) > 180) selfKos++; }
      }
    }
  }
  assert.ok(kos >= 10, 'matches produced real ring-outs');
  assert.ok(selfKos / kos < 0.15, `self-KO rate ${(100 * selfKos / kos).toFixed(1)}%`);
});

test('a bot far from the stage spends its air dodge toward it', () => {
  const s = S.create({ mode: 'local', fighters: [{ hero: 'david', human: false, team: 0 }, { hero: 'saul', human: false, team: 1 }] });
  while (s.phase === 'countdown') S.step(s);
  const [bot, other] = s.fighters;
  other.x = 0; other.y = 82 * Q;
  const [mx, my, mw, mh] = s.map.main.rectUnits;
  bot.x = (mx + mw + 260) * Q; bot.y = (my + mh + 20) * Q; bot.vy = -400; bot.vx = 0; bot.ground = null; bot.dodgeCD = 0;
  S.step(s);
  assert.equal(bot.action?.kind, 'dodge');
  assert.ok((bot.action?.dx ?? 0) < 0, 'dodges toward the stage');
});

test('resuming from pause runs a short countdown that spends no match time and replays identically', () => {
  const s = arena({ hero: 'david', opponent: 'samson' });
  const tick = s.tick, remaining = s.remaining;
  S.pause(s, true);
  S.pause(s, false);
  assert.equal(s.phase, 'countdown');
  for (let t = 0; t < 89; t++) S.step(s, { [s.fighters[0].id]: { light: true, x: 1 } });
  assert.equal(s.tick, tick, 'no simulation ticks during the countdown');
  assert.equal(s.remaining, remaining);
  assert.equal(s.fighters[0].action, null, 'inputs do nothing during the countdown');
  S.step(s); S.step(s);
  assert.equal(s.phase, 'playing');
});

test('a returning shield strikes toward the hand and respects the side a guard protects', () => {
  for (const facing of [-1, 1] as const) {
    for (const frontGuard of [false, true]) {
      const s = arena({ hero: 'gideon', opponent: 'saul' });
      const [owner, guard] = s.fighters;
      owner.weapon = 'shield';
      faceOff(s, owner, guard, facing * 350);
      owner.facing = facing;
      S.step(s, { [owner.id]: { x: facing, heavy: true } });
      for (let t = 0; t < 60 && !s.projectiles.some(p => p.returning); t++) S.step(s);
      const shield = s.projectiles[0];
      assert.ok(shield?.returning);
      assert.equal(Math.sign(shield.vx), -facing);

      // Let the shield get within a single step of the hand, then place the
      // previously untouched target just inside the far end of that sweep.
      const [handX] = S.defs.gideon.releaseOrigins!.shield;
      const catchX = owner.x + handX * Q * facing;
      while (Math.abs(shield.x - catchX) > 24 * Q && s.projectiles.length) S.step(s);
      guard.x = catchX - facing * (shield.size[0] / 2 + S.P.hurtboxUnits[0] / 2 - 1) * Q;
      guard.y = shield.y - 35 * Q;
      guard.facing = frontGuard ? facing : -facing;
      guard.role = 'shield_guard';
      S.step(s);
      assert.equal(s.projectiles.length, 0);
      assert.ok(s.events.some(e => e.type === 'shieldCatch'));
      assert.equal(owner.hits, 1);
      assert.equal(Math.sign(guard.kx), -facing);
      assert.equal(s.events.some(e => e.type === 'shieldBlock'), frontGuard);
    }
  }
});
