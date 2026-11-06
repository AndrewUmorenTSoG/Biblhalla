import{readdirSync}from'node:fs';import{readPng}from'../tools/art/image.ts';import{figures}from'../tools/art/import-defence.ts';
for(const f of readdirSync('assets/animation-production/fluid-runs').filter(f=>f.endsWith('-unarmed.png'))){try{console.log(f,figures(readPng('assets/animation-production/fluid-runs/'+f),4,3,500,64).length);}catch(e){console.log('FAILED',f,e.message);}}
