(function(root:any){
'use strict';
const C=root.BiblhallaContent,S=root.BiblhallaSim;
function validate(raw:any){
  if(!raw||raw.schema!==1||raw.contentHash!==(C.hash||'development')||!Array.isArray(raw.entries)||raw.entries.length>24000)throw Error('Unsupported replay or content version');
  const initial=raw.initial,opts=initial?.options;if(!opts||!['duel','waves','boss','local','teams','ffa'].includes(opts.mode||'duel'))throw Error('Invalid replay mode');
  if(opts.hero&&!S.defs[opts.hero]||opts.opponent&&!S.defs[opts.opponent]||opts.arena&&!C.maps.maps.some((m:any)=>m.id===opts.arena))throw Error('Invalid replay content');
  if(opts.fighters){if(!Array.isArray(opts.fighters)||opts.fighters.length<2||opts.fighters.length>4)throw Error('Invalid replay players');for(const f of opts.fighters)if(!f||!C.fighters.fighters.some((d:any)=>d.id===f.hero)||typeof f.human!=='boolean'||!Number.isInteger(f.team)||f.team<0||f.team>3||typeof f.inputId!=='string'||f.inputId.length>24||f.stocks!==undefined&&(!Number.isInteger(f.stocks)||f.stocks<1||f.stocks>3))throw Error('Invalid replay fighter');}
  if(opts.waves&&(!Array.isArray(opts.waves)||opts.waves.length>4||opts.waves.some((w:any)=>!Array.isArray(w)||w.length>8||w.some((id:any)=>typeof id!=='string'||id.length>32))))throw Error('Invalid wave list');
  const canonical=S.create(opts);if(S.hash(initial)!==S.hash(canonical))throw Error('Replay initial state is not a canonical match start');
  for(const entry of raw.entries){if(entry.kind==='input'){if(!entry.frames||typeof entry.frames!=='object'||Array.isArray(entry.frames)||Object.keys(entry.frames).length>8)throw Error('Invalid input frame');for(const [key,value] of Object.entries(entry.frames) as any){if(key.length>24||!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some((k:string)=>!['x','y','jump','jumpHeld','light','heavy','heavyHeld','dodge','item','interact'].includes(k)))throw Error('Invalid semantic input');for(const [k,v] of Object.entries(value)){if(k==='x'||k==='y'){if(v!==-1&&v!==0&&v!==1)throw Error('Invalid axis');}else if(typeof v!=='boolean')throw Error('Invalid button');}}}else if(entry.kind!=='pause'||typeof entry.on!=='boolean')throw Error('Invalid replay event');}
  if(typeof raw.finalHash!=='string'||!/^[a-f0-9]{8}$/.test(raw.finalHash))throw Error('Invalid checksum');return {schema:1,contentHash:raw.contentHash,initial:canonical,entries:raw.entries,finalHash:raw.finalHash};
}
function simulate(record:any){const r=validate(record),s=S.snapshot(r.initial);for(const e of r.entries){if(e.kind==='pause')S.pause(s,e.on);else S.step(s,e.frames);}return {state:s,hash:S.hash(s),verified:S.hash(s)===r.finalHash};}
root.BiblhallaReplay={validate,simulate};
})(globalThis);
