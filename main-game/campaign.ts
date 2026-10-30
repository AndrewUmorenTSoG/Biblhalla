(function(root:any){
'use strict';
const C=root.BiblhallaContent,S=root.BiblhallaSim,Q=S.Q;
// Explicit objective parameters for all 84 scenes. Counts do not come from UI text.
const specList:any[]=[
['route',6,'Creation day panel'],['escort',4,'River context marker'],['puzzle',3,'Cause and consequence'],['escort',3,'Traveler safe gate'],['carry',3,'Workshop plank'],['latches',3,'Cargo latch'],
['route',4,'Pictogram route'],['escort',3,'Supply cart gate'],['route',2,'Captive gate'],['puzzle',4,'Promise context'],['witness',3,'Provision context'],['carry',3,'Water trough'],
['route',3,'Dream viewpoint'],['carry',3,'Peaceful message'],['carry',3,'Archive page'],['stealth',3,'Lawful doorway'],['carry',1,'Message for Ken'],['carry',3,'Supply bundle'],
['escort',3,'Shoreline marker'],['witness',2,'Bush context'],['escort',1,'Exit lane'],['witness',3,'Departure supply'],['route',3,'Far shore marker'],['route',3,'Supply bay'],
['witness',4,'Covenant station'],['building',4,'Workshop material'],['route',1,'Sentinel exit'],['escort',3,'Safe path'],['carry',3,'Memorial token'],['route',3,'Perimeter station'],
['route',2,'Regroup point'],['puzzle',3,'Call context'],['signals',3,'Lantern signal'],['route',3,'Opening window'],['carry',1,'Training gate frame'],['carry',3,'Gleaning bundle'],
['witness',3,'Listening station'],['route',2,'Rally standard'],['route',3,'Ridge route'],['escort',3,'Model flock bay'],['goliath',3,'Composure station'],['stealth',2,'Quiet cave marker'],
['escort',3,'Crowd lane'],['puzzle',4,'Psalm theme'],['puzzle',2,'Wisdom clue'],['carry',3,'Quarry delivery'],['route',2,'Open exit'],['route',1,'Refuge panel'],
['escort',3,'River context clue'],['latches',3,'Model deck rope'],['witness',3,'Reading station'],['route',3,'Refuge approach'],['carry',3,'Archive label'],['escort',1,'Shelter marker'],
['puzzle',3,'Account panel'],['escort',2,'Ember observation'],['witness',2,'Dawn viewpoint'],['building',3,'Repair material'],['witness',2,'Court dialogue checkpoint'],['building',3,'Model wall stone'],
['witness',3,'Promise lookback'],['witness',2,'Announcement context'],['escort',3,'Traveler lane'],['stealth',3,'Protected route'],['witness',3,'River context'],['puzzle',3,'Response context'],
['carry',3,'Model net supply'],['puzzle',4,'Teaching situation'],['carry',3,'Traveler supply'],['latches',3,'Model deck station'],['carry',7,'Model food exhibit'],['route',3,'Archive stepping route'],
['building',3,'Stretcher model lift'],['route',3,'Route home marker'],['escort',3,'Crowd path'],['witness',3,'Bethany context'],['escort',3,'Observation lane'],['puzzle',3,'Teaching context'],
['witness',3,'Service and supper'],['witness',2,'Restraint and arrest'],['witness',3,'Courtyard context'],['witness',2,'Distant viewpoint'],['witness',3,'Quiet journal marker'],['witness',4,'Gospel context']
];
const chapterColors=['#6b98a2','#c58b51','#bb8469','#c59a61','#778e74','#ae8154','#748e96','#af875e','#7b91a5','#9a858f','#879eaa','#8e9d81','#b19a76','#869ca1'];
const summaries:string[]=[
'Genesis begins with God bringing order and life to creation. The account describes the goodness of the created world and a day of rest.',
'The garden account speaks of human work, companionship and responsibility. The archive paths are imagined teaching spaces, not a reconstruction of Eden.',
'The account of the broken choice describes disobedience, shame and a departure from the garden. The story outcome is fixed; the panels help us follow its consequences.',
'Cain and Abel’s account tells of envy, violence and responsibility for a neighbor. The travelers in this exercise are fictional; helping them does not alter the account.',
'Noah is instructed to build an ark. The workshop is an invented teamwork exercise, separate from the biblical description of Noah’s obedience.',
'The flood account moves through judgment, preservation and a new beginning. The archive’s cargo latches are models; reaching the deck does not cause the covenant.',
'Babel tells of a human project and the scattering of people and languages. The pictured signs invite cooperation without treating a language or people as an enemy.',
'Abram is called to leave familiar surroundings. The archive’s road exercise explores trust and care along an unfamiliar journey.',
'Abram goes to rescue Lot. The gate exercise imagines protecting travelers, while the historical account remains in its context panel.',
'The promise to Abram is remembered through images of descendants and stars. These images are context, not power or rewards.',
'The mountain account ends with provision. Its difficult events are narrated with restraint; the player never performs or prevents a sacrifice.',
'The well account introduces Rebekah and hospitality. Carrying model water gives the friends a practical exercise in service.',
'Jacob dreams of a stairway and hears a promise. The dream is narrated; the observation terraces do not grant access to heaven.',
'Jacob approaches Esau after years apart. Gifts and reconciliation frame this chapter; the friends practice taking a peaceful route.',
'Joseph’s brothers sell him away from his home. Collecting archive pages helps the friends understand the account and cannot undo its events.',
'Joseph’s integrity is tested, and he is unjustly imprisoned. This route exercise concerns a lawful exit, with the historical accusation kept in narration.',
'Joseph serves others in prison. The Gate Warden is an invented training opponent, separate from the prison account.',
'Joseph’s preparation provides food during famine, and the family reunion opens a path toward forgiveness. The Grain Hoarder is a fictional drill.',
'Moses is preserved as an infant beside the river. The skiff in the exercise is an archive model; the historical child is never an at-risk game object.',
'The burning bush account tells of Moses’ call. The viewpoint provides context without inventing a voice for God or a playable form for the divine.',
'Moses confronts Pharaoh in the Exodus account. The separate warden drill cannot cause a plague or change the account’s outcome.',
'Passover and departure are presented as a solemn historical account. Model supplies support a quiet observation route, without a timed test of anyone’s life.',
'The Israelites cross the sea in the narrated account. The route appears after the story cue; player movement neither creates nor controls the miracle.',
'The wilderness accounts include water, manna and conflict. Supplies in the drill are ordinary training props, never miraculous combat powers.',
'The Sinai account describes covenant and instruction. Context stations help the friends listen; performance does not measure someone’s faith.',
'The tabernacle account includes shared skills and materials. These stations build educational models; sacred furnishings remain in narration.',
'The spies return with reports about the land. The Ridge Sentinel is an invented obstacle used to practice careful movement.',
'The wilderness account of looking and living remains in narration. The marked paths are an archive exercise, separate from healing.',
'The Jordan crossing is remembered with stones. The model tokens are teaching props, not the historical stones and not the cause of the crossing.',
'Jericho’s account includes a procession and the fall of its walls. Training waves occur outside that narrated event; trumpets are never weapons.',
'Deborah’s account concerns leadership and deliverance. Regroup points let the friends practice listening and protecting others in a fictional drill.',
'Gideon’s call is presented through account panels. The exercise does not turn prayer or signs into a source of purchased power.',
'The account of Gideon’s three hundred includes lanterns and signals. The archive signals open training paths and are not magical attacks.',
'Samson recalls encountering a lion. The multi-phase Lion drill is fictional and avoids graphic violence.',
'Samson’s gate feat is narrated separately. Carrying the model frame does not give the player limitless strength.',
'Ruth’s account includes gleaning, loyalty and kindness. This is an interlude during the judges, without an asserted date after Samson.',
'Samuel’s call is heard in a quiet account scene. Listening captions and context stations keep narration separate from original game dialogue.',
'Israel asks for a king, and Saul becomes its first king. The rally drill is fictional; kingship does not grant better arena statistics.',
'Jonathan’s account includes courage during a difficult climb. The ridge drill makes its attacks visible before narrow jumps.',
'David recalls protecting his flock. The model flock belongs to an invented Bear drill and is never killed or used as bait.',
'David faces Goliath with a sling and a stone. This special reenactment ends with one decisive aim opportunity rather than repeated damage against the giant.',
'David spares Saul in the cave. This quiet exercise rewards restraint; Saul has no player-targetable combat body.',
'The procession toward Jerusalem is narrated with context. Crowd lanes are ordinary archive paths, and the ark is never a weapon or pickup.',
'The psalms are poetry and prayer. These original theme cards form a thematic interlude without assigning exact dates to the poems.',
'Solomon’s wisdom is illustrated through a difficult judgment. The child is never threatened by player input, and the panel puzzle does not decide the account.',
'The temple account includes building and dedication. Fictional quarry training occurs separately from the worship scene.',
'The kingdom divides. Context includes both sides; the exercise does not label a region or people as inherently evil.',
'Elijah’s account moves through fire and a quiet voice. The Pursuer Captain drill is separate; the player cannot cast or cause the narrated events.',
'Naaman’s healing and return remain fixed in the account. River clues invite observation without offering a health simulation.',
'Jonah’s account moves through flight, a great fish and mercy. The fish is neither a boss nor a mount; the route uses model-deck ropes.',
'Isaiah’s words are read in their prophetic context. Later Christian interpretation is labeled, without invented dates or predictions.',
'The siege account concerns fear, refuge and deliverance. Training waves are separate and do not make the player cause the historical deliverance.',
'The rediscovered book is an archive context exhibit. It is never an upgrade scroll or a score of repentance.',
'Jeremiah’s context includes suffering and exile. Winning the Siege Captain drill cannot erase those historical events.',
'Daniel and his companions remain faithful in a foreign court. The food account is contextual, without a diet stat bonus or medical claim.',
'The furnace account is presented through an external observation route. The historical companions have no life bars and cannot be rescued by a player-made miracle.',
'Daniel’s deliverance is narrated. This dawn route has no lion combat and no timing test that decides his fate.',
'The return and rebuilding begin before the Esther interlude in this broad sequence. Model repair stations are practical teaching exercises.',
'Esther’s appeal belongs to the fixed court account. The Court Warden is a separate invented training opponent, never Haman.',
'Nehemiah’s builders work together under pressure. The model bays become safe through shared work; workers never die offscreen.',
'The promises in Micah and Malachi are labeled lookbacks. They are not newly dated after Nehemiah.',
'Luke’s announcement and visit accounts begin the Gospel chapters. Input cannot make the incarnation happen, and no angel is a combat target.',
'The birth account is presented with distinct Gospel context. The magi are not asserted to arrive on the same night as the shepherds.',
'The family’s journey to Egypt is narrated with restraint. The guarded routes concern fictional travelers, without making children damageable.',
'John the Baptist and the river account prepare the next chapter. Baptism is never a minigame for statistics or salvation.',
'Jesus’ wilderness temptation is narrated. The response panels are an educational exercise, never a sword fight against Satan.',
'The shore accounts tell of calling disciples. Model nets are ordinary props; success cannot manufacture the miraculous catch.',
'The mountain teaching is presented through clearly labeled original summaries. A retry never becomes a judgment of someone’s holiness.',
'The good Samaritan is a parable about being a neighbor. The bandit drill is a labeled parable exercise with an invulnerable traveler.',
'The storm is calmed in the fixed account. The model-deck exercise cannot cause the miracle or turn weather into an enemy.',
'The feeding account is narrated separately. Five model loaves and two model fish are exhibit supplies, never food multiplied by combat.',
'The water account concerns Jesus and Peter. Archive stepping routes are fictional platforms, without a faith meter or alternate rescue outcome.',
'The friends lower a man through a roof in the account. The stretcher model allows cooperation without causing the narrated healing.',
'The journey home draws on a parable of return and welcome. Forgiveness is never a purchasable reward.',
'Zacchaeus’ account concerns encounter and change. Crowd paths and an ordinary tree support observation, without stealing coins for a moral score.',
'The Bethany account describes Lazarus being raised. There is no corpse target, resurrection resource or player timing that causes the event.',
'The entry into Jerusalem remains fixed narration. Opening lanes does not control Jesus or turn crowds into obstacles for points.',
'The teaching and temple context leads toward the final chapter. There is no duel in worship space and no playable Jesus combatant.',
'The supper and service accounts are presented quietly. Exhibit supplies are ordinary objects, without sacramental stat effects.',
'The arrest account includes restraint and the healing context in Luke 22:49–51. The weapon satchel closes; input cannot prevent the arrest.',
'Peter’s denial is narrated without a player choice that rewrites it. The quiet path does not score a person as beyond forgiveness.',
'The cross is described from a distant viewpoint with captions and optional symbols. There are no crucifixion controls, damage bars or alternate outcomes.',
'The burial account provides a quiet transition. Journal markers are ordinary, and nothing collected causes the resurrection.',
'The empty tomb is presented with separate Gospel-context cards. The friends meet at dawn; hope is expressed through the opened path, without a combat skill gate.'
];
function spec(level:any){const [type,count,label]=specList[level.number-1];return {type,count,label};}
function routeMap(level:any){
  const quiet=level.kind==='witness';const base:any={id:'story_'+level.id,name:level.location,main:{id:'floor0',kind:'solid',rectUnits:[-120,-120,1260,200],wallRecoverable:true},platforms:[],blastBoundsUnits:{minX:-400,maxX:4180,minY:-600,maxY:950},spawnFeetUnits:[[80,82],[160,82]],pickupSpawnUnits:[[200,160],[1800,160],[3100,160]]};
  base.platforms.push({id:'floor1',kind:'solid',rectUnits:[quiet?1140:1200,-120,quiet?1260:1200,200],wallRecoverable:true},{id:'floor2',kind:'solid',rectUnits:[quiet?2400:2460,-120,quiet?1400:1340,200],wallRecoverable:true});
  if(!quiet)for(let n=0;n<6;n++)base.platforms.push({id:'ledge'+n,kind:'oneWay',rectUnits:[400+n*500,150+(n%2)*50,210,16]});return base;
}
function create(levelId:string,difficulty='easy',checkpoint:any=null){
  const level=C.campaign.levels.find((l:any)=>l.id===levelId);if(!level)throw Error('Unknown level');
  const cfg=spec(level);const combat=level.combatEnabled&&level.number!==41;
  const s:any={version:1,levelId,level,kind:level.kind,difficulty,phase:'intro',tick:0,stage:'entry',done:[],carry:null,pendingCard:null,combatCleared:false,caption:'Ken: Let’s follow the path together.',captionUntil:240,markers:[],hazards:[],companion:{x:160*Q,y:82*Q,following:true},checkpointEvent:null,result:null,goliath:{stage:0,stone:false,tell:0,open:0},sourceSummary:summaries[level.number-1],config:cfg,world:null};
  const arena=C.maps.maps[(level.chapter-1)%6];
  s.world=S.create({mode:combat?(level.kind==='waves'?'story':'boss'):'training',hero:level.number===41?'david':'dru',inputId:'keyboard',arena:arena.id,difficulty,waves:level.waves,bossName:level.boss?.name,seed:checkpoint?.seed||613891+level.number});
  if(!combat){s.world.fighters=s.world.fighters.slice(0,1);s.world.map=routeMap(level);s.world.fighters[0].x=80*Q;s.world.fighters[0].y=82*Q;}
  s.world.countdown=60;if(level.number===1){s.waitingPlatforms=s.world.map.platforms.filter((p:any)=>p.kind==='oneWay');s.world.map.platforms=s.world.map.platforms.filter((p:any)=>p.kind!=='oneWay');}
  const spread=combat?650:3200;
  for(let n=0;n<cfg.count;n++){
    const x=combat?-330+spread*(cfg.count===1?0.5:n/(cfg.count-1)):360+spread*(n+0.5)/cfg.count;
    const y=!combat&&cfg.type==='route'&&level.number!==75?((n%2===0)?166:80):80;
    s.markers.push({id:n,x:Math.round(x)*Q,y:y*Q,type:cfg.type,label:cfg.label+' '+(n+1),stage:0,done:false,carried:false,dropped:false,targetX:combat?(180+n*45)*Q:Math.round(Math.min(3600,x+190))*Q});
  }
  if(level.number===71)for(const m of s.markers)m.label=m.id<5?'Model loaf '+(m.id+1):'Model fish '+(m.id-4);
  if([32,36,75].includes(level.number)){const extra=level.number===75?'route':level.number===36?'escort':'building';for(let n=0;n<2;n++){const idx=s.markers.length;s.markers.push({id:idx,x:(2800+n*350)*Q,y:(extra==='route'?166:80)*Q,type:extra,label:extra==='route'?'Observation climb '+(n+1):extra==='escort'?'Traveler gate '+(n+1):'Camp station '+(n+1),stage:0,done:false,carried:false,dropped:false,targetX:(3000+n*350)*Q});}}
  if(level.number===80){s.satchelClosed=false;s.markers[0].label='Close weapon satchel';s.markers[1].label='Listen to arrest context';}
  if(!combat&&['survival','escape','stealth'].includes(level.kind))for(let n=0;n<4;n++)s.hazards.push({id:n,x:(700+n*740)*Q,y:80*Q,period:difficulty==='easy'?240:difficulty==='hard'?180:140,tell:difficulty==='easy'?90:60,active:30});
  if(checkpoint&&checkpoint.level===levelId&&checkpoint.stage!=='exit'){
    for(const idx of checkpoint.progress||[])if(s.markers[idx]){s.markers[idx].done=true;s.done.push(idx);}
    s.combatCleared=!!checkpoint.combatCleared;s.stage=checkpoint.stage;
    if(s.combatCleared){s.world.phase='playing';s.world.fighters=s.world.fighters.slice(0,1);s.world.mode='training';}
    if(!combat&&s.stage==='middle_or_phase_two'){s.world.fighters[0].x=1900*Q;s.companion.x=1780*Q;}
  }
  return s;
}
function begin(s:any){if(s.phase==='intro'){s.phase='active';if(s.waitingPlatforms){s.world.map.platforms.push(...s.waitingPlatforms);s.waitingPlatforms=null;}}}
function pause(s:any,on=true){if(on&&s.phase==='active'){s.phase='paused';S.pause(s.world,true);}else if(!on&&s.phase==='paused'){s.phase='active';S.pause(s.world,false);}}
function nearest(s:any){const f=s.world.fighters[0];return s.markers.filter((m:any)=>!m.done&&!(s.level.number===1&&m.id>s.done.length)&&Math.abs((m.carried||m.type==='escort'&&m.stage?m.targetX:m.x)-f.x)<90*Q&&Math.abs(m.y-f.y)<40*Q).sort((a:any,b:any)=>Math.abs(a.x-f.x)-Math.abs(b.x-f.x)||a.id-b.id)[0];}
function checkpoint(s:any){s.stage='middle_or_phase_two';s.checkpointEvent={level:s.levelId,stage:s.stage,progress:[...s.done],combatCleared:s.combatCleared,seed:s.world.options.seed};}
function mark(s:any,m:any){if(m.done)return;m.done=true;m.carried=false;s.done.push(m.id);s.carry=null;s.world.fighters[0].carry=false;s.caption='Checkpoint: '+m.label+' complete.';s.captionUntil=s.tick+180;if(s.done.length>=Math.ceil(s.markers.length/2))checkpoint(s);}
function interact(s:any){
  const f=s.world.fighters[0];if(f.respawn||f.stun||f.action)return;
  const m=nearest(s);
  if(s.carry!==null){const carried=s.markers[s.carry];if(Math.abs(f.x-carried.targetX)<100*Q){mark(s,carried);return;}carried.carried=false;carried.dropped=true;carried.x=f.x;carried.y=f.y;s.carry=null;f.carry=false;s.caption='Supply set down safely. Interact to recover it.';s.captionUntil=s.tick+180;return;}
  if(!m)return;
  if(m.type==='carry'||m.type==='building'){m.carried=true;m.stage=1;s.carry=m.id;f.carry=true;f.action=null;s.caption='Carry to the outlined station. Interact to set down or deliver.';s.captionUntil=s.tick+240;return;}
  if(m.type==='escort'){if(!m.stage){m.stage=1;s.companion.following=true;s.caption='Regroup: Ken will follow to the safe gate.';s.captionUntil=s.tick+200;return;}if(Math.abs(s.companion.x-f.x)<180*Q)mark(s,m);else {s.caption='Wait for Ken at the safe gate.';s.captionUntil=s.tick+160;}return;}
  if(s.level.number===80&&m.id===0)s.satchelClosed=true;
  if(m.type==='witness'||m.type==='puzzle'||m.type==='route'&&s.level.number===1){s.pendingCard=m.id;return;}
  if(m.type==='goliath'){if(!s.goliath.stone){s.goliath.stone=true;s.caption='One stone collected. Visit the composure stations.';s.captionUntil=s.tick+200;}mark(s,m);s.goliath.stage++;return;}
  mark(s,m);
}
function card(s:any,index:number){const m=s.markers[index];if(!m)return null;
  let text=s.sourceSummary,heading=m.label;
  if(s.level.number===84){const texts=[['Matthew 28','Matthew describes the opened tomb, the announcement to the women and the message about meeting in Galilee.'],['Mark 16:1–8','Mark describes the women arriving at the tomb and receiving the announcement that Jesus has risen; the passage ends with fear and amazement.'],['Luke 24','Luke describes the women at the tomb, the announcement by two men and their report to the apostles.'],['John 20','John describes Mary Magdalene at the tomb and the visits of Peter and the other disciple. Mary’s encounter is told in this account.']];heading=texts[index][0];text=texts[index][1];}
  const labels=s.level.number===1?['Light','Sky','Land and plants','Lights in the sky','Living creatures','Humanity and rest']:s.level.number===3?['Goodness and trust','Broken choice','Life outside the garden']:['Observe the account','Connect the context','Follow the account’s order','Remember the source'];
  return {heading,text,reference:s.level.scripture,label:s.level.number===69||s.level.number===74?'Parable context':'Bible account — original summary',puzzle:m.type==='puzzle',choices:[labels[index%labels.length],labels[(index+1)%labels.length],labels[(index+2)%labels.length]],answer:0,prompt:'Select the panel for step '+(index+1)+': '+labels[index%labels.length]};
}
function resolveCard(s:any,answer=0){const idx=s.pendingCard;if(idx===null)return false;const c=card(s,idx);if(c.puzzle&&answer!==c.answer){s.caption='Try the panel again. There is no penalty.';s.captionUntil=s.tick+180;return false;}mark(s,s.markers[idx]);s.pendingCard=null;return true;}
function complete(s:any){if(s.phase==='complete')return;s.phase='complete';s.result={won:true,level:s.levelId,next:s.level.nextLevel};s.caption=s.level.number===84?'Dru: Strength can also mean walking beside a friend.':'Dru: We can keep going. Stay beside me.';checkpoint(s);s.checkpointEvent.stage='exit';s.stage='exit';}
function step(s:any,frame:any={}){
  if(s.phase!=='active'||s.pendingCard!==null)return;
  s.tick++;s.checkpointEvent=null;
  const f=s.world.fighters[0];const priorRespawn=f.respawn;const i=S.input(frame);
  if(!s.level.combatEnabled||s.combatCleared||s.level.number===41){i.light=i.heavy=i.item=false;i.heavyHeld=false;}
  if(s.kind==='witness'){i.jump=i.dodge=false;i.y=0;}
  if(f.carry){i.light=i.heavy=i.item=false;}
  S.step(s.world,{[f.id]:i});
  if(priorRespawn===1&&!s.level.combatEnabled){f.x=(s.stage==='middle_or_phase_two'?1850:80)*Q;f.y=82*Q;f.vx=f.vy=0;}
  if(f.respawn&&s.carry!==null){const m=s.markers[s.carry];m.carried=false;m.dropped=true;m.x=(s.stage==='middle_or_phase_two'?1850:80)*Q;m.y=80*Q;s.carry=null;f.carry=false;}
  if(s.world.phase==='result'){
    if(!s.world.result.won){s.phase='failed';s.result={won:false,reason:s.world.result.reason};return;}
    s.combatCleared=true;s.world.phase='playing';s.world.result=null;s.world.mode='training';s.world.fighters=s.world.fighters.slice(0,1);s.world.projectiles=[];checkpoint(s);s.caption='Training encounter cleared. Finish the marked archive task.';s.captionUntil=s.tick+240;
  }
  const distance=f.x-s.companion.x;const maxSpeed=5*Q;s.companion.x+=Math.max(-maxSpeed,Math.min(maxSpeed,distance-(distance>0?100:-100)*Q));s.companion.y=f.ground?f.y:s.companion.y;
  if(s.kind==='witness'){s.companion.x=f.x-80*Q;s.companion.y=f.y;}
  if(s.kind==='survival'||s.kind==='escape'||s.kind==='stealth'){
    for(const h of s.hazards){const phase=s.tick%h.period;h.state=phase<h.tell?'tell':phase<h.tell+h.active?'active':'safe';if(h.state==='active'&&Math.abs(f.x-h.x)<45*Q&&f.y<150*Q&&!(s.kind==='stealth'&&i.y<0)){f.x=Math.max(80*Q,(s.stage==='middle_or_phase_two'?1850:80)*Q);f.y=82*Q;f.vx=f.vy=0;s.caption=s.kind==='stealth'?'Seen by an archive lookout. Return to the safe route.':'Obstacle touched. Back to the safe checkpoint.';s.captionUntil=s.tick+180;}}
  }
  if(s.level.number===41){
    s.goliath.tell=s.tick%240;
    if(s.goliath.tell<60){s.caption='Giant’s lane sweep — move away from the marked lane.';s.captionUntil=s.tick+2;}
    s.goliath.open=s.goliath.tell>=150&&s.goliath.tell<220?1:0;
    if(s.goliath.tell>=60&&s.goliath.tell<110&&f.x>2800*Q&&f.x<3500*Q&&f.y<150*Q){f.x=2600*Q;f.y=82*Q;f.vx=f.vy=0;s.caption='The marked lane is unsafe. Regroup, then wait for the opening.';s.captionUntil=s.tick+120;}
    if(s.goliath.stage>=3&&s.goliath.stone&&s.goliath.open&&i.interact&&f.x>3200*Q){s.combatCleared=true;s.caption='One decisive stone. The account continues without graphic aftermath.';s.captionUntil=s.tick+360;complete(s);return;}
  }
  if(i.interact)interact(s);
  if(!s.level.combatEnabled)s.combatCleared=true;
  if(s.level.number===41)s.combatCleared=false;
  if(s.done.length===s.markers.length&&s.combatCleared){const returnRoute=[13,42].includes(s.level.number);const exit=returnRoute?120*Q:s.level.combatEnabled?350*Q:3650*Q;if(returnRoute?f.x<=exit:f.x>=exit){if(s.kind==='witness'||s.level.number>=79)complete(s);else if(i.interact)complete(s);}}
  if(f.x>1800*Q&&!s.level.combatEnabled&&s.stage==='entry')checkpoint(s);
  if(s.world.fighters[0].respawn){s.world.fighters[0].stocks=3;if(s.world.fighters[0].respawn===1){s.world.fighters[0].x=(s.stage==='middle_or_phase_two'?1850:80)*Q;s.world.fighters[0].y=82*Q;}}
}
root.BiblhallaCampaign={create,begin,pause,step,spec,card,resolveCard,interact,mark,complete,chapterColors,summaries};
})(globalThis);
