// Keyboard, touch and controller input mapped to semantic frames. Device edges are
// consumed once per simulation tick; focus loss clears held state.

import type { Settings } from '../storage/profile.ts';

const actions=['jump','light','heavy','dodge','item','interact'];
export class Inputs{
  held:Set<string>;edges:Set<string>;touch:any;touchEdges:Set<string>;axis:any;settings:Settings;onPause:()=>void;active:boolean;controlActivity:number;padPrevious:any;padSeen:Set<number>;stick:any;stickPointer:number|null;
  constructor(settings:Settings,onPause:()=>void){this.settings=settings;this.onPause=onPause;this.held=new Set();this.edges=new Set();this.touch={};this.touchEdges=new Set();this.axis={x:0,y:0};this.active=false;this.controlActivity=0;this.padPrevious={};this.padSeen=new Set();this.stick=null;this.stickPointer=null;
    window.addEventListener('keydown',(e:KeyboardEvent)=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.target instanceof HTMLTextAreaElement)return;
      if(e.code===this.settings.bindings.pause||e.code==='KeyP'){if(this.active){e.preventDefault();this.onPause();}return;}
      if(Object.values(this.settings.bindings).includes(e.code)||e.code.startsWith('Arrow')){if(this.active)e.preventDefault();if(!this.held.has(e.code)){this.edges.add(e.code);this.controlActivity++;}this.held.add(e.code);}
    });window.addEventListener('keyup',(e:KeyboardEvent)=>{this.held.delete(e.code);});window.addEventListener('blur',()=>this.clear());
  }
  clear(){this.held.clear();this.edges.clear();this.touch={};this.touchEdges.clear();this.axis={x:0,y:0};this.padPrevious={};this.stickPointer=null;document.querySelectorAll('[data-action].held').forEach(e=>e.classList.remove('held'));const thumb=document.querySelector('.stick-thumb') as HTMLElement;if(thumb)thumb.style.transform='translate(-50%,-50%)';}
  keyboard(){const b=this.settings.bindings,h=(key:string)=>this.held.has(b[key]),edge=(key:string)=>this.edges.has(b[key]);return {x:Number(h('right')||this.held.has('ArrowRight'))-Number(h('left')||this.held.has('ArrowLeft')),y:Number(h('up')||this.held.has('ArrowUp'))-Number(h('down')||this.held.has('ArrowDown')),jump:edge('jump'),jumpHeld:h('jump'),light:edge('light'),heavy:edge('heavy'),heavyHeld:h('heavy'),dodge:edge('dodge'),item:edge('item'),interact:edge('interact'),interactHeld:h('interact')};}
  pads(){return Array.from(navigator.getGamepads?.()||[]).filter((p:any)=>p&&p.connected) as Gamepad[];}
  gamepad(index:number){const pad=this.pads().find(p=>p.index===index);if(!pad)return {};const old=this.padPrevious[index]||[];const values=pad.buttons.map(b=>b.pressed);const edge=(n:number)=>values[n]&&!old[n];const dz=this.settings.deadzone;let x=Math.abs(pad.axes[0]||0)>dz?Math.sign(pad.axes[0]):0,y=Math.abs(pad.axes[1]||0)>dz?-Math.sign(pad.axes[1]):0;if(values[14])x=-1;if(values[15])x=1;if(values[12])y=1;if(values[13])y=-1;
    if(values.some(Boolean)||x||y){this.padSeen.add(index);this.controlActivity++;}if(edge(9)&&this.active)this.onPause();this.padPrevious[index]=values;return {x,y,jump:edge(0),jumpHeld:values[0],light:edge(2),heavy:edge(3),heavyHeld:values[3],dodge:edge(1),item:edge(5),interact:edge(4),interactHeld:values[4]};
  }
  readAll(){const frames:any={keyboard:this.keyboard(),touch:{x:Math.sign(this.axis.x),y:Math.sign(this.axis.y),jumpHeld:!!this.touch.jump,heavyHeld:!!this.touch.heavy,interactHeld:!!this.touch.interact}};for(const a of actions)frames.touch[a]=this.touchEdges.has(a);for(const pad of this.pads())frames['pad:'+pad.index]=this.gamepad(pad.index);this.edges.clear();this.touchEdges.clear();return frames;}
  bindTouch(layer:HTMLElement){
    const ownership=new Map<number,string>();
    const release=(id:number)=>{const a=ownership.get(id);if(!a)return;ownership.delete(id);this.touch[a]=[...ownership.values()].includes(a);if(!this.touch[a])layer.querySelector('[data-action='+a+']')?.classList.remove('held');};
    layer.querySelectorAll('[data-action]').forEach((el:any)=>{el.addEventListener('pointerdown',(e:PointerEvent)=>{e.preventDefault();el.setPointerCapture(e.pointerId);const a=el.dataset.action;ownership.set(e.pointerId,a);this.touch[a]=true;this.touchEdges.add(a);this.controlActivity++;el.classList.add('held');});for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,((e:PointerEvent)=>release(e.pointerId)) as EventListener);});
    const stick=layer.querySelector('.stick') as HTMLElement,thumb=layer.querySelector('.stick-thumb') as HTMLElement;this.stick=stick;
    const move=(e:PointerEvent)=>{if(e.pointerId!==this.stickPointer)return;const r=stick.getBoundingClientRect();let x=(e.clientX-(r.x+r.width/2))/(r.width*.35),y=((r.y+r.height/2)-e.clientY)/(r.height*.35);const len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}this.axis={x:Math.abs(x)>.2?x:0,y:Math.abs(y)>.4?y:0};thumb.style.transform='translate(calc(-50% + '+(x*r.width*.25)+'px),calc(-50% + '+(-y*r.height*.25)+'px))';};
    stick.addEventListener('pointerdown',(e:PointerEvent)=>{if(this.stickPointer!==null)return;e.preventDefault();this.stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);move(e);this.controlActivity++;});stick.addEventListener('pointermove',move);
    const end=(e:PointerEvent)=>{if(e.pointerId===this.stickPointer){this.stickPointer=null;this.axis={x:0,y:0};thumb.style.transform='translate(-50%,-50%)';}};for(const ev of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(ev,end as EventListener);
  }
}
