import test from 'node:test';
import assert from 'node:assert/strict';
import { ARRANGEMENTS, bar, degreeHz, LOOP_BARS } from '../../apps/game/src/audio/music.ts';
import { content as C } from '../helpers/engine.ts';

test('one original arrangement per arena, each with its own tempo, key or colour', () => {
  assert.equal(ARRANGEMENTS.length, C.maps.maps.length);
  const looks = new Set(ARRANGEMENTS.map(a => `${a.bpm}|${a.root}|${a.lead}|${a.mode.join()}`));
  assert.equal(looks.size, ARRANGEMENTS.length);
  for (const a of ARRANGEMENTS) assert.ok(a.bpm >= 90 && a.bpm <= 130, 'energetic, not frantic');
});

test('loops repeat exactly, so the seam is clean, and are never random', () => {
  for (const a of ARRANGEMENTS) for (let b = 0; b < LOOP_BARS; b++) {
    assert.deepEqual(bar(a, b), bar(a, b + LOOP_BARS));
    assert.deepEqual(bar(a, b), bar(a, b));
    for (const n of bar(a, b)) assert.ok(n.beat >= 0 && n.beat + n.beats <= 4.5 && n.gain > 0 && n.gain < 0.2);
  }
});

test('the six arenas share one motif: the same melodic contour in their own key', () => {
  const contour = (a: typeof ARRANGEMENTS[0]) => bar(a, 2).filter(n => n.voice === 'lead').map(n => Math.round(12 * Math.log2(n.freq / degreeHz(a, 0, 1))));
  const shapes = ARRANGEMENTS.map(a => contour(a).map((v, i, xs) => Math.sign(v - (xs[i - 1] ?? v))).join());
  assert.equal(new Set(shapes).size, 1);
});
