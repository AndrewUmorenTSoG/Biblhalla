import { RunDistance, goliathStride } from '../../apps/game/src/render/animation.ts';
import test from 'node:test';
import assert from 'node:assert/strict';

test('Goliath completes alternate footfalls and retraces his steps while backing up',()=>{
  const travel = new RunDistance();
  const step = 180 * 118 * 3 / 384;
  const pose = (x:number)=>goliathStride(travel.phase(2,x,1,step));
  travel.capture(2,0,0,true,1);
  const outbound: ReturnType<typeof goliathStride>[] = [];
  for(let tick=1;tick<=60;tick++){
    const x=tick*step/30;
    travel.capture(2,x,tick,true,1);
    outbound.push(pose(x));
  }
  assert.equal(new Set(outbound.map(p=>p.frame)).size,12);
  assert.equal(outbound[29].frame,26);
  assert.equal(outbound[59].frame,16);
  assert.ok(outbound.every(p=>p.lift>0 ? p.frame===20 || p.frame===25 : true));
  for(let tick=1;tick<60;tick++){
    const x=(60-tick)*step/30;
    travel.capture(2,x,60+tick,true,1);
    assert.equal(pose(x).frame,outbound[59-tick].frame);
  }
});
