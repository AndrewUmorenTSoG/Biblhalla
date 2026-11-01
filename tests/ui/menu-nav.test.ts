import test from 'node:test';
import assert from 'node:assert/strict';
import { nextFocus } from '../../apps/game/src/input/menu-nav.ts';
import type { NavRect } from '../../apps/game/src/input/menu-nav.ts';

const r = (x: number, y: number, w = 100, h = 40): NavRect => ({ x, y, w, h });

// A 3x2 grid of cards like the mode or chapter screens.
const grid = [r(0, 0), r(150, 0), r(300, 0), r(0, 100), r(150, 100), r(300, 100)];

test('focus moves to the neighbour straight ahead in each direction', () => {
  const from = grid[4];
  const others = grid.filter(g => g !== from);
  const at = (d: Parameters<typeof nextFocus>[2]) => others[nextFocus(from, others, d)];
  assert.equal(at('up'), grid[1]);
  assert.equal(at('left'), grid[3]);
  assert.equal(at('right'), grid[5]);
  assert.equal(nextFocus(from, others, 'down'), -1, 'nothing below the bottom row');
});

test('straight-ahead targets beat closer diagonal ones', () => {
  const from = r(0, 0);
  const candidates = [r(200, 60), r(0, 160)];
  assert.equal(nextFocus(from, candidates, 'down'), 1);
});

test('a vertical stack of dialog buttons is walkable both ways', () => {
  const stack = [r(0, 0, 300), r(0, 50, 300), r(0, 100, 300)];
  assert.equal(nextFocus(stack[0], stack.slice(1), 'down'), 0);
  assert.equal(nextFocus(stack[2], stack.slice(0, 2), 'up'), 1);
});
