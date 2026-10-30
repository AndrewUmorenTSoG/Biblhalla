(function(root){
  'use strict';
  class GameAudio{
    constructor(){this.context=null;this.muted=false;}
    unlock(){
      if(!this.context){const AudioContext=root.AudioContext||root.webkitAudioContext;if(AudioContext)this.context=new AudioContext();}
      if(this.context?.state==='suspended')this.context.resume().catch(()=>{});
    }
    play(event){
      if(this.muted||!this.context||this.context.state!=='running')return;
      const pitches={hit:event.heavy?110:190,jump:360,release:490,pickup:690,ko:130,result:event.won?740:210};
      if(!(event.type in pitches))return;
      const osc=this.context.createOscillator(),gain=this.context.createGain(),start=this.context.currentTime;
      osc.type=event.type==='hit'?'triangle':'sine';osc.frequency.setValueAtTime(pitches[event.type],start);osc.frequency.exponentialRampToValueAtTime(pitches[event.type]*.55,start+.09);
      gain.gain.setValueAtTime(.065,start);gain.gain.exponentialRampToValueAtTime(.001,start+.13);osc.connect(gain);gain.connect(this.context.destination);osc.start(start);osc.stop(start+.14);
      osc.onended=()=>{osc.disconnect();gain.disconnect();};
    }
  }
  root.Covenant.GameAudio=GameAudio;
})(window);
