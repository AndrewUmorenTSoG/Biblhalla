import test from 'node:test';
import assert from 'node:assert/strict';
import { S, Q } from '../helpers/engine.ts';
import { DRILLS, DrillRun } from '../../apps/game/src/training/drills.ts';
import type { InputFrame, SimState } from '../../packages/sim/src/index.ts';

function start(id: string): { s: SimState; run: DrillRun } {
  const s = S.create({ mode: 'training', hero: 'david', opponent: 'saul', trainingBot: 'stand' });
  while (s.phase === 'countdown') S.step(s);
  const drill = DRILLS.find(d => d.id === id)!;
  drill.setup?.(s);
  return { s, run: new DrillRun(drill) };
}
function play(s: SimState, run: DrillRun, frame: (t: number) => InputFrame, ticks = 600): boolean {
  const p = s.fighters[0];
  for (let t = 0; t < ticks; t++) {
    S.step(s, { [p.id]: frame(t) });
    if (run.observe(s, S.P.fastFallCapQ, S.P.fallCapQ)) return true;
  }
  return false;
}

test('fast fall completes only when holding Down while falling', () => {
  const a = start('fastfall');
  assert.equal(play(a.s, a.run, t => ({ jump: t === 4, jumpHeld: t < 20 }), 200), false, 'plain falling does not count');
  const b = start('fastfall');
  assert.equal(play(b.s, b.run, t => ({ jump: t === 4, jumpHeld: t < 20, y: t > 40 ? -1 : 0 }), 200), true);
});

test('gravity cancel needs a neutral air dodge, and says so when directional', () => {
  const a = start('gravity');
  play(a.s, a.run, t => ({ jump: t === 2, jumpHeld: t < 12, dodge: t === 12, x: t === 12 ? 1 : 0, light: t === 17 }), 40);
  assert.equal(a.run.done, false);
  assert.match(a.run.note, /directional dodge/);
  const b = start('gravity');
  assert.equal(play(b.s, b.run, t => ({ jump: t === 2, jumpHeld: t < 12, dodge: t === 12, light: t === 17 }), 60), true);
});

test('dash jump completes from a dash; chase needs a confirmed hit first', () => {
  const a = start('dashjump');
  assert.equal(play(a.s, a.run, t => ({ x: 1, dodge: t === 10, jump: t === 13, jumpHeld: t < 25 }), 60), true);
  const b = start('chase');
  const [p, d] = b.s.fighters;
  p.weapon = 'sword'; p.x = d.x - 50 * Q; p.facing = 1;
  assert.equal(play(b.s, b.run, t => ({ light: t === 1, ...(p.action?.kind === 'attack' && p.chase > 0 ? { dodge: true, x: 1 } : {}) }), 120), true);
});

test('every advanced drill has a title and a visible goal', () => {
  assert.ok(DRILLS.length >= 6);
  for (const d of DRILLS) assert.ok(d.title && d.goal.length > 20);
});
