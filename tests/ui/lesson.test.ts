import test from 'node:test';
import assert from 'node:assert/strict';
import { S, Q } from '../helpers/engine.ts';
import { Lesson } from '../../apps/game/src/training/lesson.ts';
import type { InputFrame } from '../../packages/sim/src/index.ts';

function setup() {
  const s = S.create({ mode: 'training', hero: 'david', opponent: 'saul', trainingBot: 'stand' });
  while (s.phase === 'countdown') S.step(s);
  return { s, lesson: new Lesson() };
}

test('button presses alone do not complete lesson steps', () => {
  const { s, lesson } = setup();
  const p = s.fighters[0];
  // Attack the air far from the dummy: no hit, so the attack step must not pass.
  for (let t = 0; t < 400; t++) {
    const frame: InputFrame = lesson.step === 'move' ? { x: t < 60 ? 1 : -1 } : lesson.step === 'jump' ? { jump: t % 30 === 0, jumpHeld: true } : { light: t % 40 === 0 };
    S.step(s, { [p.id]: frame });
    lesson.observe(s);
    if (lesson.step === 'attack') { p.x = -400 * Q; }
  }
  assert.equal(lesson.step, 'attack', 'whiffs never count as hits');
});

test('the seven-step lesson completes through real outcomes', () => {
  const { s, lesson } = setup();
  const [p, d] = s.fighters;
  const [mx, my, mw, mh] = s.map.main.rectUnits;
  const seen: string[] = [];
  let t = 0;
  const run = (frame: (t: number) => InputFrame, until: () => boolean, max = 900) => {
    for (let k = 0; k < max && !until(); k++, t++) { S.step(s, { [p.id]: frame(t) }); if (lesson.observe(s)) seen.push(lesson.step); }
  };
  const start = p.x;
  run(k => ({ x: p.x - start < 160 * Q && lesson.step === 'move' && k < 400 ? 1 : -1 }), () => lesson.step !== 'move');
  run(k => ({ jump: k % 25 === 0, jumpHeld: true }), () => lesson.step !== 'jump');
  p.weapon = 'sword';
  const nearDummy = () => { p.x = d.x - 50 * Q; p.y = d.y; p.facing = 1; p.stun = 0; d.stun = 0; d.vx = d.kx = 0; };
  run(k => { if (k % 40 === 0) nearDummy(); return { light: k % 40 === 1 }; }, () => lesson.step !== 'attack');
  run(k => { if (k % 40 === 0) nearDummy(); return { light: k % 40 === 1, x: k % 80 < 40 ? 1 : 0, y: k % 80 < 40 ? 0 : -1 }; }, () => lesson.step !== 'directional');
  run(k => { if (k % 50 === 0) nearDummy(); return { dodge: d.action?.kind === 'attack' }; }, () => lesson.step !== 'dodge');
  // Step off the right edge, then recover.
  p.x = (mx + mw + 30) * Q; p.y = (my + mh + 40) * Q; p.ground = null; p.vy = 0; p.jumps = 2; p.recovery = 1;
  run(k => ({ x: -1, jump: k % 18 === 0, jumpHeld: true }), () => lesson.step !== 'return', 600);
  run(k => { if (k % 45 === 0) { nearDummy(); d.damage = Math.max(d.damage, 1500); } return { heavy: k % 45 === 1, x: 1 }; }, () => lesson.step !== 'finish', 2000);
  assert.deepEqual(seen, ['jump', 'attack', 'directional', 'dodge', 'return', 'finish', 'done']);
  assert.equal(lesson.progress, '7 / 7');
});
