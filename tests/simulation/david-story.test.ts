import test from 'node:test';
import assert from 'node:assert/strict';
import { S } from '../helpers/engine.ts';
import { DAVID_FIGHTS, davidFightOptions } from '../../packages/campaign/src/david-fights.ts';

for (const [index, fight] of DAVID_FIGHTS.entries()) {
  test('David fights '+fight.name+' with the chapter loadout and wins only on a ring-out', () => {
    const world=S.create(davidFightOptions(index,'hard','touch'));
    const [david,enemy]=world.fighters;
    assert.deepEqual([david.hero,david.weapon,david.inputId], ['david','sling','touch']);
    assert.equal(world.map.id,fight.arena);
    assert.equal(enemy.weapon,index===2?'spear':'unarmed');
    enemy.guard=0; world.phase='playing'; S.step(world);
    assert.equal(world.phase,'playing');
    enemy.y = -10000*S.Q; S.step(world);
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
