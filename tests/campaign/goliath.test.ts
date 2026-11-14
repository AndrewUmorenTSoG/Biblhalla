import test from 'node:test';
import assert from 'node:assert/strict';
import { A, Q } from '../helpers/engine.ts';
import { AIM_ZONE, STONE_BAY_X } from '../../packages/campaign/src/goliath.ts';
import type { Scene } from '../../packages/campaign/src/index.ts';

function enter(difficulty = 'hard'): Scene {
  const s = A.create('L041', difficulty);
  A.begin(s);
  while (s.world.phase === 'countdown') A.step(s, {});
  return s;
}
const place = (s: Scene, x: number, airborne = false) => {
  const f = s.world.fighters[0];
  f.x = x * Q; f.y = (airborne ? 300 : 82) * Q; f.vx = f.vy = 0; f.action = null;
};

/** Collect the stone, then clear two advances by staying airborne over them. */
function reachAim(s: Scene): void {
  place(s, STONE_BAY_X);
  A.step(s, { interact: true });
  assert.equal(s.goliath.stage, 'composure');
  for (let t = 0; t < 1200 && s.goliath.stage === 'composure'; t++) {
    place(s, STONE_BAY_X - 20, s.goliath.advance.state === 'active');
    A.step(s, {});
  }
  assert.equal(s.goliath.stage, 'aim');
}

test('David plays the reenactment alone, with no combat, damage or projectiles', () => {
  const s = enter();
  assert.equal(s.world.fighters.length, 1);
  assert.equal(s.world.fighters[0].hero, 'david');
  assert.equal(s.markers.length, 0);
  const f = s.world.fighters[0];
  for (let t = 0; t < 300; t++) A.step(s, { light: t % 7 === 0, heavy: t % 11 === 0, item: t % 13 === 0 });
  assert.equal(f.damage, 0);
  assert.equal(s.world.projectiles.length, 0);
  assert.equal(f.action?.kind === 'attack', false);
});

test('an active spear lane returns David to safety without harm', () => {
  const s = enter();
  const lane = s.goliath.lanes[0];
  for (let t = 0; t < 400 && lane.state !== 'active'; t++) { place(s, 300); A.step(s, {}); }
  place(s, lane.x / Q);
  A.step(s, {});
  const f = s.world.fighters[0];
  assert.ok(f.x < lane.x - 100 * Q);
  assert.equal(f.damage, 0);
});

test('a shield advance that catches David restarts composure, nothing more', () => {
  const s = enter();
  place(s, STONE_BAY_X);
  A.step(s, { interact: true });
  assert.ok(s.goliath.stone);
  let reset = false;
  for (let t = 0; t < 600 && !reset; t++) {
    const a = s.goliath.advance;
    if (a.state === 'active') place(s, a.x / Q);
    A.step(s, {});
    reset = s.world.fighters[0].x === (STONE_BAY_X - 150) * Q;
  }
  assert.ok(reset);
  assert.equal(s.goliath.advancesCleared, 0);
  assert.equal(s.goliath.stage, 'composure');
});

test('a miss returns to composure; one aimed stone from the zone completes the account', () => {
  const s = enter('extreme');
  reachAim(s);
  place(s, AIM_ZONE[0] - 200);
  A.step(s, { interact: true });
  assert.equal(s.goliath.stage, 'composure');
  assert.equal(s.goliath.misses, 1);
  reachAim(s);
  assert.equal(s.goliath.open, 1);
  place(s, (AIM_ZONE[0] + AIM_ZONE[1]) / 2);
  A.step(s, { interact: true });
  assert.equal(s.phase, 'complete');
  assert.match(s.caption, /./);
  assert.equal(s.world.fighters[0].damage, 0);
});

test('the opening expires back to composure if no stone is released', () => {
  const s = enter('easy');
  reachAim(s);
  for (let t = 0; t < 400 && s.goliath.stage === 'aim'; t++) A.step(s, {});
  assert.equal(s.goliath.stage, 'composure');
  assert.equal(s.phase, 'active');
});

test('Goliath telegraphs and alternates a throw and a grounding headbutt at close range', () => {
  const s = enter(), g = s.goliath.giant, f = s.world.fighters[0];
  for (const move of ['throw', 'headbutt']) {
    place(s, g.x / Q - 95);
    A.step(s, {});
    assert.equal(g.move, 'reach');
    for (let i = 0; i < 18; i++) A.step(s, {});
    assert.equal(g.move, move);
    let highest = 0;
    for (let i = 0; i < 48 && g.move === move; i++) {
      A.step(s, {jump:true,x:1});
      highest = Math.max(highest, f.y / Q);
    }
    assert.ok(highest >= 190);
    assert.equal(f.y, 80 * Q);
    assert.ok(Math.abs(f.x-g.x) >= (move === 'throw' ? 340 : 145)*Q);
    assert.equal(g.move, 'recover');
    for (let i = 0; i < 32; i++) A.step(s, {});
  }
});

test('Goliath takes one hop per slam and the wave reaches both sides of his shield', () => {
  for (const side of [-1,1]) {
    const s=enter();
    place(s,STONE_BAY_X);
    A.step(s,{interact:true});
    let peaks=0, previous=0, rising=false, hit=false;
    for(let t=0;t<180;t++){
      const g=s.goliath;
      if(g.advance.state==='active')place(s,(g.impactX+side*(g.impactX-g.advance.x))/Q);
      A.step(s,{});
      if(g.giant.height>previous)rising=true;
      if(g.giant.height<previous&&rising){peaks++;rising=false;}
      previous=g.giant.height;
      if(s.world.fighters[0].x===(STONE_BAY_X-150)*Q){hit=true;break;}
    }
    assert.equal(peaks,1);
    assert.ok(hit);
  }
});

test('David carries his chosen memory from the stream to the valley ending', () => {
  for(const memory of ['flock','brothers'] as const){
    const s=enter();
    s.goliath.memory=memory;
    place(s,STONE_BAY_X);
    A.step(s,{interact:true});
    assert.match(s.caption,memory==='flock'?/pasture/:/brothers/);
    reachAim(s);
    place(s,(AIM_ZONE[0]+AIM_ZONE[1])/2);
    A.step(s,{interact:true});
    assert.equal(s.phase,'complete');
    assert.match(s.caption,memory==='flock'?/stream again/:/Bethlehem again/);
  }
});

test('the reach warns David, can be escaped, and lifts from actual contact in either direction', () => {
  for (const side of [-1, 1]) {
    const s = enter(), g = s.goliath.giant, david = s.world.fighters[0];
    place(s, g.x / Q + side * 135);
    A.step(s, {});
    assert.match(s.caption, /Dodge/);
    for (let t = 0; t < 18; t++) A.step(s, {x:side});
    assert.equal(g.move, 'recover');
    assert.equal(g.nextGrab, 'throw');
    for (let t = 0; t < 32; t++) A.step(s, {});

    place(s, g.x / Q + side * 135);
    A.step(s, {});
    for (let t = 0; t < 17; t++) A.step(s, {});
    david.y = 165 * Q;
    david.ground = null;
    david.vy = 0;
    const beforeX = david.x, beforeY = david.y;
    A.step(s, {});
    assert.equal(g.move, 'throw');
    assert.equal(david.x, beforeX);
    assert.ok(Math.abs(david.y - beforeY) < 3 * Q);
    A.step(s, {});
    assert.ok(Math.abs(david.x - beforeX) < 10 * Q);
    assert.ok(david.y > beforeY);
  }
});
