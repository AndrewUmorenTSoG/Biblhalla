import test from 'node:test';
import assert from 'node:assert/strict';
import { S } from '../helpers/engine.ts';
import { ReplayLibrary, MAX_UNPINNED, REPLAY_LIBRARY_KEY } from '../../apps/game/src/storage/replays.ts';

const memory = () => { const map = new Map<string, string>(); return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), map }; };

test('the library keeps the 20 newest replays plus pinned ones, and survives reload', () => {
  const storage = memory();
  const lib = new ReplayLibrary(storage);
  const first = lib.add({ n: 0 }, 'first');
  lib.pin(first);
  for (let n = 1; n <= 30; n++) lib.add({ n }, `match ${n}`, new Date(1700000000000 + n));
  const list = lib.list();
  assert.equal(list.filter(r => !r.pinned).length, MAX_UNPINNED);
  assert.ok(list.some(r => r.id === first && r.pinned), 'pinned replay kept');
  assert.equal(list[0].label, 'match 30', 'newest first');
  const reloaded = new ReplayLibrary(storage);
  assert.equal(reloaded.list().length, list.length);
  assert.equal(JSON.parse(reloaded.get(first)!).n, 0);
  reloaded.remove(first);
  assert.ok(!new ReplayLibrary(storage).get(first));
  assert.ok(storage.map.has(REPLAY_LIBRARY_KEY));
});

test('replays carry periodic state hashes that locate where a mismatch began', () => {
  const s = S.create({ mode: 'duel', hero: 'david', seed: 21 });
  const r: any = S.newReplay(s);
  let alive = -1; // an input that the player's fighter is actually alive to act on
  for (let n = 0; n < 1300; n++) {
    const frames = { keyboard: { x: n % 200 < 100 ? 1 : -1, light: n % 37 === 0 } };
    S.step(s, frames);
    r.entries.push({ kind: 'input', frames });
    S.maybeCheckpoint(r, s);
    if (n >= 620 && n < 1150 && alive < 0 && s.fighters[0].stocks && !s.fighters[0].respawn && s.fighters[0].ground) alive = n;
  }
  r.finalHash = S.hash(s);
  assert.equal(r.checkpoints.length, 2);
  const ok = S.simulateReplay(JSON.parse(JSON.stringify(r)));
  assert.ok(ok.verified);
  assert.equal(ok.firstMismatch, null);
  const tampered = JSON.parse(JSON.stringify(r));
  assert.ok(alive > 0);
  tampered.entries[alive].frames.keyboard = { x: 0, jump: true };
  const bad = S.simulateReplay(tampered);
  assert.equal(bad.verified, false);
  assert.equal(bad.firstMismatch, alive < 600 ? 600 : 1200, 'the first checkpoint after the change catches it');
});
