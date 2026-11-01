import test from 'node:test';
import assert from 'node:assert/strict';
import { A } from '../helpers/engine.ts';
import { drawEncounter } from '../../apps/game/src/render/encounter.ts';

/** Canvas stand-in recording every drawing call with its arguments and current styles. */
function recorder(log: string[]): CanvasRenderingContext2D {
  const state: Record<string, unknown> = {};
  return new Proxy(state, {
    get: (_t, key) => (typeof key === 'string' && ['fillRect', 'moveTo', 'lineTo', 'fillText', 'strokeText'].includes(key)
      ? (...a: unknown[]) => log.push(`${key}(${a.join(',')}) ${state.fillStyle ?? ''}`) : () => {}),
    set: (_t, key, v) => { state[key as string] = v; return true; },
  }) as unknown as CanvasRenderingContext2D;
}

function frames(id: string, reduced: boolean, ready: (s: any) => boolean): [string, string] {
  const s = A.create(id, 'hard');
  A.begin(s);
  for (let t = 0; t < 900 && !ready(s); t++) A.step(s, {});
  assert.ok(ready(s), `${id}: reached the warning state`);
  const a: string[] = [], b: string[] = [];
  drawEncounter(recorder(a), s.world, s, reduced);
  s.tick += 5;
  drawEncounter(recorder(b), s.world, s, reduced);
  return [a.join('\n'), b.join('\n')];
}

test('reduced motion keeps warnings on screen but stops flashing and moving streaks', () => {
  const sinking = (s: any) => s.stones.some((st: any) => st.state === 'sinking');
  const gust = (s: any) => s.wind && s.wind.state === 'gust';
  for (const [id, ready] of [['L072', sinking], ['L070', gust]] as const) {
    const [r1, r2] = frames(id, true, ready);
    assert.equal(r1, r2, `${id}: static under reduced motion`);
    assert.match(r1, /sinking|GUST/);
    const [m1, m2] = frames(id, false, ready);
    assert.notEqual(m1, m2, `${id}: animated normally`);
  }
});
