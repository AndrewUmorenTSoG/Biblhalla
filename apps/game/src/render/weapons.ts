// Original weapon silhouettes. Origin is the grip; local -Y points to the tip.
export function drawWeapon(c:CanvasRenderingContext2D,kind:string,x:number,y:number,angle:number,accent='#54748b'){
  if(kind==='unarmed')return;
  c.save();c.translate(x,y);c.rotate(angle);c.lineJoin='round';c.lineCap='round';c.lineWidth=2.2;c.strokeStyle='#302a29';
  const poly=(p:number[],fill:string)=>{c.fillStyle=fill;c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();c.fill();c.stroke();};
  const line=(p:number[],color:string,width:number)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.stroke();c.strokeStyle='#302a29';c.lineWidth=2.2;};
  const grip=(top:number,bottom:number)=>{line([0,top,0,bottom],'#302a29',8);line([0,top,0,bottom],'#88573c',5);for(let yy=top+3;yy<bottom;yy+=4)line([-2,yy,2,yy-1],'#d5ae74',1);};
  if(kind==='sword'||kind==='blades'){
    if(kind==='blades'){c.save();c.translate(-17,9);c.rotate(-.35);poly([-5,-7,-7,-36,0,-52,7,-36,5,-7],'#c4c5b6');grip(-5,10);c.restore();}
    poly([-5,-10,-7,-45,0,-66,7,-45,5,-10],'#dbddcf');poly([0,-64,5,-44,3,-12,0,-12],'#92a2a2');
    poly([-15,-10,-12,-15,-5,-12,5,-12,12,-15,15,-10,8,-6,-8,-6],'#c3a15b');grip(-5,12);poly([-5,12,0,18,5,12,0,9],accent);
  }else if(kind==='spear'){
    line([0,30,0,-61],'#332a25',7);line([0,29,0,-61],'#a27749',4);poly([0,-88,-10,-63,-4,-52,4,-52,10,-63],'#c4c9bc');poly([0,-85,0,-55,7,-63],'#809797');grip(-8,9);poly([-3,-50,13,-45,8,-34,1,-40],accent);
  }else if(kind==='staff'){
    line([1,30,-1,-51,2,-67,8,-72],'#3d2c26',8);line([1,29,-1,-51,2,-66,8,-71],'#b08759',4);grip(-9,10);line([-3,-41,3,-41],'#d9b66d',3);line([-3,21,4,21],'#d9b66d',3);poly([2,-48,12,-44,6,-29,0,-38],accent);
  }else if(kind==='hammer'){
    grip(-37,21);poly([-27,-58,22,-58,28,-49,25,-30,-24,-30,-30,-38],'#936b45');poly([-27,-58,22,-58,17,-50,-30,-38],'#c7a272');poly([19,-54,27,-48,24,-32,17,-32],'#68564b');for(const xx of [-18,12])poly([xx,-57,xx+6,-57,xx+6,-30,xx,-30],'#a9a999');line([-8,-50,-5,-35],'#654d38',1);
  }else if(kind==='bow'){
    c.strokeStyle='#302a29';c.lineWidth=8;c.beginPath();c.moveTo(0,-56);c.bezierCurveTo(32,-42,32,14,0,29);c.stroke();c.strokeStyle='#b18a50';c.lineWidth=4;c.stroke();line([0,-56,0,29],'#e4d9b1',1.3);grip(-8,8);poly([0,-53,5,-49,4,-43,-1,-46],'#c6b071');
  }else if(kind==='sling'){
    c.strokeStyle='#b08d60';c.lineWidth=2;c.beginPath();c.moveTo(-2,0);c.quadraticCurveTo(33,-14,26,-45);c.moveTo(2,0);c.quadraticCurveTo(19,-20,26,-45);c.stroke();poly([20,-51,31,-51,35,-44,27,-38,19,-43],'#79513b');c.fillStyle='#b4b4a1';c.beginPath();c.ellipse(27,-46,5,4,0,0,Math.PI*2);c.fill();
  }else if(kind==='gauntlets'){
    poly([-12,10,-14,-9,-7,-19,9,-19,17,-10,16,10],'#a67c43');poly([-10,-9,-5,-16,8,-16,13,-9,11,-3,-8,-3],'#d6b566');for(let xx=-6;xx<12;xx+=6)line([xx,-13,xx,-6],'#715230',1.4);poly([-12,3,16,3,15,13,-11,13],accent);
  }
  c.restore();
}
