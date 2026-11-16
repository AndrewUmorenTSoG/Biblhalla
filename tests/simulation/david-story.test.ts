import test from 'node:test';
import assert from 'node:assert/strict';
import { S } from '../helpers/engine.ts';
import { DAVID_CHAPTER, davidFightOptions } from '../../packages/campaign/src/david-fights.ts';

for (const [index, fight] of DAVID_CHAPTER.entries()) {
  test('David fights '+fight.name+' with the chapter loadout and wins only on a ring-out', () => {
    const world=S.create(davidFightOptions(index,'hard','touch'));
    const [david,enemy]=world.fighters;
    assert.deepEqual([david.hero,david.weapon,david.inputId], ['david','sling','touch']);
    assert.equal(world.map.id,fight.arena);
    assert.equal(enemy.weapon,index===2?'spear':'unarmed');
    enemy.guard=0; world.phase='playing'; S.step(world);
    assert.equal(world.phase,'playing');
    const opponents=world.fighters.slice(1);
    if(index===1)assert.deepEqual(opponents.map(f=>[f.name,f.stocks]),[['Bear',2],['Lion Man',2]]);
    for(const beast of opponents){
      const stocks=beast.stocks;
      for(let life=0;life<stocks;life++){
        while(beast.respawn)S.step(world);
        assert.equal(world.phase,'playing');
        beast.y = -10000*S.Q; beast.ground=null; S.step(world);
        assert.equal(beast.stocks,stocks-life-1);
      }
    }
    assert.equal(world.result?.won,true);
  });
}

test('Lion Man connects with claws, bite, and a single grab and release against David at close range',()=>{
  const world=S.create(davidFightOptions(0,'easy','keyboard'));
  const hits:string[]=[];
  let held=false;
  for(let tick=0;tick<1300 && hits.length<3;tick++){
    // Keep each attack in reach to isolate the authored contact and grab timing.
    if(world.bossRun?.stage==='gap'){
      const [david,lion]=world.fighters;
      lion.x=0; david.x=40*S.Q; david.y=lion.y=80*S.Q;
      david.kx=david.vx=david.vy=lion.kx=lion.vx=lion.vy=0;
    }
    S.step(world);
    const [david,lion]=world.fighters;
    if(world.bossHazard?.name==='Mane throw' && david.stun===3 && david.y===lion.y+25*S.Q) held=true;
    for(const event of world.events)if(event.type==='hit')hits.push(String(event.hazard));
  }
  assert.equal(held,true);
  assert.deepEqual(hits,['Claw slash','Fang lunge','Mane throw']);
});

test('both beasts steer and jump back to the platform from a recoverable launch on Easy',()=>{
  for(const slot of [1,2]){
    const world=S.create(davidFightOptions(1,'easy','keyboard'));
    world.phase='playing';
    const beast=world.fighters[slot], [left,bottom,,height]=world.map.main.rectUnits;
    beast.ground=null; beast.x=(left-65)*S.Q; beast.y=(bottom+height+6)*S.Q; beast.vy=-S.Q;
    for(let tick=0;tick<180&&!beast.ground;tick++)S.step(world);
    assert.ok(beast.ground,beast.name+' should land');
    assert.equal(beast.stocks,2);
  }
});
