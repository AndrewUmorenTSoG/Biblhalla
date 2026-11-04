// Original synthesized feedback cues (13_Audio_VFX): every sound is built here from
// oscillators and filtered noise, so nothing is sampled or borrowed. Audio starts only
// after a user gesture and is suspended whenever the game pauses. These are honest
// development sounds: a composer's pass can replace the recipes without touching callers.

import type { SimEvent } from '../../../../packages/sim/src/index.ts';

/** One layer of a sound: a pitched tone or a band of noise, with a quick envelope. */
export interface Layer {
  wave: OscillatorType | 'noise';
  /** Start and end frequency in Hz (for noise, the band-pass centre). */
  from: number;
  to: number;
  seconds: number;
  gain: number;
  delay?: number;
}
export interface Recipe { layers: Layer[]; priority: number }

/** Simultaneous voices allowed; four-player strikes stay readable instead of stacking. */
export const MAX_VOICES = 8;

const WOOD = /^(staff|spear|bow|sling|hammer)/;
const BRONZE = /^(sword|blades|gauntlets|shield)/;

/** Cosmetic variation chosen from the event id, never from simulation randomness. */
export function variation(id: number, spread = 0.06): number {
  const h = Math.imul(id ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  return 1 + ((h % 1000) / 1000 - 0.5) * 2 * spread;
}

/** The recipe for a simulation event, or null for events that stay silent. */
export function recipeFor(e: SimEvent): Recipe | null {
  const move = String(e.move ?? '');
  const damage = Number(e.damage ?? 0);
  switch (e.type) {
    case 'attack': {
      // Weapon whoosh: wood is low and airy, bronze brighter, signatures fuller.
      const sig = /sig$|_recovery$|_ground_pound$/.test(move);
      const centre = WOOD.test(move) ? 700 : BRONZE.test(move) ? 1500 : 1000;
      return { priority: 1, layers: [{ wave: 'noise', from: centre * 0.7, to: centre * 1.3, seconds: sig ? 0.2 : 0.11, gain: sig ? 0.05 : 0.03 }] };
    }
    case 'hit': {
      // Light tap versus a heavier signature thump, scaled by damage.
      const heavy = damage >= 100;
      return { priority: 3, layers: [
        { wave: 'triangle', from: heavy ? 150 : 230, to: heavy ? 70 : 140, seconds: heavy ? 0.18 : 0.09, gain: heavy ? 0.09 : 0.05 },
        { wave: 'noise', from: heavy ? 900 : 1800, to: heavy ? 500 : 1200, seconds: heavy ? 0.09 : 0.05, gain: heavy ? 0.05 : 0.03 },
      ] };
    }
    case 'shieldBlock': return { priority: 3, layers: [{ wave: 'square', from: 820, to: 760, seconds: 0.12, gain: 0.03 }, { wave: 'noise', from: 2600, to: 2200, seconds: 0.06, gain: 0.02 }] };
    case 'deflect': return { priority: 2, layers: [{ wave: 'triangle', from: 1200, to: 900, seconds: 0.1, gain: 0.04 }] };
    // A safe ring-out burst rather than a cry: a rising swell and a soft boom.
    case 'ko': return { priority: 4, layers: [
      { wave: 'noise', from: 400, to: 3000, seconds: 0.45, gain: 0.07 },
      { wave: 'sine', from: 90, to: 45, seconds: 0.5, gain: 0.1, delay: 0.05 },
    ] };
    case 'jump': return { priority: 0, layers: [{ wave: 'sine', from: 330, to: 520, seconds: 0.08, gain: 0.025 }] };
    case 'pickup': return { priority: 2, layers: [{ wave: 'sine', from: 600, to: 600, seconds: 0.06, gain: 0.035 }, { wave: 'sine', from: 900, to: 900, seconds: 0.08, gain: 0.03, delay: 0.06 }] };
    case 'throw': return { priority: 1, layers: [{ wave: 'noise', from: 1100, to: 2200, seconds: 0.14, gain: 0.035 }] };
    case 'projectile': return { priority: 1, layers: [{ wave: 'triangle', from: 520, to: 380, seconds: 0.1, gain: 0.03 }] };
    case 'crate': return { priority: 1, layers: [{ wave: 'noise', from: 500, to: 300, seconds: 0.12, gain: 0.04 }] };
    case 'respawn': return { priority: 1, layers: [{ wave: 'sine', from: 440, to: 660, seconds: 0.25, gain: 0.03 }] };
    case 'emote': return { priority: 0, layers: [{ wave: 'sine', from: 700, to: 880, seconds: 0.09, gain: 0.025 }] };
    // Telegraphs must be heard as well as seen, and never be the only cue.
    case 'bossTell': case 'enemyTell': return { priority: 2, layers: [{ wave: 'sawtooth', from: 180, to: 240, seconds: 0.22, gain: 0.025 }] };
    case 'wave': case 'arrivalCue': return { priority: 2, layers: [{ wave: 'triangle', from: 392, to: 392, seconds: 0.12, gain: 0.035 }, { wave: 'triangle', from: 523, to: 523, seconds: 0.16, gain: 0.035, delay: 0.12 }] };
    case 'suddenDeath': return { priority: 3, layers: [{ wave: 'square', from: 220, to: 220, seconds: 0.3, gain: 0.03 }, { wave: 'square', from: 233, to: 233, seconds: 0.3, gain: 0.02 }] };
    // The result chord waits for the simulation's own result event.
    case 'result': return { priority: 4, layers: [523, 659, 784].map((f, k) => ({ wave: 'triangle' as const, from: f, to: f, seconds: 0.6, gain: 0.03, delay: k * 0.07 })) };
    default: return null;
  }
}

export class GameAudio {
  context: AudioContext | null = null;
  mute = false;
  /** Effects volume, 0..1. */
  volume = 1;
  last = 0;
  private voices: { end: number; priority: number; stop: () => void }[] = [];
  private noise: AudioBuffer | null = null;

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

  /** Ids of events not yet heard. A restored or rematched state restarts the count, so
   * old buffered impacts never replay and new ones are never skipped. */
  fresh(events: SimEvent[]): SimEvent[] {
    if (events.length && events[events.length - 1].id < this.last) this.last = 0;
    const out = events.filter(e => e.id > this.last);
    if (out.length) this.last = out[out.length - 1].id;
    return out;
  }

  play(events: SimEvent[]): void {
    const heard = this.fresh(events);
    const ctx = this.context;
    if (this.mute || this.volume <= 0 || !ctx || ctx.state !== 'running') return;
    // Louder, more important cues first when many arrive in one frame.
    const queue = heard.map(e => ({ e, r: recipeFor(e) })).filter(x => x.r).sort((a, b) => b.r!.priority - a.r!.priority);
    for (const { e, r } of queue) this.voice(ctx, r!, variation(e.id));
  }

  private voice(ctx: AudioContext, r: Recipe, pitch: number): void {
    const now = ctx.currentTime;
    this.voices = this.voices.filter(v => v.end > now);
    if (this.voices.length >= MAX_VOICES) {
      const weakest = this.voices.reduce((a, b) => (b.priority < a.priority ? b : a));
      if (weakest.priority > r.priority) return;
      weakest.stop();
      this.voices.splice(this.voices.indexOf(weakest), 1);
    }
    const stops: (() => void)[] = [];
    let end = now;
    for (const l of r.layers) {
      const t0 = now + (l.delay ?? 0), t1 = t0 + l.seconds;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(l.gain * this.volume, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t1);
      let src: AudioScheduledSourceNode;
      if (l.wave === 'noise') {
        const n = ctx.createBufferSource();
        n.buffer = this.noise ??= noiseBuffer(ctx);
        const band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.setValueAtTime(l.from * pitch, t0);
        band.frequency.exponentialRampToValueAtTime(l.to * pitch, t1);
        n.connect(band).connect(gain);
        src = n;
      } else {
        const o = ctx.createOscillator();
        o.type = l.wave;
        o.frequency.setValueAtTime(l.from * pitch, t0);
        o.frequency.exponentialRampToValueAtTime(Math.max(20, l.to * pitch), t1);
        o.connect(gain);
        src = o;
      }
      gain.connect(ctx.destination);
      src.start(t0);
      src.stop(t1 + 0.02);
      stops.push(() => { try { src.stop(); } catch { /* already stopped */ } });
      end = Math.max(end, t1);
    }
    this.voices.push({ end, priority: r.priority, stop: () => stops.forEach(s => s()) });
  }
}

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Fixed-seed noise: the same hiss every run, independent of the simulation RNG.
  let seed = 22695477;
  for (let i = 0; i < data.length; i++) { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; data[i] = seed / 2147483648 - 1; }
  return buffer;
}
