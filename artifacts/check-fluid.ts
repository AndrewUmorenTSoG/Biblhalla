import{readPng}from'../tools/art/image.ts';import{figures}from'../tools/art/import-defence.ts';
for(const id of ['david','saul','samson','joshua']){try{const p=figures(readPng('assets/animation-production/fluid-runs/'+id+'.png'),4,6,500,64);console.log(id,p.length,p.map(p=>p.image.height).join(','));}catch(e){console.log(id,e.message);}}
