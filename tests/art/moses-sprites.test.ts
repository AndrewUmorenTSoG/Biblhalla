import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
for(const skin of ['mage-fire','mage-shadow','mage-lightning'])test(skin+' ships 36 painted, transparent, foot-registered animation cels',()=>{
 const sheet=PNG.sync.read(readFileSync('assets/runtime/story/'+skin+'.png'));
 assert.equal(sheet.width,3072);assert.equal(sheet.height,1536);const signatures=new Set<string>();
 for(let frame=0;frame<36;frame++){
  let solid=0,bottom=0;const sx=frame%6*512,sy=Math.floor(frame/6)*256;const pixels:number[]=[];
  for(let y=0;y<256;y++)for(let x=0;x<512;x++){const n=((sy+y)*sheet.width+sx+x)*4,a=sheet.data[n+3];if(a>128){solid++;bottom=y;}if(y===0||y===255||x===0||x===511)assert.equal(a,0,'no cel clips the packed texture boundary');if(x%13===0&&y%7===0)pixels.push(sheet.data[n],a);}
  assert.ok(solid>1000&&solid<512*256*.6);assert.equal(bottom,246);signatures.add(pixels.join(','));
 }
 assert.equal(signatures.size,36,'poses must not be repeated static cutouts');
});
test('cinematic sheep and seated Pharaoh have true transparent exteriors',()=>{
 for(const name of ['moses-sheep','moses-pharaoh-sprites']){const p=PNG.sync.read(readFileSync('assets/runtime/story/'+name+'.png'));let clear=0;for(let i=3;i<p.data.length;i+=4)if(p.data[i]<10)clear++;assert.ok(clear>p.width*p.height*.15,name+' has transparent background');assert.equal(p.data[3],0);}
});
