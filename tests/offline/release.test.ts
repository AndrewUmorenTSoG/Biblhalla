import test from 'node:test';
import assert from 'node:assert/strict';
import { knownLimits } from '../../tools/release.ts';

test('release limits always state it is not shipping-ready and flag unapproved art', () => {
  const pending = knownLimits({ david: 'concept_cut', saul: 'runtime_alpha' });
  assert.ok(pending.some(l => /not shipping-ready/.test(l)));
  assert.ok(pending.some(l => /1 fighters at concept_cut/.test(l)));
  assert.ok(!knownLimits({ david: 'runtime_alpha' }).some(l => /concept_cut/.test(l)));
});
