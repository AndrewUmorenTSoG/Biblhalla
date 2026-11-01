import test from 'node:test';
import assert from 'node:assert/strict';
import { S, Q } from '../helpers/engine.ts';
import { ARCHETYPES } from '../../packages/sim/src/ai.ts';
import type { SimState } from '../../packages/sim/src/index.ts';

function waveWith(role: string): SimState {
  const s = S.create({ mode: 'waves', hero: 'david', difficulty: 'hard', waves: [[role]], seed: 3 });
  while (s.phase === 'countdown') S.step(s);
  for (let t = 0; t < 400 && !s.fighters.some(f => !f.human); t++) S.step(s);
  return s;
}

for (const role of Object.keys(ARCHETYPES)) {
  test(`${role} winds up for its catalog tell before every attack`, () => {
    const s = waveWith(role);
    const enemy = s.fighters.find(f => !f.human)!;
    assert.equal(enemy.role, role);
    const player = s.fighters[0];
    let tellAt = -1, tellTicks = 0, attackedAt = -1;
    for (let t = 0; t < 1500 && attackedAt < 0; t++) {
      player.x = enemy.x + 60 * Q * enemy.facing; player.y = enemy.y; player.vx = 0; player.damage = 0;
      S.step(s, { keyboard: {} });
      for (const e of s.events) {
        if (e.type === 'enemyTell' && e.fighter === enemy.id && tellAt < 0) { tellAt = s.tick; tellTicks = e.ticks as number; }
        if (e.type === 'attack' && e.fighter === enemy.id && tellAt >= 0) attackedAt = s.tick;
      }
    }
    assert.ok(tellAt > 0, 'a tell was shown');
    assert.ok(attackedAt - tellAt >= tellTicks, `attack came ${attackedAt - tellAt} ticks after a ${tellTicks}-tick tell`);
    const a = ARCHETYPES[role];
    assert.ok(tellTicks === a.lightTell || tellTicks === a.heavyTell);
  });
}

test('shield guards halve frontal hits only while idle and facing them', () => {
  const s = waveWith('shield_guard');
  const guard = s.fighters.find(f => f.role === 'shield_guard')!;
  const p = s.fighters[0];
  const hitFrom = (facingAttacker: boolean) => {
    guard.ai.next = 1e9; guard.ai.intent = S.input(); guard.ai.tell = 0; guard.action = null; guard.stun = 0; guard.hitstop = 0;
    guard.damage = 0; guard.invulnerable = 0; guard.x = 0; guard.y = 80 * Q; guard.vx = guard.kx = 0;
    guard.facing = facingAttacker ? 1 : -1;
    p.x = 50 * Q; p.y = 80 * Q; p.facing = -1; p.weapon = 'sword'; p.action = null; p.stun = 0; p.hitstop = 0; p.invulnerable = 0;
    S.step(s, { keyboard: { light: true } });
    for (let t = 0; t < 30 && !guard.damage; t++) S.step(s, { keyboard: {} });
    return guard.damage;
  };
  const front = hitFrom(true), back = hitFrom(false);
  assert.ok(front > 0 && back > 0, `front ${front}, back ${back}`);
  assert.equal(front, Math.floor(back / 2), 'frontal hit halved; the back is never covered');
});
