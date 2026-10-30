const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const root=__dirname;
function compile(file){return stripTypeScriptTypes(fs.readFileSync(path.join(root,'main-game',file),'utf8'),{mode:'strip'});}
function load(){const content=JSON.parse(fs.readFileSync(path.join(root,'main-game/content.json'),'utf8'));const context=vm.createContext({BiblhallaContent:content,console});for(const file of ['sim.ts','campaign.ts','storage.ts','replay.ts'])if(fs.existsSync(path.join(root,'main-game',file)))vm.runInContext(compile(file),context,{filename:file});return context;}
module.exports={compile,load};
