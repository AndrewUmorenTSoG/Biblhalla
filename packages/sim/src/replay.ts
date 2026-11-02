// Semantic replays: seed + canonical initial state + ordered inputs + checksum.
// Imported files are untrusted, so everything is bounded before execution.

import type { SimContext } from './context.ts';
import type { InputFrames, MatchOptions, SimState } from './types.ts';
import { RANDOM_HERO, create, pause } from './state.ts';
import { step } from './step.ts';
import { hash, snapshot } from './fixed.ts';

export const REPLAY_SCHEMA = 1;
export const MAX_REPLAY_ENTRIES = 24000;
const REPLAY_MODES = ['duel', 'waves', 'boss', 'local', 'teams', 'ffa'];
const INPUT_KEYS = ['x', 'y', 'jump', 'jumpHeld', 'light', 'heavy', 'heavyHeld', 'dodge', 'item', 'interact', 'interactHeld', 'emote'];

export type ReplayEntry = { kind: 'input'; frames: InputFrames } | { kind: 'pause'; on: boolean };
/** A state hash taken after `entry` entries had run; lets playback find where a mismatch began. */
export interface ReplayCheckpoint { entry: number; hash: string }
export const CHECKPOINT_EVERY = 600;
export interface Replay { schema: number; contentHash: string; initial: SimState; entries: ReplayEntry[]; finalHash: string | null; checkpoints?: ReplayCheckpoint[] }

export function newReplay(ctx: SimContext, initial: SimState): Replay {
  return { schema: REPLAY_SCHEMA, contentHash: ctx.content.hash, initial: snapshot(initial), entries: [], finalHash: null };
}

function fail(msg: string): never { throw new Error(msg); }

function checkOptions(ctx: SimContext, opts: MatchOptions): void {
  const { content, defs } = ctx;
  if (!REPLAY_MODES.includes(opts.mode || 'duel')) fail('Invalid replay mode');
  const known = (h: string | undefined) => !h || h === RANDOM_HERO || !!defs[h];
  if (!known(opts.hero) || !known(opts.opponent) || (opts.arena && !content.maps.maps.some(m => m.id === opts.arena))) fail('Invalid replay content');
  if (opts.fighters) {
    if (!Array.isArray(opts.fighters) || opts.fighters.length < 2 || opts.fighters.length > 4) fail('Invalid replay players');
    for (const f of opts.fighters) {
      const ok = f && (f.hero === RANDOM_HERO || content.fighters.fighters.some(d => d.id === f.hero)) && typeof f.human === 'boolean'
        && Number.isInteger(f.team) && f.team! >= 0 && f.team! <= 3 && typeof f.inputId === 'string' && f.inputId.length <= 24
        && (f.stocks === undefined || (Number.isInteger(f.stocks) && f.stocks >= 1 && f.stocks <= 9))
        && (f.name === undefined || (typeof f.name === 'string' && f.name.length <= 40));
      if (!ok) fail('Invalid replay fighter');
    }
  }
  for (const [key, lo, hi] of [['stocks', 1, 9], ['matchMinutes', 1, 10]] as const) {
    const v = opts[key];
    if (v !== undefined && !(Number.isInteger(Number(v)) && Number(v) >= lo && Number(v) <= hi)) fail('Invalid match rules');
  }
  if (opts.waves && (!Array.isArray(opts.waves) || opts.waves.length > 4
    || opts.waves.some(w => !Array.isArray(w) || w.length > 8 || w.some(id => typeof id !== 'string' || id.length > 32)))) fail('Invalid wave list');
}

function checkEntry(entry: any): void {
  if (entry?.kind === 'pause') { if (typeof entry.on !== 'boolean') fail('Invalid replay event'); return; }
  if (entry?.kind !== 'input') fail('Invalid replay event');
  const frames = entry.frames;
  if (!frames || typeof frames !== 'object' || Array.isArray(frames) || Object.keys(frames).length > 8) fail('Invalid input frame');
  for (const [key, value] of Object.entries(frames) as [string, any][]) {
    if (key.length > 24 || !value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !INPUT_KEYS.includes(k))) fail('Invalid semantic input');
    for (const [k, v] of Object.entries(value)) {
      if (k === 'x' || k === 'y') { if (v !== -1 && v !== 0 && v !== 1) fail('Invalid axis'); }
      else if (k === 'emote') { if (!Number.isInteger(v) || (v as number) < -1 || (v as number) > 3) fail('Invalid emote'); }
      else if (typeof v !== 'boolean') fail('Invalid button');
    }
  }
}

/** Validate an untrusted replay. The initial state must equal a canonical match start. */
export function validateReplay(ctx: SimContext, raw: any): Replay & { finalHash: string } {
  if (!raw || raw.schema !== REPLAY_SCHEMA || raw.contentHash !== (ctx.content.hash || 'development') || !Array.isArray(raw.entries) || raw.entries.length > MAX_REPLAY_ENTRIES) {
    fail('Unsupported replay or content version');
  }
  const opts = raw.initial?.options;
  if (!opts || typeof opts !== 'object') fail('Invalid replay mode');
  checkOptions(ctx, opts);
  const canonical = create(ctx, opts);
  if (hash(raw.initial) !== hash(canonical)) fail('Replay initial state is not a canonical match start');
  for (const entry of raw.entries) checkEntry(entry);
  if (typeof raw.finalHash !== 'string' || !/^[a-f0-9]{8}$/.test(raw.finalHash)) fail('Invalid checksum');
  const checkpoints = raw.checkpoints ?? [];
  if (!Array.isArray(checkpoints) || checkpoints.length > MAX_REPLAY_ENTRIES / CHECKPOINT_EVERY + 1
    || checkpoints.some((c: any) => !c || !Number.isInteger(c.entry) || c.entry < 1 || c.entry > raw.entries.length || typeof c.hash !== 'string' || !/^[a-f0-9]{8}$/.test(c.hash))) fail('Invalid replay checkpoints');
  return { schema: REPLAY_SCHEMA, contentHash: raw.contentHash, initial: canonical, entries: raw.entries, finalHash: raw.finalHash, checkpoints };
}

export function simulateReplay(ctx: SimContext, record: unknown): { state: SimState; hash: string; verified: boolean; firstMismatch: number | null } {
  const r = validateReplay(ctx, record);
  const s = snapshot(r.initial);
  const marks = new Map((r.checkpoints ?? []).map(c => [c.entry, c.hash]));
  let firstMismatch: number | null = null;
  r.entries.forEach((e, i) => {
    if (e.kind === 'pause') pause(s, e.on);
    else step(ctx, s, e.frames);
    const want = marks.get(i + 1);
    if (want !== undefined && firstMismatch === null && hash(s) !== want) firstMismatch = i + 1;
  });
  const h = hash(s);
  return { state: s, hash: h, verified: h === r.finalHash && firstMismatch === null, firstMismatch };
}

/** Record a periodic checkpoint after the entry just added (call once per entry). */
export function maybeCheckpoint(replay: Replay, s: SimState): void {
  if (replay.entries.length % CHECKPOINT_EVERY === 0) (replay.checkpoints ??= []).push({ entry: replay.entries.length, hash: hash(s) });
}
