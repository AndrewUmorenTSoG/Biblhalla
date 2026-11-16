// Art pipeline (Codex): quick check that a preview page loads and draws without errors.

import {readFileSync} from 'node:fs';
import vm from 'node:vm';
let draws=0;const ctx=new Proxy({} as any,{get:()=>()=>{draws++;},set:()=>true});
const nodes=new Map();const node=(id:string)=>{if(!nodes.has(id))nodes.set(id,{checked:false,value:id==='move'?'gideon_shield_ssig':'',append:()=>{},getContext:()=>ctx});return nodes.get(id);};
const sandbox=vm.createContext({console,document:{getElementById:node,createElement:()=>({})},Image:class{complete=true;naturalWidth=1024;src=''},requestAnimationFrame:()=>{},structuredClone});
const html=readFileSync('assets/animation-production/gideon-shield-kit/PLAY.html','utf8');for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]).runInContext(sandbox);
const result=vm.runInContext(`let checks={actions:0,rush:0,lift:0,throw:0};for(const id of ids)for(const direction of [-1,1])for(const charged of [false,true]){select.value=id;facing=direction;document.getElementById('charge').checked=charged;reset();last=0;let peak=f.y,travel=f.x;for(let n=0;n<155;n++){paint(1000+n*1000/60);peak=Math.max(peak,f.y);if(s.projectiles.length)checks.throw++;}checks.actions++;if(id==='gideon_shield_ssig'&&Math.abs(f.x-travel)===96*256)checks.rush++;if(id==='gideon_shield_nsig'&&peak>130*256)checks.lift++;}checks`,sandbox,{timeout:30000});
if(result.actions!==48||result.rush!==4||result.lift!==4||result.throw<4||draws<10000)throw Error(JSON.stringify({result,draws}));
console.log('Gideon shield preview passed',result,draws+' Canvas operations');
