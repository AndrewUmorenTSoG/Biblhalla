import test from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio, recipeFor, variation } from '../../apps/game/src/audio/audio.ts';
import { S } from '../helpers/engine.ts';

const ev = (id: number, type: string, extra: Record<string, unknown> = {}) => ({ id, tick: 0, type, ...extra }) as any;

test('every combat and match event a player needs to hear has an original sound', () => {
  for (const type of ['attack', 'hit', 'ko', 'jump', 'pickup', 'throw', 'projectile', 'shieldBlock', 'bossTell', 'enemyTell', 'wave', 'suddenDeath', 'result', 'respawn'])
    assert.ok(recipeFor(ev(1, type, { move: 'sword_nlight', damage: 50 })), type);
});

test('heavy hits sound heavier than light taps; wood and bronze swings differ', () => {
  const light = recipeFor(ev(1, 'hit', { damage: 40 }))!, heavy = recipeFor(ev(2, 'hit', { damage: 160 }))!;
  assert.ok(heavy.layers[0].from < light.layers[0].from && heavy.layers[0].gain > light.layers[0].gain);
  const wood = recipeFor(ev(3, 'attack', { move: 'staff_nlight' }))!, bronze = recipeFor(ev(4, 'attack', { move: 'sword_nlight' }))!;
  assert.ok(wood.layers[0].from < bronze.layers[0].from);
  assert.ok(recipeFor(ev(5, 'ko'))!.priority > light.priority, 'ring-outs win a crowded mix');
});

test('variation is cosmetic, small and repeatable from the event id', () => {
  for (let id = 1; id < 500; id++) { const v = variation(id); assert.ok(v >= 0.94 && v <= 1.06); assert.equal(v, variation(id)); }
});

test('events are heard once; a restored or rematched state starts counting again', () => {
  const a = new GameAudio();
  assert.deepEqual(a.fresh([ev(1, 'hit'), ev(2, 'jump')]).map(e => e.id), [1, 2]);
  assert.deepEqual(a.fresh([ev(2, 'jump')]), [], 'a repeated event is not replayed');
  assert.deepEqual(a.fresh([ev(3, 'ko')]).map(e => e.id), [3]);
  assert.deepEqual(a.fresh([ev(1, 'hit')]).map(e => e.id), [1], 'a rematch restarts ids');
});

test('a real match produces sounds without touching the simulation', () => {
  const s = S.create({ mode: 'local', difficulty: 'hard', seed: 3, fighters: [{ hero: 'david', human: false, team: 0 }, { hero: 'esther', human: false, team: 1 }] });
  const a = new GameAudio();
  let cues = 0;
  for (let t = 0; t < 3000; t++) { S.step(s); cues += a.fresh(s.events).filter(e => recipeFor(e)).length; }
  assert.ok(cues > 50);
});
