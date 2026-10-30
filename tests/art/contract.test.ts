import test from 'node:test';
import assert from 'node:assert/strict';
import { validateArt } from '../../tools/art/validate-art.ts';

test('shipped fighter art satisfies the integration contract', () => {
  const { errors, coverage } = validateArt();
  assert.deepEqual(errors, []);
  assert.equal(Object.keys(coverage).length, 12);
  for (const c of Object.values(coverage)) assert.equal(c.total, 38);
});
