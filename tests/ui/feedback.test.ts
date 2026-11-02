import test from 'node:test';
import assert from 'node:assert/strict';
import { Feedback, shakeFor, damageColor, KO_SHAKE } from '../../apps/game/src/render/feedback.ts';
import { S, Q } from '../helpers/engine.ts';

const fighter = (o: any = {}) => ({ id: 1, x: 0, y: 0, vx: 0, vy: 0, ground: { id: 0 }, stun: 0, stocks: 3, respawn: 0, ...o });

test('harder launches shake the screen more, capped below the KO shake', () => {
  assert.equal(shakeFor(0, 0), 0);
  assert.ok(shakeFor(12 * Q, 80) > shakeFor(6 * Q, 80));
  assert.ok(shakeFor(40 * Q, 400) <= 14 && 14 < KO_SHAKE);
});

test('a KO makes a burst and the strongest shake, which then settles to nothing', () => {
  const fb = new Feedback();
  fb.update({ tick: 1, events: [{ id: 1, type: 'ko', fighter: 1, x: 900 * Q, y: 100 * Q }], fighters: [fighter()] });
  assert.equal(fb.shake, KO_SHAKE);
  assert.ok(fb.puffs.some(p => p.kind === 'burst'));
  for (let t = 2; t < 80; t++) fb.update({ tick: t, events: [], fighters: [fighter()] });
  assert.equal(fb.shake, 0);
  assert.deepEqual(fb.offset(80), { x: 0, y: 0 });
  assert.equal(fb.puffs.length, 0);
});

test('reduced motion: no shake, no trails, no dust; events are not replayed twice', () => {
  const fb = new Feedback(); fb.reduced = true;
  const flying = fighter({ ground: null, stun: 20, vx: 20 * Q });
  const ev = [{ id: 1, type: 'hit', fighter: 1, damage: 120 }, { id: 2, type: 'jump', fighter: 1 }];
  fb.update({ tick: 2, events: ev, fighters: [flying] });
  assert.equal(fb.shake, 0);
  assert.equal(fb.puffs.length, 0);
  const normal = new Feedback();
  normal.update({ tick: 2, events: ev, fighters: [flying] });
  const first = normal.shake;
  assert.ok(first > 0 && normal.puffs.some(p => p.kind === 'smoke'));
  normal.update({ tick: 3, events: ev, fighters: [flying] });
  assert.ok(normal.shake < first, 'the same hit does not kick again');
});

test('puffs stay bounded through a long real match', () => {
  const s = S.create({ mode: 'local', difficulty: 'hard', seed: 12,
    fighters: [{ hero: 'samson', human: false, team: 0 }, { hero: 'deborah', human: false, team: 1 }] });
  const fb = new Feedback();
  let maxPuffs = 0, kos = 0;
  for (let t = 0; t < 15000 && s.phase !== 'result' && !(kos && t > 3000); t++) {
    S.step(s); fb.update(s); maxPuffs = Math.max(maxPuffs, fb.puffs.length);
    kos += s.events.filter(e => e.type === 'ko').length;
    assert.ok(Number.isFinite(fb.shake));
  }
  assert.ok(maxPuffs <= 90);
  assert.ok(kos > 0);
});

test('damage colour runs from white to deep red', () => {
  assert.equal(damageColor(0), 'rgb(255,255,255)');
  assert.equal(damageColor(9999), 'rgb(140,20,28)');
  const red = (c: string) => Number(c.match(/\d+/g)![2]);
  assert.ok(red(damageColor(1500)) < red(damageColor(500)), 'blue drains as damage grows');
});

test('backwards or broken frame times never grow the shake', () => {
  const fb = new Feedback();
  fb.update({ tick: 1, events: [{ id: 1, type: 'ko', fighter: 1, x: 0, y: 0 }], fighters: [fighter()] });
  for (const dt of [-50, NaN, Infinity, -Infinity]) { fb.update({ tick: 2, events: [], fighters: [fighter()] }, dt); assert.ok(fb.shake <= KO_SHAKE); }
});

test('gravity cancel makes one short lived cloud below the fighter', () => {
  const fb = new Feedback();
  const cancelling = fighter({ x: 20 * Q, y: 80 * Q, ground: null,
    action: { kind: 'attack', cancelled: true, instance: 42 } });
  fb.update({ tick: 10, events: [], fighters: [cancelling] });
  const clouds = fb.puffs.filter(p => p.kind === 'gravity');
  assert.equal(clouds.length, 1);
  assert.equal(clouds[0].y, 71 * Q);
  fb.update({ tick: 11, events: [], fighters: [cancelling] });
  assert.equal(fb.puffs.filter(p => p.kind === 'gravity').length, 1);
  for(let tick=12;tick<31;tick++)fb.update({ tick, events: [], fighters: [fighter()] });
  assert.equal(fb.puffs.filter(p => p.kind === 'gravity').length, 0);
});
