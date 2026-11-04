// Original arena music (13_Audio_VFX): hand percussion, a plucked string bass and a
// short melodic motif, all synthesized here. The six arenas share one motif but differ
// in tempo, mode and instrument colour. Patterns are fixed tables, never random, so
// every loop is identical and the seam is clean. This is a development arrangement;
// a composer can replace the tables without touching the scheduler.

export interface Arrangement { name: string; bpm: number; root: number; mode: number[]; lead: OscillatorType; leadGain: number; swing: number }
export interface Note { beat: number; beats: number; freq: number; voice: 'drum' | 'tap' | 'bass' | 'lead'; gain: number }

const DORIAN = [0, 2, 3, 5, 7, 9, 10], MIXOLYDIAN = [0, 2, 4, 5, 7, 9, 10], AEOLIAN = [0, 2, 3, 5, 7, 8, 10], PHRYGIAN_DOM = [0, 1, 4, 5, 7, 8, 10], MAJOR = [0, 2, 4, 5, 7, 9, 11];

/** One arrangement per arena, in maps.json order. */
export const ARRANGEMENTS: Arrangement[] = [
  { name: 'Elah terrace', bpm: 112, root: 146.83, mode: DORIAN, lead: 'triangle', leadGain: 0.05, swing: 0 },
  { name: 'Wilderness waystation', bpm: 100, root: 130.81, mode: AEOLIAN, lead: 'sine', leadGain: 0.06, swing: 0.08 },
  { name: 'Jericho outskirts', bpm: 124, root: 164.81, mode: PHRYGIAN_DOM, lead: 'sawtooth', leadGain: 0.025, swing: 0 },
  { name: "Deborah's palm court", bpm: 108, root: 174.61, mode: MIXOLYDIAN, lead: 'triangle', leadGain: 0.05, swing: 0.1 },
  { name: 'Susa garden balcony', bpm: 96, root: 155.56, mode: MAJOR, lead: 'sine', leadGain: 0.06, swing: 0.06 },
  { name: "Jerusalem builders' court", bpm: 118, root: 138.59, mode: DORIAN, lead: 'square', leadGain: 0.02, swing: 0 },
];

/** Shared motif as scale degrees (null = rest), two bars of eighth notes. */
const MOTIF: (number | null)[] = [0, null, 2, 4, 3, null, 2, 1, 0, 2, 4, 5, 4, null, 2, null];
/** Drum (low frame drum) and tap (high hand tap) on sixteenths across one bar. */
const DRUM = [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0];
const TAP = [0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1];
const BASS_DEGREES = [0, 0, 4, 3];
/** A loop is four bars: two motif statements over a four-bar bass line. */
export const LOOP_BARS = 4;

export function degreeHz(a: Arrangement, degree: number, octave = 0): number {
  const n = a.mode.length, oct = Math.floor(degree / n) + octave, step = a.mode[((degree % n) + n) % n];
  return a.root * Math.pow(2, oct + step / 12);
}

/** Every note in one bar (beats are quarter notes from the start of that bar). */
export function bar(a: Arrangement, index: number): Note[] {
  const b = ((index % LOOP_BARS) + LOOP_BARS) % LOOP_BARS;
  const notes: Note[] = [];
  for (let s = 0; s < 16; s++) {
    const beat = s / 4 + (s % 2 ? a.swing : 0);
    if (DRUM[s]) notes.push({ beat, beats: 0.4, freq: 70, voice: 'drum', gain: 0.12 });
    if (TAP[s]) notes.push({ beat, beats: 0.1, freq: 2400, voice: 'tap', gain: s % 4 === 2 ? 0.04 : 0.025 });
  }
  notes.push({ beat: 0, beats: 1.8, freq: degreeHz(a, BASS_DEGREES[b], -1), voice: 'bass', gain: 0.07 });
  notes.push({ beat: 2, beats: 1.8, freq: degreeHz(a, BASS_DEGREES[b], -1), voice: 'bass', gain: 0.05 });
  // The motif plays in bars 2 and 3, a fourth higher the second time round.
  if (b >= 2) for (let e = 0; e < 8; e++) {
    const d = MOTIF[(b - 2) * 8 + e];
    if (d !== null) notes.push({ beat: e / 2 + (e % 2 ? a.swing : 0), beats: 0.45, freq: degreeHz(a, d, 1), voice: 'lead', gain: a.leadGain });
  }
  return notes;
}

/** Schedules bars slightly ahead of the audio clock; safe to start, stop and duck at any time. */
export class MusicPlayer {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private arrangement: Arrangement = ARRANGEMENTS[0];
  private nextBar = 0;
  private nextTime = 0;
  private noise: AudioBuffer | null = null;
  volume = 0.6;
  playing = false;

  start(ctx: AudioContext, arena: number): void {
    this.stop();
    this.ctx = ctx;
    this.arrangement = ARRANGEMENTS[((arena % ARRANGEMENTS.length) + ARRANGEMENTS.length) % ARRANGEMENTS.length];
    this.bus = ctx.createGain();
    this.bus.gain.setValueAtTime(this.volume, ctx.currentTime);
    this.bus.connect(ctx.destination);
    this.nextBar = 0;
    this.nextTime = ctx.currentTime + 0.1;
    this.playing = true;
    this.pump();
    this.timer = setInterval(() => this.pump(), 200);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.playing = false;
    if (this.bus && this.ctx) {
      const t = this.ctx.currentTime;
      this.bus.gain.cancelScheduledValues(t);
      this.bus.gain.setValueAtTime(this.bus.gain.value, t);
      this.bus.gain.linearRampToValueAtTime(0, t + 0.3);
      const old = this.bus;
      setTimeout(() => old.disconnect(), 400);
    }
    this.bus = null;
  }

  /** Lower the music under a result announcement. */
  duck(on: boolean): void {
    if (!this.bus || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.bus.gain.cancelScheduledValues(t);
    this.bus.gain.setValueAtTime(this.bus.gain.value, t);
    this.bus.gain.linearRampToValueAtTime(this.volume * (on ? 0.35 : 1), t + 0.25);
  }

  private pump(): void {
    const ctx = this.ctx, bus = this.bus;
    if (!ctx || !bus || ctx.state !== 'running') return;
    const beat = 60 / this.arrangement.bpm;
    // Keep about a second of music scheduled ahead.
    while (this.nextTime < ctx.currentTime + 1) {
      for (const n of bar(this.arrangement, this.nextBar)) this.note(ctx, bus, n, this.nextTime + n.beat * beat, n.beats * beat);
      this.nextTime += 4 * beat;
      this.nextBar++;
    }
  }

  private note(ctx: AudioContext, bus: GainNode, n: Note, t0: number, seconds: number): void {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(n.gain, t0 + (n.voice === 'lead' ? 0.02 : 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    g.connect(bus);
    if (n.voice === 'tap') {
      const src = ctx.createBufferSource();
      src.buffer = this.noise ??= fixedNoise(ctx);
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.setValueAtTime(n.freq, t0);
      src.connect(f).connect(g);
      src.start(t0); src.stop(t0 + seconds + 0.02);
      return;
    }
    const o = ctx.createOscillator();
    o.type = n.voice === 'lead' ? this.arrangement.lead : n.voice === 'bass' ? 'triangle' : 'sine';
    o.frequency.setValueAtTime(n.freq * (n.voice === 'drum' ? 1.6 : 1), t0);
    if (n.voice === 'drum') o.frequency.exponentialRampToValueAtTime(n.freq, t0 + 0.08);
    o.connect(g);
    o.start(t0); o.stop(t0 + seconds + 0.02);
  }
}

function fixedNoise(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate / 4, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 1013904223;
  for (let i = 0; i < data.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1; }
  return buffer;
}
