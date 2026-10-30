(function(root:any){
'use strict';
const C=root.BiblhallaContent;
const ids=new Set(C.campaign.levels.map((l:any)=>l.id));
const key='biblhalla-profile-v1',backupKey=key+'-backup';
const defaults=()=>({schema:1,contentVersion:C.hash||'main-1',completed:[],medals:{},checkpoint:null,journal:[],settings:{input:'keyboard',difficulty:'easy',mute:false,reducedMotion:false,leftHanded:false,touchSize:80,touchOpacity:0.8,deadzone:0.2,uiScale:1,captionSpeed:1,symbolicFinale:true,bindings:{left:'KeyA',right:'KeyD',up:'KeyW',down:'KeyS',jump:'Space',light:'KeyJ',heavy:'KeyK',dodge:'ShiftLeft',item:'KeyL',interact:'KeyE',pause:'Escape'}},controlChecked:false});
function validate(raw:any){
  if(!raw||raw.schema!==1||!Array.isArray(raw.completed)||raw.completed.length>84)throw Error('Unsupported or invalid save');
  const d=defaults();d.completed=[...new Set(raw.completed.filter((id:any)=>typeof id==='string'&&ids.has(id)))].sort();
  if(raw.journal&&Array.isArray(raw.journal))d.journal=[...new Set(raw.journal.filter((id:any)=>ids.has(id)))].slice(0,84);
  if(raw.medals&&typeof raw.medals==='object')for(const id of d.completed)if(['easy','hard','extreme'].includes(raw.medals[id]))(d.medals as any)[id]=raw.medals[id];
  if(raw.checkpoint&&ids.has(raw.checkpoint.level)&&['entry','middle_or_phase_two','exit'].includes(raw.checkpoint.stage)){
    const cp=raw.checkpoint;d.checkpoint={level:cp.level,stage:cp.stage,seed:Number.isInteger(cp.seed)?cp.seed>>>0:613891,progress:Array.isArray(cp.progress)?cp.progress.filter((v:any)=>Number.isInteger(v)&&v>=0&&v<32):[],combatCleared:!!cp.combatCleared} as any;
  }
  if(raw.settings){const s=raw.settings;for(const k of ['mute','reducedMotion','leftHanded','symbolicFinale'])if(typeof s[k]==='boolean')(d.settings as any)[k]=s[k];
    if(['keyboard','touch','controller'].includes(s.input))d.settings.input=s.input;
    if(['easy','hard','extreme'].includes(s.difficulty))d.settings.difficulty=s.difficulty;
    for(const [k,min,max] of [['touchSize',64,100],['touchOpacity',0.3,1],['deadzone',0.1,0.5],['uiScale',0.85,1.3],['captionSpeed',0.5,2]] as any)if(typeof s[k]==='number'&&Number.isFinite(s[k]))(d.settings as any)[k]=Math.min(max,Math.max(min,s[k]));
    if(s.bindings&&typeof s.bindings==='object')for(const k of Object.keys(d.settings.bindings))if(typeof s.bindings[k]==='string'&&/^(Key[A-Z]|Digit[0-9]|Arrow(Left|Right|Up|Down)|Space|Shift(Left|Right)|Control(Left|Right)|Enter|Escape|Backspace|Tab)$/.test(s.bindings[k]))(d.settings.bindings as any)[k]=s.bindings[k];
  }
  d.controlChecked=!!raw.controlChecked;return d;
}
class Store{
  data:any;storage:any;status:string;durable:boolean;
  constructor(storage:any=null){this.storage=storage;this.data=defaults();this.status='Saved on this device';this.durable=true;this.load();}
  load(){if(!this.storage){this.durable=false;this.status='Storage unavailable — use Export save to keep progress';return;}try{let raw=this.storage.getItem(key);if(!raw){raw=this.storage.getItem(backupKey);if(raw)this.status='Recovered previous valid save';}if(raw){try{this.data=validate(JSON.parse(raw));}catch(e){const backup=this.storage?.getItem(backupKey);if(!backup)throw e;this.data=validate(JSON.parse(backup));this.status='Recovered previous valid save';}}}catch(e){this.durable=false;this.status='Storage unavailable — use Export save to keep progress';}}
  save(){try{if(!this.storage)throw Error('No storage');const previous=this.storage.getItem(key);if(previous){try{validate(JSON.parse(previous));this.storage.setItem(backupKey,previous);}catch(e){}}this.storage.setItem(key,JSON.stringify(this.data));this.durable=true;this.status='Saved on this device';}catch(e){this.durable=false;this.status='Playing in memory — export to keep progress';}return this.durable;}
  checkpoint(level:string,stage:string,progress:number[]=[],combatCleared=false,seed=613891){this.data.checkpoint={level,stage,progress:[...progress],combatCleared,seed};this.save();}
  complete(level:string,difficulty:string){if(!ids.has(level))return false;if(!this.data.completed.includes(level))this.data.completed.push(level);this.data.medals[level]=difficulty;this.data.checkpoint={level,stage:'exit',progress:[],combatCleared:true,seed:613891};if(!this.data.journal.includes(level))this.data.journal.push(level);this.save();return true;}
  unlocked(level:any){return !level.unlockAfter||this.data.completed.includes(level.unlockAfter);}
  export(){return JSON.stringify(this.data,null,2);}
  import(text:string){if(text.length>1048576)throw Error('Save is too large');this.data=validate(JSON.parse(text));this.save();}
}
root.BiblhallaStorage={Store,validate,defaults,key,backupKey};
})(globalThis);
