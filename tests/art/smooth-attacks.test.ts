import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(path:string)=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const roster=read('../../assets/runtime/fighters/fighters.json');
const moves=read('../../production-pack/09_Data/attacks.json').attacks;
test('every playable attack reaches contact on time and settles on the equipped idle',()=>{
  const covered=new Set<string>();
  for(const [hero,entry] of Object.entries(roster) as [string,any][]){
    assert.ok(entry.packing.width<=2048 && entry.packing.height<=2048,hero);
    for(const move of moves){
      const clip=entry.clips[move.id];
      if(!clip)continue;
      covered.add(move.id);
      const ticks:string[]=clip.frames.flatMap((key:string,i:number)=>Array(clip.ticks[i]).fill(key));
      const label=hero+'/'+move.id;
      assert.equal(ticks.length,move.totalTicks,label);
      assert.ok(new Set(clip.frames).size>=10,label);
      assert.match(ticks[move.startup-1],/^attack_smear_/,label);
      assert.doesNotMatch(ticks[move.startup],/^attack_smear_/,label);
      assert.match(ticks.at(-1)!,/^equipped_\w+_idle_0$/,label);
    }
  }
  assert.equal(covered.size,moves.length);
});
