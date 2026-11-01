import test from 'node:test';
import assert from 'node:assert/strict';
import { content as C } from '../helpers/engine.ts';
import { createProfiles } from '../../apps/game/src/storage/profile.ts';
import { missingControllers } from '../../apps/game/src/input/inputs.ts';

const B: any = createProfiles(C);

test('a controller bound to a human fighter going missing is reported; keyboard, touch and CPUs are not', () => {
  const fighters = [
    { human: true, inputId: 'pad:0' }, { human: true, inputId: 'pad:2' },
    { human: true, inputId: 'keyboard' }, { human: true, inputId: 'touch' }, { human: false, inputId: 'pad:5' },
  ];
  assert.deepEqual(missingControllers(fighters, [0, 2]), []);
  assert.deepEqual(missingControllers(fighters, [0]), [2]);
  assert.deepEqual(missingControllers(fighters, []), [0, 2]);
  assert.deepEqual(missingControllers([{ human: true, inputId: 'unavailable' }], []), []);
});

/** Storage that fails the write after `okWrites` successful ones, like a tab closed mid-save. */
function interrupted(okWrites: number) {
  const map = new Map<string, string>();
  let writes = 0;
  return { map, arm(n: number) { okWrites = n; writes = 0; },
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { if (writes++ >= okWrites) throw new Error('interrupted'); map.set(k, v); } };
}

test('a save interrupted after the backup write keeps the last good progress', () => {
  const s = interrupted(Infinity);
  const store = new B.Store(s);
  store.complete('L001', 'easy');
  s.arm(1); // the backup copy lands, the new primary does not
  store.complete('L002', 'easy');
  assert.equal(store.durable, false);
  assert.match(store.status, /export/i);
  const reopened = new B.Store(s);
  assert.ok(reopened.data.completed.includes('L001'));
  assert.ok(!reopened.data.completed.includes('L002'));
});

test('a primary record cut off mid-write falls back to the backup', () => {
  const s = interrupted(Infinity);
  const store = new B.Store(s);
  store.complete('L001', 'easy');
  store.complete('L002', 'easy');
  const [key, value] = [...s.map].find(([, v]) => v.includes('L002'))!;
  s.map.set(key, value.slice(0, Math.floor(value.length / 2)));
  const reopened = new B.Store(s);
  assert.equal(reopened.status, 'Recovered previous valid save');
  assert.ok(reopened.data.completed.includes('L001'));
});

test('a store that becomes full later keeps playing in memory and still exports', () => {
  const s = interrupted(Infinity);
  const store = new B.Store(s);
  store.complete('L001', 'easy');
  s.arm(0);
  store.complete('L002', 'easy');
  assert.equal(store.durable, false);
  assert.ok(JSON.parse(store.export()).completed.includes('L002'));
  s.arm(Infinity);
  store.complete('L003', 'easy');
  assert.equal(store.durable, true, 'saving resumes once space returns');
});
