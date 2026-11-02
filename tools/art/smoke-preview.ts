// Execute every preview clip with a recording Canvas stub: catches JS errors,
// missing atlas frames and charge/effect branches without a browser dependency.
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';
import {ROOT} from '../lib/content.ts';
let draws=0;
const ctx=new Proxy({} as any,{get:(_,key)=> (..._args:any[])=>{if(key==='drawImage')draws++;},set:()=>true});
const element=(tag:string)=>({tag,value:'',children:[] as any[],append(...els:any[]){this.children.push(...els);if(this.tag==='select'&&!this.value)this.value=els[0]?.value??'';},getContext:()=>ctx});
const nodes=new Map<string,any>();
const sandbox=vm.createContext({console,document:{createElement:element,getElementById:(id:string)=>{if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id);}},Image:class{complete=true;naturalWidth=1024;src='';},requestAnimationFrame:()=>{}});
const html=readFileSync(join(ROOT,'assets/animation-production/attacks.html'),'utf8');
for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]).runInContext(sandbox);
vm.runInContext(`for(const item of items){for(const option of item.select.children){item.select.value=option.value;const m=moves[option.value];for(const tick of [0,m.startup,m.startup+m.active-1,m.totalTicks-1]){time=tick*1000/60;last=0;frame(0);}}}charged=true;for(const item of items){const option=item.select.children.find(o=>moves[o.value].chargeable);item.select.value=option.value;time=(moves[option.value].startup+15)*1000/60;last=0;frame(0);}`,sandbox,{timeout:20000});
if(draws<1000)throw Error('Preview did not draw the roster');
console.log(`Preview smoke check passed: ${draws} sprite draws across every clip and charged heavies.`);
