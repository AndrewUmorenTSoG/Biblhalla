import test from 'node:test';
import assert from 'node:assert/strict';
import { S, content } from '../helpers/engine.ts';
import { MOSES_PARTS, MOSES_ENDING, mosesFightOptions, mosesMap } from '../../packages/campaign/src/moses.ts';
import { createProfiles, seal } from '../../apps/game/src/storage/profile.ts';

test('Moses tells all 28 requested opening panels and the victory ending',()=>{
 assert.deepEqual(MOSES_PARTS.map(p=>p.slides.length),[9,4,5,5,5]);
 for(const p of MOSES_PARTS)for(const slide of p.slides)assert.ok(slide.scene>=0&&slide.scene<p.columns*p.rows);
 assert.equal(MOSES_ENDING.length,2);assert.match(MOSES_ENDING[1].text,/power was displayed/);
});
for(let part=0;part<5;part++){
 test(`Moses part ${part+1} starts with staff, correct opponents and a dedicated arena`,()=>{
  const s=S.create(mosesFightOptions(part,'hard','keyboard'));
  assert.equal(s.fighters[0].hero,'moses');assert.equal(s.fighters[0].weapon,'staff');assert.equal(s.fighters[0].stocks,3);
  assert.equal(s.fighters.length,[5,3,4,4,4][part]);assert.equal(s.map.id,'moses-'+part);
  assert.equal(new Set(s.fighters.map(f=>f.inputId)).size,s.fighters.length);
  assert.ok(s.fighters.slice(1).every(f=>!f.human&&f.team===1&&f.stocks===1&&f.skin));
  assert.ok(!s.fighters.some(f=>/Pharaoh|Aaron/.test(f.name)));
 });
 test(`Moses part ${part+1} requires every opponent to be ringed out`,()=>{
  const s=S.create(mosesFightOptions(part,'easy','keyboard'));s.phase='playing';
  for(const f of s.fighters.slice(1)){f.guard=0;f.damage=9990;}
  S.step(s);assert.equal(s.phase,'playing');
  s.fighters[1].stocks=0;S.step(s);assert.equal(s.phase,'playing');
  for(const f of s.fighters.slice(1))f.stocks=0;
  S.step(s);assert.equal(s.phase,'result');assert.equal(s.result?.won,true);
 });
}
test('three magicians take coordinated casting turns without overlapping tells or active spells',()=>{
 const s=S.create(mosesFightOptions(4,'hard','keyboard'));s.phase='playing';const seen=new Set<string>();
 for(let tick=0;tick<1800;tick++){
  const p=s.fighters[0];p.invulnerable=999;p.x=0;p.y=80*S.Q;p.ground=s.map.main.id;
  S.step(s);
  const casters=s.fighters.slice(1).filter(f=>{const r=f.partner?.run??s.bossRun!;return r.stage==='tell'||r.stage==='active';});
  assert.ok(casters.length<=1,'only one telegraphed spell can occupy the attack turn');
  for(const f of casters)seen.add(f.skin!);
 }
 assert.deepEqual([...seen].sort(),['mage-fire','mage-lightning','mage-shadow']);
 assert.ok(s.fighters.slice(1).every(f=>f.damage===0),'allied spells do not hurt magicians');
});
test('final arena has a raised centre and two reachable side routes',()=>{
 const m=mosesMap(4);assert.equal(m.platforms.length,3);assert.equal(m.main.rectUnits[2],1120);
 const heights=m.platforms.map(p=>p.rectUnits[1]);assert.deepEqual(heights,[220,145,145]);
 assert.ok(m.platforms.every(p=>p.kind==='oneWay'));assert.equal(m.competitiveApproved,false);
});
test('Moses progress is independent, bounded and backward-compatible',()=>{
 const profiles=createProfiles(content),store=new profiles.Store();
 store.import(seal({...profiles.defaults(),davidWins:2,mosesWins:4}));assert.equal(store.data.mosesWins,4);assert.equal(store.data.davidWins,2);
 store.import(seal({...profiles.defaults(),mosesWins:999}));assert.equal(store.data.mosesWins,5);
 const old:any={...profiles.defaults()};delete old.mosesWins;store.import(seal(old));assert.equal(store.data.mosesWins,0);
});
test('five-fighter Moses recordings replay deterministically and reject changed campaign geometry',()=>{
 const s=S.create(mosesFightOptions(0,'hard','keyboard'));const initial=S.snapshot(s),entries:any[]=[];
 for(let tick=0;tick<360;tick++){const frames={keyboard:{x:tick%100<50?1:-1,jump:tick%50===0,light:tick%30===0}};S.step(s,frames);entries.push({kind:'input',frames});}
 const replay={schema:1,contentHash:S.content.hash,initial,entries,finalHash:S.hash(s)};
 assert.equal(S.simulateReplay(replay).verified,true);
 const changed=structuredClone(replay);changed.initial.options.arenaOverride!.main.rectUnits[2]=99999;
 assert.throws(()=>S.validateReplay(changed),/Moses encounter/);
});
for(const skin of ['mage-fire','mage-shadow','mage-lightning'])test(skin+' recovers to the main platform after a reachable ledge launch',()=>{
 const s=S.create(mosesFightOptions(4,'hard','keyboard'));s.phase='playing';const f=s.fighters.find(f=>f.skin===skin)!;
 f.ground=null;f.x=-590*S.Q;f.y=85*S.Q;f.vy=-S.Q;
 for(let tick=0;tick<180&&!f.ground;tick++)S.step(s);
 assert.ok(f.ground);assert.equal(f.stocks,1);
});

test('story continuation saves an unfinished first battle without removing unlocked chapters', () => {
 const profiles = createProfiles(content), store = new profiles.Store();
 store.import(seal({...profiles.defaults(), storyHero:'moses', storyStarted:true, storyPart:0, mosesWins:5}));
 assert.equal(store.data.storyPart,0);
 assert.equal(store.data.mosesWins,5);
 store.import(seal({...store.data, storyPart:null}));
 assert.equal(store.data.storyPart,null);
 const old:any={...profiles.defaults(), storyHero:'moses', mosesWins:2};
 delete old.storyPart;delete old.storyStarted;
 store.import(seal(old));assert.equal(store.data.storyPart,2);
 store.import(seal({...old,storyPart:999}));assert.equal(store.data.storyPart,2);
});
