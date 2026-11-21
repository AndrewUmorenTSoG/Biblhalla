import test from 'node:test';
import assert from 'node:assert/strict';
import { S, content, Q } from '../helpers/engine.ts';
import { createContext } from '../../packages/sim/src/context.ts';
import { combat, startProjectile } from '../../packages/sim/src/combat.ts';
import { Feedback } from '../../apps/game/src/render/feedback.ts';

const ctx = createContext(content);
test('sling stones crumble at half each arena main width in either direction, even when charged', () => {
  for (const map of content.maps.maps) for (const facing of [-1, 1]) {
    const s = S.create({ mode: 'training', hero: 'david', arena: map.id });
    const f = s.fighters[0];
    f.x = 0; f.y = 0; f.facing = facing; f.weapon = 'sling'; f.ground = s.map.main.id;
    s.fighters[1].stocks = 0;
    s.map.platforms = []; s.map.main.rectUnits[1] = -10000;
    S.startAttack(s, f, { light: true });
    const a = f.action!; a.charge = 36;
    startProjectile(ctx, s, f, S.moves[a.move!], a);
    const p = s.projectiles[0];
    const limit = map.main.rectUnits[2] * Q / 2;
    assert.equal(p.travelLeftQ, limit);
    const start = p.x;
    p.gravity = p.vy = 0; p.life = 1000;
    for (let i = 0; i < 100 && s.projectiles.length; i++) { s.tick++; combat(ctx, s); }
    assert.equal(s.projectiles.length, 0);
    assert.ok(Math.abs(p.x - start) <= limit);
    assert.ok(Math.abs(p.x - start) >= limit - 1);
    assert.ok(s.events.some(e => e.type === 'stoneCrumble'));
  }
});

test('crumbling stone fragments fade away and do not shake the camera', () => {
  const feedback = new Feedback();
  feedback.update({ tick: 1, fighters: [], events: [{ id: 1, type: 'stoneCrumble', x: 0, y: 0 }] });
  assert.equal(feedback.puffs[0].kind, 'stone');
  assert.equal(feedback.shake, 0);
  for (let i = 0; i < 20; i++) feedback.update({ tick: i + 2, fighters: [], events: [] });
  assert.equal(feedback.puffs.length, 0);
});

