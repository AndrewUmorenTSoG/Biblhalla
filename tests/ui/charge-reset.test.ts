import test from 'node:test';
import assert from 'node:assert/strict';
import { Inputs, applyChargeToggle } from '../../apps/game/src/input/inputs.ts';

test('clearing inputs releases every toggled charge and the next Heavy starts a fresh hold', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { querySelectorAll: () => [], querySelector: () => null },
  });
  try {
    const input = Object.assign(Object.create(Inputs.prototype) as Inputs, {
      held: new Set<string>(), edges: new Set<string>(), touchEdges: new Set<string>(),
      chargeLatch: new Set<string>(),
    });
    const devices = ['keyboard', 'touch', 'pad:0', 'pad:1'];
    for (const id of devices)
      assert.equal(applyChargeToggle({ heavy: true }, input.chargeLatch, id).heavyHeld, true);
    // Pause, focus loss and menu transitions all use this same clear boundary.
    input.clear();
    for (const id of devices) {
      assert.equal(applyChargeToggle({}, input.chargeLatch, id).heavyHeld, false, id);
      const fresh = applyChargeToggle({ heavy: true }, input.chargeLatch, id);
      assert.equal(fresh.heavy, true, id);
      assert.equal(fresh.heavyHeld, true, id);
    }
    input.clear();
    input.clear();
    assert.equal(input.chargeLatch.size, 0);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'document', descriptor);
    else Reflect.deleteProperty(globalThis, 'document');
  }
});
