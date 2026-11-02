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
  const r = rebind(D, 'light', 'KeyU');
  assert.equal(r.swappedWith, null);
  assert.deepEqual({ ...r.bindings, light: D.light }, D);
});

test('Up and Jump share W by default, and can still be split apart', () => {
  assert.equal(D.up, 'KeyW');
  assert.equal(D.jump, 'KeyW');
  assert.ok(bindingsAreUnique(D), 'the Up/Jump pair is allowed to share');
  const f = keyboardFrame(D, new Set(['KeyW']), new Set(['KeyW']));
  assert.equal(f.y, 1);
  assert.equal(f.jump, true);
  const split = rebind(D, 'jump', 'Space');
  assert.equal(split.swappedWith, null);
  assert.equal(split.bindings.up, 'KeyW');
  assert.equal(split.bindings.jump, 'Space');
  // Giving W to another control moves both Up and Jump off it, so W drives one thing.
  const taken = rebind(D, 'light', 'KeyW');
  assert.equal(taken.bindings.light, 'KeyW');
  assert.equal(taken.bindings.up, 'KeyJ');
  assert.equal(taken.bindings.jump, 'KeyJ');
  assert.ok(bindingsAreUnique(taken.bindings));
});

test('default layout: A/S/D move, Shift dodges, 0-3 are emotes', () => {
  assert.deepEqual([D.left, D.down, D.right, D.dodge], ['KeyA', 'KeyS', 'KeyD', 'ShiftLeft']);
  for (const n of [0, 1, 2, 3]) {
    const f = keyboardFrame(D, new Set([`Digit${n}`]), new Set([`Digit${n}`]));
    assert.equal(f.emote, n);
  }
  assert.equal(keyboardFrame(D, new Set(), new Set()).emote, -1);
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
  for (const code of new Set(Object.values(D))) {
    if (code === D.pause || code === D.jump) continue; // W is the deliberate Up + Jump pair
    const f = keyboardFrame(D, new Set([code]), new Set([code]));
    const on = Object.entries(f).filter(([k, v]) => (k === 'emote' ? v !== -1 : v) && !k.endsWith('Held')).length;
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
