// 19_AGGRESSIVE_QA: difficulty changes planning, not stats or hidden hurtboxes.

import test from 'node:test';
import assert from 'node:assert/strict';
import { S } from '../helpers/engine.ts';
import type { InputFrame, SimState } from '../../packages/sim/src/index.ts';

const LEVELS = ['easy', 'hard', 'extreme'] as const;
/** Fields a fighter gets from content and rules; none may depend on difficulty. */
const BODY = ['hero', 'stocks', 'scale', 'maxGuard', 'guard', 'stats', 'weapon'] as const;

function body(f: any) { return Object.fromEntries(BODY.map(k => [k, f[k]])); }
function withoutDifficulty(s: SimState) {
  const snap = JSON.parse(JSON.stringify(S.snapshot(s)));
  delete snap.difficulty; delete snap.options;
  if (snap.result) delete snap.result.difficulty;
  return snap;
}

test('two humans with the same inputs play out identically at every difficulty', () => {
  const script = (t: number): Record<number, InputFrame> => ({
    1: { x: t % 90 < 45 ? 1 : -1, jump: t % 70 === 5, jumpHeld: t % 70 < 15, light: t % 23 === 0, heavy: t % 61 === 30, dodge: t % 97 === 50 },
    2: { x: t % 80 < 40 ? -1 : 1, light: t % 29 === 3, jump: t % 110 === 9, jumpHeld: t % 110 < 20, heavy: t % 53 === 11 },
  });
  const ends = LEVELS.map(difficulty => {
    const s = S.create({ mode: 'local', difficulty, seed: 41, arena: S.content.maps.maps[2].id,
      fighters: [{ hero: 'samson', human: true, inputId: 'p1', team: 0 }, { hero: 'esther', human: true, inputId: 'p2', team: 1 }] });
    for (let t = 0; t < 2400 && s.phase !== 'result'; t++) S.step(s, script(t));
    return withoutDifficulty(s);
  });
  assert.deepEqual(ends[1], ends[0]);
  assert.deepEqual(ends[2], ends[0]);
});

test('computer fighters and wave enemies have the same body at every difficulty', () => {
  const bodies = LEVELS.map(difficulty => {
    const s = S.create({ mode: 'local', difficulty, seed: 7,
      fighters: [{ hero: 'david', human: false, team: 0 }, { hero: 'gideon', human: false, team: 1 }] });
    return s.fighters.map(body);
  });
  assert.deepEqual(bodies[1], bodies[0]);
  assert.deepEqual(bodies[2], bodies[0]);

  const enemies = LEVELS.map(difficulty => {
    const s = S.create({ mode: 'waves', difficulty, seed: 3, hero: 'david' });
    const seen = new Map<string, unknown>();
    for (let t = 0; t < 3000 && s.phase !== 'result'; t++) {
      S.step(s);
      for (const f of s.fighters.slice(1)) if (!seen.has(f.hero)) seen.set(f.hero, body(f));
    }
    return seen;
  });
  for (const level of enemies.slice(1)) for (const [hero, b] of level) {
    if (enemies[0].has(hero)) assert.deepEqual(b, enemies[0].get(hero), `${hero} body differs by difficulty`);
  }
});

test('the hurtbox a computer is hit with is the same at every difficulty', () => {
  // Same attacker script against a bot that is pinned in place: identical damage taken.
  const taken = LEVELS.map(difficulty => {
    const s = S.create({ mode: 'local', difficulty, seed: 5,
      fighters: [{ hero: 'joshua', human: true, inputId: 'p1', team: 0 }, { hero: 'saul', human: false, team: 1 }] });
    while (s.phase === 'countdown') S.step(s);
    const [p, bot] = s.fighters;
    const hits: number[] = [];
    for (let t = 0; t < 400; t++) {
      bot.x = p.x + 45 * 256 * p.facing; bot.vx = 0; bot.stun = Math.max(bot.stun, 20); bot.invulnerable = 0; // held in hitstun so planning cannot dodge
      S.step(s, { [p.id]: { light: t % 30 === 0 } });
      for (const e of s.events) if (e.type === 'hit' && e.fighter === bot.id) hits.push(Number(e.damage));
    }
    return hits;
  });
  assert.ok(taken[0].length > 3, 'the script should land hits');
  assert.deepEqual(taken[1], taken[0]);
  assert.deepEqual(taken[2], taken[0]);
});
