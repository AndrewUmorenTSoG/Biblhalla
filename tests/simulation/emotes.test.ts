import test from 'node:test';
import assert from 'node:assert/strict';
import { S } from '../helpers/engine.ts';

function ready() {
  const s = S.create({ mode: 'training', hero: 'david', opponent: 'saul', trainingBot: 'idle' });
  while (s.phase === 'countdown') S.step(s);
  for (let i = 0; i < 10; i++) S.step(s);
  return { s, p: s.fighters[0] };
}

test('an emote shows while standing still, then times out', () => {
  const { s, p } = ready();
  S.step(s, { [p.id]: { emote: 2 } });
  assert.deepEqual(p.emote && p.emote.id, 2);
  assert.ok(s.events.some(e => e.type === 'emote' && e.emote === 2));
  for (let i = 0; i < 100; i++) S.step(s);
  assert.equal(p.emote, null);
});

test('moving into an attack or jump ends the emote; emotes never start mid-air', () => {
  const { s, p } = ready();
  S.step(s, { [p.id]: { emote: 0 } });
  S.step(s, { [p.id]: { light: true } });
  assert.equal(p.emote, null, 'attacking cancels it');
  for (let i = 0; i < 40; i++) S.step(s);
  S.step(s, { [p.id]: { jump: true, jumpHeld: true } });
  S.step(s, { [p.id]: { emote: 1, jumpHeld: true } });
  assert.equal(p.emote, null);
});

test('emotes survive a replay round trip; out-of-range emotes are rejected', () => {
  const s = S.create({ mode: 'duel', hero: 'david', seed: 9 });
  const p = s.fighters[0];
  const r: any = S.newReplay(s);
  for (let n = 0; n < 240; n++) {
    const frames = { [p.id]: n === 160 ? { emote: 3 } : {} };
    S.step(s, frames); r.entries.push({ kind: 'input', frames });
  }
  assert.ok(s.events !== undefined);
  r.finalHash = S.hash(s);
  assert.ok(S.simulateReplay(JSON.parse(JSON.stringify(r))).verified);
  const bad = JSON.parse(JSON.stringify(r)); bad.entries[160].frames[p.id].emote = 9;
  assert.throws(() => S.simulateReplay(bad));
});
