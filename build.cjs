'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {stripTypeScriptTypes}=require('node:module');
const root=__dirname,src=path.join(root,'main-game');
const read=file=>fs.readFileSync(path.join(src,file),'utf8');
const content=JSON.parse(read('content.json'));
const artDir=path.join(root,'assets');
const art={};
for(const name of ['david','samson','elah','susa','builders']){const file=path.join(artDir,name+'.png');if(fs.existsSync(file))art[name]='data:image/png;base64,'+fs.readFileSync(file).toString('base64');}
const atlas=JSON.parse(read('../assets/atlas.json'));
const ids=new Set(content.attacks.attacks.map(m=>m.id));
if(ids.size!==147||content.fighters.fighters.length!==12||content.maps.maps.length!==6||content.campaign.levels.length!==84)throw Error('Incomplete production content');
for(const f of content.fighters.fighters)for(const id of f.signatureIds)if(!ids.has(id))throw Error('Missing signature '+id);
for(const m of content.attacks.attacks){if(m.totalTicks!==m.startup+m.active+m.recovery)throw Error('Invalid frame timing '+m.id);for(const p of m.collisionPhases)if(p.firstTick<0||p.lastTickExclusive>m.totalTicks||p.lastTickExclusive<=p.firstTick)throw Error('Invalid collision timing '+m.id);}
for(let i=0;i<84;i++){const l=content.campaign.levels[i];if(l.number!==i+1||l.requiresNetwork||i>=78&&l.combatEnabled)throw Error('Invalid campaign record '+l.id);}
content.hash=crypto.createHash('sha256').update(JSON.stringify(content)+read('sim.ts')+read('campaign.ts')).digest('hex').slice(0,16);
const names=['sim.ts','campaign.ts','storage.ts','replay.ts','input.ts','audio.ts','renderer.ts','app.ts'];
const scripts=names.map(file=>stripTypeScriptTypes(read(file),{mode:'strip'})+'\n').join('\n');
const html=read('shell.html').replace('/* STYLE */',()=>read('style.css')).replace('/* DATA */',()=> 'globalThis.BiblhallaContent='+JSON.stringify(content).replace(/</g,'\\u003c')+';globalThis.BiblhallaArt='+JSON.stringify(art)+';globalThis.BiblhallaAtlas='+JSON.stringify(atlas)+';').replace('/* CODE */',()=>scripts);
if(/\b(?:fetch|WebSocket|XMLHttpRequest|importScripts)\s*\(/.test(html)||/<(?:script|link|img|iframe|audio|video)\b[^>]+(?:src|href)=["']https?:\/\//.test(html))throw Error('External runtime dependency');
fs.writeFileSync(path.join(root,'PLAY.html'),html);
fs.writeFileSync(path.join(src,'PLAY.html'),html);
fs.writeFileSync(path.join(src,'compiled-content.json'),JSON.stringify(content));
fs.writeFileSync(path.join(root,'docs/build-manifest.json'),JSON.stringify({title:'Biblhalla',date:new Date().toISOString(),contentHash:content.hash,bytes:Buffer.byteLength(html),roster:12,arenas:6,attacks:147,levels:84,engine:'Q8 integer, fixed 60 ticks, Canvas',offline:true,art:'original animated development rigs; supplied paintings remain concepts',signedIPad:false},null,2));
console.log('Built Biblhalla PLAY.html: '+Buffer.byteLength(html)+' bytes; content '+content.hash);
