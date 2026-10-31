// Canvas 2D renderer. Reads simulation state and events; never mutates them.
// Floating-point camera and interpolation live here only.

import type { Engine, SimState } from '../../../../packages/sim/src/index.ts';
import type { Scene } from '../../../../packages/campaign/src/index.ts';
import { Q } from '../../../../packages/sim/src/index.ts';
import { paintArenaScenery, paintArenaSurface } from './arena-scenes.ts';
import { drawWeapon } from './weapons.ts';
import { interpolatePosition, cameraEase, runCadence } from './animation.ts';

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
  previous=new Map<number,{x:number;y:number}>();
  lastWorld:SimState|null=null;
  capture(world:SimState){if(this.lastWorld!==world){this.motion.clear();this.previous.clear();this.lastWorld=world;}for(const f of world.fighters)this.previous.set(f.id,{x:f.x,y:f.y});}
  motion=new Map<number,{tick:number;pose:string;time:number;ground:boolean;landUntil:number}>();
  canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D;S:Engine;art:Record<string,HTMLImageElement>;atlas:Record<string,any>;arenas:Record<string,ArenaArt>;clips:Record<string,Record<string,Clip>>;symbolic=false;camera:any={x:0,y:170,zoom:1};particles:any[]=[];lastEvent=0;debug=false;reduced=false;
  constructor(canvas:HTMLCanvasElement,S:Engine,art:RuntimeArt={images:{},atlas:{}}){this.canvas=canvas;this.ctx=canvas.getContext('2d')!;this.S=S;this.art=art.images;this.atlas=art.atlas;this.arenas=art.arenas??{};this.clips=art.clips??{};}
  round(x:number,y:number,w:number,h:number,r=5){const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();c.stroke();}
  /** Loaded painted backdrop for an arena palette slot, if one shipped. */
  arenaArt(palette:number):ArenaArt|null{const a=this.arenas[this.S.content.maps.maps[palette%6].id];return a&&a.image.complete&&a.image.naturalWidth?a:null;}
  background(tick:number,palette:number,story:any=null){const c=this.ctx;const p=palettes[palette%6];const sky=c.createLinearGradient(0,0,0,650);sky.addColorStop(0,p[0]);sky.addColorStop(.72,p[1]);sky.addColorStop(1,p[2]);c.fillStyle=sky;c.fillRect(0,0,1280,720);
    // Painted far layer: sky and distant land only. Platforms come from collision data, never the painting.
    const art=this.arenaArt(palette);let painted=false;
    if(art){const h=330,w=h*art.image.naturalWidth/art.image.naturalHeight,off=this.reduced?0:Math.max(-(w-1280)/2,Math.min((w-1280)/2,-this.camera.x*.05));c.drawImage(art.image,640-w/2+off,0,w,h);const fade=c.createLinearGradient(0,h-70,0,h+50);fade.addColorStop(0,art.horizon+'00');fade.addColorStop(1,art.horizon);c.fillStyle=fade;c.fillRect(0,h-70,1280,120);c.fillStyle=art.horizon;c.fillRect(0,h+50,1280,720-h-50);painted=true;}
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
    if(!move&&this.atlas[hero]?.[pose]&&['air_rise','air_apex','air_fall','land'].includes(pose))return pose;
    if(!move&&pose==='idle'&&weapon!=='unarmed')return 'idle';
    if(!move&&pose==='idle'&&weapon==='unarmed'&&!this.clips[hero]?.idle&&this.atlas[hero]?.motion_idle)return 'motion_idle';
    // Authored clips (docs/ART_INTEGRATION.md): attacks advance with the action tick, loops with world time.
    const clips=this.clips[hero];
    const name=move||POSE_CLIPS[pose]||'idle';
    const clip=clips?.[name];
    if(clip&&clip.frames.length){const total=clip.ticks.reduce((a:number,b:number)=>a+b,0);let t=move?Math.min(attackTick,total-1):clip.loop===false?Math.min(time,total-1):time%Math.max(1,total);for(let k=0;k<clip.frames.length;k++){if(t<clip.ticks[k])return clip.frames[k];t-=clip.ticks[k];}return clip.frames[clip.frames.length-1];}
    // Concept-cut fallback: one key pose per signature, the light pose for other attacks.
    if(move&&(pose==='startup'||pose==='active')){const m=/_(n|s|d)sig$/.exec(move);return m&&move.startsWith(hero+'_')?'sig_'+weapon+'_'+m[1]:'light';}
    return pose==='dodge'?'turnaround':'idle';
  }

  rig(hero:string,x:number,y:number,scale:number,facing:number,pose:string,time:number,attackTick:number=0,weapon='unarmed',label='',ghost=false,move=''){const c=this.ctx,p=colors[hero]||colors.dru;
    const sheet=this.art[hero],frames=this.atlas[hero];
    if(sheet&&sheet.complete&&sheet.naturalWidth&&frames){const frame=frames[this.frameFor(hero,pose,weapon,move,attackTick,time)]||frames.idle;if(frame){
      // Concept-cut stand-ins: scale so the idle pose spans the shared 74-unit hurtbox plus head room.
      const k=scale*FIGURE_PX/frames.idle.h;const bob=pose==='run'&&!this.reduced&&!this.clips[hero]?.run?Math.abs(Math.sin(time*.25))*3*scale:0;
      c.save();c.translate(x,y-bob);c.scale(facing*k,k);if(ghost)c.globalAlpha=.35;if(pose==='recovery'&&!move&&!this.clips[hero]?.hitstun)c.rotate(-.12);
      c.drawImage(sheet,frame.x,frame.y,frame.w,frame.h,-frame.pivotX,-frame.pivotY,frame.w,frame.h);c.restore();
      if(!move&&weapon!=='unarmed'&&(pose==='run'||pose.startsWith('air_')||pose==='land'||pose==='dodge'||pose==='recovery')){c.save();c.translate(x,y);c.scale(scale*facing,scale);this.weapon(weapon,22,-frame.h/frames.idle.h*FIGURE_PX*.62,-.4,p[1]);c.restore();}
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
    c.save();c.translate(640,460);c.scale(this.camera.zoom,-this.camera.zoom);c.translate(-this.camera.x,-this.camera.y);
    for(const pl of [map.main,...map.platforms])paintArenaSurface(c,map.id,pl.rectUnits,pl.kind==='solid');
    for(const it of world.items){const x=it.x/Q,y=it.y/Q;c.save();c.translate(x,y+18);c.scale(1,-1);c.fillStyle=it.neutral?'#c7a466':'#9caa93';c.strokeStyle='#493e2e';this.round(-18,-18,36,32,5);c.beginPath();c.moveTo(-12,-12);c.lineTo(12,9);c.moveTo(12,-12);c.lineTo(-12,9);c.stroke();c.restore();}
    if(scene){
      for(const m of scene.markers){if(m.done)continue;if(scene.level.number===1&&m.id>scene.done.length)continue;const x=(m.carried||m.type==='escort'&&m.stage?m.targetX:m.x)/Q,y=m.y/Q;
        c.save();c.translate(x,y+32);c.scale(1,-1);c.fillStyle=m.carried?'rgba(232,208,155,.3)':'#e5c17f';c.strokeStyle='#5c4a30';c.lineWidth=2;c.beginPath();c.moveTo(0,-22);c.lineTo(21,0);c.lineTo(0,22);c.lineTo(-21,0);c.closePath();c.fill();c.stroke();c.fillStyle='#4b4134';c.textAlign='center';c.font='bold 14px system-ui';c.fillText(String(m.id+1),0,5);c.font='12px system-ui';c.fillStyle='#233a40';c.fillText(m.carried?'Deliver here':m.type==='escort'&&m.stage?'Safe gate':m.label,0,-32);c.restore();
      }
      for(const h of scene.hazards){c.fillStyle=h.state==='active'?'rgba(161,69,54,.45)':h.state==='tell'?'rgba(206,160,78,.35)':'rgba(61,91,75,.15)';c.fillRect(h.x/Q-48,80,96,180);c.save();c.translate(h.x/Q,300);c.scale(1,-1);c.fillStyle='#263e42';c.textAlign='center';c.font='bold 13px system-ui';c.fillText(h.state==='active'?'WAIT':h.state==='tell'?'LOOKOUT':'CLEAR',0,0);c.restore();}
    }
    c.restore();
    const screen=(x:number,y:number)=>({x:640+(x/Q-this.camera.x)*this.camera.zoom,y:460-(y/Q-this.camera.y)*this.camera.zoom});
    if(scene){const pos=screen(scene.companion.x,scene.companion.y);this.rig('ken',pos.x,pos.y,this.camera.zoom,1,'run',scene.tick,0,'unarmed','Ken');if(scene.level.number===41){const p=screen(3550*Q,82*Q);this.rig('saul',p.x,p.y,2.7*this.camera.zoom,-1,scene.goliath.open?'recovery':'startup',scene.tick,0,'spear',scene.goliath.open?'Aim opportunity':'Goliath · reenactment');}}
    for(const f of world.fighters){if(!f.stocks||f.respawn){this.motion.delete(f.id);continue;}const visual=interpolatePosition(this.previous.get(f.id),f,active&&!this.debug&&!f.hitstop?alpha:1,200*Q);const p=screen(visual.x,visual.y);let pose=f.ai.tell>0?'startup':f.stun?'recovery':!f.ground?(f.vy>Q?'air_rise':f.vy<-Q?'air_fall':'air_apex'):Math.abs(f.vx)>100?'run':'idle';if(f.action?.kind==='attack'){const m=this.S.moves[f.action.move!];pose=f.action.tick<m.startup?'startup':f.action.tick<m.startup+m.active?'active':'recovery';}else if(f.action?.kind==='dodge'||f.action?.kind==='dash')pose='dodge';
      let motion=this.motion.get(f.id);if(!motion||world.tick<motion.tick)motion={tick:world.tick,pose,time:0,ground:!!f.ground,landUntil:0};
      if(f.ground&&!motion.ground&&!f.action&&!f.stun)motion.landUntil=world.tick+5;
      if((pose==='idle'||pose==='run')&&world.tick<motion.landUntil)pose='land';
      if(motion.pose!==pose){motion.pose=pose;motion.time=0;}else if(!f.hitstop)motion.time+=Math.max(0,world.tick-motion.tick)*(pose==='run'?runCadence(f.vx/Q):1);
      motion.tick=world.tick;motion.ground=!!f.ground;this.motion.set(f.id,motion);
      this.rig(f.hero,p.x,p.y,this.camera.zoom*f.scale,f.facing,pose,motion.time,f.action?.tick||0,f.weapon,(f.human?'P'+f.id+' · ':'')+f.name+(f.ai.tell>0?' · preparing':''),!!f.invulnerable&&world.tick%8<4,f.action?.kind==='attack'?f.action.move:'');
      if(p.x<20||p.x>1260||p.y<90||p.y>700){c.fillStyle='#f0cf8d';c.strokeStyle='#364a4d';const px=Math.max(30,Math.min(1250,p.x)),py=Math.max(110,Math.min(680,p.y));c.beginPath();c.arc(px,py,18,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#203943';c.textAlign='center';c.font='bold 13px system-ui';c.fillText('P'+f.id,px,py+5);}
      if(this.debug){c.strokeStyle='#e9f5b2';c.strokeRect(p.x-20*this.camera.zoom*f.scale,p.y-74*this.camera.zoom*f.scale,40*this.camera.zoom*f.scale,74*this.camera.zoom*f.scale);if(f.action?.kind==='attack'){const a=f.action,m=this.S.moves[a.move!];for(const ph of m.collisionPhases){const box=this.S.rectFor(f,ph.rectUnits,a.facing);const b=screen(box[0],box[1]+box[3]);c.strokeStyle=a.tick<m.startup?'#81b7de':a.tick<m.startup+m.active?'#ec8870':'#ddc983';c.strokeRect(b.x,b.y,box[2]/Q*this.camera.zoom,box[3]/Q*this.camera.zoom);}}}
    }
    for(const projectile of world.projectiles){const p=screen(projectile.x,projectile.y);if(projectile.weapon){c.save();c.translate(p.x,p.y);c.scale(this.camera.zoom*.65,this.camera.zoom*.65);this.weapon(projectile.weapon,0,0,this.reduced?0:world.tick*.24,'#527c89');c.restore();}else{c.fillStyle='#ebddad';c.strokeStyle='#4b4538';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,projectile.size[0]*this.camera.zoom/2,projectile.size[1]*this.camera.zoom/2,0,0,Math.PI*2);c.fill();c.stroke();}}
    for(const e of world.events){if(e.id<=this.lastEvent)continue;this.lastEvent=e.id;if(e.type==='hit')this.particles.push({x:e.x,y:e.y,time:0,damage:Math.floor((e.damage as number)/10)});}this.particles=this.particles.filter(p=>p.time++<24).slice(-40);
    for(const p of this.particles){const pos=screen(p.x,p.y);c.globalAlpha=1-p.time/25;c.strokeStyle='#ffe9aa';c.lineWidth=3;c.beginPath();c.arc(pos.x,pos.y,p.time*2,0,Math.PI*2);c.stroke();c.fillStyle='#fff4d0';c.textAlign='center';c.font='bold 22px Georgia';c.fillText('+'+p.damage,pos.x,pos.y-p.time*2-10);}c.globalAlpha=1;
    if(world.phase==='countdown'){c.fillStyle='rgba(23,40,47,.4)';c.fillRect(0,0,1280,720);c.fillStyle='#ffe5ad';c.textAlign='center';c.font='bold 100px Georgia';c.fillText(String(Math.max(1,Math.ceil(world.countdown/60))),640,330);}
    if(this.debug){c.fillStyle='rgba(15,30,36,.85)';c.fillRect(18,110,290,110);c.fillStyle='#ede3c6';c.font='13px monospace';const f=world.fighters[0];c.fillText('Tick '+world.tick+' · Q8 integers',30,135);c.fillText('Action '+(f.action?.move||f.action?.kind||'idle')+' '+(f.action?.tick||0),30,157);c.fillText('Jumps '+f.jumps+' · Recovery '+f.recovery,30,179);c.fillText('Dodge cooldown '+f.dodgeCD+' · Wall '+f.wallTicks,30,201);}
  }
}
