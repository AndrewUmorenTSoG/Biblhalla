import { shieldReleaseFrame } from './shield-release.ts';
import { handGrip, needsCarriedWeapon } from './grip.ts';
// Canvas 2D renderer. Reads simulation state and events; never mutates them.
// Floating-point camera and interpolation live here only.

import { drawEncounter } from './encounter.ts';
import type { Engine, SimState } from '../../../../packages/sim/src/index.ts';
import type { Scene } from '../../../../packages/campaign/src/index.ts';
import { Q } from '../../../../packages/sim/src/index.ts';
import { paintArenaScenery } from './arena-scenes.ts';
import { SurfaceCache } from './surface-cache.ts';
import { drawWeapon, drawFlamingSwordPickup, drawFlyingWeapon } from './weapons.ts';
import { interpolatePosition, cameraEase, runCadence, RunDistance } from './animation.ts';
import { drawElements, drawCharge, drawElementProjectile, drawThrowWind, flame } from './elemental.ts';
import { Feedback } from './feedback.ts';
import { Callouts } from './callouts.ts';
import { edgePointer, nextTask, drawPointer } from './waypoint.ts';
import { QualityGovernor, particleCap } from './quality.ts';
import { drawPlayerMark } from './player-marks.ts';
import { EMOTE_TICKS } from '../../../../packages/sim/src/state.ts';
/** Emote keys 0-3: friendly lines only, fitting the game's tone. */
export const EMOTE_TEXT=['Shalom!','Well fought!','Here I am!','Ha ha!'];

/** Runtime art the renderer may use. Only frames marked runtime-ready are drawn. */
export interface ArenaArt { image: HTMLImageElement; horizon: string; stone: string }
export interface Clip { frames: string[]; ticks: number[]; loop?: boolean }
export interface RuntimeArt { images: Record<string, HTMLImageElement>; atlas: Record<string, any>; clips?: Record<string, Record<string, Clip>>; arenas?: Record<string, ArenaArt> }

/** Clip used for each non-attack pose the renderer derives from simulation state. */
const POSE_CLIPS:Record<string,string>={idle:'idle',run:'run',jump:'jump',dodge:'dodge',recovery:'hitstun'};
/** On-screen height of a standing fighter at zoom 1, in CSS pixels. */
const FIGURE_PX=96;
export const colors:any={david:['#e7c57a','#486c82','#654332'],saul:['#776c99','#c09f60','#453932'],samson:['#b8784d','#d1a265','#372721'],joshua:['#7e9f88','#d5ba76','#55372a'],deborah:['#587d8c','#cf9f67','#322a2b'],gideon:['#829469','#b89158','#493a2b'],jonathan:['#729da7','#dac693','#6a4630'],moses:['#b8ad90','#637c89','#d4c6b2'],esther:['#a06886','#dec18c','#33252a'],miriam:['#9bb3b5','#d4a664','#342a25'],nehemiah:['#8c7665','#bcb391','#4f3e32'],caleb:['#a59a63','#98694c','#5a3c2a'],dru:['#ba8559','#456e80','#4e3228'],ken:['#778d75','#d9b27b','#493b31']};
const palettes=[['#688e9e','#f1d9ab','#b29a72','#4b6668'],['#939ea9','#dfbd84','#b29163','#666d60'],['#bd9d87','#f1d5a1','#be8f61','#5b776e'],['#82a09c','#e7d7a5','#a49f75','#59786f'],['#8a9fb1','#dcc2ac','#baa791','#73687c'],['#91a3aa','#e5d2ad','#bbaa8a','#6c7e76']];
export class Renderer{
  elementEvents:SimState['events']=[];
  shieldCatchTicks=new Map<number,number>();
  collectElements(world:SimState){this.shieldCatchTicks??=new Map();for(const e of world.events)if(e.type==='shieldCatch')this.shieldCatchTicks.set(Number(e.fighter),world.tick);for(const e of world.events)if(e.type==='element'&&!this.elementEvents.some(p=>p.id===e.id))this.elementEvents.push({...e});this.elementEvents=this.elementEvents.filter(e=>world.tick-e.tick<=22).slice(-64);}
  runDistance=new RunDistance();
  surfaces=new SurfaceCache();
  previousProjectiles=new Map<number,{x:number;y:number}>();
  previous=new Map<number,{x:number;y:number}>();
  lastWorld:SimState|null=null;
  capture(world:SimState){if(this.lastWorld!==world){this.shieldCatchTicks.clear();this.motion.clear();this.previous.clear();this.runDistance.clear();this.surfaces.clear();this.cheerUntil.clear();this.lastCheerEvent=0;this.feedback.reset();this.callouts.reset();this.lastWorld=world;this.elementEvents=[];}this.previousProjectiles.clear();for(const p of world.projectiles)this.previousProjectiles.set(p.id,{x:p.x,y:p.y});this.collectElements(world);for(const f of world.fighters){this.runDistance.capture(f.id,f.x/Q,world.tick,!!f.ground&&!f.action&&!f.stun&&!f.hitstop&&Math.abs(f.vx)>100);this.previous.set(f.id,{x:f.x,y:f.y});}}
  motion=new Map<number,{tick:number;pose:string;time:number;ground:boolean;landUntil:number;stunned:boolean}>();
  cheerUntil=new Map<number,number>();lastCheerEvent=0;
  canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D;S:Engine;art:Record<string,HTMLImageElement>;atlas:Record<string,any>;arenas:Record<string,ArenaArt>;training:{combo:any;history:any[]}|null=null;clips:Record<string,Record<string,Clip>>;symbolic=false;feedback=new Feedback();callouts=new Callouts();quality=new QualityGovernor();camera:any={x:0,y:170,zoom:1};particles:any[]=[];lastEvent=0;debug=false;reduced=false;
  constructor(canvas:HTMLCanvasElement,S:Engine,art:RuntimeArt={images:{},atlas:{}}){this.canvas=canvas;this.ctx=canvas.getContext('2d')!;this.S=S;this.art=art.images;this.atlas=art.atlas;this.arenas=art.arenas??{};this.clips=art.clips??{};}
  /** Speech bubble for an emote; pops in over a few ticks, unless motion is reduced. */
  emoteBubble(id:number,x:number,y:number,age:number){const c=this.ctx,text=EMOTE_TEXT[id]??'!';const k=this.reduced?1:Math.min(1,.4+age*.15);c.save();c.translate(x,y);c.scale(k,k);c.font='bold 17px Georgia';const w=c.measureText(text).width+22;c.fillStyle='#fff7e3';c.strokeStyle='#3c3326';c.lineWidth=2;c.beginPath();c.roundRect(-w/2,-17,w,32,10);c.moveTo(-6,15);c.lineTo(0,25);c.lineTo(6,15);c.fill();c.stroke();c.fillStyle='#2c2419';c.textAlign='center';c.fillText(text,0,5);c.restore();}
  round(x:number,y:number,w:number,h:number,r=5){const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();c.stroke();}
  /** Loaded painted backdrop for an arena palette slot, if one shipped. */
  arenaArt(palette:number):ArenaArt|null{const a=this.arenas[this.S.content.maps.maps[palette%6].id];return a&&a.image.complete&&a.image.naturalWidth?a:null;}
  background(tick:number,palette:number,story:any=null){const c=this.ctx;const p=palettes[palette%6];const sky=c.createLinearGradient(0,0,0,650);sky.addColorStop(0,p[0]);sky.addColorStop(.72,p[1]);sky.addColorStop(1,p[2]);c.fillStyle=sky;c.fillRect(0,0,1280,720);
    // Painted far layer: sky and distant land only. Platforms come from collision data, never the painting.
    const art=this.arenaArt(palette);let painted=false;
    if(art){const h=330,w=h*art.image.naturalWidth/art.image.naturalHeight,off=this.reduced||this.quality.low?0:Math.max(-(w-1280)/2,Math.min((w-1280)/2,-this.camera.x*.05));c.drawImage(art.image,640-w/2+off,0,w,h);const fade=c.createLinearGradient(0,h-70,0,h+50);fade.addColorStop(0,art.horizon+'00');fade.addColorStop(1,art.horizon);c.fillStyle=fade;c.fillRect(0,h-70,1280,120);c.fillStyle=art.horizon;c.fillRect(0,h+50,1280,720-h-50);painted=true;}
    if(!painted){c.fillStyle='#ffefca';c.globalAlpha=.7;c.beginPath();c.arc(story?.level.chapter===14?210:1020,story?.level.chapter===14?280:115,58,0,Math.PI*2);c.fill();c.globalAlpha=1;}
    if(!painted){for(let layer=0;layer<3;layer++){c.fillStyle=layer===0?p[2]:layer===1?p[3]:'#384f53';c.globalAlpha=.18+layer*.11;c.beginPath();c.moveTo(0,600);for(let x=-100;x<=1400;x+=100){const y=390+layer*65+Math.sin((x+palette*131-this.camera.x*.08)/(230-layer*30))*55;c.lineTo(x,y);}c.lineTo(1280,720);c.lineTo(0,720);c.closePath();c.fill();}c.globalAlpha=1;}
    paintArenaScenery(c,this.S.content.maps.maps[palette%6].id,this.camera.x,this.reduced);
    const shade=c.createLinearGradient(0,380,0,720);shade.addColorStop(0,'rgba(20,30,34,0)');shade.addColorStop(1,'rgba(20,30,34,.32)');c.fillStyle=shade;c.fillRect(0,380,1280,340);
    if(story?.level.number>=79){c.save();c.strokeStyle='#334e5588';c.fillStyle='#e7d7b477';c.lineWidth=5;const n=story.level.number;if(n===82){c.beginPath();c.moveTo(1010,290);c.lineTo(1010,405);c.moveTo(975,323);c.lineTo(1045,323);c.stroke();}else if(n===83||n===84){c.beginPath();c.arc(1000,405,64,Math.PI,0);c.lineTo(1064,455);c.lineTo(936,455);c.closePath();c.fill();c.stroke();c.fillStyle='#334e5599';c.fillRect(977,389,45,65);if(n===83){c.beginPath();c.arc(998,423,38,0,Math.PI*2);c.fill();}else{c.beginPath();c.arc(1070,443,33,0,Math.PI*2);c.fill();}}else {c.beginPath();c.moveTo(940,390);c.lineTo(1080,390);c.moveTo(958,390);c.lineTo(958,437);c.moveTo(1062,390);c.lineTo(1062,437);c.stroke();}if(this.symbolic){c.fillStyle='#213b44';c.font='14px Georgia';c.textAlign='center';c.fillText('Text & symbols · '+story.level.scripture,1010,480);}c.restore();}
    if(story){c.fillStyle='rgba(16,31,39,.45)';c.font='16px Georgia';c.fillText(story.level.location,28,692);}
  }
  weapon(weapon:string,x:number,y:number,angle:number,palette:string){drawWeapon(this.ctx,weapon,x,y,angle,palette);}
  /** Atlas frame for a pose: signature key poses for signatures, the light pose for other attacks. */
  frameFor(hero:string,pose:string,weapon:string,move:string,attackTick=0,time=0){
    if(pose==='hitstun'&&this.atlas?.[hero]?.defence_13)return time<7?'defence_13':'defence_14';
    if(!move&&this.atlas?.[hero]?.['equipped_'+weapon+'_0']){
      const key=(i:number)=>'equipped_'+weapon+'_'+i;
      if(pose==='idle'||pose==='happy'||pose==='startup')return key(Math.floor(time/24)%2);
      if(pose==='run'){if(this.atlas[hero]['gait_'+weapon+'_0']){const count=this.atlas[hero]['gait_'+weapon+'_11']?12:8;return 'gait_'+weapon+'_'+Math.floor(time/(24/count))%count;}return key(4+Math.floor(time/4)%4);}
      if(pose==='crouch')return key(time<3?2:3);
      const air:{[key:string]:number}={air_rise:8,air_apex:9,air_fall:10,land:11};if(pose in air)return key(air[pose]);
      if(pose==='backflip')return key(time<4?8:time<9?9:time<14?10:11);
      if(pose==='weapon_pickup')return key(time<4?3:0);if(pose==='dodge')return key(time<3?2:time<11?3:11);if(pose==='recovery')return key(15);
    }
    if(weapon==='sling'&&this.atlas[hero]?.slinger_idle_0&&!move){
      if(pose==='idle'||pose==='happy')return 'slinger_idle_'+Math.floor(time/16)%4;
      if(pose==='run')return 'slinger_run_'+Math.floor(time/4)%4;
      const air:{[key:string]:number}={air_rise:0,air_apex:1,air_fall:2,land:3};if(pose in air)return 'slinger_air_'+air[pose];
    }
    if(pose==='weapon_throw')return time<6?'defence_1':time<12?'defence_2':time<18?'defence_3':'motion_idle';
    if(pose==='weapon_pickup')return time<4?'land':'defence_0';
    if(!move&&pose==='backflip')return time<4?'air_rise':time<9?'air_apex':time<14?'air_fall':'land';
    if(!move&&pose==='happy'&&this.atlas[hero]?.motion_idle)return 'motion_idle';
    if(!move&&this.atlas[hero]?.[pose]&&['air_rise','air_apex','air_fall','land'].includes(pose))return pose;
    // The original idle is a concept cutout with an open, disconnected hand.
    // The movement sheet has the same fighter in a closed, usable rest stance.
    if(!move&&pose==='idle'&&this.atlas[hero]?.motion_idle)return 'motion_idle';
    // Authored clips (docs/ART_INTEGRATION.md): attacks advance with the action tick, loops with world time.
    const clips=this.clips[hero];
    const name=move||POSE_CLIPS[pose]||'idle';
    const clip=clips?.[name];
    if(clip&&clip.frames.length){const total=clip.ticks.reduce((a:number,b:number)=>a+b,0);let t=move?Math.min(attackTick,total-1):clip.loop===false?Math.min(time,total-1):time%Math.max(1,total);for(let k=0;k<clip.frames.length;k++){if(t<clip.ticks[k]){
      const key=clip.frames[k];
      if(key==='idle'&&this.atlas[hero]?.motion_idle)return 'motion_idle';
      return key;
    }t-=clip.ticks[k];}return clip.frames[clip.frames.length-1];}
    // An absent clip must never reintroduce a legacy concept cutout.
    return this.atlas[hero]?.motion_idle?'motion_idle':'defence_0';
  }

  /** Draw a carried weapon at the leading hand of a movement sprite. */
  heldWeapon(weapon:string,frame:any,frameName:string,time:number,accent:string,fiery=false,charging=false){
    if(weapon==='unarmed')return;
    const c=this.ctx;
    const running=frameName.startsWith('run_');
    const airborne=frameName.startsWith('air_');
    const {x:handX,y:handY}=handGrip(frame);
    c.save();c.translate(handX,handY);
    if(weapon==='sling'&&charging){
      // Both cords share the fist; the pouch revolves even when David is still.
      const phase=time*(running?.32:.22)-1.3;
      const px=charging?Math.cos(phase)*39:8+Math.sin(time*.12)*5,py=charging?-29+Math.sin(phase)*28:42+Math.sin(time*.12)*3;
      c.strokeStyle='#66472e';c.lineWidth=2.4;c.lineCap='round';
      c.beginPath();c.moveTo(-2,0);c.quadraticCurveTo(px*.45,py*.55,px-5,py);c.moveTo(2,0);c.quadraticCurveTo(px*.55,py*.55,px+5,py);c.stroke();
      c.fillStyle='#8e603b';c.beginPath();c.ellipse(px,py,8,5,phase*.5,0,Math.PI*2);c.fill();
      c.strokeStyle='#3d3027';c.lineWidth=1.5;c.stroke();if(fiery)flame(c,px,py,7,time);
    }else{
      const angle=weapon==='bow'?.26:weapon==='hammer'?.24:weapon==='gauntlets'?0:weapon==='sword'&&running?-.85:running?.18:airborne?-.25:-.1;
      c.scale(1.15,1.15);drawWeapon(c,weapon,0,0,angle,accent);if(fiery&&weapon==='sling')flame(c,0,45,6,time);
    }
    c.restore();
  }

  rig(hero:string,x:number,y:number,scale:number,facing:number,pose:string,time:number,attackTick:number=0,weapon='unarmed',label='',ghost=false,move='',recoil=0,charge=0,releaseState=''){const c=this.ctx,p=colors[hero]||colors.dru;
    const sheet=this.art[hero],frames=this.atlas[hero];
    if(sheet&&sheet.complete&&sheet.naturalWidth&&frames){const attack=this.S?.moves?.[move];const throwingShield=attack?.projectile?.effect==='shield';const shieldRelease=pose!=='hitstun'&&weapon==='shield'&&frames.release_0&&((releaseState&&(!move||throwingShield))||!move&&pose==='idle'&&!frames.equipped_shield_0||throwingShield);const releaseIndex=shieldReleaseFrame(attackTick,this.S?.moves?.[move]?.startup??16,releaseState,charge>0);const frameName=shieldRelease?'release_'+releaseIndex:charge>0&&weapon==='sling'?(frames.equipped_sling_13?'equipped_sling_13':frames.slinger_cast_1?'slinger_cast_1':'motion_idle'):this.frameFor(hero,pose,weapon,move,attackTick,time);const frame=frames[frameName]||frames.motion_idle||frames.idle;if(frame){
      // Use the shared reference height so each sprite spans the shared 74-unit hurtbox plus head room.
      const k=scale*FIGURE_PX/frames.idle.h;const bob=pose==='run'&&!this.reduced&&!this.clips[hero]?.run?Math.abs(Math.sin(time*.25))*3*scale:pose==='happy'&&!this.reduced?Math.abs(Math.sin(time*.42))*4*scale:0;
      c.save();c.translate(x,y-bob);c.scale(facing*k,k);if(ghost)c.globalAlpha=.35;
      if((pose==='idle'||pose==='happy')&&!this.reduced){const phase=hero.split('').reduce((n,ch)=>n+ch.charCodeAt(0),0)*.09;c.rotate(Math.sin(time*.065+phase)*.012);c.scale(1,1+Math.sin(time*.09+phase)*.008);}
      if(attack&&!this.reduced&&!ghost&&pose!=='hitstun'){
        // Shift weight onto the lead foot as the authored contact pose appears.
        const windup=Math.max(1,attack.startup),end=windup+attack.active;
        const weight=attackTick<windup?-Math.sin(Math.PI*attackTick/windup)*.45:
          attackTick<end?1:Math.max(0,1-(attackTick-end)/Math.max(1,attack.recovery));
        c.rotate(weight*(throwingShield?.075:.055));
      }
      if(pose==='land'&&!this.reduced){const settle=Math.max(0,1-time/5);c.scale(1+settle*.025,1-settle*.035);}
      if(pose==='dodge'&&!this.reduced){const burst=Math.min(1,time/3)*Math.min(1,Math.max(0,17-time)/6);c.translate(0,-frame.pivotY*.45);c.rotate(-.1*burst);c.translate(0,frame.pivotY*.45);}
      if(pose==='backflip'&&!this.reduced){const t=Math.max(0,Math.min(1,time/17));const smooth=t*t*(3-2*t);c.translate(0,-frame.pivotY*.48);c.rotate(-Math.PI*2*smooth);c.translate(0,frame.pivotY*.48);}
      else if(recoil){c.translate(0,-frame.pivotY*.45);c.rotate(recoil);c.translate(0,frame.pivotY*.45);}
      else if(pose==='recovery'&&!move&&!this.clips[hero]?.hitstun)c.rotate(-.12);
      // The weapon sits behind the near fist in the same local coordinates as
      // the sprite. It follows each run and jump frame instead of floating at
      // a fixed screen position. Attack art already includes its own weapon.
      if(charge>0)c.filter='sepia('+Math.min(.7,charge/50)+') saturate(2.2) hue-rotate(325deg)';
      c.drawImage(sheet,frame.x,frame.y,frame.w,frame.h,-frame.pivotX,-frame.pivotY,frame.w,frame.h);
      c.filter='none';
      if(!shieldRelease&&needsCarriedWeapon(frameName,weapon)){
        this.heldWeapon(weapon,frame,frameName,charge>0?time*5+charge*2:time,p[1],hero==='david',charge>0);
        // Draw the original fingers over the grip, so equipment is held in
        // the hand rather than pasted behind the body or over the fist.
        const gx=Math.max(0,Math.min(frame.w-10,(frame.gripX??frame.w*.74)-5)),gy=Math.max(0,Math.min(frame.h-10,(frame.gripY??frame.h*.56)-5));
        c.drawImage(sheet,frame.x+gx,frame.y+gy,10,10,gx-frame.pivotX,gy-frame.pivotY,10,10);
      }
      if(shieldRelease&&(!releaseState||(releaseState==='catch'||releaseState==='settle'))){const grips=[[.85,.32],[.23,.25],[.08,.12],[.95,.25],[.96,.25],[.94,.30],[.79,.35],[.82,.32]];const grip=grips[releaseIndex];const hx=frame.w*grip[0]-frame.pivotX,hy=frame.h*grip[1]-frame.pivotY;drawWeapon(c,'shield',hx,hy,0);}


      if(pose==='happy'){
        c.fillStyle='#f6d584';
        for(const [dx,dy] of [[.12,.16],[.8,.2],[.95,.42]]){c.beginPath();c.arc(frame.w*dx-frame.pivotX,frame.h*dy-frame.pivotY,2.5,0,Math.PI*2);c.fill();}
      }
      c.restore();
      if(label){c.save();c.textAlign='center';c.font='bold 14px system-ui';c.fillStyle='#162b33';c.fillText(label,x,y-(FIGURE_PX+18)*scale);c.restore();}return;}}
    c.save();c.translate(x,y);c.scale(scale*facing,scale);if(ghost)c.globalAlpha=.35;
    c.lineCap='round';c.lineJoin='round';const step=pose==='run'?Math.sin(time*.22)*13:0;const lift=pose==='jump'?9:0;let arm=pose==='startup'?-1.1:pose==='active'?1.05:pose==='recovery'?.4:pose==='dodge'?.9:-.2;
    c.strokeStyle='#332b29';c.lineWidth=11;c.beginPath();c.moveTo(-9,-29);c.lineTo(-10+step,-12-lift);c.lineTo(-13-step,0);c.moveTo(10,-29);c.lineTo(10-step,-13-lift);c.lineTo(16+step,0);c.stroke();c.strokeStyle=p[1];c.lineWidth=7;c.stroke();
    c.fillStyle=p[0];c.strokeStyle='#332b29';c.lineWidth=2.5;c.beginPath();c.moveTo(-18,-57);c.quadraticCurveTo(0,-67,18,-57);c.lineTo(21,-24);c.quadraticCurveTo(0,-16,-22,-24);c.closePath();c.fill();c.stroke();c.fillStyle=p[1];this.round(-19,-32,38,7,2);
    c.strokeStyle='#332b29';c.lineWidth=11;c.beginPath();c.moveTo(-16,-54);c.lineTo(-23,-40+step*.3);c.lineTo(-16,-32);c.stroke();c.strokeStyle='#c99670';c.lineWidth=7;c.stroke();
    c.save();c.translate(15,-54);c.rotate(arm);c.strokeStyle='#332b29';c.lineWidth=12;c.beginPath();c.moveTo(0,0);c.lineTo(13,9);c.lineTo(24,0);c.stroke();c.strokeStyle='#ce9f78';c.lineWidth=8;c.stroke();this.weapon(weapon,25,0,pose==='active'?.8:-.25,p[1]);c.restore();
    c.fillStyle='#cda17a';c.strokeStyle='#332b29';c.lineWidth=2.5;c.beginPath();c.ellipse(0,-75,16,20,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=p[2];c.beginPath();c.moveTo(-16,-72);c.lineTo(-18,-83);c.quadraticCurveTo(-5,-105,15,-88);c.lineTo(17,-73);c.lineTo(8,-84);c.lineTo(-4,-88);c.closePath();c.fill();c.stroke();
    c.fillStyle='#382c2b';c.beginPath();c.arc(8,-76,1.8,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(5,-64);c.lineTo(12,-66);c.stroke();
    if(['moses','nehemiah','caleb','saul'].includes(hero)){c.fillStyle=hero==='moses'?'#d9d0b9':p[2];c.beginPath();c.moveTo(-14,-68);c.lineTo(-9,-49);c.lineTo(7,-52);c.lineTo(15,-68);c.lineTo(4,-64);c.closePath();c.fill();c.stroke();}
    if(['samson','deborah','miriam','esther'].includes(hero)){c.fillStyle=p[2];c.beginPath();c.moveTo(-16,-88);c.quadraticCurveTo(-36,-60,-23,-36);c.lineTo(-12,-44);c.lineTo(-9,-80);c.closePath();c.fill();c.stroke();}
    if(['saul','esther'].includes(hero)){c.fillStyle='#d7b56e';c.beginPath();c.moveTo(-15,-91);c.lineTo(-17,-104);c.lineTo(-5,-98);c.lineTo(1,-109);c.lineTo(8,-97);c.lineTo(17,-103);c.lineTo(15,-90);c.closePath();c.fill();c.stroke();}
    if(hero==='david'||hero==='dru'||hero==='jonathan'){c.fillStyle=p[1];c.beginPath();c.moveTo(-15,-53);c.lineTo(-28,-44+step*.2);c.lineTo(-28,-53);c.lineTo(-4,-59);c.closePath();c.fill();c.stroke();}
    c.restore();if(label){c.save();c.textAlign='center';c.font='bold 14px system-ui';c.fillStyle='#162b33';c.fillText(label,x,y-110*scale);c.restore();}
  }
  portrait(canvas:HTMLCanvasElement,hero:string){const old=this.ctx;this.ctx=canvas.getContext('2d')!;this.ctx.clearRect(0,0,canvas.width,canvas.height);this.rig(hero,canvas.width/2,canvas.height-10,Math.min(canvas.width/100,canvas.height/120),1,'idle',0,0,this.S.defs[hero].weaponPair[0]);this.ctx=old;}
  paint(world:SimState,scene:Scene|null=null,alpha=1,elapsedMs=1000/60,active=true){const c=this.ctx;const player=world.fighters[0];const map=world.map;const isRoute=scene&&!scene.level.combatEnabled||scene?.level.number===41;
    let cx=0,cy=170,zoom=.85;
    if(isRoute){cx=Math.max(450,Math.min(3300,player.x/Q+200));cy=170;zoom=.95;}
    else {const live=world.fighters.filter((f:any)=>f.stocks&&!f.respawn);if(live.length){cx=live.reduce((a:number,f:any)=>a+f.x/Q,0)/live.length;cx=Math.max(-260,Math.min(260,cx));const span=Math.max(...live.map((f:any)=>f.x/Q))-Math.min(...live.map((f:any)=>f.x/Q));zoom=Math.max(.58,Math.min(.95,1000/(span+340)));cy=Math.max(140,Math.min(280,live.reduce((a:number,f:any)=>a+f.y/Q,0)/live.length));}}
    if(this.reduced){this.camera={x:cx,y:cy,zoom:isRoute?.95:.85};}else{const ex=cameraEase(.08,active?elapsedMs:0),ey=cameraEase(.06,active?elapsedMs:0);this.camera.x+=(cx-this.camera.x)*ex;this.camera.y+=(cy-this.camera.y)*ey;this.camera.zoom+=(zoom-this.camera.zoom)*ey;}
    const palette=Math.max(0,this.S.content.maps.maps.findIndex((m:any)=>m.id===map.id));this.background(world.tick,palette,scene);
    if(this.quality.frame(elapsedMs))this.feedback.maxPuffs=particleCap(this.quality.low);this.callouts.update(world);this.feedback.reduced=this.reduced;this.feedback.update(world,active?Math.min(6,elapsedMs/(1000/60)):0);const cssToCanvas=this.canvas.clientWidth?this.canvas.width/this.canvas.clientWidth:1,rawShake=this.feedback.offset(world.tick),shake={x:rawShake.x*cssToCanvas,y:rawShake.y*cssToCanvas};
    c.save();c.translate(640+shake.x,460+shake.y);c.scale(this.camera.zoom,-this.camera.zoom);c.translate(-this.camera.x,-this.camera.y);
    // Story routes borrow their chapter arena's surface design.
    const surfaceStyle=this.S.content.maps.maps[palette%6].id;for(const pl of [map.main,...map.platforms])this.surfaces.draw(c,surfaceStyle,pl.rectUnits,pl.kind==='solid');
    for(const it of world.items){c.save();c.translate(it.x/Q,it.y/Q);c.scale(.575,-.575);if(it.neutral||!it.weapon)drawFlamingSwordPickup(c,world.tick,this.reduced);else drawWeapon(c,it.weapon,0,-20,Math.PI/3);c.restore();}
    if(scene){
      if(scene.level.number===1){
        const ready=scene.done.length===scene.markers.length;
        c.save();c.translate(3650,80);c.strokeStyle=ready?'#f4d58c':'#8da9a5';c.fillStyle=ready?'rgba(244,213,140,.22)':'rgba(141,169,165,.12)';c.lineWidth=5;
        c.beginPath();c.moveTo(-34,0);c.lineTo(-34,104);c.quadraticCurveTo(0,145,34,104);c.lineTo(34,0);c.closePath();c.fill();c.stroke();
        c.scale(1,-1);c.fillStyle=ready?'#f4d58c':'#c4d4c9';c.textAlign='center';c.font='bold 17px system-ui';c.fillText(ready?'EXIT · walk here':'EXIT · collect all 6 panels',0,-151);c.restore();
      }
      for(const m of scene.markers){if(m.done)continue;if(scene.level.number===1&&m.id>scene.done.length)continue;const x=(m.carried||m.type==='escort'&&m.stage?m.targetX:m.x)/Q,y=m.y/Q;
        c.save();c.translate(x,y+32);c.scale(1,-1);c.fillStyle=m.carried?'rgba(232,208,155,.3)':'#e5c17f';c.strokeStyle='#5c4a30';c.lineWidth=2;c.beginPath();c.moveTo(0,-22);c.lineTo(21,0);c.lineTo(0,22);c.lineTo(-21,0);c.closePath();c.fill();c.stroke();c.fillStyle='#4b4134';c.textAlign='center';c.font='bold 14px system-ui';c.fillText(String(m.id+1),0,5);c.font='12px system-ui';c.fillStyle='#233a40';c.fillText(m.carried?'Deliver here':m.type==='escort'&&m.stage?'Safe gate':m.label,0,-32);c.restore();
      }
      for(const h of scene.hazards){c.fillStyle=h.state==='active'?'rgba(161,69,54,.45)':h.state==='tell'?'rgba(206,160,78,.35)':'rgba(61,91,75,.15)';c.fillRect(h.x/Q-48,80,96,180);c.save();c.translate(h.x/Q,300);c.scale(1,-1);c.fillStyle='#263e42';c.textAlign='center';c.font='bold 13px system-ui';c.fillText(h.state==='active'?'WAIT':h.state==='tell'?'LOOKOUT':'CLEAR',0,0);c.restore();}
    }
    drawEncounter(c,world,scene,this.reduced);
    c.restore();
    const screen=(x:number,y:number)=>({x:640+shake.x+(x/Q-this.camera.x)*this.camera.zoom,y:460+shake.y-(y/Q-this.camera.y)*this.camera.zoom});
    this.feedback.draw(c,screen,this.camera.zoom);
    // Story walking routes have no combat to call out.
    if(!isRoute)this.callouts.draw(c,screen,this.camera.zoom,world.tick,this.reduced);
    // Story guidance: point to the next unfinished task (witness scenes included; never in arena matches).
    if(scene&&scene.phase==='active'){const m=nextTask(scene.markers);if(m){const tx=(m.carried||m.type==='escort'&&m.stage?m.targetX:m.x),pos=screen(tx,m.y+32*Q);drawPointer(c,edgePointer(pos),m.label,Math.abs(tx-player.x)/Q/40,world.tick,this.reduced);}}
    for(const e of world.events){if(e.id<=this.lastCheerEvent)continue;this.lastCheerEvent=e.id;if(e.type==='ko'){const fallen=world.fighters.find(f=>f.id===e.fighter);if(fallen)for(const other of world.fighters)if(other.team!==fallen.team&&other.stocks&&!other.stun)this.cheerUntil.set(other.id,world.tick+36);}}
    if(scene){const pos=screen(scene.companion.x,scene.companion.y);this.rig('ken',pos.x,pos.y,this.camera.zoom,1,'run',scene.tick,0,'unarmed','Ken');if(scene.level.number===41){const p=screen(3550*Q,82*Q);this.rig('saul',p.x,p.y,2.7*this.camera.zoom,-1,scene.goliath.open?'recovery':'startup',scene.tick,0,'spear',scene.goliath.open?'Aim opportunity':'Goliath · reenactment');}}
    for(const f of world.fighters){if(!f.stocks||f.respawn){this.motion.delete(f.id);continue;}const visual=interpolatePosition(this.previous.get(f.id),f,active&&!this.debug&&!f.hitstop?alpha:1,200*Q);const p=screen(visual.x,visual.y);if(f.ground){const ground=screen(f.x,f.y);c.save();c.fillStyle='rgba(20,25,28,.22)';c.beginPath();c.ellipse(ground.x,ground.y+1,22*this.camera.zoom*f.scale,3.5*this.camera.zoom,0,0,Math.PI*2);c.fill();c.restore();}let pose=f.ai.tell>0?'startup':f.stun?'hitstun':!f.ground?(f.vy>Q?'air_rise':f.vy<-Q?'air_fall':'air_apex'):f.crouching?'crouch':Math.abs(f.vx)>100?'run':'idle';if(f.action?.kind==='attack'){const m=this.S.moves[f.action.move!];pose=f.action.tick<m.startup?'startup':f.action.tick<m.startup+m.active?'active':'recovery';}else if(f.action?.kind==='dodge')pose=f.action.airborne&&!f.action.dx&&!f.action.dy&&!this.reduced?'backflip':'dodge';else if(f.action?.kind==='dash')pose='dodge';else if(f.action?.kind==='throw')pose='weapon_throw';else if(f.action?.kind==='pickup')pose='weapon_pickup';if(f.stun)pose='hitstun';
      if(pose==='idle'&&(this.cheerUntil.get(f.id)??0)>world.tick)pose='happy';
      let motion=this.motion.get(f.id);if(!motion||world.tick<motion.tick)motion={tick:world.tick,pose,time:0,ground:!!f.ground,landUntil:0,stunned:!!f.stun};
      if(f.ground&&!motion.ground&&!f.action&&!f.stun)motion.landUntil=world.tick+5;
      if((pose==='idle'||pose==='run')&&world.tick<motion.landUntil)pose='land';
      if(motion.pose!==pose||motion.stunned!==!!f.stun){motion.pose=pose;motion.time=0;}else if(!f.hitstop)motion.time+=Math.max(0,world.tick-motion.tick)*(pose==='run'?runCadence(f.vx/Q):1);
      motion.tick=world.tick;motion.ground=!!f.ground;motion.stunned=!!f.stun;this.motion.set(f.id,motion);
      const hitEase=Math.max(0,1-motion.time/12);
      const recoil=f.stun&&!this.reduced?(f.ground?-.16*hitEase:Math.max(-.11,Math.min(.11,-f.vx/Q*.01))):0;
      const shieldFlight=world.projectiles.find(q=>q.owner===f.id&&q.rangeQ);const catchRecent=world.tick-(this.shieldCatchTicks.get(f.id)??-100)<8;
      this.rig(f.hero,p.x,p.y,this.camera.zoom*f.scale,f.facing,pose,pose==='run'?this.runDistance.phase(f.id,visual.x/Q,this.atlas[f.hero]?.['gait_'+f.weapon+'_0']?24:this.clips[f.hero]?.run?.ticks.reduce((a,b)=>a+b,0)??32):motion.time+(active&&!f.hitstop?alpha:0),(f.action?.tick??0)+(active&&!f.hitstop?alpha:0),f.weapon,(f.human?'P'+f.id+' · ':'')+f.name+(f.ai.tell>0?' · preparing':''),!!f.invulnerable&&world.tick%8<4,f.action?.kind==='attack'?f.action.move:'',recoil,f.action?.kind==='attack'&&f.action.tick<this.S.moves[f.action.move!].startup?f.action.charge:0,shieldFlight?(shieldFlight.returning?'return':'out'):catchRecent?(world.tick-(this.shieldCatchTicks.get(f.id)??0)<4?'catch':'settle'):f.weapon==='shield'&&f.action?.kind==='attack'&&this.S.moves[f.action.move!].projectile?.boomerangRangeUnits&&f.action.tick>this.S.moves[f.action.move!].startup?'settle':'');
      if(f.human&&!f.respawn)drawPlayerMark(c,f.id,p.x,p.y-(FIGURE_PX+34)*this.camera.zoom*f.scale,7);
      if(f.emote)this.emoteBubble(f.emote.id,p.x,p.y-(FIGURE_PX+(f.human?66:46))*this.camera.zoom*f.scale,world.tick-(f.emote.until-EMOTE_TICKS));
      if(f.action?.kind==='attack'&&f.action.tick<this.S.moves[f.action.move!].startup)drawCharge(c,f,p.x,p.y,this.camera.zoom*f.scale,world.tick,this.reduced);
      if(p.x<20||p.x>1260||p.y<90||p.y>700){c.fillStyle='#f0cf8d';c.strokeStyle='#364a4d';const px=Math.max(30,Math.min(1250,p.x)),py=Math.max(110,Math.min(680,p.y));c.beginPath();c.arc(px,py,18,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#203943';c.textAlign='center';c.font='bold 13px system-ui';c.fillText('P'+f.id,px,py+5);if(f.human)drawPlayerMark(c,f.id,px,py-26,6);}
      if(this.debug){c.strokeStyle='#e9f5b2';c.strokeRect(p.x-20*this.camera.zoom*f.scale,p.y-74*this.camera.zoom*f.scale,40*this.camera.zoom*f.scale,74*this.camera.zoom*f.scale);if(f.action?.kind==='attack'){const a=f.action,m=this.S.moves[a.move!];for(const ph of m.collisionPhases){const box=this.S.rectFor(f,ph.rectUnits,a.facing);const b=screen(box[0],box[1]+box[3]);c.strokeStyle=a.tick<m.startup?'#81b7de':a.tick<m.startup+m.active?'#ec8870':'#ddc983';c.strokeRect(b.x,b.y,box[2]/Q*this.camera.zoom,box[3]/Q*this.camera.zoom);}}}
    }
    this.collectElements(world);drawElements(c,{...world,events:this.elementEvents},screen,this.camera.zoom,this.reduced);
    for(const projectile of world.projectiles){const prior=this.previousProjectiles.get(projectile.id);
      const visual=interpolatePosition(prior??{x:projectile.x-projectile.vx,y:projectile.y-projectile.vy},projectile,active&&!this.debug?alpha:1,200*Q);
      const p=screen(visual.x,visual.y);
      const owner=world.fighters.find(f=>f.id===projectile.owner);
      const lifetime=this.S.moves[projectile.move]?.projectile?.lifetimeTicks;
      const clock=projectile.effect==='shield'&&lifetime!==undefined
        ? Math.max(0,lifetime-projectile.life-1+(active?alpha:1)) : world.tick;
      drawThrowWind(c,projectile,p.x,p.y,this.camera.zoom);
      if(drawElementProjectile(c,projectile,owner,p.x,p.y,this.camera.zoom,clock,this.reduced,this.atlas[owner?.hero??'']?.idle?.h))continue;
      if(projectile.weapon){c.save();c.translate(p.x,p.y);const owner=world.fighters.find(f=>f.id===projectile.owner);const bodyScale=owner?.scale??1;const weaponScale=projectile.weapon==='shield'?1:1.15;const k=this.camera.zoom*bodyScale*96/(this.atlas[owner?.hero??'']?.idle.h??192)*weaponScale;c.scale(k,k);drawFlyingWeapon(c,projectile.weapon,0,0,this.reduced?0:Math.atan2(-projectile.vy,projectile.vx)+Math.PI/2,this.reduced?0:world.tick*.65);c.restore();}else{c.fillStyle='#ebddad';c.strokeStyle='#4b4538';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,projectile.size[0]*this.camera.zoom/2,projectile.size[1]*this.camera.zoom/2,0,0,Math.PI*2);c.fill();c.stroke();}}
    for(const e of world.events){if(e.id<=this.lastEvent)continue;this.lastEvent=e.id;if(e.type==='hit')this.particles.push({x:e.x,y:e.y,time:0,damage:Math.floor((e.damage as number)/10)});}this.particles=this.particles.filter(p=>p.time++<24).slice(-40);
    for(const p of this.particles){const pos=screen(p.x,p.y);c.globalAlpha=1-p.time/25;c.strokeStyle='#ffe9aa';c.lineWidth=3;c.beginPath();c.arc(pos.x,pos.y,p.time*2,0,Math.PI*2);c.stroke();c.fillStyle='#fff4d0';c.textAlign='center';c.font='bold 22px Georgia';c.fillText('+'+p.damage,pos.x,pos.y-p.time*2-10);}c.globalAlpha=1;
    if(world.phase==='countdown'){c.fillStyle='rgba(23,40,47,.4)';c.fillRect(0,0,1280,720);c.fillStyle='#ffe5ad';c.textAlign='center';c.font='bold 100px Georgia';c.fillText(String(Math.max(1,Math.ceil(world.countdown/60))),640,330);}
    if(this.debug){c.fillStyle='rgba(15,30,36,.85)';c.fillRect(18,110,290,110);c.fillStyle='#ede3c6';c.font='13px monospace';const f=world.fighters[0];c.fillText('Tick '+world.tick+' · Q8 integers',30,135);c.fillText('Action '+(f.action?.move||f.action?.kind||'idle')+' '+(f.action?.tick||0),30,157);c.fillText('Jumps '+f.jumps+' · Recovery '+f.recovery,30,179);c.fillText('Dodge cooldown '+f.dodgeCD+' · Wall '+f.wallTicks,30,201);const tr=this.training;if(tr){c.fillStyle='rgba(15,30,36,.85)';c.fillRect(18,226,290,64+Math.min(8,tr.history.length)*18);c.fillStyle='#ede3c6';c.fillText('Combo '+tr.combo.hits+' hits · '+Math.floor(tr.combo.damageTenths/10)+' dmg · best '+tr.combo.best,30,250);c.fillText('Escape gap before last hit: '+tr.combo.lastGap+(tr.combo.lastGap===0&&tr.combo.hits>1?' (true link)':' ticks'),30,272);tr.history.slice(-8).forEach((h:any,k:number)=>c.fillText(String(h.tick).padStart(6)+'  '+h.text,30,294+k*18));}}
  }
}
