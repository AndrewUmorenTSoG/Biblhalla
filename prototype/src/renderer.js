(function (root) {
  'use strict';
  const C = root.Covenant;
  class ArenaRenderer {
    constructor(canvas, images, atlas) {
      this.canvas = canvas; this.context = canvas.getContext('2d'); this.images = images; this.atlas = atlas;
      this.particles = []; this.reducedMotion = false;
    }
    addEvents(events) {
      for (const event of events) {
        if (!['hit','jump','ko','pickup'].includes(event.type)) continue;
        const count = this.reducedMotion ? 3 : event.type === 'ko' ? 16 : 8;
        for (let i=0; i<count; i++) this.particles.push({ x:event.x,y:event.y,vx:Math.cos(i*2.4)*2.5,vy:-Math.abs(Math.sin(i*2.4))*2.6,life:24,color:event.type==='ko'?'#4ba9ee':event.type==='pickup'?'#54d8cb':'#f2ce73' });
      }
      if (this.particles.length > 180) this.particles.splice(0,this.particles.length-180);
    }
    paint(match, elapsedMs) {
      const ctx=this.context;
      ctx.clearRect(0,0,1280,720);
      ctx.drawImage(this.images[match.arena.art],0,0,1280,720);
      // A fine surface line makes the prototype collision tops unambiguous.
      ctx.strokeStyle='rgba(255,225,157,.85)';ctx.lineWidth=3;
      for(const p of [match.arena.floor,...match.arena.shelves]){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+p.w,p.y);ctx.stroke();}
      if(match.pickup){
        const p=match.pickup;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#403345';ctx.strokeStyle='#e6bc61';ctx.lineWidth=2;ctx.fillRect(-14,-13,28,26);ctx.strokeRect(-14,-13,28,26);ctx.fillStyle='#e6bc61';ctx.fillRect(-3,-15,6,29);ctx.restore();
      }
      for(const p of match.projectiles){ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=p.thrown?'#ae7d40':'#dfc99a';ctx.strokeStyle='#463624';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,p.thrown?12:7,p.thrown?5:6,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
      for(const f of match.fighters)if(f.stocks&&!f.respawn)this.paintFighter(f,match.tick);
      if(match.phase==='playing')for(const p of this.particles){p.life-=elapsedMs/16.667;p.x+=p.vx*elapsedMs/16.667;p.y+=p.vy*elapsedMs/16.667;p.vy+=.08;ctx.globalAlpha=Math.max(0,p.life/24);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);}
      this.particles=this.particles.filter(p=>p.life>0);ctx.globalAlpha=1;
      if(match.phase==='countdown'){
        ctx.fillStyle='rgba(25,19,31,.23)';ctx.fillRect(0,0,1280,720);
        ctx.textAlign='center';ctx.font='bold 88px Georgia';ctx.lineWidth=8;ctx.strokeStyle='#241f2e';ctx.fillStyle='#fff2d1';
        const value=match.countdown>30?String(Math.ceil((match.countdown-30)/40)):'GO';ctx.strokeText(value,640,300);ctx.fillText(value,640,300);
      }
      const p=match.fighters[0];
      if(p.respawn){ctx.textAlign='center';ctx.font='bold 20px system-ui';ctx.fillStyle='#fff0cf';ctx.fillText('Returning to the arena…',640,580);}
    }
    paintFighter(fighter,tick) {
      const ctx=this.context;const image=this.images[fighter.hero];const frames=this.atlas[fighter.hero];
      let pose='idle';
      if(fighter.attack)pose=fighter.attack.frame<fighter.attack.startup?'heavy':'light';
      else if(!fighter.onGround)pose='jump';
      else if(Math.abs(fighter.vx)>.5)pose=tick%18<9?'run1':'run2';
      const frame=frames[pose];const scale=frames.scale* fighter.scale;
      const bob=this.reducedMotion?0:pose==='idle'?Math.sin(tick*.08)*1.2:0;
      const opacity=fighter.dodge>4?.40:fighter.invincible&&tick%10<4?.48:1;
      ctx.save();ctx.translate(fighter.x,fighter.y+bob);ctx.scale(fighter.face,1);ctx.globalAlpha=opacity;
      ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,-frame.pivotX*scale,-frame.pivotY*scale,frame.w*scale,frame.h*scale);
      ctx.restore();
      if(fighter.attack&&!fighter.attack.projectile&&fighter.attack.frame>=fighter.attack.startup&&fighter.attack.frame<fighter.attack.startup+fighter.attack.active){
        const box=C.attackBox(fighter);ctx.save();ctx.strokeStyle=fighter.isPlayer?'rgba(224,240,255,.8)':'rgba(255,216,143,.8)';ctx.lineWidth=fighter.attack.heavy?5:2;ctx.beginPath();ctx.arc(fighter.x+fighter.face*34,fighter.y-58,fighter.attack.heavy?80:56,fighter.face>0?-1.2:1.7,fighter.face>0?1.2:4.5);ctx.stroke();ctx.restore();
      }
      const color=fighter.isPlayer?'#79c8ff':fighter.boss?'#eebb65':'#ffb57e';
      ctx.fillStyle=color;ctx.strokeStyle='#282130';ctx.lineWidth=2;
      const markerY=fighter.y-fighter.height-35;ctx.beginPath();ctx.moveTo(fighter.x-7,markerY);ctx.lineTo(fighter.x+7,markerY);ctx.lineTo(fighter.x,markerY+9);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.textAlign='center';ctx.font='bold 15px system-ui';ctx.strokeText(fighter.isPlayer?'P1':fighter.boss?'BOSS':'CPU',fighter.x,markerY-5);ctx.fillText(fighter.isPlayer?'P1':fighter.boss?'BOSS':'CPU',fighter.x,markerY-5);
      if(!fighter.isPlayer&&!fighter.boss){ctx.font='bold 13px system-ui';ctx.fillStyle='#fff0d1';ctx.fillText(String(Math.floor(fighter.damage)),fighter.x,markerY-25);}
      if(fighter.x<25||fighter.x>1255){ctx.fillStyle=color;ctx.fillText(fighter.isPlayer?'◀ P1':'CPU ▶',Math.max(35,Math.min(1240,fighter.x)),Math.max(90,Math.min(640,fighter.y)));}
    }
  }
  root.Covenant.ArenaRenderer=ArenaRenderer;
})(window);
