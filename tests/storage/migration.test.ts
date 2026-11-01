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
