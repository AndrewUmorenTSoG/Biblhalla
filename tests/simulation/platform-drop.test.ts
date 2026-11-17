import test from 'node:test';
import assert from 'node:assert/strict';
import {S,Q} from '../helpers/engine.ts';

test('holding Down drops through a thin ledge and lands on the solid main floor',()=>{
  const world=S.create({mode:'training',trainingBot:'stand'});
  world.phase='playing';
  const f=world.fighters[0],pl=world.map.platforms.find(p=>p.kind==='oneWay')!;
  assert.ok(pl);
  const [x,y,w,h]=pl.rectUnits;
  f.x=(x+w/2)*Q;f.y=(y+h)*Q;f.ground=pl.id;f.vy=0;
  S.step(world,{[f.inputId]:{y:-1}});
  assert.equal(f.ground,null);assert.ok(f.y<(y+h)*Q);
  for(let i=0;i<100;i++) S.step(world,{[f.inputId]:{y:-1}});
  assert.equal(f.ground,world.map.main.id);
});

test('Down bypasses a thin ledge in descent while releasing Down allows landing',()=>{
  for(const down of [true,false]){
    const world=S.create({mode:'training',trainingBot:'stand'});world.phase='playing';
    const f=world.fighters[0],pl=world.map.platforms.find(p=>p.kind==='oneWay')!;
    const [x,y,w,h]=pl.rectUnits;
    f.x=(x+w/2)*Q;f.y=(y+h+3)*Q;f.ground=null;f.vy=-4*Q;
    S.step(world,{[f.inputId]:{y:down?-1:0}});
    assert.equal(f.ground,down?null:pl.id);
  }
});
