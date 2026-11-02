import test from 'node:test';
import assert from 'node:assert/strict';
import { Inputs } from '../../apps/game/src/input/inputs.ts';
import { DEFAULT_BINDINGS } from '../../apps/game/src/storage/profile.ts';
import { S,content } from '../helpers/engine.ts';
function keyboard(keys:string[],attack:string,down=DEFAULT_BINDINGS.down){
  const input=Object.create(Inputs.prototype) as Inputs;
  input.settings={bindings:{...DEFAULT_BINDINGS,down}} as Inputs['settings'];
  input.held=new Set(keys);input.edges=new Set([attack]);return input.keyboard();
}
test('S plus J or K selects all four down attacks for every fighter and weapon',()=>{
  assert.equal(DEFAULT_BINDINGS.down,'KeyS');
  for(const def of content.fighters.fighters)for(const weapon of [...def.weaponPair,'unarmed']){
    const fighter=S.create({mode:'training',hero:def.id}).fighters[0];fighter.weapon=weapon;
    const light=keyboard(['KeyS','KeyJ'],'KeyJ'),heavy=keyboard(['KeyS','KeyK'],'KeyK');
    assert.equal(light.y,-1);
    assert.equal(S.selectMove(fighter,light,true)?.id,(S.moves[def.id+'_'+weapon+'_dlight']?def.id+'_':'')+weapon+'_dlight');
    assert.equal(S.selectMove(fighter,light,false)?.id,weapon+'_dair');
    assert.equal(S.selectMove(fighter,heavy,false)?.id,weapon+'_ground_pound');
    assert.equal(S.selectMove(fighter,heavy,true)?.id,(weapon==='unarmed'?'unarmed':def.id+'_'+weapon)+'_dsig');
  }
});
test('an intentional down remap is respected',()=>{
  assert.equal(keyboard(['KeyS','KeyJ'],'KeyJ','KeyX').y,0);
  assert.equal(keyboard(['KeyX','KeyJ'],'KeyJ','KeyX').y,-1);
});
