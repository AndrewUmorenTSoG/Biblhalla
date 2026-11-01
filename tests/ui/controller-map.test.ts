import test from 'node:test';
import assert from 'node:assert/strict';
import { padFrame } from '../../apps/game/src/input/inputs.ts';

const buttons = (...on: number[]) => Array.from({ length: 17 }, (_, i) => on.includes(i));

test('standard controller mapping follows the input spec', () => {
  const f = padFrame(buttons(0, 2), [0, 0], buttons(), 0.22);
  assert.equal(f.jump, true);
  assert.equal(f.light, true);
  assert.equal(padFrame(buttons(7), [0, 0], buttons(), 0.22).dodge, true, 'R2 also dodges');
  assert.equal(padFrame(buttons(1), [0, 0], buttons(), 0.22).dodge, true, 'East dodges');
  assert.equal(padFrame(buttons(2), [0, 0], buttons(2), 0.22).light, false, 'held buttons do not repeat');
});

test('dead zone and D-pad: quantized, opposite directions cancel to neutral', () => {
  assert.equal(padFrame(buttons(), [0.2, 0], buttons(), 0.22).x, 0);
  assert.equal(padFrame(buttons(), [0.5, 0], buttons(), 0.22).x, 1);
  assert.equal(padFrame(buttons(), [0, -0.9], buttons(), 0.22).y, 1, 'stick up is +y');
  assert.equal(padFrame(buttons(14, 15), [0, 0], buttons(), 0.22).x, 0, 'left+right D-pad is neutral');
  assert.equal(padFrame(buttons(12, 13), [0, 0], buttons(), 0.22).y, 0, 'up+down D-pad is neutral');
  assert.equal(padFrame(buttons(13), [0.9, 0], buttons(), 0.22).y, -1);
});

test('charge toggle: first Heavy press holds the charge, the next releases it', async () => {
  const { applyChargeToggle } = await import('../../apps/game/src/input/inputs.ts');
  const latch = new Set<string>();
  const a = applyChargeToggle({ heavy: true, heavyHeld: false }, latch, 'keyboard');
  assert.equal(a.heavy, true, 'the first press starts the attack');
  assert.equal(a.heavyHeld, true);
  const b = applyChargeToggle({ heavy: false, heavyHeld: false }, latch, 'keyboard');
  assert.equal(b.heavyHeld, true, 'still charging without holding the button');
  const c = applyChargeToggle({ heavy: true, heavyHeld: false }, latch, 'keyboard');
  assert.equal(c.heavy, false, 'the second press only releases');
  assert.equal(c.heavyHeld, false);
  assert.equal(applyChargeToggle({ heavy: true }, latch, 'pad:0').heavyHeld, true, 'each device has its own latch');
  assert.equal(applyChargeToggle({}, latch, 'keyboard').heavyHeld, false);
});
