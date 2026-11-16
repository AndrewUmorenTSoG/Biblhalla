// Optional native-canvas contact sheet; production builds need no native module.
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {ROOT,loadContent} from '../lib/content.ts';
const require=createRequire(join(process.env.BIBLHALLA_CANVAS_ROOT??ROOT,'package.json'));
const {createCanvas,Image}=require('@napi-rs/canvas');
(globalThis as any).Image=Image;
const {Renderer}=await import('../../apps/game/src/render/renderer.ts');
const e=JSON.parse(readFileSync(join(ROOT,'assets/runtime/fighters/fighters.json'),'utf8')).gideon;
const img=new Image();img.src=readFileSync(join(ROOT,e.image));const page=new Image();page.src=readFileSync(join(ROOT,e.pages.gideon_shield_kit.image));
// Embedded weapon Image objects may decode asynchronously in native canvas too.
await new Promise(resolve=>setTimeout(resolve,100));
const canvas=createCanvas(1280,1520),c=canvas.getContext('2d');c.fillStyle='#203a46';c.fillRect(0,0,1280,1520);
const r=Object.create(Renderer.prototype);Object.assign(r,{ctx:c,S:{moves:Object.fromEntries(loadContent().attacks.attacks.map(m=>[m.id,m]))},atlas:{gideon:e.frames},clips:{gideon:e.clips},art:{gideon:img,gideon_shield_kit:page},reduced:false});
for(const [row,kind] of ['rush','lift','sweep','air'].entries())for(let i=0;i<16;i++){
 const x=i%8*160+80,y=(row*2+Math.floor(i/8))*190+164;
 r.frameFor=()=>`release_${kind}_${i}`;
 c.strokeStyle='#6f8690';c.beginPath();c.moveTo(x-75,y);c.lineTo(x+75,y);c.stroke();
 r.rig('gideon',x,y,1.35,1,'active',0,0,'shield','',false,'preview');
 c.fillStyle='#f3e2bc';c.font='13px sans-serif';c.fillText(kind+' '+i,x-65,y+20);
}
writeFileSync(join(ROOT,'assets/animation-production/gideon-shield-kit/contact.png'),canvas.toBuffer('image/png'));
console.log('Created 64-pose equipped contact sheet');
