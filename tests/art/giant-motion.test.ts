import test from 'node:test';
import assert from 'node:assert/strict';
import { GiantMotion } from '../../apps/game/src/render/goliath.ts';
import { createGoliath } from '../../packages/campaign/src/goliath.ts';

test('Goliath moves between ticks at 120 and 144 Hz without advancing grapple contact', () => {
  for (const hz of [60,120,144]) {
    const state=createGoliath(), motion=new GiantMotion(), g=state.giant;
    g.move='throw';
    const positions=new Set<number>();
    for(let paint=0;paint<hz;paint++){
      const time=paint*60/hz, tick=Math.floor(time);
      if(g.frame===tick){
        motion.capture(state,tick);
        g.frame++;g.x+=100;g.height+=1;
      }
      const visual=motion.sample(state,tick+1,time-tick);
      assert.ok(Math.abs(visual.frame-time)<1e-8);
      assert.equal(g.frame,tick+1);
      positions.add(visual.x);
    }
    assert.equal(positions.size,hz);
    motion.capture(state,60);
    g.move='headbutt';g.frame=0;
    assert.equal(motion.sample(state,61,.5).frame,0);
    const next=createGoliath();
    assert.equal(motion.sample(next,61,.5),next.giant);
  }
});
