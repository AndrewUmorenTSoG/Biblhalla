import test from 'node:test';
import assert from 'node:assert/strict';
import { lazyMap } from '../../apps/game/src/render/lazy-map.ts';

test('art sheets are built only when first read, then reused', () => {
  const built: string[] = [];
  const m = lazyMap({ david: 'a.png', saul: 'b.png', esther: 'c.png' }, uri => { built.push(uri); return { uri }; });
  assert.deepEqual(built, [], 'nothing decodes at boot');
  assert.equal(m.david.uri, 'a.png');
  assert.equal(m.david, m.david, 'the same image object every time');
  assert.deepEqual(built, ['a.png'], 'only the fighter that was drawn');
  assert.deepEqual(Object.keys(m), ['david', 'saul', 'esther'], 'keys stay listed');
  assert.equal((m as any).moses, undefined);
});
