import test from 'node:test';
import assert from 'node:assert/strict';
import { edgePointer, nextTask } from '../../apps/game/src/render/waypoint.ts';
import { A } from '../helpers/engine.ts';

test('a target on screen gets a chevron over it', () => {
  const p = edgePointer({ x: 600, y: 400 });
  assert.equal(p.onScreen, true);
  assert.deepEqual([p.x, p.y], [600, 400]);
});

test('an off-screen target is pinned to the edge and points toward it', () => {
  const right = edgePointer({ x: 4000, y: 420 });
  assert.equal(right.onScreen, false);
  assert.ok(right.x >= 1280 - 44 - 1 && right.x <= 1280);
  assert.ok(Math.abs(right.angle) < 0.2, 'points right');
  const left = edgePointer({ x: -900, y: 420 });
  assert.ok(left.x <= 45 && Math.abs(Math.abs(left.angle) - Math.PI) < 0.2, 'points left');
  const below = edgePointer({ x: 640, y: 3000 });
  assert.ok(below.y <= 720 - 44 + 1 && below.angle > 1.3, 'points down');
  for (const t of [{ x: 5000, y: -5000 }, { x: -5000, y: 5000 }]) {
    const p = edgePointer(t);
    assert.ok(p.x >= 43 && p.x <= 1237 && p.y >= 95 && p.y <= 677, 'always inside the view');
  }
});

test('every story level with tasks points at its first unfinished one', () => {
  for (const id of ['L001', 'L005', 'L012', 'L041', 'L079']) {
    const s: any = A.create(id, 'easy', null);
    const first = nextTask(s.markers);
    if (s.markers.length) assert.equal(first, s.markers[0]);
    if (s.markers.length > 1) { s.markers[0].done = true; assert.equal(nextTask(s.markers), s.markers[1]); }
    for (const m of s.markers) m.done = true;
    assert.equal(nextTask(s.markers), null, 'no pointer once everything is done');
  }
});
