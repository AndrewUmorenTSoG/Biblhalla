import test from 'node:test';
import assert from 'node:assert/strict';
import { S, content } from '../helpers/engine.ts';
import { DAVID_FIGHTS, davidFightOptions, storyRival, withChapterOpponent } from '../../packages/campaign/src/david-fights.ts';
import { createProfiles, seal } from '../../apps/game/src/storage/profile.ts';
import { rivalFrame, rivalAnimation, RIVAL_FRAME_COUNT } from '../../apps/game/src/render/story-rivals.ts';

for (const index of [3, 4]) {
  const fight = DAVID_FIGHTS[index];
  test(fight.name + ' has three distinct readable moves which connect once and recover safely', () => {
    const moves = [...new Map(fight.phases.flat().map(m => [m.name, m])).values()];
    assert.equal(moves.length, 3);
    for (const move of moves) {
      assert.ok(move.tell >= 24 && move.recovery >= 24);
      const s = S.create({ ...davidFightOptions(index, 'hard', 'keyboard'), bossScript: { phases: [[move], [move], [move]] } });
      s.phase = 'playing';
      const [player, rival] = s.fighters;
      const [, y, , h] = s.map.main.rectUnits;
      rival.x = 0; player.x = 35 * S.Q;
      for (const f of s.fighters) { f.y = (y + h) * S.Q; f.ground = s.map.main.id; f.invulnerable = f.respawn = 0; }
      rival.facing = 1;
      s.bossRun!.stage = 'tell'; s.bossRun!.ticks = 1;
      let hits = 0;
      for (let tick = 0; tick < move.active + move.recovery; tick++) {
        S.step(s);
        hits += s.events.filter(e => e.type === 'hit' && e.hazard === move.name).length;
        if (String(s.bossRun!.stage) === 'recovery') assert.equal(s.bossHazard, null);
      }
      assert.equal(hits, 1, move.name);
      assert.equal(player.damage, move.damageTenths);
    }
  });
  test(fight.name + ' recovers from a reachable ledge launch without spending a life', () => {
    const s = S.create(davidFightOptions(index, 'easy', 'keyboard')); s.phase = 'playing';
    const rival = s.fighters[1], [left, bottom, , height] = s.map.main.rectUnits;
    rival.ground = null; rival.x = (left - 60) * S.Q; rival.y = (bottom + height + 6) * S.Q; rival.vy = -S.Q;
    for (let i = 0; i < 180 && !rival.ground; i++) S.step(s);
    assert.ok(rival.ground); assert.equal(rival.stocks, 2);
  });
  test(fight.name + ' stays out of the playable and Quick Battle roster', () => {
    assert.equal(S.defs[fight.skin], undefined);
    const options = { mode: 'duel' as const, opponent: fight.skin };
    assert.equal(withChapterOpponent(options, 'keyboard'), options);
    assert.ok(storyRival(index));
  });
}

test('five-fight progress survives save import and old chapter completion unlocks the first rival', () => {
  const profiles = createProfiles(content), store = new profiles.Store();
  for (const wins of [3, 4, 5]) {
    store.import(seal({ ...profiles.defaults(), davidWins: wins }));
    assert.equal(store.data.davidWins, wins);
  }
});

test('rival sprite states occupy distinct bounded frames without frame-rate-dependent simulation', () => {
  const frames = new Set<number>();
  const counts = { idle: 3, run: 6, air: 6, hurt: 3, tell: 3, active: 1, recovery: 2 } as const;
  for (const [pose, count] of Object.entries(counts)) {
    const moves = ['tell', 'active', 'recovery'].includes(pose) ? 3 : 1;
    for (let m = 0; m < moves; m++) for (let i = 0; i < count; i++) {
      const frame = rivalFrame(pose as keyof typeof counts, (i + 0.1) / count, m);
      assert.ok(frame >= 0 && frame < RIVAL_FRAME_COUNT);
      assert.ok(!frames.has(frame)); frames.add(frame);
    }
  }
  assert.equal(frames.size, RIVAL_FRAME_COUNT);
});

for (const index of [3,4]) {
  test(DAVID_FIGHTS[index].name + ' only accelerates a confirmed follow-up after full recovery', () => {
    const opener = DAVID_FIGHTS[index].phases.flat().find(m => m.followupGap)!;
    for (const landed of [false,true]) {
      const s = S.create({...davidFightOptions(index,'hard','keyboard'),bossScript:{phases:[[opener],[opener],[opener]]}});
      s.phase='playing'; const [player,boss]=s.fighters;
      const [,y,,h]=s.map.main.rectUnits;
      for(const f of s.fighters) {f.y=(y+h)*S.Q;f.ground=s.map.main.id;f.respawn=f.invulnerable=0;}
      boss.x=0;player.x=300*S.Q;
      const run=s.bossRun!;run.stage='recovery';run.ticks=opener.recovery;run.hit=landed?[player.id]:[];
      for(let tick=1;tick<opener.recovery;tick++){S.step(s);assert.equal(run.stage,'recovery');assert.equal(s.bossHazard,null);}
      S.step(s);assert.equal(run.stage,'gap');assert.equal(run.ticks,landed?opener.followupGap:36);
    }
  });
  test(DAVID_FIGHTS[index].name + ' cancels a follow-up when interrupted', () => {
    const s=S.create(davidFightOptions(index,'hard','keyboard'));s.phase='playing';
    const boss=s.fighters[1];boss.respawn=0;boss.stun=10;
    s.bossRun!.stage='active';s.bossRun!.ticks=6;s.bossRun!.hit=[s.fighters[0].id];
    S.step(s);assert.equal(s.bossRun!.stage,'gap');assert.deepEqual(s.bossRun!.hit,[]);assert.equal(s.bossHazard,null);
  });
}
test('rival launch directions are supported and distinguish launchers from forward strikes',()=>{
  for(const fight of DAVID_FIGHTS.slice(3))for(const move of fight.phases.flat())assert.ok(content.physics.directionLookup[String(move.angle)]);
  const kedar=DAVID_FIGHTS[3].phases.flat();
  assert.ok(kedar.find(m=>m.name==='Sky hook')!.angle > kedar.find(m=>m.name==='Crescent cut')!.angle);
});
test('rival contact advances into follow-through without reversing during recovery',()=>{
  const s=S.create(davidFightOptions(3,'hard','keyboard'));const boss=s.fighters[1];
  boss.ground=s.map.main.id;boss.stun=boss.hitstop=0;
  for(const move of DAVID_FIGHTS[3].phases.flat()){
    const sequence:number[]=[];
    for(const stage of ['tell','active','recovery'] as const){
      const duration=move[stage];
      for(let ticks=duration;ticks>0;ticks--)sequence.push(rivalAnimation(boss,{...s.bossRun!,stage,ticks},move,100,0));
    }
    assert.ok(sequence.every((frame,i)=>!i||frame>=sequence[i-1]));
    assert.equal(sequence.at(-1),18+move.frame!*6+5);
  }
});

for (const index of [3, 4]) {
  test(DAVID_FIGHTS[index].name + ' drops through a thin platform to pursue David below', () => {
    const s = S.create(davidFightOptions(index, 'hard', 'keyboard')); s.phase = 'playing';
    const [player, rival] = s.fighters;
    const platform = s.map.platforms.find(p => p.kind === 'oneWay')!;
    const [x, y, w, h] = platform.rectUnits;
    const [, floor, , thickness] = s.map.main.rectUnits;
    rival.x = (x + w / 2) * S.Q; rival.y = (y + h) * S.Q; rival.ground = platform.id;
    player.x = rival.x - 60 * S.Q; player.y = (floor + thickness) * S.Q; player.ground = s.map.main.id;
    for (const f of s.fighters) { f.respawn = f.invulnerable = 0; f.vx = f.vy = f.kx = 0; }
    s.bossRun!.stage = 'gap'; s.bossRun!.ticks = 30;
    for (const stage of ['tell', 'active', 'recovery'] as const) {
      const locked = structuredClone(s); locked.bossRun!.stage = stage; locked.bossRun!.ticks = 20;
      S.step(locked);
      assert.equal(locked.fighters[1].ground, platform.id, stage + ' must not drop early');
      assert.equal(locked.fighters[1].drop, 0);
    }
    let dropped = false, landed = false;
    for (let tick = 0; tick < 120; tick++) {
      S.step(s);
      dropped ||= rival.drop > 0 && !rival.ground;
      landed ||= rival.ground === s.map.main.id;
      if (landed) break;
    }
    assert.ok(dropped, 'uses drop-through instead of waiting above the target');
    assert.ok(landed, 'returns to the main platform');
    assert.equal(rival.stocks, 2);
  });
}

test('attacking rival keeps its contact pose during hitstop, while a stunned rival reacts', () => {
  const s = S.create(davidFightOptions(3, 'hard', 'keyboard'));
  const f = s.fighters[1], move = DAVID_FIGHTS[3].phases[0][0];
  f.ground = s.map.main.id; f.stun = 0;
  const run = {...s.bossRun!, stage: 'active' as const, ticks: move.active};
  const contact = rivalAnimation(f, run, move, 100, 0);
  f.hitstop = 8;
  assert.equal(rivalAnimation(f, run, move, 100, 0), contact);
  f.stun = 12;
  assert.ok(rivalAnimation(f, run, move, 100, 0) < 6);
});
