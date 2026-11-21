import test from 'node:test';
import assert from 'node:assert/strict';
import { InputHistory } from '../../apps/game/src/training/combo.ts';

test('training history preserves repeated Light presses separated by release ticks', () => {
  const history = new InputHistory();
  history.record(1, { light: true });
  history.record(1, { light: true }); // Re-observing one tick must not duplicate it.
  history.record(2, {});
  history.record(5, { light: true });
  history.record(6, { heavyHeld: true });
  history.record(12, { light: true });
  assert.deepEqual(history.entries, [
    { tick: 1, text: 'Light' }, { tick: 5, text: 'Light' }, { tick: 12, text: 'Light' },
  ]);
});
