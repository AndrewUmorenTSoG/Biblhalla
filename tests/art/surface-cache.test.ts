import test from 'node:test';
import assert from 'node:assert/strict';
import { SurfaceCache } from '../../apps/game/src/render/surface-cache.ts';

test('static surfaces paint once, reuse the image, and repaint changed geometry', () => {
  let paints = 0, created = 0;
  const target = new Proxy({}, { get: (_object, key) => key === 'fillRect' ? () => { paints++; } : () => {}, set: () => true }) as CanvasRenderingContext2D;
  const draws: unknown[][] = [];
  const output = { drawImage: (...args: unknown[]) => draws.push(args) } as unknown as CanvasRenderingContext2D;
  const cache = new SurfaceCache(() => { created++; return { width: 0, height: 0, getContext: () => target } as unknown as HTMLCanvasElement; });
  cache.draw(output, 'elah_training_terrace', [0, -120, 100, 200], true);
  const firstPaints = paints;
  assert.ok(firstPaints > 0);
  cache.draw(output, 'elah_training_terrace', [0, -120, 100, 200], true);
  assert.equal(created, 1);
  assert.equal(paints, firstPaints);
  assert.equal(draws.length, 2);
  assert.deepEqual(draws[0].slice(1), [-2, -521]);
  cache.draw(output, 'elah_training_terrace', [0, -120, 120, 200], true);
  assert.equal(created, 2);
  cache.clear();
  cache.draw(output, 'elah_training_terrace', [0, -120, 100, 200], true);
  assert.equal(created, 3);
});
