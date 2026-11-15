import test from 'node:test';
import assert from 'node:assert/strict';
import { GiantMotion, slamPose } from '../../apps/game/src/render/goliath.ts';
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

test('shield rises from guard at every difficulty and descends before the wave starts', () => {
  for(const duration of [60,90]){
    const state=createGoliath();
    state.tell=duration;
    state.advance.state='tell';
    state.advance.ticks=duration;
    assert.deepEqual(slamPose(state),{lift:0,strike:0});
    state.advance.ticks=duration-24;
    assert.deepEqual(slamPose(state),{lift:1,strike:0});
    state.advance.ticks=4;
    assert.ok(slamPose(state,.5).strike<slamPose(state,1).strike);
    state.advance.ticks=1;
    assert.ok(slamPose(state).strike>.8);
    state.advance.state='active';
    state.advance.ticks=48;
    assert.deepEqual(slamPose(state),{lift:0,strike:1});
    state.advance.ticks=18;
    assert.equal(slamPose(state).strike,.5);
  }
});
