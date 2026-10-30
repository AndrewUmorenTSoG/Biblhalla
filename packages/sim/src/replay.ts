// Semantic replays: seed + canonical initial state + ordered inputs + checksum.
// Imported files are untrusted, so everything is bounded before execution.

import type { SimContext } from './context.ts';
import type { InputFrames, MatchOptions, SimState } from './types.ts';
import { create, pause } from './state.ts';
import { step } from './step.ts';
import { hash, snapshot } from './fixed.ts';

export const REPLAY_SCHEMA = 1;
export const MAX_REPLAY_ENTRIES = 24000;
const REPLAY_MODES = ['duel', 'waves', 'boss', 'local', 'teams', 'ffa'];
const INPUT_KEYS = ['x', 'y', 'jump', 'jumpHeld', 'light', 'heavy', 'heavyHeld', 'dodge', 'item', 'interact'];

export type ReplayEntry = { kind: 'input'; frames: InputFrames } | { kind: 'pause'; on: boolean };
export interface Replay { schema: number; contentHash: string; initial: SimState; entries: ReplayEntry[]; finalHash: string | null }

export function newReplay(ctx: SimContext, initial: SimState): Replay {
  return { schema: REPLAY_SCHEMA, contentHash: ctx.content.hash, initial: snapshot(initial), entries: [], finalHash: null };
}

function fail(msg: string): never { throw new Error(msg); }

function checkOptions(ctx: SimContext, opts: MatchOptions): void {
  const { content, defs } = ctx;
  if (!REPLAY_MODES.includes(opts.mode || 'duel')) fail('Invalid replay mode');
  if ((opts.hero && !defs[opts.hero]) || (opts.opponent && !defs[opts.opponent]) || (opts.arena && !content.maps.maps.some(m => m.id === opts.arena))) fail('Invalid replay content');
  if (opts.fighters) {
    if (!Array.isArray(opts.fighters) || opts.fighters.length < 2 || opts.fighters.length > 4) fail('Invalid replay players');
    for (const f of opts.fighters) {
      const ok = f && content.fighters.fighters.some(d => d.id === f.hero) && typeof f.human === 'boolean'
        && Number.isInteger(f.team) && f.team! >= 0 && f.team! <= 3 && typeof f.inputId === 'string' && f.inputId.length <= 24
        && (f.stocks === undefined || (Number.isInteger(f.stocks) && f.stocks >= 1 && f.stocks <= 3));
      if (!ok) fail('Invalid replay fighter');
    }
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
  return { schema: REPLAY_SCHEMA, contentHash: raw.contentHash, initial: canonical, entries: raw.entries, finalHash: raw.finalHash };
}

export function simulateReplay(ctx: SimContext, record: unknown): { state: SimState; hash: string; verified: boolean } {
  const r = validateReplay(ctx, record);
  const s = snapshot(r.initial);
  for (const e of r.entries) {
    if (e.kind === 'pause') pause(s, e.on);
    else step(ctx, s, e.frames);
  }
  const h = hash(s);
  return { state: s, hash: h, verified: h === r.finalHash };
}
