(function(root: any) {
'use strict';
type Input = { x?: number; y?: number; jump?: boolean; jumpHeld?: boolean; light?: boolean; heavy?: boolean; heavyHeld?: boolean; dodge?: boolean; item?: boolean; interact?: boolean };
type Action = { kind: string; tick: number; duration: number; instance: number; facing: number; move?: string; hit: number[]; charge: number; cancelled?: boolean; dx?: number; dy?: number; airborne?: boolean; itemId?: number; weapon?: string; confirmed?: boolean; landed?: boolean };
type Fighter = { id: number; hero: string; human: boolean; inputId: string; team: number; x: number; y: number; vx: number; vy: number; kx: number; facing: number; ground: string | null; stocks: number; damage: number; weapon: string; nextWeapon: number; jumps: number; recovery: number; dodgeCD: number; dashCD: number; wallTicks: number; wallRefresh: number; wallSide: number; wallUsed: number; groundedTicks: number; coyote: number; drop: number; invulnerable: number; respawn: number; stun: number; hitstop: number; chase: number; action: Action | null; buffer: any; jumpCut: boolean; ai: any; guard: number | null; maxGuard: number | null; scale: number; stats: any; name: string; score: number; damageDealt: number; hits: number; carry: boolean };
const Q = 256;
const C = root.BiblhallaContent;
const P = C.physics, R = C.rules;
const moves = Object.fromEntries(C.attacks.attacks.map((m: any) => [m.id, m]));
const defs = Object.fromEntries(C.fighters.fighters.map((f: any) => [f.id, f]));
defs.dru = {id:'dru',name:'Dru',weaponPair:['sword','staff'],stats:{power:5,guard:5,speed:5}};
defs.ken = {id:'ken',name:'Ken',weaponPair:['staff','sling'],stats:{power:5,guard:5,speed:5}};
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const roundMul = (n: number, p: number, d = 1000) => Math.floor((n * p + Math.floor(d/2))/d);
const approach = (a: number,b: number,v: number) => a < b ? Math.min(b,a+v) : Math.max(b,a-v);
function rng(s: any) { let x = s.rng|0; x ^= x<<13; x ^= x>>>17; x ^= x<<5; s.rng=x>>>0; return s.rng; }
function event(s: any,type: string, data: any={}) { s.events.push({id:++s.eventId,tick:s.tick,type,...data}); }
function input(i: Input = {}) { return {x:Math.sign(i.x||0),y:Math.sign(i.y||0),jump:!!i.jump,jumpHeld:!!i.jumpHeld,light:!!i.light,heavy:!!i.heavy,heavyHeld:!!i.heavyHeld,dodge:!!i.dodge,item:!!i.item,interact:!!i.interact}; }
function createFighter(s: any, cfg: any, slot: number): Fighter {
  const hero = defs[cfg.hero] ? cfg.hero : 'david', def = defs[hero];
  const pt = s.map.spawnFeetUnits[slot % s.map.spawnFeetUnits.length];
  return {id:++s.entityId,hero,name:cfg.name||def.name,human:!!cfg.human,inputId:cfg.inputId||'keyboard',team:cfg.team??slot,x:pt[0]*Q,y:pt[1]*Q,vx:0,vy:0,kx:0,facing:slot%2?-1:1,ground:null,stocks:cfg.stocks??R.stockDefault,damage:0,weapon:'unarmed',nextWeapon:0,jumps:P.airJumps,recovery:1,dodgeCD:0,dashCD:0,wallTicks:0,wallRefresh:1,wallUsed:0,wallSide:0,groundedTicks:0,coyote:0,drop:0,invulnerable:0,respawn:0,stun:0,hitstop:0,chase:0,action:null,buffer:null,jumpCut:false,ai:{next:0,intent:input(),history:[],tell:0,tellDir:1,phase:1},guard:cfg.guard??null,maxGuard:cfg.guard??null,scale:cfg.scale||1,stats:{...def.stats},score:0,damageDealt:0,hits:0,carry:false};
}
function create(options: any = {}) {
  const map = C.maps.maps.find((m: any)=>m.id===options.arena)||C.maps.maps[0];
  const difficulty = R.difficulty[options.difficulty] ? options.difficulty : 'easy';
  const mode = ['duel','waves','boss','training','local','teams','ffa','story'].includes(options.mode) ? options.mode : 'duel';
  const s: any = {version:1,contentHash:C.hash||'development',tick:0,rng:(options.seed>>>0)||613891,entityId:0,eventId:0,phase:'countdown',countdown:150,resumePhase:null,mode,difficulty,map:JSON.parse(JSON.stringify(map)),fighters:[],projectiles:[],items:[],events:[],remaining:R.matchTicks,result:null,wave:0,waveWait:0,wavePending:[],waves:options.waves||[['road_guard','road_guard'],['archer','brute'],['shield_guard','road_guard','archer']],pickupTick:R.pickups.initialTick,pickupCycle:0,pickupPriority:0,friendlyFire:!!options.friendlyFire,trainingBot:options.trainingBot||'idle',bossName:options.bossName||'Training champion',suddenDeath:false,totalEnemies:0,options:JSON.parse(JSON.stringify(options))};
  if(options.fighters) s.fighters=options.fighters.map((f: any,i: number)=>createFighter(s,f,i));
  else {
    s.fighters.push(createFighter(s,{hero:options.hero||'david',human:true,team:0,inputId:options.inputId||'keyboard'},0));
    if(mode==='waves'||mode==='story') scheduleWave(s);
    else s.fighters.push(createFighter(s,{hero:options.opponent||(options.hero==='samson'?'david':'samson'),team:1,stocks:mode==='boss'?1:R.stockDefault,guard:mode==='boss'?1700:null,scale:mode==='boss'?1.45:1,name:mode==='boss'?s.bossName:undefined},1));
  }
  return s;
}
function pause(s: any,on=true) { if(on&&s.phase!=='paused'&&s.phase!=='result'){s.resumePhase=s.phase;s.phase='paused';for(const f of s.fighters)f.buffer=null;}else if(!on&&s.phase==='paused'){s.phase=s.resumePhase||'playing';s.resumePhase=null;} }
function scheduleWave(s: any) {
  if(s.wave>=s.waves.length){finish(s,true,'All waves cleared');return;}
  s.wave++; s.wavePending=[...s.waves[s.wave-1]]; s.waveWait=90;
  event(s,'wave',{wave:s.wave});
}
const enemyHero: any={road_guard:'joshua',archer:'jonathan',shield_guard:'saul',brute:'samson',captain:'caleb',spear_guard:'caleb',runner:'esther'};
function arrivals(s: any) {
  if(s.waveWait>0){s.waveWait--;return;}
  if(s.wavePending[0]==='__next'){s.wavePending=[];scheduleWave(s);return;}
  const live=s.fighters.filter((f: Fighter)=>!f.human&&f.stocks>0).length;
  const cap=s.difficulty==='easy'?2:3;
  if(s.wavePending.length&&live<cap){const role=s.wavePending.shift();const f=createFighter(s,{hero:enemyHero[role]||'joshua',team:1,stocks:1,name:role.replace(/_/g,' ')},1+s.totalEnemies%3);f.weapon=defs[f.hero].weaponPair[0];f.invulnerable=30;s.fighters.push(f);s.totalEnemies++;s.waveWait=40;event(s,'arrival',{fighter:f.id});}
  if(!s.wavePending.length&&!s.fighters.some((f: Fighter)=>!f.human&&f.stocks>0)){s.fighters=s.fighters.filter((f: Fighter)=>f.human);if(s.waveWait===0){s.waveWait=120;s.wavePending=['__next'];}}
  if(s.wavePending[0]==='__next'){s.wavePending=[];scheduleWave(s);s.waveWait=120;}
}
function selectMove(f: Fighter,i: any,grounded = !!f.ground) {
  const dir = i.y<0 ? 'down' : i.x ? 'side' : 'neutral';
  if(i.heavy) {
    if(!grounded) return moves[f.weapon+(dir==='down'?'_ground_pound':'_recovery')];
    if(f.weapon==='unarmed') return moves['unarmed_'+({neutral:'nsig',side:'ssig',down:'dsig'} as any)[dir]];
    return moves[f.hero+'_'+f.weapon+'_'+({neutral:'nsig',side:'ssig',down:'dsig'} as any)[dir]] || moves['unarmed_'+({neutral:'nsig',side:'ssig',down:'dsig'} as any)[dir]];
  }
  return moves[f.weapon+'_'+({neutral:grounded?'nlight':'nair',side:grounded?'slight':'sair',down:grounded?'dlight':'dair'} as any)[dir]];
}
function action(s: any,f: Fighter,kind: string,duration: number,extra: any={}) {f.action={kind,tick:0,duration,instance:++s.entityId,facing:f.facing,hit:[],charge:0,...extra};f.buffer=null;}
function startAttack(s: any,f: Fighter,i: any,airCancel=false) {
  if(f.carry)return false;
  const m=selectMove(f,i,airCancel||!!f.ground);if(!m)return false;
  if(m.resourceCostOnActionStart.recovery&&f.recovery===0)return false;
  if(m.resourceCostOnActionStart.recovery)f.recovery--;
  if(i.x)f.facing=i.x;
  action(s,f,'attack',m.totalTicks,{move:m.id,cancelled:airCancel});f.invulnerable=0;
  if(airCancel)f.vy=0;
  event(s,'attack',{fighter:f.id,move:m.id});return true;
}
function eligibleItem(s: any,f: Fighter) {
  return s.items.filter((it: any)=>!it.claim&&(it.neutral||defs[f.hero].weaponPair.includes(it.weapon))&&Math.abs(it.x-f.x)<=R.pickups.radiusUnits*Q&&Math.abs(it.y-f.y)<=R.pickups.maxVerticalUnits*Q).sort((a: any,b: any)=>Math.abs(a.x-f.x)-Math.abs(b.x-f.x)||a.id-b.id)[0];
}
function resolveAction(s: any,f: Fighter,i: any) {
  if(i.jump||i.heavy||i.light)f.buffer={type:i.jump?'jump':i.heavy?'heavy':'light',ticks:P.inputBufferTicks,x:i.x,y:i.y};
  const a=f.action;
  if(a?.kind==='dodge'&&a.airborne&&!a.dx&&!a.dy&&!a.cancelled&&a.tick>=P.airCancel.firstActionTick&&a.tick<=P.airCancel.lastActionTickInclusive){const b=f.buffer;if(b&&(b.type==='heavy'||b.type==='light')){const next={...i,x:b.x,y:b.y,heavy:b.type==='heavy',light:b.type==='light'};if(startAttack(s,f,next,true))return;}}
  if(a?.kind==='attack'&&i.dodge&&i.x&&f.chase>0){const m=moves[a.move!];if(m.chaseCancelOnConfirmedHit&&a.confirmed&&a.tick>=m.startup+m.active){action(s,f,'chase',P.chase.durationTicks,{dx:i.x*P.chase.speedQ,dy:i.y*P.chase.speedQ});f.chase=0;return;}}
  if(a&&!(a.kind==='dash'&&i.jump))return;
  if(f.stun||f.carry&&i.light)return;
  if(i.jump&&i.y<0&&f.ground&&s.map.platforms.some((pl:any)=>pl.id===f.ground&&pl.kind==='oneWay')){f.drop=P.dropThroughTicks;f.y-=Q;f.ground=null;f.buffer=null;return;}
  if(i.dodge){
    if(f.chase>0&&(i.x||i.y)){action(s,f,'chase',P.chase.durationTicks,{dx:i.x*P.chase.speedQ,dy:i.y*P.chase.speedQ});f.chase=0;return;}
    if(f.ground&&i.x&&f.dashCD===0){f.facing=i.x;f.dashCD=P.dash.repeatLockTicks;action(s,f,'dash',P.dash.durationTicks,{dx:i.x*P.dash.speedQ});return;}
    if(f.dodgeCD===0){const air=!f.ground;f.dodgeCD=air?P.dodge.air.cooldown:P.dodge.ground.cooldown;action(s,f,'dodge',20,{airborne:air,dx:air?i.x*P.dodge.air.speedQ:0,dy:air?i.y*P.dodge.air.speedQ:0});return;}
  }
  if(i.item&&!f.carry){
    if(f.weapon==='unarmed'){const it=eligibleItem(s,f);if(it){it.claim=f.id;action(s,f,'pickup',R.pickups.acquireTicks,{itemId:it.id});return;}}
    else {action(s,f,i.y<0?'drop':'throw',i.y<0?15:23,{weapon:f.weapon,dx:i.x,dy:i.y});f.invulnerable=0;return;}
  }
  let b=f.buffer;
  if(b?.type==='jump'){
    if(f.wallSide&&f.jumps>0){f.jumps--;f.vx=-f.wallSide*P.wall.jumpAwayQ;f.vy=P.wall.jumpUpQ;f.facing=-f.wallSide;f.ground=null;f.action=null;f.buffer=null;f.jumpCut=true;(f as any).jumpTick=s.tick;event(s,'jump',{fighter:f.id});return;}
    if(f.ground||f.coyote>0||f.jumps>0){const ground=!!f.ground||f.coyote>0;if(ground)f.jumps=P.airJumps;else f.jumps--;f.vy=ground?P.groundJumpQ:P.airJumpQ;f.vx=clamp(f.vx,-P.dash.dashJumpCapQ,P.dash.dashJumpCapQ);f.ground=null;f.coyote=0;f.action=null;f.buffer=null;f.jumpCut=true;(f as any).jumpTick=s.tick;event(s,'jump',{fighter:f.id});return;}
  }
  if(b&&(b.type==='heavy'||b.type==='light'))startAttack(s,f,{...i,x:b.x,y:b.y,heavy:b.type==='heavy',light:b.type==='light'});
}
function platforms(s: any) {return [s.map.main,...s.map.platforms].sort((a: any,b: any)=>a.id.localeCompare(b.id));}
function moveFighter(s: any,f: Fighter,dx: number,dy: number) {
  const oldX=f.x,oldY=f.y;let nx=oldX+dx,ny=oldY+dy;f.wallSide=0;
  const width=20*Q,height=74*Q; let contact:string|null=null;
  for(const pl of platforms(s)){
    const [ux,uy,uw,uh]=pl.rectUnits;const left=ux*Q,right=(ux+uw)*Q,bottom=uy*Q,top=(uy+uh)*Q;
    if(pl.kind==='solid'){
      if(oldY<top&&oldY+height>bottom){
        if(dx>0&&oldX+width<=left&&nx+width>left){nx=left-width;f.vx=0;f.kx=0;f.wallSide=1;}
        if(dx<0&&oldX-width>=right&&nx-width<right){nx=right+width;f.vx=0;f.kx=0;f.wallSide=-1;}
      }
      if(dy>0&&oldY+height<=bottom&&ny+height>bottom&&nx+width>left&&nx-width<right){ny=bottom-height;f.vy=0;}
    }
    if(dy<=0&&oldY>=top&&ny<=top&&nx+width>left&&nx-width<right&&!(pl.kind==='oneWay'&&f.drop>0)){
      if(!contact||top>ny){ny=top;f.vy=0;contact=pl.id;}
    }
    if(pl.kind==='solid'&&oldY<top&&oldY+height>bottom){if(Math.abs(nx+width-left)<=Q)f.wallSide=1;if(Math.abs(nx-width-right)<=Q)f.wallSide=-1;}
  }
  if(f.ground&&!contact)f.coyote=P.coyoteTicks;
  f.x=Math.trunc(nx);f.y=Math.trunc(ny);f.ground=contact;
  if(contact){f.groundedTicks++;if(f.groundedTicks>=P.groundResetContactTicks){f.jumps=P.airJumps;f.recovery=1;f.wallTicks=0;f.wallRefresh=1;f.wallUsed=0;f.dodgeCD=Math.min(f.dodgeCD,P.dodge.landingCooldownClamp);}}
  else {f.groundedTicks=0;if(f.wallSide&&f.wallRefresh){f.wallRefresh=0;f.jumps=P.airJumps;f.recovery=1;}}
  if(contact&&f.action?.kind==='attack') {const m=moves[f.action.move!];if(m.landingRule==='endActiveThenRecoveryPlus8'&&!f.action.landed&&f.action.tick>=m.startup){f.action.tick=m.startup+m.active;f.action.duration=m.totalTicks+8;f.action.landed=true;}}
}
function rectFor(f: Fighter,rect: number[],facing=f.facing){const [x,y,w,h]=rect;return [f.x+(facing>0?x:-x-w)*Q,f.y+y*Q,w*Q,h*Q];}
function capsuleRect(f: Fighter,b: number[]) {
  const [x,y,w,h]=b,r=20*Q*f.scale;const bottom=f.y+20*Q*f.scale,top=f.y+54*Q*f.scale;
  const px=clamp(f.x,x,x+w);const sy=clamp((y+y+h)/2,bottom,top);const py=clamp(sy,y,y+h);const dx=px-f.x,dy=py-sy;
  return dx*dx+dy*dy<=r*r;
}
function overlap(a: number[],b: number[]){return a[0]<=b[0]+b[2]&&a[0]+a[2]>=b[0]&&a[1]<=b[1]+b[3]&&a[1]+a[3]>=b[1];}
function segmentBox(x: number,y: number,nx: number,ny: number,b: number[]){let t0=0,t1=1;const dx=nx-x,dy=ny-y;for(const [v,q] of [[-dx,x-b[0]],[dx,b[0]+b[2]-x],[-dy,y-b[1]],[dy,b[1]+b[3]-y]]){if(v===0){if(q<0)return false;}else {const t=q/v;if(v<0)t0=Math.max(t0,t);else t1=Math.min(t1,t);if(t0>t1)return false;}}return true;}
function invincible(f: Fighter){if(f.invulnerable)return true;const a=f.action;if(a?.kind!=='dodge')return false;return a.tick>=3&&a.tick<(a.airborne?13:15);}
function startProjectile(s: any,f: Fighter,m: any,a: Action) {
  const p=m.projectile;if(!p||s.projectiles.filter((t: any)=>t.owner===f.id&&t.capClass===p.capClass).length>=1){if(p)event(s,'fizzle',{fighter:f.id});return;}
  const dir=P.directionLookup[String(p.travelAngle)]||P.directionLookup['0'];
  s.projectiles.push({id:++s.entityId,owner:f.id,team:f.team,move:m.id,instance:a.instance,facing:a.facing,x:f.x+p.originUnits[0]*Q*a.facing,y:f.y+p.originUnits[1]*Q,vx:roundMul(p.speedQ,dir[0],1024)*a.facing,vy:roundMul(p.speedQ,dir[1],1024),gravity:p.gravityQ,life:p.lifetimeTicks,size:p.collisionUnits,capClass:p.capClass,charge:a.charge,weapon:null});event(s,'projectile',{fighter:f.id});
}
function releaseItem(s: any,f: Fighter,a: Action){
  if(a.kind==='pickup'){
    const it=s.items.find((it: any)=>it.id===a.itemId&&it.claim===f.id);if(it){f.weapon=it.neutral?defs[f.hero].weaponPair[f.nextWeapon%2]:it.weapon;if(it.neutral){f.nextWeapon++;s.pickupPriority++;}s.items=s.items.filter((v: any)=>v.id!==it.id);event(s,'pickup',{fighter:f.id,weapon:f.weapon});}return;
  }
  if(a.kind==='drop'){s.items.push({id:++s.entityId,x:f.x+24*Q*a.facing,y:f.y+25*Q,vy:0,life:R.drop.lifetimeTicks,neutral:false,weapon:f.weapon,claim:null});f.weapon='unarmed';return;}
  const angle=a.dy? a.dx?(a.dy>0?45:-45):(a.dy>0?90:-90):0;const dir=P.directionLookup[String(angle)];
  s.projectiles.push({id:++s.entityId,owner:f.id,team:f.team,move:'throw',instance:a.instance,facing:a.dx||a.facing,x:f.x+24*Q*a.facing,y:f.y+40*Q,vx:roundMul(R.throw.speedQ,dir[0],1024)*(a.dx||a.facing),vy:roundMul(R.throw.speedQ,dir[1],1024),gravity:R.throw.gravityQ,life:R.throw.lifetimeTicks,size:[18,18],capClass:'throw',charge:0,weapon:f.weapon});f.weapon='unarmed';event(s,'throw',{fighter:f.id});
}
function updateFighter(s: any,f: Fighter,i: any){
  for(const key of ['dodgeCD','dashCD','invulnerable','coyote','drop','chase'] as const)if(f[key]>0)f[key]--;
  if(f.buffer&&--f.buffer.ticks<0)f.buffer=null;
  if(!f.stocks)return;
  if(f.respawn){if(--f.respawn===0){const pt=s.map.spawnFeetUnits[(f.id-1)%s.map.spawnFeetUnits.length];f.x=pt[0]*Q;f.y=pt[1]*Q;f.vx=f.vy=f.kx=0;f.damage=0;f.invulnerable=R.respawnInvulnerabilityTicks;f.jumps=P.airJumps;f.recovery=1;f.dodgeCD=0;f.wallTicks=0;f.wallRefresh=1;f.ground=null;event(s,'respawn',{fighter:f.id});}return;}
  if(f.hitstop){f.hitstop--;return;}
  if(f.stun)f.stun--;else resolveAction(s,f,i);
  const a=f.action;
  let dx=0, freezeY=false,jumpLaunch=(f as any).jumpTick===s.tick;
  if(!a&&!f.stun){const cap=P.runMaxQ+P.runSpeedPerStatQ*(f.stats.speed-5);f.vx=approach(f.vx,i.x*cap,i.x?(f.ground?P.groundAccelerationQ:P.airAccelerationQ):f.ground?P.groundBrakeQ:48);if(i.x)f.facing=i.x;}
  else if(a?.kind==='dash'||a?.kind==='chase'){f.vx=a.dx||0;if(a.kind==='chase'&&a.dy)f.vy=a.dy;}
  else f.vx=approach(f.vx,0,f.ground?P.groundBrakeQ:48);
  if(a?.kind==='dodge'&&a.airborne&&a.tick>=3&&a.tick<13){f.vx=a.dx||0;f.vy=a.dy||0;freezeY=true;}
  if(a?.kind==='attack'){
    const m=moves[a.move!];
    if(a.cancelled&&a.tick<m.startup+m.active)freezeY=true;
    for(const ev of m.motionEvents){if(ev.kind==='setVelocity'&&ev.atTick===a.tick){f.vx=ev.vxQ*a.facing;f.vy=ev.vyQ;f.jumpCut=false;jumpLaunch=true;}if(ev.kind==='translate'&&a.tick>=ev.fromTick&&a.tick<ev.toTickExclusive){dx+=ev.dxQ*a.facing;f.vy+=ev.dyQ;}}
    if(m.projectile?.spawnTick===a.tick)startProjectile(s,f,m,a);
  }
  if(a?.kind==='throw'&&a.tick===R.throw.startup){a.dx=i.x;a.dy=i.y;}
  if(a&&(a.kind==='throw'&&a.tick===R.throw.startup||a.kind==='drop'&&a.tick===R.drop.startup||a.kind==='pickup'&&a.tick===a.duration-1))releaseItem(s,f,a);
  if(f.jumpCut&&!i.jumpHeld&&f.vy>0&&!jumpLaunch){f.vy=Math.min(f.vy,P.jumpCutCapQ);f.jumpCut=false;}
  if(!freezeY&&!jumpLaunch){f.vy=Math.max(i.y<0&&f.vy<0?-P.fastFallCapQ:-P.fallCapQ,f.vy-P.gravityQ*(i.y<0&&f.vy<0?2:1));}
  if(f.wallSide&&i.x===f.wallSide&&f.vy<0&&f.wallTicks<P.wall.maxCumulativeTicks){f.wallTicks++;f.vy=Math.max(f.vy,-P.wall.slideFallCapQ);}
  f.kx=approach(f.kx,0,P.knockbackDecayXQ);
  moveFighter(s,f,f.vx+f.kx+dx,freezeY&&a?.cancelled?0:f.vy);
  if(a){const m=a.move?moves[a.move]:null;if(m?.chargeable&&a.tick===m.startup-1&&i.heavyHeld&&a.charge<m.chargeMaxTicks)a.charge++;else a.tick++;if(a.tick>=a.duration)f.action=null;}
}
function bot(s: any,f: Fighter){
  if(s.mode==='training'&&s.trainingBot==='idle')return input();
  const enemies=s.fighters.filter((t: Fighter)=>t.id!==f.id&&t.team!==f.team&&t.stocks&& !t.respawn);
  const t=enemies.sort((a: Fighter,b: Fighter)=>Math.abs(a.x-f.x)-Math.abs(b.x-f.x)||a.id-b.id)[0];if(!t)return input();
  const d=R.difficulty[s.difficulty];f.ai.history.push({x:t.x,y:t.y,action:t.action?.kind||'',tick:s.tick});if(f.ai.history.length>64)f.ai.history.shift();
  const seen=f.ai.history[Math.max(0,f.ai.history.length-1-d.reactionTicks)];
  if(f.guard!==null){
    f.ai.phase=f.guard!<f.maxGuard!*0.3?3:f.guard!<f.maxGuard!*0.65?2:1;
    if(f.ai.tell>0){f.ai.tell--;if(f.ai.tell===0)return input({x:f.ai.tellDir,heavy:true});return input();}
  }
  if(s.tick<f.ai.next)return {...f.ai.intent,jump:false,light:false,heavy:false,item:false,dodge:false};
  f.ai.next=s.tick+d.decisionTicks;
  const delta=seen.x-f.x,dist=Math.abs(delta)/Q,sign=Math.sign(delta)||f.facing;
  let v:any={x:sign,jumpHeld:true};
  const main=s.map.main.rectUnits;
  if(f.y<(main[1]+main[3])*Q-10*Q||f.x<(main[0]-25)*Q||f.x>(main[0]+main[2]+25)*Q){v.x=f.x<0?1:-1;if(f.vy<0&&f.jumps)v.jump=true;else if(f.recovery)v.heavy=true;}
  else {
    if(f.weapon==='unarmed'){const it=eligibleItem(s,f);if(it)v.item=true;else if(s.items.length){v.x=Math.sign(s.items[0].x-f.x);if(s.items[0].y>f.y+80*Q)v.jump=true;}}
    if(dist<75)v.x=0;
    if(seen.y>f.y+95*Q&&f.ground)v.jump=true;
    const ranged=f.weapon==='bow'||f.weapon==='sling';
    if(dist<(ranged?440:f.weapon==='spear'?175:110)&&Math.abs(seen.y-f.y)<100*Q){v.x=sign;const choose=rng(s)%100;if(f.guard!==null&&f.ground&&!f.action){f.ai.tell=s.difficulty==='easy'?54:36;f.ai.tellDir=sign;v.x=0;event(s,'bossTell',{fighter:f.id,phase:f.ai.phase});}else if(choose<25)v.heavy=true;else v.light=true;if(s.difficulty!=='easy'&&seen.action==='attack'&&rng(s)%100<45)v.dodge=true;}
    if(s.difficulty==='extreme'&&dist<55&&f.ground&&rng(s)%100<35){v.x=-sign;v.dodge=true;}
  }
  f.ai.intent=input(v);return f.ai.intent;
}
function knockOut(s: any,f: Fighter){
  if(!f.stocks||f.respawn)return;f.stocks--;f.action=null;f.buffer=null;f.stun=f.hitstop=0;f.vx=f.vy=f.kx=0;f.weapon='unarmed';f.carry=false;f.respawn=f.stocks?R.respawnDelayTicks:0;
  s.items.forEach((it:any)=>{if(it.claim===f.id)it.claim=null;});event(s,'ko',{fighter:f.id,x:f.x,y:f.y});
  if(s.mode==='training'){f.stocks=3;f.respawn=60;}
}
function combat(s: any){
  const hits:any[]=[];const zones:any[]=[];
  for(const f of s.fighters){const a=f.action;if(!f.stocks||f.respawn||f.hitstop||a?.kind!=='attack')continue;const m=moves[a.move!];
    const localTick=a.tick-1;
    for(const ph of m.collisionPhases)if(localTick>=ph.firstTick&&localTick<ph.lastTickExclusive)zones.push({f,a,m,box:rectFor(f,ph.rectUnits,a.facing)});
  }
  for(const zone of zones){const {f,a,m,box}=zone;for(const target of s.fighters){if(target.id===f.id||!target.stocks||target.respawn||invincible(target)||!s.friendlyFire&&target.team===f.team||a.hit.includes(target.id))continue;if(capsuleRect(target,box)){a.hit.push(target.id);a.confirmed=true;hits.push({target:target.id,owner:f.id,instance:a.instance,m,facing:a.facing,charge:a.charge,melee:true});}}}
  const removed=new Set<number>();
  for(const p of s.projectiles){const nx=p.x+p.vx,ny=p.y+p.vy;const hw=p.size[0]*Q/2,hh=p.size[1]*Q/2;
    for(const z of zones)if(z.f.team!==p.team&&segmentBox(p.x,p.y,nx,ny,[z.box[0]-hw,z.box[1]-hh,z.box[2]+2*hw,z.box[3]+2*hh])){removed.add(p.id);event(s,'deflect',{x:p.x,y:p.y});break;}
    if(removed.has(p.id))continue;
    for(const pl of platforms(s)){const [x,y,w,h]=pl.rectUnits;if(pl.kind==='solid'&&segmentBox(p.x,p.y,nx,ny,[x*Q-hw,y*Q-hh,w*Q+2*hw,h*Q+2*hh])||pl.kind==='oneWay'&&p.vy<=0&&p.y>=(y+h)*Q&&ny<=(y+h)*Q&&nx>x*Q&&nx<(x+w)*Q){removed.add(p.id);if(p.weapon)s.items.push({id:++s.entityId,x:p.x,y:p.y,vy:512,life:R.drop.lifetimeTicks,neutral:false,weapon:p.weapon,claim:null});break;}}
    if(removed.has(p.id))continue;
    for(const target of s.fighters){if(target.id===p.owner||!target.stocks||target.respawn||invincible(target)||!s.friendlyFire&&target.team===p.team)continue;
      // Swept finite-step capsule contacts; projectile speed is bounded by authored data.
      let contact=false;const samples=Math.max(1,Math.ceil(Math.max(Math.abs(p.vx),Math.abs(p.vy))/(8*Q)));
      for(let n=0;n<=samples;n++)if(capsuleRect(target,[Math.trunc(p.x+(nx-p.x)*n/samples)-hw,Math.trunc(p.y+(ny-p.y)*n/samples)-hh,hw*2,hh*2])){contact=true;break;}
      if(contact){const m=p.move==='throw'?{...R.throw,hitstopTicks:3,launchAngle:22,chargeMaxTicks:0}:moves[p.move];hits.push({target:target.id,owner:p.owner,instance:p.instance,m,facing:p.facing,charge:p.charge,melee:false});removed.add(p.id);break;}
    }
    p.x=nx;p.y=ny;p.vy-=p.gravity;p.life--;if(p.life<=0||outside(s,p.x,p.y))removed.add(p.id);
  }
  s.projectiles=s.projectiles.filter((p:any)=>!removed.has(p.id));
  hits.sort((a,b)=>a.target-b.target||a.owner-b.owner||a.instance-b.instance);
  for(const target of s.fighters){const group=hits.filter(h=>h.target===target.id);if(!group.length)continue;
    let damage=0,stun=0,best:any=null,bestRaw=-1,stop=0;
    for(const h of group){const owner=s.fighters.find((f:Fighter)=>f.id===h.owner);const charge=h.m.chargeMaxTicks?1000+Math.floor(250*h.charge/h.m.chargeMaxTicks):1000;const amount=roundMul(roundMul(h.m.damageTenths,1000+20*((owner?.stats.power||5)-5)),charge);damage+=amount;stun=Math.max(stun,h.m.hitstunTicks);stop=Math.max(stop,h.m.hitstopTicks);if(owner){owner.damageDealt+=amount;owner.hits++;owner.hitstop=Math.max(owner.hitstop,h.m.hitstopTicks);if(h.melee)owner.chase=P.chase.tokenTicks;}event(s,'hit',{fighter:target.id,attacker:h.owner,x:target.x,y:target.y+40*Q,damage:amount});}
    target.damage=clamp(target.damage+damage,0,9990);if(target.guard!==null)target.guard=Math.max(0,target.guard-damage);
    for(const h of group){const raw=h.m.baseForceQ+Math.floor(h.m.growthQPerDamage*target.damage/10);if(raw>bestRaw){best=h;bestRaw=raw;}}
    const force=clamp(roundMul(bestRaw,1000-25*(target.stats.guard-5)),0,P.knockbackCapQ);const dir=P.directionLookup[String(best.m.launchAngle)]||P.directionLookup['22'];target.kx=roundMul(force,dir[0],1024)*best.facing;target.vy=roundMul(force,dir[1],1024);target.vx=0;target.stun=stun;target.hitstop=Math.max(target.hitstop,stop);target.action=null;target.buffer=null;target.ground=null;
    s.items.forEach((it:any)=>{if(it.claim===target.id)it.claim=null;});
  }
}
function outside(s:any,x:number,y:number){const b=s.map.blastBoundsUnits;return x<b.minX*Q||x>b.maxX*Q||y<b.minY*Q||y>b.maxY*Q;}
function updateItems(s:any){
  if(s.tick>=s.pickupTick){if(s.items.filter((it:any)=>it.neutral).length<R.pickups.maxNeutral){const pts=s.map.pickupSpawnUnits;const pt=pts[s.pickupCycle++%pts.length];s.items.push({id:++s.entityId,x:pt[0]*Q,y:pt[1]*Q,vy:0,life:R.pickups.lifetimeTicks,neutral:true,weapon:null,claim:null});event(s,'crate');}s.pickupTick=s.tick+R.pickups.intervalTicks+(rng(s)%(R.pickups.jitterTicks*2+1))-R.pickups.jitterTicks;}
  for(const it of s.items){if(it.claim){const f=s.fighters.find((f:Fighter)=>f.id===it.claim);if(!f||f.action?.kind!=='pickup')it.claim=null;}
    const old=it.y;it.vy=Math.max(it.vy-77,-2048);it.y+=it.vy;for(const pl of platforms(s)){const [x,y,w,h]=pl.rectUnits;const top=(y+h)*Q;if(old>=top&&it.y<=top&&it.x>x*Q&&it.x<(x+w)*Q){it.y=top;it.vy=0;}}it.life--;}
  s.items=s.items.filter((it:any)=>it.life>0&&!outside(s,it.x,it.y));
}
function finish(s:any,won:boolean,reason:string,winners:number[]=[]){if(s.phase==='result')return;s.phase='result';s.result={won,reason,winners,ticks:s.tick,difficulty:s.difficulty,mode:s.mode};event(s,'result',s.result);}
function checkResult(s:any){if(s.mode==='training')return;
  const humans=s.fighters.filter((f:Fighter)=>f.human);if(!humans.some((f:Fighter)=>f.stocks)){if(s.mode==='local'||s.mode==='teams'||s.mode==='ffa'){const living=s.fighters.filter((f:Fighter)=>f.stocks);const teams=[...new Set(living.map((f:Fighter)=>f.team))];if(teams.length<=1)finish(s,false,'Match complete',living.map((f:Fighter)=>f.id));}else finish(s,false,'All three lives used');return;}
  if(s.mode==='waves'||s.mode==='story')return;
  const living=s.fighters.filter((f:Fighter)=>f.stocks);const teams=[...new Set(living.map((f:Fighter)=>f.team))];
  const boss=s.fighters.find((f:Fighter)=>f.guard!==null);if(boss&&boss.guard===0){finish(s,true,'Champion guard broken',humans.map((f:Fighter)=>f.id));return;}
  if(teams.length<=1){const ids=living.map((f:Fighter)=>f.id);finish(s,ids.includes(humans[0].id),'Ring-out victory',ids);return;}
  if(s.remaining<=0){
    const ranked=[...living].sort((a:Fighter,b:Fighter)=>b.stocks-a.stocks||a.damage-b.damage);
    if(ranked.length>1&&ranked[0].stocks===ranked[1].stocks&&ranked[0].damage===ranked[1].damage&&!s.suddenDeath){s.suddenDeath=true;s.remaining=R.suddenDeath.durationTicks;for(const f of ranked){f.stocks=1;f.damage=R.suddenDeath.damageTenths;}event(s,'suddenDeath');return;}
    const tie=ranked.length>1&&ranked[0].stocks===ranked[1].stocks&&ranked[0].damage===ranked[1].damage;
    finish(s,!tie&&ranked[0].human,tie?'Time limit — draw':'Time limit — lives, then damage decide',tie?[]:[ranked[0].id]);
  }
}
function step(s:any,inputs:any={}) {
  if(s.phase==='paused'||s.phase==='result')return s;
  s.events=[];
  if(s.phase==='countdown'){if(--s.countdown<=0)s.phase='playing';return s;}
  s.tick++;s.remaining--;
  if(s.mode==='waves'||s.mode==='story')arrivals(s);
  if(s.phase==='result')return s;
  const frames:any={};for(const f of s.fighters)frames[f.id]=f.human?input(inputs[f.id]||inputs[f.inputId]||{}):bot(s,f);
  const order=[...s.fighters].sort((a,b)=>a.id-b.id);const contenders=order.filter((f:any)=>f.weapon==='unarmed'&&frames[f.id].item&&!f.action&&!f.stun);if(contenders.length>1){const first=contenders[s.pickupPriority%contenders.length];order.sort((a:any,b:any)=>(a.id===first.id?-1:b.id===first.id?1:a.id-b.id));}
  for(const f of order)updateFighter(s,f,frames[f.id]);
  updateItems(s);combat(s);
  for(const f of s.fighters)if(f.stocks&&!f.respawn&&outside(s,f.x,f.y))knockOut(s,f);
  if((s.mode==='waves'||s.mode==='story')&&s.remaining<=0)finish(s,false,'Encounter time expired');else checkResult(s);
  return s;
}
function hash(value:any){let h=2166136261;const str=typeof value==='string'?value:JSON.stringify(value);for(let n=0;n<str.length;n++){h^=str.charCodeAt(n);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function snapshot(s:any){return JSON.parse(JSON.stringify(s));}
root.BiblhallaSim={Q,P,R,moves,defs,input,create,step,pause,rng,hash,snapshot,selectMove,rectFor,capsuleRect,segmentBox,knockOut,startAttack,finish,createFighter,moveFighter,roundMul,invincible,eligibleItem};
})(globalThis);
