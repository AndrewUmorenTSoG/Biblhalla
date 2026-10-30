(function(root:any){
class Audio{
  context:any=null;mute=false;last=0;
  unlock(){if(!this.context){const AC=window.AudioContext||(window as any).webkitAudioContext;if(AC)this.context=new AC();}this.context?.resume().catch(()=>{});}
  suspend(){this.context?.suspend().catch(()=>{});}
  play(events:any[]){if(this.mute||!this.context||this.context.state!=='running')return;for(const e of events){if(e.id<=this.last)continue;this.last=e.id;const frequencies:any={hit:145,jump:350,ko:95,pickup:590,projectile:420,result:700,crate:300};if(!frequencies[e.type])continue;const osc=this.context.createOscillator(),gain=this.context.createGain();osc.type=e.type==='hit'?'triangle':'sine';osc.frequency.setValueAtTime(frequencies[e.type],this.context.currentTime);osc.frequency.exponentialRampToValueAtTime(frequencies[e.type]*.55,this.context.currentTime+.12);gain.gain.setValueAtTime(.04,this.context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,this.context.currentTime+.14);osc.connect(gain).connect(this.context.destination);osc.start();osc.stop(this.context.currentTime+.15);}}
}
root.BiblhallaAudio={Audio};
})(globalThis);
