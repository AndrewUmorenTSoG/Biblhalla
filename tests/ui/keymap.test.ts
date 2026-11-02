import test from 'node:test';
import assert from 'node:assert/strict';
import { rebind, keyboardFrame, isGameKey, bindingsAreUnique } from '../../apps/game/src/input/keymap.ts';
import { DEFAULT_BINDINGS } from '../../apps/game/src/storage/profile.ts';
import { content as C } from '../helpers/engine.ts';
import { createProfiles } from '../../apps/game/src/storage/profile.ts';

const D = { ...DEFAULT_BINDINGS };

test('choosing a key another control uses swaps the two instead of sharing it', () => {
  const r = rebind(D, 'light', 'KeyK');
  assert.equal(r.swappedWith, 'heavy');
  assert.equal(r.bindings.light, 'KeyK');
  assert.equal(r.bindings.heavy, 'KeyJ');
  assert.ok(bindingsAreUnique(r.bindings));
  // Nothing else moved.
  for (const k of Object.keys(D)) if (k !== 'light' && k !== 'heavy') assert.equal(r.bindings[k], D[k as keyof typeof D]);
});

test('a free key changes only that control', () => {
  const r = rebind(D, 'jump', 'KeyW');
  assert.equal(r.swappedWith, 'up');
  const free = rebind(D, 'jump', 'KeyI');
  assert.equal(free.swappedWith, null);
  assert.deepEqual({ ...free.bindings, jump: D.jump }, D);
});

test('rejected keys leave bindings untouched', () => {
  assert.ok(rebind(D, 'light', 'F5').error);
  assert.ok(rebind(D, 'light', 'Escape').error);
  assert.equal(rebind(D, 'light', 'F5').bindings, D);
  assert.equal(rebind(D, 'pause', 'KeyP').error, null);
  assert.equal(rebind(D, 'light', 'Comma').error, null);
});

test('arrow keys bound to an action no longer also move the fighter', () => {
  const b = { ...D, light: 'ArrowUp' };
  const f = keyboardFrame(b, new Set(['ArrowUp']), new Set(['ArrowUp']));
  assert.equal(f.light, true);
  assert.equal(f.y, 0, 'ArrowUp is light now, not aim up');
  const plain = keyboardFrame(D, new Set(['ArrowLeft']), new Set());
  assert.equal(plain.x, -1, 'unbound arrows still move');
  assert.ok(isGameKey(D, 'ArrowLeft'));
  assert.ok(!isGameKey(D, 'KeyZ'));
});

test('each key press drives exactly one control', () => {
  for (const code of Object.values(D)) {
    if (code === D.pause) continue;
    const f = keyboardFrame(D, new Set([code]), new Set([code]));
    const on = Object.entries(f).filter(([k, v]) => v && !k.endsWith('Held')).length;
    assert.equal(on, 1, `${code} triggered ${on} controls`);
  }
});

test('a save that shares one key between controls falls back to the default keys', () => {
  const B: any = createProfiles(C);
  const raw = B.defaults();
  raw.settings.bindings = { ...D, light: 'KeyK' };
  assert.deepEqual(B.validate(raw).settings.bindings, D);
  raw.settings.bindings = { ...D, light: 'Comma' };
  assert.equal(B.validate(raw).settings.bindings.light, 'Comma');
});
