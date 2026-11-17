import assert from 'node:assert/strict';
import test from 'node:test';
import { S, Q } from '../helpers/engine.ts';

function practice(distance:number, facing:1|-1) {
  const world=S.create({mode:'training',hero:'moses',trainingBot:'stand'});
  world.phase='playing';
  const [moses,target]=world.fighters;
  moses.weapon='staff'; moses.facing=facing; moses.x=0; target.x=distance*facing*Q;
  for(const f of [moses,target]) { f.y=80*Q; f.ground=world.map.main.id; f.invulnerable=0; }
  return {world,moses,target};
}

test('a down-light press at staff sweep contact launches Moses into two separate kicks',()=>{
  for(const facing of [1,-1] as const) for(const distance of [28,80,100]) {
    const {world,moses}=practice(distance,facing);
    const contacts:string[]=[];
    let queued=false;
    for(let tick=0;tick<60;tick++) {
      const follow=!queued && moses.action?.confirmed;
      if(follow) queued=true;
      S.step(world,{[moses.inputId]:tick===0?{x:facing,light:true}:follow?{y:-1,light:true}:{}});
      if(world.events.some(e=>e.tick===world.tick && e.type==='hit' && e.attacker===moses.id)) {
        contacts.push(moses.action!.move!);
        if(contacts.length>1) assert.equal(moses.ground,null);
      }
    }
    assert.deepEqual(contacts,['moses_staff_slight','moses_staff_dlight','moses_staff_dlight']);
  }
});

test('the tide advances toward the chosen side and strikes each opponent once',()=>{
  for(const facing of [1,-1] as const) for(const distance of [-95,45,200]) {
    const {world,moses,target}=practice(distance,facing);
    for(let tick=0;tick<65;tick++) S.step(world,{[moses.inputId]:tick===0?{heavy:true,x:facing}:{}});
    assert.equal(moses.hits,distance<0?0:1);
    assert.equal(target.damage>0,distance>0);
  }
});
