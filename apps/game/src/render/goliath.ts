import type { GoliathState } from '../../../../packages/campaign/src/goliath.ts';

/** Screen-space figure faces right. The boots are the registration point for every pose. */
export function drawGoliath(c: CanvasRenderingContext2D, x: number, y: number, zoom: number, state: GoliathState, tick: number) {
  const g = state.giant, t = g.frame;
  const lifting = g.move === 'throw' || g.move === 'headbutt';
  const reach = g.move === 'reach' ? Math.sin(t / 18 * Math.PI / 2) : lifting ? Math.max(0, 1 - t / 12) : 0;
  const drive = lifting ? Math.max(0, 1 - Math.abs(t - 16) / 7) : 0;
  const raised = state.advance.state === 'tell' ? Math.min(1, (90 - state.advance.ticks) / 24) : 0;
  const slam = state.advance.state === 'active' ? Math.min(1, state.advance.ticks / 24) : 0;
  const stride = g.move === 'guard' && !raised && !slam && !state.open && g.walking ? Math.sin(tick / 10) : 0;
  const lean = reach * 6 + drive * 8 + slam * 4;
  c.save(); c.translate(x, y); c.scale(zoom * 3 * g.facing, zoom * 3);
  c.lineJoin = 'round'; c.lineCap = 'round';
  const plate = (points: number[][], fill: string) => {
    c.beginPath(); points.forEach(([a,b],i)=>i ? c.lineTo(a,b) : c.moveTo(a,b)); c.closePath();
    c.fillStyle=fill; c.fill(); c.strokeStyle='#29262a'; c.lineWidth=1.3; c.stroke();
  };
  const rod = (x1:number,y1:number,x2:number,y2:number,w:number,color:string) => {
    c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.lineWidth=w; c.strokeStyle=color; c.stroke();
  };
  for (const side of [-1,1]) {
    const knee=side*(9+2*stride), boot=side*(13+3*stride);
    rod(side*8,-37,knee,-20,13,'#454751'); rod(knee,-20,boot,-6,10,'#85838a');
    plate([[boot-6,-10],[boot+4,-9],[boot+9,-3],[boot+9,0],[boot-7,0]],'#504b46');
  }
  c.save(); c.translate(0,-35); c.rotate(lean/75);
  plate([[-16,-40],[12,-42],[21,-33],[13,-3],[16,6],[-16,6],[-20,-29]],'#434b54');
  for(let row=0;row<5;row++){
    const w=16-row;
    plate([[-w,-33+row*6],[w,-35+row*6],[w-1,-28+row*6],[0,-25+row*6],[-w,-27+row*6]],row%2?'#787f82':'#9ba1a0');
  }
  plate([[-19,-39],[-8,-44],[1,-39],[-4,-29],[-21,-27]],'#adb2ae');
  const hx=3+(g.move==='headbutt'?13*drive:0),hy=-49+drive*6;
  plate([[hx-9,hy-5],[hx+7,hy-6],[hx+10,hy+2],[hx+8,hy+12],[hx-4,hy+12],[hx-9,hy+5]],'#92684c');
  // Dark cheek guard, hammered brow and rivets keep the helmet readable at match scale.
  plate([[hx-9,hy+2],[hx-5,hy+2],[hx-2,hy+8],[hx+5,hy+9],[hx+7,hy+7],[hx+6,hy+13],[hx,hy+16],[hx-7,hy+12]],'#503e32');
  plate([[hx-10,hy],[hx-9,hy-9],[hx-2,hy-12],[hx+5,hy-11],[hx+10,hy-5],[hx+11,hy-1],[hx+6,hy],[hx+5,hy+6],[hx+2,hy+6],[hx+1,hy],[hx-5,hy+2],[hx-7,hy+9],[hx-10,hy+7]],'#aa976d');
  rod(hx+5,hy+2,hx+8,hy+1,1.4,'#211e23');
  const handX=9+reach*30+(g.move==='throw'?drive*25:0), handY=-20-(lifting?Math.min(t/11,1)*17:0);
  // The spear rests against the rear shoulder while the throwing hand opens.
  c.save();c.translate(-10,-30);c.rotate(lifting || reach ? -.42 : -.17);
  if(state.stage==='approach' && g.move==='guard'){
    const thrust=state.lanes.some(l=>l.state==='active');
    c.rotate(thrust?1.28:.18);
    if(thrust)c.translate(0,-7);
  }
  rod(-2,42,0,-56,2.8,'#67513e');
  plate([[-3,-55],[0,-70],[4,-56],[1,-50]],'#e3bc64');c.restore();
  rod(10,-33,20,-23,9,'#5a6168');rod(20,-23,handX,handY,7,'#a7acac');
  plate([[handX-3,handY-3],[handX+1,handY-5],[handX+6,handY-4],[handX+6,handY],[handX+2,handY+2],[handX-3,handY+1]],'#a97953');
  rod(handX,handY,handX+4,handY-1,6,'#936449');
  c.save();c.translate(-12, -15-raised*24+slam*19);c.rotate(-.12+raised*.36);
  plate([[-17,-21],[0,-28],[18,-22],[18,6],[12,16],[0,26],[-13,16],[-18,6]],'#d4a239');
  plate([[-13,-18],[0,-23],[14,-18],[14,6],[0,21],[-14,7]],'#a87422');
  plate([[0,-19],[4,-4],[13,0],[4,4],[0,17],[-4,4],[-12,0],[-4,-4]],'#ffe19a');
  for(const [rx,ry] of [[-12,-17],[0,-22],[12,-17],[-12,6],[12,6],[0,19]]){
    c.beginPath();c.arc(rx,ry,1.1,0,Math.PI*2);c.fillStyle='#ffdf8b';c.fill();
  }
  c.restore();c.restore();c.restore();
}

/** Key poses shared by the roster; each is drawn with that fighter's own defensive artwork. */
export function grapplePose(g: GoliathState['giant']) {
  const t=g.frame, thrown=g.move==='throw';
  const landing=thrown?39:23;
  if(t<8)return {rotation:-.18*t/8,frame:'defence_13'};
  if(t<15)return {rotation:-.18,frame:'defence_14'};
  const progress=Math.min(1,(t-15)/(landing-15));
  return {rotation:(thrown?-1:1)*progress*Math.PI/2,frame:t>=landing?'defence_15':'defence_14'};
}
/** Draw the victim from their own atlas. The three body bands share seam points:
 * the head snaps back first, shoulders fold next, then the hips and feet follow. */
export function drawGrappledFighter(c: CanvasRenderingContext2D, image: HTMLImageElement,
  frame: {x:number;y:number;w:number;h:number;pivotX:number;pivotY:number},
  g: GoliathState['giant'], x:number, y:number, scale:number) {
  const t=g.frame, landing=g.move==='throw'?39:23;
  const impact=Math.max(0,1-Math.abs(t-landing)/5);
  const flinch=Math.max(0,1-Math.abs(t-16)/6);
  const fold=flinch*0.48+impact*0.3;
  const rotation=grapplePose(g).rotation;
  const torso=Math.floor(frame.h*.59), neck=Math.floor(frame.h*.28);
  c.save();c.translate(x,y);c.scale(-g.facing*scale,scale);
  // As the victim rolls horizontal, lift their pivot by the half-width so
  // shoulders meet the floor rather than disappearing below its edge.
  c.translate(0,-Math.abs(Math.sin(rotation))*frame.w*.45);
  c.rotate(rotation);
  c.translate(-frame.pivotX,-frame.pivotY);
  const band=(top:number,bottom:number)=>c.drawImage(image,frame.x,frame.y+top,frame.w,bottom-top,0,top,frame.w,bottom-top);
  const bend=(at:number,angle:number)=>{
    c.translate(frame.pivotX,at);c.rotate(angle);c.translate(-frame.pivotX,-at);
  };
  band(torso,frame.h);
  bend(torso,-fold);
  band(neck,torso);
  bend(neck,fold*1.6);
  band(0,neck);
  c.restore();
}
