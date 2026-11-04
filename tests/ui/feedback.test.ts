import test from 'node:test';
import assert from 'node:assert/strict';
import { Feedback, shakeFor, damageColor, KO_SHAKE } from '../../apps/game/src/render/feedback.ts';
import { S, Q } from '../helpers/engine.ts';

const fighter = (o: any = {}) => ({ id: 1, x: 0, y: 0, vx: 0, vy: 0, ground: { id: 0 }, stun: 0, stocks: 3, respawn: 0, ...o });

test('shake stays within the spec: 2 px for light impacts, 6 px for heavy ones and ring-outs', () => {
  assert.equal(shakeFor(0, 0), 0);
  assert.ok(shakeFor(12 * Q, 80) > shakeFor(6 * Q, 80));
  for (const speed of [0, 3, 6, 8.9]) for (const dmg of [0, 80, 400]) assert.ok(shakeFor(speed * Q, dmg) <= 2, `light ${speed}`);
  for (const speed of [9, 15, 40]) for (const dmg of [0, 80, 400]) assert.ok(shakeFor(speed * Q, dmg) <= 6, `heavy ${speed}`);
  assert.equal(KO_SHAKE, 6);
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

test('screen shake and bright flashes each have their own off switch', () => {
  const ko = [{ id: 1, type: 'ko', fighter: 1, x: 0, y: 0 }];
  const noShake = new Feedback(); noShake.shakeOn = false;
  noShake.update({ tick: 1, events: ko, fighters: [fighter()] });
  assert.equal(noShake.shake, 0);
  assert.ok(noShake.puffs.some(p => p.kind === 'burst'), 'the ring-out mark still shows');
  const noFlash = new Feedback(); noFlash.flashOn = false;
  noFlash.update({ tick: 1, events: ko, fighters: [fighter()] });
  assert.equal(noFlash.shake, KO_SHAKE, 'shake is independent of flashes');
  const alphas: number[] = [];
  const c: any = new Proxy({}, { get: (_t, k) => k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}, set: (_t, k, v) => { if (k === 'globalAlpha') alphas.push(v); return true; } });
  noFlash.draw(c, () => ({ x: 0, y: 0 }), 1);
  assert.ok(Math.max(...alphas) <= 0.3, 'flashes off keeps the burst dim');
});
