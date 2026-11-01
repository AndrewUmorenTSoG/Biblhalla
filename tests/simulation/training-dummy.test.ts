import test from 'node:test';
import assert from 'node:assert/strict';
import { S, Q } from '../helpers/engine.ts';
import type { SimState } from '../../packages/sim/src/index.ts';

function training(bot: string): SimState {
  const s = S.create({ mode: 'training', hero: 'david', opponent: 'saul', trainingBot: bot });
  while (s.phase === 'countdown') S.step(s);
  return s;
}

test('stand never moves; jump hops on a fixed rhythm; approach closes distance', () => {
  const stand = training('stand');
  const x = stand.fighters[1].x;
  for (let t = 0; t < 200; t++) S.step(stand);
  assert.equal(stand.fighters[1].x, x);

  const jump = training('jump');
  let jumps = 0;
  for (let t = 0; t < 300; t++) { S.step(jump); jumps += jump.events.filter(e => e.type === 'jump' && e.fighter === jump.fighters[1].id).length; }
  assert.ok(jumps >= 3);

  const approach = training('approach');
  const [p, d] = approach.fighters;
  const gap = Math.abs(d.x - p.x);
  for (let t = 0; t < 200; t++) S.step(approach);
  assert.ok(Math.abs(d.x - p.x) < gap);
});

test('attack preset attacks when close; dodge preset dodges right after hitstun', () => {
  const atk = training('attack');
  const [p, d] = atk.fighters;
  p.x = d.x - 60 * Q;
  let attacks = 0;
  for (let t = 0; t < 200; t++) { p.x = d.x - 60 * Q; S.step(atk); attacks += atk.events.filter(e => e.type === 'attack' && e.fighter === d.id).length; }
  assert.ok(attacks >= 2);

  const dg = training('dodge');
  const dd = dg.fighters[1];
  dd.stun = 5;
  let dodged = -1;
  for (let t = 0; t < 20 && dodged < 0; t++) { S.step(dg); if (dd.action?.kind === 'dodge' || dd.action?.kind === 'dash') dodged = t; }
  assert.ok(dodged >= 4 && dodged <= 7, `dodged ${dodged} ticks in`);
});

test('every preset recovers to the stage when knocked off', () => {
  for (const bot of ['stand', 'jump', 'approach', 'attack', 'dodge', 'recover']) {
    const s = training(bot);
    const d = s.fighters[1];
    const [mx, , mw] = s.map.main.rectUnits;
    d.x = (mx + mw + 80) * Q; d.y = 120 * Q; d.vy = 0; d.ground = null;
    const stocks = d.stocks;
    for (let t = 0; t < 400; t++) S.step(s);
    assert.equal(d.stocks, stocks, `${bot} recovered`);
  }
});
