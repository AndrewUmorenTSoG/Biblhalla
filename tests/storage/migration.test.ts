import test from 'node:test';
import assert from 'node:assert/strict';
import { content } from '../helpers/engine.ts';
import { createProfiles, PROFILE_SCHEMA, SAVE_KEY } from '../../apps/game/src/storage/profile.ts';

const P = createProfiles(content);
const memory = (seed: Record<string, string> = {}) => {
  const map = new Map(Object.entries(seed));
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), map };
};

test('a schema 1 save migrates forward with its progress and seen cards', () => {
  const v1 = { schema: 1, completed: ['L001', 'L002'], medals: { L001: 'hard' }, journal: ['L001'],
    checkpoint: { level: 'L003', stage: 'middle_or_phase_two', seed: 7, progress: [0], combatCleared: true, seen: ['L003:0'] },
    settings: { difficulty: 'hard' }, controlChecked: true };
  const storage = memory({ [SAVE_KEY]: JSON.stringify(v1) });
  const store = new P.Store(storage);
  assert.equal(store.data.schema, PROFILE_SCHEMA);
  assert.deepEqual(store.data.completed, ['L001', 'L002']);
  assert.deepEqual(store.data.seenCards, ['L003:0']);
  assert.equal(store.data.settings.difficulty, 'hard');
  store.save();
  assert.equal(JSON.parse(storage.map.get(SAVE_KEY)!).schema, PROFILE_SCHEMA);
});

test('a save from a newer version is refused clearly instead of being damaged', () => {
  assert.throws(() => P.validate({ schema: PROFILE_SCHEMA + 1, completed: [] }), /newer version/);
});

test('checkpoints add their seen cards to the profile once', () => {
  const store = new P.Store(memory());
  store.checkpoint('L003', 'middle_or_phase_two', [0], false, 1, ['L003:0', 'L003:1']);
  store.checkpoint('L003', 'middle_or_phase_two', [0, 1], false, 1, ['L003:1', 'L003:2']);
  assert.deepEqual(store.data.seenCards, ['L003:0', 'L003:1', 'L003:2']);
});

test('a corrupted primary record fails its checksum and the backup is used', async () => {
  const { seal } = await import('../../apps/game/src/storage/profile.ts');
  const storage = memory();
  const store = new P.Store(storage);
  store.complete('L001', 'easy');
  store.complete('L002', 'easy');
  const good = storage.map.get(SAVE_KEY)!;
  assert.ok(JSON.parse(good).checksum, 'saves carry a checksum');
  // Flip a value without updating the checksum, as a disk error might.
  storage.map.set(SAVE_KEY, good.replace('"L002"', '"L003"'));
  const reloaded = new P.Store(storage);
  assert.equal(reloaded.status, 'Recovered previous valid save');
  assert.deepEqual(reloaded.data.completed, ['L001']);
  assert.equal(JSON.parse(seal({ a: 1 })).a, 1);
});

test('deleting progress keeps settings and leaves the old record as backup', () => {
  const storage = memory();
  const store = new P.Store(storage);
  store.data.settings.mute = true;
  store.complete('L001', 'hard');
  store.resetProgress();
  assert.deepEqual(store.data.completed, []);
  assert.equal(store.data.settings.mute, true);
  assert.ok(storage.map.get(SAVE_KEY + '-backup')!.includes('L001'));
});
