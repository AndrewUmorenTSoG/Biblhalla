// Small synthesized feedback cues. Audio starts only after a user gesture and is
// suspended whenever the game pauses.

import type { SimEvent } from '../../../../packages/sim/src/index.ts';

const FREQUENCIES: Record<string, number> = { hit: 145, jump: 350, ko: 95, pickup: 590, projectile: 420, result: 700, crate: 300 };

export class GameAudio {
  context: AudioContext | null = null;
  mute = false;
  last = 0;

  unlock(): void {
    if (!this.context) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) this.context = new AC();
    }
    this.context?.resume().catch(() => {});
  }

  suspend(): void {
    this.context?.suspend().catch(() => {});
  }

  play(events: SimEvent[]): void {
    const ctx = this.context;
    if (this.mute || !ctx || ctx.state !== 'running') return;
    for (const e of events) {
      if (e.id <= this.last) continue;
      this.last = e.id;
      const freq = FREQUENCIES[e.type];
      if (!freq) continue;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = e.type === 'hit' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.55, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  }
}
