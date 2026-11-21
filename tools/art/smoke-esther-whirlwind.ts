import {readFileSync} from 'node:fs';
import vm from 'node:vm';
let operations=0;const ctx=new Proxy({}as any,{get:()=>()=>{operations++;},set:()=>true});
const nodes=new Map();const node=(id:string)=>{if(!nodes.has(id))nodes.set(id,{checked:false,getContext:()=>ctx});return nodes.get(id);};
const sandbox=vm.createContext({console,document:{getElementById:node},Image:class{complete=true;naturalWidth=1024;src=''},requestAnimationFrame:()=>{},structuredClone});
const html=readFileSync('assets/animation-production/esther-whirlwind/PLAY.html','utf8');for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]).runInContext(sandbox);
const result=vm.runInContext(`let runs=0;for(const kind of [false,true])for(const dir of [-1,1])for(const charged of [false,true])for(const reduced of [false,true]){heavy=kind;facing=dir;document.getElementById('charge').checked=charged;document.getElementById('reduced').checked=reduced;reset();paused=true;for(let n=0;n<160;n++){tick();paint(1000);}if(f.hits!==4)throw Error('Expected four hits: '+[kind,dir,charged,reduced,f.hits]);runs++;}runs`,sandbox,{timeout:30000});
console.log('Esther preview passed: '+result+' mirrored/charged/reduced-motion runs, '+operations+' Canvas operations');
