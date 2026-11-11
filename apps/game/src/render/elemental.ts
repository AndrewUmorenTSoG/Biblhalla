import type { SimState, Fighter, Projectile } from '../../../../packages/sim/src/types.ts';
import {drawFlyingWeapon} from './weapons.ts';
type Screen=(x:number,y:number)=>{x:number;y:number};

export function flame(c:CanvasRenderingContext2D,x:number,y:number,size:number,time:number){
  c.save();c.translate(x,y);c.fillStyle='#ff6b28bb';c.beginPath();c.moveTo(-size,0);c.quadraticCurveTo(-size,-size,size*.15,-size*2.4);c.quadraticCurveTo(size*.2,-size,size,0);c.closePath();c.fill();c.fillStyle='#ffe58b';c.beginPath();c.ellipse(0,-size*.3,size*.45,size*.8,Math.sin(time*.2)*.2,0,Math.PI*2);c.fill();c.restore();
}

/** Short, deterministic effects follow simulation events, never modify hitboxes. */
export function drawElements(c:CanvasRenderingContext2D,world:SimState,screen:Screen,zoom:number,reduced:boolean){
  for(const e of world.events){
    if(e.type!=='element')continue;
    const age=world.tick-e.tick;if(age<0||age>22)continue;
    const hero=String(e.hero),weapon=String(e.weapon),move=String(e.move);
    let kind=String(e.effect??'');
    if(hero==='caleb'&&move.endsWith('ground_pound'))kind='rock';
    if(hero==='samson')kind='dust';
    if(hero==='esther'&&weapon==='blades')kind='wind';
    if(!['water','rock','dust','wind','sun','sound'].includes(kind))continue;
    const p=screen(Number(e.x),Number(e.y)),t=age/22;
    c.save();c.translate(p.x,p.y);c.scale(zoom*Number(e.facing),zoom);c.globalAlpha=1-t;
    const reach=reduced?65:35+t*110;
    if(kind==='water'){
      for(const side of [-1,1]){c.save();c.scale(side,1);c.fillStyle='#168edbcc';c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(reach*.4,-10,reach,-48*(1-t));c.quadraticCurveTo(reach+16,-12,reach+25,0);c.closePath();c.fill();c.strokeStyle='#c8f8ff';c.lineWidth=3;c.beginPath();c.moveTo(15,-5);c.quadraticCurveTo(reach*.6,-12,reach,-45*(1-t));c.stroke();c.restore();}
    }else if(kind==='rock'||kind==='dust'){
      const massive=kind==='dust';
      for(let i=0;i<12;i++){const spread=(i-5.5)/5.5;const x=massive||hero==='caleb'?spread*reach:Math.abs(spread)*reach;
        const y=-Math.sin(Math.PI*t)*(12+(i%4)*8);
        c.fillStyle=massive?'#c6b48e88':'#8c7965';c.beginPath();
        if(massive)c.ellipse(x,y-5,13+(i%3)*5,8+(i%4)*3,0,0,Math.PI*2);
        else {c.moveTo(x-6,y);c.lineTo(x-9,y-9);c.lineTo(x+2,y-16);c.lineTo(x+8,y-5);c.closePath();}c.fill();}
      c.strokeStyle='#e3d3b6';c.lineWidth=2;c.beginPath();c.ellipse(0,-3,reach,massive?17:7,0,Math.PI,2*Math.PI);c.stroke();
    }else if(kind==='wind'){
      c.strokeStyle='#c7ffef';c.lineWidth=3;
      for(let i=0;i<5;i++){c.beginPath();const spin=reduced?0:age*.35+i;c.ellipse(20+t*35,-12-i*16,25+i*7,7,0,spin,spin+Math.PI*1.5);c.stroke();}
    }else if(kind==='sun'){
      c.fillStyle='#fff0a388';c.beginPath();c.moveTo(-14,-30);c.lineTo(-30,-220);c.lineTo(30,-220);c.lineTo(14,-30);c.closePath();c.fill();c.fillStyle='#fffbd1';c.fillRect(-4,-210,8,175);
    }else if(kind==='sound'){
      c.strokeStyle='#d7e9ff';c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.ellipse(reach+i*14,-42,10,25+i*7,0,-Math.PI*.45,Math.PI*.45);c.stroke();}
    }
    c.restore();
  }
}

export function drawCharge(c:CanvasRenderingContext2D,f:Fighter,x:number,y:number,zoom:number,tick:number,reduced:boolean){
  const charge=f.action?.charge??0;if(!charge||f.action?.kind!=='attack')return;
  const intensity=Math.min(1,charge/36);c.save();c.translate(x,y);c.scale(zoom,zoom);
  c.strokeStyle=`rgba(255,235,225,${.25+intensity*.5})`;c.lineWidth=2;
  for(let i=0;i<5;i++){const lift=reduced?15:(tick*1.3+i*13)%55;const xx=(i-2)*12;c.beginPath();c.moveTo(xx,-35-lift);c.bezierCurveTo(xx+9,-48-lift,xx-10,-55-lift,xx+3,-70-lift);c.stroke();}
  c.restore();
}

export function drawElementProjectile(c:CanvasRenderingContext2D,p:Projectile,owner:Fighter|undefined,x:number,y:number,zoom:number,tick:number,reduced=false,standingHeight=192):boolean{
  c.save();c.translate(x,y);c.scale(zoom*p.facing,zoom);
  let drawn=true;
  if(p.effect==='shield'){
    const scale=96*(owner?.scale??1)/standingHeight;
    c.scale(scale,scale);drawFlyingWeapon(c,'shield',0,0,0,reduced?0:tick*.65);
  }else if(p.effect==='rock'){
    c.fillStyle='#91785f';c.beginPath();c.moveTo(-17,17);c.lineTo(-9,-12);c.lineTo(5,-20);c.lineTo(19,12);c.closePath();c.fill();
  }else if(p.effect==='sound'){
    c.strokeStyle='#c6eaff';c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.ellipse(-i*8,0,8,20+i*3,0,-1.4,1.4);c.stroke();}
  }else if(owner?.hero==='jonathan'&&p.move.includes('bow')){
    c.strokeStyle='#bd9c6a';c.lineWidth=3;c.beginPath();c.moveTo(-18,0);c.lineTo(12,0);c.stroke();flame(c,13,0,7,tick);
  }else if(p.move.includes('sling')){
    c.fillStyle='#d6c3a0';c.strokeStyle='#755a47';c.lineWidth=1.5;c.beginPath();c.arc(0,0,6,0,Math.PI*2);c.fill();c.stroke();
    if(owner?.hero==='david')flame(c,0,0,9,tick);
  }
  else drawn=false;
  c.restore();return drawn;
}

/** A few quiet wind strokes behind thrown objects show their travel direction. */
export function drawThrowWind(c:CanvasRenderingContext2D,p:Projectile,x:number,y:number,zoom:number){
  const speed=Math.hypot(p.vx,p.vy);if(speed<1)return;
  const dx=p.vx/speed,dy=-p.vy/speed;
  c.save();c.strokeStyle='rgba(211,239,245,.55)';c.lineWidth=Math.max(1,zoom*1.4);c.lineCap='round';
  for(let i=0;i<3;i++){const offset=(i-1)*5*zoom,sideX=-dy*offset,sideY=dx*offset;
    c.beginPath();c.moveTo(x-dx*(13+i*6)*zoom+sideX,y-dy*(13+i*6)*zoom+sideY);
    c.lineTo(x-dx*(29+i*7)*zoom+sideX,y-dy*(29+i*7)*zoom+sideY);c.stroke();}
  c.restore();
}
