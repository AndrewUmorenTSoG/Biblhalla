import { readFileSync,writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/content.ts';
const dir=join(ROOT,'production-pack/09_Data');
const read=(n:string)=>JSON.parse(readFileSync(join(dir,n+'.json'),'utf8'));
const write=(n:string,v:any)=>writeFileSync(join(dir,n+'.json'),JSON.stringify(v,null,2)+'\n');
const fighters=read('fighters'),weapons=read('weapons'),attacks=read('attacks');
if(attacks.designVersion==='elemental-combos-1')process.exit(0);
const moves=attacks.attacks;
const get=(id:string)=>moves.find((m:any)=>m.id===id);
const clone=(id:string,newId:string)=>{const m=structuredClone(get(id));m.id=newId;m.displayName=newId.replaceAll('_',' ');moves.push(m);return m;};
const phase=(from:number,to:number,rect:number[],group=0,extra={})=>({firstTick:from,lastTickExclusive:to,shape:'rect',rectUnits:rect,anchor:'fighterFeet',hitGroup:group,...extra});
const tune=(m:any,startup:number,active:number,recovery:number)=>{m.startup=startup;m.active=active;m.recovery=recovery;m.totalTicks=startup+active+recovery;m.motionEvents=[];m.projectile=null;m.delivery='melee';m.collisionPhases=[phase(startup,startup+active,[8,15,90,60])];};
for(const slot of ['nlight','slight','dlight','nair','sair','dair','recovery','ground_pound']){
  const m=clone('sword_'+slot,'shield_'+slot);m.ownerId='shield';m.weapon='shield';
  m.visualPose='Round shield bash with anticipation, impact and recovery.';
}
weapons.weapons.push({id:'shield',identity:'Round shield bashes, short aerial strings and returning throws.',attackIds:moves.filter((m:any)=>m.ownerId==='shield').map((m:any)=>m.id),groundedHeavySource:'fighterSignatures'});
for(const [hero,old] of [['gideon','hammer'],['nehemiah','sword'],['joshua','spear']]){
  const f=fighters.fighters.find((f:any)=>f.id===hero);f.weaponPair=f.weaponPair.map((w:string)=>w===old?'shield':w);
  for(const suffix of ['nsig','ssig','dsig']){const m=get(`${hero}_${old}_${suffix}`);if(!m)throw Error(`Missing ${hero}/${old}`);m.id=`${hero}_shield_${suffix}`;m.weapon='shield';m.displayName=`${hero} shield ${suffix}`;tune(m,16,8,22);m.effect=suffix==='dsig'?'rock':hero==='joshua'?'sun':'shield';
    if(suffix!=='dsig'&&hero!=='joshua'){
      m.delivery='projectile';m.collisionPhases=[];m.projectile={spawnTick:16,originUnits:[0,44],travelAngle:0,speedQ:2048,gravityQ:0,lifetimeTicks:100,collisionUnits:[36,36],maxHits:1,capClass:'signature',stageCollision:'despawn',homing:false,boomerangRangeUnits:160,effect:'shield'};
    }else if(hero==='joshua'&&suffix==='nsig'){m.collisionPhases=[phase(16,24,[-20,20,60,210])];}
    else m.collisionPhases=[phase(16,24,[-65,0,150,48])];
  }
  f.signatureIds=f.signatureIds.map((id:string)=>id.replace(`_${old}_`,`_shield_`));
}
for(const w of weapons.weapons){
  const m=clone(w.id+'_sair',w.id+'_air_combo');m.ownerId=w.id;m.displayName=w.id+' aerial follow-up';m.comboOnly=true;tune(m,5,5,16);m.input={button:'light',direction:'side',context:'air'};m.damageTenths=85;m.launchAngle=45;m.baseForceQ=760;m.hitstunTicks=14;m.chargeable=false;m.chargeMaxTicks=0;m.resourceCostOnActionStart={};w.attackIds.push(m.id);
}
const custom=(hero:string,weapon:string,slot:string)=>{const m=clone(`${weapon}_${slot}`,`${hero}_${weapon}_${slot}`);m.ownerType='fighter';m.ownerId=hero;m.weapon=weapon;return m;};
const caleb=custom('caleb','gauntlets','slight');tune(caleb,8,16,20);caleb.displayName='Thunderclap Combo';caleb.effect='sound';caleb.collisionPhases=[phase(8,11,[12,25,65,48],0,{damagePermille:450}),phase(19,24,[10,20,65,55],1,{damagePermille:550})];caleb.oneHitPerTarget=false;caleb.projectile={spawnTick:19,originUnits:[80,44],travelAngle:0,speedQ:2560,gravityQ:0,lifetimeTicks:24,collisionUnits:[24,58],maxHits:1,capClass:'light',stageCollision:'despawn',homing:false,effect:'sound'};
const grab=(m:any)=>{tune(m,10,17,22);m.displayName='Lift and Hammerfist';m.effect='dust';m.collisionPhases=[phase(10,13,[10,22,48,62],0,{grabTicks:9,damagePermille:100}),phase(20,27,[0,30,85,100],1,{damagePermille:900})];m.oneHitPerTarget=false;};
grab(custom('samson','gauntlets','nlight'));grab(get('samson_gauntlets_nsig'));
const wind=custom('esther','blades','slight');tune(wind,8,14,18);wind.displayName='Hurricane Spin';wind.effect='wind';wind.collisionPhases=[phase(8,22,[-32,0,145,100])];wind.baseForceQ=1100;wind.launchAngle=22;
for(const slot of ['sair','nair']){const m=custom('jonathan','sword',slot);m.effect='flip';m.displayName='Somersault Slash';}
for(const [hero,weapon,effect] of [['moses','staff','water'],['nehemiah','hammer','rock']]){
  const m=custom(hero,weapon,'dlight');m.effect=effect;m.displayName=effect==='water'?'Parting Wave':'Builder’s Earthbreak';
  if(hero==='moses')m.collisionPhases=[phase(m.startup,m.startup+m.active,[-140,0,280,55])];
  else {m.projectile={spawnTick:m.startup,originUnits:[38,22],travelAngle:0,speedQ:1792,gravityQ:0,lifetimeTicks:24,collisionUnits:[38,42],maxHits:1,capClass:'light',stageCollision:'despawn',homing:false,effect:'rock'};}
  const sig=get(`${hero}_${weapon}_dsig`);sig.effect=effect;sig.collisionPhases=structuredClone(m.collisionPhases).map((p:any)=>({...p,firstTick:sig.startup,lastTickExclusive:sig.startup+sig.active}));if(m.projectile)sig.projectile={...m.projectile,spawnTick:sig.startup,capClass:'signature'};
}
for(const m of moves){
  if(m.ownerId==='samson')m.effect='dust';
  if(m.ownerId==='esther'&&m.id.includes('_blades_'))m.effect='wind';
  if(m.input.button==='heavy'){m.chargeable=true;m.chargeMaxTicks=36;m.chargeMaxDamagePermille=1500;}
}
attacks.designVersion='elemental-combos-1';fighters.designVersion='elemental-combos-1';
write('fighters',fighters);write('weapons',weapons);write('attacks',attacks);
console.log(`${moves.length} attacks, ${weapons.weapons.length-1} weapon families`);
