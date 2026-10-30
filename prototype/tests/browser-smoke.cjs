const {chromium}=require('playwright');
const {pathToFileURL}=require('url');
const fs=require('fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const output=path.join(__dirname,'qa-output');
fs.mkdirSync(output,{recursive:true});
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,headless:true,args:['--no-sandbox','--no-zygote','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:1366,height:900}});
  await context.setOffline(true);
  const page=await context.newPage();const errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await page.clock.install();
  await page.goto(pathToFileURL(root+'/PLAY.html').href);
  await page.waitForFunction(()=>window.CovenantPrototype?.status().ready);
  await page.selectOption('select[name=hero]','samson');
  await page.selectOption('select[name=difficulty]','extreme');
  await page.click('#settings-button');await page.check('#mute');await page.click('[data-close=settings-dialog]');
  assert.equal(await page.inputValue('select[name=hero]'),'samson');
  assert.equal(await page.inputValue('select[name=difficulty]'),'extreme');
  await page.check('input[value=controller]');await page.clock.runFor(600);
  assert.equal(await page.locator('#play').isDisabled(),true);
  await page.check('input[value=keyboard]');await page.clock.runFor(600);
  assert.equal(await page.locator('#play').isEnabled(),true);
  await page.screenshot({path:output+'/qa_offline_final_menu.png'});
  const matrix=[];
  for(const mode of ['duel','waves','boss'])for(const difficulty of ['easy','hard','extreme']){
    await page.selectOption('select[name=mode]',mode);await page.selectOption('select[name=difficulty]',difficulty);
    await page.selectOption('select[name=arena]',mode==='boss'?'susa':mode==='waves'?'builders':'elah');
    await page.click('#play');await page.clock.runFor(3000);
    let state=await page.evaluate(()=>window.CovenantPrototype.status());assert.equal(state.phase,'playing');assert.equal(state.mode,mode);assert.equal(state.difficulty,difficulty);
    await page.keyboard.down('KeyD');await page.clock.runFor(850);await page.keyboard.up('KeyD');
    for(let i=0;i<5;i++){await page.keyboard.press('KeyJ');await page.clock.runFor(450);}
    await page.keyboard.press('Escape');assert.equal(await page.locator('#pause-dialog').isVisible(),true);
    const tick=await page.evaluate(()=>window.CovenantPrototype.status().tick);await page.clock.runFor(1500);
    assert.equal(await page.evaluate(()=>window.CovenantPrototype.status().tick),tick);
    await page.click('#resume-button');await page.clock.runFor(100);
    state=await page.evaluate(()=>window.CovenantPrototype.status());assert.equal(state.phase,'playing');assert.ok(state.tick>tick);
    if(mode==='boss'&&difficulty==='hard')await page.screenshot({path:output+'/qa_offline_final_boss.png'});
    matrix.push({mode,difficulty,started:true,attacked:true,pauseStable:true,resumed:true});
    await page.click('#pause-button');await page.click('#return-menu');
  }
  // Lose through actual controls, exercise real results and rematch.
  await page.selectOption('select[name=hero]','david');await page.selectOption('select[name=mode]','duel');await page.selectOption('select[name=difficulty]','easy');await page.click('#play');await page.clock.runFor(3000);
  await page.keyboard.down('KeyA');await page.clock.runFor(30000);await page.keyboard.up('KeyA');
  assert.equal(await page.locator('#result-dialog').isVisible(),true);
  const lost=await page.evaluate(()=>window.CovenantPrototype.status());assert.equal(lost.phase,'result');assert.equal(lost.player.stocks,0);
  await page.click('#rematch-button');assert.equal(await page.evaluate(()=>window.CovenantPrototype.status().phase),'countdown');
  await page.clock.runFor(3000);await page.click('#pause-button');await page.click('#return-menu');
  // Touch-emulated input, pointer cancellation and handedness/size.
  await page.setViewportSize({width:1024,height:768});await page.check('input[value=touch]');await page.selectOption('select[name=mode]','waves');await page.click('#settings-button');await page.check('#left-handed');await page.selectOption('#touch-size','90');await page.click('[data-close=settings-dialog]');await page.click('#play');await page.clock.runFor(3000);
  const stick=await page.locator('.stick').boundingBox();const before=await page.evaluate(()=>window.CovenantPrototype.status().player.x);
  await page.mouse.move(stick.x+stick.width*.80,stick.y+stick.height/2);await page.mouse.down();await page.clock.runFor(500);await page.mouse.up();
  const after=await page.evaluate(()=>window.CovenantPrototype.status().player.x);assert.ok(after>before+10);
  const light=await page.locator('[data-action=light]').boundingBox();await page.mouse.move(light.x+light.width/2,light.y+light.height/2);await page.mouse.down();
  await page.dispatchEvent('[data-action=light]','pointercancel',{pointerId:1,pointerType:'mouse'});await page.mouse.up();
  assert.equal(await page.locator('[data-action=light].held').count(),0);
  assert.equal(await page.locator('#touch-layer.left-handed').isVisible(),true);
  await page.screenshot({path:output+'/qa_offline_final_touch.png'});
  assert.equal(errors.length,0);assert.equal(requests.length,0);
  const result={browser:'Developer-selected Chromium headless',networkDisabled:true,fileOrigin:true,matrix,realLossResult:true,rematch:true,settingsPreserved:true,controllerUnavailableState:true,touchJoystickMoves:true,pointerCancelClears:true,leftHandedLargeButtons:true,errors,httpRequests:requests};
  fs.writeFileSync(output+'/browser-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
