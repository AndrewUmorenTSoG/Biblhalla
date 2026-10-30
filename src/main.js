(function (root) {
  'use strict';
  const C=root.Covenant;
  const byId=id=>document.getElementById(id);
  const menu=byId('menu'),game=byId('game'),form=byId('setup'),canvas=byId('arena');
  const pauseDialog=byId('pause-dialog'),resultDialog=byId('result-dialog');
  const audio=new C.GameAudio();
  let match=null,renderer=null,images={},lastTime=0,accumulator=0,lastHudTick=-1,ready=false,resultReported=false;
  let controllerWasConnected=false,storageError=false;
  const preferences={schema:1,mute:false,reducedMotion:root.matchMedia('(prefers-reduced-motion: reduce)').matches,leftHanded:false,touchSize:'76',input:root.matchMedia('(pointer:coarse)').matches?'touch':'keyboard',hero:'david',difficulty:'easy',mode:'duel',arena:'elah'};
  const input=new C.GameInput(canvas,byId('touch-layer'),()=>pause());

  function readPreferences(){
    try{
      const raw=localStorage.getItem('covenant-offline-preferences-v1');
      if(!raw)return;
      const saved=JSON.parse(raw);
      if(saved.schema!==1)return;
      for(const key of ['mute','reducedMotion','leftHanded'])if(typeof saved[key]==='boolean')preferences[key]=saved[key];
      if(['76','90'].includes(saved.touchSize))preferences.touchSize=saved.touchSize;
      for(const key of ['input','hero','difficulty','mode','arena']){
        const values=key==='input'?['keyboard','touch','controller']:key==='hero'?Object.keys(C.HEROES):key==='difficulty'?Object.keys(C.DIFFICULTIES):key==='mode'?['duel','waves','boss']:Object.keys(C.ARENAS);
        if(values.includes(saved[key]))preferences[key]=saved[key];
      }
    }catch(error){storageError=true;console.warn('Local settings unavailable:',error.message);}
  }
  function savePreferences(){
    try{localStorage.setItem('covenant-offline-preferences-v1',JSON.stringify(preferences));byId('save-status').textContent='Settings saved on this device.';}
    catch(error){storageError=true;byId('save-status').textContent='This browser cannot save settings here. You can still play offline.';console.warn('Settings were not saved:',error.message);}
  }
  function applyPreferences(){
    byId('mute').checked=preferences.mute;byId('reduce-motion').checked=preferences.reducedMotion;byId('left-handed').checked=preferences.leftHanded;byId('touch-size').value=preferences.touchSize;
    for(const key of ['hero','difficulty','mode','arena'])form.elements[key].value=preferences[key];
    form.querySelector(`input[name=input][value=${preferences.input}]`).checked=true;
    document.documentElement.style.setProperty('--touch-size',preferences.touchSize+'px');
    byId('touch-layer').classList.toggle('left-handed',preferences.leftHanded);
    audio.muted=preferences.mute;if(renderer)renderer.reducedMotion=preferences.reducedMotion;
  }
  function announce(text){byId('announcement').textContent=text;}
  function openDialog(dialog){dialog.returnFocus=document.activeElement;dialog.showModal();dialog.querySelector('button,input,select')?.focus();}
  function closeDialog(dialog){dialog.close();if(dialog.returnFocus?.isConnected&&!dialog.returnFocus.closest('[hidden]'))dialog.returnFocus.focus();}

  function start(){
    if(!ready)return;
    const values=new FormData(form);const mode=String(values.get('input'));
    if(mode==='controller'&&!input.getGamepad()){byId('setup-status').textContent='No controller detected. Connect one or choose Keyboard or Touch.';return;}
    for(const key of ['hero','difficulty','mode','arena'])preferences[key]=String(values.get(key));preferences.input=mode;
    savePreferences();
    match=C.createMatch(preferences);resultReported=false;accumulator=0;lastHudTick=-1;renderer.particles=[];
    for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
    input.setMode(mode);input.active=true;audio.unlock();
    menu.hidden=true;game.hidden=false;canvas.focus({preventScroll:true});
    byId('key-strip').hidden=mode==='touch';
    if(mode==='controller')byId('key-strip').textContent='Left stick: Move · South: Jump · West: Light · North: Heavy · East: Dodge · R1: Throw · Menu: Pause';
    else if(mode==='keyboard')byId('key-strip').innerHTML='<kbd>A D</kbd> Move <kbd>Space</kbd> Jump <kbd>J</kbd> Light <kbd>K</kbd> Heavy <kbd>Shift</kbd> Dodge <kbd>L</kbd> Pickup / Throw';
    byId('match-hint').textContent=preferences.mode==='boss'?'Break the training champion’s guard. Dodge the big windups.':preferences.mode==='waves'?'Three waves. Seven opponents. Protect your three lives.':'Build damage. Knock the computer out. Stay on the arena.';
    controllerWasConnected=mode==='controller';updateHud();announce('Offline '+preferences.mode+' starting. '+C.DIFFICULTIES[preferences.difficulty].name+' computer.');
  }
  function pause(reason){
    if(!match||['paused','result'].includes(match.phase))return;
    C.setPaused(match,true);input.active=false;input.clear();
    byId('pause-title').textContent=reason||'Take a breath.';openDialog(pauseDialog);announce('Match paused.');
  }
  function resume(){
    if(!match||match.phase!=='paused')return;
    if(preferences.input==='controller'&&!input.getGamepad()){byId('pause-title').textContent='Reconnect your controller';return;}
    pauseDialog.close();C.setPaused(match,false);input.clear();input.active=true;accumulator=0;canvas.focus({preventScroll:true});audio.unlock();announce('Match resumed.');
  }
  function toMenu(){
    input.active=false;input.clear();match=null;
    for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
    game.hidden=true;menu.hidden=false;byId('play').focus();announce('Main menu.');
  }
  function stocks(element,count,total=3){
    element.replaceChildren();for(let i=0;i<total;i++){const item=document.createElement('i');if(i>=count)item.className='empty';element.append(item);}
  }
  function updateHud(){
    if(!match)return;
    const player=match.fighters[0],enemy=match.fighters[1];
    byId('player-name').textContent=C.HEROES[player.hero].name;byId('player-weapon').textContent=C.weaponName(player);
    byId('player-damage').textContent=String(Math.floor(player.damage));byId('player-damage').classList.toggle('high',player.damage>=100);stocks(byId('player-stocks'),player.stocks);
    byId('difficulty-label').textContent=C.DIFFICULTIES[match.difficulty].name;
    if(match.mode==='waves'){
      byId('enemy-name').textContent='Wave '+match.wave+' / 3';byId('enemy-damage').textContent=String(match.fighters.filter(f=>!f.isPlayer&&f.stocks).length);stocks(byId('enemy-stocks'),4-match.wave,3);
    }else if(match.mode==='boss'){
      byId('enemy-name').textContent='Training champion';byId('enemy-damage').textContent=String(Math.ceil(enemy.guardMeter));stocks(byId('enemy-stocks'),enemy.stocks,1);byId('difficulty-label').textContent='Guard · '+C.DIFFICULTIES[match.difficulty].name;
    }else{
      byId('enemy-name').textContent=C.HEROES[enemy.hero].name;byId('enemy-damage').textContent=String(Math.floor(enemy.damage));stocks(byId('enemy-stocks'),enemy.stocks);
    }
    const seconds=Math.max(0,Math.ceil(match.remainingTicks/60));byId('timer').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
    byId('mode-label').textContent='Offline · '+({duel:'Duel',waves:'Waves',boss:'Boss'}[match.mode]);
    byId('touch-layer').querySelector('[data-action=item]').textContent=player.weaponIndex<0?'Pickup':'Throw';
  }
  function reportResult(){
    resultReported=true;input.active=false;input.clear();
    const result=match.result;byId('result-title').textContent=result.won?'Victory. Well played!':'A lesson for the next round.';
    byId('result-reason').textContent=result.reason;
    const list=byId('result-stats');list.replaceChildren();
    for(const [label,value]of [['Difficulty',C.DIFFICULTIES[result.difficulty].name],['Damage dealt',result.damageDealt],['Hits landed',result.hits],['Time',Math.floor(result.ticks/60)+' seconds']]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=String(value);list.append(dt,dd);}
    openDialog(resultDialog);announce(result.won?'You won the encounter.':'Encounter finished. You can try again.');
  }
  function paintMenu(){
    const preview=byId('hero-preview'),ctx=preview.getContext('2d'),hero=form.elements.hero.value,frame=root.COVENANT_ATLAS[hero].idle;
    ctx.clearRect(0,0,preview.width,preview.height);const scale=510/frame.h;
    ctx.drawImage(images[hero],frame.x,frame.y,frame.w,frame.h,270-frame.pivotX*scale,610-frame.pivotY*scale,frame.w*scale,frame.h*scale);
  }
  function updateControllerStatus(){
    const connected=!!input.getGamepad();
    if(match&&preferences.input==='controller'&&controllerWasConnected&&!connected)pause('Controller disconnected');
    controllerWasConnected=connected;
    if(!match&&ready){
      const selected=form.querySelector('input[name=input]:checked').value;
      byId('setup-status').textContent=selected==='controller'?(connected?'Controller connected. Ready to play.':'Connect a controller, then press Play.'):storageError?'Ready. Settings may not persist in this browser.':'Ready. All game assets are bundled — no internet needed.';
      byId('play').disabled=selected==='controller'&&!connected;
    }
  }
  function frame(now){
    const elapsed=lastTime?Math.min(100,now-lastTime):16.667;lastTime=now;
    if(match){
      if(match.phase!=='paused'&&match.phase!=='result'){
        accumulator+=elapsed;
        let steps=0;
        while(accumulator>=1000/C.TICK_RATE&&steps<5){
          C.stepMatch(match,input.read());renderer.addEvents(match.events);for(const event of match.events)audio.play(event);
          if(match.events.some(e=>e.type==='wave'))announce('Wave '+match.wave+' begins.');
          accumulator-=1000/C.TICK_RATE;steps++;
        }
        if(steps===5&&accumulator>=1000/C.TICK_RATE)accumulator=0;
      }else accumulator=0;
      renderer.paint(match,elapsed);
      if(match.tick-lastHudTick>=5||match.phase==='result'){updateHud();lastHudTick=match.tick;}
      if(match.phase==='result'&&!resultReported)reportResult();
    }
    requestAnimationFrame(frame);
  }
  form.addEventListener('submit',event=>{event.preventDefault();start();});
  form.addEventListener('change',()=>{
    const values=new FormData(form);
    for(const key of ['input','hero','difficulty','mode','arena'])preferences[key]=String(values.get(key));
    savePreferences();if(ready)paintMenu();updateControllerStatus();
  });
  byId('pause-button').addEventListener('click',()=>pause());
  byId('resume-button').addEventListener('click',resume);
  byId('restart-button').addEventListener('click',start);
  byId('rematch-button').addEventListener('click',start);
  byId('return-menu').addEventListener('click',toMenu);
  byId('result-menu').addEventListener('click',toMenu);
  byId('help-button').addEventListener('click',()=>openDialog(byId('help-dialog')));
  byId('pause-controls').addEventListener('click',()=>openDialog(byId('help-dialog')));
  byId('settings-button').addEventListener('click',()=>{applyPreferences();openDialog(byId('settings-dialog'));});
  for(const button of document.querySelectorAll('[data-close]'))button.addEventListener('click',()=>closeDialog(byId(button.dataset.close)));
  for(const id of ['mute','reduce-motion','left-handed','touch-size'])byId(id).addEventListener('change',()=>{
    preferences.mute=byId('mute').checked;preferences.reducedMotion=byId('reduce-motion').checked;preferences.leftHanded=byId('left-handed').checked;preferences.touchSize=byId('touch-size').value;applyPreferences();savePreferences();
  });
  pauseDialog.addEventListener('cancel',event=>{event.preventDefault();resume();});
  resultDialog.addEventListener('cancel',event=>{event.preventDefault();toMenu();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('Paused while you were away');});
  root.addEventListener('blur',()=>pause('Paused while you were away'));
  setInterval(updateControllerStatus,500);
  readPreferences();applyPreferences();

  Promise.all(Object.entries(root.COVENANT_ASSETS).map(([key,src])=>new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>{images[key]=image;resolve();};image.onerror=()=>reject(new Error('Bundled artwork failed: '+key));image.src=src;
  }))).then(()=>{
    renderer=new C.ArenaRenderer(canvas,images,root.COVENANT_ATLAS);renderer.reducedMotion=preferences.reducedMotion;ready=true;
    document.querySelector('.menu-backdrop').style.backgroundImage=`url("${root.COVENANT_ASSETS.elah}")`;
    paintMenu();updateControllerStatus();requestAnimationFrame(frame);
  }).catch(error=>{byId('setup-status').textContent='The bundled artwork could not load. Extract the ZIP again and open PLAY.html.';console.error(error);});

  // Read-only diagnostics for tests and bug reports; no network or development service.
  root.CovenantPrototype={status:()=>({ready,phase:match?.phase||'menu',mode:match?.mode,difficulty:match?.difficulty,tick:match?.tick||0,player:match?{x:match.fighters[0].x,y:match.fighters[0].y,damage:match.fighters[0].damage,stocks:match.fighters[0].stocks,weapon:C.weaponName(match.fighters[0]),attack:match.fighters[0].attack?.kind}:null,opponents:match?.fighters.filter(f=>!f.isPlayer&&f.stocks).length||0})};
  root.CovenantLifecycle={suspend:()=>pause('Paused while you were away')};
})(window);
