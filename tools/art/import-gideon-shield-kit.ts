// Add drawn shield actions without changing any existing fighter drawing.
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {ROOT,sha256} from '../lib/content.ts';
import {readPng,blank,resize,blit,writePng} from './image.ts';
import {figures} from './import-defence.ts';

const manifest=join(ROOT,'assets/runtime/fighters/fighters.json');
const meta=JSON.parse(readFileSync(manifest,'utf8')),entry=meta.gideon;
const dataPath=join(ROOT,'production-pack/09_Data/attacks.json'),data=JSON.parse(readFileSync(dataPath,'utf8'));
const move=(id:string)=>data.attacks.find(m=>m.id===id);
for(const [suffix,name,active,recovery,rect,motion] of [
 ['ssig','Shield Rush',12,22,[20,20,65,60],[{kind:'translate',fromTick:16,toTickExclusive:28,dxQ:2048,dyQ:0,blockedBySolid:true}]],
 ['nsig','Rising Shield',10,24,[-16,38,72,95],[{kind:'setVelocity',atTick:16,vxQ:0,vyQ:2048}]],
] as const){
 const m=move('gideon_shield_'+suffix);Object.assign(m,{displayName:name,startup:16,active,recovery,totalTicks:16+active+recovery,delivery:'melee',projectile:null,collisionPhases:[{firstTick:16,lastTickExclusive:16+active,shape:'rect',rectUnits:rect,anchor:'fighterFeet',hitGroup:0}],motionEvents:motion,chargeHoldTick:15,effect:'shield',totalProjectileHitBudget:null});
 m.visualPose=suffix==='ssig'?'Gideon loads his rear leg, rushes forward behind his equipped shield, plants his foot and brakes into guard.':'Gideon crouches, sweeps his equipped shield upward and springs into an overhead shield lift before recovering.';
}

// Coordinates name the centre of the closed shield fist, not the end of an arm.
const grips:Record<string,number[][]>={
 rush:[[.90,.40],[.91,.39],[.91,.42],[.93,.36],[.94,.39],[.94,.37],[.94,.33],[.95,.35],[.94,.34],[.95,.28],[.95,.27],[.95,.29],[.94,.34],[.94,.36],[.91,.40],[.91,.40]],
 lift:[[.87,.58],[.88,.57],[.90,.66],[.78,.86],[.91,.63],[.91,.45],[.90,.28],[.84,.09],[.71,.045],[.61,.055],[.57,.055],[.57,.12],[.92,.18],[.92,.31],[.92,.43],[.91,.58]],
 sweep:[[.88,.52],[.89,.52],[.91,.51],[.89,.68],[.91,.63],[.91,.59],[.94,.61],[.92,.59],[.84,.45],[.86,.29],[.91,.22],[.94,.20],[.88,.29],[.90,.38],[.90,.52],[.88,.52]],
 air:[[.83,.31],[.84,.24],[.87,.18],[.84,.15],[.85,.24],[.94,.23],[.95,.33],[.94,.40],[.78,.33],[.66,.055],[.60,.06],[.94,.65],[.94,.66],[.94,.73],[.91,.49],[.91,.57]],
 dlight:[[.90,.58],[.90,.57],[.91,.52],[.94,.61],[.95,.56],[.96,.52],[.96,.53],[.96,.49],[.95,.55],[.95,.59],[.94,.59],[.91,.55],[.89,.57],[.88,.57],[.90,.60],[.90,.60]],
};
const angles:Record<string,number[]>={rush:Array(16).fill(0),lift:[0,0,-.1,-.5,-.5,-.25,0,.45,1,1.3,1.45,1.3,1,.6,.2,0],sweep:[0,0,-.2,-.6,-.8,-.6,-.3,-.1,0,0,.1,0,0,0,0,0],air:[0,-.2,-.3,-.4,-.2,0,.2,.45,.6,.9,1.1,-.7,-.5,-.3,0,0],dlight:Array(16).fill(0)};
const parts:{name:string;image:ReturnType<typeof blank>;meta:any}[]=[];
for(const kind of Object.keys(grips)){
 const source=readPng(join(ROOT,'assets/animation-production/gideon-shield-kit/'+kind+'.png'));
 const poses=figures(source,4,4,500,64),k=entry.frames.idle.h/poses[kind==='air'?15:0].image.height;
 for(let i=0;i<16;i++){
  const p=poses[i],image=resize(p.image,Math.round(p.image.width*k),Math.round(p.image.height*k));
  // Plant around the pelvis/feet rather than the cell centre: changing cape
  // widths must not shift the character backwards during a rush.
  const pivotX=Math.round(p.pivot*k);
  parts.push({name:`release_${kind}_${i}`,image,meta:{pivotX,pivotY:image.height,gripX:Math.round(image.width*grips[kind][i][0]),gripY:Math.round(image.height*grips[kind][i][1]),shieldAngle:angles[kind][i]}});
 }
}

// A second small texture preserves the complete existing atlas and keeps
// both pages below 2048. Never shrink original animation drawings to fit new art.
parts.sort((a,b)=>b.image.height-a.image.height||b.image.width-a.image.width);
let x=2,y=2,row=0;const placed=parts.map(p=>{if(x+p.image.width+2>1024){x=2;y+=row+3;row=0;}const out={...p,x,y};x+=p.image.width+3;row=Math.max(row,p.image.height);return out;});
const atlas=blank(1024,y+row+2);if(atlas.height>2048)throw Error('Shield kit texture exceeds budget');
const page='gideon_shield_kit';
for(const p of placed){blit(atlas,p.image,p.x,p.y);entry.frames[p.name]={...p.meta,x:p.x,y:p.y,w:p.image.width,h:p.image.height,sheet:page};}
const image='assets/runtime/fighters/gideon-shield-kit-packed.png',bytes=writePng(join(ROOT,image),atlas);
entry.pages={...entry.pages,[page]:{image,sha256:sha256(bytes),width:atlas.width,height:atlas.height,bytes:bytes.length}};

const idle='equipped_shield_idle_0',keys=(kind:string,ids:number[])=>ids.map(i=>`release_${kind}_${i}`);
function clip(id:string,kind:string,prep:number[],strike:number[],follow:number[]){
 const m=move(id),count=prep.length+strike.length+follow.length;
 const indices=id==='gideon_shield_ssig'||id==='shield_dlight'?Array.from({length:16},(_,i)=>i):id==='gideon_shield_nsig'||id==='shield_recovery'?Array.from({length:16},(_,i)=>i):sequences[id];
 const frames=[...keys(kind,kind==='lift'?indices.map(i=>i===3?4:i):indices),idle],ticks=[...prep,...strike,...follow];
 if(frames.length!==count||ticks.reduce((a,b)=>a+b,0)!==m.totalTicks)throw Error('Bad clip timing '+id);
 entry.clips[id]={frames,ticks,loop:false};
}
const sequences:Record<string,number[]>={
 shield_nlight:[0,1,2,3,9,10,11,12,13,14,15],
 shield_slight:[0,1,2,3,4,8,10,11,12,13,14,15],
 shield_dlight:[0,1,2,3,4,5,6,7,8,9,13,14,15],
 shield_nair:[0,1,2,3,4,5,6,7,8,7,8,9,14,15],
 shield_sair:[0,1,2,3,4,5,6,7,8,9,12,13,14,15],
 shield_dair:[0,1,8,9,10,11,12,13,14,15],
 shield_ground_pound:[0,1,8,9,10,11,12,13,14,15],
 shield_air_combo:[0,1,2,3,4,5,6,7,8,9,12,13,14,15],
};
clip('gideon_shield_ssig','rush',[4,4,4,4],[2,2,2,2,2,1,1],[3,3,3,3,3,7]);
clip('gideon_shield_nsig','lift',[3,3,3,3,2,2],[2,2,2,2,1,1],[4,4,4,4,8]);
clip('shield_nlight','sweep',[2,2,2,1],[1,1,2],[3,3,3,3,3]);
clip('shield_slight','rush',[2,2,2,3],[1,1,2],[3,3,3,3,3,3]);
clip('shield_dlight','dlight',[2,2,2,2],[1,1,1,1],[2,2,2,2,2,2,2,1,2]);
clip('shield_nair','air',[2,2,2,2],[1,1,1,1,1],[2,3,3,3,2,3]);
clip('shield_sair','air',[2,2,2,2,2],[2,2,1],[2,2,3,3,3,3,4]);
clip('shield_dair','air',[2,2,2,2,2],[3,2],[5,5,5,6]);
clip('shield_recovery','lift',[2,2,2,2,2,1],[1,1,1,1,1,2],[3,3,4,4,8]);
clip('shield_ground_pound','air',[3,3,3,3,3],[6,6],[6,6,6,9]);
clip('shield_air_combo','air',[1,1,1,1,1],[1,1,1,1,1],[3,3,3,3,4]);
// The low strike's hit zone follows the actual shield on each impact drawing.
// Shared shield balance/art for Joshua and Nehemiah remains untouched.
move('shield_dlight').fighterCollisionPhases={...move('shield_dlight').fighterCollisionPhases,gideon:[4,5,6,7].map((index,i)=>{
 const f=entry.frames['release_dlight_'+index],u=96/entry.frames.idle.h;
 const x=(f.gripX-f.pivotX)*u,y=(f.pivotY-f.gripY)*u,radius=62*96/160/2;
 const left=Math.ceil(x-radius),bottom=Math.ceil(y-radius),right=Math.floor(x+radius),top=Math.floor(y+radius);
 return{firstTick:8+i,lastTickExclusive:9+i,shape:'rect',rectUnits:[left,bottom,right-left,top-bottom],anchor:'fighterFeet',hitGroup:0};
})};
entry.shieldMovesAnimation={source:'assets/animation-production/gideon-shield-kit',drawings:80,reference:'20261116-1138-01.6367856.mp4',notes:'Rush, rising lift, fully extended low thrust and aerial bash/spike. Equipped shield follows authored fist anchors; low thrust contact is registered to the shield.'};
writeFileSync(dataPath,JSON.stringify(data,null,2)+'\n');writeFileSync(manifest,JSON.stringify(meta,null,2)+'\n');
console.log('Gideon: 80 body drawings, 11 shield action clips, atlas '+atlas.width+'x'+atlas.height);
